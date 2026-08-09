const { supabase } = require("../lib/supabase");

const TABLE = "questions";

class Question {
  static async getAll(bankId) {
    return supabase
      .from(TABLE)
      .select("*")
      .eq("bank_id", bankId)
      .eq("is_active", true)
      .order("created_at", { ascending: false });
  }

  static async getById(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
  }

  static async create(data) {
    data.created_at = new Date().toISOString();
    data.updated_at = new Date().toISOString();

    return supabase.from(TABLE).insert(data).select().single();
  }

  static async update(id, data) {
    data.updated_at = new Date().toISOString();

    return supabase.from(TABLE).update(data).eq("id", id).select().single();
  }

  static async delete(id) {
    return supabase
      .from(TABLE)
      .update({
        is_active: false,
      })
      .eq("id", id);
  }

  static async duplicate(id) {
    const { data: question, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) return { error };

    delete question.id;
    delete question.created_at;
    delete question.updated_at;

    question.version = (question.version || 1) + 1;

    return supabase.from(TABLE).insert(question).select().single();
  }

  static async bulkCreate(questions) {
    if (!Array.isArray(questions) || questions.length === 0) {
      return {
        data: [],
        error: null,
      };
    }

    const now = new Date().toISOString();

    const rows = questions.map((question) => ({
      ...question,
      created_at: now,
      updated_at: now,
      is_active: true,
      version: question.version || 1,
    }));

    return supabase.from(TABLE).insert(rows).select();
  }

  static async search(bankId, keyword) {
    return supabase
      .from(TABLE)
      .select("*")
      .eq("bank_id", bankId)
      .eq("is_active", true)
      .ilike("question_text", `%${keyword}%`)
      .order("created_at", {
        ascending: false,
      });
  }

  static async count(bankId) {
    return supabase
      .from(TABLE)
      .select("*", {
        count: "exact",
        head: true,
      })
      .eq("bank_id", bankId)
      .eq("is_active", true);
  }
}

module.exports = Question;
