const Assessment = require("../models/Assessment");
const QuestionBank = require("../models/QuestionBank");
const QuestionBankQuestion = require("../models/QuestionBankQuestion");
const {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} = require("../constants/pagination");

/* ===========================
   VALIDATE QUESTION BANKS
=========================== */

const validateQuestionBanks = async (questionBanks) => {
  const uniqueBankIds = new Set(
    questionBanks.map((bank) => bank.bank.toString()),
  );

  if (uniqueBankIds.size !== questionBanks.length) {
    throw new Error("Duplicate question banks are not allowed.");
  }

  const bankIds = questionBanks.map((bank) => bank.bank);

  const existingBanks = await QuestionBank.find({
    _id: { $in: bankIds },
    status: "ACTIVE",
  });

  if (existingBanks.length !== bankIds.length) {
    throw new Error("One or more question banks are invalid or inactive.");
  }

  const bankMap = new Map(
    existingBanks.map((bank) => [bank._id.toString(), bank]),
  );

  const bankCounts = await QuestionBankQuestion.aggregate([
    {
      $match: {
        questionBank: { $in: bankIds },
        isActive: true,
      },
    },
    {
      $group: {
        _id: "$questionBank",
        totalQuestions: {
          $sum: 1,
        },
      },
    },
  ]);

  const questionCountMap = new Map(
    bankCounts.map((item) => [item._id.toString(), item.totalQuestions]),
  );

  for (const configuredBank of questionBanks) {
    const bank = bankMap.get(configuredBank.bank.toString());

    const availableQuestions =
      questionCountMap.get(configuredBank.bank.toString()) || 0;

    if (availableQuestions < configuredBank.questionsPerAttempt) {
      throw new Error(
        `Question Bank "${bank.name}" has only ${availableQuestions} active questions, but ${configuredBank.questionsPerAttempt} are required.`,
      );
    }
  }
};

/* ===========================
   CREATE ASSESSMENT
=========================== */

const createAssessment = async (data, adminId) => {
  await validateQuestionBanks(data.questionBanks);

  const totalQuestionsConfigured = data.questionBanks.reduce(
    (sum, bank) => sum + bank.questionsPerAttempt,
    0,
  );

  const estimatedMarks = totalQuestionsConfigured * data.marksPerQuestion;

  if (data.passingMarks > estimatedMarks) {
    throw new Error("Passing marks cannot exceed total assessment marks.");
  }

  const statistics = {
    totalQuestionBanks: data.questionBanks.length,

    totalQuestionsConfigured,

    estimatedMarks,
  };

  // Create Assessment
  return await Assessment.create({
    ...data,

    statistics,

    audit: {
      createdBy: adminId,
    },
  });
};

/* ===========================
   GET ALL ASSESSMENTS
=========================== */

const getAssessments = async (filters = {}) => {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search,
    status,
    sortBy = DEFAULT_SORT_BY,
    sortOrder = DEFAULT_SORT_ORDER,
  } = filters;

  const safeLimit = Math.max(1, Math.min(Number(limit), MAX_LIMIT));

  const safePage = Math.max(1, Number(page));

  const skip = (safePage - 1) * safeLimit;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (search) {
    query.$or = [
      {
        title: {
          $regex: search,
          $options: "i",
        },
      },
      {
        description: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [assessments, total] = await Promise.all([
    Assessment.find(query)
      .populate("questionBanks.bank", "name category")
      .sort(sort)
      .skip(skip)
      .limit(safeLimit),

    Assessment.countDocuments(query),
  ]);

  return {
    assessments,

    pagination: {
      total,

      page: safePage,

      limit: safeLimit,

      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

/* ===========================
   GET ASSESSMENT
=========================== */

const getAssessmentById = async (id) => {
  return await Assessment.findById(id).populate(
    "questionBanks.bank",
    "name category statistics",
  );
};

/* ===========================
   UPDATE ASSESSMENT
=========================== */

const updateAssessment = async (id, data, adminId) => {
  if (data.questionBanks || data.marksPerQuestion || data.passingMarks) {
    // Get existing assessment
    const assessment = await Assessment.findById(id);

    if (!assessment) {
      throw new Error("Assessment not found.");
    }

    // Use updated values if provided, otherwise existing values
    const questionBanks =
      data.questionBanks || assessment.questionBanks;

    const marksPerQuestion =
      data.marksPerQuestion ?? assessment.marksPerQuestion;

    const passingMarks =
      data.passingMarks ?? assessment.passingMarks;

    // Validate question banks only if they were changed
    if (data.questionBanks) {
      await validateQuestionBanks(questionBanks);
    }

    // Calculate statistics
    const totalQuestionsConfigured = questionBanks.reduce(
      (sum, bank) => sum + bank.questionsPerAttempt,
      0,
    );

    const estimatedMarks =
      totalQuestionsConfigured * marksPerQuestion;

    // Validate passing marks
    if (passingMarks > estimatedMarks) {
      throw new Error(
        "Passing marks cannot exceed total assessment marks.",
      );
    }

    // Update statistics
    data.statistics = {
      totalQuestionBanks: questionBanks.length,
      totalQuestionsConfigured,
      estimatedMarks,
    };
  }

  return await Assessment.findByIdAndUpdate(
    id,
    {
      ...data,
      "audit.updatedBy": adminId,
    },
    {
      new: true,
      runValidators: true,
    },
  );
};

/* ===========================
   ARCHIVE ASSESSMENT
=========================== */

const archiveAssessment = async (id, adminId) => {
  return await Assessment.findByIdAndUpdate(
    id,

    {
      status: "ARCHIVED",
      "audit.updatedBy": adminId,
    },

    {
      new: true,
    },
  );
};

/* ===========================
   CHANGE STATUS
=========================== */

const changeStatus = async (id, status, adminId) => {
  return await Assessment.findByIdAndUpdate(
    id,

    {
      status,
      "audit.updatedBy": adminId,
    },

    {
      new: true,
    },
  );
};

module.exports = {
  createAssessment,
  getAssessments,
  getAssessmentById,
  updateAssessment,
  archiveAssessment,
  changeStatus,
};
