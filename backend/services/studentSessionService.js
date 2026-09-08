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
  return await releaseAttemptLock(assessmentId, studentId);
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

/* ============================================================
   UNLOCK STUDENT / STALE SESSION CLEANUP
============================================================ */

exports.unlockStudent = async (assessmentId, studentId) => {
  await releaseAttemptLock(assessmentId, studentId);
  return true;
};

/*
 * Clear a Redis session lock only when the caller has already established
 * that there is no IN_PROGRESS database attempt. This is used to recover
 * from a server crash or an abandoned pre-attempt lock without weakening
 * the one-active-session protection while a real attempt exists.
 */
exports.clearStaleSession = async (assessmentId, studentId) => {
  const key = `assessment:lock:${assessmentId}:${studentId}`;
  const existing = await redis.get(key);
  if (existing === null || existing === undefined) return false;

  await redis.del(key);
  return true;
};

/* ============================================================
   CHECK SESSION
============================================================ */

exports.hasActiveSession = async (assessmentId, studentId) => {
  const key = `assessment:lock:${assessmentId}:${studentId}`;

  const value = await redis.get(key);

  return value !== null;
};

/* ============================================================
   EXTEND SESSION
============================================================ */

exports.extendSession = async (assessmentId, studentId, durationSeconds) => {
  const key = `assessment:lock:${assessmentId}:${studentId}`;

  const exists = await redis.get(key);

  if (!exists) {
    return false;
  }

  await redis.expire(key, durationSeconds);

  return true;
};
