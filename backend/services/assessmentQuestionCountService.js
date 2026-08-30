const { supabase } = require("../lib/supabase");

async function syncQuestionBankTotal(bankId) {
  if (!bankId) return 0;

  const { count, error } = await supabase
    .from("questions")
    .select("id", { count: "exact", head: true })
    .eq("bank_id", bankId)
    .eq("is_active", true);

  if (error) throw error;

  const total = Number(count || 0);

  const { error: updateError } = await supabase
    .from("question_banks")
    .update({ total_questions: total, updated_at: new Date().toISOString() })
    .eq("id", bankId);

  if (updateError) throw updateError;

  return effectiveTotal;
}

async function getAssessmentIdsForBank(bankId) {
  const { data, error } = await supabase
    .from("assessment_question_banks")
    .select("assessment_id")
    .eq("question_bank_id", bankId);

  if (error) throw error;
  return [...new Set((data || []).map((row) => row.assessment_id).filter(Boolean))];
}

async function syncAssessmentQuestionCount(assessmentId) {
  if (!assessmentId) return 0;

  const { data: mappings, error } = await supabase
    .from("assessment_question_banks")
    .select("question_bank_id, questions_to_pick")
    .eq("assessment_id", assessmentId);

  if (error) throw error;

  const bankIds = [...new Set((mappings || []).map((row) => row.question_bank_id).filter(Boolean))];
  let activeBankIds = new Set();
  if (bankIds.length) {
    const { data: activeBanks, error: bankError } = await supabase
      .from("question_banks")
      .select("id")
      .in("id", bankIds)
      .eq("is_active", true);
    if (bankError) throw bankError;
    activeBankIds = new Set((activeBanks || []).map((bank) => bank.id));
  }

  const allocatedTotal = (mappings || []).reduce(
    (sum, row) => activeBankIds.has(row.question_bank_id)
      ? sum + Math.max(0, Number(row.questions_to_pick || 0))
      : sum,
    0,
  );

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("total_questions, marks_per_question, pass_percentage")
    .eq("id", assessmentId)
    .single();

  if (assessmentError) throw assessmentError;

  // The assessment's total_questions is the administrator's configured
  // Questions Per Attempt value. Question-bank allocations must not silently
  // overwrite it whenever questions are imported/deleted.
  const configuredTotal = Math.max(0, Number(assessment?.total_questions || 0));
  const effectiveTotal = configuredTotal > 0 ? configuredTotal : allocatedTotal;
  const marks = Math.max(0, Number(assessment?.marks_per_question ?? 1));
  const passPercentage = Math.max(0, Number(assessment?.pass_percentage ?? 40));
  const passingScore = Number(((effectiveTotal * marks * passPercentage) / 100).toFixed(2));

  const updatePayload = {
    passing_score: passingScore,
    updated_at: new Date().toISOString(),
  };
  if (configuredTotal === 0 && allocatedTotal > 0) updatePayload.total_questions = allocatedTotal;

  const { error: updateError } = await supabase
    .from("assessments")
    .update(updatePayload)
    .eq("id", assessmentId);

  if (updateError) throw updateError;

  return effectiveTotal;
}

async function syncAssessmentsForBank(bankId) {
  const assessmentIds = await getAssessmentIdsForBank(bankId);
  for (const assessmentId of assessmentIds) {
    await syncAssessmentQuestionCount(assessmentId);
  }
  return assessmentIds;
}

module.exports = {
  syncQuestionBankTotal,
  getAssessmentIdsForBank,
  syncAssessmentQuestionCount,
  syncAssessmentsForBank,
};
