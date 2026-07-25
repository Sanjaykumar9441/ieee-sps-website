const {
  createQuestionCategorySchema,
  updateQuestionCategorySchema,
} = require("../validators/questionCategoryValidator");

const categoryService = require("../services/questionCategoryService");

/* ===========================
   CREATE CATEGORY
=========================== */

const createCategory = async (req, res) => {
  try {
    const { error, value } =
      createQuestionCategorySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const category =
      await categoryService.createCategory(
        value,
        req.admin._id
      );

    res.status(201).json({
      success: true,
      message: "Category created successfully.",
      data: category,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to create category.",
    });
  }
};

/* ===========================
   GET ALL
=========================== */

const getCategories = async (req, res) => {
  try {
    const categories =
      await categoryService.getCategories();

    res.json({
      success: true,
      data: categories,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch categories.",
    });
  }
};

/* ===========================
   GET ONE
=========================== */

const getCategory = async (req, res) => {
  try {
    const category =
      await categoryService.getCategoryById(
        req.params.id
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.json({
      success: true,
      data: category,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to fetch category.",
    });
  }
};

/* ===========================
   UPDATE
=========================== */

const updateCategory = async (req, res) => {
  try {
    const { error, value } =
      updateQuestionCategorySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message,
      });
    }

    const category =
      await categoryService.updateCategory(
        req.params.id,
        value,
        req.admin._id
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.json({
      success: true,
      message: "Category updated successfully.",
      data: category,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to update category.",
    });
  }
};

/* ===========================
   ARCHIVE
=========================== */

const archiveCategory = async (req, res) => {
  try {
    const category =
      await categoryService.archiveCategory(
        req.params.id,
        req.admin._id
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.json({
      success: true,
      message: "Category archived successfully.",
      data: category,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to archive category.",
    });
  }
};

/* ===========================
   CHANGE STATUS
=========================== */

const changeStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const category =
      await categoryService.changeStatus(
        req.params.id,
        status,
        req.admin._id
      );

    if (!category) {
      return res.status(404).json({
        success: false,
        message: "Category not found.",
      });
    }

    res.json({
      success: true,
      message: "Status updated successfully.",
      data: category,
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      success: false,
      message: "Failed to change status.",
    });
  }
};

module.exports = {
  createCategory,
  getCategories,
  getCategory,
  updateCategory,
  archiveCategory,
  changeStatus,
};