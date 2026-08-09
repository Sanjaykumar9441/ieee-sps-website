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
    .from("allowed_students")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("email", email)
    .single();
};

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

exports.hasRunningAttempt = async (assessmentId, studentId) => {
  return await supabase
    .from("assessment_attempts")
    .select("id,status")
    .eq("assessment_id", assessmentId)
    .eq("student_id", studentId)
    .eq("status", "IN_PROGRESS")
    .maybeSingle();
};

/* ============================================================
   GET PREVIOUS SUBMISSION
============================================================ */

exports.getSubmittedAttempt = async (assessmentId, studentId) => {
  return await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("student_id", studentId)
    .eq("status", "SUBMITTED")
    .maybeSingle();
};
