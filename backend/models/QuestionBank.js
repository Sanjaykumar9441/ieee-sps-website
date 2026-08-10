const { supabase } = require("../lib/supabase");

const TABLE = "question_banks";
const MAPPING_TABLE = "assessment_question_banks";

class QuestionBank {
  static async getAll(assessmentId) {
    // Get mappings
    const { data: mappings, error } = await supabase
      .from(MAPPING_TABLE)
      .select("question_bank_id, questions_to_pick")
      .eq("assessment_id", assessmentId);

    if (error) return { error };

    if (!mappings || mappings.length === 0) {
      return { data: [] };
    }

    const ids = mappings.map((m) => m.question_bank_id);

    // Fetch banks
    const { data: banks, error: bankError } = await supabase
      .from(TABLE)
      .select("*")
      .in("id", ids)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (bankError) return { error: bankError };

    const result = banks.map((bank) => {
      const mapping = mappings.find((m) => m.question_bank_id === bank.id);

      return {
        ...bank,
        questions_to_pick: mapping?.questions_to_pick ?? 0,
      };
    });

    return { data: result };
  }

  static async get(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
  }

  static async create(data) {
    const { assessment_id, questions_to_pick, ...bankData } = data;

    if (bankData.difficulty) {
      bankData.difficulty = bankData.difficulty.toLowerCase();
    }

    const { data: bank, error } = await supabase
      .from(TABLE)
      .insert(bankData)
      .select()
      .single();

    if (error) return { error };

    const { error: mappingError } = await supabase.from(MAPPING_TABLE).insert({
      assessment_id,
      question_bank_id: bank.id,
      questions_to_pick,
    });

    if (mappingError) {
      await supabase.from(TABLE).delete().eq("id", bank.id);

      return { error: mappingError };
    }

    return { data: bank };
  }

  static async update(id, data) {
    const { questions_to_pick, assessment_id, ...bankData } = data;

    if (bankData.difficulty) {
      bankData.difficulty = bankData.difficulty.toLowerCase();
    }

    const { data: bank, error } = await supabase
      .from(TABLE)
      .update(bankData)
      .eq("id", id)
      .select()
      .single();

    if (error) return { error };

    if (assessment_id && questions_to_pick !== undefined) {
      const { error: mappingError } = await supabase
        .from(MAPPING_TABLE)
        .update({
          questions_to_pick,
        })
        .eq("assessment_id", assessment_id)
        .eq("question_bank_id", id);

      if (mappingError) return { error: mappingError };
    }

    return { data: bank };
  }

  static async delete(id) {
    // Find the assessment mapping first
    const { data: mapping, error: mappingError } = await supabase
      .from(MAPPING_TABLE)
      .select("assessment_id")
      .eq("question_bank_id", id)
      .single();

    if (mappingError) return { error: mappingError };

    // Soft delete the question bank
    const { data: bank, error } = await supabase
      .from(TABLE)
      .update({
        is_active: false,
      })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error };

    return {
      data: {
        assessmentId: mapping.assessment_id,
        questionBank: bank,
      },
    };
  }

  static async duplicate(id) {
    // Get original question bank
    const { data: originalBank, error: bankError } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (bankError) return { error: bankError };

    // Get assessment mapping
    const { data: mapping, error: mappingError } = await supabase
      .from(MAPPING_TABLE)
      .select("assessment_id, questions_to_pick")
      .eq("question_bank_id", id)
      .single();

    if (mappingError) return { error: mappingError };

    // Remove database-generated fields
    const {
      id: originalId,
      created_at,
      updated_at,
      ...bankData
    } = originalBank;

    // Create duplicate name
    bankData.name = `${originalBank.name} Copy`;

    bankData.version = (originalBank.version || 1) + 1;

    bankData.created_at = new Date().toISOString();
    bankData.updated_at = new Date().toISOString();

    // Create duplicated bank
    const { data: duplicatedBank, error: createError } = await supabase
      .from(TABLE)
      .insert(bankData)
      .select()
      .single();

    if (createError) return { error: createError };

    // Create assessment mapping for duplicated bank
    const { error: newMappingError } = await supabase
      .from(MAPPING_TABLE)
      .insert({
        assessment_id: mapping.assessment_id,
        question_bank_id: duplicatedBank.id,
        questions_to_pick: mapping.questions_to_pick,
      });

    if (newMappingError) {
      // Roll back duplicated bank
      await supabase.from(TABLE).delete().eq("id", duplicatedBank.id);

      return { error: newMappingError };
    }

    return {
      data: {
        assessmentId: mapping.assessment_id,
        questionBank: {
          ...duplicatedBank,
          questions_to_pick: mapping.questions_to_pick,
        },
      },
    };
  }
}

module.exports = QuestionBank;
