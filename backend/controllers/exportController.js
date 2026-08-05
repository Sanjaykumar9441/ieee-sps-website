const ExcelJS = require("exceljs");
const { supabase } = require("../lib/supabase");

/* ============================================================
   EXPORT EXCEL
============================================================ */

exports.exportExcel = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    /* ---------------------------------------
       Assessment Details
    --------------------------------------- */

    const { data: assessment } = await supabase
      .from("assessments")
      .select("title")
      .eq("id", assessmentId)
      .single();

    /* ---------------------------------------
       Leaderboard
    --------------------------------------- */

    const { data: leaderboard, error } = await supabase
      .from("live_leaderboard")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("rank");

    if (error) throw error;

    /* ---------------------------------------
       Analytics
    --------------------------------------- */

    const { data: analytics } = await supabase
      .from("live_dashboard")
      .select("*")
      .eq("assessment_id", assessmentId)
      .single();

    /* ---------------------------------------
       Allowed Students
    --------------------------------------- */

    const { data: students } = await supabase
      .from("assessment_allowed_students")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("roll_no");

    /* ---------------------------------------
       Disqualified Students
    --------------------------------------- */

    const { data: disqualified } = await supabase
      .from("live_leaderboard")
      .select("*")
      .eq("assessment_id", assessmentId)
      .eq("status", "disqualified");

    /* ---------------------------------------
       Infractions
    --------------------------------------- */

    const { data: infractions } = await supabase
      .from("assessment_infractions")
      .select("*")
      .eq("assessment_id", assessmentId);

    /* ---------------------------------------
       Workbook
    --------------------------------------- */

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "IEEE SPS";
    workbook.company = "IEEE SPS Student Branch Chapter";
    workbook.subject = "Assessment Report";
    workbook.created = new Date();

    /* =======================================================
       LEADERBOARD SHEET
    ======================================================= */

    const leaderboardSheet = workbook.addWorksheet("Leaderboard");

    leaderboardSheet.mergeCells("A1:G1");

    leaderboardSheet.getCell("A1").value =
      "IEEE SPS Student Branch Chapter";

    leaderboardSheet.getCell("A1").font = {
      size: 18,
      bold: true,
      color: { argb: "FF003366" },
    };

    leaderboardSheet.getCell("A1").alignment = {
      horizontal: "center",
    };

    leaderboardSheet.mergeCells("A2:G2");

    leaderboardSheet.getCell("A2").value =
      assessment?.title || "Assessment";

    leaderboardSheet.getCell("A2").font = {
      size: 14,
      bold: true,
    };

    leaderboardSheet.getCell("A2").alignment = {
      horizontal: "center",
    };

    leaderboardSheet.mergeCells("A3:G3");

    leaderboardSheet.getCell("A3").value =
      "Generated : " + new Date().toLocaleString();

    leaderboardSheet.columns = [
      { header: "Rank", key: "rank" },
      { header: "Name", key: "name" },
      { header: "Roll Number", key: "roll_no" },
      { header: "Email", key: "email" },
      { header: "Score", key: "score" },
      { header: "Status", key: "status" },
      { header: "Submitted At", key: "submitted_at" },
    ];

    leaderboardSheet.spliceRows(4, 0, []);

    leaderboardSheet.spliceRows(5, 0, [
      "Rank",
      "Name",
      "Roll Number",
      "Email",
      "Score",
      "Status",
      "Submitted At",
    ]);

    const header = leaderboardSheet.getRow(5);

    header.eachCell((cell) => {
      cell.font = {
        bold: true,
        color: { argb: "FFFFFFFF" },
      };

      cell.fill = {
        type: "pattern",
        pattern: "solid",
        fgColor: { argb: "FF003366" },
      };

      cell.alignment = {
        horizontal: "center",
      };

      cell.border = {
        top: { style: "thin" },
        bottom: { style: "thin" },
        left: { style: "thin" },
        right: { style: "thin" },
      };
    });

    leaderboard.forEach((student) => {
      leaderboardSheet.addRow(student);
    });

    leaderboardSheet.views = [
      {
        state: "frozen",
        ySplit: 5,
      },
    ];

    leaderboardSheet.autoFilter = {
      from: "A5",
      to: "G5",
    };

    leaderboardSheet.eachRow((row, rowNumber) => {
      if (rowNumber < 6) return;

      row.eachCell((cell) => {
        cell.border = {
          top: { style: "thin" },
          bottom: { style: "thin" },
          left: { style: "thin" },
          right: { style: "thin" },
        };

        if (rowNumber % 2 === 0) {
          cell.fill = {
            type: "pattern",
            pattern: "solid",
            fgColor: { argb: "FFF5F5F5" },
          };
        }
      });
    });

    leaderboardSheet.columns.forEach((column) => {
      let max = 18;

      column.eachCell({ includeEmpty: true }, (cell) => {
        const len = String(cell.value || "").length;

        if (len > max) max = len;
      });

      column.width = max + 3;
    });

    /* =======================================================
       ANALYTICS SHEET
    ======================================================= */

    const analyticsSheet = workbook.addWorksheet("Analytics");

    analyticsSheet.columns = [
      { header: "Metric", key: "metric", width: 35 },
      { header: "Value", key: "value", width: 20 },
    ];

    analyticsSheet.addRows([
      {
        metric: "Registered Students",
        value: analytics?.registered_students,
      },
      {
        metric: "Logged In Students",
        value: analytics?.logged_in_students,
      },
      {
        metric: "Started Students",
        value: analytics?.started_students,
      },
      {
        metric: "Submitted Students",
        value: analytics?.submitted_students,
      },
      {
        metric: "Disqualified Students",
        value: analytics?.disqualified_students,
      },
      {
        metric: "Average Score",
        value: analytics?.average_score,
      },
      {
        metric: "Highest Score",
        value: analytics?.highest_score,
      },
      {
        metric: "Lowest Score",
        value: analytics?.lowest_score,
      },
      {
        metric: "Pass Percentage",
        value: analytics?.pass_percentage + "%",
      },
    ]);

    /* =======================================================
       ALLOWED STUDENTS
    ======================================================= */

    const studentSheet = workbook.addWorksheet("Allowed Students");

    studentSheet.columns = [
      { header: "Name", key: "name" },
      { header: "Roll Number", key: "roll_no" },
      { header: "Email", key: "email" },
      { header: "Logged In", key: "has_logged_in" },
    ];

    students.forEach((s) => studentSheet.addRow(s));

    /* =======================================================
       DISQUALIFIED
    ======================================================= */

    const disqualifiedSheet =
      workbook.addWorksheet("Disqualified");

    disqualifiedSheet.columns = [
      { header: "Name", key: "name" },
      { header: "Roll Number", key: "roll_no" },
      { header: "Email", key: "email" },
      { header: "Status", key: "status" },
    ];

    disqualified.forEach((s) =>
      disqualifiedSheet.addRow(s)
    );

    /* =======================================================
       INFRACTIONS
    ======================================================= */

    const infractionsSheet =
      workbook.addWorksheet("Infractions");

    infractionsSheet.columns = [
      { header: "Attempt", key: "attempt_id" },
      { header: "Type", key: "type" },
      { header: "Occurred At", key: "occurred_at" },
    ];

    infractions.forEach((i) =>
      infractionsSheet.addRow(i)
    );

    /* ======================================================= */

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${assessment?.title || "Assessment"}-Report.xlsx`
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};