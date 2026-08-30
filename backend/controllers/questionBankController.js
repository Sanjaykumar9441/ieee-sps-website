const QuestionBank = require("../models/QuestionBank");
const Question = require("../models/Question");
const liveEvents = require("../services/liveEvents");

/* ============================================================
   HELPERS
============================================================ */

function normalizeQuestion(question, bankId) {
  const options = Array.isArray(question.options)
    ? question.options
    : [];

  const correctAnswers = Array.isArray(question.correct_answers)
    ? question.correct_answers
    : [];

  return {
    bank_id: bankId,

    question_type:
      question.question_type === "MULTIPLE_CORRECT"
        ? "MULTIPLE_CORRECT"
        : "MCQ",

    question_text: String(
      question.question_text || ""
    ).trim(),

    question_image_id:
      question.question_image_id || null,

    options,

    correct_answers: correctAnswers,

    explanation:
      question.explanation || null,

    difficulty:
      question.difficulty || "MEDIUM",

    // Marks are no longer used for assessment configuration.
    // Keep database compatibility.
    marks: 1,

    // No negative marking.
    negative_marks: 0,

    estimated_seconds:
      Number(question.estimated_seconds || 60),

    tags:
      Array.isArray(question.tags)
        ? question.tags
        : [],

    language:
      question.language || "English",

    version:
      Number(question.version || 1),

    is_active:
      question.is_active !== false,
  };
}


/* ============================================================
   VALIDATE SINGLE QUESTION
============================================================ */

function validateQuestion(question, index) {
  const errors = [];

  if (!question.question_text?.trim()) {
    errors.push("Question text is required.");
  }

  const questionType =
    question.question_type || "MCQ";

  if (
    questionType !== "MCQ" &&
    questionType !== "MULTIPLE_CORRECT"
  ) {
    errors.push(
      "Question type must be MCQ or MULTIPLE_CORRECT."
    );
  }

  if (
    !Array.isArray(question.options) ||
    question.options.length !== 4
  ) {
    errors.push(
      "Question must contain exactly 4 options."
    );
  }

  if (
    !Array.isArray(question.correct_answers) ||
    question.correct_answers.length === 0
  ) {
    errors.push(
      "At least one correct answer is required."
    );
  }

  if (
    questionType === "MCQ" &&
    Array.isArray(question.correct_answers) &&
    question.correct_answers.length !== 1
  ) {
    errors.push(
      "MCQ must have exactly one correct answer."
    );
  }

  if (
    questionType === "MULTIPLE_CORRECT" &&
    Array.isArray(question.correct_answers) &&
    question.correct_answers.length < 2
  ) {
    errors.push(
      "MULTIPLE_CORRECT must have at least two correct answers."
    );
  }

  if (
    Array.isArray(question.correct_answers) &&
    Array.isArray(question.options)
  ) {
    const invalidAnswer =
      question.correct_answers.some(
        (answer) =>
          !question.options.includes(answer)
      );

    if (invalidAnswer) {
      errors.push(
        "Correct answer must match one of the options."
      );
    }
  }

  return {
    question: `Question ${index + 1}`,

    status:
      errors.length === 0
        ? "valid"
        : "invalid",

    message:
      errors.length === 0
        ? "Question is valid."
        : errors.join(" "),
  };
}


/* ============================================================
   LIST QUESTION BANKS
============================================================ */

exports.list = async (req, res) => {
  try {
    const { assessmentId } = req.params;

    if (!assessmentId) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    const { data, error } =
      await QuestionBank.getAll(assessmentId);

    if (error) {
      throw error;
    }

    return res.json({
      success: true,
      questionBanks: data || [],
    });

  } catch (err) {
    console.error(
      "LIST QUESTION BANKS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   CREATE QUESTION BANK
============================================================ */

exports.create = async (req, res) => {
  try {
    const body = req.body || {};

    if (!body.assessment_id) {
      return res.status(400).json({
        success: false,
        message: "Assessment ID is required.",
      });
    }

    if (!body.name?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Question bank name is required.",
      });
    }

    const pick = Number(
      body.questions_to_pick
    );

    if (
      !Number.isInteger(pick) ||
      pick < 1
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Questions to pick must be at least 1.",
      });
    }

    const { data, error } =
      await QuestionBank.create({
        ...body,
        name: body.name.trim(),
        questions_to_pick: pick,
      });

    if (error) {
      console.error(
        "QUESTION BANK SUPABASE ERROR:",
        error
      );

      return res.status(
        error.code === "23505"
          ? 409
          : 500
      ).json({
        success: false,
        message:
          error.message ||
          "Unable to create Question Bank.",
        code: error.code || null,
        details:
          error.details || null,
        hint:
          error.hint || null,
      });
    }

    liveEvents.emitQuestionBankCreated(
      body.assessment_id,
      data
    );

    return res.status(201).json({
      success: true,
      message:
        "Question bank created successfully.",
      questionBank: data,
    });

  } catch (err) {
    console.error(
      "CREATE QUESTION BANK ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   UPDATE QUESTION BANK
============================================================ */

exports.update = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Question Bank ID is required.",
      });
    }

    const { data, error } =
      await QuestionBank.update(
        id,
        req.body || {}
      );

    if (error) {
      throw error;
    }

    if (req.body?.assessment_id) {
      liveEvents.emitQuestionBankUpdated(
        req.body.assessment_id,
        data
      );
    }

    return res.json({
      success: true,
      message:
        "Question bank updated successfully.",
      questionBank: data,
    });

  } catch (err) {
    console.error(
      "UPDATE QUESTION BANK ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   DUPLICATE QUESTION BANK
============================================================ */

exports.duplicate = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Question Bank ID is required.",
      });
    }

    const { data, error } =
      await QuestionBank.duplicate(id);

    if (error) {
      throw error;
    }

    if (data?.assessmentId) {
      liveEvents.emitQuestionBankCreated(
        data.assessmentId,
        data.questionBank
      );
    }

    return res.status(201).json({
      success: true,
      message:
        "Question bank duplicated successfully.",
      questionBank:
        data?.questionBank || null,
    });

  } catch (err) {
    console.error(
      "DUPLICATE QUESTION BANK ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   DELETE QUESTION BANK
============================================================ */

exports.delete = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id) {
      return res.status(400).json({
        success: false,
        message:
          "Question Bank ID is required.",
      });
    }

    const { data, error } =
      await QuestionBank.delete(id);

    if (error) {
      throw error;
    }

    if (data?.assessmentId) {
      liveEvents.emitQuestionBankDeleted(
        data.assessmentId,
        data.questionBank
      );
    }

    return res.json({
      success: true,
      message:
        "Question bank deleted successfully.",
    });

  } catch (err) {
    console.error(
      "DELETE QUESTION BANK ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   IMPORT QUESTIONS
   Receive questions before final import.
============================================================ */

exports.importQuestions = async (
  req,
  res
) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message:
          "Question Bank ID is required.",
      });
    }

    if (
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No questions supplied.",
      });
    }

    const normalizedQuestions =
      questions.map((question) =>
        normalizeQuestion(
          question,
          bankId
        )
      );

    return res.json({
      success: true,
      message:
        "Questions received successfully.",
      questions:
        normalizedQuestions,
      total:
        normalizedQuestions.length,
    });

  } catch (err) {
    console.error(
      "IMPORT QUESTIONS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   CHECK DUPLICATES
============================================================ */

exports.checkDuplicates = async (
  req,
  res
) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message:
          "Question Bank ID is required.",
      });
    }

    if (!Array.isArray(questions)) {
      return res.status(400).json({
        success: false,
        message:
          "Questions array is required.",
      });
    }

    const {
      data: existingQuestions,
      error,
    } = await Question.getAll(bankId);

    if (error) {
      throw error;
    }

    const duplicates = [];

    for (const question of questions) {
      const incomingText =
        String(
          question.question_text || ""
        )
          .trim()
          .toLowerCase();

      if (!incomingText) {
        continue;
      }

      const match =
        (existingQuestions || [])
          .find(
            (existing) =>
              String(
                existing.question_text ||
                  ""
              )
                .trim()
                .toLowerCase() ===
              incomingText
          );

      if (match) {
        duplicates.push({
          question:
            question.question_text,
          match:
            match.question_text,
          similarity: 100,
        });
      }
    }

    return res.json({
      success: true,
      duplicates,
      total:
        duplicates.length,
    });

  } catch (err) {
    console.error(
      "CHECK DUPLICATES ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   VALIDATE QUESTIONS
============================================================ */

exports.validateQuestions = async (
  req,
  res
) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message:
          "Question Bank ID is required.",
      });
    }

    if (
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No questions supplied for validation.",
        results: [],
      });
    }

    const normalizedQuestions =
      questions.map((question) =>
        normalizeQuestion(
          question,
          bankId
        )
      );

    const results =
      normalizedQuestions.map(
        (question, index) =>
          validateQuestion(
            question,
            index
          )
      );

    const invalidCount =
      results.filter(
        (result) =>
          result.status === "invalid"
      ).length;

    return res.json({
      success: true,

      valid:
        invalidCount === 0,

      results,

      total:
        results.length,

      validCount:
        results.length -
        invalidCount,

      invalidCount,
    });

  } catch (err) {
    console.error(
      "VALIDATE QUESTIONS ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};


/* ============================================================
   FINAL IMPORT
============================================================ */

exports.finalImport = async (
  req,
  res
) => {
  try {
    const { bankId } = req.params;
    const { questions } = req.body || {};

    if (!bankId) {
      return res.status(400).json({
        success: false,
        message:
          "Question Bank ID is required.",
      });
    }

    if (
      !Array.isArray(questions) ||
      questions.length === 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "No questions to import.",
      });
    }

    const normalizedQuestions =
      questions.map((question) =>
        normalizeQuestion(
          question,
          bankId
        )
      );

    /* --------------------------------------------------------
       VALIDATE
    -------------------------------------------------------- */

    const validationResults =
      normalizedQuestions.map(
        (question, index) =>
          validateQuestion(
            question,
            index
          )
      );

    const invalidQuestions =
      validationResults.filter(
        (result) =>
          result.status === "invalid"
      );

    if (
      invalidQuestions.length > 0
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Some questions failed validation.",
        results:
          validationResults,
      });
    }

    /* --------------------------------------------------------
       GET EXISTING QUESTIONS
    -------------------------------------------------------- */

    const {
      data: existingQuestions,
      error: existingError,
    } = await Question.getAll(
      bankId
    );

    if (existingError) {
      throw existingError;
    }

    const existingTexts =
      new Set(
        (existingQuestions || [])
          .map((question) =>
            String(
              question.question_text ||
                ""
            )
              .trim()
              .toLowerCase()
          )
      );

    /* --------------------------------------------------------
       REMOVE DUPLICATES
    -------------------------------------------------------- */

    const importableQuestions =
      normalizedQuestions.filter(
        (question) =>
          !existingTexts.has(
            String(
              question.question_text
            )
              .trim()
              .toLowerCase()
          )
      );

    const duplicateCount =
      normalizedQuestions.length -
      importableQuestions.length;

    let imported = 0;

    /* --------------------------------------------------------
       INSERT
    -------------------------------------------------------- */

    if (
      importableQuestions.length > 0
    ) {
      const rowsForDb =
        importableQuestions.map(
          (question) => {

            /*
             * Store options as:
             *
             * {
             *   A: "...",
             *   B: "...",
             *   C: "...",
             *   D: "..."
             * }
             */

            const optionKeys = [
              "A",
              "B",
              "C",
              "D",
            ];

            const options = {};

            (
              question.options || []
            ).forEach(
              (option, index) => {
                const text =
                  String(
                    option ?? ""
                  ).trim();

                if (
                  text &&
                  optionKeys[index]
                ) {
                  options[
                    optionKeys[index]
                  ] = text;
                }
              }
            );

            return {
              ...question,
              options,
            };
          }
        );

      const {
        data,
        error,
      } = await Question.bulkCreate(
        rowsForDb
      );

      if (error) {
        throw error;
      }

      imported =
        data?.length || 0;
    }

    /* --------------------------------------------------------
       UPDATE QUESTION COUNT
    -------------------------------------------------------- */

    const {
      count,
      error: countError,
    } = await Question.count(
      bankId
    );

    if (countError) {
      throw countError;
    }

    await QuestionBank.update(
      bankId,
      {
        total_questions:
          count || 0,
      }
    );

    /* --------------------------------------------------------
       GET UPDATED BANK
    -------------------------------------------------------- */

    const {
      data: bank,
    } = await QuestionBank.get(
      bankId
    );

    if (bank?.assessment_id) {
      liveEvents.emitQuestionBankUpdated(
        bank.assessment_id,
        bank
      );
    }

    return res.json({
      success: true,

      imported,

      duplicates:
        duplicateCount,

      warnings: 0,

      errors: 0,

      totalQuestions:
        count || 0,

      message:
        "Questions imported successfully.",
    });

  } catch (err) {
    console.error(
      "FINAL IMPORT ERROR:",
      err
    );

    return res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};