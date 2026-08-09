const { getSecondsRemaining } = require("../lib/redis");

const assessmentService = require("./assessmentService");

exports.getRemainingTime = async (attempt) => {
  const { data: assessment } = await assessmentService.getAssessment(
    attempt.assessment_id,
  );

  if (!assessment) {
    throw new Error("Assessment not found.");
  }

  const configuredDurationSeconds = Number(assessment.duration_minutes) * 60;

  const startedAt = new Date(attempt.started_at);
  const endTime = new Date(assessment.end_time);

  const secondsAvailableFromStart = Math.floor(
    (endTime.getTime() - startedAt.getTime()) / 1000,
  );

  const allowedDurationSeconds = Math.max(
    0,
    Math.min(configuredDurationSeconds, secondsAvailableFromStart),
  );

  return await getSecondsRemaining(attempt.id, allowedDurationSeconds);
};
