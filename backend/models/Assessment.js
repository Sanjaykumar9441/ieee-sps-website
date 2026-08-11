const { supabase } = require("../lib/supabase");

const TABLE = "assessments";

class Assessment {
  static async getAll() {
    return supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
  }

  static async getById(id) {
    return supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();
  }

  // ✅ ADD THIS
  static async getSubjectById(subjectId) {
    return supabase
      .from("subjects")
      .select("id, name, category_id, is_active")
      .eq("id", subjectId)
      .single();
  }

  static async create(data) {
    console.log(
      "🔥 Assessment.create() CALLED:",
      JSON.stringify(data, null, 2)
    );

    return supabase
      .from(TABLE)
      .insert(data)
      .select()
      .single();
  }

  static async update(id, data) {
    return supabase
      .from(TABLE)
      .update(data)
      .eq("id", id)
      .select()
      .single();
  }

  static async delete(id) {
    return supabase
      .from(TABLE)
      .delete()
      .eq("id", id);
  }
}

module.exports = Assessment;