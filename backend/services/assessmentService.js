const supabase = require("../lib/supabase");

exports.getAssessment = async (assessmentId) => {
  return await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();
};

exports.getAllowedStudent = async (assessmentId, email) => {
  return await supabase
    .from("allowed_students")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("email", email)
    .single();
};

exports.getAttempt = async (assessmentId, email) => {
  return await supabase
    .from("attempts")
    .select("*")
    .eq("assessment_id", assessmentId)
    .eq("student_email", email)
    .maybeSingle();
};