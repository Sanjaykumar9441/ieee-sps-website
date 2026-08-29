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

    const result = await Promise.all(banks.map(async (bank) => {
      const mapping = mappings.find((m) => m.question_bank_id === bank.id);
      const { count, error: countError } = await supabase
        .from("questions")
        .select("id", { count: "exact", head: true })
        .eq("bank_id", bank.id)
        .eq("is_active", true)
        .in("question_type", ["MCQ", "MULTIPLE_CORRECT"]);
      if (countError) throw countError;
      return { ...bank, total_questions: count ?? 0, questions_to_pick: mapping?.questions_to_pick ?? 0 };
    }));

    return { data: result };
  }

  static async get(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
  }

  static async create(data) {
    const { assessment_id, questions_to_pick, ...bankData } = data;

    if (!assessment_id) {
      return {
        error: {
          message: "Assessment ID is required.",
        },
      };
    }

    if (!bankData.name?.trim()) {
      return {
        error: {
          message: "Question bank name is required.",
        },
      };
    }

    // Question banks are intentionally independent of category/subject.
    // Reusable banks are matched by name only.
    bankData.name = bankData.name.trim();
    delete bankData.description;
    delete bankData.difficulty;
    delete bankData.estimated_minutes;
    bankData.subject_id = null;

    // ---------------------------------------------------------
    // 2. Check whether this reusable bank already exists
    // ---------------------------------------------------------
    const { data: existingBank, error: existingBankError } = await supabase
      .from(TABLE)
      .select("*")
      .eq("name", bankData.name)
      .maybeSingle();

    if (existingBankError) {
      return { error: existingBankError };
    }

    // ---------------------------------------------------------
    // 3. Existing bank found
    // ---------------------------------------------------------
    if (existingBank) {
      console.log(
        "QUESTION BANK ALREADY EXISTS:",
        existingBank.id,
        existingBank.name,
      );

      // Reactivate if it was previously disabled
      if (existingBank.is_active === false) {
        const { data: activatedBank, error: activateError } = await supabase
          .from(TABLE)
          .update({
            is_active: true,
          })
          .eq("id", existingBank.id)
          .select()
          .single();

        if (activateError) {
          return { error: activateError };
        }

        existingBank.is_active = activatedBank.is_active;
      }

      // -------------------------------------------------------
      // 4. Check whether this bank is already mapped
      //    to this assessment
      // -------------------------------------------------------
      const { data: existingMapping, error: mappingCheckError } = await supabase
        .from(MAPPING_TABLE)
        .select("assessment_id, question_bank_id, questions_to_pick")
        .eq("assessment_id", assessment_id)
        .eq("question_bank_id", existingBank.id)
        .maybeSingle();

      if (mappingCheckError) {
        return { error: mappingCheckError };
      }

      // -------------------------------------------------------
      // 5. Mapping already exists
      // -------------------------------------------------------
      if (existingMapping) {
        const { data: updatedMapping, error: updateMappingError } =
          await supabase
            .from(MAPPING_TABLE)
            .update({
              questions_to_pick: Number(questions_to_pick),
            })
            .eq("assessment_id", assessment_id)
            .eq("question_bank_id", existingBank.id)
            .select()
            .single();

        if (updateMappingError) {
          return { error: updateMappingError };
        }

        return {
          data: {
            ...existingBank,
            questions_to_pick: updatedMapping.questions_to_pick,
            reused: true,
          },
        };
      }

      // -------------------------------------------------------
      // 6. Existing reusable bank, but new assessment
      //    Create only the mapping
      // -------------------------------------------------------
      const { data: newMapping, error: newMappingError } = await supabase
        .from(MAPPING_TABLE)
        .insert({
          assessment_id,
          question_bank_id: existingBank.id,
          questions_to_pick: Number(questions_to_pick),
        })
        .select()
        .single();

      if (newMappingError) {
        return { error: newMappingError };
      }

      return {
        data: {
          ...existingBank,
          questions_to_pick: newMapping.questions_to_pick,
          reused: true,
        },
      };
    }

    // ---------------------------------------------------------
    // 7. No existing bank → create a NEW reusable bank
    // ---------------------------------------------------------
    const { data: bank, error: bankError } = await supabase
      .from(TABLE)
      .insert(bankData)
      .select()
      .single();

    if (bankError) {
      return { error: bankError };
    }

    // ---------------------------------------------------------
    // 8. Map the new bank to this assessment
    // ---------------------------------------------------------
    const { data: newMapping, error: mappingError } = await supabase
      .from(MAPPING_TABLE)
      .insert({
        assessment_id,
        question_bank_id: bank.id,
        questions_to_pick: Number(questions_to_pick),
      })
      .select()
      .single();

    // Rollback bank if mapping fails
    if (mappingError) {
      await supabase.from(TABLE).delete().eq("id", bank.id);

      return { error: mappingError };
    }

    return {
      data: {
        ...bank,
        questions_to_pick: newMapping.questions_to_pick,
        reused: false,
      },
    };
  }

  static async update(id, data) {
    const { questions_to_pick, assessment_id, ...bankData } = data;

    if (bankData.difficulty) {
      bankData.difficulty = bankData.difficulty.toUpperCase();
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
