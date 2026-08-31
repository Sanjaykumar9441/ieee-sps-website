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
      // Redis can expire at the same moment as the exam timer. Allow only
      // status/submit to finalize an already-expired attempt.
      const { supabase } = require("../lib/supabase");
      const { data: assessment } = await supabase
        .from("assessments")
        .select("end_time")
        .eq("id", attempt.assessment_id)
        .maybeSingle();
      const deadlines = [attempt.expires_at, assessment?.end_time]
        .filter(Boolean)
        .map((value) => new Date(value).getTime())
        .filter(Number.isFinite);
      const expired = deadlines.length > 0 && Date.now() >= Math.min(...deadlines);
      const routePath = String(req.route?.path || "");
      const canFinalizeExpired = expired && (routePath.endsWith("/status") || routePath.endsWith("/submit"));
      if (!canFinalizeExpired) {
        return res.status(409).json({
          success: false,
          code: "SESSION_NOT_OWNER",
          message: "This assessment is active in another session.",
        });
      }
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
