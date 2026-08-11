const { supabase } = require("../config/supabase");

const TABLE = "assessments";

class Assessment {
  static async getAll() {
    return supabase
      .from(TABLE)
      .select("*")
      .order("created_at", { ascending: false });
  }

  static async getById(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
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
}

module.exports = Assessment;
