const mongoose = require("mongoose");

const CounterSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    year: {
      type: Number,
      required: true,
    },

    seq: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// One counter per type per year
CounterSchema.index(
  {
    name: 1,
    year: 1,
  },
  {
    unique: true,
  }
);

module.exports = mongoose.model("Counter", CounterSchema);