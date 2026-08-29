const { supabase } = require("../lib/supabase");

class StudentAuth {
  static async getStudentDetails(studentId, assessmentId) {
    const { data: student, error: studentError } = await supabase
      .from("assessment_allowed_students")
      .select("*")
      .eq("id", studentId)
      .eq("assessment_id", assessmentId)
      .single();
    if (studentError || !student) return { data: null, error: studentError || { code: "PGRST116", message: "Student not found" } };

    const { data: attempts, error: attemptError } = await supabase
      .from("assessment_attempts")
      .select("id, started_at, submitted_at, expires_at, status, score, correct, wrong, unanswered, percentage, answered_questions, current_question, resumed_count, disqualified_reason")
      .eq("student_id", studentId)
      .eq("assessment_id", assessmentId)
      .order("started_at", { ascending: false })
      .limit(1);
    if (attemptError) return { error: attemptError };
    return { data: { ...student, assessment_attempts: attempts || [] }, error: null };
  }
}
module.exports = StudentAuth;
