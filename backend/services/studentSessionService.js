const {
  acquireAttemptLock,
  releaseAttemptLock,
  redis,
} = require("../lib/redis");

/* ============================================================
   LOCK STUDENT
============================================================ */

exports.lockStudent = async (assessmentId, studentId, durationSeconds) => {
  const locked = await acquireAttemptLock(
    assessmentId,
    studentId,
    durationSeconds,
  );

  if (!locked) {
    throw new Error("Student already has an active assessment session.");
  }

  return true;
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
