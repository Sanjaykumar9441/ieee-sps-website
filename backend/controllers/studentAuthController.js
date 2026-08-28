const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const { supabase } = require("../lib/supabase");
const assessmentService = require("../services/assessmentService");
const liveEvents = require("../services/liveEvents");
const StudentAuth = require("../models/StudentAuth");

/* ==========================================================
   EMAIL + COMMON PASSWORD LOGIN
   The password is stored only as a bcrypt hash in a backend
   environment variable. It is never sent to or stored in DB.
========================================================== */
exports.login = async (req, res) => {
  try {
    const assessmentId = String(req.body.assessmentId || "").trim();
    const email = String(req.body.email || "").trim().toLowerCase();
    const password = String(req.body.password || "");

    if (!assessmentId || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID, email and password are required.",
      });
    }

    const passwordHash = process.env.ASSESSMENT_COMMON_PASSWORD_HASH;
    if (!passwordHash) {
      console.error("ASSESSMENT_COMMON_PASSWORD_HASH is not configured.");
      return res.status(500).json({
        success: false,
        message: "Assessment login is not configured on the server.",
      });
    }

    const { data: assessment, error: assessmentError } =
      await assessmentService.getAssessment(assessmentId);

    if (assessmentError || !assessment) {
      return res.status(404).json({ success: false, message: "Assessment not found." });
    }

    if (assessment.status !== "PUBLISHED" || !assessment.is_active) {
      return res.status(403).json({
        success: false,
        message: "Assessment is not available for login.",
      });
    }

    const { data: student, error: studentError } =
      await assessmentService.getAllowedStudent(assessmentId, email);

    if (studentError || !student) {
      return res.status(401).json({
        success: false,
        message: "This email is not registered for the assessment.",
      });
    }

    if (student.status === "blocked") {
      return res.status(403).json({ success: false, message: "Your access has been blocked." });
    }

    const passwordValid = await bcrypt.compare(password, passwordHash);
    if (!passwordValid) {
      return res.status(401).json({ success: false, message: "Invalid email or password." });
    }

    const { data: updatedStudent, error: updateError } = await supabase
      .from("assessment_allowed_students")
      .update({
        has_logged_in: true,
        first_login_at: student.first_login_at || new Date().toISOString(),
      })
      .eq("id", student.id)
      .select()
      .single();

    if (updateError) throw updateError;

    const token = jwt.sign(
      {
        id: updatedStudent.id,
        assessmentId,
        email: updatedStudent.email,
        rollNo: updatedStudent.roll_no,
        name: updatedStudent.name,
        role: "student",
      },
      process.env.JWT_SECRET,
      { expiresIn: "8h" },
    );

    liveEvents.emitStudentLoggedIn(assessmentId);
    liveEvents.emitStudentStatusChanged(assessmentId);
    liveEvents.emitDashboardRefresh(assessmentId);

    return res.json({
      success: true,
      token,
      student: {
        id: updatedStudent.id,
        name: updatedStudent.name,
        email: updatedStudent.email,
        rollNo: updatedStudent.roll_no,
      },
    });
  } catch (err) {
    console.error("STUDENT LOGIN ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
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

/* ==========================================================
   ADD ALLOWED STUDENT
========================================================== */

exports.addAllowedStudent = async (req, res) => {
  try {
    const { assessmentId, name, rollNo, email, branch } = req.body;

    if (!assessmentId || !name || !rollNo || !email) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID, name, roll number and email are required.",
      });
    }

    const normalizedName = String(name).trim();
    const normalizedRollNo = String(rollNo).trim();
    const normalizedEmail = String(email).trim().toLowerCase();
    const normalizedBranch = branch ? String(branch).trim() : null;

    // Check assessment
    const { data: assessment, error: assessmentError } =
      await assessmentService.getAssessment(assessmentId);

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    // Check duplicate email
    const { data: existingEmail, error: emailError } = await supabase
      .from("assessment_allowed_students")
      .select("id")
      .eq("assessment_id", assessmentId)
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (emailError) {
      throw emailError;
    }

    if (existingEmail) {
      return res.status(409).json({
        success: false,
        message: "A student with this email already exists.",
        field: "email",
      });
    }

    // Check duplicate roll number
    const { data: existingRoll, error: rollError } = await supabase
      .from("assessment_allowed_students")
      .select("id")
      .eq("assessment_id", assessmentId)
      .eq("roll_no", normalizedRollNo)
      .maybeSingle();

    if (rollError) {
      throw rollError;
    }

    if (existingRoll) {
      return res.status(409).json({
        success: false,
        message: "A student with this roll number already exists.",
        field: "roll_no",
      });
    }

    // Insert student
    const { data: student, error: insertError } = await supabase
      .from("assessment_allowed_students")
      .insert({
        assessment_id: assessmentId,
        name: normalizedName,
        roll_no: normalizedRollNo,
        email: normalizedEmail,
        branch: normalizedBranch,
        has_logged_in: false,
        first_login_at: null,
        status: "allowed",
      })
      .select()
      .single();

    if (insertError) {
      throw insertError;
    }

    // Notify live dashboard
    liveEvents.emitStudentStatusChanged(assessmentId);
    liveEvents.emitDashboardRefresh(assessmentId);

    return res.status(201).json({
      success: true,
      message: "Student added successfully.",
      student,
    });
  } catch (err) {
    console.error("ADD STUDENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ==========================================================
   BULK IMPORT ALLOWED STUDENTS
========================================================== */

exports.importStudents = async (req, res) => {
  try {
    const { assessmentId, students } = req.body;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    if (!Array.isArray(students) || students.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Students array is required.",
      });
    }

    if (students.length > 2000) {
      return res.status(400).json({
        success: false,
        message: "Maximum 2000 students can be imported at once.",
      });
    }

    // Check assessment
    const { data: assessment, error: assessmentError } =
      await assessmentService.getAssessment(assessmentId);

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    /* --------------------------------------------------------
       GET EXISTING STUDENTS
    -------------------------------------------------------- */

    const { data: existingStudents, error: existingError } = await supabase
      .from("assessment_allowed_students")
      .select("id, email, roll_no")
      .eq("assessment_id", assessmentId);

    if (existingError) {
      throw existingError;
    }

    const existingEmails = new Set(
      (existingStudents || [])
        .map((student) =>
          String(student.email || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );

    const existingRollNumbers = new Set(
      (existingStudents || [])
        .map((student) =>
          String(student.roll_no || "")
            .trim()
            .toLowerCase(),
        )
        .filter(Boolean),
    );

    /* --------------------------------------------------------
       VALIDATE CSV ROWS
    -------------------------------------------------------- */

    const validStudents = [];
    const duplicates = [];
    const errors = [];

    const batchEmails = new Set();
    const batchRollNumbers = new Set();

    students.forEach((student, index) => {
      const rowNumber = index + 2;

      const name = String(student.name || "").trim();
      const rollNo = String(student.rollNo || "").trim();
      const email = String(student.email || "")
        .trim()
        .toLowerCase();

      const department = String(student.department || "").trim();

      const year = String(student.year || "").trim();

      const section = String(student.section || "").trim();

      /* Required fields */

      if (!name || !rollNo || !email) {
        errors.push({
          row: rowNumber,
          name,
          rollNo,
          email,
          reason: "Name, Roll No and Email are required.",
        });

        return;
      }

      /* Email */

      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        errors.push({
          row: rowNumber,
          name,
          rollNo,
          email,
          reason: "Invalid email address.",
        });

        return;
      }

      /* Year */

      const parsedYear = Number(year);

      if (
        year &&
        (!Number.isInteger(parsedYear) || parsedYear < 1 || parsedYear > 4)
      ) {
        errors.push({
          row: rowNumber,
          name,
          rollNo,
          email,
          reason: "Year must be between 1 and 4.",
        });

        return;
      }

      /* Duplicate in database */

      if (
        existingEmails.has(email) ||
        existingRollNumbers.has(rollNo.toLowerCase())
      ) {
        duplicates.push({
          row: rowNumber,
          name,
          rollNo,
          email,
          reason: existingEmails.has(email)
            ? "Email already exists."
            : "Roll number already exists.",
        });

        return;
      }

      /* Duplicate inside CSV */

      if (
        batchEmails.has(email) ||
        batchRollNumbers.has(rollNo.toLowerCase())
      ) {
        duplicates.push({
          row: rowNumber,
          name,
          rollNo,
          email,
          reason: batchEmails.has(email)
            ? "Duplicate email in CSV."
            : "Duplicate roll number in CSV.",
        });

        return;
      }

      batchEmails.add(email);
      batchRollNumbers.add(rollNo.toLowerCase());
      validStudents.push({
        assessment_id: assessmentId,
        name,
        roll_no: rollNo,
        email,
        branch: department || null,
        status: "allowed",
        has_logged_in: false,
        first_login_at: null,
      });
    });

    /* --------------------------------------------------------
       INSERT VALID STUDENTS
    -------------------------------------------------------- */

    let imported = 0;

    if (validStudents.length > 0) {
      const { data: insertedStudents, error: insertError } = await supabase
        .from("assessment_allowed_students")
        .insert(validStudents)
        .select();

      if (insertError) {
        throw insertError;
      }

      imported = insertedStudents?.length || 0;
    }

    /* --------------------------------------------------------
       LIVE DASHBOARD UPDATE
    -------------------------------------------------------- */

    if (imported > 0) {
      liveEvents.emitStudentStatusChanged(assessmentId);

      liveEvents.emitDashboardRefresh(assessmentId);
    }

    return res.status(200).json({
      success: true,

      total: students.length,

      imported,

      duplicates: duplicates.length,

      errors: errors.length,

      duplicateRows: duplicates,

      errorRows: errors,

      message:
        imported > 0
          ? `${imported} students imported successfully.`
          : "No students were imported.",
    });
  } catch (err) {
    console.error("IMPORT STUDENTS ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
