const { supabase } = require("../lib/supabase");
const { getSecondsRemaining } = require("../lib/redis");
const scoring = require("../services/scoringService");
const engine = require("../services/assessmentEngine");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");

async function safeRemainingSeconds(attempt) {
  try {
    if (attempt.expires_at) {
      const duration = Math.max(0, Math.floor((new Date(attempt.expires_at).getTime() - new Date(attempt.started_at).getTime()) / 1000));
      const remaining = await getSecondsRemaining(attempt.id, duration);
      if (Number.isFinite(Number(remaining))) return Math.max(0, Number(remaining));
    }
  } catch (error) { console.warn("Redis timer unavailable; using expires_at fallback:", error.message); }
  return attempt.expires_at ? Math.max(0, Math.floor((new Date(attempt.expires_at).getTime() - Date.now()) / 1000)) : 0;
}

async function reconcileExpiredAttempts(attempts) {
  const now = Date.now();
  for (const attempt of attempts || []) {
    if (attempt.status !== "IN_PROGRESS" || !attempt.expires_at || new Date(attempt.expires_at).getTime() > now) continue;
    try {
      const result = await scoring.calculateScore(attempt.id);
      const updated = await engine.finishAttempt(attempt.id, result, "SUBMITTED");
      await supabase.from("assessment_activity").insert({ attempt_id: attempt.id, activity_type: "AUTO_SUBMIT", metadata: { source: "server_reconciliation", reason: "TIME_EXPIRED" } });
      try { await session.unlockStudent(updated.assessment_id, updated.student_id); } catch (_) {}
      liveEvents.emitSubmitted(updated.assessment_id, updated);
      liveEvents.emitStudentSubmitted(updated.assessment_id);
      liveEvents.emitDashboardRefresh(updated.assessment_id);
    } catch (error) { console.error("Expired attempt reconciliation failed:", attempt.id, error.message); }
  }
}

async function getStudentMap(assessmentId) {
  const { data, error } = await supabase.from("assessment_allowed_students").select("id,name,roll_no,email,branch,status,has_logged_in,first_login_at").eq("assessment_id", assessmentId);
  if (error) throw error;
  return new Map((data || []).map((s) => [s.id, s]));
}

exports.getLiveStudents = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) return res.status(400).json({ success: false, message: "Assessment ID is required." });
    const { data: assessment, error: assessmentError } = await supabase.from("assessments").select("id,title,duration_minutes,live_updates_enabled").eq("id",assessmentId).single();
    if (assessmentError || !assessment) return res.status(404).json({ success:false,message:"Assessment not found." });
    const { data: attempts, error: attemptsError } = await supabase.from("assessment_attempts").select("id,assessment_id,student_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status,disqualified_reason").eq("assessment_id",assessmentId).order("started_at",{ascending:true});
    if (attemptsError) throw attemptsError;
    await reconcileExpiredAttempts(attempts);
    const { data: refreshedAttempts, error: refreshedError } = await supabase.from("assessment_attempts").select("id,assessment_id,student_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status,disqualified_reason").eq("assessment_id",assessmentId).order("started_at",{ascending:true});
    if (refreshedError) throw refreshedError;
    const studentMap=await getStudentMap(assessmentId); const students=[];
    for(const attempt of refreshedAttempts||[]){
      const student=studentMap.get(attempt.student_id);
      const [{count:totalQuestions,error:qError},{count:violations,error:iError},{data:activities,error:aError}]=await Promise.all([
        supabase.from("assessment_attempt_questions").select("id",{count:"exact",head:true}).eq("attempt_id",attempt.id),
        supabase.from("assessment_infractions").select("id",{count:"exact",head:true}).eq("attempt_id",attempt.id),
        supabase.from("assessment_activity").select("activity_type,metadata,created_at").eq("attempt_id",attempt.id).order("created_at",{ascending:false}),
      ]);
      if(qError)throw qError;
      // Infractions/activity are monitoring enrichments. A legacy deployment
      // must not make the entire Live Monitor refresh fail if one optional
      // column/table is unavailable.
      if(iError) console.warn("Live monitor infraction query unavailable:", iError.message);
      if(aError) console.warn("Live monitor activity query unavailable:", aError.message);
      const acts=activities||[]; const remainingSeconds=await safeRemainingSeconds(attempt);
      const autoSubmitted=acts.some(a=>["AUTO_SUBMIT","SECURITY_AUTO_SUBMIT"].includes(a.activity_type));
      const forceSubmitted=acts.some(a=>a.activity_type==="FORCE_SUBMIT");
      const disqualifiedByAdmin=acts.some(a=>a.activity_type==="DISQUALIFY");
      students.push({attemptId:attempt.id,studentId:attempt.student_id,studentName:student?.name||"Unknown Student",rollNo:student?.roll_no||"",email:student?.email||"",department:student?.branch||"",currentQuestion:Number(attempt.current_question||0),answeredQuestions:Number(attempt.answered_questions||0),totalQuestions:Number(totalQuestions||0),score:Number(attempt.score||0),remainingSeconds,isExpired:remainingSeconds<=0&&attempt.status==="IN_PROGRESS",expiresAt:attempt.expires_at,startedAt:attempt.started_at,submittedAt:attempt.submitted_at,resumedCount:Number(attempt.resumed_count||0),violations:Number(iError ? 0 : (violations||0)),disqualifiedReason:attempt.disqualified_reason||null,autoSubmitted,forceSubmitted,disqualifiedByAdmin,status:attempt.status==="IN_PROGRESS"?"LIVE":attempt.status==="DISQUALIFIED"?"DISQUALIFIED":"SUBMITTED"});
    }
    return res.json({success:true,liveUpdatesEnabled:assessment.live_updates_enabled!==false,totalStudents:students.length,students});
  } catch(err){console.error("LIVE MONITOR ERROR:",err);return res.status(500).json({success:false,message:err.message});}
};

exports.getStudentDetails = async (req,res)=>{
  try{
    const {attemptId}=req.params;if(!attemptId)return res.status(400).json({success:false,message:"Attempt ID is required."});
    const {data:attempt,error}=await supabase.from("assessment_attempts").select("id,assessment_id,student_id,started_at,submitted_at,expires_at,resumed_count,current_question,score,answered_questions,status,disqualified_reason").eq("id",attemptId).single();
    if(error||!attempt)return res.status(404).json({success:false,message:"Assessment attempt not found."});
    const studentMap=await getStudentMap(attempt.assessment_id); const student=studentMap.get(attempt.student_id);
    const {data:questions,error:questionsError}=await supabase.from("assessment_attempt_questions").select("id,question_id,question_order,shuffled_options,correct_answers,marks,negative_marks,questions(question_text,question_type),assessment_answers(selected_answers,answered_at),assessment_question_flags(marked_for_review,answered,visited)").eq("attempt_id",attemptId).order("question_order");
    if(questionsError)throw questionsError;
    const {data:infractions,error:infractionsError}=await supabase.from("assessment_infractions").select("id,type,details,occurred_at").eq("attempt_id",attemptId).order("occurred_at",{ascending:true});
    if(infractionsError)throw infractionsError;
    const {data:activities,error:activityError}=await supabase.from("assessment_activity").select("activity_type,metadata,created_at").eq("attempt_id",attemptId).order("created_at",{ascending:true});
    if(activityError)throw activityError;
    return res.json({
      success: true,
      student: student || null,
      attempt: {
        ...attempt,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        expiresAt: attempt.expires_at,
        resumedCount: Number(attempt.resumed_count || 0),
        currentQuestion: Number(attempt.current_question || 0),
        answeredQuestions: Number(attempt.answered_questions || 0),
        disqualifiedReason: attempt.disqualified_reason || null,
      },
      timeline: { loggedInAt: student?.first_login_at || null, startedAt: attempt.started_at, submittedAt: attempt.submitted_at },
      statistics: { questionsAnswered: Number(attempt.answered_questions || 0), score: Number(attempt.score || 0), violations: infractions?.length || 0 },
      infractions: infractions || [],
      activities: activities || [],
      questions: questions || [],
    });
  }catch(err){console.error("LIVE STUDENT DETAILS ERROR:",err);return res.status(500).json({success:false,message:err.message});}
};
