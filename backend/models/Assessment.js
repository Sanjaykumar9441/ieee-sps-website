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
    try {
      /* ===========================================
       Delete Attempts
       (Cascade deletes all child tables)
    =========================================== */

      const { error: attemptError } = await supabase
        .from("assessment_attempts")
        .delete()
        .eq("assessment_id", id);

      if (attemptError) return { error: attemptError };

      /* ===========================================
       Delete Leaderboard
    =========================================== */

      const { error: leaderboardError } = await supabase
        .from("assessment_leaderboard")
        .delete()
        .eq("assessment_id", id);

      if (leaderboardError) return { error: leaderboardError };

      /* ===========================================
       Delete Department Statistics
    =========================================== */

      const { error: departmentError } = await supabase
        .from("department_statistics")
        .delete()
        .eq("assessment_id", id);

      if (departmentError) return { error: departmentError };

      /* ===========================================
       Delete Question Statistics
    =========================================== */

      const { error: questionError } = await supabase
        .from("question_statistics")
        .delete()
        .eq("assessment_id", id);

      if (questionError) return { error: questionError };

      /* ===========================================
       Delete Dashboard Events
    =========================================== */

      const { error: dashboardError } = await supabase
        .from("dashboard_events")
        .delete()
        .eq("assessment_id", id);

      if (dashboardError) return { error: dashboardError };

      /* ===========================================
       Delete Notifications
    =========================================== */

      const { error: notificationError } = await supabase
        .from("notifications")
        .delete()
        .eq("assessment_id", id);

      if (notificationError) return { error: notificationError };

      /* ===========================================
       Delete Email Queue
    =========================================== */

      const { error: emailError } = await supabase
        .from("email_queue")
        .delete()
        .eq("assessment_id", id);

      if (emailError) return { error: emailError };

      /* ===========================================
       Delete Export History
    =========================================== */

      const { error: exportError } = await supabase
        .from("export_history")
        .delete()
        .eq("assessment_id", id);

      if (exportError) return { error: exportError };

      /* ===========================================
       Delete Import History
    =========================================== */

      const { error: importError } = await supabase
        .from("import_history")
        .delete()
        .eq("assessment_id", id);

      if (importError) return { error: importError };

      /* ===========================================
       Delete Certificates
    =========================================== */

      const { error: certificateError } = await supabase
        .from("certificates")
        .delete()
        .eq("assessment_id", id);

      if (certificateError) return { error: certificateError };

      /* ===========================================
       Delete Webhook Logs
    =========================================== */

      const { error: webhookError } = await supabase
        .from("webhook_logs")
        .delete()
        .eq("assessment_id", id);

      if (webhookError) return { error: webhookError };

      /* ===========================================
       Reset Assessment Statistics
    =========================================== */

      const { error: statisticsError } = await supabase
        .from("assessment_statistics")
        .update({
          registered_students: 0,
          logged_in_students: 0,
          started_students: 0,
          submitted_students: 0,
          disqualified_students: 0,
          average_score: 0,
          highest_score: 0,
          lowest_score: 0,
          average_time_seconds: 0,
          pass_percentage: 0,
          updated_at: new Date(),
        })
        .eq("assessment_id", id);

      if (statisticsError) return { error: statisticsError };

      return {
        data: {
          success: true,
        },
      };
    } catch (error) {
      return { error };
    }
  }
}

module.exports = Assessment;
