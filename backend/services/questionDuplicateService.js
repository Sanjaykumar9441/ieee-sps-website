const { supabase } = require("../lib/supabase");

const TABLE = "questions";

function removeDuplicates(rows) {
  const map = new Map();

  for (const row of rows) {
    const key = row.question_text.trim().toLowerCase();

    if (!map.has(key)) map.set(key, row);
  }

  return [...map.values()];
}

async function isDuplicate(bankId, questionText) {
  const { data, error } = await supabase
    .from(TABLE)
    .select("id")
    .eq("bank_id", bankId)
    .eq("is_active", true)
    .ilike("question_text", questionText.trim())
    .limit(1);

  if (error) throw error;

  return data.length > 0;
}

module.exports = {
  removeDuplicates,
  isDuplicate,
};
