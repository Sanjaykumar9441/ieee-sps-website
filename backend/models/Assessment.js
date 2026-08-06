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

  static async duplicate(id) {
    const { data: assessment, error } = await supabase
      .from(TABLE)
      .select("*")
      .eq("id", id)
      .single();

    if (error) return { error };

    delete assessment.id;
    delete assessment.created_at;
    delete assessment.updated_at;

    assessment.title += " (Copy)";
    assessment.slug += "-" + Date.now();
    assessment.status = "DRAFT";
    assessment.is_active = false;

    return supabase.from(TABLE).insert(assessment).select().single();
  }

  static async activate(id) {
    return supabase
      .from(TABLE)
      .update({
        is_active: true,
      })
      .eq("id", id)
      .select()
      .single();
  }

  static async deactivate(id) {
    return supabase
      .from(TABLE)
      .update({
        is_active: false,
      })
      .eq("id", id)
      .select()
      .single();
  }

  static async publish(id) {
    return supabase
      .from(TABLE)
      .update({
        status: "PUBLISHED",
        is_active: true,
        updated_at: new Date(),
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
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();
  }

  static async archive(id) {
    return supabase
      .from(TABLE)
      .update({
        status: "ARCHIVED",
        is_active: false,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();
  }

  static async restore(id) {
    return supabase
      .from(TABLE)
      .update({
        status: "DRAFT",
        is_active: true,
        updated_at: new Date(),
      })
      .eq("id", id)
      .select()
      .single();
  }

  static async statistics(id) {
    return supabase
      .from("assessment_statistics")
      .select("*")
      .eq("assessment_id", id)
      .single();
  }

  static async history(id) {
  return supabase
    .from("audit_logs")
    .select("*")
    .eq("table_name", "assessments")
    .eq("record_id", id)
    .order("created_at", {
      ascending: false,
    });
}

  static async reset(id) {
    const tables = [
      "assessment_answers",
      "assessment_attempt_questions",
      "assessment_attempts",
      "assessment_autosaves",
      "assessment_infractions",
      "assessment_navigation",
      "assessment_question_flags",
      "assessment_sessions",
      "assessment_statistics",
      "assessment_submissions",
      "assessment_timer_events",
      "assessment_activity",
      "assessment_leaderboard",
      "department_statistics",
      "question_statistics",
    ];

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .eq("assessment_id", id);

      if (error) {
        return { error };
      }
    }

    return {
      data: {
        success: true,
      },
    };
  }
}

module.exports = Assessment;
