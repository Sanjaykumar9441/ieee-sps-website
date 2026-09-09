const { supabase } = require("../lib/supabase");
const { getSecondsRemaining } = require("../lib/redis");
const scoring = require("../services/scoringService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");

async function getRemainingSeconds(attempt) {
  if (!attempt?.expires_at) return 0;

  try {
    if (attempt.started_at) {
      const duration = Math.max(
        0,
        Math.floor(
          (new Date(attempt.expires_at).getTime() -
            new Date(attempt.started_at).getTime()) /
            1000,
        ),
      );
      const value = await getSecondsRemaining(attempt.id, duration);
      if (Number.isFinite(Number(value))) return Math.max(0, Number(value));
    }
  } catch (error) {
    console.warn("[LIVE MONITOR] Redis timer fallback:", error.message);
  }

  return Math.max(
    0,
    Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000),
  );
}

async function getStudents(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_allowed_students")
    .select("id,name,roll_no,email,branch,status,first_login_at,team_id")
    .eq("assessment_id", assessmentId);

  if (error) throw error;
  return data || [];
}

async function getTeams(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_teams")
    .select("id,team_name,contact_email,member_count,branch,mode")
    .eq("assessment_id", assessmentId)
    .order("created_at", { ascending: true });

  if (error) throw error;

  const list = data || [];
  const ids = list.map((team) => team.id);

  if (!ids.length) return [];

  const { data: members, error: memberError } = await supabase
    .from("assessment_team_members")
    .select("id,team_id,name,roll_no,email,branch")
    .in("team_id", ids)
    .order("created_at", { ascending: true });

  if (memberError) throw memberError;

  const byTeam = new Map();
  for (const member of members || []) {
    if (!byTeam.has(member.team_id)) byTeam.set(member.team_id, []);
    byTeam.get(member.team_id).push(member);
  }

  return list.map((team) => ({
    ...team,
    members: byTeam.get(team.id) || [],
  }));
}

function latestAttempts(attempts) {
  const byStudent = new Map();
  const byTeam = new Map();

  for (const attempt of attempts || []) {
    if (attempt.student_id) {
      const old = byStudent.get(attempt.student_id);
      if (
        !old ||
        new Date(attempt.started_at || 0).getTime() >
          new Date(old.started_at || 0).getTime()
      ) {
        byStudent.set(attempt.student_id, attempt);
      }
    }

    if (attempt.team_id) {
      const old = byTeam.get(attempt.team_id);
      if (
        !old ||
        new Date(attempt.started_at || 0).getTime() >
          new Date(old.started_at || 0).getTime()
      ) {
        byTeam.set(attempt.team_id, attempt);
      }
    }
  }

  return { byStudent, byTeam };
}

async function reconcileExpiredAttempts(attempts) {
  const graceMs = 2 * 60 * 1000;
  const now = Date.now();

  for (const attempt of attempts || []) {
    if (
      attempt.status !== "IN_PROGRESS" ||
      !attempt.expires_at ||
      now - new Date(attempt.expires_at).getTime() < graceMs
    ) {
      continue;
    }

    try {
      const result = await scoring.calculateScore(attempt.id);
      const updated = await engine.finishAttempt(
        attempt.id,
        result,
        "SUBMITTED",
      );

      await supabase.from("assessment_activity").insert({
        attempt_id: attempt.id,
        activity_type: "AUTO_SUBMIT",
        metadata: {
          source: "server_reconciliation",
          reason: "TIME_EXPIRED",
        },
      });

      try {
        await session.unlockStudent(
          updated.assessment_id,
          updated.team_id || updated.student_id,
        );
      } catch (_) {}

      liveEvents.emitSubmitted(updated.assessment_id, updated);
      liveEvents.emitStudentSubmitted(updated.assessment_id);
      liveEvents.emitDashboardRefresh(updated.assessment_id);
      liveEvents.emitLeaderboard(updated.assessment_id, []);
    } catch (error) {
      console.error(
        "[LIVE MONITOR] Expired attempt reconciliation failed:",
        attempt.id,
        error.message,
      );
    }
  }
}

async function getBatchedCounts(attemptIds) {
  const empty = {
    answered: new Map(),
    total: new Map(),
    violations: new Map(),
  };
  if (!attemptIds.length) return empty;

  const { data: attemptQuestions, error: questionError } = await supabase
    .from("assessment_attempt_questions")
    .select("id,attempt_id")
    .in("attempt_id", attemptIds);

  if (questionError) throw questionError;

  const answered = new Map();
  const total = new Map();

  for (const row of attemptQuestions || []) {
    total.set(row.attempt_id, (total.get(row.attempt_id) || 0) + 1);
  }

  const questionIds = (attemptQuestions || []).map((row) => row.id);

  if (questionIds.length) {
    const { data: answers, error: answerError } = await supabase
      .from("assessment_answers")
      .select(
        "attempt_question_id,selected_answers,subjective_answer,coding_answer",
      )
      .in("attempt_question_id", questionIds);

    if (answerError) throw answerError;

    const owner = new Map(
      (attemptQuestions || []).map((row) => [String(row.id), row.attempt_id]),
    );

    for (const answer of answers || []) {
      const hasAnswer =
        (Array.isArray(answer.selected_answers) &&
          answer.selected_answers.length > 0) ||
        (typeof answer.subjective_answer === "string" &&
          answer.subjective_answer.trim().length > 0) ||
        (typeof answer.coding_answer === "string" &&
          answer.coding_answer.trim().length > 0);

      if (!hasAnswer) continue;

      const attemptId = owner.get(String(answer.attempt_question_id));
      if (attemptId) {
        answered.set(attemptId, (answered.get(attemptId) || 0) + 1);
      }
    }
  }

  const { data: infractions, error: infractionError } = await supabase
    .from("assessment_infractions")
    .select("id,attempt_id")
    .in("attempt_id", attemptIds);

  if (infractionError) throw infractionError;

  const violations = new Map();
  for (const row of infractions || []) {
    violations.set(row.attempt_id, (violations.get(row.attempt_id) || 0) + 1);
  }

  return { answered, total, violations };
}

async function buildState(attempt, counts) {
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
      violations: 0,
      startedAt: null,
      submittedAt: null,
      resumedCount: 0,
    };
  }

  const submitted = attempt.status !== "IN_PROGRESS";

  return {
    attemptId: attempt.id,
    // A submitted attempt no longer has a meaningful current question.
    currentQuestion: submitted ? 0 : Number(attempt.current_question || 0),
    answeredQuestions: Math.max(
      Number(attempt.answered_questions || 0),
      Number(counts.answered.get(attempt.id) || 0),
    ),
    totalQuestions: Number(counts.total.get(attempt.id) || 0),
    score: Number(attempt.score || 0),
    remainingSeconds: submitted ? 0 : await getRemainingSeconds(attempt),
    status: submitted ? "SUBMITTED" : "LIVE",
    isExpired: false,
    startedAt: attempt.started_at || null,
    submittedAt: attempt.submitted_at || null,
    resumedCount: Number(attempt.resumed_count || 0),
    violations: Number(counts.violations.get(attempt.id) || 0),
  };
}

function answerValue(value) {
  if (typeof value === "number" && Number.isFinite(value)) return value;

  if (typeof value === "string") {
    const normalized = value.trim().toUpperCase();
    const map = { A: 0, B: 1, C: 2, D: 3 };

    if (map[normalized] !== undefined) return map[normalized];
    if (/^\d+$/.test(normalized)) return Number(normalized);
  }

  return value;
}

function answerSet(value) {
  const values = Array.isArray(value) ? value : value == null ? [] : [value];

  return values
    .map(answerValue)
    .sort((a, b) =>
      typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b)),
    );
}

function optionObject(value) {
  if (Array.isArray(value)) {
    return Object.fromEntries(
      value.map((text, index) => [
        String.fromCharCode(65 + index),
        String(text ?? ""),
      ]),
    );
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, text]) => [
        String(key).toUpperCase(),
        String(text ?? ""),
      ]),
    );
  }

  return {};
}

function answerDisplay(values, options) {
  const list = Array.isArray(values) ? values : [];

  return list.map((value) => {
    const normalized = answerValue(value);

    if (typeof normalized === "number" && options[normalized]) {
      const key = String.fromCharCode(65 + normalized);
      return `${key}. ${options[normalized]}`;
    }

    const byKey = Object.entries(options).find(
      ([key]) => key.toUpperCase() === String(normalized).toUpperCase(),
    );

    if (byKey) return `${byKey[0]}. ${byKey[1]}`;

    return String(value);
  });
}

function originalCorrectKeys(sourceAnswers, originalOptions, shuffledOptions) {
  const list = Array.isArray(sourceAnswers)
    ? sourceAnswers
    : sourceAnswers == null
      ? []
      : [sourceAnswers];

  const normalizedOriginal = optionObject(originalOptions);
  const normalizedShuffled = optionObject(shuffledOptions);
  const result = [];

  for (const answer of list) {
    const key =
      typeof answer === "number"
        ? String.fromCharCode(65 + answer)
        : String(answer).trim().toUpperCase();

    const originalText =
      normalizedOriginal[key] ??
      (/^\d+$/.test(key)
        ? normalizedOriginal[String.fromCharCode(65 + Number(key))]
        : String(answer));

    const found = Object.entries(normalizedShuffled).find(
      ([, text]) => String(text).trim() === String(originalText).trim(),
    );

    result.push(found ? found[0] : answer);
  }

  return result;
}

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
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("id", attemptId)
      .single();

    if (attemptError || !attempt) {
      return res.status(404).json({
        success: false,
        message: "Assessment attempt not found.",
      });
    }

    const [{ data: assessment, error: assessmentError }, students, teamList] =
      await Promise.all([
        supabase
          .from("assessments")
          .select("marks_per_question,negative_marks,participation_mode")
          .eq("id", attempt.assessment_id)
          .single(),
        getStudents(attempt.assessment_id),
        getTeams(attempt.assessment_id),
      ]);

    if (assessmentError) throw assessmentError;

    const student = students.find((x) => x.id === attempt.student_id) || null;
    const team = attempt.team_id
      ? teamList.find((x) => x.id === attempt.team_id) || null
      : null;

    const { data: questions, error: questionError } = await supabase
      .from("assessment_attempt_questions")
      .select(
        `
        id,
        question_id,
        question_order,
        shuffled_options,
        correct_answers,
        marks,
        negative_marks,
        questions(
          question_text,
          question_type,
          options,
          correct_answers
        ),
        assessment_question_flags(
          marked_for_review,
          answered,
          visited
        )
      `,
      )
      .eq("attempt_id", attemptId)
      .order("question_order", { ascending: true });

    if (questionError) throw questionError;

    const ids = (questions || []).map((q) => q.id);
    let answers = [];

    if (ids.length) {
      const { data, error } = await supabase
        .from("assessment_answers")
        .select(
          "attempt_question_id,selected_answers,subjective_answer,coding_answer,answered_at",
        )
        .in("attempt_question_id", ids);

      if (error) throw error;
      answers = data || [];
    }

    const answerMap = new Map(
      answers.map((row) => [String(row.attempt_question_id), row]),
    );

    const questionReview = (questions || []).map((question) => {
      const answer = answerMap.get(String(question.id));
      const selected = Array.isArray(answer?.selected_answers)
        ? answer.selected_answers
        : [];

      const frozenCorrect = Array.isArray(question.correct_answers)
        ? question.correct_answers.filter(
            (value) => value !== null && value !== undefined && value !== "",
          )
        : [];

      const sourceCorrect = Array.isArray(question.questions?.correct_answers)
        ? question.questions.correct_answers
        : question.questions?.correct_answers == null
          ? []
          : [question.questions.correct_answers];

      const correctAnswers =
        frozenCorrect.length > 0
          ? frozenCorrect
          : originalCorrectKeys(
              sourceCorrect,
              question.questions?.options,
              question.shuffled_options,
            );

      const opts = optionObject(question.shuffled_options);
      const answered =
        selected.length > 0 ||
        (typeof answer?.subjective_answer === "string" &&
          answer.subjective_answer.trim().length > 0) ||
        (typeof answer?.coding_answer === "string" &&
          answer.coding_answer.trim().length > 0);

      const isCorrect =
        selected.length > 0 &&
        correctAnswers.length > 0 &&
        JSON.stringify(answerSet(selected)) ===
          JSON.stringify(answerSet(correctAnswers));

      const storedMarks = Number(question.marks);
      const marks =
        Number.isFinite(storedMarks) && storedMarks > 0
          ? storedMarks
          : Math.max(0.01, Number(assessment.marks_per_question ?? 1));

      const storedNegative = Number(question.negative_marks);
      const negative =
        Number.isFinite(storedNegative) && storedNegative >= 0
          ? storedNegative
          : Math.max(0, Number(assessment.negative_marks ?? 0));

      return {
        id: question.id,
        questionId: question.question_id,
        questionNumber: Number(question.question_order || 0),
        questionText: question.questions?.question_text || "Question",
        questionType: question.questions?.question_type || "MCQ",
        selectedAnswers: selected,
        selectedDisplay: answerDisplay(selected, opts),
        correctAnswers,
        correctDisplay: answerDisplay(correctAnswers, opts),
        answered,
        result: !answered ? "UNANSWERED" : isCorrect ? "CORRECT" : "WRONG",
        marksAwarded: !answered ? 0 : isCorrect ? marks : -negative,
        answeredAt: answer?.answered_at || null,
        markedForReview:
          question.assessment_question_flags?.marked_for_review ?? false,
      };
    });

    const [
      { data: infractions, error: infractionError },
      { data: activities, error: activityError },
    ] = await Promise.all([
      supabase
        .from("assessment_infractions")
        .select("id,type,details,occurred_at")
        .eq("attempt_id", attemptId)
        .order("occurred_at", { ascending: true }),
      supabase
        .from("assessment_activity")
        .select("activity_type,metadata,created_at")
        .eq("attempt_id", attemptId)
        .order("created_at", { ascending: true }),
    ]);

    if (infractionError) throw infractionError;
    if (activityError) throw activityError;

    const answeredCount = questionReview.filter((q) => q.answered).length;
    const correctCount = questionReview.filter(
      (q) => q.result === "CORRECT",
    ).length;
    const wrongCount = questionReview.filter(
      (q) => q.result === "WRONG",
    ).length;

    return res.json({
      success: true,
      student,
      team:
        team && team.mode === "TEAM" && !(team.members || []).length
          ? {
              ...team,
              members: team.contact_email
                ? [
                    {
                      id: `contact-${team.id}`,
                      name: "Team Member",
                      roll_no: "",
                      email: team.contact_email,
                      branch: team.branch,
                    },
                  ]
                : [],
            }
          : team,
      attempt: {
        ...attempt,
        // Never expose a stale current question after submission.
        currentQuestion:
          attempt.status === "IN_PROGRESS"
            ? Number(attempt.current_question || 0)
            : 0,
        answeredQuestions: answeredCount,
      },
      timeline: {
        loggedInAt: student?.first_login_at || null,
        startedAt: attempt.started_at,
        assessmentStartedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
      },
      statistics: {
        questionsAnswered: answeredCount,
        correct: correctCount,
        wrong: wrongCount,
        unanswered: questionReview.length - answeredCount,
        score: Number(attempt.score || 0),
        violations: infractions?.length || 0,
      },
      infractions: infractions || [],
      activities: activities || [],
      questions: questionReview,
    });
  } catch (error) {
    console.error("[LIVE MONITOR DETAILS ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load participant details.",
    });
  }
};

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
      .select(
        "id,title,duration_minutes,live_updates_enabled,participation_mode",
      )
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
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("assessment_id", assessmentId)
      .order("started_at", { ascending: true });

    if (attemptsError) throw attemptsError;

    await reconcileExpiredAttempts(attempts);

    const { data: current, error: currentError } = await supabase
      .from("assessment_attempts")
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("assessment_id", assessmentId)
      .order("started_at", { ascending: true });

    if (currentError) throw currentError;

    const students = await getStudents(assessmentId);
    const teamList = await getTeams(assessmentId);
    const { byStudent, byTeam } = latestAttempts(current);

    const attemptIds = [
      ...new Set(
        [
          ...students.map((student) => byStudent.get(student.id)?.id),
          ...teamList.map((team) => byTeam.get(team.id)?.id),
        ].filter(Boolean),
      ),
    ];

    const counts = await getBatchedCounts(attemptIds);
    const rows = [];

    if (assessment.participation_mode === "INDIVIDUAL_STUDENTS") {
      for (const student of students) {
        rows.push({
          ...(await buildState(byStudent.get(student.id), counts)),
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
      for (const team of teamList) {
        const state = await buildState(byTeam.get(team.id), counts);

        for (const member of team.members || []) {
          const student = students.find(
            (item) =>
              String(item.email || "").toLowerCase() ===
              String(member.email || "").toLowerCase(),
          );

          rows.push({
            ...state,
            studentId: student?.id || member.id,
            studentName: member.name,
            rollNo: member.roll_no || "",
            email: member.email || "",
            department: member.branch || team.branch || "",
            teamId: team.id,
            teamName: team.team_name,
            teamMemberCount: Number(
              team.member_count || team.members.length || 0,
            ),
            members: team.members,
          });
        }
      }
    } else {
      for (const team of teamList) {
        rows.push({
          ...(await buildState(byTeam.get(team.id), counts)),
          studentId: "",
          studentName: team.team_name,
          rollNo: "",
          email: team.contact_email || "",
          department: team.branch || "",
          teamId: team.id,
          teamName: team.team_name,
          teamMemberCount: Number(
            team.member_count || (team.contact_email ? 1 : 0),
          ),
          members: team.members,
        });
      }
    }

    return res.json({
      success: true,
      liveUpdatesEnabled: assessment.live_updates_enabled !== false,
      totalStudents: rows.length,
      students: rows,
    });
  } catch (error) {
    console.error("[LIVE MONITOR ERROR]", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Unable to load live monitor.",
    });
  }
};
