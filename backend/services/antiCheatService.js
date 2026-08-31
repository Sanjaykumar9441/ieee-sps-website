const { supabase } = require("../lib/supabase");
const session = require("./studentSessionService");
const scoring = require("./scoringService");
const engine = require("./assessmentEngine");
const liveEvents = require("./liveEvents");

const MAX_INFRACTIONS = 5;

/*
 * These events immediately submit the attempt.
 * There is no DISQUALIFIED state in the active assessment flow.
 */
const IMMEDIATE_AUTO_SUBMIT_TYPES = new Set([
  "TAB_SWITCH",
  "WINDOW_BLUR",
  "FULLSCREEN_EXIT",
]);

async function refreshLeaderboard(
  assessmentId,
) {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select(
      `
        id,
        score,
        correct,
        wrong,
        unanswered,
        percentage,
        submitted_at,
        started_at,
        student_id,
        assessment_allowed_students(
          name,
          roll_no,
          department,
          section
        )
      `,
    )
    .eq("assessment_id", assessmentId)
    .eq("status", "SUBMITTED");

  if (error) {
    console.error(
      "[ANTI-CHEAT] Leaderboard query failed:",
      error,
    );
    return;
  }

  const leaderboard = (data || [])
    .sort((a, b) => {
      const scoreDifference =
        Number(b.score || 0) -
        Number(a.score || 0);

      if (scoreDifference !== 0) {
        return scoreDifference;
      }

      const aTime = a.submitted_at
        ? new Date(a.submitted_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      const bTime = b.submitted_at
        ? new Date(b.submitted_at).getTime()
        : Number.MAX_SAFE_INTEGER;

      if (aTime !== bTime) {
        return aTime - bTime;
      }

      return (
        a.assessment_allowed_students?.roll_no ||
        ""
      ).localeCompare(
        b.assessment_allowed_students?.roll_no ||
          "",
      );
    })
    .map((student, index) => ({
      rank: index + 1,
      attemptId: student.id,
      studentId: student.student_id,
      name:
        student.assessment_allowed_students?.name ||
        "",
      rollNo:
        student.assessment_allowed_students?.roll_no ||
        "",
      department:
        student.assessment_allowed_students?.department ||
        "",
      section:
        student.assessment_allowed_students?.section ||
        "",
      status: "SUBMITTED",
      score: Number(student.score || 0),
      correct: Number(student.correct || 0),
      wrong: Number(student.wrong || 0),
      unanswered: Number(
        student.unanswered || 0,
      ),
      percentage: Number(
        student.percentage || 0,
      ),
      submittedAt: student.submitted_at,
      startedAt: student.started_at,
    }));

  liveEvents.emitLeaderboard(
    assessmentId,
    leaderboard,
  );
}

async function refreshDashboard(
  assessmentId,
) {
  const {
    count: registeredStudents,
    error: registeredError,
  } = await supabase
    .from("assessment_allowed_students")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "assessment_id",
      assessmentId,
    );

  if (registeredError) {
    console.error(
      "[ANTI-CHEAT] Registered student count failed:",
      registeredError,
    );
  }

  const {
    data: attempts,
    error: attemptsError,
  } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq(
      "assessment_id",
      assessmentId,
    );

  if (attemptsError) {
    console.error(
      "[ANTI-CHEAT] Dashboard attempt query failed:",
      attemptsError,
    );
    return;
  }

  const allAttempts =
    attempts || [];

  liveEvents.emitDashboardAnalytics(
    assessmentId,
    {
      registeredStudents:
        registeredStudents || 0,
      startedStudents:
        allAttempts.length,
      submittedStudents:
        allAttempts.filter(
          (attempt) =>
            attempt.status ===
            "SUBMITTED",
        ).length,
      inProgressStudents:
        allAttempts.filter(
          (attempt) =>
            attempt.status ===
            "IN_PROGRESS",
        ).length,
    },
  );
}

async function autoSubmitAttempt(
  attempt,
  reason = "ANTI_CHEAT_AUTO_SUBMIT",
) {
  if (!attempt?.id) {
    throw new Error(
      "Attempt ID is required.",
    );
  }

  /*
   * Always re-read the database state immediately before
   * scoring/submitting. This makes simultaneous blur,
   * visibility and fullscreen events idempotent.
   */
  const latestAttempt =
    await engine.getAttempt(
      attempt.id,
    );

  if (!latestAttempt) {
    throw new Error(
      "Attempt not found.",
    );
  }

  if (
    latestAttempt.status ===
    "SUBMITTED"
  ) {
    return {
      success: true,
      alreadyFinished: true,
      autoSubmitted: true,
      status: "SUBMITTED",
    };
  }

  if (
    latestAttempt.status !==
    "IN_PROGRESS"
  ) {
    return {
      success: true,
      alreadyFinished: true,
      autoSubmitted: false,
      status: latestAttempt.status,
    };
  }

  const result =
    await scoring.calculateScore(
      latestAttempt.id,
    );

  const updatedAttempt =
    await engine.finishAttempt(
      latestAttempt.id,
      result,
    );

  try {
    await session.unlockStudent(
      updatedAttempt.assessment_id,
      updatedAttempt.student_id,
    );
  } catch (error) {
    console.error(
      "[ANTI-CHEAT] Failed to unlock student:",
      error,
    );
  }

  try {
    const { error } =
      await supabase
        .from("assessment_activity")
        .insert({
          attempt_id:
            updatedAttempt.id,
          activity_type:
            "AUTO_SUBMIT",
          metadata: {
            source:
              "anti_cheat",
            reason:
              reason ||
              "ANTI_CHEAT_AUTO_SUBMIT",
            submitted_at:
              new Date().toISOString(),
          },
        });

    if (error) {
      console.error(
        "[ANTI-CHEAT] Failed to record AUTO_SUBMIT activity:",
        error,
      );
    }
  } catch (error) {
    console.error(
      "[ANTI-CHEAT] Activity logging failed:",
      error,
    );
  }

  liveEvents.emitSubmitted(
    updatedAttempt.assessment_id,
    updatedAttempt,
  );

  liveEvents.emitStudentSubmitted(
    updatedAttempt.assessment_id,
  );

  await refreshLeaderboard(
    updatedAttempt.assessment_id,
  );

  await refreshDashboard(
    updatedAttempt.assessment_id,
  );

  return {
    success: true,
    alreadyFinished: false,
    autoSubmitted: true,
    status: "SUBMITTED",
    reason,
    score: Number(
      result.score || 0,
    ),
    correct: Number(
      result.correct || 0,
    ),
    wrong: Number(
      result.wrong || 0,
    ),
    unanswered: Number(
      result.unanswered || 0,
    ),
  };
}

exports.reportInfraction = async (
  attemptId,
  type,
  metadata = {},
) => {
  if (!attemptId) {
    throw new Error(
      "Attempt ID is required.",
    );
  }

  if (!type) {
    throw new Error(
      "Infraction type is required.",
    );
  }

  const attempt =
    await engine.getAttempt(
      attemptId,
    );

  if (!attempt) {
    throw new Error(
      "Attempt not found.",
    );
  }

  if (
    attempt.status ===
    "SUBMITTED"
  ) {
    return {
      ignored: true,
      alreadyFinished: true,
      status: "SUBMITTED",
      totalInfractions:
        await exports.getInfractionCount(
          attemptId,
        ),
    };
  }

  if (
    attempt.status !==
    "IN_PROGRESS"
  ) {
    return {
      ignored: true,
      alreadyFinished: true,
      status: attempt.status,
    };
  }

  const { data: infraction, error } =
    await supabase
      .from("assessment_infractions")
      .insert({
        attempt_id: attempt.id,
        type,
        details:
          metadata ?? null,
        occurred_at:
          new Date().toISOString(),
      })
      .select()
      .single();

  if (error) {
    throw error;
  }

  const {
    count: totalInfractions,
    error: countError,
  } = await supabase
    .from("assessment_infractions")
    .select("*", {
      count: "exact",
      head: true,
    })
    .eq(
      "attempt_id",
      attempt.id,
    );

  if (countError) {
    throw countError;
  }

  const count =
    totalInfractions || 0;

  liveEvents.emitInfraction(
    attempt.assessment_id,
    {
      attemptId: attempt.id,
      studentId: attempt.student_id,
      infractionType: type,
      totalInfractions: count,
    },
  );

  /*
   * Requirement:
   * leaving the exam window/fullscreen immediately submits.
   */
  if (
    IMMEDIATE_AUTO_SUBMIT_TYPES.has(
      type,
    )
  ) {
    return autoSubmitAttempt(
      attempt,
      type,
    );
  }

  /*
   * Other anti-cheat violations are warned first.
   * Reaching the configured limit also auto-submits.
   */
  if (
    count >= MAX_INFRACTIONS
  ) {
    return autoSubmitAttempt(
      attempt,
      `MAX_INFRACTIONS:${type}`,
    );
  }

  return {
    success: true,
    autoSubmitted: false,
    totalInfractions: count,
    maxInfractions:
      MAX_INFRACTIONS,
    infraction,
  };
};

exports.autoSubmitAttempt =
  async (
    attemptId,
    reason = "ANTI_CHEAT_AUTO_SUBMIT",
  ) => {
    const attempt =
      await engine.getAttempt(
        attemptId,
      );

    if (!attempt) {
      throw new Error(
        "Attempt not found.",
      );
    }

    return autoSubmitAttempt(
      attempt,
      reason,
    );
  };

exports.getAttemptInfractions =
  async (attemptId) => {
    const { data, error } =
      await supabase
        .from(
          "assessment_infractions",
        )
        .select("*")
        .eq(
          "attempt_id",
          attemptId,
        )
        .order(
          "occurred_at",
          {
            ascending: false,
          },
        );

    if (error) {
      throw error;
    }

    return data || [];
  };

exports.getInfractionCount =
  async (attemptId) => {
    const { count, error } =
      await supabase
        .from(
          "assessment_infractions",
        )
        .select("*", {
          count: "exact",
          head: true,
        })
        .eq(
          "attempt_id",
          attemptId,
        );

    if (error) {
      throw error;
    }

    return count || 0;
  };

exports.resetInfractions =
  async (attemptId) => {
    const { error } =
      await supabase
        .from(
          "assessment_infractions",
        )
        .delete()
        .eq(
          "attempt_id",
          attemptId,
        );

    if (error) {
      throw error;
    }

    return {
      success: true,
    };
  };

exports.getAssessmentInfractions =
  async (assessmentId) => {
    const { data, error } =
      await supabase
        .from(
          "assessment_infractions",
        )
        .select(
          `
            id,
            attempt_id,
            type,
            details,
            occurred_at,
            assessment_attempts(
              assessment_id,
              student_id,
              assessment_allowed_students(
                name,
                roll_no,
                department,
                section
              )
            )
          `,
        )
        .eq(
          "assessment_attempts.assessment_id",
          assessmentId,
        )
        .order(
          "occurred_at",
          {
            ascending: false,
          },
        );

    if (error) {
      throw error;
    }

    return data || [];
  };

exports.getConfiguration =
  () => ({
    MAX_INFRACTIONS,
    immediateAutoSubmitTypes:
      Array.from(
        IMMEDIATE_AUTO_SUBMIT_TYPES,
      ),
  });
