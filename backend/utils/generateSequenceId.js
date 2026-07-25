const Counter = require("../models/counter");

const generateSequenceId = async (name, prefix) => {
  const year = new Date().getFullYear();

  const counter = await Counter.findOneAndUpdate(
    { name, year },
    {
      $inc: { seq: 1 },
      $setOnInsert: { year },
    },
    {
      new: true,
      upsert: true,
      setDefaultsOnInsert: true,
    }
  );

  return `${prefix}-${year}-${String(counter.seq).padStart(6, "0")}`;
};

module.exports = generateSequenceId;