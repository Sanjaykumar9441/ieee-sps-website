const {
  acquireAttemptLock,
  releaseAttemptLock,
} = require("../lib/redis");

/**
 * Lock one assessment attempt for one student.
 * Uses student_id instead of email.
 */

exports.lockStudent = async (
  assessmentId,
  studentId,
  durationSeconds
) => {
  return await acquireAttemptLock(
    assessmentId,
    studentId,
    durationSeconds
  );
};

/**
 * Release the student's assessment lock.
 */

exports.unlockStudent = async (
  assessmentId,
  studentId
) => {
  return await releaseAttemptLock(
    assessmentId,
    studentId
  );
};