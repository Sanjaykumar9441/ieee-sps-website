const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { supabase } = require("../lib/supabase");

const safeFilename = (value) =>
  String(value || "assessment")
    .replace(/[^a-z0-9._-]+/gi, "_")
    .slice(0, 100);
const toNumber = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);
const optionKey = (value) => {
  if (typeof value === "number")
    return value >= 0 && value < 4
      ? String.fromCharCode(65 + value)
      : String(value);
  const s = String(value ?? "")
    .trim()
    .toUpperCase();
  if (/^[A-D]$/.test(s)) return s;
  if (/^\d+$/.test(s) && Number(s) < 4)
    return String.fromCharCode(65 + Number(s));
  return s;
};
const normalizeAnswers = (value) =>
  (Array.isArray(value) ? value : value == null ? [] : [value])
    .map(optionKey)
    .filter(Boolean)
    .sort();

async function getExportData(assessmentId) {
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();
  if (assessmentError || !assessment)
    throw assessmentError || new Error("Assessment not found.");

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
  const { data: teams, error: teamsError } = await supabase
    .from("assessment_teams")
    .select("id,team_name,contact_email,branch,member_count")
    .eq("assessment_id", assessmentId);
  if (teamsError) throw teamsError;
  const teamMap = new Map((teams || []).map((t) => [t.id, t]));
  if (studentsError) throw studentsError;
  const { data: attempts, error: attemptsError } = await supabase
    .from("assessment_attempts")
    .select(
      "id,student_id,status,score,correct,wrong,unanswered,percentage,started_at,submitted_at,completed_at",
    )
    .eq("assessment_id", assessmentId);
  if (attemptsError) throw attemptsError;

  const attemptIds = (attempts || []).map((a) => a.id);
  const { data: activities, error: activityError } = attemptIds.length
    ? await supabase
        .from("assessment_activity")
        .select("attempt_id,activity_type,occurred_at,metadata")
        .in("attempt_id", attemptIds)
    : { data: [], error: null };
  if (activityError) throw activityError;
  const activityMap = new Map();
  for (const a of activities || []) {
    if (!activityMap.has(a.attempt_id)) activityMap.set(a.attempt_id, []);
    activityMap.get(a.attempt_id).push(a);
  }
  const byStudent = new Map((students || []).map((s) => [s.id, s]));
  const attemptByStudent = new Map();
  for (const a of attempts || []) {
    const old = attemptByStudent.get(a.student_id);
    if (
      !old ||
      new Date(a.submitted_at || a.started_at || 0) >
        new Date(old.submitted_at || old.started_at || 0)
    )
      attemptByStudent.set(a.student_id, a);
  }

  const sourceStudents =
    assessment.participation_mode === "INDIVIDUAL_STUDENTS"
      ? students || []
      : (students || []).filter(
          (student, i, arr) =>
            !student.team_id ||
            arr.findIndex((x) => x.team_id === student.team_id) === i,
        );
  const rows = sourceStudents.map((student) => {
    const a = attemptByStudent.get(student.id);
    const acts = activityMap.get(a?.id) || [];
    const timeTaken =
      a?.started_at && a?.submitted_at
        ? Math.max(
            0,
            Math.floor(
              (new Date(a.submitted_at) - new Date(a.started_at)) / 1000,
            ),
          )
        : 0;
    const reason = acts.some((x) => x.activity_type === "FORCE_SUBMIT")
      ? "Admin Force Submit"
      : acts.some((x) => x.activity_type === "SECURITY_AUTO_SUBMIT")
        ? "Security Auto Submit"
        : acts.some((x) => x.activity_type === "AUTO_SUBMIT")
          ? "Time Expired"
          : "";
    const team = student.team_id ? teamMap.get(student.team_id) : null;
    return {
      name: team?.team_name || student.name || "",
      rollNo: team ? "" : student.roll_no || "",
      email: team?.contact_email || student.email || "",
      branch: team?.branch || student.branch || "",
      teamName: team?.team_name || "",
      teamMemberCount: Number(team?.member_count || 0),
      loginStatus: student.has_logged_in ? "Logged In" : "Not Logged In",
      attemptStatus: a?.status || "NOT STARTED",
      score: toNumber(a?.score),
      correct: toNumber(a?.correct),
      wrong: toNumber(a?.wrong),
      unanswered: toNumber(a?.unanswered),
      percentage: toNumber(a?.percentage),
      timeTakenSeconds: timeTaken,
      startedAt: a?.started_at || "",
      submittedAt: a?.submitted_at || "",
      completionReason: reason,
    };
  });

  const submittedAttemptIds = (attempts || [])
    .filter((a) => a.status !== "IN_PROGRESS")
    .map((a) => a.id);
  let questionAnalysis = [];
  if (submittedAttemptIds.length) {
    const { data: qRows, error: qError } = await supabase
      .from("assessment_attempt_questions")
      .select(
        "id,attempt_id,question_id,question_order,correct_answers,assessment_answers(selected_answers)",
      )
      .in("attempt_id", submittedAttemptIds);
    if (qError) throw qError;
    const map = new Map();
    for (const q of qRows || []) {
      const key = q.question_id || `${q.attempt_id}:${q.question_order}`;
      if (!map.has(key))
        map.set(key, {
          questionNumber: q.question_order,
          questionId: q.question_id,
          attempts: 0,
          correct: 0,
          wrong: 0,
          skipped: 0,
        });
      const stat = map.get(key);
      stat.attempts++;
      const selected = normalizeAnswers(
        q.assessment_answers?.[0]?.selected_answers,
      );
      const expected = normalizeAnswers(q.correct_answers);
      if (!selected.length) stat.skipped++;
      else if (JSON.stringify(selected) === JSON.stringify(expected))
        stat.correct++;
      else stat.wrong++;
    }
    questionAnalysis = [...map.values()]
      .sort((a, b) => a.questionNumber - b.questionNumber)
      .map((q) => ({
        ...q,
        correctPercentage: q.attempts
          ? Number(((q.correct / q.attempts) * 100).toFixed(2))
          : 0,
        wrongPercentage: q.attempts
          ? Number(((q.wrong / q.attempts) * 100).toFixed(2))
          : 0,
        skippedPercentage: q.attempts
          ? Number(((q.skipped / q.attempts) * 100).toFixed(2))
          : 0,
      }));
  }
  const completed = rows.filter((r) => r.attemptStatus === "SUBMITTED");
  const submitted = rows.filter((r) => r.attemptStatus === "SUBMITTED");
  const maxMarks =
    totalQuestions * Math.max(0, toNumber(assessment.marks_per_question ?? 1));
  const avgScore = submitted.length
    ? submitted.reduce((s, r) => s + r.score, 0) / submitted.length
    : 0;
  const passed = submitted.filter(
    (r) => r.percentage >= toNumber(assessment.pass_percentage ?? 40),
  ).length;
  const leaderboard = [...submitted]
    .sort(
      (a, b) =>
        b.score - a.score ||
        a.timeTakenSeconds - b.timeTakenSeconds ||
        a.rollNo.localeCompare(b.rollNo),
    )
    .map((r, i) => ({ ...r, rank: i + 1 }));
  return {
    assessment: { ...assessment, total_questions: totalQuestions },
    rows,
    questionAnalysis,
    leaderboard,
    summary: {
      registered: rows.length,
      completed: completed.length,
      submitted: submitted.length,
      inProgress: rows.filter((r) => r.attemptStatus === "IN_PROGRESS").length,
      averageScore: Number(avgScore.toFixed(2)),
      highestScore: submitted.length
        ? Math.max(...submitted.map((r) => r.score))
        : 0,
      passRate: submitted.length
        ? Number(((passed / submitted.length) * 100).toFixed(2))
        : 0,
      maxMarks,
    },
  };
}

exports.exportExcel = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessment, rows, questionAnalysis, leaderboard, summary } =
      await getExportData(assessmentId);
    const wb = new ExcelJS.Workbook();
    wb.creator = "IEEE SPS Assessment Platform";
    wb.created = new Date();
    const info = wb.addWorksheet("Summary");
    info.columns = [
      { header: "Metric", key: "metric", width: 28 },
      { header: "Value", key: "value", width: 25 },
    ];
    [
      ["Assessment", assessment.title],
      ["Start", assessment.start_time || ""],
      ["End", assessment.end_time || ""],
      ["Total Questions", assessment.total_questions],
      ["Duration (minutes)", assessment.duration_minutes],
      ["Maximum Marks", summary.maxMarks],
      ["Passing Percentage", assessment.pass_percentage],
      ["Registered", summary.registered],
      ["Submitted", summary.submitted],
      ["In Progress", summary.inProgress],
      ["Average Score", summary.averageScore],
      ["Highest Score", summary.highestScore],
      ["Pass Rate", summary.passRate + "%"],
    ].forEach(([metric, value]) => info.addRow({ metric, value }));
    const sheet = wb.addWorksheet("Results");
    sheet.columns = [
      { header: "Rank", key: "rank", width: 8 },
      { header: "Name", key: "name", width: 24 },
      { header: "Roll No", key: "rollNo", width: 16 },
      { header: "Email", key: "email", width: 30 },
      { header: "Branch", key: "branch", width: 18 },
      { header: "Login", key: "loginStatus", width: 14 },
      { header: "Attempt Status", key: "attemptStatus", width: 18 },
      { header: "Score", key: "score", width: 10 },
      { header: "Correct", key: "correct", width: 10 },
      { header: "Wrong", key: "wrong", width: 10 },
      { header: "Unanswered", key: "unanswered", width: 13 },
      { header: "Percentage", key: "percentage", width: 13 },
      { header: "Time (sec)", key: "timeTakenSeconds", width: 12 },
      { header: "Started At", key: "startedAt", width: 25 },
      { header: "Submitted At", key: "submittedAt", width: 25 },
      { header: "Completion Reason", key: "completionReason", width: 24 },
    ];
    const rankMap = new Map(leaderboard.map((r) => [r.rollNo, r.rank]));
    rows.forEach((r) =>
      sheet.addRow({ ...r, rank: rankMap.get(r.rollNo) || "" }),
    );
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = "A1:Q1";
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
    questionAnalysis.forEach((x) => q.addRow(x));
    q.views = [{ state: "frozen", ySplit: 1 }];
    for (const ws of [info, sheet, q]) {
      ws.getRow(1).font = { bold: true };
      ws.getRow(1).alignment = { vertical: "middle" };
      ws.eachRow((row) => (row.alignment = { vertical: "middle" }));
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
    const { assessment, rows } = await getExportData(assessmentId);
    const headers = [
      "name",
      "rollNo",
      "email",
      "branch",
      "loginStatus",
      "attemptStatus",
      "score",
      "correct",
      "wrong",
      "unanswered",
      "percentage",
      "timeTakenSeconds",
      "startedAt",
      "submittedAt",
      "completionReason",
    ];
    const esc = (v) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const csv = [
      headers.join(","),
      ...rows.map((r) => headers.map((h) => esc(r[h])).join(",")),
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
    const { assessment, rows, leaderboard, summary } =
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
    const navy = "#0B3558",
      blue = "#00629B",
      muted = "#64748B",
      light = "#F1F5F9";
    const pageW = doc.page.width,
      usable = pageW - 72;
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
        .text("ASSESSMENT PERFORMANCE REPORT", 36, 49);
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
      ["Registered", summary.registered],
      ["Submitted", summary.submitted],
      ["Average Score", summary.averageScore],
      ["Pass Rate", summary.passRate + "%"],
      ["Maximum Marks", summary.maxMarks],
    ];
    let x = 36,
      y = 158;
    for (let i = 0; i < cards.length; i++) {
      const [label, val] = cards[i];
      doc.roundedRect(x, y, 145, 60, 8).fill(light);
      doc
        .fillColor(muted)
        .fontSize(8)
        .text(label, x + 10, y + 10);
      doc
        .fillColor(blue)
        .font("Helvetica-Bold")
        .fontSize(18)
        .text(String(val), x + 10, y + 28);
      x += 155;
      if (x + 145 > pageW - 36) {
        x = 36;
        y += 70;
      }
    }
    y += 86;
    doc.fillColor("#0F172A").fontSize(15).text("Top Performers", 36, y);
    y += 24;
    const top = leaderboard.slice(0, 5);
    const col = [36, 70, 250, 360, 450, 530, 610, 700];
    const labels = [
      "#",
      "Name",
      "Roll No",
      "Score",
      "Correct",
      "Wrong",
      "%",
      "Time",
    ];
    doc.font("Helvetica-Bold").fontSize(8);
    labels.forEach((l, i) => doc.text(l, col[i], y));
    y += 16;
    doc.font("Helvetica");
    for (const r of top) {
      if (y > pageW - 40) {
        doc.addPage();
        header();
        y = 105;
      }
      const vals = [
        r.rank,
        r.name,
        r.rollNo,
        r.score,
        r.correct,
        r.wrong,
        r.percentage + "%",
        formatTime(r.timeTakenSeconds),
      ];
      vals.forEach((v, i) =>
        doc
          .fontSize(8)
          .fillColor("#334155")
          .text(String(v), col[i], y, { width: i === 1 ? 170 : 80 }),
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
    let ty = 132;
    const tableCols = [36, 65, 220, 300, 390, 455, 520, 585, 650, 715];
    const tableLabels = [
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
    doc.roundedRect(36, ty - 5, 760, 22, 4).fill(blue);
    doc.fillColor("white").fontSize(7).font("Helvetica-Bold");
    tableLabels.forEach((l, i) =>
      doc.text(l, tableCols[i], ty, { width: i === 1 ? 120 : 65 }),
    );
    ty += 24;
    doc.font("Helvetica");
    rows.forEach((r, i) => {
      if (ty > doc.page.height - 45) {
        doc.addPage();
        header();
        ty = 102;
        doc.roundedRect(36, ty - 5, 760, 22, 4).fill(blue);
        doc.fillColor("white").font("Helvetica-Bold");
        tableLabels.forEach((l, j) =>
          doc.text(l, tableCols[j], ty, { width: j === 1 ? 120 : 65 }),
        );
        ty += 24;
        doc.font("Helvetica");
      }
      if (i % 2 === 0) doc.rect(36, ty - 4, 760, 18).fill(light);
      doc.fillColor("#334155").fontSize(7);
      const vals = [
        i + 1,
        r.name,
        r.rollNo,
        r.attemptStatus,
        r.score,
        r.correct,
        r.wrong,
        r.unanswered,
        r.percentage + "%",
        formatTime(r.timeTakenSeconds),
      ];
      vals.forEach((v, j) =>
        doc.text(String(v), tableCols[j], ty, { width: j === 1 ? 120 : 65 }),
      );
      ty += 18;
    });
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
        `Total questions: ${assessment.total_questions}\nDuration: ${assessment.duration_minutes} minutes\nPassing percentage: ${assessment.pass_percentage ?? 40}%\nLogin method: ${assessment.login_method || "PASSWORD"}\nLive updates: ${assessment.live_updates_enabled === false ? "OFF" : "ON"}`,
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
        230,
        { width: usable },
      );
    const range = doc.bufferedPageRange();
    for (let i = range.start; i < range.start + range.count; i++) {
      doc.switchToPage(i);
      doc
        .fontSize(8)
        .fillColor(muted)
        .text(
          `IEEE SPS Assessment Platform  •  Page ${i - range.start + 1} of ${range.count}`,
          36,
          doc.page.height - 24,
          { width: usable, align: "center" },
        );
    }
    doc.end();
  } catch (err) {
    console.error("EXPORT PDF ERROR:", err);
    if (!res.headersSent)
      res.status(500).json({ success: false, message: err.message });
  }
};
function formatTime(seconds) {
  const n = Math.max(0, Number(seconds || 0));
  return `${String(Math.floor(n / 60)).padStart(2, "0")}:${String(n % 60).padStart(2, "0")}`;
}
