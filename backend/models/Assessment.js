const { supabase } = require("../lib/supabase");

const TABLE = "assessments";

class Assessment {
  static async getAll() {
    return supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
  }

  static async getCategories() {
    return supabase
      .from("assessment_categories")
      .select("id, name")
      .eq("is_active", true)
      .order("name", { ascending: true });
  }

  static async getSubjects(categoryId = null) {
    let query = supabase
      .from("subjects")
      .select("id, name, category_id")
      .eq("is_active", true)
      .order("name", { ascending: true });

    if (categoryId) {
      query = query.eq("category_id", categoryId);
    }

    return query;
  }

  static async getById(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
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
    return supabase.from(TABLE).insert(data).select().single();
  }

  static async update(id, data) {
    return supabase.from(TABLE).update(data).eq("id", id).select().single();
  }

  static async delete(id) {
    return supabase.from(TABLE).delete().eq("id", id);
  }

  static async publish(id) {
    return supabase
      .from(TABLE)
      .update({
        status: "PUBLISHED",
        is_active: true,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
  }

  static async unpublish(id) {
    return supabase
      .from(TABLE)
      .update({
        status: "DRAFT",
        is_active: false,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();
  }
}

module.exports = Assessment;
