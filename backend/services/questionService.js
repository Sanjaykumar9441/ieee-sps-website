const Question = require("../models/Question");
const QuestionBankQuestion = require("../models/QuestionBankQuestion");

const {
  DEFAULT_PAGE,
  DEFAULT_LIMIT,
  MAX_LIMIT,
  DEFAULT_SORT_BY,
  DEFAULT_SORT_ORDER,
} = require("../constants/pagination");

/* ===========================
   CREATE QUESTION
=========================== */

const createQuestion = async (data, adminId) => {
  return await Question.create({
    ...data,
    audit: {
      createdBy: adminId,
    },
  });
};

/* ===========================
   GET ALL QUESTIONS
=========================== */

const getQuestions = async (filters = {}) => {
  const {
    page = DEFAULT_PAGE,
    limit = DEFAULT_LIMIT,
    search,
    category,
    difficulty,
    type,
    status,
    sortBy = DEFAULT_SORT_BY,
    sortOrder = DEFAULT_SORT_ORDER,
  } = filters;

  const query = {};

  if (status) {
    query.status = status;
  }

  if (category) {
    query.category = category;
  }

  if (difficulty) {
    query.difficulty = difficulty;
  }

  if (type) {
    query.type = type;
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
        statement: {
          $regex: search,
          $options: "i",
        },
      },
    ];
  }

  const skip = (Number(page) - 1) * Number(limit);

  const sort = {
    [sortBy]: sortOrder === "asc" ? 1 : -1,
  };

  const [questions, total] = await Promise.all([
    Question.find(query)
      .populate("category", "name")
      .sort(sort)
      .skip(skip)
      .limit(safeLimit),

    Question.countDocuments(query),
  ]);

  return {
    questions,
    pagination: {
      total,
      page: Number(page),
     limit: safeLimit,
      totalPages: Math.ceil(total / safeLimit),
    },
  };
};

/* ===========================
   GET QUESTION BY ID
=========================== */

const getQuestionById = async (id) => {
  return await Question.findById(id).populate("category", "name");
};

/* ===========================
   GET QUESTION WITH BANKS
=========================== */

const getQuestionWithBanks = async (id) => {
  const question = await Question.findById(id)
    .populate("category", "name");

  const mappings = await QuestionBankQuestion.find({
    question: id,
  }).populate("bank", "name");

  return {
    question,
    banks: mappings.map((item) => item.bank),
  };
};

/* ===========================
   UPDATE QUESTION
=========================== */

const updateQuestion = async (id, data, adminId) => {
  return await Question.findByIdAndUpdate(
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
   ARCHIVE QUESTION
=========================== */

const archiveQuestion = async (id, adminId) => {
  return await Question.findByIdAndUpdate(
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
  return await Question.findByIdAndUpdate(
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
  createQuestion,
  getQuestions,
  getQuestionById,
  getQuestionWithBanks,
  updateQuestion,
  archiveQuestion,
  changeStatus,
};