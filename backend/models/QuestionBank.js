const { supabase } = require("../config/supabase");

const TABLE = "question_banks";

class QuestionBank {

    static async getAll(assessmentId){

        return supabase
        .from(TABLE)
        .select("*")
        .eq("assessment_id",assessmentId)
        .eq("is_deleted",false)
        .order("created_at",{ascending:false});

    }

    static async get(id){

        return supabase
        .from(TABLE)
        .select("*")
        .eq("id",id)
        .single();

    }

    static async create(data){

        return supabase
        .from(TABLE)
        .insert(data)
        .select()
        .single();

    }

    static async update(id,data){

        return supabase
        .from(TABLE)
        .update(data)
        .eq("id",id)
        .select()
        .single();

    }

    static async delete(id){

        return supabase
        .from(TABLE)
        .update({
            is_deleted:true
        })
        .eq("id",id);

    }

}

module.exports=QuestionBank;