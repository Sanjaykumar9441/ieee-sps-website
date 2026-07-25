const QuestionCategory = require("../models/QuestionCategory");

const createCategory = async (data, adminId) => {
  const category = await QuestionCategory.create({
    ...data,

    audit: {
      createdBy: adminId,
    },
  });

  return category;
};

const getCategories = async () => {
  return await QuestionCategory.find()
    .populate("parentCategory", "name")
    .sort({ createdAt: -1 });
};

const getCategoryById = async (id) => {
  return await QuestionCategory.findById(id)
    .populate("parentCategory", "name");
};

const updateCategory = async (
  id,
  data,
  adminId
) => {
  return await QuestionCategory.findByIdAndUpdate(
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

const archiveCategory = async (
  id,
  adminId
) => {
  return await QuestionCategory.findByIdAndUpdate(
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
  return await QuestionCategory.findByIdAndUpdate(
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
  createCategory,
  getCategories,
  getCategoryById,
  updateCategory,
  archiveCategory,
  changeStatus,
};