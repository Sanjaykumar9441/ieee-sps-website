const {
  acquireAttemptLock,
  releaseAttemptLock,
  verifyAttemptSession,
  refreshAttemptLock,
  redis,
} = require("../lib/redis");

exports.lockStudent = async (
  assessmentId,
  studentId,
  sessionId,
  durationSeconds,
) => {
  return await acquireAttemptLock(
    assessmentId,
    studentId,
    sessionId,
    durationSeconds,
  );
};

exports.unlockStudent = async (assessmentId, studentId) => {
  await releaseAttemptLock(assessmentId, studentId);
  return true;
};

exports.verifySession = async (assessmentId, studentId, sessionId) => {
  return await verifyAttemptSession(assessmentId, studentId, sessionId);
};

exports.refreshSession = async (
  assessmentId,
  studentId,
  sessionId,
  durationSeconds,
) => {
  return await refreshAttemptLock(
    assessmentId,
    studentId,
    sessionId,
    durationSeconds,
  );
};

/*
 * Recover a session only when the Redis lock is currently absent.
 * If another browser owns the lock, this returns false and does not replace it.
 * This handles Redis expiry/cold-start recovery without allowing two active
 * sessions for the same attempt.
 */
exports.recoverSession = async (
  assessmentId,
  studentId,
  sessionId,
  durationSeconds,
) => {
  const key = `assessment:lock:${assessmentId}:${studentId}`;
  const existing = await redis.get(key);

  if (existing !== null && existing !== undefined) {
    return String(existing) === String(sessionId);
  }

  const result = await redis.set(key, sessionId, {
    nx: true,
    ex: Math.max(1, Number(durationSeconds) || 1),
  });

  return result === "OK";
};

exports.clearStaleSession = async (assessmentId, studentId) => {
  const key = `assessment:lock:${assessmentId}:${studentId}`;
  const existing = await redis.get(key);
  if (existing === null || existing === undefined) return false;

  await redis.del(key);
  return true;
};

exports.hasActiveSession = async (assessmentId, studentId) => {
  const key = `assessment:lock:${assessmentId}:${studentId}`;
  const value = await redis.get(key);
  return value !== null;
};

exports.extendSession = async (assessmentId, studentId, durationSeconds) => {
  const key = `assessment:lock:${assessmentId}:${studentId}`;
  const exists = await redis.get(key);

  if (!exists) return false;

  await redis.expire(key, durationSeconds);
  return true;
};
