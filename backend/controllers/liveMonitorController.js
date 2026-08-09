const { supabase } = require("../lib/supabase");
const { getSecondsRemaining } = require("../lib/redis");

/* ============================================================
   LIVE STUDENT MONITOR
============================================================ */

exports.getLiveStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    /*
    ----------------------------------------------------
    Assessment
    ----------------------------------------------------
    */

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id, duration_minutes")
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    /*
    ----------------------------------------------------
    Attempts
    ----------------------------------------------------
    */

    const { data: attempts, error } = await supabase
      .from("assessment_attempts")
      .select(
        `
        *,
        assessment_allowed_students(
  id,
  name,
  roll_no,
  email,
  branch,
  status
)
      `,
      )
      .eq("assessment_id", assessmentId)
      .order("started_at", {
        ascending: true,
      });

    if (error) throw error;

    const students = [];

    for (const attempt of attempts || []) {
      const { count: totalQuestions, error: questionCountError } =
        await supabase
          .from("assessment_attempt_questions")
          .select("id", {
            count: "exact",
            head: true,
          })
          .eq("attempt_id", attempt.id);

      if (questionCountError) throw questionCountError;
      const remainingSeconds = await getSecondsRemaining(
        attempt.id,
        assessment.duration_minutes * 60,
      );

      const { count: violations, error: violationsError } = await supabase
        .from("assessment_infractions")
        .select("id", {
          count: "exact",
          head: true,
        })
        .eq("attempt_id", attempt.id);

      if (violationsError) throw violationsError;

      students.push({
        attemptId: attempt.id,

        studentId: attempt.student_id,

        studentName: attempt.assessment_allowed_students?.name,

        rollNo: attempt.assessment_allowed_students?.roll_no,

        email: attempt.assessment_allowed_students?.email,

        department: attempt.assessment_allowed_students?.branch,

        status: attempt.status === "IN_PROGRESS" ? "LIVE" : attempt.status,

        score: Number(attempt.score || 0),

        currentQuestion: attempt.current_question,

        answeredQuestions: attempt.answered_questions,

        totalQuestions: totalQuestions ?? 0,

        violations: violations ?? 0,

        resumedCount: attempt.resumed_count,

        startedAt: attempt.started_at,

        expiresAt: attempt.expires_at,

        submittedAt: attempt.submitted_at,

        remainingSeconds,

        isExpired: remainingSeconds <= 0,
      });
    }

    return res.json({
      success: true,

      totalStudents: students.length,

      students,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   LIVE STUDENT DETAILS
============================================================ */

exports.getStudentDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;

    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required.",
      });
    }

    /*
    ----------------------------------------------------
    Attempt + Student
    ----------------------------------------------------
    */

    const { data: attempt, error: attemptError } = await supabase
      .from("assessment_attempts")
      .select(
        `
        id,
        assessment_id,
        student_id,
        started_at,
        submitted_at,
        expires_at,
        resumed_count,
        current_question,
        score,
        answered_questions,
        status,
        disqualified_reason,
        assessment_allowed_students(
          id,
          name,
          roll_no,
          email,
          branch,
          status
        )
      `,
      )
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Assessment attempt not found.",
      });
    }

    /*
    ----------------------------------------------------
    Questions
    ----------------------------------------------------
    */

    const { data: questions, error: questionsError } = await supabase
      .from("assessment_attempt_questions")
      .select(
        `
        *,
        questions(
          question_text
        ),
        assessment_answers(
          selected_answers,
          answered_at
        ),
        assessment_question_flags(
          marked_for_review
        )
      `,
      )
      .eq("attempt_id", attemptId)
      .order("question_order");

    if (questionsError) throw questionsError;

    /*
    ----------------------------------------------------
    Violations
    ----------------------------------------------------
    */

    const { count: violations, error: violationsError } = await supabase
      .from("assessment_infractions")
      .select("id", {
        count: "exact",
        head: true,
      })
      .eq("attempt_id", attemptId);

    if (violationsError) throw violationsError;

    /*
    ----------------------------------------------------
    Response
    ----------------------------------------------------
    */

    return res.json({
      success: true,

      student: {
        status:
          attempt.assessment_allowed_students?.status === "BLOCKED"
            ? "blocked"
            : "allowed",
      },

      attempt: {
        id: attempt.id,

        status: attempt.status,

        startedAt: attempt.started_at,

        submittedAt: attempt.submitted_at,

        score: Number(attempt.score || 0),

        resumedCount: Number(attempt.resumed_count || 0),

        disqualifiedReason: attempt.disqualified_reason || null,
      },

      timeline: {
        assessmentStartedAt: attempt.started_at,

        submittedAt: attempt.submitted_at,
      },

      statistics: {
        questionsAnswered: Number(attempt.answered_questions || 0),

        score: Number(attempt.score || 0),

        violations: violations ?? 0,
      },

      questions: questions || [],
    });
  } catch (err) {
    console.error("Live Student Details Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
