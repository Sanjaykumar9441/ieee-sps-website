const session = require("../services/studentSessionService");
const engine = require("../services/assessmentEngine");

module.exports = async (req, res, next) => {
  try {
    const { attemptId } = req.params;

    const sessionId = req.headers["x-assessment-session"];

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        code: "ATTEMPT_ID_REQUIRED",
        message: "Attempt ID is required.",
      });
    }

    if (!sessionId) {
      return res.status(401).json({
        success: false,
        code: "SESSION_REQUIRED",
        message: "Assessment session is required.",
      });
    }

    const attempt = await engine.getAttempt(attemptId);

    if (!attempt) {
      return res.status(404).json({
        success: false,
        code: "ATTEMPT_NOT_FOUND",
        message: "Assessment attempt not found.",
      });
    }

    /*
     * Make sure this attempt belongs
     * to the authenticated student.
     */
    if (String(attempt.student_id) !== String(req.student.id)) {
      return res.status(403).json({
        success: false,
        code: "SESSION_FORBIDDEN",
        message: "This assessment attempt does not belong to you.",
      });
    }

    /*
     * Check whether this browser/session
     * still owns the Redis session lock.
     */

    const valid = await session.verifySession(
      attempt.assessment_id,
      attempt.student_id,
      sessionId,
    );

    if (!valid) {
      return res.status(409).json({
        success: false,
        code: "SESSION_NOT_OWNER",
        message: "This assessment is active in another session.",
      });
    }

    req.assessmentSessionId = sessionId;

    req.assessmentAttempt = attempt;

    next();
  } catch (err) {
    console.error("VERIFY ASSESSMENT SESSION ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
