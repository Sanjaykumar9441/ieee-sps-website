const ExcelJS = require("exceljs");
const { supabase } = require("../lib/supabase");

/* ============================================================
   PRIVATE HELPERS
============================================================ */

/*
--------------------------------------------------------
Assessment
--------------------------------------------------------
*/

async function getAssessment(assessmentId) {
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", assessmentId)
    .single();

  if (error) throw error;

  return data;
}

/*
--------------------------------------------------------
Leaderboard
--------------------------------------------------------
*/

async function buildLeaderboard(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select(
      `
      id,
      student_id,
      score,
      status,
      started_at,
      submitted_at,
      assessment_allowed_students(
        name,
        roll_no,
        email,
        department,
        section
      )
    `,
    )
    .eq("assessment_id", assessmentId)
    .eq("status", "SUBMITTED");

  if (error) throw error;

  return (data || [])
    .sort((a, b) => {
      if (Number(b.score) !== Number(a.score))
        return Number(b.score) - Number(a.score);

      const time = new Date(a.submitted_at) - new Date(b.submitted_at);

      if (time !== 0) return time;

      return (a.assessment_allowed_students?.roll_no || "").localeCompare(
        b.assessment_allowed_students?.roll_no || "",
      );
    })
    .map((student, index) => ({
      rank: index + 1,

      name: student.assessment_allowed_students?.name,

      roll_no: student.assessment_allowed_students?.roll_no,

      email: student.assessment_allowed_students?.email,

      department: student.assessment_allowed_students?.department,

      section: student.assessment_allowed_students?.section,

      score: student.score,

      status: student.status,

      submitted_at: student.submitted_at,
    }));
}

/*
--------------------------------------------------------
Analytics
--------------------------------------------------------
*/

async function buildAnalytics(assessmentId, assessment) {
  const { count: registeredStudents } = await supabase
    .from("assessment_allowed_students")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq("assessment_id", assessmentId);

  const { data: attempts } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("assessment_id", assessmentId);

  const submitted = attempts.filter((a) => a.status === "SUBMITTED");

  const scores = submitted.map((a) => Number(a.score || 0));

  let averageScore = 0;
  let highestScore = 0;
  let lowestScore = 0;

  if (scores.length) {
    averageScore = scores.reduce((a, b) => a + b, 0) / scores.length;

    highestScore = Math.max(...scores);

    lowestScore = Math.min(...scores);
  }

  /*
  -------------------------
  Passing Score
  -------------------------
  */

  let passingScore = assessment.passing_score;

  if (passingScore == null) {
    passingScore =
      (assessment.total_questions *
        assessment.marks_per_question *
        assessment.pass_percentage) /
      100;
  }

  const passed = submitted.filter(
    (a) => Number(a.score) >= Number(passingScore),
  ).length;

  return {
    registeredStudents,

    loggedInStudents: 0,

    startedStudents: attempts.length,

    submittedStudents: submitted.length,

    disqualifiedStudents: attempts.filter((a) => a.status === "DISQUALIFIED")
      .length,

    averageScore: Number(averageScore.toFixed(2)),

    highestScore,

    lowestScore,

    passingScore,

    passPercentage: submitted.length
      ? Number(((passed / submitted.length) * 100).toFixed(2))
      : 0,
  };
}

/*
--------------------------------------------------------
Allowed Students
--------------------------------------------------------
*/

async function getAllowedStudents(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_allowed_students")
    .select("*")
    .eq("assessment_id", assessmentId)
    .order("roll_no");

  if (error) throw error;

  return data || [];
}

/*
--------------------------------------------------------
Disqualified
--------------------------------------------------------
*/

async function getDisqualified(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select(
      `
        *,
        assessment_allowed_students(
          name,
          roll_no,
          email
        )
      `,
    )
    .eq("assessment_id", assessmentId)
    .eq("status", "DISQUALIFIED");

  if (error) throw error;

  return data || [];
}

/*
--------------------------------------------------------
Infractions
--------------------------------------------------------
*/

async function getInfractions(assessmentId) {
  const { data, error } = await supabase
    .from("assessment_infractions")
    .select("*")
    .eq("assessment_id", assessmentId);

  if (error) throw error;

  return data || [];
}

/* ============================================================
   EXPORT EXCEL
============================================================ */

exports.exportExcel = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    /*
    --------------------------------------------------------
    Load Data
    --------------------------------------------------------
    */

    const assessment = await getAssessment(assessmentId);

    const leaderboard = await buildLeaderboard(assessmentId);

    const analytics = await buildAnalytics(assessmentId, assessment);

    const students = await getAllowedStudents(assessmentId);

    const disqualified = await getDisqualified(assessmentId);

    const infractions = await getInfractions(assessmentId);

    /*
    --------------------------------------------------------
    Workbook
    --------------------------------------------------------
    */

    const workbook = new ExcelJS.Workbook();

    workbook.creator = "IEEE SPS";

    workbook.company = "IEEE SPS Student Branch Chapter";

    workbook.subject = "Assessment Report";

    workbook.created = new Date();

    /* ========================================================
       LEADERBOARD
    ======================================================== */

    const leaderboardSheet = workbook.addWorksheet("Leaderboard");

    leaderboardSheet.columns = [
      {
        header: "Rank",
        key: "rank",
        width: 10,
      },
      {
        header: "Name",
        key: "name",
        width: 28,
      },
      {
        header: "Roll Number",
        key: "roll_no",
        width: 20,
      },
      {
        header: "Department",
        key: "department",
        width: 18,
      },
      {
        header: "Section",
        key: "section",
        width: 12,
      },
      {
        header: "Email",
        key: "email",
        width: 35,
      },
      {
        header: "Score",
        key: "score",
        width: 12,
      },
      {
        header: "Status",
        key: "status",
        width: 15,
      },
      {
        header: "Submitted At",
        key: "submitted_at",
        width: 28,
      },
    ];

    leaderboard.forEach((row) => {
      leaderboardSheet.addRow(row);
    });

    leaderboardSheet.getRow(1).font = {
      bold: true,
    };

    /* ========================================================
       ANALYTICS
    ======================================================== */

    const analyticsSheet = workbook.addWorksheet("Analytics");

    analyticsSheet.columns = [
      {
        header: "Metric",
        key: "metric",
        width: 40,
      },
      {
        header: "Value",
        key: "value",
        width: 20,
      },
    ];

    analyticsSheet.addRows([
      {
        metric: "Registered Students",
        value: analytics.registeredStudents,
      },
      {
        metric: "Logged In Students",
        value: analytics.loggedInStudents,
      },
      {
        metric: "Started Students",
        value: analytics.startedStudents,
      },
      {
        metric: "Submitted Students",
        value: analytics.submittedStudents,
      },
      {
        metric: "Disqualified Students",
        value: analytics.disqualifiedStudents,
      },
      {
        metric: "Average Score",
        value: analytics.averageScore,
      },
      {
        metric: "Highest Score",
        value: analytics.highestScore,
      },
      {
        metric: "Lowest Score",
        value: analytics.lowestScore,
      },
      {
        metric: "Passing Score",
        value: analytics.passingScore,
      },
      {
        metric: "Pass Percentage",
        value: analytics.passPercentage + "%",
      },
    ]);

    analyticsSheet.getRow(1).font = {
      bold: true,
    };

    /* ========================================================
       ASSESSMENT SETTINGS
    ======================================================== */

    const settingsSheet = workbook.addWorksheet("Assessment Settings");

    settingsSheet.columns = [
      {
        header: "Property",
        key: "property",
        width: 35,
      },
      {
        header: "Value",
        key: "value",
        width: 35,
      },
    ];

    settingsSheet.addRows([
      {
        property: "Title",
        value: assessment.title,
      },
      {
        property: "Duration",
        value: assessment.duration_minutes + " Minutes",
      },
      {
        property: "Total Questions",
        value: assessment.total_questions,
      },
      {
        property: "Marks Per Question",
        value: assessment.marks_per_question,
      },
      {
        property: "Negative Marks",
        value: assessment.negative_marks,
      },
      {
        property: "Passing Score",
        value: analytics.passingScore,
      },
      {
        property: "Pass Percentage",
        value: assessment.pass_percentage + "%",
      },
      {
        property: "Status",
        value: assessment.status,
      },
    ]);

    settingsSheet.getRow(1).font = {
      bold: true,
    };

    /* ========================================================
       ALLOWED STUDENTS
    ======================================================== */

    const studentSheet = workbook.addWorksheet("Allowed Students");

    studentSheet.columns = [
      {
        header: "Name",
        key: "name",
      },
      {
        header: "Roll Number",
        key: "roll_no",
      },
      {
        header: "Department",
        key: "department",
      },
      {
        header: "Section",
        key: "section",
      },
      {
        header: "Email",
        key: "email",
      },
      {
        header: "Logged In",
        key: "has_logged_in",
      },
    ];

    students.forEach((student) => studentSheet.addRow(student));

    studentSheet.getRow(1).font = {
      bold: true,
    };

    /* ========================================================
       DISQUALIFIED
    ======================================================== */

    const disqualifiedSheet = workbook.addWorksheet("Disqualified");

    disqualifiedSheet.columns = [
      {
        header: "Name",
        key: "name",
      },
      {
        header: "Roll Number",
        key: "roll_no",
      },
      {
        header: "Email",
        key: "email",
      },
      {
        header: "Status",
        key: "status",
      },
    ];

    disqualified.forEach((attempt) => {
      disqualifiedSheet.addRow({
        name: attempt.assessment_allowed_students?.name,

        roll_no: attempt.assessment_allowed_students?.roll_no,

        email: attempt.assessment_allowed_students?.email,

        status: attempt.status,
      });
    });

    disqualifiedSheet.getRow(1).font = {
      bold: true,
    };

    /* ========================================================
       INFRACTIONS
    ======================================================== */

    const infractionsSheet = workbook.addWorksheet("Infractions");

    infractionsSheet.columns = [
      {
        header: "Attempt ID",
        key: "attempt_id",
      },
      {
        header: "Type",
        key: "type",
      },
      {
        header: "Occurred At",
        key: "occurred_at",
      },
    ];

    infractions.forEach((row) => infractionsSheet.addRow(row));

    infractionsSheet.getRow(1).font = {
      bold: true,
    };

    /*
    --------------------------------------------------------
    Download
    --------------------------------------------------------
    */

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${assessment.title}-Report.xlsx"`,
    );

    await workbook.xlsx.write(res);

    res.end();
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   EXPORT CSV
============================================================ */

exports.exportCSV = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    /*
    --------------------------------------------------------
    Load Data
    --------------------------------------------------------
    */

    const assessment = await getAssessment(assessmentId);

    const leaderboard = await buildLeaderboard(assessmentId);

    /*
    --------------------------------------------------------
    Headers
    --------------------------------------------------------
    */

    const headers = [
      "Rank",
      "Name",
      "Roll Number",
      "Department",
      "Section",
      "Email",
      "Score",
      "Status",
      "Result",
      "Submitted At",
    ];

    /*
    --------------------------------------------------------
    Passing Score
    --------------------------------------------------------
    */

    let passingScore = assessment.passing_score;

    if (passingScore == null) {
      passingScore =
        (assessment.total_questions *
          assessment.marks_per_question *
          assessment.pass_percentage) /
        100;
    }

    /*
    --------------------------------------------------------
    Rows
    --------------------------------------------------------
    */

    const rows = leaderboard.map((student) => [
      student.rank,

      student.name,

      student.roll_no,

      student.department,

      student.section,

      student.email,

      student.score,

      student.status,

      Number(student.score) >= Number(passingScore) ? "PASS" : "FAIL",

      student.submitted_at,
    ]);

    /*
    --------------------------------------------------------
    Build CSV
    --------------------------------------------------------
    */

    const csv = [
      headers.join(","),

      ...rows.map((row) =>
        row
          .map((value) => `"${String(value ?? "").replace(/"/g, '""')}"`)
          .join(","),
      ),
    ].join("\n");

    /*
    --------------------------------------------------------
    Download
    --------------------------------------------------------
    */

    res.setHeader("Content-Type", "text/csv");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${assessment.title}-Leaderboard.csv"`,
    );

    return res.status(200).send(csv);
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
