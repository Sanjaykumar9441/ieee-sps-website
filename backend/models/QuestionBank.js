const { supabase } = require("../lib/supabase");

const TABLE = "question_banks";
const MAPPING_TABLE = "assessment_question_banks";

class QuestionBank {
  static async getAll(assessmentId) {
    const { data: mappings, error: mappingError } = await supabase
      .from(MAPPING_TABLE)
      .select("question_bank_id, questions_to_pick")
      .eq("assessment_id", assessmentId);

    if (mappingError) return { error: mappingError };

    if (!mappings?.length) return { data: [] };

    const ids = mappings.map((m) => m.question_bank_id);

    const { data: banks, error: bankError } = await supabase
      .from(TABLE)
      .select("*")
      .in("id", ids)
      .eq("is_active", true)
      .order("created_at", { ascending: false });

    if (bankError) return { error: bankError };

    const { data: questions, error: questionError } = await supabase
      .from("questions")
      .select("id, bank_id")
      .in("bank_id", ids)
      .eq("is_active", true);

    if (questionError) return { error: questionError };

    const countByBank = new Map();
    for (const q of questions || []) {
      countByBank.set(q.bank_id, (countByBank.get(q.bank_id) || 0) + 1);
    }

    return {
      data: (banks || []).map((bank) => {
        const mapping = mappings.find((m) => m.question_bank_id === bank.id);
        return {
          ...bank,
          total_questions: countByBank.get(bank.id) || 0,
          questions_to_pick: Number(mapping?.questions_to_pick || 0),
        };
      }),
    };
  }

  static async get(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
  }

  static async create(input) {
    const {
      assessment_id,
      questions_to_pick,
      ...rawBank
    } = input || {};

    if (!assessment_id) {
      return { error: new Error("Assessment ID is required.") };
    }

    const bankData = {
      name: String(rawBank.name || "").trim(),
      description: rawBank.description || null,
      difficulty: rawBank.difficulty || "Medium",
      estimated_minutes: Number(rawBank.estimated_minutes || 30),
      is_active: rawBank.is_active !== false,
      total_questions: 0,
      version: Number(rawBank.version || 1),
    };

    if (!bankData.name) {
      return { error: new Error("Question bank name is required.") };
    }

    // Verify assessment before creating a bank/mapping.
    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("id")
      .eq("id", assessment_id)
      .single();

    if (assessmentError || !assessment) {
      return {
        error: assessmentError || new Error("Assessment not found."),
      };
    }

    const { data: bank, error: bankError } = await supabase
      .from(TABLE)
      .insert(bankData)
      .select()
      .single();

    if (bankError) return { error: bankError };

    const pick = Number(questions_to_pick || 0);

    // Avoid depending on a specific unique constraint for upsert.
    const { data: existingMapping, error: lookupError } = await supabase
      .from(MAPPING_TABLE)
      .select("id")
      .eq("assessment_id", assessment_id)
      .eq("question_bank_id", bank.id)
      .maybeSingle();

    if (lookupError) {
      await supabase.from(TABLE).delete().eq("id", bank.id);
      return { error: lookupError };
    }

    let mappingError = null;

    if (existingMapping?.id) {
      ({ error: mappingError } = await supabase
        .from(MAPPING_TABLE)
        .update({ questions_to_pick: pick })
        .eq("id", existingMapping.id));
    } else {
      ({ error: mappingError } = await supabase
        .from(MAPPING_TABLE)
        .insert({
          assessment_id,
          question_bank_id: bank.id,
          questions_to_pick: pick,
        }));
    }

    if (mappingError) {
      await supabase.from(TABLE).delete().eq("id", bank.id);
      return { error: mappingError };
    }

    return {
      data: {
        ...bank,
        assessment_id,
        questions_to_pick: pick,
        total_questions: 0,
      },
    };
  }

  static async update(id, input) {
    const { questions_to_pick, assessment_id, ...rawBank } = input || {};

    const bankData = { ...rawBank };
    if (bankData.name !== undefined) bankData.name = String(bankData.name).trim();
    if (bankData.estimated_minutes !== undefined) {
      bankData.estimated_minutes = Number(bankData.estimated_minutes);
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
        .update({ questions_to_pick: Number(questions_to_pick) })
        .eq("assessment_id", assessment_id)
        .eq("question_bank_id", id);

      if (mappingError) return { error: mappingError };
    }

    return { data: bank };
  }

  static async duplicate(id) {
    const { data: source, error } = await supabase.from(TABLE).select("*").eq("id", id).single();
    if (error) return { error };

    const { data: mapping, error: mappingError } = await supabase
      .from(MAPPING_TABLE).select("assessment_id, questions_to_pick")
      .eq("question_bank_id", id).limit(1).maybeSingle();
    if (mappingError) return { error: mappingError };

    const copy = { ...source };
    delete copy.id;
    delete copy.created_at;
    delete copy.updated_at;
    copy.name = `${source.name || "Question Bank"} (Copy)`;
    copy.total_questions = 0;
    copy.is_active = true;
    copy.version = Number(source.version || 1) + 1;

    const { data: bank, error: bankError } = await supabase.from(TABLE).insert(copy).select().single();
    if (bankError) return { error: bankError };

    const { data: questions, error: questionsError } = await supabase
      .from("questions").select("*").eq("bank_id", id).eq("is_active", true);
    if (questionsError) {
      await supabase.from(TABLE).delete().eq("id", bank.id);
      return { error: questionsError };
    }

    if (questions?.length) {
      const copiedQuestions = questions.map(q => {
        const row = { ...q, bank_id: bank.id };
        delete row.id; delete row.created_at; delete row.updated_at;
        row.version = Number(q.version || 1);
        return row;
      });
      const { error } = await supabase.from("questions").insert(copiedQuestions);
      if (error) {
        await supabase.from(TABLE).delete().eq("id", bank.id);
        return { error };
      }
    }

    const total = questions?.length || 0;
    await supabase.from(TABLE).update({ total_questions: total }).eq("id", bank.id);

    if (mapping?.assessment_id) {
      const { error } = await supabase.from(MAPPING_TABLE).insert({
        assessment_id: mapping.assessment_id,
        question_bank_id: bank.id,
        questions_to_pick: Number(mapping.questions_to_pick || 0),
      });
      if (error) {
        await supabase.from(TABLE).delete().eq("id", bank.id);
        return { error };
      }
    }

    return {
      data: {
        questionBank: { ...bank, total_questions: total, assessment_id: mapping?.assessment_id || null, questions_to_pick: Number(mapping?.questions_to_pick || 0) },
        assessmentId: mapping?.assessment_id || null,
      },
    };
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
      .update({ is_active: false })
      .eq("id", id)
      .select()
      .single();

    if (error) return { error };

    return {
      data: {
        assessmentId: mapping?.assessment_id || null,
        questionBank: bank,
      },
    };
  }
}

module.exports = QuestionBank;
