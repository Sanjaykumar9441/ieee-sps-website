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
    let allowedByEmail = new Map();
    if (ids.length) {
      const { data: allowed, error: allowedError } = await supabase
        .from("assessment_allowed_students")
        .select(
          "id,name,roll_no,email,branch,status,first_login_at,assessment_attempts(id,status,started_at,submitted_at)",
        )
        .eq("assessment_id", assessmentId)
        .in("team_id", ids);
      if (allowedError) throw allowedError;
      allowedByEmail = new Map(
        (allowed || []).map((row) => [String(row.email).toLowerCase(), row]),
      );
    }
    const grouped = (teams || []).map((team) => ({
      ...team,
      members: members
        .filter((m) => m.team_id === team.id)
        .map((member) => {
          const allowed = allowedByEmail.get(
            String(member.email).toLowerCase(),
          );
          const attempt = [...(allowed?.assessment_attempts || [])].sort(
            (a, b) =>
              new Date(b.started_at || 0).getTime() -
              new Date(a.started_at || 0).getTime(),
          )[0];
          return {
            ...member,
            status: allowed?.status || "allowed",
            first_login_at: allowed?.first_login_at || null,
            attempt_started: Boolean(attempt),
            submitted: attempt?.status === "SUBMITTED",
          };
        }),
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
    const { data: assessment, error: assessmentError } =
      await getAssessment(assessmentId);
    if (assessmentError || !assessment) {
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });
    }

    // The assessment configuration is authoritative. Do not trust a stale
    // client-side mode value, which previously caused Student Teams to enter
    // the TEAM validation branch.
    const mode = assessment.participation_mode;
    if (!MODES.has(mode)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "This assessment is configured for individual students.",
        });
    }

    const teamName = String(
      req.body.teamName || req.body.team_name || "",
    ).trim();
    let contactEmail = String(
      req.body.contactEmail || req.body.contact_email || req.body.email || "",
    )
      .trim()
      .toLowerCase();
    const branch =
      String(req.body.branch || req.body.department || "").trim() || null;

    if (!teamName) {
      return res
        .status(400)
        .json({ success: false, message: "Team name is required." });
    }

    if (mode === "STUDENT_TEAMS") {
      if (!Array.isArray(req.body.members) || req.body.members.length < 2) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Student Teams require at least two members.",
          });
      }

      const members = req.body.members
        .map((member) => ({
          name: String(member?.name || "").trim(),
          roll_no: String(member?.rollNo || member?.roll_no || "").trim(),
          email: String(member?.email || "")
            .trim()
            .toLowerCase(),
          branch:
            String(
              member?.branch || member?.department || branch || "",
            ).trim() || null,
        }))
        .filter(
          (member) =>
            member.name || member.roll_no || member.email || member.branch,
        );

      if (members.length < 2) {
        return res
          .status(400)
          .json({
            success: false,
            message: "Student Teams require at least two complete members.",
          });
      }

      for (const member of members) {
        if (
          !member.name ||
          !member.roll_no ||
          !emailOk(member.email) ||
          !member.branch
        ) {
          return res
            .status(400)
            .json({
              success: false,
              message:
                "Every team member needs name, roll number, valid email and branch.",
            });
        }
      }

      // First member is used only as the contact/compatibility record.
      contactEmail = members[0].email;

      const { data: team, error: teamError } = await supabase
        .from("assessment_teams")
        .insert({
          assessment_id: assessmentId,
          team_name: teamName,
          contact_email: contactEmail,
          branch: branch || members[0].branch,
          mode,
        })
        .select()
        .single();

      if (teamError) {
        return res
          .status(teamError.code === "23505" ? 409 : 400)
          .json({ success: false, message: teamError.message });
      }

      const { data: insertedMembers, error: memberError } = await supabase
        .from("assessment_team_members")
        .insert(members.map((member) => ({ ...member, team_id: team.id })))
        .select();

      if (memberError) {
        await supabase.from("assessment_teams").delete().eq("id", team.id);
        return res
          .status(400)
          .json({ success: false, message: memberError.message });
      }

      const allowedRows = insertedMembers.map((member) => ({
        assessment_id: assessmentId,
        name: member.name,
        roll_no: member.roll_no,
        email: member.email,
        branch: member.branch,
        team_id: team.id,
        status: "allowed",
        has_logged_in: false,
      }));

      const { error: allowedError } = await supabase
        .from("assessment_allowed_students")
        .upsert(allowedRows, { onConflict: "assessment_id,email" });

      if (allowedError) {
        await supabase
          .from("assessment_team_members")
          .delete()
          .eq("team_id", team.id);
        await supabase.from("assessment_teams").delete().eq("id", team.id);
        throw allowedError;
      }

      const updatedTeam = await syncMemberCount(team.id);
      liveEvents.emitDashboardRefresh(assessmentId);
      return res
        .status(201)
        .json({
          success: true,
          team: { ...updatedTeam, members: insertedMembers },
        });
    }

    // TEAM mode deliberately has no member list and no roll number.
    if (!emailOk(contactEmail)) {
      return res
        .status(400)
        .json({
          success: false,
          message: "Team name and a valid member email are required.",
        });
    }
    if (!branch) {
      return res
        .status(400)
        .json({ success: false, message: "Branch is required." });
    }

    const { data: team, error: teamError } = await supabase
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

    if (teamError) {
      return res
        .status(teamError.code === "23505" ? 409 : 400)
        .json({ success: false, message: teamError.message });
    }

    try {
      await createRepresentativeStudent(
        assessmentId,
        team.id,
        teamName,
        contactEmail,
        branch,
      );
    } catch (error) {
      await supabase.from("assessment_teams").delete().eq("id", team.id);
      throw error;
    }

    liveEvents.emitDashboardRefresh(assessmentId);
    return res
      .status(201)
      .json({ success: true, team: { ...team, members: [] } });
  } catch (err) {
    console.error("CREATE ASSESSMENT TEAM ERROR:", err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.importTeams = async (req, res) => {
  try {
    const { assessmentId } = req.params;
    const { teams } = req.body || {};
    const { data: assessment, error: assessmentError } =
      await getAssessment(assessmentId);
    if (assessmentError || !assessment)
      return res
        .status(404)
        .json({ success: false, message: "Assessment not found." });
    const mode = assessment.participation_mode;
    if (!MODES.has(mode))
      return res
        .status(400)
        .json({
          success: false,
          message: "This assessment is configured for individual students.",
        });
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
        if (!teamName) throw new Error("Team name is required.");
        if (mode === "STUDENT_TEAMS") {
          const members = Array.isArray(item.members) ? item.members : [];
          if (members.length < 2)
            throw new Error(
              "Student Teams import requires at least two members.",
            );
          const normalized = members.map((m) => ({
            team_id: "",
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
          const teamContactEmail = emailOk(email) ? email : normalized[0].email;
          const { data: team, error } = await supabase
            .from("assessment_teams")
            .insert({
              assessment_id: assessmentId,
              team_name: teamName,
              contact_email: teamContactEmail,
              branch,
              mode,
            })
            .select()
            .single();
          if (error) throw error;
          normalized.forEach((m) => {
            m.team_id = team.id;
          });
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
        } else {
          if (!emailOk(email))
            throw new Error("Team name and a valid member email are required.");
          const { data: team, error: teamError } = await supabase
            .from("assessment_teams")
            .insert({
              assessment_id: assessmentId,
              team_name: teamName,
              contact_email: email,
              branch,
              member_count: 0,
              mode,
            })
            .select()
            .single();
          if (teamError) throw teamError;
          await createRepresentativeStudent(
            assessmentId,
            team.id,
            teamName,
            email,
            branch,
          );
        }
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
