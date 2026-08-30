const { supabase } = require("../lib/supabase");

/* ============================================================
   DASHBOARD ANALYTICS
============================================================ */

exports.getDashboardAnalytics = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    const { department = "all" } = req.query;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    /* ========================================================
       ASSESSMENT
    ======================================================== */

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("*")
      .eq("id", assessmentId)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    /* ========================================================
       ALLOWED STUDENTS
    ======================================================== */

    const { data: allowedStudents, error: allowedError } = await supabase
      .from("assessment_allowed_students")
      .select("*")
      .eq("assessment_id", assessmentId);

    if (allowedError) throw allowedError;

    let filteredAllowedStudents = allowedStudents || [];

    /*
      Your database uses `branch`.
      Frontend calls it `department`.
    */

    if (department !== "all") {
      filteredAllowedStudents = filteredAllowedStudents.filter(
        (student) => student.branch === department,
      );
    }

    const allowedStudentIds = new Set(
      filteredAllowedStudents.map((student) => student.id),
    );

    const allowedStudentMap = new Map(
      filteredAllowedStudents.map((student) => [student.id, student]),
    );

    const participants = filteredAllowedStudents.length;

    const loggedIn = filteredAllowedStudents.filter(
      (student) => student.has_logged_in === true,
    ).length;

    /* ========================================================
       ATTEMPTS
    ======================================================== */

    const { data: attempts, error: attemptError } = await supabase
      .from("assessment_attempts")
      .select("*")
      .eq("assessment_id", assessmentId);

    if (attemptError) throw attemptError;

    let filteredAttempts = (attempts || []).filter((attempt) =>
      allowedStudentIds.has(attempt.student_id),
    );

    /* ========================================================
       BASIC COUNTS
    ======================================================== */

    const started = filteredAttempts.length;

    /* ========================================================
   LIVE ACTIVITY
======================================================== */

    /*
--------------------------------------------------------
ONLINE STUDENTS

A student is online when their active session has sent
a heartbeat within the last 60 seconds.
--------------------------------------------------------
*/

    const onlineCutoff = new Date(Date.now() - 60 * 1000).toISOString();

    const { data: onlineSessions, error: onlineError } = await supabase
      .from("assessment_sessions")
      .select("attempt_id")
      .eq("is_active", true)
      .gte("last_seen", onlineCutoff);

    if (onlineError) throw onlineError;

    const onlineAttemptIds = new Set(
      (onlineSessions || []).map((session) => session.attempt_id),
    );

    const onlineStudents = filteredAttempts.filter((attempt) =>
      onlineAttemptIds.has(attempt.id),
    ).length;

    /*
--------------------------------------------------------
TAKING QUIZ

Students whose attempt is currently IN_PROGRESS.
--------------------------------------------------------
*/

    const takingStudents = filteredAttempts.filter(
      (attempt) => attempt.status === "IN_PROGRESS",
    ).length;

    const submittedAttempts = filteredAttempts.filter(
      (attempt) => attempt.status === "SUBMITTED",
    );

    const submitted = submittedAttempts.length;

    const running = filteredAttempts.filter(
      (attempt) => attempt.status === "IN_PROGRESS",
    ).length;

    const disqualified = filteredAttempts.filter(
      (attempt) => attempt.status === "DISQUALIFIED",
    ).length;

    const pending = Math.max(participants - submitted - disqualified, 0);

    /* ========================================================
       SCORE ANALYTICS
    ======================================================== */

    const scores = submittedAttempts.map((attempt) =>
      Number(attempt.score || 0),
    );

    const averageScore =
      scores.length > 0
        ? scores.reduce((sum, score) => sum + score, 0) / scores.length
        : 0;

    const highestScore = scores.length > 0 ? Math.max(...scores) : 0;

    const lowestScore = scores.length > 0 ? Math.min(...scores) : 0;

    /* ========================================================
       TIME ANALYTICS
    ======================================================== */

    const timeRecords = submittedAttempts
      .filter((attempt) => attempt.started_at && attempt.submitted_at)
      .map((attempt) => {
        const startedAt = new Date(attempt.started_at).getTime();
        const submittedAt = new Date(attempt.submitted_at).getTime();

        return Math.max(0, Math.round((submittedAt - startedAt) / 1000));
      });

    const averageTimeSeconds =
      timeRecords.length > 0
        ? timeRecords.reduce((sum, time) => sum + time, 0) / timeRecords.length
        : 0;

    const averageTime = Number((averageTimeSeconds / 60).toFixed(2));

    /* ========================================================
       ASSESSMENT SUMMARY
    ======================================================== */

    const { data: questionMappings } = await supabase
      .from("assessment_question_banks")
      .select("questions_to_pick")
      .eq("assessment_id", assessmentId);
    const mappedQuestionCount = (questionMappings || []).reduce((sum, row) => sum + Number(row.questions_to_pick || 0), 0);
    const totalQuestions = mappedQuestionCount || Number(assessment.total_questions || 0);

    const marksPerQuestion = Number(assessment.marks_per_question || 0);

    const maximumMarks = totalQuestions * marksPerQuestion;

    const passPercentageSetting =
      assessment.pass_percentage != null
        ? Number(assessment.pass_percentage)
        : 40;

    const passingMarks =
      assessment.passing_score != null
        ? Number(assessment.passing_score)
        : Number(((maximumMarks * passPercentageSetting) / 100).toFixed(2));

    const passedStudents = submittedAttempts.filter(
      (attempt) => Number(attempt.score || 0) >= passingMarks,
    ).length;

    const passPercentage =
      submitted > 0
        ? Number(((passedStudents / submitted) * 100).toFixed(2))
        : 0;


    /* ========================================================
       DEPARTMENT PERFORMANCE
    ======================================================== */

    const departmentMap = {};

    for (const attempt of submittedAttempts) {
      const student = allowedStudentMap.get(attempt.student_id);

      const branch = student?.branch || "Unknown";

      if (!departmentMap[branch]) {
        departmentMap[branch] = {
          department: branch,
          scores: [],
          passed: 0,
        };
      }

      departmentMap[branch].scores.push(Number(attempt.score || 0));

      if (Number(attempt.score || 0) >= passingMarks) {
        departmentMap[branch].passed++;
      }
    }

    const departmentPerformance = Object.values(departmentMap).map((item) => {
      const count = item.scores.length;

      return {
        department: item.department,

        participants: count,

        averageScore:
          count > 0
            ? Number(
                (item.scores.reduce((a, b) => a + b, 0) / count).toFixed(2),
              )
            : 0,

        highestScore: count > 0 ? Math.max(...item.scores) : 0,

        passPercentage:
          count > 0 ? Number(((item.passed / count) * 100).toFixed(2)) : 0,
      };
    });

    /* ========================================================
       PERFORMERS
    ======================================================== */

    const performerData = submittedAttempts.map((attempt) => {
      const student = allowedStudentMap.get(attempt.student_id);

      let timeTaken = 0;

      if (attempt.started_at && attempt.submitted_at) {
        timeTaken = Math.max(
          0,
          Math.round(
            (new Date(attempt.submitted_at).getTime() -
              new Date(attempt.started_at).getTime()) /
              1000,
          ),
        );
      }

      return {
        studentId: attempt.student_id,

        name: student?.name || "-",

        rollNo: student?.roll_no || "-",

        department: student?.branch || "-",

        score: Number(attempt.score || 0),

        percentage: Number(attempt.percentage || 0),

        timeTaken,
      };
    });

    const topPerformers = [...performerData]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }

        return a.timeTaken - b.timeTaken;
      })
      .slice(0, 5);

    const bottomPerformers = [...performerData]
      .sort((a, b) => {
        if (a.score !== b.score) {
          return a.score - b.score;
        }

        return b.timeTaken - a.timeTaken;
      })
      .slice(0, 5);

    const fastestSubmissions = [...performerData]
      .sort((a, b) => a.timeTaken - b.timeTaken)
      .slice(0, 5)
      .map((student) => ({
        studentId: student.studentId,
        name: student.name,
        rollNo: student.rollNo,
        timeTaken: student.timeTaken,
        score: student.score,
      }));

    const slowestSubmissions = [...performerData]
      .sort((a, b) => b.timeTaken - a.timeTaken)
      .slice(0, 5)
      .map((student) => ({
        studentId: student.studentId,
        name: student.name,
        rollNo: student.rollNo,
        timeTaken: student.timeTaken,
        score: student.score,
      }));

    /* ========================================================
       QUESTION ANALYSIS
    ======================================================== */

    let attemptQuestions = [];

    const submittedAttemptIds = submittedAttempts.map((attempt) => attempt.id);

    if (submittedAttemptIds.length > 0) {
      const { data, error: questionsError } = await supabase
        .from("assessment_attempt_questions")
        .select(
          `
        id,
        attempt_id,
        question_id,
        question_order,
        correct_answers,
        marks,
        negative_marks,
        questions(
          question_text,
          difficulty
        ),
        assessment_answers(
          selected_answers
        )
      `,
        )
        .in("attempt_id", submittedAttemptIds);

      if (questionsError) throw questionsError;

      attemptQuestions = data || [];
    }

    const questionMap = {};

    for (const item of attemptQuestions || []) {
      const questionId = item.question_id;

      if (!questionMap[questionId]) {
        questionMap[questionId] = {
          questionNumber: item.question_order,

          questionText: item.questions?.question_text || "-",

          total: 0,

          correct: 0,

          wrong: 0,

          skipped: 0,
        };
      }

      const stats = questionMap[questionId];

      stats.total++;

      const answer = item.assessment_answers?.[0];

      if (!answer || !Array.isArray(answer.selected_answers) || answer.selected_answers.length === 0) {
        stats.skipped++;
        continue;
      }

      const normalizeAnswer = (value) => {
        if (typeof value === "number") return String.fromCharCode(65 + value);
        const text = String(value ?? "").trim().toUpperCase();
        if (/^[A-D]$/.test(text)) return text;
        if (/^\d+$/.test(text)) {
          const n = Number(text);
          return n >= 0 && n < 4 ? String.fromCharCode(65 + n) : text;
        }
        return text;
      };

      const selected = (Array.isArray(answer.selected_answers) ? answer.selected_answers : [answer.selected_answers])
        .map(normalizeAnswer).sort();

      const expected = (Array.isArray(item.correct_answers) ? item.correct_answers : [item.correct_answers])
        .map(normalizeAnswer).sort();

      const isCorrect = JSON.stringify(selected) === JSON.stringify(expected);

      if (isCorrect) {
        stats.correct++;
      } else {
        stats.wrong++;
      }
    }

    const questionAnalysis = Object.values(questionMap).map((question) => ({
      questionNumber: question.questionNumber,

      questionText: question.questionText,


      correctPercentage:
        question.total > 0
          ? Number(((question.correct / question.total) * 100).toFixed(2))
          : 0,

      wrongPercentage:
        question.total > 0
          ? Number(((question.wrong / question.total) * 100).toFixed(2))
          : 0,

      skippedPercentage:
        question.total > 0
          ? Number(((question.skipped / question.total) * 100).toFixed(2))
          : 0,

    }));

    /* ========================================================
       INTEGRITY
    ======================================================== */

    const { data: infractions, error: infractionsError } = await supabase
      .from("assessment_infractions")
      .select("id, attempt_id, type, details, occurred_at");

    if (infractionsError) throw infractionsError;

    const filteredInfractions = (infractions || []).filter((infraction) =>
      filteredAttempts.some((attempt) => attempt.id === infraction.attempt_id),
    );

    const warnings = filteredInfractions.length;

    const tabSwitches = filteredInfractions.filter(
      (item) => item.type === "TAB_SWITCH" || item.type === "TAB_SWITCHED",
    ).length;

    const windowBlur = filteredInfractions.filter(
      (item) => item.type === "WINDOW_BLUR",
    ).length;

    /*
      We do not have a dedicated force-submit
      database field, so don't invent one.
    */

    let forceSubmitActivities = [];

    const filteredAttemptIds = filteredAttempts.map((attempt) => attempt.id);

    if (filteredAttemptIds.length > 0) {
      const { data, error: forceSubmitError } = await supabase
        .from("assessment_activity")
        .select("attempt_id")
        .eq("activity_type", "FORCE_SUBMIT")
        .in("attempt_id", filteredAttemptIds);

      if (forceSubmitError) throw forceSubmitError;

      forceSubmitActivities = data || [];
    }

    const forceSubmitted = new Set(
      forceSubmitActivities.map((activity) => activity.attempt_id),
    ).size;

    /* ========================================================
       LIVE ACTIVITY
    ======================================================== */

    const liveActivity = {
      online: onlineStudents,
      taking: takingStudents,
    };

    /* ========================================================
       ASSESSMENT STATUS
    ======================================================== */

    const latestSubmission = [...submittedAttempts]
      .filter((attempt) => attempt.submitted_at)
      .sort(
        (a, b) =>
          new Date(b.submitted_at).getTime() -
          new Date(a.submitted_at).getTime(),
      )[0];

    const assessmentStatus = {
      status: assessment.is_active ? "Active" : "Inactive",

      duration: Number(assessment.duration_minutes || 0),

      questions: Number(assessment.total_questions || 0),

      studentsOnline: onlineStudents,

      lastSubmission: latestSubmission?.submitted_at
        ? new Date(latestSubmission.submitted_at).toLocaleString()
        : "-",
    };

    /* ========================================================
       RESPONSE
    ======================================================== */

    return res.json({
      success: true,

      analytics: {
        participants,

        submitted,

        running,

        averageScore: Number(averageScore.toFixed(2)),

        highestScore,

        lowestScore,

        passPercentage: Number(passPercentage.toFixed(2)),

        averageTime,

        assessmentSummary: {
          totalQuestions,

          duration: Number(assessment.duration_minutes || 0),

          maximumMarks,

          passingMarks,

        },

        departmentPerformance,

        questionAnalysis,

        topPerformers,

        bottomPerformers,

        fastestSubmissions,

        slowestSubmissions,

        completion: {
          allowed: participants,

          loggedIn,

          started,

          submitted,

          pending,
        },

        integrity: {
          warnings,

          forceSubmitted,

          disqualified,

          tabSwitches,

          windowBlur,
        },

        liveActivity,

        assessmentStatus,
      },
    });
  } catch (err) {
    console.error("Dashboard analytics error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
