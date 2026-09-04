const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { supabase } = require("../lib/supabase");

const MODES = {
  INDIVIDUAL: "INDIVIDUAL_STUDENTS",
  STUDENT_TEAMS: "STUDENT_TEAMS",
  TEAM: "TEAM",
};

const safeFilename = (value) =>
  String(value || "assessment")
    .replace(/[^a-z0-9._-]+/gi, "_")
    .slice(0, 100);

const toNumber = (value) =>
  Number.isFinite(Number(value)) ? Number(value) : 0;

const formatTime = (seconds) => {
  const n = Math.max(0, Number(seconds || 0));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
};

const normalizeAnswer = (value) => {
  if (typeof value === "number") {
    return value >= 0 && value < 4
      ? String.fromCharCode(65 + value)
      : String(value);
  }
  const text = String(value ?? "")
    .trim()
    .toUpperCase();
  if (/^[A-D]$/.test(text)) return text;
  if (/^\d+$/.test(text) && Number(text) < 4) {
    return String.fromCharCode(65 + Number(text));
  }
  return text;
};

const normalizeAnswers = (value) =>
  (Array.isArray(value) ? value : value == null ? [] : [value])
    .map(normalizeAnswer)
    .filter(Boolean)
    .sort();

const latestBy = (items, keyFn) => {
  const map = new Map();
  for (const item of items || []) {
    const key = keyFn(item);
    if (!key) continue;
    const old = map.get(key);
    const itemTime = new Date(
      item.submitted_at || item.started_at || 0,
    ).getTime();
    const oldTime = old
      ? new Date(old.submitted_at || old.started_at || 0).getTime()
      : -1;
    if (!old || itemTime > oldTime) map.set(key, item);
  }
  return map;
};

async function getExportData(assessmentId) {
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();
  if (assessmentError || !assessment) {
    throw assessmentError || new Error("Assessment not found.");
  }

  const mode = assessment.participation_mode || MODES.INDIVIDUAL;

  const { data: mappings, error: mappingError } = await supabase
    .from("assessment_question_banks")
    .select("questions_to_pick")
    .eq("assessment_id", assessmentId);
  if (mappingError) throw mappingError;

  const totalQuestions =
    (mappings || []).reduce(
      (sum, row) => sum + toNumber(row.questions_to_pick),
      0,
    ) || toNumber(assessment.total_questions);

  const { data: students, error: studentsError } = await supabase
    .from("assessment_allowed_students")
    .select(
      "id,name,roll_no,email,branch,has_logged_in,first_login_at,status,team_id",
    )
    .eq("assessment_id", assessmentId);
  if (studentsError) throw studentsError;

  const { data: teams, error: teamsError } = await supabase
    .from("assessment_teams")
    .select("id,team_name,contact_email,branch,member_count,mode")
    .eq("assessment_id", assessmentId)
    .order("created_at");
  if (teamsError) throw teamsError;

  const teamIds = (teams || []).map((team) => team.id);
  let teamMembers = [];
  if (teamIds.length) {
    const { data, error } = await supabase
      .from("assessment_team_members")
      .select("team_id,name,roll_no,email,branch")
      .in("team_id", teamIds)
      .order("created_at");
    if (error) throw error;
    teamMembers = data || [];
  }

  const membersByTeam = new Map();
  for (const member of teamMembers) {
    if (!membersByTeam.has(member.team_id))
      membersByTeam.set(member.team_id, []);
    membersByTeam.get(member.team_id).push(member);
  }

  const teamMap = new Map(
    (teams || []).map((team) => [
      team.id,
      { ...team, members: membersByTeam.get(team.id) || [] },
    ]),
  );

  const { data: attempts, error: attemptsError } = await supabase
    .from("assessment_attempts")
    .select(
      "id,student_id,team_id,status,score,correct,wrong,unanswered,percentage,started_at,submitted_at,completed_at",
    )
    .eq("assessment_id", assessmentId);
  if (attemptsError) throw attemptsError;

  const attemptIds = (attempts || []).map((attempt) => attempt.id);
  const { data: activities, error: activityError } = attemptIds.length
    ? await supabase
        .from("assessment_activity")
        .select("attempt_id,activity_type,occurred_at,metadata")
        .in("attempt_id", attemptIds)
    : { data: [], error: null };
  if (activityError) throw activityError;

  const activityMap = new Map();
  for (const activity of activities || []) {
    if (!activityMap.has(activity.attempt_id)) {
      activityMap.set(activity.attempt_id, []);
    }
    activityMap.get(activity.attempt_id).push(activity);
  }

  const studentMap = new Map(
    (students || []).map((student) => [student.id, student]),
  );
  const attemptByStudent = latestBy(attempts, (attempt) => attempt.student_id);
  const attemptByTeam = latestBy(attempts, (attempt) => attempt.team_id);

  const buildResult = (student, attempt, team = null) => {
    const activitiesForAttempt = activityMap.get(attempt?.id) || [];
    const timeTaken =
      attempt?.started_at && attempt?.submitted_at
        ? Math.max(
            0,
            Math.floor(
              (new Date(attempt.submitted_at) - new Date(attempt.started_at)) /
                1000,
            ),
          )
        : 0;

    const completionReason = activitiesForAttempt.some(
      (item) => item.activity_type === "FORCE_SUBMIT",
    )
      ? "Admin Force Submit"
      : activitiesForAttempt.some(
            (item) => item.activity_type === "SECURITY_AUTO_SUBMIT",
          )
        ? "Security Auto Submit"
        : activitiesForAttempt.some(
              (item) => item.activity_type === "AUTO_SUBMIT",
            )
          ? "Time Expired"
          : "";

    const members = team?.members || [];
    const isTeam = Boolean(team);

    return {
      participantType: mode,
      participantId: team?.id || student?.id || "",
      teamId: team?.id || null,
      teamName: team?.team_name || "",
      teamMemberCount: Number(team?.member_count || members.length || 0),
      members,
      memberNames: members.map((member) => member.name).join("; "),
      memberRollNos: members.map((member) => member.roll_no).join("; "),
      memberEmails: members.map((member) => member.email).join("; "),
      memberBranches: members.map((member) => member.branch || "").join("; "),
      name: isTeam ? team.team_name : student?.name || "",
      rollNo: isTeam ? "" : student?.roll_no || "",
      email: isTeam ? team.contact_email : student?.email || "",
      branch: isTeam ? team.branch || "" : student?.branch || "",
      loginStatus: student?.has_logged_in ? "Logged In" : "Not Logged In",
      attemptStatus: attempt?.status || "NOT STARTED",
      score: toNumber(attempt?.score),
      correct: toNumber(attempt?.correct),
      wrong: toNumber(attempt?.wrong),
      unanswered: toNumber(attempt?.unanswered),
      percentage: toNumber(attempt?.percentage),
      timeTakenSeconds: timeTaken,
      startedAt: attempt?.started_at || "",
      submittedAt: attempt?.submitted_at || "",
      completionReason,
    };
  };

  let rows;
  if (mode === MODES.INDIVIDUAL) {
    rows = (students || []).map((student) =>
      buildResult(student, attemptByStudent.get(student.id)),
    );
  } else {
    rows = (teams || []).map((team) => {
      const members = teamMap.get(team.id)?.members || [];
      const representative = members
        .map((member) => studentMap.get(member.id))
        .find(Boolean);
      const student =
        representative ||
        (students || []).find((item) => item.team_id === team.id) ||
        null;
      return buildResult(
        student,
        attemptByTeam.get(team.id),
        teamMap.get(team.id),
      );
    });
  }

  const submittedAttemptIds = (attempts || [])
    .filter((attempt) => attempt.status !== "IN_PROGRESS")
    .map((attempt) => attempt.id);

  let questionAnalysis = [];
  if (submittedAttemptIds.length) {
    const { data: questionRows, error: questionError } = await supabase
      .from("assessment_attempt_questions")
      .select(
        "id,attempt_id,question_id,question_order,correct_answers,assessment_answers(selected_answers)",
      )
      .in("attempt_id", submittedAttemptIds);
    if (questionError) throw questionError;

    const map = new Map();
    for (const question of questionRows || []) {
      const key =
        question.question_id ||
        `${question.attempt_id}:${question.question_order}`;
      if (!map.has(key)) {
        map.set(key, {
          questionNumber: question.question_order,
          questionId: question.question_id,
          attempts: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
        });
      }
      const stat = map.get(key);
      stat.attempts += 1;
      const selected = normalizeAnswers(
        question.assessment_answers?.[0]?.selected_answers,
      );
      const expected = normalizeAnswers(question.correct_answers);
      if (!selected.length) stat.skipped += 1;
      else if (JSON.stringify(selected) === JSON.stringify(expected))
        stat.correct += 1;
      else stat.wrong += 1;
    }

    questionAnalysis = [...map.values()]
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map((question) => ({
        ...question,
        correctPercentage: question.attempts
          ? Number(((question.correct / question.attempts) * 100).toFixed(2))
          : 0,
        wrongPercentage: question.attempts
          ? Number(((question.wrong / question.attempts) * 100).toFixed(2))
          : 0,
        skippedPercentage: question.attempts
          ? Number(((question.skipped / question.attempts) * 100).toFixed(2))
          : 0,
      }));
  }

  const submitted = rows.filter((row) => row.attemptStatus === "SUBMITTED");
  const maxMarks =
    totalQuestions * Math.max(0, toNumber(assessment.marks_per_question ?? 1));
  const averageScore = submitted.length
    ? submitted.reduce((sum, row) => sum + row.score, 0) / submitted.length
    : 0;
  const passed = submitted.filter(
    (row) => row.percentage >= toNumber(assessment.pass_percentage ?? 40),
  ).length;

  const leaderboard = [...submitted]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.timeTakenSeconds - b.timeTakenSeconds ||
        a.name.localeCompare(b.name),
    )
    .map((row, index) => ({ ...row, rank: index + 1 }));

  return {
    assessment: { ...assessment, total_questions: totalQuestions },
    mode,
    rows,
    questionAnalysis,
    leaderboard,
    summary: {
      registered: rows.length,
      completed: submitted.length,
      submitted: submitted.length,
      inProgress: rows.filter((row) => row.attemptStatus === "IN_PROGRESS")
        .length,
      averageScore: Number(averageScore.toFixed(2)),
      highestScore: submitted.length
        ? Math.max(...submitted.map((row) => row.score))
        : 0,
      passRate: submitted.length
        ? Number(((passed / submitted.length) * 100).toFixed(2))
        : 0,
      maxMarks,
    },
  };
}

function getExportColumns(mode) {
  if (mode === MODES.STUDENT_TEAMS) {
    return [
      ["Rank", "rank"],
      ["Team Name", "teamName"],
      ["Member Count", "teamMemberCount"],
      ["Member Names", "memberNames"],
      ["Member Roll Nos", "memberRollNos"],
      ["Member Emails", "memberEmails"],
      ["Member Branches", "memberBranches"],
      ["Team Contact Email", "email"],
      ["Team Branch", "branch"],
      ["Login", "loginStatus"],
      ["Attempt Status", "attemptStatus"],
      ["Score", "score"],
      ["Correct", "correct"],
      ["Wrong", "wrong"],
      ["Unanswered", "unanswered"],
      ["Percentage", "percentage"],
      ["Time (sec)", "timeTakenSeconds"],
      ["Started At", "startedAt"],
      ["Submitted At", "submittedAt"],
      ["Completion Reason", "completionReason"],
    ];
  }

  if (mode === MODES.TEAM) {
    return [
      ["Rank", "rank"],
      ["Team Name", "teamName"],
      ["Email", "email"],
      ["Branch", "branch"],
      ["Login", "loginStatus"],
      ["Attempt Status", "attemptStatus"],
      ["Score", "score"],
      ["Correct", "correct"],
      ["Wrong", "wrong"],
      ["Unanswered", "unanswered"],
      ["Percentage", "percentage"],
      ["Time (sec)", "timeTakenSeconds"],
      ["Started At", "startedAt"],
      ["Submitted At", "submittedAt"],
      ["Completion Reason", "completionReason"],
    ];
  }

  return [
    ["Rank", "rank"],
    ["Name", "name"],
    ["Roll No", "rollNo"],
    ["Email", "email"],
    ["Branch", "branch"],
    ["Login", "loginStatus"],
    ["Attempt Status", "attemptStatus"],
    ["Score", "score"],
    ["Correct", "correct"],
    ["Wrong", "wrong"],
    ["Unanswered", "unanswered"],
    ["Percentage", "percentage"],
    ["Time (sec)", "timeTakenSeconds"],
    ["Started At", "startedAt"],
    ["Submitted At", "submittedAt"],
    ["Completion Reason", "completionReason"],
  ];
}

function getRound2Rows(mode, rows) {
  if (mode === MODES.STUDENT_TEAMS) {
    return rows.flatMap((row) =>
      (row.members || []).map((member) => ({
        teamName: row.teamName,
        name: member.name,
        rollNo: member.roll_no,
        email: member.email,
        branch: member.branch || row.branch || "",
      })),
    );
  }

  if (mode === MODES.TEAM) {
    return rows.map((row) => ({
      teamName: row.teamName,
      email: row.email,
      branch: row.branch,
    }));
  }

  return rows.map((row) => ({
    name: row.name,
    rollNo: row.rollNo,
    email: row.email,
    branch: row.branch,
  }));
}

exports.exportExcel = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessment, mode, rows, questionAnalysis, leaderboard, summary } =
      await getExportData(assessmentId);

    const wb = new ExcelJS.Workbook();
    wb.creator = "IEEE SPS Assessment Platform";
    wb.created = new Date();

    const info = wb.addWorksheet("Summary");
    info.columns = [
      { header: "Metric", key: "metric", width: 30 },
      { header: "Value", key: "value", width: 32 },
    ];
    [
      ["Assessment", assessment.title],
      ["Participation Mode", mode],
      ["Start", assessment.start_time || ""],
      ["End", assessment.end_time || ""],
      ["Total Questions", assessment.total_questions],
      ["Duration (minutes)", assessment.duration_minutes],
      ["Marks Per Question", assessment.marks_per_question],
      ["Maximum Marks", summary.maxMarks],
      ["Passing Percentage", assessment.pass_percentage],
      ["Registered", summary.registered],
      ["Submitted", summary.submitted],
      ["In Progress", summary.inProgress],
      ["Average Score", summary.averageScore],
      ["Highest Score", summary.highestScore],
      ["Pass Rate", `${summary.passRate}%`],
    ].forEach(([metric, value]) => info.addRow({ metric, value }));

    const columns = getExportColumns(mode);
    const sheet = wb.addWorksheet("Results");
    sheet.columns = columns.map(([header, key]) => ({
      header,
      key,
      width: Math.min(42, Math.max(12, header.length + 4)),
    }));

    const rankMap = new Map(
      leaderboard.map((row) => [row.participantId, row.rank]),
    );
    rows.forEach((row) => {
      sheet.addRow({ ...row, rank: rankMap.get(row.participantId) || "" });
    });
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = `A1:${String.fromCharCode(64 + columns.length)}1`;

    const q = wb.addWorksheet("Question Analysis");
    q.columns = [
      { header: "Question #", key: "questionNumber", width: 12 },
      { header: "Attempts", key: "attempts", width: 12 },
      { header: "Correct", key: "correct", width: 12 },
      { header: "Wrong", key: "wrong", width: 12 },
      { header: "Skipped", key: "skipped", width: 12 },
      { header: "Correct %", key: "correctPercentage", width: 14 },
      { header: "Wrong %", key: "wrongPercentage", width: 14 },
      { header: "Skipped %", key: "skippedPercentage", width: 14 },
    ];
    questionAnalysis.forEach((question) => q.addRow(question));
    q.views = [{ state: "frozen", ySplit: 1 }];

    for (const worksheet of [info, sheet, q]) {
      worksheet.getRow(1).font = { bold: true };
      worksheet.getRow(1).alignment = { vertical: "middle" };
      worksheet.eachRow((row) => {
        row.alignment = { vertical: "top", wrapText: true };
      });
    }

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename(assessment.title)}-results.xlsx"`,
    );
    await wb.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("EXPORT EXCEL ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessment, mode, rows, leaderboard } =
      await getExportData(assessmentId);
    const columns = getExportColumns(mode);
    const rankMap = new Map(
      leaderboard.map((row) => [row.participantId, row.rank]),
    );
    const esc = (value) => `"${String(value ?? "").replace(/"/g, '""')}"`;
    const csv = [
      columns.map(([header]) => esc(header)).join(","),
      ...rows.map((row) =>
        columns
          .map(([, key]) =>
            esc(
              key === "rank" ? rankMap.get(row.participantId) || "" : row[key],
            ),
          )
          .join(","),
      ),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename(assessment.title)}-results.csv"`,
    );
    res.send(csv);
  } catch (err) {
    console.error("EXPORT CSV ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessment, mode, rows, leaderboard, summary } =
      await getExportData(assessmentId);
    const doc = new PDFDocument({
      size: "A4",
      layout: "landscape",
      margin: 36,
      bufferPages: true,
    });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${safeFilename(assessment.title)}-results.pdf"`,
    );
    doc.pipe(res);

    const navy = "#0B3558";
    const blue = "#00629B";
    const muted = "#64748B";
    const light = "#F1F5F9";
    const pageW = doc.page.width;
    const pageH = doc.page.height;
    const usable = pageW - 72;

    const modeLabel =
      mode === MODES.STUDENT_TEAMS
        ? "Student Teams"
        : mode === MODES.TEAM
          ? "Team"
          : "Individual Students";

    const header = () => {
      doc.rect(0, 0, pageW, 76).fill(navy);
      doc
        .fillColor("white")
        .fontSize(20)
        .font("Helvetica-Bold")
        .text("IEEE SPS", 36, 24);
      doc
        .fontSize(10)
        .font("Helvetica")
        .text(`${modeLabel.toUpperCase()} ASSESSMENT REPORT`, 36, 49);
      doc
        .fontSize(18)
        .font("Helvetica-Bold")
        .text(assessment.title || "Assessment", 250, 26, {
          width: pageW - 286,
          align: "right",
        });
      doc
        .fontSize(9)
        .font("Helvetica")
        .text(`Generated ${new Date().toLocaleString()}`, 250, 50, {
          width: pageW - 286,
          align: "right",
        });
    };

    const participantTitle =
      mode === MODES.STUDENT_TEAMS
        ? "Team / Members"
        : mode === MODES.TEAM
          ? "Team"
          : "Student";

    header();
    doc
      .fillColor("#0F172A")
      .font("Helvetica-Bold")
      .fontSize(22)
      .text("Executive Summary", 36, 102);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor(muted)
      .text(
        `${assessment.start_time ? new Date(assessment.start_time).toLocaleString() : ""}  →  ${assessment.end_time ? new Date(assessment.end_time).toLocaleString() : ""}`,
        36,
        130,
      );

    const cards = [
      ["Participants / Teams", summary.registered],
      ["Submitted", summary.submitted],
      ["Average Score", summary.averageScore],
      ["Pass Rate", `${summary.passRate}%`],
      ["Maximum Marks", summary.maxMarks],
    ];
    let x = 36;
    let y = 158;
    for (const [label, value] of cards) {
      doc.roundedRect(x, y, 145, 60, 8).fill(light);
      doc
        .fillColor(muted)
        .fontSize(8)
        .text(label, x + 10, y + 10);
      doc
        .fillColor(blue)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(String(value), x + 10, y + 28);
      x += 155;
    }

    y = 244;
    doc.fillColor("#0F172A").fontSize(15).text("Top Performers", 36, y);
    y += 24;

    const top = leaderboard.slice(0, 5);
    const topHeaders =
      mode === MODES.STUDENT_TEAMS
        ? ["#", "Team", "Members", "Score", "Correct", "Wrong", "%", "Time"]
        : mode === MODES.TEAM
          ? ["#", "Team", "Email", "Score", "Correct", "Wrong", "%", "Time"]
          : ["#", "Name", "Roll No", "Score", "Correct", "Wrong", "%", "Time"];
    const topCols = [36, 70, 270, 410, 480, 545, 610, 680];
    doc.font("Helvetica-Bold").fontSize(8);
    topHeaders.forEach((label, index) => doc.text(label, topCols[index], y));
    y += 16;
    doc.font("Helvetica");

    for (const row of top) {
      const identity =
        mode === MODES.STUDENT_TEAMS
          ? [
              row.rank,
              row.teamName,
              row.teamMemberCount,
              row.score,
              row.correct,
              row.wrong,
              `${row.percentage}%`,
              formatTime(row.timeTakenSeconds),
            ]
          : mode === MODES.TEAM
            ? [
                row.rank,
                row.teamName,
                row.email,
                row.score,
                row.correct,
                row.wrong,
                `${row.percentage}%`,
                formatTime(row.timeTakenSeconds),
              ]
            : [
                row.rank,
                row.name,
                row.rollNo,
                row.score,
                row.correct,
                row.wrong,
                `${row.percentage}%`,
                formatTime(row.timeTakenSeconds),
              ];
      identity.forEach((value, index) =>
        doc
          .fontSize(8)
          .fillColor("#334155")
          .text(String(value ?? ""), topCols[index], y, {
            width: index === 1 ? 190 : 70,
          }),
      );
      y += 18;
    }

    doc.addPage();
    header();
    doc
      .fillColor("#0F172A")
      .font("Helvetica-Bold")
      .fontSize(17)
      .text("Detailed Results", 36, 102);

    const detailHeaders =
      mode === MODES.STUDENT_TEAMS
        ? [
            "#",
            "Team",
            "Members",
            "Status",
            "Score",
            "Correct",
            "Wrong",
            "Unanswered",
            "%",
            "Time",
          ]
        : mode === MODES.TEAM
          ? [
              "#",
              "Team",
              "Email",
              "Status",
              "Score",
              "Correct",
              "Wrong",
              "Unanswered",
              "%",
              "Time",
            ]
          : [
              "#",
              "Name",
              "Roll No",
              "Status",
              "Score",
              "Correct",
              "Wrong",
              "Unanswered",
              "%",
              "Time",
            ];
    const detailCols = [36, 65, 220, 320, 400, 460, 520, 580, 660, 715];

    const drawTableHeader = (tableY) => {
      doc.roundedRect(36, tableY - 5, 760, 22, 4).fill(blue);
      doc.fillColor("white").fontSize(7).font("Helvetica-Bold");
      detailHeaders.forEach((label, index) =>
        doc.text(label, detailCols[index], tableY, {
          width: index === 1 ? 150 : 65,
        }),
      );
    };

    let tableY = 132;
    drawTableHeader(tableY);
    tableY += 24;
    doc.font("Helvetica");

    rows.forEach((row, index) => {
      if (tableY > pageH - 45) {
        doc.addPage();
        header();
        tableY = 102;
        drawTableHeader(tableY);
        tableY += 24;
        doc.font("Helvetica");
      }

      if (index % 2 === 0) {
        doc.rect(36, tableY - 4, 760, 18).fill(light);
      }
      doc.fillColor("#334155").fontSize(7);

      const values =
        mode === MODES.STUDENT_TEAMS
          ? [
              index + 1,
              row.teamName,
              row.teamMemberCount,
              row.attemptStatus,
              row.score,
              row.correct,
              row.wrong,
              row.unanswered,
              `${row.percentage}%`,
              formatTime(row.timeTakenSeconds),
            ]
          : mode === MODES.TEAM
            ? [
                index + 1,
                row.teamName,
                row.email,
                row.attemptStatus,
                row.score,
                row.correct,
                row.wrong,
                row.unanswered,
                `${row.percentage}%`,
                formatTime(row.timeTakenSeconds),
              ]
            : [
                index + 1,
                row.name,
                row.rollNo,
                row.attemptStatus,
                row.score,
                row.correct,
                row.wrong,
                row.unanswered,
                `${row.percentage}%`,
                formatTime(row.timeTakenSeconds),
              ];

      values.forEach((value, columnIndex) =>
        doc.text(String(value ?? ""), detailCols[columnIndex], tableY, {
          width: columnIndex === 1 ? 150 : 65,
        }),
      );
      tableY += 18;
    });

    if (mode === MODES.STUDENT_TEAMS && rows.length) {
      doc.addPage();
      header();
      doc
        .fillColor("#0F172A")
        .font("Helvetica-Bold")
        .fontSize(17)
        .text("Team Members", 36, 102);
      let memberY = 132;
      const memberHeaders = ["Team", "Name", "Roll No", "Email", "Branch"];
      const memberCols = [36, 180, 330, 420, 650];
      doc.roundedRect(36, memberY - 5, 760, 22, 4).fill(blue);
      doc.fillColor("white").fontSize(7).font("Helvetica-Bold");
      memberHeaders.forEach((label, index) =>
        doc.text(label, memberCols[index], memberY, {
          width: index === 3 ? 220 : 130,
        }),
      );
      memberY += 24;
      doc.font("Helvetica");
      for (const row of rows) {
        for (const member of row.members || []) {
          if (memberY > pageH - 45) {
            doc.addPage();
            header();
            memberY = 102;
            doc.roundedRect(36, memberY - 5, 760, 22, 4).fill(blue);
            doc.fillColor("white").font("Helvetica-Bold").fontSize(7);
            memberHeaders.forEach((label, index) =>
              doc.text(label, memberCols[index], memberY, {
                width: index === 3 ? 220 : 130,
              }),
            );
            memberY += 24;
            doc.font("Helvetica");
          }
          doc.fillColor("#334155").fontSize(7);
          [
            row.teamName,
            member.name,
            member.roll_no,
            member.email,
            member.branch || "",
          ].forEach((value, index) =>
            doc.text(String(value ?? ""), memberCols[index], memberY, {
              width: index === 3 ? 220 : 130,
            }),
          );
          memberY += 18;
        }
      }
    }

    doc.addPage();
    header();
    doc
      .fillColor("#0F172A")
      .font("Helvetica-Bold")
      .fontSize(17)
      .text("Assessment Notes", 36, 102);
    doc
      .font("Helvetica")
      .fontSize(10)
      .fillColor("#334155")
      .text(
        `Participation mode: ${modeLabel}\nTotal questions: ${assessment.total_questions}\nMarks per question: ${assessment.marks_per_question ?? 1}\nMaximum marks: ${summary.maxMarks}\nDuration: ${assessment.duration_minutes} minutes\nPassing percentage: ${assessment.pass_percentage ?? 40}%\nLogin method: ${assessment.login_method || "PASSWORD"}\nLive updates: ${assessment.live_updates_enabled === false ? "OFF" : "ON"}`,
        36,
        136,
        { lineGap: 8 },
      );
    doc
      .fontSize(9)
      .fillColor(muted)
      .text(
        "This report is generated by the IEEE SPS Assessment Platform and contains the latest records available at export time.",
        36,
        280,
        { width: usable },
      );

    const range = doc.bufferedPageRange();
    for (
      let index = range.start;
      index < range.start + range.count;
      index += 1
    ) {
      doc.switchToPage(index);
      doc
        .fontSize(8)
        .fillColor(muted)
        .text(
          `IEEE SPS Assessment Platform  •  Page ${index - range.start + 1} of ${range.count}`,
          36,
          pageH - 24,
          { width: usable, align: "center" },
        );
    }

    doc.end();
  } catch (err) {
    console.error("EXPORT PDF ERROR:", err);
    if (!res.headersSent) {
      res.status(500).json({ success: false, message: err.message });
    }
  }
};

exports.getRound2ExportData = async (assessmentId) => {
  const { assessment, mode, rows } = await getExportData(assessmentId);
  return {
    assessment,
    mode,
    rows: getRound2Rows(mode, rows),
  };
};
