const { supabase } = require("../lib/supabase");

/*
============================================================
LIVE LEADERBOARD
============================================================
*/

exports.getLeaderboard = async (req, res) => {
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
  .select(
    "total_questions, marks_per_question, pass_percentage, passing_score",
  )
  .eq("id", assessmentId)
  .single();

if (assessmentError || !assessment) {
  return res.status(404).json({
    success: false,
    message: "Assessment not found.",
  });
}

const { data, error } = await supabase
  .from("assessment_attempts")
  .select(
    `
    id,
    student_id,
    score,
    correct,
    wrong,
    unanswered,
    percentage,
    submitted_at,
    started_at,
    assessment_allowed_students(
      name,
      roll_no,
      department,
      section
    )
  `,
  )
  .eq("assessment_id", assessmentId)
  .eq("status", "SUBMITTED");

    if (error) throw error;

    const leaderboard = (data || [])
      .map((student) => {
        const submittedAt = student.submitted_at
          ? new Date(student.submitted_at).getTime()
          : null;

        const startedAt = student.started_at
          ? new Date(student.started_at).getTime()
          : null;

        const timeTaken =
          submittedAt !== null && startedAt !== null
            ? Math.max(0, Math.floor((submittedAt - startedAt) / 1000))
            : 0;

        const maximumMarks =
  Number(assessment.total_questions || 0) *
  Number(assessment.marks_per_question || 0);

const scorePercentage =
  maximumMarks > 0
    ? Number(
        ((Number(student.score || 0) / maximumMarks) * 100).toFixed(2),
      )
    : 0;

        return {
          attemptId: student.id,

          studentId: student.student_id,

          name: student.assessment_allowed_students?.name,

          rollNo: student.assessment_allowed_students?.roll_no,

          department: student.assessment_allowed_students?.department,

          section: student.assessment_allowed_students?.section,

          status: "SUBMITTED",

          score: Number(student.score || 0),

          correct: Number(student.correct || 0),

          wrong: Number(student.wrong || 0),

          unanswered: Number(student.unanswered || 0),

          percentage: Number(Number(student.percentage || 0).toFixed(2)),

          scorePercentage,

          timeTaken,

          submittedAt: student.submitted_at,

          startedAt: student.started_at,
        };
      })
      .sort((a, b) => {
        /*
        ----------------------------------------------------
        1. Higher score first
        ----------------------------------------------------
        */

        if (b.score !== a.score) {
          return b.score - a.score;
        }

        /*
        ----------------------------------------------------
        2. Earlier submission first
        ----------------------------------------------------
        */

        const aTime = a.submittedAt
          ? new Date(a.submittedAt).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bTime = b.submittedAt
          ? new Date(b.submittedAt).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (aTime !== bTime) {
          return aTime - bTime;
        }

        /*
        ----------------------------------------------------
        3. Roll number as final tie-breaker
        ----------------------------------------------------
        */

        return (a.rollNo || "").localeCompare(b.rollNo || "");
      })
      .map((student, index) => ({
        ...student,

        rank: index + 1,
      }));

    return res.json({
      success: true,

      totalStudents: leaderboard.length,

      leaderboard,
    });
  } catch (err) {
    console.error("Leaderboard Error:", err);

    return res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};

/*
============================================================
TOP 3 LEADERBOARD
============================================================
*/

exports.getTopThree = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await supabase
      .from("assessment_attempts")
      .select(
        `
        id,
        score,
        submitted_at,
        assessment_allowed_students(
          name,
          roll_no
        )
      `,
      )
      .eq("assessment_id", assessmentId)
      .eq("status", "SUBMITTED");

    if (error) throw error;

    const topThree = (data || [])
      .sort((a, b) => {
        if (Number(b.score) !== Number(a.score)) {
          return Number(b.score) - Number(a.score);
        }

        const aTime = a.submitted_at
          ? new Date(a.submitted_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bTime = b.submitted_at
          ? new Date(b.submitted_at).getTime()
          : Number.MAX_SAFE_INTEGER;

        return aTime - bTime;
      })
      .slice(0, 3)
      .map((student, index) => ({
        rank: index + 1,

        name: student.assessment_allowed_students?.name,

        rollNo: student.assessment_allowed_students?.roll_no,

        score: Number(student.score || 0),

        submittedAt: student.submitted_at,
      }));

    return res.json({
      success: true,

      topThree,
    });
  } catch (err) {
    console.error("Top Three Leaderboard Error:", err);

    return res.status(500).json({
      success: false,

      message: err.message,
    });
  }
};
