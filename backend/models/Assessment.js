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

  static async getSubjectById(subjectId) {
    return supabase
      .from("subjects")
      .select("id, name, category_id")
      .eq("id", subjectId)
      .eq("is_active", true)
      .single();
  }

  static async getById(id) {
    return supabase.from(TABLE).select("*").eq("id", id).single();
  }

  static async create(data) {
    const { assessment_id, questions_to_pick, ...bankData } = data;

    // --------------------------------------------------
    // 1. Validate assessment ID
    // --------------------------------------------------

    if (!assessment_id) {
      return {
        error: {
          message: "Assessment ID is required.",
        },
      };
    }

    // --------------------------------------------------
    // 2. Get subject from the assessment
    // --------------------------------------------------

    const { data: assessment, error: assessmentError } = await supabase
      .from("assessments")
      .select("subject_id")
      .eq("id", assessment_id)
      .single();

    if (assessmentError) {
      return { error: assessmentError };
    }

    if (!assessment?.subject_id) {
      return {
        error: {
          message: "This assessment does not have a subject assigned.",
        },
      };
    }

    // --------------------------------------------------
    // 3. Question bank uses assessment's subject
    // --------------------------------------------------

    bankData.subject_id = assessment.subject_id;

    // --------------------------------------------------
    // 4. Normalize difficulty
    // --------------------------------------------------

    if (bankData.difficulty) {
      bankData.difficulty = bankData.difficulty.toUpperCase();
    }

    // --------------------------------------------------
    // 5. Check whether this bank already exists
    // --------------------------------------------------

    const { data: existingBank, error: existingBankError } = await supabase
      .from(TABLE)
      .select("*")
      .eq("subject_id", bankData.subject_id)
      .eq("name", bankData.name)
      .maybeSingle();

    if (existingBankError) {
      return { error: existingBankError };
    }

    // --------------------------------------------------
    // 6. Reuse existing bank if found
    // --------------------------------------------------

    let bank = existingBank;

    if (bank) {
      console.log("QUESTION BANK ALREADY EXISTS. REUSING:", bank.id, bank.name);

      // If it was archived/inactive, reactivate it
      if (!bank.is_active) {
        const { data: reactivatedBank, error: reactivateError } = await supabase
          .from(TABLE)
          .update({
            is_active: true,
            updated_at: new Date().toISOString(),
          })
          .eq("id", bank.id)
          .select()
          .single();

        if (reactivateError) {
          return { error: reactivateError };
        }

        bank = reactivatedBank;
      }
    }

    // --------------------------------------------------
    // 7. Create new bank if it doesn't exist
    // --------------------------------------------------

    if (!bank) {
      const { data: newBank, error: createError } = await supabase
        .from(TABLE)
        .insert(bankData)
        .select()
        .single();

      if (createError) {
        return { error: createError };
      }

      bank = newBank;

      console.log("NEW QUESTION BANK CREATED:", bank.id, bank.name);
    }

    // --------------------------------------------------
    // 8. Check whether this assessment already has
    //    this question bank mapped
    // --------------------------------------------------

    const { data: existingMapping, error: mappingCheckError } = await supabase
      .from(MAPPING_TABLE)
      .select("id, questions_to_pick")
      .eq("assessment_id", assessment_id)
      .eq("question_bank_id", bank.id)
      .maybeSingle();

    if (mappingCheckError) {
      return { error: mappingCheckError };
    }

    // --------------------------------------------------
    // 9. Update existing mapping
    // --------------------------------------------------

    if (existingMapping) {
      const { error: updateMappingError } = await supabase
        .from(MAPPING_TABLE)
        .update({
          questions_to_pick,
        })
        .eq("id", existingMapping.id);

      if (updateMappingError) {
        return { error: updateMappingError };
      }

      console.log(
        "QUESTION BANK MAPPING ALREADY EXISTS. UPDATED:",
        existingMapping.id,
      );

      return {
        data: {
          ...bank,
          questions_to_pick,
        },
      };
    }

    // --------------------------------------------------
    // 10. Create mapping for this assessment
    // --------------------------------------------------

    const { error: mappingError } = await supabase.from(MAPPING_TABLE).insert({
      assessment_id,
      question_bank_id: bank.id,
      questions_to_pick,
    });

    if (mappingError) {
      // Only delete the bank if WE created it.
      // Existing reusable banks must never be deleted.
      return { error: mappingError };
    }

    console.log("QUESTION BANK MAPPED TO ASSESSMENT:", assessment_id, bank.id);

    return {
      data: {
        ...bank,
        questions_to_pick,
      },
    };
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
