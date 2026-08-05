const jwt = require("jsonwebtoken");
const { supabase } = require("../config/supabase");

const {
  createLoginOtp,
  verifyLoginOtp,
  canRequestOtp,
} = require("../lib/redis");

const otpQueue = require("../services/otpQueueService");
const liveEvents = require("../services/liveEvents");

/* ==========================================================
   SEND OTP
========================================================== */

exports.sendOtp = async (req, res) => {
  try {
    const { assessmentId, email } = req.body;

    if (!assessmentId || !email) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID and Email are required.",
      });
    }

    // Check assessment
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id,title")
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    // Check allowed student
    const { data: student } = await supabase
      .from("assessment_allowed_students")
      .select("*")
      .eq("assessment_id", assessmentId)
      .eq("email", email)
      .single();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student is not allowed for this assessment.",
      });
    }

    // Cooldown
    const allowed = await canRequestOtp(assessmentId, email);

    if (!allowed) {
      return res.status(429).json({
        success: false,
        message: "Please wait before requesting another OTP.",
      });
    }

    // Generate OTP
    const otp = await createLoginOtp(assessmentId, email);

    // Queue email
    await otpQueue.queueOtpEmail({
      assessmentId,
      email: student.email,
      assessmentTitle: assessment?.title || "Assessment",
      otp,
    });

    return res.json({
      success: true,
      message: "OTP sent successfully.",
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
        message: "Assessment ID, Email and OTP are required.",
      });
    }

    const result = await verifyLoginOtp(assessmentId, email, otp);

    if (!result.valid) {
      return res.status(400).json({
        success: false,
        message: result.reason,
      });
    }

    // Get student
    const { data: student } = await supabase
      .from("assessment_allowed_students")
      .select("*")
      .eq("assessment_id", assessmentId)
      .eq("email", email)
      .single();

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found.",
      });
    }

    // Create JWT
    const token = jwt.sign(
      {
        id: student.id,
        assessmentId,
        email: student.email,
        rollNo: student.roll_no,
        name: student.name,
      },
      process.env.JWT_SECRET,
      {
        expiresIn: "8h",
      },
    );

    // Update login status
    await supabase
      .from("assessment_allowed_students")
      .update({
        has_logged_in: true,
        first_login_at: new Date(),
      })
      .eq("id", student.id);

    liveEvents.emitStudentLoggedIn(assessmentId);

    return res.json({
      success: true,
      token,
      student: {
        id: student.id,
        name: student.name,
        rollNo: student.roll_no,
        email: student.email,
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

    let processed = 0;
    let failed = 0;

    // Assessment title for email
    const { data: assessment } = await supabase
      .from("assessments")
      .select("title")
      .eq("id", assessmentId)
      .single();

    for (const studentId of studentIds) {
      try {
        const { data: student } = await supabase
          .from("assessment_allowed_students")
          .select("*")
          .eq("id", studentId)
          .single();

        if (!student) {
          failed++;
          continue;
        }

        const otp = await createLoginOtp(assessmentId, student.email);

        await otpQueue.queueOtpEmail({
          assessmentId,
          email: student.email,
          assessmentTitle: assessment?.title || "Assessment",
          otp,
        });

        await supabase
          .from("assessment_allowed_students")
          .update({
            otp_sent: true,
          })
          .eq("id", studentId);

        processed++;
      } catch (err) {
        console.error(err);
        failed++;
      }
    }

    liveEvents.emitStudentStatusChanged(assessmentId);

    return res.json({
      success: true,
      processed,
      failed,
      message: "OTP sent successfully.",
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

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
