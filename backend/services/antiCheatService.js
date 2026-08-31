const { supabase } = require("../lib/supabase");
const session = require("./studentSessionService");
const scoring = require("./scoringService");
const engine = require("./assessmentEngine");
const liveEvents = require("./liveEvents");

const MAX_INFRACTIONS = 5;

async function autoSubmitAttempt(attempt, reason = "ANTI_CHEAT_AUTO_SUBMIT") {
  if (!attempt || attempt.status === "SUBMITTED") {
    return { success: true, alreadyFinished: true, status: "SUBMITTED" };
  }

  const result = await scoring.calculateScore(attempt.id);
  const updatedAttempt = await engine.finishAttempt(
    attempt.id,
    result,
    "SUBMITTED",
  );

  await supabase.from("assessment_activity").insert({
    attempt_id: attempt.id,
    activity_type: "AUTO_SUBMIT",
    metadata: { source: "anti_cheat", reason },
  });

  await session.unlockStudent(
    updatedAttempt.assessment_id,
    updatedAttempt.student_id,
  );

  liveEvents.emitForceSubmitted(updatedAttempt.assessment_id, updatedAttempt);
  liveEvents.emitStudentSubmitted(updatedAttempt.assessment_id);
  liveEvents.emitDashboardRefresh(updatedAttempt.assessment_id);

  return {
    success: true,
    autoSubmitted: true,
    status: "SUBMITTED",
    score: result.score,
  };
}

exports.reportInfraction = async (attemptId, type, metadata = {}) => {
  const attempt = await engine.getAttempt(attemptId);

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  // Completed attempts cannot generate new infractions.
  if (attempt.status === "SUBMITTED") {
    return { ignored: true, status: "SUBMITTED" };
  }

  const { data: infraction, error } = await supabase
    .from("assessment_infractions")
    .insert({
      attempt_id: attempt.id,
      type,
      details: metadata ?? null,
      occurred_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  const { count: totalInfractions, error: countError } = await supabase
    .from("assessment_infractions")
    .select("*", { count: "exact", head: true })
    .eq("attempt_id", attempt.id);

  if (countError) throw countError;

  liveEvents.emitInfraction(attempt.assessment_id, {
    attemptId: attempt.id,
    studentId: attempt.student_id,
    infractionType: type,
    totalInfractions: totalInfractions || 0,
  });

  // Leaving the exam window is an immediate automatic submission.
  if (type === "TAB_SWITCH" || type === "WINDOW_BLUR") {
    return await autoSubmitAttempt(attempt, type);
  }

  // The fifth violation also submits automatically. There is no disqualification
  // state or disqualification UI in the assessment system anymore.
  if (Number(totalInfractions || 0) >= MAX_INFRACTIONS) {
    return await autoSubmitAttempt(attempt, "MAX_INFRACTIONS");
  }

  return {
    success: true,
    autoSubmitted: false,
    totalInfractions: totalInfractions || 0,
    infraction,
  };
};

exports.getAttemptInfractions = async (attemptId) => {
  const { data, error } = await supabase
    .from("assessment_infractions")
    .select("*")
    .eq("attempt_id", attemptId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

exports.getInfractionCount = async (attemptId) => {
  const { count, error } = await supabase
    .from("assessment_infractions")
    .select("*", { count: "exact", head: true })
    .eq("attempt_id", attemptId);

  if (error) throw error;
  return count || 0;
};

exports.resetInfractions = async (attemptId) => {
  const { error } = await supabase
    .from("assessment_infractions")
    .delete()
    .eq("attempt_id", attemptId);

  if (error) throw error;
  return { success: true };
};

exports.getAssessmentInfractions = async (assessmentId) => {
  const { data, error } = await supabase
    .from("assessment_infractions")
    .select(`
      id,
      attempt_id,
      type,
      details,
      occurred_at,
      assessment_attempts(
        assessment_id,
        student_id,
        assessment_allowed_students(
          name,
          roll_no,
          branch
        )
      )
    `)
    .eq("assessment_attempts.assessment_id", assessmentId)
    .order("occurred_at", { ascending: false });

  if (error) throw error;
  return data || [];
};

exports.getConfiguration = () => ({
  MAX_INFRACTIONS,
});
