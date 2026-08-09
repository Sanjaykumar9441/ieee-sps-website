const jwt = require("jsonwebtoken");

const { supabase } = require("../lib/supabase");

const {
  createLoginOtp,
  verifyLoginOtp,
  canRequestOtp,
} = require("../lib/redis");

const assessmentService = require("../services/assessmentService");
const otpQueue = require("../services/otpQueueService");
const liveEvents = require("../services/liveEvents");
const StudentAuth = require("../models/StudentAuth");

/* ==========================================================
   SEND OTP
========================================================== */

exports.sendOtp = async (req, res) => {
  try {
    const { assessmentId, email } = req.body;

    if (!assessmentId || !email) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID and email are required.",
      });
    }

    /* --------------------------------------------
       Assessment
    --------------------------------------------- */

    const { data: assessment, error: assessmentError } =
      await assessmentService.getAssessment(assessmentId);

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    if (!assessment.is_active) {
      return res.status(400).json({
        success: false,
        message: "Assessment is not active.",
      });
    }

    if (assessment.status !== "PUBLISHED") {
      return res.status(400).json({
        success: false,
        message: "Assessment is not published.",
      });
    }

    /* --------------------------------------------
       Student
    --------------------------------------------- */

    const { data: student, error: studentError } =
      await assessmentService.getAllowedStudent(assessmentId, email);

    if (studentError || !student) {
      return res.status(404).json({
        success: false,
        message: "Student is not allowed for this assessment.",
      });
    }

    if (student.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your access has been blocked.",
      });
    }

    /* --------------------------------------------
       OTP Cooldown
    --------------------------------------------- */

    const allowed = await canRequestOtp(assessmentId, email);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    /* --------------------------------------------
       Generate OTP
    --------------------------------------------- */

    const otp = await createLoginOtp(assessmentId, email);

    /* --------------------------------------------
       Queue Email
    --------------------------------------------- */

    await otpQueue.queueOtpEmail({
      assessmentId,

      email: student.email,

      assessmentTitle: assessment.title,

      otp,
    });

    return res.json({
      success: true,

      message: "OTP sent successfully.",

      expiresIn: 300,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   VERIFY OTP
========================================================== */

exports.verifyOtp = async (req, res) => {
  try {
    const { assessmentId, email, otp } = req.body;

    if (!assessmentId || !email || !otp) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID, email and OTP are required.",
      });
    }

    /* --------------------------------------------
       Verify OTP
    --------------------------------------------- */

    const result = await verifyLoginOtp(assessmentId, email, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason,
      });
    }

    /* --------------------------------------------
       Get Student
    --------------------------------------------- */

    const { data: student, error } = await assessmentService.getAllowedStudent(
      assessmentId,
      email,
    );

    if (error || !student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    if (student.status === "blocked") {
      return res.status(403).json({
        success: false,
        message: "Your access has been blocked.",
      });
    }

    /* --------------------------------------------
       JWT
    --------------------------------------------- */

    const token = jwt.sign(
      {
        id: student.id,

        assessmentId,

        email: student.email,

        rollNo: student.roll_no,

        name: student.name,

        role: "student",
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    /* --------------------------------------------
       Update Login Status
    --------------------------------------------- */

    const { error: updateError } = await supabase
      .from("assessment_allowed_students")
      .update({
        has_logged_in: true,

        first_login_at: new Date().toISOString(),
      })
      .eq("id", student.id);

    if (updateError) throw updateError;

    /* --------------------------------------------
       Live Dashboard
    --------------------------------------------- */

    liveEvents.emitStudentLoggedIn(assessmentId);
    liveEvents.emitStudentStatusChanged(assessmentId);
    liveEvents.emitDashboardRefresh(assessmentId);

    /* --------------------------------------------
       Success
    --------------------------------------------- */

    return res.json({
      success: true,

      token,

      student: {
        id: student.id,

        name: student.name,

        email: student.email,

        rollNo: student.roll_no,
      },
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   SEND BULK OTP
========================================================== */

exports.sendBulkOtp = async (req, res) => {
  try {
    const { assessmentId, studentIds } = req.body;

    if (
      !assessmentId ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID and student IDs are required.",
      });
    }

    const { data: assessment, error: assessmentError } =
      await assessmentService.getAssessment(assessmentId);

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    let processed = 0;
    let failed = 0;

    for (const studentId of studentIds) {
      try {
        const { data: student, error } = await supabase
          .from("assessment_allowed_students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (error || !student) {
          failed++;
          continue;
        }

        if (student.status === "blocked") {
          failed++;
          continue;
        }

        const otp = await createLoginOtp(assessmentId, student.email);

        await otpQueue.queueOtpEmail({
          assessmentId,

          email: student.email,

          assessmentTitle: assessment.title,

          otp,
        });

        await supabase
          .from("assessment_allowed_students")
          .update({
            otp_sent: true,
          })
          .eq("id", student.id);

        processed++;
      } catch (err) {
        console.error(err);
        failed++;
      }
    }

    liveEvents.emitStudentStatusChanged(assessmentId);
    liveEvents.emitDashboardRefresh(assessmentId);

    return res.json({
      success: true,

      processed,

      failed,

      message: "Bulk OTP process completed.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   BLOCK STUDENTS
========================================================== */

exports.blockStudents = async (req, res) => {
  try {
    const { assessmentId, studentIds } = req.body;

    if (
      !assessmentId ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID and student IDs are required.",
      });
    }

    const { error } = await supabase
      .from("assessment_allowed_students")
      .update({
        status: "blocked",
      })
      .eq("assessment_id", assessmentId)
      .in("id", studentIds);

    if (error) throw error;

    liveEvents.emitStudentStatusChanged(assessmentId);
    liveEvents.emitDashboardRefresh(assessmentId);

    return res.json({
      success: true,

      processed: studentIds.length,

      failed: 0,

      message: "Students blocked successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   UNBLOCK STUDENTS
========================================================== */

exports.unblockStudents = async (req, res) => {
  try {
    const { assessmentId, studentIds } = req.body;

    if (
      !assessmentId ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID and student IDs are required.",
      });
    }

    const { error } = await supabase
      .from("assessment_allowed_students")
      .update({
        status: "allowed",
      })
      .eq("assessment_id", assessmentId)
      .in("id", studentIds);

    if (error) throw error;

    liveEvents.emitStudentStatusChanged(assessmentId);
    liveEvents.emitDashboardRefresh(assessmentId);

    return res.json({
      success: true,

      processed: studentIds.length,

      failed: 0,

      message: "Students unblocked successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   DELETE STUDENTS
========================================================== */

exports.deleteStudents = async (req, res) => {
  try {
    const { assessmentId, studentIds } = req.body;

    if (
      !assessmentId ||
      !Array.isArray(studentIds) ||
      studentIds.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID and student IDs are required.",
      });
    }

    const { error } = await supabase
      .from("assessment_allowed_students")
      .delete()
      .eq("assessment_id", assessmentId)
      .in("id", studentIds);

    if (error) throw error;

    liveEvents.emitStudentStatusChanged(assessmentId);
    liveEvents.emitDashboardRefresh(assessmentId);

    return res.json({
      success: true,

      processed: studentIds.length,

      failed: 0,

      message: "Students deleted successfully.",
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   ALLOWED STUDENTS
========================================================== */

exports.getAllowedStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await supabase
      .from("assessment_allowed_students")
      .select(
        `
        *,
        assessment_attempts (
  id,
  status
)
      `,
      )
      .eq("assessment_id", assessmentId)
      .order("name");

    if (error) throw error;

    const students = (data || []).map((student) => {
      const attempt = student.assessment_attempts?.[0] || null;

      return {
        ...student,
        logged_in: student.has_logged_in,
        blocked: student.status === "blocked",
        attempt_started: !!attempt,
        submitted: attempt?.status === "SUBMITTED",
      };
    });

    return res.json({
      success: true,
      students,
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getStudentDetails = async (req, res) => {
  try {
    const { studentId } = req.params;

    if (!studentId) {
      return res.status(400).json({
        success: false,
        message: "Student ID is required.",
      });
    }

    const { data, error } = await StudentAuth.getStudentDetails(studentId);

    if (error) throw error;

    const attempt = data.assessment_attempts?.[0] || null;

    return res.json({
      success: true,

      student: {
        ...data,
        status: data.status,
      },

      attempt: attempt
        ? {
            id: attempt.id,
            status: attempt.status,
            startedAt: attempt.started_at,
            submittedAt: attempt.submitted_at,
            score: Number(attempt.score || 0),
            answeredQuestions: Number(attempt.answered_questions || 0),
            resumedCount: Number(attempt.resumed_count || 0),
          }
        : null,

      statistics: {
        questionsAnswered: attempt?.answered_questions ?? 0,
        score: attempt?.score ?? 0,
      },

      timeline: {
        loggedInAt: data.first_login_at,
        assessmentStartedAt: attempt?.started_at,
        submittedAt: attempt?.submitted_at,
      },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
