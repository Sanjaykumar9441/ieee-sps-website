const mongoose = require("mongoose");
const slugify = require("slugify");
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
  { _id: false },
);

/* ===========================
   SCHEDULE
=========================== */

const ScheduleSchema = new mongoose.Schema(
  {
    registrationStart: Date,
    registrationEnd: Date,

    assessmentStart: {
      type: Date,
      required: true,
    },

    assessmentEnd: {
      type: Date,
      required: true,
    },

    duration: {
      type: Number,
      required: true,
      min: 1,
    },

    timezone: {
      type: String,
      default: "Asia/Kolkata",
    },
  },
  { _id: false },
);

/* ===========================
   SECURITY
=========================== */

const SecuritySchema = new mongoose.Schema(
  {
    level: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH", "STRICT"],
      default: "MEDIUM",
    },

    requireFullscreen: {
      type: Boolean,
      default: true,
    },

    autoSubmit: {
      type: Boolean,
      default: true,
    },

    allowResume: {
      type: Boolean,
      default: false,
    },

    maxTabSwitches: {
      type: Number,
      default: 2,
    },

    maxRefreshes: {
      type: Number,
      default: 0,
    },

    disableCopy: {
      type: Boolean,
      default: true,
    },

    disablePaste: {
      type: Boolean,
      default: true,
    },

    disableRightClick: {
      type: Boolean,
      default: true,
    },

    disableTextSelection: {
      type: Boolean,
      default: true,
    },

    captureIP: {
      type: Boolean,
      default: true,
    },

    captureBrowser: {
      type: Boolean,
      default: true,
    },

    captureDevice: {
      type: Boolean,
      default: true,
    },
  },
  { _id: false },
);

/* ===========================
   RESULT CONFIGURATION
=========================== */

const ResultSchema = new mongoose.Schema(
  {
    showScore: {
      type: Boolean,
      default: true,
    },

    showCorrectAnswers: {
      type: Boolean,
      default: false,
    },

    showRank: {
      type: Boolean,
      default: false,
    },

    showLeaderboard: {
      type: Boolean,
      default: false,
    },

    generateCertificate: {
      type: Boolean,
      default: false,
    },

    publishResultAt: {
      type: Date,
      default: null,
    },
  },
  { _id: false },
);

/* ===========================
   ANALYTICS
=========================== */

const AnalyticsSchema = new mongoose.Schema(
  {
    participants: {
      type: Number,
      default: 0,
    },

    started: {
      type: Number,
      default: 0,
    },

    completed: {
      type: Number,
      default: 0,
    },

    disqualified: {
      type: Number,
      default: 0,
    },

    averageScore: {
      type: Number,
      default: 0,
    },

    highestScore: {
      type: Number,
      default: 0,
    },

    lowestScore: {
      type: Number,
      default: 0,
    },
  },
  { _id: false },
);

/* ===========================
   QUESTION BANK CONFIGURATION
=========================== */

const QuestionBankConfigSchema = new mongoose.Schema(
  {
    bank: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "QuestionBank",
      required: true,
    },

    questionsPerAttempt: {
      type: Number,
      required: true,
      min: 1,
    },

    selectionStrategy: {
      type: String,
      enum: ["RANDOM", "CATEGORY", "DIFFICULTY", "MANUAL"],
      default: "RANDOM",
    },

    categoryFilter: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "QuestionCategory",
      },
    ],

    difficultyDistribution: {
      easy: {
        type: Number,
        default: 0,
      },

      medium: {
        type: Number,
        default: 0,
      },

      hard: {
        type: Number,
        default: 0,
      },
    },
  },
  {
    _id: false,
  },
);

/* ===========================
   MAIN SCHEMA
=========================== */

const AssessmentSchema = new mongoose.Schema(
  {
    assessmentId: {
      type: String,
      unique: true,
      index: true,
    },

    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 200,
    },

    slug: {
      type: String,
      unique: true,
      index: true,
    },

    description: {
      type: String,
      default: "",
    },

    instructions: {
      type: [String],
      default: [],
    },

    type: {
      type: String,
      enum: ["QUIZ", "EXAM", "ASSESSMENT", "RECRUITMENT", "CERTIFICATION"],
      default: "QUIZ",
    },

    banner: {
      type: ImageSchema,
      default: () => ({}),
    },

    thumbnail: {
      type: ImageSchema,
      default: () => ({}),
    },

    schedule: {
      type: ScheduleSchema,
      required: true,
    },

    questionBanks: {
      type: [QuestionBankConfigSchema],
      validate: {
        validator(value) {
          return value.length > 0;
        },
        message: "At least one question bank is required.",
      },
    },

    marksPerQuestion: {
      type: Number,
      required: true,
      default: 1,
      min: [1, "Marks per question must be at least 1"],
    },

    passingMarks: {
      type: Number,
      required: true,
      min: [0, "Passing marks cannot be negative"],
    },

    statistics: {
      totalQuestionBanks: {
        type: Number,
        default: 0,
      },

      totalQuestionsConfigured: {
        type: Number,
        default: 0,
      },

      estimatedMarks: {
        type: Number,
        default: 0,
      },
    },

    security: {
      type: SecuritySchema,
      default: () => ({}),
    },
    resultConfig: {
      type: ResultSchema,
      default: () => ({}),
    },

    analytics: {
      type: AnalyticsSchema,
      default: () => ({}),
    },

    status: {
      type: String,
      enum: ["DRAFT", "PUBLISHED", "LIVE", "CLOSED", "ARCHIVED"],
      default: "DRAFT",
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
  },
);

/* ===========================
   SLUG GENERATION
=========================== */

AssessmentSchema.pre("save", async function (next) {
  try {
    if (!this.assessmentId) {
      this.assessmentId = await generateSequenceId("assessment", "ASMT");
    }

    if (!this.slug) {
      this.slug = slugify(this.title, {
        lower: true,
        strict: true,
      });
    }

    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model("Assessment", AssessmentSchema);
