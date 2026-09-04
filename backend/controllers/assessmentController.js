const Assessment = require("../models/Assessment");
const { supabase } = require("../lib/supabase");

async function enrichAssessmentQuestions(assessment) {
  if (!assessment?.id) return assessment;
  const { data: mappings } = await supabase
    .from("assessment_question_banks")
    .select("questions_to_pick")
    .eq("assessment_id", assessment.id);
  const selected = (mappings || []).reduce(
    (sum, m) => sum + Number(m.questions_to_pick || 0),
    0,
  );
  return {
    ...assessment,
    total_questions: selected || Number(assessment.total_questions || 0),
  };
}

exports.getAssessments = async (req, res) => {
  try {
    const { data, error } = await Assessment.getAll();

    if (error) throw error;

    const assessments = await Promise.all(
      (data || []).map(async (assessment) => ({
        ...(await enrichAssessmentQuestions(assessment)),
        is_published:
          assessment.is_published ?? assessment.status === "PUBLISHED",
      })),
    );

    return res.json({
      success: true,
      assessments,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const { data, error } = await Assessment.getCategories();

    if (error) throw error;

    return res.json({
      success: true,
      categories: data || [],
    });
  } catch (err) {
    console.error("Get assessment categories error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getSubjects = async (req, res) => {
  try {
    const { category_id } = req.query;

    const { data, error } = await Assessment.getSubjects(category_id || null);

    if (error) throw error;

    return res.json({
      success: true,
      subjects: data || [],
    });
  } catch (err) {
    console.error("Get assessment subjects error:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.getById(id);

    if (error) throw error;

    return res.json({
      success: true,
      assessment: await enrichAssessmentQuestions(data),
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.createAssessment = async (req, res) => {
  try {
    const body = {
      title: String(req.body.title || "").trim(),
      slug: String(req.body.slug || "").trim(),
      description: req.body.description?.trim() || null,
      start_time: req.body.start_time || null,
      end_time: req.body.end_time || null,
      duration_minutes: Number(req.body.duration_minutes || 30),
      total_questions: Number(req.body.total_questions || 0),
      participation_mode: [
        "INDIVIDUAL_STUDENTS",
        "STUDENT_TEAMS",
        "TEAM",
      ].includes(
        String(
          req.body.participation_mode || "INDIVIDUAL_STUDENTS",
        ).toUpperCase(),
      )
        ? String(
            req.body.participation_mode || "INDIVIDUAL_STUDENTS",
          ).toUpperCase()
        : "INDIVIDUAL_STUDENTS",
      pass_percentage: Number(req.body.pass_percentage ?? 40),
      marks_per_question: Math.max(0, Number(req.body.marks_per_question ?? 1)),
      negative_marks: Math.max(0, Number(req.body.negative_marks ?? 0)),
      auto_submit: true,
      show_leaderboard: true,
      anti_cheat_enabled: true,
      socket_monitoring: true,
      shuffle_questions: req.body.shuffle_questions !== false,
      shuffle_options: req.body.shuffle_options !== false,
      random_questions: req.body.random_questions !== false,
      status: req.body.status || "DRAFT",
      is_active: Boolean(req.body.is_active),
      login_method: ["PASSWORD", "OTP"].includes(
        String(req.body.login_method || "PASSWORD").toUpperCase(),
      )
        ? String(req.body.login_method || "PASSWORD").toUpperCase()
        : "PASSWORD",
      live_updates_enabled: req.body.live_updates_enabled !== false,
    };

    if (
      !Number.isFinite(body.marks_per_question) ||
      body.marks_per_question < 0
    ) {
      return res
        .status(400)
        .json({
          success: false,
          message:
            "Correct-answer marks must be a valid number greater than or equal to 0.",
        });
    }

    if (!body.title) {
      return res.status(400).json({
        success: false,
        message: "Assessment title is required.",
      });
    }

    if (body.passing_score == null && body.pass_percentage != null) {
      body.passing_score =
        (Number(body.total_questions) *
          Number(body.marks_per_question) *
          Number(body.pass_percentage)) /
        100;
    }

    const { data, error } = await Assessment.create(body);

    if (error) {
      console.error("ASSESSMENT SUPABASE ERROR:", error);
      throw error;
    }

    return res.status(201).json({
      success: true,
      message: "Assessment created successfully.",
      assessment: data,
    });
  } catch (err) {
    console.error("CREATE ASSESSMENT ERROR:", err);

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.updateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const input = req.body || {};
    const update = {};

    if (input.title !== undefined) update.title = String(input.title).trim();
    if (input.slug !== undefined) update.slug = String(input.slug).trim();
    if (input.description !== undefined)
      update.description = input.description?.trim() || null;
    if (input.start_time !== undefined) update.start_time = input.start_time;
    if (input.end_time !== undefined) update.end_time = input.end_time;
    if (input.duration_minutes !== undefined)
      update.duration_minutes = Number(input.duration_minutes);
    if (input.total_questions !== undefined)
      update.total_questions = Number(input.total_questions);
    if (input.participation_mode !== undefined) {
      const mode = String(input.participation_mode).toUpperCase();
      if (!["INDIVIDUAL_STUDENTS", "STUDENT_TEAMS", "TEAM"].includes(mode))
        return res
          .status(400)
          .json({ success: false, message: "Invalid participation mode." });
      update.participation_mode = mode;
    }
    if (input.marks_per_question !== undefined) {
      const marks = Number(input.marks_per_question);
      if (!Number.isFinite(marks) || marks < 0)
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Correct-answer marks must be a valid number greater than or equal to 0.",
          });
      update.marks_per_question = marks;
    }
    if (input.pass_percentage !== undefined)
      update.pass_percentage = Number(input.pass_percentage);
    if (input.shuffle_questions !== undefined)
      update.shuffle_questions = Boolean(input.shuffle_questions);
    if (input.shuffle_options !== undefined)
      update.shuffle_options = Boolean(input.shuffle_options);
    if (input.random_questions !== undefined)
      update.random_questions = Boolean(input.random_questions);
    if (input.login_method !== undefined) {
      const method = String(input.login_method).toUpperCase();
      if (!["PASSWORD", "OTP"].includes(method))
        return res
          .status(400)
          .json({
            success: false,
            message: "Login method must be PASSWORD or OTP.",
          });
      update.login_method = method;
    }
    if (input.live_updates_enabled !== undefined)
      update.live_updates_enabled = Boolean(input.live_updates_enabled);
    if (input.negative_marks !== undefined) {
      const negativeMarks = Number(input.negative_marks);
      if (!Number.isFinite(negativeMarks) || negativeMarks < 0) {
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Negative marks must be a valid number greater than or equal to 0.",
          });
      }
      update.negative_marks = negativeMarks;
    }

    update.auto_submit = true;
    update.show_leaderboard = true;
    update.anti_cheat_enabled = true;
    update.socket_monitoring = true;

    if (
      update.marks_per_question !== undefined ||
      update.total_questions !== undefined ||
      update.pass_percentage !== undefined
    ) {
      const total = Number(update.total_questions ?? 0);
      const marks = Number(update.marks_per_question ?? 1);
      const pass = Number(update.pass_percentage ?? 40);
      if (!Number.isFinite(marks) || marks < 0)
        return res
          .status(400)
          .json({
            success: false,
            message:
              "Correct-answer marks must be a valid number greater than or equal to 0.",
          });
      if (Number.isFinite(total) && total >= 0)
        update.passing_score = Number(
          ((total * marks * pass) / 100).toFixed(2),
        );
    }

    if (!update.title && input.title !== undefined) {
      return res
        .status(400)
        .json({ success: false, message: "Assessment title is required." });
    }

    const { data, error } = await Assessment.update(id, update);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Assessment updated successfully.",
      assessment: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deleteAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.delete(id);

    if (error) throw error;

    return res.json({
      success: true,
      message:
        "Assessment and its exclusive question banks/questions deleted successfully.",
      data: data || null,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.restoreAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.restore(id);

    if (error) throw error;

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.duplicateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.duplicate(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Assessment duplicated successfully.",
      assessment: data,
    });
  } catch (err) {
    return res.status(500).json({
      message: err.message,
    });
  }
};

exports.activateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.activate(id);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.deactivateAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.deactivate(id);

    if (error) throw error;

    return res.json(data);
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.publishAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.publish(id);

    if (error) throw error;

    return res.json({
      success: true,
      assessment: { ...data, is_published: true },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.unpublishAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.unpublish(id);

    if (error) throw error;

    return res.json({
      success: true,
      assessment: { ...data, is_published: false },
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.archiveAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { error } = await Assessment.archive(id);
    if (error) throw error;

    return res.json({
      success: true,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.resetAssessment = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.reset(id);

    if (error) throw error;

    return res.json({
      success: true,
      message: "Assessment reset successfully.",
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.statistics = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.statistics(id);
    if (error) throw error;

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.history = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } = await Assessment.history(id);

    if (error) throw error;

    return res.json({
      success: true,
      data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};
