/**
 * Upstash Redis client (REST-based — works fine over Render's Node runtime,
 * no persistent TCP connection needed, works even after a cold start).
 *
 * Required env vars:
 *   UPSTASH_REDIS_REST_URL
 *   UPSTASH_REDIS_REST_TOKEN
 */

const { Redis } = require("@upstash/redis");

if (
  !process.env.UPSTASH_REDIS_REST_URL ||
  !process.env.UPSTASH_REDIS_REST_TOKEN
) {
  throw new Error(
    "Missing UPSTASH_REDIS_REST_URL or UPSTASH_REDIS_REST_TOKEN environment variables. " +
      "Set them in Render → your service → Environment.",
  );
}

const redis = Redis.fromEnv(); // reads the two vars above automatically

// ---- Quiz-specific helpers -------------------------------------------------

/**
 * Acquires a one-session-per-student lock for the duration of the quiz.
 * Returns true if the lock was acquired (i.e. no other active session),
 * false if the student already has an active session elsewhere.
 */
async function acquireAttemptLock(
  assessmentId,
  studentId,
  sessionId,
  durationSeconds,
) {
  const key = `assessment:lock:${assessmentId}:${studentId}`;

  const result = await redis.set(key, sessionId, {
    nx: true,
    ex: durationSeconds,
  });

  return result === "OK";
}

async function verifyAttemptSession(assessmentId, studentId, sessionId) {
  if (!sessionId) {
    return false;
  }

  const key = `assessment:lock:${assessmentId}:${studentId}`;

  const storedSessionId = await redis.get(key);

  return String(storedSessionId) === String(sessionId);
}

async function refreshAttemptLock(
  assessmentId,
  studentId,
  sessionId,
  durationSeconds,
) {
  const key = `assessment:lock:${assessmentId}:${studentId}`;

  const storedSessionId = await redis.get(key);

  if (!storedSessionId || String(storedSessionId) !== String(sessionId)) {
    return false;
  }

  await redis.expire(key, durationSeconds);

  return true;
}

async function releaseAttemptLock(assessmentId, studentId) {
  const key = `assessment:lock:${assessmentId}:${studentId}`;
  await redis.del(key);
}

/** Stores the authoritative attempt start time (seconds since epoch). */
async function setAttemptStartTime(attemptId, durationSeconds) {
  const key = `assessment:started_at:${attemptId}`;
  const now = Math.floor(Date.now() / 1000);
  await redis.set(key, now, { ex: durationSeconds + 60 }); // small buffer past the deadline
  return now;
}

/**
 * Returns seconds remaining for an attempt.
 *
 * durationSeconds is the authoritative duration calculated
 * for this specific attempt:
 *
 * min(
 *   assessment.duration_minutes * 60,
 *   assessment.end_time - attempt.started_at
 * )
 *
 * Returns 0 if the attempt timer does not exist or has expired.
 */
async function getSecondsRemaining(attemptId, durationSeconds) {
  const key = `assessment:started_at:${attemptId}`;

  const startedAt = await redis.get(key);

  // No timer = expired / unavailable.
  if (startedAt === null || startedAt === undefined) {
    return 0;
  }

  const elapsed = Math.floor(Date.now() / 1000) - Number(startedAt);

  return Math.max(0, Number(durationSeconds) - elapsed);
}

async function saveCurrentQuestion(attemptId, questionNumber) {
  await redis.set(`assessment:current:${attemptId}`, questionNumber, {
    ex: 60 * 60 * 6,
  });
}

async function getCurrentQuestion(attemptId) {
  const value = await redis.get(`assessment:current:${attemptId}`);

  return value ? Number(value) : 1;
}

/** Increments and returns the infraction count for an attempt. */
async function incrementInfractionCount(attemptId) {
  const key = `assessment:infractions:${attemptId}`;
  const count = await redis.incr(key);
  await redis.expire(key, 60 * 60 * 6); // 6-hour safety TTL
  return count;
}

// ---- Login OTP helpers ------------------------------------------------------

const OTP_TTL_SECONDS = 5 * 60; // 5 minutes
const OTP_MAX_ATTEMPTS = 5;

/** Generates and stores a 6-digit OTP for a quiz login, returns the code. */
async function createLoginOtp(assessmentId, email) {
  const crypto = require("crypto");

  const code = crypto.randomInt(100000, 1000000).toString();
  await redis.set(`assessment:otp:${assessmentId}:${email}`, code, {
    ex: OTP_TTL_SECONDS,
  });
  await redis.set(`assessment:otp-attempts:${assessmentId}:${email}`, 0, {
    ex: OTP_TTL_SECONDS,
  });
  return code;
}

/**
 * Verifies a submitted OTP. Returns { valid: true } or
 * { valid: false, reason: 'expired' | 'incorrect' | 'too_many_attempts' }.
 */
async function verifyLoginOtp(assessmentId, email, submittedCode) {
  const attemptsKey = `assessment:otp-attempts:${assessmentId}:${email}`;
  const codeKey = `assessment:otp:${assessmentId}:${email}`;

  const attempts = await redis.incr(attemptsKey);
  if (attempts > OTP_MAX_ATTEMPTS) {
    return { valid: false, reason: "too_many_attempts" };
  }

  const storedCode = await redis.get(codeKey);
  if (!storedCode) {
    return { valid: false, reason: "expired" };
  }

  if (String(storedCode) !== String(submittedCode)) {
    return { valid: false, reason: "incorrect" };
  }

  await redis.del(codeKey);
  await redis.del(attemptsKey);
  return { valid: true };
}

/** Simple per-email cooldown so "resend OTP" can't be spammed. */
async function canRequestOtp(assessmentId, email) {
  const key = `assessment:otp-cooldown:${assessmentId}:${email}`;
  const exists = await redis.get(key);
  if (exists) return false;
  await redis.set(key, "1", { ex: 30 }); // 30-second cooldown between sends
  return true;
}

module.exports = {
  redis,

  acquireAttemptLock,
  releaseAttemptLock,
  verifyAttemptSession,
  refreshAttemptLock,

  setAttemptStartTime,
  getSecondsRemaining,
  incrementInfractionCount,

  createLoginOtp,
  verifyLoginOtp,
  canRequestOtp,

  saveCurrentQuestion,
  getCurrentQuestion,
};
