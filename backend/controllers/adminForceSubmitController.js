/*
Use this as the replacement for the leaderboard refresh portion of your
adminForceSubmitController.js.

The previous implementation selected `department` and `section` from
assessment_allowed_students, but the supplied Supabase schema contains
`branch` only. That causes force-submit/leaderboard refresh failures.

Also, keep the exact assessment_attempt_questions marks/negative_marks frozen
at attempt creation. Do not calculate using a hard-coded 0 negative mark.
*/

async function refreshLeaderboard(assessmentId) {
  const { data: attempts, error } = await supabase
    .from("assessment_attempts")
    .select(`
      id,
      student_id,
      score,
      correct,
      wrong,
      unanswered,
      percentage,
      submitted_at,
      started_at,
      status
    `)
    .eq("assessment_id", assessmentId)
    .in("status", ["SUBMITTED", "DISQUALIFIED"]);

  if (error) throw error;

  const ids = [...new Set((attempts || []).map((a) => a.student_id))];

  let students = [];
  if (ids.length) {
    const { data, error: studentError } = await supabase
      .from("assessment_allowed_students")
      .select("id, name, roll_no, email, branch")
      .in("id", ids);

    if (studentError) throw studentError;
    students = data || [];
  }

  const byId = new Map(students.map((s) => [s.id, s]));

  const rows = (attempts || [])
    .map((a) => {
      const s = byId.get(a.student_id);
      const timeTaken =
        a.started_at && a.submitted_at
          ? Math.max(
              0,
              Math.floor(
                (new Date(a.submitted_at).getTime() -
                  new Date(a.started_at).getTime()) /
                  1000,
              ),
            )
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
        // The UI can join/merge these fields from the student table.
        name: s?.name || "",
        roll_no: s?.roll_no || "",
        email: s?.email || "",
        branch: s?.branch || "",
        status: a.status,
        attempt_id: a.id,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      if (a.time_taken_seconds !== b.time_taken_seconds) {
        return a.time_taken_seconds - b.time_taken_seconds;
      }
      return a.roll_no.localeCompare(b.roll_no);
    })
    .map((row, index) => ({ ...row, rank: index + 1 }));

  // Rebuild the materialized leaderboard without relying on a missing
  // live_leaderboard table/view.
  const { error: deleteError } = await supabase
    .from("assessment_leaderboard")
    .delete()
    .eq("assessment_id", assessmentId);

  if (deleteError) throw deleteError;

  if (rows.length) {
    const insertRows = rows.map((r) => ({
      assessment_id: r.assessment_id,
      student_id: r.student_id,
      rank: r.rank,
      score: r.score,
      correct_answers: r.correct_answers,
      wrong_answers: r.wrong_answers,
      unanswered: r.unanswered,
      percentage: r.percentage,
      time_taken_seconds: r.time_taken_seconds,
      updated_at: r.updated_at,
    }));

    const { error: insertError } = await supabase
      .from("assessment_leaderboard")
      .insert(insertRows);

    if (insertError) throw insertError;
  }

  return rows;
}

module.exports = { refreshLeaderboard };
