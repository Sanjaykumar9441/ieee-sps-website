
const { supabase } = require("../lib/supabase");
const engine = require("../services/assessmentEngine");
const scoring = require("../services/scoringService");
const session = require("../services/studentSessionService");
const liveEvents = require("../services/liveEvents");

async function refreshLeaderboard(assessmentId) {
  const { data: attempts, error } = await supabase
    .from("assessment_attempts")
    .select("id,student_id,score,correct,wrong,unanswered,percentage,submitted_at,started_at,status")
    .eq("assessment_id", assessmentId)
    .in("status", ["SUBMITTED", "DISQUALIFIED"]);

  if (error) throw error;

  const ids = [...new Set((attempts || []).map(a => a.student_id).filter(Boolean))];
  let students = [];
  if (ids.length) {
    const { data, error: studentError } = await supabase
      .from("assessment_allowed_students")
      .select("id,name,roll_no,email,branch")
      .in("id", ids);
    if (studentError) throw studentError;
    students = data || [];
  }
  const byId = new Map(students.map(s => [s.id, s]));

  const rows = (attempts || []).map(a => {
    const s = byId.get(a.student_id);
    const timeTaken = a.started_at && a.submitted_at
      ? Math.max(0, Math.floor((new Date(a.submitted_at)-new Date(a.started_at))/1000))
      : 0;
    return {
      assessment_id: assessmentId,
      student_id: a.student_id,
      rank: 0,
      score: Number(a.score || 0),
      correct_answers: Number(a.correct || 0),
      wrong_answers: Number(a.wrong || 0),
      unanswered: Number(a.unanswered || 0),
      percentage: Number(a.percentage || 0),
      time_taken_seconds: timeTaken,
      updated_at: new Date().toISOString(),
      name: s?.name || "",
      roll_no: s?.roll_no || "",
      email: s?.email || "",
      branch: s?.branch || "",
      status: a.status,
      attempt_id: a.id,
    };
  }).sort((a,b) => b.score-a.score || a.time_taken_seconds-b.time_taken_seconds || a.roll_no.localeCompare(b.roll_no))
    .map((r,i) => ({...r, rank:i+1}));

  const { error: deleteError } = await supabase
    .from("assessment_leaderboard").delete().eq("assessment_id", assessmentId);
  if (deleteError) throw deleteError;

  if (rows.length) {
    const { error: insertError } = await supabase.from("assessment_leaderboard").insert(
      rows.map(r => ({
        assessment_id:r.assessment_id, student_id:r.student_id, rank:r.rank,
        score:r.score, correct_answers:r.correct_answers, wrong_answers:r.wrong_answers,
        unanswered:r.unanswered, percentage:r.percentage,
        time_taken_seconds:r.time_taken_seconds, updated_at:r.updated_at
      }))
    );
    if (insertError) throw insertError;
  }
  liveEvents.emitLeaderboard(assessmentId, rows);
  return rows;
}

async function finish(attemptId, status, reason) {
  const attempt = await engine.getAttempt(attemptId);
  if (!attempt) {
    const error = new Error("Assessment attempt not found.");
    error.statusCode = 404;
    throw error;
  }
  if (["SUBMITTED","DISQUALIFIED"].includes(attempt.status)) {
    return { attempt, alreadyFinished:true, result:null };
  }

  const result = await scoring.calculateScore(attemptId);
  const updated = await engine.finishAttempt(attemptId, result, status);

  const { error: activityError } = await supabase.from("assessment_activity").insert({
    attempt_id: attemptId,
    activity_type: status === "DISQUALIFIED" ? "DISQUALIFY" : "FORCE_SUBMIT",
    metadata: { source: "admin", reason: reason || null },
  });
  if (activityError) console.warn("Could not record admin action:", activityError.message);

  if (status === "DISQUALIFIED" && reason) {
    await supabase.from("assessment_attempts")
      .update({ disqualified_reason: reason })
      .eq("id", attemptId);
  }

  try { await session.unlockStudent(updated.assessment_id, updated.student_id); } catch (e) {
    console.warn("Could not release Redis session:", e.message);
  }

  await refreshLeaderboard(updated.assessment_id);
  liveEvents.emitForceSubmitted(updated.assessment_id, updated);
  if (status === "DISQUALIFIED") liveEvents.emitDisqualified(updated.assessment_id, updated);
  liveEvents.emitStudentSubmitted(updated.assessment_id);
  liveEvents.emitDashboardRefresh(updated.assessment_id);

  return { attempt:updated, alreadyFinished:false, result };
}

exports.forceSubmit = async (req,res) => {
  try {
    const { attemptId } = req.params;
    const result = await finish(attemptId, "SUBMITTED");
    return res.json({
      success:true,
      message: result.alreadyFinished ? "Assessment was already finished." : "Assessment force submitted successfully.",
      attempt:result.attempt, result:result.result
    });
  } catch (err) {
    console.error("FORCE SUBMIT ERROR:",err);
    return res.status(err.statusCode || 500).json({success:false,message:err.message});
  }
};

exports.forceSubmitAll = async (req,res) => {
  try {
    const { assessmentId } = req.params;
    if (!assessmentId) return res.status(400).json({success:false,message:"Assessment ID is required."});

    const { data: attempts, error } = await supabase.from("assessment_attempts")
      .select("id,status").eq("assessment_id",assessmentId).eq("status","IN_PROGRESS");
    if (error) throw error;

    let submitted=0, failed=0;
    for (const a of attempts || []) {
      try { await finish(a.id,"SUBMITTED"); submitted++; }
      catch (e) { failed++; console.error("Force submit attempt failed:",a.id,e.message); }
    }
    await refreshLeaderboard(assessmentId);
    return res.json({success:true,message:`${submitted} assessment(s) force submitted.`,submitted,failed});
  } catch(err) {
    console.error("FORCE SUBMIT ALL ERROR:",err);
    return res.status(500).json({success:false,message:err.message});
  }
};

exports.disqualify = async (req,res) => {
  try {
    const { attemptId } = req.params;
    const reason = String(req.body?.reason || "Disqualified by admin").trim();
    const result = await finish(attemptId,"DISQUALIFIED",reason);
    return res.json({
      success:true,
      message: result.alreadyFinished ? "Assessment was already finished." : "Student disqualified successfully.",
      attempt:result.attempt, result:result.result
    });
  } catch(err) {
    console.error("DISQUALIFY ERROR:",err);
    return res.status(err.statusCode || 500).json({success:false,message:err.message});
  }
};

exports.refreshLeaderboard = refreshLeaderboard;
