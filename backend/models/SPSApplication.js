const mongoose = require("mongoose");

const spsApplicationSchema = new mongoose.Schema(
  {
    rollNumber: {
      type: String,
      required: true,
    },

    fullName: {
      type: String,
      required: true,
    },

    department: {
      type: String,
      required: true,
    },

    year: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
    },

    mobile: {
      type: String,
      required: true,
    },

    interested: {
      type: Boolean,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

module.exports = mongoose.model(
  "SPSApplication",
  spsApplicationSchema,
);