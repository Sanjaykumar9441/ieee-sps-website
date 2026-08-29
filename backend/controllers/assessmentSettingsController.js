const { supabase } = require("../lib/supabase");

/* ============================================================
   DEFAULT SETTINGS
============================================================ */

const defaultSettings = {
  general: {
    title: "",
    category: "",
    description: "",
    instructions: "",
    visibility: "PRIVATE",
    assessmentCode: "",
    version: "1.0",
    createdAt: "",
    updatedAt: "",
  },

  schedule: {
    startDate: "",
    startTime: "",
    endDate: "",
    endTime: "",
    duration: 30,
    graceTime: 5,
    timezone: "Asia/Kolkata",
    autoStart: false,
    autoEnd: true,
  },

  login: {
    allowedStudentsOnly: true,
    authentication: "EMAIL_COMMON_PASSWORD",
  },

  rules: {
    randomQuestions: true,
    randomOptions: true,
    negativeMarking: false,
    negativeMarks: 0,
    allowReview: true,
    showQuestionPalette: true,
    showProgressBar: true,
    autoSubmit: true,
    showMarks: true,
    showDifficulty: false,
  },

  security: {
    fullscreenRequired: true,
    detectTabSwitch: true,
    maxTabSwitches: 3,
    disableCopy: true,
    disablePaste: true,
    disableRightClick: true,
    developerToolsDetection: true,
    browserLock: true,
    windowBlurDetection: true,
    webcamProctoring: false,
  },

  results: {
    publishResults: "AFTER_END",
    leaderboardEnabled: true,
    showScore: true,
    showRank: true,
    showCorrectAnswers: false,
    showExplanation: false,
    passingPercentage: 40,
    generateCertificates: false,
  },

  notifications: {},

  certificate: {
    enabled: false,
    passingPercentage: 40,
    templateName: "Default Template",
    certificatePrefix: "AUS",
    autoGenerate: false,
    sendEmail: false,
    digitalSignature: false,
  },
};

/* ============================================================
   GET SETTINGS
============================================================ */

exports.getSettings = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    // ---------------------------------------------------------
    // Get assessment
    // ---------------------------------------------------------

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("*")
      .eq("id", id)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    // ---------------------------------------------------------
    // Get assessment settings
    // ---------------------------------------------------------

    const { data: dbSettings, error: settingsError } = await supabase
      .from("assessment_settings")
      .select("*")
      .eq("assessment_id", id)
      .maybeSingle();

    if (settingsError) {
      throw settingsError;
    }

    // ---------------------------------------------------------
    // Build settings object expected by frontend
    // ---------------------------------------------------------

    const settings = {
      ...defaultSettings,

      general: {
        ...defaultSettings.general,

        title: assessment.title || "",
        description: assessment.description || "",
        instructions: assessment.instructions || "",
        assessmentCode: assessment.slug || "",

        category: assessment.category_id || "",

        createdAt: assessment.created_at || "",
        updatedAt: assessment.updated_at || "",
      },

      schedule: {
        ...defaultSettings.schedule,

        startDate: assessment.start_time
          ? new Date(assessment.start_time).toISOString().split("T")[0]
          : "",

        startTime: assessment.start_time
          ? new Date(assessment.start_time).toISOString().slice(11, 16)
          : "",

        endDate: assessment.end_time
          ? new Date(assessment.end_time).toISOString().split("T")[0]
          : "",

        endTime: assessment.end_time
          ? new Date(assessment.end_time).toISOString().slice(11, 16)
          : "",

        duration: assessment.duration_minutes ?? 30,

        autoEnd: assessment.auto_submit ?? true,
      },

      rules: {
        ...defaultSettings.rules,

        randomQuestions: assessment.random_questions ?? true,

        randomOptions: assessment.shuffle_options ?? true,

        negativeMarking: Number(assessment.negative_marks || 0) > 0,

        negativeMarks: Number(assessment.negative_marks || 0),

        autoSubmit: assessment.auto_submit ?? true,
      },

      security: {
        ...defaultSettings.security,

        fullscreenRequired: assessment.anti_cheat_enabled ?? true,

        detectTabSwitch: assessment.anti_cheat_enabled ?? true,

        developerToolsDetection: assessment.anti_cheat_enabled ?? true,

        browserLock: assessment.anti_cheat_enabled ?? true,

        windowBlurDetection: assessment.socket_monitoring ?? true,
      },

      results: {
        ...defaultSettings.results,

        leaderboardEnabled:
          dbSettings?.leaderboard_enabled ??
          assessment.show_leaderboard ??
          true,

        showScore: dbSettings?.allow_result_view ?? true,

        allowAnswerReview: dbSettings?.allow_answer_review ?? true,

        passingPercentage: assessment.pass_percentage ?? 40,

        generateCertificates: dbSettings?.auto_generate_certificate ?? false,
      },

      notifications: {
        ...defaultSettings.notifications,

        sendResultEmail: dbSettings?.email_results ?? false,

        sendCertificateEmail: dbSettings?.email_certificate ?? false,
      },

      certificate: {
        ...defaultSettings.certificate,

        enabled: dbSettings?.allow_certificate_download ?? false,

        autoGenerate: dbSettings?.auto_generate_certificate ?? false,

        sendEmail: dbSettings?.email_certificate ?? false,

        passingPercentage: assessment.pass_percentage ?? 40,
      },
    };

    return res.json({
      success: true,
      settings,
    });
  } catch (err) {
    console.error("Get Assessment Settings Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

/* ============================================================
   UPDATE SETTINGS
============================================================ */

exports.updateSettings = async (req, res) => {
  try {
    const { id } = req.params;
    const settings = req.body;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    // ---------------------------------------------------------
    // Verify assessment
    // ---------------------------------------------------------

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id")
      .eq("id", id)
      .single();

    if (assessmentError || !assessment) {
      return res.status(404).json({
        success: false,
        message: "Assessment not found.",
      });
    }

    // ---------------------------------------------------------
    // Update core assessment fields
    // ---------------------------------------------------------

    const assessmentUpdate = {};

    if (settings.general?.title !== undefined) {
      assessmentUpdate.title = settings.general.title;
    }

    if (settings.general?.description !== undefined) {
      assessmentUpdate.description = settings.general.description;
    }

    if (settings.general?.instructions !== undefined) {
      assessmentUpdate.instructions = settings.general.instructions;
    }

    if (settings.schedule?.duration !== undefined) {
      assessmentUpdate.duration_minutes = Number(settings.schedule.duration);
    }

    if (settings.rules?.randomQuestions !== undefined) {
      assessmentUpdate.random_questions = settings.rules.randomQuestions;

      assessmentUpdate.shuffle_questions = settings.rules.randomQuestions;
    }

    if (settings.rules?.randomOptions !== undefined) {
      assessmentUpdate.shuffle_options = settings.rules.randomOptions;
    }

    if (settings.rules?.negativeMarking !== undefined) {
      assessmentUpdate.negative_marks = settings.rules.negativeMarking
        ? Math.max(0, Number(settings.rules.negativeMarks || 0))
        : 0;
    } else if (settings.rules?.negativeMarks !== undefined) {
      assessmentUpdate.negative_marks = Math.max(0, Number(settings.rules.negativeMarks || 0));
    }

    if (settings.rules?.autoSubmit !== undefined) {
      assessmentUpdate.auto_submit = settings.rules.autoSubmit;
    }


    if (settings.security?.antiCheatEnabled !== undefined) {
      assessmentUpdate.anti_cheat_enabled =
        Boolean(settings.security.antiCheatEnabled);
    } else if (settings.security?.fullscreenRequired !== undefined) {
      assessmentUpdate.anti_cheat_enabled =
        Boolean(settings.security.fullscreenRequired);
    }

    if (settings.security?.socketMonitoring !== undefined) {
      assessmentUpdate.socket_monitoring =
        Boolean(settings.security.socketMonitoring);
    } else if (settings.security?.windowBlurDetection !== undefined) {
      assessmentUpdate.socket_monitoring =
        Boolean(settings.security.windowBlurDetection);
    }

    if (settings.results?.passingPercentage !== undefined) {
      assessmentUpdate.pass_percentage = Number(
        settings.results.passingPercentage,
      );
    }

    // Marks per MCQ are fixed; negative marking remains assessment-configurable.
    assessmentUpdate.marks_per_question = 1;
    assessmentUpdate.auto_submit = true;
    assessmentUpdate.show_leaderboard = true;
    assessmentUpdate.anti_cheat_enabled = true;
    assessmentUpdate.socket_monitoring = true;

    // ---------------------------------------------------------
    // Schedule
    // ---------------------------------------------------------

    if (settings.schedule?.startDate && settings.schedule?.startTime) {
      assessmentUpdate.start_time = `${settings.schedule.startDate}T${settings.schedule.startTime}:00`;
    }

    if (settings.schedule?.endDate && settings.schedule?.endTime) {
      assessmentUpdate.end_time = `${settings.schedule.endDate}T${settings.schedule.endTime}:00`;
    }

    assessmentUpdate.updated_at = new Date().toISOString();

    // ---------------------------------------------------------
    // Update assessments table
    // ---------------------------------------------------------

    if (Object.keys(assessmentUpdate).length > 0) {
      const { error } = await supabase
        .from("assessments")
        .update(assessmentUpdate)
        .eq("id", id);

      if (error) {
        throw error;
      }
    }

    // ---------------------------------------------------------
    // Update assessment_settings table
    // ---------------------------------------------------------

    const settingsUpdate = {
      assessment_id: id,

      allow_result_view: settings.results?.allowResultView ?? true,

      allow_certificate_download: settings.certificate?.enabled ?? false,

      allow_answer_review:
        settings.results?.allowAnswerReview ??
        settings.rules?.allowReview ??
        true,

      leaderboard_enabled: settings.results?.leaderboardEnabled ?? true,

      email_results: settings.notifications?.sendResultEmail ?? false,

      email_certificate:
        settings.notifications?.sendCertificateEmail ??
        settings.certificate?.sendEmail ??
        false,

      auto_generate_certificate: settings.certificate?.autoGenerate ?? false,

      updated_at: new Date().toISOString(),
    };

    const { error: settingsError } = await supabase
      .from("assessment_settings")
      .upsert(settingsUpdate, {
        onConflict: "assessment_id",
      });

    if (settingsError) {
      throw settingsError;
    }

    return res.json({
      success: true,
      message: "Assessment settings updated successfully.",
    });
  } catch (err) {
    console.error("Update Assessment Settings Error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
