const {
  acquireAttemptLock,
  releaseAttemptLock,
  verifyAttemptSession,
  refreshAttemptLock,
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

exports.unlockStudent = async (
  assessmentId,
  studentId,
) => {
  return await releaseAttemptLock(
    assessmentId,
    studentId,
  );
};

exports.verifySession = async (
  assessmentId,
  studentId,
  sessionId,
) => {
  return await verifyAttemptSession(
    assessmentId,
    studentId,
    sessionId,
  );
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
   UNLOCK STUDENT
============================================================ */

exports.unlockStudent = async (assessmentId, studentId) => {
  await releaseAttemptLock(assessmentId, studentId);

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
