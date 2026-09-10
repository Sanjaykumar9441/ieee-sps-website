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
    .update({
      total_questions: total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", bankId);

  if (updateError) throw updateError;
  return total;
}

async function getAssessmentIdsForBank(bankId) {
  const { data, error } = await supabase
    .from("assessment_question_banks")
    .select("assessment_id")
    .eq("question_bank_id", bankId);

  if (error) throw error;

  return [
    ...new Set((data || []).map((row) => row.assessment_id).filter(Boolean)),
  ];
}

/*
 * The assessment question count is derived from ACTIVE question banks.
 *
 * Older code kept the previous assessments.total_questions value whenever it
 * was greater than zero. That meant deleting every bank could leave an
 * assessment stuck at e.g. 30 questions forever. It also meant a bank could
 * request 30 questions while only one active question actually existed.
 *
 * The dashboard and exam should use the same effective count: for each active
 * bank, take the smaller of questions_to_pick and the number of active
 * questions in that bank.
 */
async function syncAssessmentQuestionCount(assessmentId) {
  if (!assessmentId) return 0;

  const { data: mappings, error } = await supabase
    .from("assessment_question_banks")
    .select("question_bank_id, questions_to_pick")
    .eq("assessment_id", assessmentId);

  if (error) throw error;

  const bankIds = [
    ...new Set(
      (mappings || []).map((row) => row.question_bank_id).filter(Boolean),
    ),
  ];

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

  const activeIds = [...activeBankIds];
  const countsByBank = new Map();

  if (activeIds.length) {
    const { data: activeQuestions, error: questionError } = await supabase
      .from("questions")
      .select("bank_id")
      .in("bank_id", activeIds)
      .eq("is_active", true);

    if (questionError) throw questionError;

    for (const row of activeQuestions || []) {
      countsByBank.set(
        row.bank_id,
        Number(countsByBank.get(row.bank_id) || 0) + 1,
      );
    }
  }

  const effectiveTotal = (mappings || []).reduce((sum, row) => {
    if (!activeBankIds.has(row.question_bank_id)) return sum;

    const available = Number(countsByBank.get(row.question_bank_id) || 0);
    const requested = Math.max(Number(row.questions_to_pick || 0), 0);

    return sum + Math.min(requested, available);
  }, 0);

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("marks_per_question, pass_percentage")
    .eq("id", assessmentId)
    .single();

  if (assessmentError) throw assessmentError;

  const marks = Math.max(0, Number(assessment?.marks_per_question ?? 1));
  const passPercentage = Math.max(0, Number(assessment?.pass_percentage ?? 40));
  const passingScore = Number(
    ((effectiveTotal * marks * passPercentage) / 100).toFixed(2),
  );

  const { error: updateError } = await supabase
    .from("assessments")
    .update({
      total_questions: effectiveTotal,
      passing_score: passingScore,
      updated_at: new Date().toISOString(),
    })
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
