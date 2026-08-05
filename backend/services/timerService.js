const { getSecondsRemaining } = require("../lib/redis");

const assessmentService = require("./assessmentService");

exports.getRemainingTime = async (attempt) => {
  const { data: assessment } = await assessmentService.getAssessment(
    attempt.assessment_id,
  );

  return await getSecondsRemaining(attempt.id, assessment.duration_seconds);
};
