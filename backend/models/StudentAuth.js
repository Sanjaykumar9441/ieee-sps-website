const { supabase } = require("../lib/supabase");

class StudentAuth {
  static async getStudentDetails(studentId) {
    const { data, error } = await supabase
      .from("assessment_allowed_students")
      .select(
        `
        *,
        assessment_attempts (
          id,
          started_at,
          submitted_at,
          expires_at,
          status,
          score,
          answered_questions,
          current_question,
          resumed_count,
          disqualified_reason
        )
      `,
      )
      .eq("id", studentId)
      .single();

    return { data, error };
  }
}

module.exports = StudentAuth;
