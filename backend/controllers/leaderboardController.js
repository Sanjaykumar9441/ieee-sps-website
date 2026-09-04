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

    // ---------------------------------------------------------
    // Assessment configuration
    // ---------------------------------------------------------

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select(
        "total_questions, marks_per_question, pass_percentage, passing_score, participation_mode",
      )
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    // ---------------------------------------------------------
    // Submitted attempts
    // ---------------------------------------------------------

    const { data, error } = await supabase
      .from("assessment_attempts")
      .select(
        `
        id,
        student_id,
        team_id,
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
          email,
          branch,
          team_id
        )
        `,
      )
      .eq("assessment_id", assessmentId)
      .eq("status", "SUBMITTED");

    if (error) {
      throw error;
    }

    let teamMap = new Map();
    if (assessment.participation_mode !== "INDIVIDUAL_STUDENTS") {
      const { data: teams, error: teamError } = await supabase
        .from("assessment_teams")
        .select("id,team_name,contact_email,branch,member_count")
        .eq("assessment_id", assessmentId);
      if (teamError) throw teamError;
      const ids = (teams || []).map((t) => t.id);
      let members = [];
      if (ids.length) {
        const { data: m, error: me } = await supabase
          .from("assessment_team_members")
          .select("team_id,name,roll_no,email,branch")
          .in("team_id", ids)
          .order("created_at");
        if (me) throw me;
        members = m || [];
      }
      teamMap = new Map(
        (teams || []).map((t) => [
          t.id,
          { ...t, members: members.filter((m) => m.team_id === t.id) },
        ]),
      );
    }

    // Use the frozen question marks for the actual maximum score. This keeps
    // leaderboard percentages correct when different questions have different marks.
    const attemptIds = (data || []).map((row) => row.id);
    const maximumMarksByAttempt = new Map();
    if (attemptIds.length) {
      const { data: attemptQuestions, error: aqError } = await supabase
        .from("assessment_attempt_questions")
        .select("attempt_id,marks")
        .in("attempt_id", attemptIds);
      if (aqError) throw aqError;
      for (const row of attemptQuestions || []) {
        maximumMarksByAttempt.set(
          row.attempt_id,
          (maximumMarksByAttempt.get(row.attempt_id) || 0) +
            Math.max(0, Number(row.marks || 0)),
        );
      }
    }

    // ---------------------------------------------------------
    // Build leaderboard
    // ---------------------------------------------------------

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
          maximumMarksByAttempt.get(student.id) ||
          Number(assessment.total_questions || 0) *
            Number(assessment.marks_per_question || 0);

        const scorePercentage =
          maximumMarks > 0
            ? Number(
                ((Number(student.score || 0) / maximumMarks) * 100).toFixed(2),
              )
            : 0;

        const team = student.team_id ? teamMap.get(student.team_id) : null;
        return {
          attemptId: student.id,
          participantType: team ? "TEAM" : "INDIVIDUAL",
          teamId: student.team_id || null,
          teamName: team?.team_name || null,
          teamMemberCount: Number(team?.member_count || 0),
          members: team?.members || [],

          studentId: student.student_id,

          name: student.assessment_allowed_students?.name,

          rollNo: team ? null : student.assessment_allowed_students?.roll_no,

          email: student.assessment_allowed_students?.email,

          department: student.assessment_allowed_students?.branch,

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

      // -------------------------------------------------------
      // Ranking
      // -------------------------------------------------------

      .sort((a, b) => {
        // 1. Higher score first
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        // 2. Earlier submission first
        const aTime = a.submittedAt
          ? new Date(a.submittedAt).getTime()
          : Number.MAX_SAFE_INTEGER;

        const bTime = b.submittedAt
          ? new Date(b.submittedAt).getTime()
          : Number.MAX_SAFE_INTEGER;

        if (aTime !== bTime) {
          return aTime - bTime;
        }

        // 3. Roll number
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
        team_id,
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

    let topTeamMap = new Map();
    const { data: topTeams } = await supabase
      .from("assessment_teams")
      .select("id,team_name")
      .eq("assessment_id", assessmentId);
    topTeamMap = new Map((topTeams || []).map((t) => [t.id, t]));
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

        name: student.team_id
          ? topTeamMap.get(student.team_id)?.team_name || "Team"
          : student.assessment_allowed_students?.name,

        rollNo: student.team_id
          ? null
          : student.assessment_allowed_students?.roll_no,

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
