const { supabase } = require("../lib/supabase");
const { getSecondsRemaining } = require("../lib/redis");
const scoring = require("../services/scoringService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");

async function safeRemainingSeconds(attempt) {
  try {
    if (attempt.expires_at) {
      const duration = Math.max(
        0,
        Math.floor(
          (new Date(attempt.expires_at).getTime() -
            new Date(attempt.started_at).getTime()) /
            1000,
        ),
      );
      const remaining = await getSecondsRemaining(attempt.id, duration);
      if (Number.isFinite(Number(remaining)))
        return Math.max(0, Number(remaining));
    }
  } catch (error) {
    console.warn(
      "Redis timer unavailable; using expires_at fallback:",
      error.message,
    );
  }
  return attempt.expires_at
    ? Math.max(
        0,
        Math.floor(
          (new Date(attempt.expires_at).getTime() - Date.now()) / 1000,
        ),
      )
    : 0;
}

async function reconcileExpiredAttempts(attempts) {
  const now = Date.now();
  for (const attempt of attempts || []) {
    if (
      attempt.status !== "IN_PROGRESS" ||
      !attempt.expires_at ||
      new Date(attempt.expires_at).getTime() > now
    )
      continue;
    try {
      const result = await scoring.calculateScore(attempt.id);
      const updated = await engine.finishAttempt(
        attempt.id,
        result,
        "SUBMITTED",
      );
      await supabase
        .from("assessment_activity")
        .insert({
          attempt_id: attempt.id,
          activity_type: "AUTO_SUBMIT",
          metadata: { source: "server_reconciliation", reason: "TIME_EXPIRED" },
        });
      try {
        await session.unlockStudent(updated.assessment_id, updated.student_id);
      } catch (_) {}
      liveEvents.emitSubmitted(updated.assessment_id, updated);
      liveEvents.emitStudentSubmitted(updated.assessment_id);
      liveEvents.emitDashboardRefresh(updated.assessment_id);
    } catch (error) {
      console.error(
        "Expired attempt reconciliation failed:",
        attempt.id,
        error.message,
      );
    }
  }
}

async function getStudentMap(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_allowed_students")
    .select(
      "id,name,roll_no,email,branch,status,has_logged_in,first_login_at,team_id",
    )
    .eq("assessment_id", assessmentId);
  if (error) throw error;
  return new Map((data || []).map((s) => [s.id, s]));
}

exports.getLiveStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) {
      return res
        .status(400)
        .json({ success: false, message: "Assessment ID is required." });
    }

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select(
        "id,title,duration_minutes,live_updates_enabled,participation_mode",
      )
      .eq("id", assessmentId)
      .single();
    if (assessmentError || !assessment) {
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });
    }

    const { data: attempts, error: attemptsError } = await supabase
      .from("assessment_attempts")
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("assessment_id", assessmentId)
      .order("started_at", { ascending: true });
    if (attemptsError) throw attemptsError;

    await reconcileExpiredAttempts(attempts);

    const { data: refreshedAttempts, error: refreshedError } = await supabase
      .from("assessment_attempts")
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("assessment_id", assessmentId)
      .order("started_at", { ascending: true });
    if (refreshedError) throw refreshedError;

    const studentMap = await getStudentMap(assessmentId);
    const students = [...studentMap.values()];

    const { data: teamRows, error: teamError } = await supabase
      .from("assessment_teams")
      .select("id,team_name,contact_email,member_count,branch,mode")
      .eq("assessment_id", assessmentId)
      .order("created_at", { ascending: true });
    if (teamError && assessment.participation_mode !== "INDIVIDUAL_STUDENTS")
      throw teamError;

    const teamIds = (teamRows || []).map((team) => team.id);
    let teamMembers = [];
    if (
      teamIds.length &&
      assessment.participation_mode !== "INDIVIDUAL_STUDENTS"
    ) {
      const { data: members, error: memberError } = await supabase
        .from("assessment_team_members")
        .select("id,team_id,name,roll_no,email,branch")
        .in("team_id", teamIds)
        .order("created_at", { ascending: true });
      if (memberError) throw memberError;
      teamMembers = members || [];
    }

    const teamMap = new Map(
      (teamRows || []).map((team) => [
        team.id,
        {
          ...team,
          members: teamMembers.filter((member) => member.team_id === team.id),
        },
      ]),
    );

    const attemptByTeam = new Map();
    const attemptByStudent = new Map();
    for (const attempt of refreshedAttempts || []) {
      if (attempt.team_id) {
        const previous = attemptByTeam.get(attempt.team_id);
        if (
          !previous ||
          new Date(attempt.started_at || 0) > new Date(previous.started_at || 0)
        ) {
          attemptByTeam.set(attempt.team_id, attempt);
        }
      }
      if (attempt.student_id) {
        const previous = attemptByStudent.get(attempt.student_id);
        if (
          !previous ||
          new Date(attempt.started_at || 0) > new Date(previous.started_at || 0)
        ) {
          attemptByStudent.set(attempt.student_id, attempt);
        }
      }
    }

    const buildAttemptState = async (attempt) => {
      if (!attempt) {
        return {
          attemptId: "",
          currentQuestion: 0,
          answeredQuestions: 0,
          totalQuestions: 0,
          score: 0,
          remainingSeconds: 0,
          status: "NOT_STARTED",
          isExpired: false,
          startedAt: null,
          submittedAt: null,
          resumedCount: 0,
          violations: 0,
          autoSubmitted: false,
          forceSubmitted: false,
        };
      }

      const [
        { count: totalQuestions, error: qError },
        { count: violations, error: iError },
        { data: activities, error: aError },
      ] = await Promise.all([
        supabase
          .from("assessment_attempt_questions")
          .select("id", { count: "exact", head: true })
          .eq("attempt_id", attempt.id),
        supabase
          .from("assessment_infractions")
          .select("id", { count: "exact", head: true })
          .eq("attempt_id", attempt.id),
        supabase
          .from("assessment_activity")
          .select("activity_type,metadata,created_at")
          .eq("attempt_id", attempt.id)
          .order("created_at", { ascending: false }),
      ]);
      if (qError) throw qError;
      if (iError)
        console.warn(
          "Live monitor infraction query unavailable:",
          iError.message,
        );
      if (aError)
        console.warn(
          "Live monitor activity query unavailable:",
          aError.message,
        );

      const acts = activities || [];
      const remainingSeconds = await safeRemainingSeconds(attempt);
      const status = attempt.status === "IN_PROGRESS" ? "LIVE" : "SUBMITTED";

      return {
        attemptId: attempt.id,
        currentQuestion: Number(attempt.current_question || 0),
        answeredQuestions: Number(attempt.answered_questions || 0),
        totalQuestions: Number(totalQuestions || 0),
        score: Number(attempt.score || 0),
        remainingSeconds,
        status,
        isExpired: remainingSeconds <= 0 && status === "LIVE",
        startedAt: attempt.started_at || null,
        submittedAt: attempt.submitted_at || null,
        resumedCount: Number(attempt.resumed_count || 0),
        violations: Number(iError ? 0 : violations || 0),
        autoSubmitted: acts.some((activity) =>
          ["AUTO_SUBMIT", "SECURITY_AUTO_SUBMIT"].includes(
            activity.activity_type,
          ),
        ),
        forceSubmitted: acts.some(
          (activity) => activity.activity_type === "FORCE_SUBMIT",
        ),
      };
    };

    const rows = [];

    if (assessment.participation_mode === "INDIVIDUAL_STUDENTS") {
      for (const student of students) {
        const state = await buildAttemptState(attemptByStudent.get(student.id));
        rows.push({
          ...state,
          studentId: student.id,
          studentName: student.name,
          rollNo: student.roll_no || "",
          email: student.email || "",
          department: student.branch || "",
          teamId: null,
          teamName: null,
          teamMemberCount: 0,
          members: [],
        });
      }
    } else if (assessment.participation_mode === "STUDENT_TEAMS") {
      // Student Teams: keep the individual-student view, but every member
      // points to the same team attempt and carries the team name/count.
      for (const team of teamRows || []) {
        const state = await buildAttemptState(attemptByTeam.get(team.id));
        const fullTeam = teamMap.get(team.id) || team;
        const members = fullTeam.members || [];
        for (const member of members) {
          const allowedStudent = students.find(
            (student) =>
              String(student.email || "").toLowerCase() ===
              String(member.email || "").toLowerCase(),
          );
          rows.push({
            ...state,
            studentId: allowedStudent?.id || member.id,
            studentName: member.name,
            rollNo: member.roll_no || "",
            email: member.email || "",
            department: member.branch || fullTeam.branch || "",
            teamId: team.id,
            teamName: team.team_name,
            teamMemberCount: Number(team.member_count || members.length || 0),
            members,
          });
        }
      }
    } else {
      // Team mode: one row per team. Never expose a student/roll-number row.
      for (const team of teamRows || []) {
        const state = await buildAttemptState(attemptByTeam.get(team.id));
        rows.push({
          ...state,
          studentId: "",
          studentName: team.team_name,
          rollNo: "",
          email: team.contact_email || "",
          department: team.branch || "",
          teamId: team.id,
          teamName: team.team_name,
          teamMemberCount: 0,
          members: [],
        });
      }
    }

    return res.json({
      success: true,
      liveUpdatesEnabled: assessment.live_updates_enabled !== false,
      totalStudents: rows.length,
      students: rows,
    });
  } catch (err) {
    console.error("LIVE MONITOR ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.getStudentDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    if (!attemptId)
      return res
        .status(400)
        .json({ success: false, message: "Attempt ID is required." });
    const { data: attempt, error } = await supabase
      .from("assessment_attempts")
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("id", attemptId)
      .single();
    if (error || !attempt)
      return res
        .status(404)
        .json({ success: false, message: "Assessment attempt not found." });
    const studentMap = await getStudentMap(attempt.assessment_id);
    const student = studentMap.get(attempt.student_id);
    const team = attempt.team_id
      ? (
          await supabase
            .from("assessment_teams")
            .select("id,team_name,member_count,branch")
            .eq("id", attempt.team_id)
            .maybeSingle()
        ).data
      : null;
    const { data: questions, error: questionsError } = await supabase
      .from("assessment_attempt_questions")
      .select(
        "id,question_id,question_order,shuffled_options,correct_answers,marks,negative_marks,questions(question_text,question_type),assessment_answers(selected_answers,answered_at),assessment_question_flags(marked_for_review,answered,visited)",
      )
      .eq("attempt_id", attemptId)
      .order("question_order");
    if (questionsError) throw questionsError;
    const { data: infractions, error: infractionsError } = await supabase
      .from("assessment_infractions")
      .select("id,type,details,occurred_at")
      .eq("attempt_id", attemptId)
      .order("occurred_at", { ascending: true });
    if (infractionsError) throw infractionsError;
    const { data: activities, error: activityError } = await supabase
      .from("assessment_activity")
      .select("activity_type,metadata,created_at")
      .eq("attempt_id", attemptId)
      .order("created_at", { ascending: true });
    if (activityError) throw activityError;
    return res.json({
      success: true,
      student: student || null,
      attempt: {
        ...attempt,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        expiresAt: attempt.expires_at,
        resumedCount: Number(attempt.resumed_count || 0),
        currentQuestion: Number(attempt.current_question || 0),
        answeredQuestions: Number(attempt.answered_questions || 0),
      },
      timeline: {
        loggedInAt: student?.first_login_at || null,
        startedAt: attempt.started_at,
        assessmentStartedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
      },
      statistics: {
        questionsAnswered: Number(attempt.answered_questions || 0),
        score: Number(attempt.score || 0),
        violations: infractions?.length || 0,
      },
      infractions: infractions || [],
      activities: activities || [],
      questions: questions || [],
    });
  } catch (err) {
    console.error("LIVE STUDENT DETAILS ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};
