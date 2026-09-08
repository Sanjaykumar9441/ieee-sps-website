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

const redis = Redis.fromEnv();

async function acquireAttemptLock(
  assessmentId,
  studentId,
  sessionId,
  durationSeconds,
) {
  const key = `assessment:lock:${assessmentId}:${studentId}`;
  const result = await redis.set(key, sessionId, {
    nx: true,
    ex: Math.max(1, Number(durationSeconds) || 1),
  });
  return result === "OK";
}

async function verifyAttemptSession(assessmentId, studentId, sessionId) {
  if (!sessionId) return false;
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
  if (!storedSessionId || String(storedSessionId) !== String(sessionId))
    return false;
  await redis.expire(key, Math.max(1, Number(durationSeconds) || 1));
  return true;
}

async function releaseAttemptLock(assessmentId, studentId) {
  await redis.del(`assessment:lock:${assessmentId}:${studentId}`);
}

async function setAttemptStartTime(attemptId, durationSeconds) {
  const key = `assessment:started_at:${attemptId}`;
  const now = Math.floor(Date.now() / 1000);
  await redis.set(key, now, { ex: Number(durationSeconds) + 60 });
  return now;
}

async function getSecondsRemaining(attemptId, durationSeconds) {
  const startedAt = await redis.get(`assessment:started_at:${attemptId}`);
  if (startedAt === null || startedAt === undefined) return 0;
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

async function incrementInfractionCount(attemptId) {
  const key = `assessment:infractions:${attemptId}`;
  const count = await redis.incr(key);
  await redis.expire(key, 60 * 60 * 6);
  return count;
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
  saveCurrentQuestion,
  getCurrentQuestion,
};
