const ExcelJS = require("exceljs");
const PDFDocument = require("pdfkit");
const { supabase } = require("../lib/supabase");

async function getExportData(assessmentId) {
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();

  if (assessmentError || !assessment) {
    throw assessmentError || new Error("Assessment not found.");
  }

  const { data: students, error: studentError } = await supabase
    .from("assessment_allowed_students")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("roll_no");

  if (studentError) throw studentError;

  const { data: attempts, error: attemptError } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId);

  if (attemptError) throw attemptError;

  const byStudent = new Map();
  for (const attempt of [...(attempts || [])].sort((a,b) => new Date(b.started_at || 0) - new Date(a.started_at || 0))) {
    if (!byStudent.has(attempt.student_id)) byStudent.set(attempt.student_id, attempt);
  }

  const rows = (students || []).map((student) => {
    const attempt = byStudent.get(student.id);
    const timeTaken =
      attempt?.started_at && attempt?.submitted_at
        ? Math.max(
            0,
            Math.floor(
              (new Date(attempt.submitted_at).getTime() -
                new Date(attempt.started_at).getTime()) /
                1000,
            ),
          )
        : 0;

    return {
      name: student.name,
      rollNo: student.roll_no,
      email: student.email,
      branch: student.branch,
      loginStatus: student.has_logged_in ? "Logged In" : "Not Logged In",
      attemptStatus: attempt?.status || "NOT_STARTED",
      score: Number(attempt?.score || 0),
      correct: Number(attempt?.correct || 0),
      wrong: Number(attempt?.wrong || 0),
      unanswered: Number(attempt?.unanswered || 0),
      percentage: Number(attempt?.percentage || 0),
      timeTakenSeconds: timeTaken,
      startedAt: attempt?.started_at || "",
      submittedAt: attempt?.submitted_at || "",
      disqualifiedReason: attempt?.disqualified_reason || "",
    };
  });

  return { assessment, rows };
}

exports.exportExcel = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessment, rows } = await getExportData(assessmentId);

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "IEEE SPS";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Results");
    sheet.columns = [
      { header: "Name", key: "name", width: 24 },
      { header: "Roll No", key: "rollNo", width: 16 },
      { header: "Email", key: "email", width: 32 },
      { header: "Branch", key: "branch", width: 16 },
      { header: "Login Status", key: "loginStatus", width: 16 },
      { header: "Attempt Status", key: "attemptStatus", width: 18 },
      { header: "Score", key: "score", width: 12 },
      { header: "Correct", key: "correct", width: 10 },
      { header: "Wrong", key: "wrong", width: 10 },
      { header: "Unanswered", key: "unanswered", width: 14 },
      { header: "Percentage", key: "percentage", width: 14 },
      { header: "Time (sec)", key: "timeTakenSeconds", width: 12 },
      { header: "Started At", key: "startedAt", width: 25 },
      { header: "Submitted At", key: "submittedAt", width: 25 },
      { header: "Disqualified Reason", key: "disqualifiedReason", width: 30 },
    ];

    rows.forEach((row) => sheet.addRow(row));
    sheet.views = [{ state: "frozen", ySplit: 1 }];
    sheet.autoFilter = "A1:O1";

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${assessment.title || "assessment"}-results.xlsx"`,
    );

    await workbook.xlsx.write(res);
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

    const headers = Object.keys(rows[0] || {
      name: "", rollNo: "", email: "", branch: "", loginStatus: "",
      attemptStatus: "", score: "", correct: "", wrong: "", unanswered: "",
      percentage: "", timeTakenSeconds: "", startedAt: "", submittedAt: "",
      disqualifiedReason: "",
    });

    const escape = (value) =>
      `"${String(value ?? "").replace(/"/g, '""')}"`;

    const csv = [
      headers.join(","),
      ...rows.map((row) => headers.map((h) => escape(row[h])).join(",")),
    ].join("\n");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${assessment.title || "assessment"}-results.csv"`,
    );
    res.status(200).send(csv);
  } catch (err) {
    console.error("EXPORT CSV ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { assessment, rows } = await getExportData(assessmentId);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${assessment.title || "assessment"}-results.pdf"`,
    );

    const doc = new PDFDocument({ margin: 36, size: "A4", layout: "landscape" });
    doc.pipe(res);

    doc.fontSize(16).text("IEEE SPS Assessment Results");
    doc.fontSize(12).text(assessment.title || "Assessment");
    doc.moveDown();

    rows.forEach((r, index) => {
      doc
        .fontSize(8)
        .text(
          `${index + 1}. ${r.name} | ${r.rollNo} | ${r.email} | ` +
          `${r.attemptStatus} | Score: ${r.score} | ` +
          `Correct: ${r.correct} | Wrong: ${r.wrong} | ` +
          `Unanswered: ${r.unanswered} | ${r.percentage}% | ` +
          `Submitted: ${r.submittedAt || "-"}`,
        );
    });

    doc.end();
  } catch (err) {
    console.error("EXPORT PDF ERROR:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
