function removeDuplicates(rows) {
  const map = new Map();

  for (const row of rows) {
    const key = row.question_text.trim().toLowerCase();

    if (!map.has(key)) map.set(key, row);
  }

  return [...map.values()];
}

module.exports = {
  removeDuplicates,
};
