const QuestionBank = require("../models/QuestionBank");

const createQuestionBank = async (
  data,
  adminId
) => {
  return await QuestionBank.create({
    ...data,
    audit: {
      createdBy: adminId,
    },
  });
};

const getQuestionBanks = async () => {
  return await QuestionBank.find()
    .populate("category", "name")
    .sort({ createdAt: -1 });
};

const getQuestionBankById = async (id) => {
  return await QuestionBank.findById(id)
    .populate("category", "name");
};

const updateQuestionBank = async (
  id,
  data,
  adminId
) => {
  return await QuestionBank.findByIdAndUpdate(
    id,
    {
      ...data,
      "audit.updatedBy": adminId,
    },
    {
      new: true,
      runValidators: true,
    }
  );
};

const archiveQuestionBank = async (
  id,
  adminId
) => {
  return await QuestionBank.findByIdAndUpdate(
    id,
    {
      status: "ARCHIVED",
      "audit.updatedBy": adminId,
    },
    {
      new: true,
    }
  );
};

const changeStatus = async (
  id,
  status,
  adminId
) => {
  return await QuestionBank.findByIdAndUpdate(
    id,
    {
      status,
      "audit.updatedBy": adminId,
    },
    {
      new: true,
    }
  );
};

module.exports = {
  createQuestionBank,
  getQuestionBanks,
  getQuestionBankById,
  updateQuestionBank,
  archiveQuestionBank,
  changeStatus,
};