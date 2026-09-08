const session = require("../services/studentSessionService");
const engine = require("../services/assessmentEngine");

function getRemainingSeconds(attempt, assessment) {
  const deadlines = [attempt.expires_at, assessment?.end_time]
    .filter(Boolean)
    .map((value) => new Date(value).getTime())
    .filter(Number.isFinite);

  if (!deadlines.length) return 0;
  return Math.max(1, Math.floor((Math.min(...deadlines) - Date.now()) / 1000));
}

module.exports = async (req, res, next) => {
  try {
    const { attemptId } = req.params;
    const sessionId = req.headers["x-assessment-session"];

    if (!attemptId) {
      return res
        .status(400)
        .json({
          success: false,
          code: "ATTEMPT_ID_REQUIRED",
          message: "Attempt ID is required.",
        });
    }
    if (!sessionId) {
      return res
        .status(401)
        .json({
          success: false,
          code: "SESSION_REQUIRED",
          message: "Assessment session is required.",
        });
    }

    const attempt = await engine.getAttempt(attemptId);
    if (!attempt) {
      return res
        .status(404)
        .json({
          success: false,
          code: "ATTEMPT_NOT_FOUND",
          message: "Assessment attempt not found.",
        });
    }

    if (String(attempt.student_id) !== String(req.student.id)) {
      return res
        .status(403)
        .json({
          success: false,
          code: "SESSION_FORBIDDEN",
          message: "This assessment attempt does not belong to you.",
        });
    }

    // Individual attempts use student_id; team attempts use team_id.
    const lockOwnerId = attempt.team_id || attempt.student_id;
    const valid = await session.verifySession(
      attempt.assessment_id,
      lockOwnerId,
      sessionId,
    );

    if (!valid) {
      const { supabase } = require("../lib/supabase");
      const { data: assessment } = await supabase
        .from("assessments")
        .select("end_time")
        .eq("id", attempt.assessment_id)
        .maybeSingle();

      // The queue releases the Redis lock after a successful submission.
      // Do not turn that normal state into an "another session" error.
      const routePath = String(req.route?.path || "");
      const isStatusOrSubmit =
        routePath.endsWith("/status") || routePath.endsWith("/submit");

      if (attempt.status === "SUBMITTED" && isStatusOrSubmit) {
        req.assessmentSessionId = sessionId;
        req.assessmentAttempt = attempt;
        return next();
      }

      // Redis can expire/restart while the DB attempt is still IN_PROGRESS.
      // Re-acquire only if the key is absent. If another browser owns it,
      // recoverSession returns false and the active-session protection remains.
      const recovered = await session.recoverSession(
        attempt.assessment_id,
        lockOwnerId,
        sessionId,
        getRemainingSeconds(attempt, assessment),
      );

      if (!recovered) {
        const deadlines = [attempt.expires_at, assessment?.end_time]
          .filter(Boolean)
          .map((value) => new Date(value).getTime())
          .filter(Number.isFinite);
        const expired =
          deadlines.length > 0 && Date.now() >= Math.min(...deadlines);
        const canFinalizeExpired = expired && isStatusOrSubmit;

        if (!canFinalizeExpired) {
          return res.status(409).json({
            success: false,
            code: "SESSION_NOT_OWNER",
            message: "This assessment is active in another session.",
          });
        }
      }
    }

    req.assessmentSessionId = sessionId;
    req.assessmentAttempt = attempt;
    return next();
  } catch (err) {
    console.error("VERIFY ASSESSMENT SESSION ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
