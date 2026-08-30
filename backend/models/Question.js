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
    return supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();
  }

  static async create(data) {
    const now = new Date().toISOString();

    return supabase
      .from(TABLE)
      .insert({
        ...data,
        created_at: data.created_at || now,
        updated_at: now,
      })
      .select()
      .single();
  }

  static async update(id, data) {
    return supabase
      .from(TABLE)
      .update({
        ...data,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
  }

  static async delete(id) {
    return supabase
      .from(TABLE)
      .update({
        is_active: false,
        updated_at: new Date().toISOString(),
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

    question.version = Number(question.version || 1) + 1;
    question.is_active = true;

    return supabase
      .from(TABLE)
      .insert({
        ...question,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();
  }

  static async search(bankId, keyword) {
    return supabase
      .from(TABLE)
      .select("*")
      .eq("bank_id", bankId)
      .eq("is_active", true)
      .ilike("question_text", `%${keyword}%`)
      .order("created_at", { ascending: false });
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

  static async bulkCreate(rows) {
    if (!Array.isArray(rows) || rows.length === 0) {
      return { data: [], error: null };
    }

    const now = new Date().toISOString();

    const payload = rows.map((row) => ({
      ...row,
      created_at: row.created_at || now,
      updated_at: now,
    }));

    return supabase
      .from(TABLE)
      .insert(payload)
      .select();
  }
}

module.exports = Question;
