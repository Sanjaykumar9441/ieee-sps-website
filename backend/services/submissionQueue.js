const crypto = require("crypto");
const { redis } = require("../lib/redis");
const { supabase } = require("../lib/supabase");
const scoring = require("./scoringService");
const engine = require("./assessmentEngine");
const session = require("./studentSessionService");
const liveEvents = require("./liveEvents");

const QUEUE_KEY = "assessment:submission:queue:v1";
const INFLIGHT_KEY = "assessment:submission:inflight:v2";
const FAILED_KEY = "assessment:submission:failed:v2";
const JOB_PREFIX = "assessment:submission:job:v2:";
const WORKER_LOCK_KEY = "assessment:submission:worker-lock:v2";
const WORKER_HEARTBEAT_KEY = "assessment:submission:worker-heartbeat:v2";

const BATCH_SIZE = Math.max(
  1,
  Number(process.env.SUBMISSION_QUEUE_BATCH_SIZE || 5),
);
const POLL_INTERVAL_MS = Math.max(
  250,
  Number(process.env.SUBMISSION_QUEUE_POLL_MS || 1000),
);
const RETRY_DELAY_MS = Math.max(
  1000,
  Number(process.env.SUBMISSION_QUEUE_RETRY_MS || 3000),
);
const MAX_RETRIES = Math.max(
  1,
  Number(process.env.SUBMISSION_QUEUE_MAX_RETRIES || 5),
);
const JOB_TTL_SECONDS = Math.max(
  3600,
  Number(process.env.SUBMISSION_QUEUE_JOB_TTL_SECONDS || 86400),
);
const WORKER_LOCK_TTL_SECONDS = 15;

let workerTimer = null;
let processing = false;
let workerId = null;

function jobKey(attemptId) {
  return `${JOB_PREFIX}${String(attemptId)}`;
}

function normalizeJob(job) {
  return {
    jobId: String(job.jobId || crypto.randomUUID()),
    attemptId: String(job.attemptId),
    reason: String(job.reason || "STUDENT_SUBMIT"),
    answers: Array.isArray(job.answers) ? job.answers : [],
    queuedAt: job.queuedAt || new Date().toISOString(),
    retryCount: Number(job.retryCount || 0),
  };
}

async function writeJobState(job, state, extra = {}) {
  const key = jobKey(job.attemptId);
  const payload = {
    jobId: job.jobId,
    attemptId: job.attemptId,
    state,
    reason: job.reason,
    queuedAt: job.queuedAt,
    retryCount: Number(job.retryCount || 0),
    updatedAt: new Date().toISOString(),
    ...extra,
  };
  await redis.set(key, JSON.stringify(payload), { ex: JOB_TTL_SECONDS });
  return payload;
}

async function enqueueSubmission(job) {
  const normalized = normalizeJob(job);
  const key = jobKey(normalized.attemptId);

  // Idempotency: browser retries, anti-cheat and timer expiry can all race.
  // Only the first enqueue for an attempt is allowed onto the queue.
  const existing = await redis.get(key);
  if (existing) {
    try {
      return { ...JSON.parse(existing), duplicate: true };
    } catch {
      // A malformed state should never block a real submission forever.
      await redis.del(key);
    }
  }

  const initialState = await writeJobState(normalized, "QUEUED");

  try {
    await redis.rpush(QUEUE_KEY, JSON.stringify(normalized));
    return { ...initialState, duplicate: false };
  } catch (error) {
    await redis.del(key).catch(() => {});
    throw error;
  }
}

async function claimBatch() {
  const jobs = [];

  // LMOVE gives us an acknowledgement point: a claimed job remains in
  // INFLIGHT until the worker explicitly removes it. A crash therefore does
  // not silently lose a submission.
  for (let i = 0; i < BATCH_SIZE; i += 1) {
    const raw = await redis.move(QUEUE_KEY, INFLIGHT_KEY, "right", "left");
    if (!raw) break;

    try {
      jobs.push({ raw, job: JSON.parse(raw) });
    } catch (error) {
      console.error(
        "[SUBMISSION QUEUE] Invalid job moved to failed list:",
        error.message,
      );
      await redis.lrem(INFLIGHT_KEY, 1, raw);
      await redis.rpush(FAILED_KEY, raw);
    }
  }

  return jobs;
}

async function acknowledge(raw) {
  await redis.lrem(INFLIGHT_KEY, 1, raw);
}

async function recoverInflightJobs() {
  const rawJobs = await redis.lrange(INFLIGHT_KEY, 0, -1);
  if (!rawJobs || !rawJobs.length) return 0;

  // The worker is single-owner through WORKER_LOCK_KEY, so this recovery pass
  // is safe on a normal Render restart. Jobs that were being processed when
  // the process died are put back into the ready queue.
  await redis.del(INFLIGHT_KEY);
  for (const raw of rawJobs) {
    try {
      const job = normalizeJob(JSON.parse(raw));
      job.retryCount += 1;
      if (job.retryCount > MAX_RETRIES) {
        await redis.rpush(FAILED_KEY, JSON.stringify(job));
        await writeJobState(job, "FAILED", {
          error: "Maximum retries exceeded during recovery.",
        });
      } else {
        await redis.rpush(QUEUE_KEY, JSON.stringify(job));
        await writeJobState(job, "QUEUED", { recovered: true });
      }
    } catch (error) {
      console.error(
        "[SUBMISSION QUEUE] Failed to recover inflight job:",
        error.message,
      );
    }
  }

  return rawJobs.length;
}

function getActivityType(reason) {
  if (reason === "SECURITY_AUTO_SUBMIT") return "SECURITY_AUTO_SUBMIT";
  if (reason === "AUTO_SUBMIT") return "AUTO_SUBMIT";
  return "SUBMIT";
}

async function persistAnswers(attemptId, submittedAnswers) {
  const { data: attemptQuestions, error } = await supabase
    .from("assessment_attempt_questions")
    .select("id")
    .eq("attempt_id", attemptId);

  if (error) throw error;

  const validIds = new Set(
    (attemptQuestions || []).map((row) => String(row.id)),
  );
  const latest = new Map();

  for (const row of submittedAnswers) {
    const id = row?.attemptQuestionId || row?.attempt_question_id || row?.id;
    if (!id || !validIds.has(String(id))) continue;

    const selected = Array.isArray(row.selectedAnswers)
      ? row.selectedAnswers
      : Array.isArray(row.selected_answers)
        ? row.selected_answers
        : [];

    latest.set(String(id), {
      attempt_question_id: id,
      selected_answers: selected,
      answered_at: new Date().toISOString(),
    });
  }

  const rows = [...latest.values()];
  if (!rows.length) return 0;

  const { error: upsertError } = await supabase
    .from("assessment_answers")
    .upsert(rows, { onConflict: "attempt_question_id" });

  if (upsertError) throw upsertError;
  return rows.length;
}

async function emitCompletionUpdates(attempt) {
  liveEvents.emitSubmitted(attempt.assessment_id, attempt);
  liveEvents.emitStudentSubmitted(attempt.assessment_id);
  liveEvents.emitDashboardRefresh(attempt.assessment_id);
  liveEvents.emitLeaderboard(attempt.assessment_id, []);
}

async function processSubmission(job) {
  const normalized = normalizeJob(job);
  const attempt = await engine.getAttempt(normalized.attemptId);

  if (!attempt) throw new Error(`Attempt ${normalized.attemptId} not found.`);
  if (attempt.status === "SUBMITTED" || attempt.status === "EXPIRED")
    return attempt;

  const { data: assessment } = await supabase
    .from("assessments")
    .select("id, end_time")
    .eq("id", attempt.assessment_id)
    .single();

  if (!assessment) throw new Error("Assessment not found for submission.");

  const deadlines = [attempt.expires_at, assessment.end_time]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);
  const expired = deadlines.length > 0 && Date.now() >= Math.min(...deadlines);
  const reason = expired ? "AUTO_SUBMIT" : normalized.reason;

  const savedAnswers = await persistAnswers(
    normalized.attemptId,
    normalized.answers,
  );
  const result = await scoring.calculateScoreFromAnswers(
    normalized.attemptId,
    normalized.answers,
  );

  const updatedAttempt = await engine.finishAttempt(
    normalized.attemptId,
    result,
    "SUBMITTED",
  );

  await supabase.from("assessment_activity").insert({
    attempt_id: normalized.attemptId,
    activity_type: getActivityType(reason),
    metadata: {
      source: "submission_queue",
      reason,
      queuedAt: normalized.queuedAt,
      savedAnswers,
    },
  });

  await session.unlockStudent(
    updatedAttempt.assessment_id,
    updatedAttempt.team_id || updatedAttempt.student_id,
  );

  await emitCompletionUpdates(updatedAttempt);
  return updatedAttempt;
}

async function processOne(item) {
  const { raw, job } = item;
  const normalized = normalizeJob(job);
  normalized.retryCount = Number(normalized.retryCount || 0);

  await writeJobState(normalized, "PROCESSING", {
    startedAt: new Date().toISOString(),
  });

  try {
    const result = await processSubmission(normalized);
    await writeJobState(normalized, "COMPLETED", {
      completedAt: new Date().toISOString(),
      result: result
        ? {
            score: result.score,
            percentage: result.percentage,
            status: result.status,
          }
        : null,
    });
    await acknowledge(raw);
    return result;
  } catch (error) {
    normalized.retryCount += 1;
    await acknowledge(raw);

    if (normalized.retryCount > MAX_RETRIES) {
      await redis.rpush(FAILED_KEY, JSON.stringify(normalized));
      await writeJobState(normalized, "FAILED", {
        failedAt: new Date().toISOString(),
        error: error.message,
      });
      throw error;
    }

    await writeJobState(normalized, "QUEUED", {
      retryAt: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
      lastError: error.message,
    });

    // Keep the worker bounded. The delay is per failed job, not a global
    // sleep, so unrelated submissions continue to drain.
    setTimeout(() => {
      void redis
        .rpush(QUEUE_KEY, JSON.stringify(normalized))
        .catch((requeueError) => {
          console.error(
            "[SUBMISSION QUEUE] Requeue failed:",
            requeueError.message,
          );
        });
    }, RETRY_DELAY_MS);

    throw error;
  }
}

async function processBatch(items) {
  const results = await Promise.allSettled(items.map(processOne));
  results.forEach((result, index) => {
    if (result.status === "rejected") {
      console.error(
        "[SUBMISSION QUEUE] Job failed:",
        items[index]?.job?.attemptId,
        result.reason?.message || result.reason,
      );
    }
  });
}

async function refreshWorkerHeartbeat() {
  if (!workerId) return;
  await redis.set(
    WORKER_HEARTBEAT_KEY,
    JSON.stringify({ workerId, at: new Date().toISOString() }),
    { ex: WORKER_LOCK_TTL_SECONDS + 5 },
  );
}

async function hasWorkerLock() {
  if (!workerId) workerId = crypto.randomUUID();
  const existing = await redis.get(WORKER_LOCK_KEY);

  if (!existing) {
    const acquired = await redis.set(WORKER_LOCK_KEY, workerId, {
      nx: true,
      ex: WORKER_LOCK_TTL_SECONDS,
    });
    if (acquired === "OK") {
      await refreshWorkerHeartbeat();
      return true;
    }
    return false;
  }

  if (String(existing) !== String(workerId)) return false;

  await redis.expire(WORKER_LOCK_KEY, WORKER_LOCK_TTL_SECONDS);
  await refreshWorkerHeartbeat();
  return true;
}

async function workerTick() {
  if (processing) return;
  processing = true;

  try {
    if (!(await hasWorkerLock())) return;
    const claimed = await claimBatch();
    if (claimed.length) await processBatch(claimed);
  } catch (error) {
    console.error("[SUBMISSION QUEUE] Worker error:", error.message);
  } finally {
    processing = false;
  }
}

async function startSubmissionWorker() {
  if (workerTimer) return;
  workerId = crypto.randomUUID();

  try {
    if (await hasWorkerLock()) {
      const recovered = await recoverInflightJobs();
      if (recovered)
        console.log(
          `[SUBMISSION QUEUE] Recovered ${recovered} inflight job(s).`,
        );
    }
  } catch (error) {
    console.error("[SUBMISSION QUEUE] Startup recovery failed:", error.message);
  }

  console.log(
    `[SUBMISSION QUEUE] Worker started (batch=${BATCH_SIZE}, poll=${POLL_INTERVAL_MS}ms, retries=${MAX_RETRIES}).`,
  );
  workerTimer = setInterval(() => void workerTick(), POLL_INTERVAL_MS);
  void workerTick();
}

async function getSubmissionStatus(attemptId) {
  const raw = await redis.get(jobKey(attemptId));
  if (!raw) return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

async function getQueueStats() {
  const [ready, inflight, failed, heartbeat] = await Promise.all([
    redis.llen(QUEUE_KEY),
    redis.llen(INFLIGHT_KEY),
    redis.llen(FAILED_KEY),
    redis.get(WORKER_HEARTBEAT_KEY),
  ]);

  let worker = null;
  if (heartbeat) {
    try {
      worker = JSON.parse(heartbeat);
    } catch {
      worker = { workerId: String(heartbeat) };
    }
  }

  return {
    ready: Number(ready || 0),
    inflight: Number(inflight || 0),
    failed: Number(failed || 0),
    batchSize: BATCH_SIZE,
    pollIntervalMs: POLL_INTERVAL_MS,
    maxRetries: MAX_RETRIES,
    worker,
  };
}

module.exports = {
  QUEUE_KEY,
  INFLIGHT_KEY,
  FAILED_KEY,
  enqueueSubmission,
  startSubmissionWorker,
  processSubmission,
  getSubmissionStatus,
  getQueueStats,
};
