const { supabase } = require("../lib/supabase");
const { getSecondsRemaining } = require("../lib/redis");

async function safeRemainingSeconds(attempt) {
  try {
    const duration = Math.max(
      0,
      Math.floor((new Date(attempt.expires_at).getTime() - new Date(attempt.started_at).getTime()) / 1000),
    );
    const redisRemaining = await getSecondsRemaining(attempt.id, duration);
    if (Number.isFinite(Number(redisRemaining))) return Math.max(0, Number(redisRemaining));
  } catch (error) {
    console.warn("Redis timer unavailable; using expires_at fallback:", error.message);
  }

  if (!attempt.expires_at) return 0;
  return Math.max(
    0,
    Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000),
  );
}

async function getStudentMap(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_allowed_students")
    .select("id, name, roll_no, email, branch, status")
    .eq("assessment_id", assessmentId);

  if (error) throw error;
  return new Map((data || []).map((s) => [s.id, s]));
}

exports.getLiveStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id, title, duration_minutes, live_updates_enabled")
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("assessment_attempts")
      .select(`
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
        disqualified_reason
      `)
      .eq("assessment_id", assessmentId)
      .order("started_at", { ascending: true });

    if (attemptsError) throw attemptsError;

    const studentMap = await getStudentMap(assessmentId);
    const students = [];

    for (const attempt of attempts || []) {
      const student = studentMap.get(attempt.student_id);
      const { count: totalQuestions, error: qError } = await supabase
        .from("assessment_attempt_questions")
        .select("id", { count: "exact", head: true })
        .eq("attempt_id", attempt.id);

      if (qError) throw qError;

      const { count: violations, error: infractionError } = await supabase
        .from("assessment_infractions")
        .select("id", { count: "exact", head: true })
        .eq("attempt_id", attempt.id);

      if (infractionError) throw infractionError;

      const remainingSeconds = await safeRemainingSeconds(attempt);

      students.push({
        attemptId: attempt.id,
        studentId: attempt.student_id,
        studentName: student?.name || "Unknown Student",
        rollNo: student?.roll_no || "",
        email: student?.email || "",
        department: student?.branch || "",
        currentQuestion: Number(attempt.current_question || 0),
        answeredQuestions: Number(attempt.answered_questions || 0),
        totalQuestions: Number(totalQuestions || 0),
        score: Number(attempt.score || 0),
        remainingSeconds,
        expiresAt: attempt.expires_at,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        resumedCount: Number(attempt.resumed_count || 0),
        violations: Number(violations || 0),
        disqualifiedReason: attempt.disqualified_reason || null,
        status:
          attempt.status === "IN_PROGRESS"
            ? "LIVE"
            : attempt.status === "DISQUALIFIED"
              ? "DISQUALIFIED"
              : "SUBMITTED",
      });
    }

    return res.json({
      success: true,
      liveUpdatesEnabled: assessment.live_updates_enabled !== false,
      totalStudents: students.length,
      students,
    });
  } catch (err) {
    console.error("LIVE MONITOR ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStudentDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    if (!attemptId) {
      return res.status(400).json({
        success: false,
        message: "Attempt ID is required.",
      });
    }

    const { data: attempt, error: attemptError } = await supabase
      .from("assessment_attempts")
      .select(`
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
        disqualified_reason
      `)
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Assessment attempt not found.",
      });
    }

    const studentMap = await getStudentMap(attempt.assessment_id);
    const student = studentMap.get(attempt.student_id);

    const { data: questions, error: questionsError } = await supabase
      .from("assessment_attempt_questions")
      .select(`
        id,
        question_id,
        question_order,
        shuffled_options,
        correct_answers,
        marks,
        negative_marks,
        questions(question_text, question_type),
        assessment_answers(selected_answers, answered_at),
        assessment_question_flags(marked_for_review, answered, visited)
      `)
      .eq("attempt_id", attemptId)
      .order("question_order");

    if (questionsError) throw questionsError;

    const { data: infractions, error: infractionsError } = await supabase
      .from("assessment_infractions")
      .select("id, type, details, occurred_at")
      .eq("attempt_id", attemptId)
      .order("occurred_at", { ascending: true });

    if (infractionsError) throw infractionsError;

    return res.json({
      success: true,
      student: student || null,
      attempt,
      timeline: {
        loggedInAt: null,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
      },
      statistics: {
        questionsAnswered: Number(attempt.answered_questions || 0),
        score: Number(attempt.score || 0),
        violations: infractions?.length || 0,
      },
      infractions: infractions || [],
      questions: questions || [],
    });
  } catch (err) {
    console.error("LIVE STUDENT DETAILS ERROR:", err);
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
