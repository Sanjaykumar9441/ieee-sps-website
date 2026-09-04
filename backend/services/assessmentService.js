const { supabase } = require("../lib/supabase");

/* ============================================================
   GET ASSESSMENT
============================================================ */

exports.getAssessment = async (assessmentId) => {
  return await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();
};

/* ============================================================
   GET ALLOWED STUDENT
============================================================ */

exports.getAllowedStudent = async (assessmentId, email) => {
  return await supabase
    .from("assessment_allowed_students")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("email", email)
    .single();
};

exports.getTeamById = async (teamId) =>
  supabase.from("assessment_teams").select("*").eq("id", teamId).single();
exports.getTeamAttempt = async (assessmentId, teamId) =>
  supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("team_id", teamId)
    .maybeSingle();

/* ============================================================
   GET ACTIVE ATTEMPT
============================================================ */

exports.getAttempt = async (assessmentId, studentId) => {
  return await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("student_id", studentId)
    .maybeSingle();
};

/* ============================================================
   CHECK ACTIVE ATTEMPT
============================================================ */

exports.hasRunningAttempt = async (assessmentId, studentId, teamId = null) => {
  let q = supabase
    .from("assessment_attempts")
    .select("id,status,team_id")
    .eq("assessment_id", assessmentId)
    .eq("status", "IN_PROGRESS");
  q = teamId ? q.eq("team_id", teamId) : q.eq("student_id", studentId);
  return q.maybeSingle();
};

/* ============================================================
   GET PREVIOUS SUBMISSION
============================================================ */

exports.getSubmittedAttempt = async (
  assessmentId,
  studentId,
  teamId = null,
) => {
  let q = supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("status", "SUBMITTED");
  q = teamId ? q.eq("team_id", teamId) : q.eq("student_id", studentId);
  return q.maybeSingle();
};
