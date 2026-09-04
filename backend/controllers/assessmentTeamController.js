const { supabase } = require("../lib/supabase");
const liveEvents = require("../services/liveEvents");

const MODES = new Set(["STUDENT_TEAMS", "TEAM"]);
const emailOk = (v) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(v || "").trim());

async function getAssessment(id) {
  return supabase
    .from("assessments")
    .select("id,participation_mode")
    .eq("id", id)
    .single();
}

async function ensureMode(assessmentId, mode) {
  const { data, error } = await getAssessment(assessmentId);
  if (error || !data) throw new Error("Assessment not found.");
  if (data.participation_mode !== mode)
    throw new Error(
      `This assessment is configured for ${data.participation_mode || "INDIVIDUAL_STUDENTS"}.`,
    );
  return data;
}

async function syncMemberCount(teamId) {
  const { count, error } = await supabase
    .from("assessment_team_members")
    .select("id", { count: "exact", head: true })
    .eq("team_id", teamId);
  if (error) throw error;
  const { data: team, error: teamError } = await supabase
    .from("assessment_teams")
    .update({ member_count: count || 0, updated_at: new Date().toISOString() })
    .eq("id", teamId)
    .select()
    .single();
  if (teamError) throw teamError;
  return team;
}

async function createRepresentativeStudent(
  assessmentId,
  teamId,
  teamName,
  contactEmail,
  branch,
) {
  const { data: existing } = await supabase
    .from("assessment_allowed_students")
    .select("id")
    .eq("assessment_id", assessmentId)
    .eq("email", contactEmail)
    .maybeSingle();
  if (existing) {
    const { data, error } = await supabase
      .from("assessment_allowed_students")
      .update({ name: teamName, branch: branch || null, team_id: teamId })
      .eq("id", existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  }
  const { data, error } = await supabase
    .from("assessment_allowed_students")
    .insert({
      assessment_id: assessmentId,
      name: teamName,
      roll_no: `TEAM-${teamId.slice(0, 8).toUpperCase()}`,
      email: contactEmail,
      branch: branch || null,
      team_id: teamId,
      status: "allowed",
      has_logged_in: false,
    })
    .select()
    .single();
  if (error) throw error;
  return data;
}

exports.list = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { data: assessment, error: assessmentError } =
      await getAssessment(assessmentId);
    if (assessmentError || !assessment)
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });
    const { data: teams, error } = await supabase
      .from("assessment_teams")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("created_at");
    if (error) throw error;
    const ids = (teams || []).map((t) => t.id);
    let members = [];
    if (ids.length) {
      const { data, error: memberError } = await supabase
        .from("assessment_team_members")
        .select("*")
        .in("team_id", ids)
        .order("created_at");
      if (memberError) throw memberError;
      members = data || [];
    }
    const grouped = (teams || []).map((team) => ({
      ...team,
      members: members.filter((m) => m.team_id === team.id),
    }));
    return res.json({
      success: true,
      mode: assessment.participation_mode,
      teams: grouped,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.create = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const mode = String(req.body.mode || "").toUpperCase();
    await ensureMode(assessmentId, mode);
    const teamName = String(req.body.teamName || "").trim();
    const contactEmail = String(req.body.contactEmail || "")
      .trim()
      .toLowerCase();
    const branch = String(req.body.branch || "").trim() || null;
    if (!teamName || !contactEmail || !emailOk(contactEmail))
      return res
        .status(400)
        .json({
          success: false,
          message: "Team name and a valid member email are required.",
        });
    if (mode === "STUDENT_TEAMS") {
      if (!Array.isArray(req.body.members) || req.body.members.length < 2)
        return res
          .status(400)
          .json({
            success: false,
            message: "Student Teams require at least two members.",
          });
      const members = req.body.members
        .map((m) => ({
          name: String(m.name || "").trim(),
          roll_no: String(m.rollNo || m.roll_no || "").trim(),
          email: String(m.email || "")
            .trim()
            .toLowerCase(),
          branch: String(m.branch || m.department || "").trim() || branch,
        }))
        .filter((m) => m.name || m.roll_no || m.email);
      for (const m of members)
        if (!m.name || !m.roll_no || !emailOk(m.email))
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Every team member needs name, roll number and a valid email.",
            });
      const { data: team, error } = await supabase
        .from("assessment_teams")
        .insert({
          assessment_id: assessmentId,
          team_name: teamName,
          contact_email: contactEmail,
          branch,
          mode,
        })
        .select()
        .single();
      if (error)
        return res
          .status(error.code === "23505" ? 409 : 400)
          .json({ success: false, message: error.message });
      const { data: insertedMembers, error: memberError } = await supabase
        .from("assessment_team_members")
        .insert(members.map((m) => ({ ...m, team_id: team.id })))
        .select();
      if (memberError) {
        await supabase.from("assessment_teams").delete().eq("id", team.id);
        return res
          .status(400)
          .json({ success: false, message: memberError.message });
      }
      const { error: allowedError } = await supabase
        .from("assessment_allowed_students")
        .upsert(
          insertedMembers.map((m) => ({
            assessment_id: assessmentId,
            name: m.name,
            roll_no: m.roll_no,
            email: m.email,
            branch: m.branch,
            team_id: team.id,
            status: "allowed",
            has_logged_in: false,
          })),
          { onConflict: "assessment_id,email" },
        );
      if (allowedError) throw allowedError;
      await syncMemberCount(team.id);
      liveEvents.emitDashboardRefresh(assessmentId);
      return res
        .status(201)
        .json({ success: true, team: { ...team, members: insertedMembers } });
    }
    const { data: team, error } = await supabase
      .from("assessment_teams")
      .insert({
        assessment_id: assessmentId,
        team_name: teamName,
        contact_email: contactEmail,
        branch,
        member_count: 0,
        mode,
      })
      .select()
      .single();
    if (error)
      return res
        .status(error.code === "23505" ? 409 : 400)
        .json({ success: false, message: error.message });
    await createRepresentativeStudent(
      assessmentId,
      team.id,
      teamName,
      contactEmail,
      branch,
    );
    liveEvents.emitDashboardRefresh(assessmentId);
    return res
      .status(201)
      .json({ success: true, team: { ...team, members: [] } });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.importTeams = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { mode, teams } = req.body || {};
    await ensureMode(assessmentId, String(mode || "").toUpperCase());
    if (!Array.isArray(teams) || !teams.length)
      return res
        .status(400)
        .json({ success: false, message: "No team rows provided." });
    let imported = 0,
      errors = [];
    for (let i = 0; i < teams.length; i++) {
      const item = teams[i];
      const teamName = String(item.teamName || item.team_name || "").trim();
      const email = String(
        item.contactEmail || item.contact_email || item.email || "",
      )
        .trim()
        .toLowerCase();
      const branch =
        String(item.branch || item.department || "").trim() || null;
      try {
        if (!teamName || !emailOk(email))
          throw new Error("Team name and valid email are required.");
        const { data: team, error } = await supabase
          .from("assessment_teams")
          .insert({
            assessment_id: assessmentId,
            team_name: teamName,
            contact_email: email,
            branch,
            mode: String(mode).toUpperCase(),
          })
          .select()
          .single();
        if (error) throw error;
        if (String(mode).toUpperCase() === "STUDENT_TEAMS") {
          const members = Array.isArray(item.members) ? item.members : [];
          if (members.length < 2)
            throw new Error(
              "Student Teams import requires at least two members.",
            );
          const normalized = members.map((m) => ({
            team_id: team.id,
            name: String(m.name || "").trim(),
            roll_no: String(m.rollNo || m.roll_no || "").trim(),
            email: String(m.email || "")
              .trim()
              .toLowerCase(),
            branch:
              String(m.branch || m.department || branch || "").trim() || null,
          }));
          if (
            normalized.some((m) => !m.name || !m.roll_no || !emailOk(m.email))
          )
            throw new Error(
              "Every member needs name, roll number and valid email.",
            );
          const { data: inserted, error: me } = await supabase
            .from("assessment_team_members")
            .insert(normalized)
            .select();
          if (me) throw me;
          const { error: ae } = await supabase
            .from("assessment_allowed_students")
            .upsert(
              inserted.map((m) => ({
                assessment_id: assessmentId,
                name: m.name,
                roll_no: m.roll_no,
                email: m.email,
                branch: m.branch,
                team_id: team.id,
                status: "allowed",
                has_logged_in: false,
              })),
              { onConflict: "assessment_id,email" },
            );
          if (ae) throw ae;
          await syncMemberCount(team.id);
        } else
          await createRepresentativeStudent(
            assessmentId,
            team.id,
            teamName,
            email,
            branch,
          );
        imported++;
      } catch (e) {
        errors.push({ row: i + 2, message: e.message });
      }
    }
    liveEvents.emitDashboardRefresh(assessmentId);
    return res.json({
      success: true,
      imported,
      errors: errors.length,
      errorRows: errors,
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.remove = async (req, res) => {
  try {
    const { assessmentId, teamId } = req.params;
    const { data: team, error } = await supabase
      .from("assessment_teams")
      .select("*")
      .eq("id", teamId)
      .eq("assessment_id", assessmentId)
      .single();
    if (error || !team)
      return res
        .status(404)
        .json({ success: false, message: "Team not found." });
    await supabase
      .from("assessment_allowed_students")
      .delete()
      .eq("assessment_id", assessmentId)
      .eq("team_id", teamId);
    const { error: deleteError } = await supabase
      .from("assessment_teams")
      .delete()
      .eq("id", teamId);
    if (deleteError) throw deleteError;
    liveEvents.emitDashboardRefresh(assessmentId);
    return res.json({ success: true, message: "Team deleted successfully." });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
};
