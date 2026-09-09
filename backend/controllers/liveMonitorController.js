const { supabase } = require("../lib/supabase");
const { getSecondsRemaining } = require("../lib/redis");
const scoring = require("../services/scoringService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");

const remaining = async (attempt) => {
  if (!attempt?.expires_at) return 0;
  try {
    if (attempt.started_at) {
      const duration = Math.max(
        0,
        Math.floor(
          (new Date(attempt.expires_at) - new Date(attempt.started_at)) / 1000,
        ),
      );
      const value = await getSecondsRemaining(attempt.id, duration);
      if (Number.isFinite(Number(value))) return Math.max(0, Number(value));
    }
  } catch (e) {
    console.warn("Redis timer unavailable:", e.message);
  }
  return Math.max(
    0,
    Math.floor((new Date(attempt.expires_at) - Date.now()) / 1000),
  );
};

const studentMap = async (assessmentId) => {
  const { data, error } = await supabase
    .from("assessment_allowed_students")
    .select("id,name,roll_no,email,branch,status,first_login_at,team_id")
    .eq("assessment_id", assessmentId);
  if (error) throw error;
  return new Map((data || []).map((x) => [x.id, x]));
};

const teams = async (assessmentId) => {
  const { data, error } = await supabase
    .from("assessment_teams")
    .select("id,team_name,contact_email,member_count,branch,mode")
    .eq("assessment_id", assessmentId)
    .order("created_at");
  if (error) throw error;
  const list = data || [],
    ids = list.map((x) => x.id);
  if (!ids.length) return [];
  const { data: members, error: me } = await supabase
    .from("assessment_team_members")
    .select("id,team_id,name,roll_no,email,branch")
    .in("team_id", ids)
    .order("created_at");
  if (me) throw me;
  const by = new Map();
  for (const m of members || []) {
    if (!by.has(m.team_id)) by.set(m.team_id, []);
    by.get(m.team_id).push(m);
  }
  return list.map((x) => ({ ...x, members: by.get(x.id) || [] }));
};

const countAnswers = async (attemptIds) => {
  const result = new Map();
  if (!attemptIds.length) return result;
  const { data: aq, error: qe } = await supabase
    .from("assessment_attempt_questions")
    .select("id,attempt_id")
    .in("attempt_id", attemptIds);
  if (qe) throw qe;
  const ids = (aq || []).map((x) => x.id);
  if (!ids.length) return result;
  const owner = new Map((aq || []).map((x) => [String(x.id), x.attempt_id]));
  const { data: answers, error: ae } = await supabase
    .from("assessment_answers")
    .select(
      "attempt_question_id,selected_answers,subjective_answer,coding_answer",
    )
    .in("attempt_question_id", ids);
  if (ae) throw ae;
  for (const a of answers || []) {
    const answered =
      (Array.isArray(a.selected_answers) && a.selected_answers.length) ||
      (typeof a.subjective_answer === "string" && a.subjective_answer.trim()) ||
      (typeof a.coding_answer === "string" && a.coding_answer.trim());
    if (!answered) continue;
    const id = owner.get(String(a.attempt_question_id));
    if (id) result.set(id, (result.get(id) || 0) + 1);
  }
  return result;
};

const latest = (attempts) => {
  const byStudent = new Map(),
    byTeam = new Map();
  for (const a of attempts || []) {
    if (a.student_id) {
      const old = byStudent.get(a.student_id);
      if (!old || new Date(a.started_at || 0) > new Date(old.started_at || 0))
        byStudent.set(a.student_id, a);
    }
    if (a.team_id) {
      const old = byTeam.get(a.team_id);
      if (!old || new Date(a.started_at || 0) > new Date(old.started_at || 0))
        byTeam.set(a.team_id, a);
    }
  }
  return { byStudent, byTeam };
};

async function reconcile(attempts) {
  const grace = 120000,
    now = Date.now();
  for (const a of attempts || []) {
    if (
      a.status !== "IN_PROGRESS" ||
      !a.expires_at ||
      now - new Date(a.expires_at).getTime() < grace
    )
      continue;
    try {
      const result = await scoring.calculateScore(a.id);
      const updated = await engine.finishAttempt(a.id, result, "SUBMITTED");
      await supabase.from("assessment_activity").insert({
        attempt_id: a.id,
        activity_type: "AUTO_SUBMIT",
        metadata: { source: "server_reconciliation", reason: "TIME_EXPIRED" },
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
    } catch (e) {
      console.error("Expired reconciliation failed:", a.id, e.message);
    }
  }
}

exports.getLiveStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId)
      return res
        .status(400)
        .json({ success: false, message: "Assessment ID is required." });

    const { data: assessment, error: ae } = await supabase
      .from("assessments")
      .select(
        "id,title,duration_minutes,live_updates_enabled,participation_mode",
      )
      .eq("id", assessmentId)
      .single();
    if (ae || !assessment)
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });

    const { data: attempts, error: te } = await supabase
      .from("assessment_attempts")
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("assessment_id", assessmentId)
      .order("started_at");
    if (te) throw te;

    await reconcile(attempts);

    const { data: current, error: ce } = await supabase
      .from("assessment_attempts")
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("assessment_id", assessmentId)
      .order("started_at");
    if (ce) throw ce;

    const students = [...(await studentMap(assessmentId)).values()];
    const teamList = await teams(assessmentId);
    const { byStudent, byTeam } = latest(current);
    const ids = [
      ...new Set(
        [
          ...students.map((s) => byStudent.get(s.id)?.id),
          ...teamList.map((t) => byTeam.get(t.id)?.id),
        ].filter(Boolean),
      ),
    ];
    const answers = await countAnswers(ids);

    const state = async (a) => {
      if (!a)
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
        };
      const [{ count: total, error: qe }, { count: violations, error: ve }] =
        await Promise.all([
          supabase
            .from("assessment_attempt_questions")
            .select("id", { count: "exact", head: true })
            .eq("attempt_id", a.id),
          supabase
            .from("assessment_infractions")
            .select("id", { count: "exact", head: true })
            .eq("attempt_id", a.id),
        ]);
      if (qe) throw qe;
      if (ve) console.warn("Infraction count unavailable:", ve.message);
      const seconds = await remaining(a);
      return {
        attemptId: a.id,
        currentQuestion: Number(a.current_question || 0),
        answeredQuestions: Math.max(
          Number(a.answered_questions || 0),
          Number(answers.get(a.id) || 0),
        ),
        totalQuestions: Number(total || 0),
        score: Number(a.score || 0),
        remainingSeconds: seconds,
        status: a.status === "IN_PROGRESS" ? "LIVE" : "SUBMITTED",
        isExpired: seconds <= 0 && a.status === "IN_PROGRESS",
        startedAt: a.started_at || null,
        submittedAt: a.submitted_at || null,
        resumedCount: Number(a.resumed_count || 0),
        violations: Number(ve ? 0 : violations || 0),
      };
    };

    const rows = [];
    if (assessment.participation_mode === "INDIVIDUAL_STUDENTS") {
      for (const s of students)
        rows.push({
          ...(await state(byStudent.get(s.id))),
          studentId: s.id,
          studentName: s.name,
          rollNo: s.roll_no || "",
          email: s.email || "",
          department: s.branch || "",
          teamId: null,
          teamName: null,
          teamMemberCount: 0,
          members: [],
        });
    } else if (assessment.participation_mode === "STUDENT_TEAMS") {
      for (const t of teamList) {
        const st = await state(byTeam.get(t.id));
        for (const m of t.members || []) {
          const s = students.find(
            (x) =>
              String(x.email || "").toLowerCase() ===
              String(m.email || "").toLowerCase(),
          );
          rows.push({
            ...st,
            studentId: s?.id || m.id,
            studentName: m.name,
            rollNo: m.roll_no || "",
            email: m.email || "",
            department: m.branch || t.branch || "",
            teamId: t.id,
            teamName: t.team_name,
            teamMemberCount: Number(t.member_count || t.members.length || 0),
            members: t.members,
          });
        }
      }
    } else {
      for (const t of teamList)
        rows.push({
          ...(await state(byTeam.get(t.id))),
          studentId: "",
          studentName: t.team_name,
          rollNo: "",
          email: t.contact_email || "",
          department: t.branch || "",
          teamId: t.id,
          teamName: t.team_name,
          teamMemberCount: Number(t.member_count || 0),
          members: t.members || [],
        });
    }

    return res.json({
      success: true,
      liveUpdatesEnabled: assessment.live_updates_enabled !== false,
      totalStudents: rows.length,
      students: rows,
    });
  } catch (error) {
    console.error("LIVE MONITOR ERROR:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Unable to load live monitor.",
      });
  }
};

const norm = (v) => {
  if (typeof v === "number") return v;
  if (typeof v === "string") {
    const s = v.trim().toUpperCase(),
      map = { A: 0, B: 1, C: 2, D: 3 };
    if (map[s] !== undefined) return map[s];
    if (/^\d+$/.test(s)) return Number(s);
  }
  return v;
};
const set = (v) =>
  (Array.isArray(v) ? v : v == null ? [] : [v])
    .map(norm)
    .sort((a, b) =>
      typeof a === "number" && typeof b === "number"
        ? a - b
        : String(a).localeCompare(String(b)),
    );
const options = (v) =>
  Array.isArray(v)
    ? v.map((x, i) => ({
        key: String.fromCharCode(65 + i),
        text: String(x ?? ""),
      }))
    : v && typeof v === "object"
      ? Object.entries(v).map(([key, text]) => ({
          key,
          text: String(text ?? ""),
        }))
      : [];
const display = (values, opts) =>
  (Array.isArray(values) ? values : []).map((v) => {
    const n = norm(v);
    if (typeof n === "number" && opts[n])
      return `${opts[n].key}. ${opts[n].text}`;
    const x = opts.find((o) => o.key.toUpperCase() === String(n).toUpperCase());
    return x ? `${x.key}. ${x.text}` : String(v);
  });

exports.getStudentDetails = async (req, res) => {
  try {
    const { attemptId } = req.params;
    if (!attemptId)
      return res
        .status(400)
        .json({ success: false, message: "Attempt ID is required." });
    const { data: attempt, error: ae } = await supabase
      .from("assessment_attempts")
      .select(
        "id,assessment_id,student_id,team_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status",
      )
      .eq("id", attemptId)
      .single();
    if (ae || !attempt)
      return res
        .status(404)
        .json({ success: false, message: "Assessment attempt not found." });

    const [sm, teamList] = await Promise.all([
      studentMap(attempt.assessment_id),
      teams(attempt.assessment_id),
    ]);
    const student = sm.get(attempt.student_id) || null;
    const team = attempt.team_id
      ? teamList.find((x) => x.id === attempt.team_id) || null
      : null;

    const { data: aq, error: qe } = await supabase
      .from("assessment_attempt_questions")
      .select(
        "id,question_id,question_order,shuffled_options,correct_answers,marks,negative_marks,questions(question_text,question_type,options),assessment_question_flags(marked_for_review,answered,visited)",
      )
      .eq("attempt_id", attemptId)
      .order("question_order");
    if (qe) throw qe;

    const ids = (aq || []).map((x) => x.id);
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
      answers.map((x) => [String(x.attempt_question_id), x]),
    );

    const questions = (aq || []).map((q) => {
      const a = answerMap.get(String(q.id));
      const selected = Array.isArray(a?.selected_answers)
        ? a.selected_answers
        : [];
      const correctAnswers = Array.isArray(q.correct_answers)
        ? q.correct_answers
        : [];
      const opts = options(q.shuffled_options || q.questions?.options);
      const answered =
        selected.length > 0 ||
        Boolean(
          typeof a?.subjective_answer === "string" &&
          a.subjective_answer.trim(),
        ) ||
        Boolean(typeof a?.coding_answer === "string" && a.coding_answer.trim());
      const correct =
        answered &&
        selected.length > 0 &&
        JSON.stringify(set(selected)) === JSON.stringify(set(correctAnswers));
      const marks = Math.max(0, Number(q.marks ?? 0));
      const negative = Math.max(0, Number(q.negative_marks ?? 0));
      return {
        id: q.id,
        questionId: q.question_id,
        questionNumber: Number(q.question_order || 0) + 1,
        questionText: q.questions?.question_text || "Question",
        questionType: q.questions?.question_type || "MCQ",
        selectedAnswers: selected,
        selectedDisplay: display(selected, opts),
        correctAnswers,
        correctDisplay: display(correctAnswers, opts),
        answered,
        result: !answered ? "UNANSWERED" : correct ? "CORRECT" : "WRONG",
        marksAwarded: !answered ? 0 : correct ? marks : -negative,
        answeredAt: a?.answered_at || null,
        markedForReview:
          q.assessment_question_flags?.marked_for_review ?? false,
      };
    });

    const infractions =
      (
        await supabase
          .from("assessment_infractions")
          .select("id,type,details,occurred_at")
          .eq("attempt_id", attemptId)
          .order("occurred_at")
      ).data || [];
    const activities =
      (
        await supabase
          .from("assessment_activity")
          .select("activity_type,metadata,created_at")
          .eq("attempt_id", attemptId)
          .order("created_at")
      ).data || [];
    const answeredCount = questions.filter((q) => q.answered).length;
    const correctCount = questions.filter((q) => q.result === "CORRECT").length;
    const wrongCount = questions.filter((q) => q.result === "WRONG").length;

    return res.json({
      success: true,
      student,
      team,
      attempt: {
        ...attempt,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        expiresAt: attempt.expires_at,
        resumedCount: Number(attempt.resumed_count || 0),
        currentQuestion: Number(attempt.current_question || 0),
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
        unanswered: questions.length - answeredCount,
        score: Number(attempt.score || 0),
        violations: infractions.length,
      },
      infractions,
      activities,
      questions,
    });
  } catch (error) {
    console.error("LIVE STUDENT DETAILS ERROR:", error);
    return res
      .status(500)
      .json({
        success: false,
        message: error.message || "Unable to load participant details.",
      });
  }
};
