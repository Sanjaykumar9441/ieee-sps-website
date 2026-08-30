const { supabase } = require("../lib/supabase");

const TABLE = "question_banks";
const MAPPING_TABLE = "assessment_question_banks";

async function syncAssessmentTotal(assessmentId) {
  if (!assessmentId) return { data: null, error: null };

  const { data: mappings, error: mappingError } = await supabase
    .from(MAPPING_TABLE)
    .select("question_bank_id, questions_to_pick")
    .eq("assessment_id", assessmentId);

  if (mappingError) return { data: null, error: mappingError };

  const activeBankIds = (mappings || []).map((m) => m.question_bank_id);

  if (!activeBankIds.length) {
    return supabase
      .from("assessments")
      .update({ total_questions: 0, updated_at: new Date().toISOString() })
      .eq("id", assessmentId)
      .select()
      .single();
  }

  const { data: banks, error: bankError } = await supabase
    .from(TABLE)
    .select("id, is_active")
    .in("id", activeBankIds);

  if (bankError) return { data: null, error: bankError };

  const active = new Set(
    (banks || []).filter((b) => b.is_active !== false).map((b) => b.id),
  );

  const total = (mappings || []).reduce((sum, mapping) => {
    if (!active.has(mapping.question_bank_id)) return sum;
    return sum + Math.max(Number(mapping.questions_to_pick) || 0, 0);
  }, 0);

  return supabase
    .from("assessments")
    .update({
      total_questions: total,
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId)
    .select()
    .single();
}

class QuestionBank {
  static async getAll(assessmentId) {
    const { data: mappings, error } = await supabase
      .from(MAPPING_TABLE)
      .select("question_bank_id, questions_to_pick")
      .eq("assessment_id", assessmentId);

    if (error) return { error };

    if (!mappings?.length) return { data: [] };

    const ids = mappings.map((m) => m.question_bank_id);

    const { data: banks, error: bankError } = await supabase
      .from(TABLE)
      .select("*")
      .in("id", ids)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (bankError) return { error: bankError };

    const enriched = await Promise.all(
      (banks || []).map(async (bank) => {
        const { count, error: countError } = await supabase
          .from("questions")
          .select("id", { count: "exact", head: true })
          .eq("bank_id", bank.id)
          .eq("is_active", true);

        if (countError) throw countError;

        const mapping = mappings.find((m) => m.question_bank_id === bank.id);

        return {
          ...bank,
          // Always return the live count; never trust a stale cached total.
          total_questions: Number(count || 0),
          questions_to_pick: Number(mapping?.questions_to_pick || 0),
        };
      }),
    );

    return { data: enriched };
  }

  static async get(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
  }

  static async getById(id) {
    return this.get(id);
  }

  static async create(data) {
    const { assessment_id, questions_to_pick, ...bankData } = data;

    const { data: bank, error } = await supabase
      .from(TABLE)
      .insert(bankData)
      .select()
      .single();

    if (error) return { error };

    const { error: mappingError } = await supabase
      .from(MAPPING_TABLE)
      .insert({
        assessment_id,
        question_bank_id: bank.id,
        questions_to_pick: Number(questions_to_pick),
      });

    if (mappingError) {
      await supabase.from(TABLE).delete().eq("id", bank.id);
      return { error: mappingError };
    }

    const { error: syncError } = await syncAssessmentTotal(assessment_id);
    if (syncError) return { error: syncError };

    return { data: bank };
  }

  static async update(id, data) {
    const { questions_to_pick, assessment_id, ...bankData } = data;

    const { data: bank, error } = await supabase
      .from(TABLE)
      .update(bankData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error };

    let resolvedAssessmentId = assessment_id;

    if (questions_to_pick !== undefined || assessment_id) {
      if (!resolvedAssessmentId) {
        const { data: mapping } = await supabase
          .from(MAPPING_TABLE)
          .select("assessment_id")
          .eq("question_bank_id", id)
          .limit(1)
          .maybeSingle();
        resolvedAssessmentId = mapping?.assessment_id;
      }

      if (resolvedAssessmentId && questions_to_pick !== undefined) {
        const { error: mappingError } = await supabase
          .from(MAPPING_TABLE)
          .update({
            questions_to_pick: Number(questions_to_pick),
          })
          .eq("assessment_id", resolvedAssessmentId)
          .eq("question_bank_id", id);

        if (mappingError) return { error: mappingError };
      }

      if (resolvedAssessmentId) {
        const { error: syncError } = await syncAssessmentTotal(resolvedAssessmentId);
        if (syncError) return { error: syncError };
      }
    }

    return { data: bank };
  }

  static async delete(id) {
    const { data: mapping, error: mappingError } = await supabase
      .from(MAPPING_TABLE)
      .select("assessment_id")
      .eq("question_bank_id", id)
      .limit(1)
      .maybeSingle();

    if (mappingError) return { error: mappingError };

    const { data: bank, error } = await supabase
      .from(TABLE)
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error };

    if (mapping?.assessment_id) {
      const { error: syncError } = await syncAssessmentTotal(mapping.assessment_id);
      if (syncError) return { error: syncError };
    }

    return {
      data: {
        assessmentId: mapping?.assessment_id,
        questionBank: bank,
      },
    };
  }

  static async duplicate(id) {
    const { data: source, error } = await this.get(id);
    if (error) return { error };

    const { data: mapping, error: mappingError } = await supabase
      .from(MAPPING_TABLE)
      .select("assessment_id, questions_to_pick")
      .eq("question_bank_id", id)
      .limit(1)
      .maybeSingle();

    if (mappingError) return { error: mappingError };
    if (!mapping) return { error: new Error("Assessment mapping not found.") };

    const bankData = {
      subject_id: source.subject_id,
      name: `${source.name} (Copy)`,
      description: source.description,
      difficulty: source.difficulty,
      estimated_minutes: source.estimated_minutes,
      total_questions: source.total_questions,
      version: Number(source.version || 1) + 1,
      is_active: true,
    };

    const { data: bank, error: bankError } = await supabase
      .from(TABLE)
      .insert(bankData)
      .select()
      .single();

    if (bankError) return { error: bankError };

    const { error: newMappingError } = await supabase
      .from(MAPPING_TABLE)
      .insert({
        assessment_id: mapping.assessment_id,
        question_bank_id: bank.id,
        questions_to_pick: mapping.questions_to_pick,
      });

    if (newMappingError) {
      await supabase.from(TABLE).delete().eq("id", bank.id);
      return { error: newMappingError };
    }

    await syncAssessmentTotal(mapping.assessment_id);

    return {
      data: {
        assessmentId: mapping.assessment_id,
        questionBank: bank,
      },
    };
  }
}

module.exports = QuestionBank;
