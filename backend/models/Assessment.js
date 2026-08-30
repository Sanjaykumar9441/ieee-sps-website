
const { supabase } = require("../lib/supabase");
const TABLE = "assessments";

class Assessment {
  static async getAll() { return supabase.from(TABLE).select("*").order("created_at",{ascending:false}); }
  static async getCategories() { return supabase.from("assessment_categories").select("id,name").eq("is_active",true).order("name"); }
  static async getSubjects(categoryId=null) {
    let q=supabase.from("subjects").select("id,name,category_id").eq("is_active",true).order("name");
    if(categoryId) q=q.eq("category_id",categoryId);
    return q;
  }
  static async getById(id) { return supabase.from(TABLE).select("*").eq("id",id).single(); }
  static async getSubjectById(subjectId) { return supabase.from("subjects").select("id,name,category_id,is_active").eq("id",subjectId).single(); }
  static async create(data) { return supabase.from(TABLE).insert(data).select().single(); }
  static async update(id,data) { return supabase.from(TABLE).update({...data,updated_at:new Date().toISOString()}).eq("id",id).select().single(); }
  static async delete(id) {
    if (!id) return { error: new Error("Assessment ID is required.") };

    // Capture the assessment's banks before deleting the mapping rows.
    const { data: mappings, error: mappingError } = await supabase
      .from("assessment_question_banks")
      .select("question_bank_id")
      .eq("assessment_id", id);
    if (mappingError) return { error: mappingError };

    const bankIds = [...new Set((mappings || []).map((row) => row.question_bank_id).filter(Boolean))];

    // Remove attempt children first so deletion is safe even when older
    // foreign keys were created without ON DELETE CASCADE.
    const { data: attempts, error: attemptsError } = await supabase
      .from("assessment_attempts")
      .select("id")
      .eq("assessment_id", id);
    if (attemptsError) return { error: attemptsError };

    const attemptIds = (attempts || []).map((row) => row.id).filter(Boolean);

    if (attemptIds.length) {
      const { data: attemptQuestions, error: attemptQuestionsError } = await supabase
        .from("assessment_attempt_questions")
        .select("id")
        .in("attempt_id", attemptIds);
      if (attemptQuestionsError) return { error: attemptQuestionsError };

      const attemptQuestionIds = (attemptQuestions || []).map((row) => row.id).filter(Boolean);

      if (attemptQuestionIds.length) {
        for (const table of ["assessment_answers", "assessment_question_flags"]) {
          const { error } = await supabase
            .from(table)
            .delete()
            .in("attempt_question_id", attemptQuestionIds);
          if (error) return { error };
        }
      }

      for (const table of ["assessment_infractions", "assessment_sessions", "assessment_activity"]) {
        const { error } = await supabase
          .from(table)
          .delete()
          .in("attempt_id", attemptIds);
        if (error) return { error };
      }

      const { error: attemptQuestionDeleteError } = await supabase
        .from("assessment_attempt_questions")
        .delete()
        .in("attempt_id", attemptIds);
      if (attemptQuestionDeleteError) return { error: attemptQuestionDeleteError };
    }

    const { error: leaderboardError } = await supabase
      .from("assessment_leaderboard")
      .delete()
      .eq("assessment_id", id);
    if (leaderboardError) return { error: leaderboardError };

    const { error: attemptsDeleteError } = await supabase
      .from("assessment_attempts")
      .delete()
      .eq("assessment_id", id);
    if (attemptsDeleteError) return { error: attemptsDeleteError };

    const { error: studentsError } = await supabase
      .from("assessment_allowed_students")
      .delete()
      .eq("assessment_id", id);
    if (studentsError) return { error: studentsError };

    const { error: mappingDeleteError } = await supabase
      .from("assessment_question_banks")
      .delete()
      .eq("assessment_id", id);
    if (mappingDeleteError) return { error: mappingDeleteError };

    // Question banks are reusable in the schema. Delete only banks that no
    // longer belong to any other assessment, preventing accidental deletion
    // of a shared bank. Their questions are then deleted with the bank.
    let deletedBanks = 0;
    let deletedQuestions = 0;

    for (const bankId of bankIds) {
      const { data: remainingMappings, error: remainingError } = await supabase
        .from("assessment_question_banks")
        .select("id")
        .eq("question_bank_id", bankId);
      if (remainingError) return { error: remainingError };

      if ((remainingMappings || []).length > 0) continue;

      const { data: deletedQuestionRows, error: questionDeleteError } = await supabase
        .from("questions")
        .delete()
        .eq("bank_id", bankId)
        .select("id");
      if (questionDeleteError) return { error: questionDeleteError };

      const { error: bankDeleteError } = await supabase
        .from("question_banks")
        .delete()
        .eq("id", bankId);
      if (bankDeleteError) return { error: bankDeleteError };

      deletedBanks += 1;
      deletedQuestions += (deletedQuestionRows || []).length;
    }

    const { error: assessmentDeleteError } = await supabase
      .from(TABLE)
      .delete()
      .eq("id", id);
    if (assessmentDeleteError) return { error: assessmentDeleteError };

    return {
      data: {
        assessment_id: id,
        deleted_attempts: attemptIds.length,
        deleted_question_banks: deletedBanks,
        deleted_questions: deletedQuestions,
      },
    };
  }
  static async publish(id) {
    return supabase.from(TABLE).update({status:"PUBLISHED",is_active:true,updated_at:new Date().toISOString()}).eq("id",id).select().single();
  }
  static async unpublish(id) {
    return supabase.from(TABLE).update({status:"DRAFT",is_active:false,updated_at:new Date().toISOString()}).eq("id",id).select().single();
  }
  static async activate(id) {
    return supabase.from(TABLE).update({is_active:true,updated_at:new Date().toISOString()}).eq("id",id).select().single();
  }
  static async deactivate(id) {
    return supabase.from(TABLE).update({is_active:false,updated_at:new Date().toISOString()}).eq("id",id).select().single();
  }
  static async archive(id) {
    return supabase.from(TABLE).update({status:"ARCHIVED",is_active:false,updated_at:new Date().toISOString()}).eq("id",id).select().single();
  }
  static async restore(id) {
    return supabase.from(TABLE).update({status:"DRAFT",is_active:false,updated_at:new Date().toISOString()}).eq("id",id).select().single();
  }
  static async duplicate(id) {
    const {data:source,error}=await supabase.from(TABLE).select("*").eq("id",id).single();
    if(error) return {error};
    const copy={...source};
    delete copy.id; delete copy.created_at; delete copy.updated_at;
    copy.title=`${source.title || "Assessment"} (Copy)`;
    copy.slug=`${source.slug || "assessment"}-copy-${Date.now()}`;
    copy.status="DRAFT"; copy.is_active=false;
    return supabase.from(TABLE).insert(copy).select().single();
  }
  static async reset(id) {
    const {data:attempts,error}=await supabase.from("assessment_attempts").select("id").eq("assessment_id",id);
    if(error) return {error};
    const ids=(attempts||[]).map(a=>a.id);
    if(ids.length){
      let r=await supabase.from("assessment_answers").delete().in("attempt_question_id",
        (await supabase.from("assessment_attempt_questions").select("id").in("attempt_id",ids)).data?.map(q=>q.id)||[]);
      if(r.error) return {error:r.error};
      for(const table of ["assessment_infractions","assessment_sessions","assessment_question_flags"]){
        if(table==="assessment_question_flags"){
          const qids=(await supabase.from("assessment_attempt_questions").select("id").in("attempt_id",ids)).data?.map(q=>q.id)||[];
          if(qids.length){ const x=await supabase.from(table).delete().in("attempt_question_id",qids); if(x.error)return {error:x.error};}
        } else { const x=await supabase.from(table).delete().in("attempt_id",ids); if(x.error)return {error:x.error};}
      }
      const x=await supabase.from("assessment_attempt_questions").delete().in("attempt_id",ids); if(x.error)return {error:x.error};
      const y=await supabase.from("assessment_attempts").delete().in("id",ids); if(y.error)return {error:y.error};
    }
    const z=await supabase.from("assessment_leaderboard").delete().eq("assessment_id",id);
    if(z.error) return {error:z.error};
    return {data:{assessment_id:id,deleted_attempts:ids.length}};
  }
  static async statistics(id) {
    const {count:students,error:se}=await supabase.from("assessment_allowed_students").select("id",{count:"exact",head:true}).eq("assessment_id",id);
    if(se)return {error:se};
    const {data:attempts,error:ae}=await supabase.from("assessment_attempts").select("status,score,percentage").eq("assessment_id",id);
    if(ae)return {error:ae};
    const submitted=(attempts||[]).filter(a=>a.status==="SUBMITTED");
    return {data:{registeredStudents:students||0,startedStudents:(attempts||[]).length,submittedStudents:submitted.length,inProgressStudents:(attempts||[]).filter(a=>a.status==="IN_PROGRESS").length,averageScore:submitted.length?submitted.reduce((s,a)=>s+Number(a.score||0),0)/submitted.length:0}};
  }
  static async history(id) { return {data:[]}; }
}
module.exports=Assessment;
