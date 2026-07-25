const mongoose = require("mongoose");
const generateSequenceId = require("../utils/generateSequenceId");

/* ===========================
   IMAGE SCHEMA
=========================== */

const ImageSchema = new mongoose.Schema(
  {
    publicId: {
      type: String,
      default: "",
    },

    url: {
      type: String,
      default: "",
    },
  },
  {
    _id: false,
  }
);

/* ===========================
   QUESTION STATEMENT
=========================== */

const StatementSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: true,
      trim: true,
    },

    image: {
      type: ImageSchema,
      default: () => ({}),
    },

    audio: {
      type: ImageSchema,
      default: () => ({}),
    },

    video: {
      type: ImageSchema,
      default: () => ({}),
    },
  },
  {
    _id: false,
  }
);

/* ===========================
   OPTION
=========================== */

const OptionSchema = new mongoose.Schema(
  {
    optionId: {
      type: String,
      required: true,
      trim: true,
    },

    text: {
      type: String,
      default: "",
    },

    image: {
      type: ImageSchema,
      default: () => ({}),
    },

    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    _id: false,
  }
);

/* ===========================
   STATISTICS
=========================== */

const StatisticsSchema = new mongoose.Schema(
  {
    timesUsed: {
      type: Number,
      default: 0,
    },

    correctAttempts: {
      type: Number,
      default: 0,
    },

    wrongAttempts: {
      type: Number,
      default: 0,
    },

    averageTime: {
      type: Number,
      default: 0,
    },
  },
  {
    _id: false,
  }
);

/* ===========================
   MAIN SCHEMA
=========================== */

const QuestionSchema = new mongoose.Schema(
  {
    questionId: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      trim: true,
      default: "",
    },

    type: {
      type: String,
      enum: [
        "SINGLE_CHOICE",
        "MULTIPLE_CHOICE",
        "TRUE_FALSE",
        "FILL_BLANK",
        "NUMERIC",
        "MATCH",
        "SEQUENCE",
        "IMAGE",
        "AUDIO",
        "VIDEO",
        "CODE",
      ],
      default: "SINGLE_CHOICE",
    },

    statement: {
      type: StatementSchema,
      required: true,
    },

    options: {
      type: [OptionSchema],
      default: [],
    },

    correctAnswers: {
      type: [String],
      required: true,
      default: [],
    },

    explanation: {
      type: String,
      default: "",
    },

    marks: {
      type: Number,
      default: 1,
      min: 0,
    },

    negativeMarks: {
      type: Number,
      default: 0,
      min: 0,
    },

    difficulty: {
      type: String,
      enum: ["EASY", "MEDIUM", "HARD"],
      default: "MEDIUM",
      index: true,
    },

    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionCategory",
      default: null,
      index: true,
    },

    tags: [
      {
        type: String,
        trim: true,
      },
    ],

    statistics: {
      type: StatisticsSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "ARCHIVED"],
      default: "ACTIVE",
      index: true,
    },

    audit: {
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        required: true,
      },

      updatedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Admin",
        default: null,
      },
    },
  },
  {
    timestamps: true,
  }
);

/* ===========================
   INDEXES
=========================== */

QuestionSchema.index({
  category: 1,
  difficulty: 1,
  status: 1,
});

QuestionSchema.index({
  difficulty: 1,
  status: 1,
});

/* ===========================
   ID GENERATION
=========================== */

QuestionSchema.pre("save", async function (next) {
  try {
    if (!this.questionId) {
      this.questionId = await generateSequenceId(
        "question",
        "QUES"
      );
    }

    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model("Question", QuestionSchema);