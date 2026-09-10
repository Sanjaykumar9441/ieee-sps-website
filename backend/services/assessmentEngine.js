const { supabase } = require("../lib/supabase");

// Short-lived in-process cache. Render normally runs one Node process on the
// free service, so this removes repeated question-bank reads during a burst
// of simultaneous exam starts. A promise is cached too, preventing a cache
// stampede when many students start at the same moment.
const questionBankCache = new Map();
const assessmentBankCache = new Map();
const QUESTION_CACHE_TTL_MS = 5 * 60 * 1000;
const ASSESSMENT_BANK_CACHE_TTL_MS = 60 * 1000;

const {
  shuffle,
  selectRandomQuestions,
  buildAttemptQuestions,
} = require("../lib/randomizeQuiz");

/* ============================================================
   PRIVATE HELPERS
============================================================ */

async function getAssessmentBanks(assessmentId) {
  const key = String(assessmentId);
  const cached = assessmentBankCache.get(key);
  const now = Date.now();

  if (cached?.data && cached.expiresAt > now) return cached.data;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    const { data, error } = await supabase
      .from("assessment_question_banks")
      .select(
        `
        question_bank_id,
        questions_to_pick,
        question_banks(
          id,
          name,
          difficulty,
          is_active
        )
      `,
      )
      .eq("assessment_id", assessmentId);

    if (error) throw error;
    const result = (data || []).filter(
      (row) => row.question_banks?.is_active !== false,
    );
    assessmentBankCache.set(key, {
      data: result,
      expiresAt: Date.now() + ASSESSMENT_BANK_CACHE_TTL_MS,
    });
    return result;
  })();

  assessmentBankCache.set(key, { promise });
  try {
    return await promise;
  } catch (error) {
    assessmentBankCache.delete(key);
    throw error;
  }
}

async function getBankQuestions(bankId) {
  const key = String(bankId);
  const cached = questionBankCache.get(key);
  const now = Date.now();

  if (cached?.data && cached.expiresAt > now) return cached.data;
  if (cached?.promise) return cached.promise;

  const promise = (async () => {
    // Do not filter by question_type in Supabase. Older imported rows may use
    // MULTIPLE_CHOICE / MULTIPLE even though the current enum uses
    // MULTIPLE_CORRECT. Fetch active rows and normalize in JavaScript.
    const { data, error } = await supabase
      .from("questions")
      .select(
        `
        id,
        bank_id,
        question_text,
        question_type,
        question_image_id,
        explanation,
        options,
        correct_answers,
        difficulty,
        marks,
        negative_marks,
        estimated_seconds
      `,
      )
      .eq("bank_id", bankId)
      .eq("is_active", true);

    if (error) throw error;

    const result = (data || [])
      .map((question) => ({
        ...question,
        question_type: normalizeQuestionType(question.question_type),
      }))
      .filter(Boolean);

    questionBankCache.set(key, {
      data: result,
      expiresAt: Date.now() + QUESTION_CACHE_TTL_MS,
    });
    return result;
  })();

  questionBankCache.set(key, { promise });
  try {
    return await promise;
  } catch (error) {
    questionBankCache.delete(key);
    throw error;
  }
}

function normalizeQuestionType(value) {
  const type = String(value || "MCQ")
    .trim()
    .toUpperCase()
    .replace(/[- ]/g, "_");

  if (
    [
      "TRUE_FALSE",
      "TRUEFALSE",
      "TRUE_OR_FALSE",
      "TRUE_FALSE_QUESTION",
    ].includes(type)
  ) {
    return "TRUE_FALSE";
  }

  if (["MULTIPLE_CORRECT", "MULTIPLE_CHOICE", "MULTIPLE"].includes(type))
    return "MULTIPLE_CORRECT";
  if (
    [
      "FILL_IN_THE_BLANK",
      "FILL_IN_BLANK",
      "FILL_BLANK",
      "FILL_IN_THE_BLANK_WITH_OPTIONS",
    ].includes(type)
  )
    return "FILL_IN_THE_BLANK";
  return "MCQ";
}

async function buildQuestionPaper(assessment) {
  const mappings = await getAssessmentBanks(assessment.id);

  if (!mappings.length) {
    throw new Error("No question banks are assigned to this assessment.");
  }

  let paper = [];
  const randomQuestions = assessment.random_questions ?? true;
  const shuffleQuestions = assessment.shuffle_questions ?? true;

  // Question-bank allocations are the source of truth for the actual paper.
  // Older assessments can have a stale assessments.total_questions value
  // after a bank was edited/deleted. Do not block an otherwise valid exam with
  // the stale value; reconcile it to the current allocations instead.
  let allocationTotal = 0;

  for (const mapping of mappings) {
    const bankQuestions = await getBankQuestions(mapping.question_bank_id);
    const count = Number(mapping.questions_to_pick);

    if (!Number.isInteger(count) || count < 1) {
      throw new Error("Question bank selection count must be at least 1.");
    }

    if (bankQuestions.length < count) {
      throw new Error(
        `Question bank has only ${bankQuestions.length} active questions but ${count} are required.`,
      );
    }

    allocationTotal += count;

    const picked = randomQuestions
      ? selectRandomQuestions(bankQuestions, count)
      : bankQuestions.slice(0, count);

    paper.push(...picked);
  }

  // Keep the assessment record synchronized as well. This fixes the admin
  // dashboard when the allocation changed but total_questions was left at an
  // older value. The update is best-effort and never prevents exam start.
  const configuredTotal = Number(assessment.total_questions || 0);
  if (configuredTotal !== allocationTotal) {
    assessment.total_questions = allocationTotal;
    try {
      await supabase
        .from("assessments")
        .update({
          total_questions: allocationTotal,
          updated_at: new Date().toISOString(),
        })
        .eq("id", assessment.id);
    } catch (error) {
      console.warn(
        "[ASSESSMENT] Could not reconcile total_questions:",
        error.message,
      );
    }
  }

  return shuffleQuestions ? shuffle(paper) : paper;
}

/* ============================================================
   NORMALIZE QUESTION
============================================================ */

function normalizeQuestion(question, assessment) {
  const rawType = String(question.question_type || "MCQ")
    .trim()
    .toUpperCase()
    .replace(/[- ]/g, "_");
  const questionType = [
    "TRUE_FALSE",
    "TRUEFALSE",
    "TRUE_OR_FALSE",
    "TRUE_FALSE_QUESTION",
  ].includes(rawType)
    ? "TRUE_FALSE"
    : ["MULTIPLE_CORRECT", "MULTIPLE_CHOICE", "MULTIPLE"].includes(rawType)
      ? "MULTIPLE_CORRECT"
      : [
            "FILL_IN_THE_BLANK",
            "FILL_IN_BLANK",
            "FILL_BLANK",
            "FILL_IN_THE_BLANK_WITH_OPTIONS",
          ].includes(rawType)
        ? "FILL_IN_THE_BLANK"
        : "MCQ";

  return {
    id: question.id,
    bank_id: question.bank_id,
    question_text: question.question_text,
    question_type: questionType,
    options:
      questionType === "TRUE_FALSE"
        ? { A: "True", B: "False" }
        : question.options || {},
    correct_answers: Array.isArray(question.correct_answers)
      ? [...question.correct_answers]
      : [],
    // Scoring is configured once on the assessment. Question-level marks are
    // intentionally ignored so every question in the assessment uses the
    // same positive and negative marks.
    marks: Math.max(0.01, Number(assessment?.marks_per_question ?? 1)),
    negative_marks: Math.max(0, Number(assessment?.negative_marks ?? 0)),
  };
}

/* ============================================================
   GENERATE ATTEMPT
============================================================ */

exports.generateAttempt = async (assessment) => {
  const paper = await buildQuestionPaper(assessment);

  if (!paper.length) {
    throw new Error("No active questions are available for this assessment.");
  }

  const normalized = paper.map((question) =>
    normalizeQuestion(question, assessment),
  );

  return buildAttemptQuestions(null, normalized, normalized.length, {
    selectRandom: false,
    shuffleQuestions: false,
    shuffleOptions: assessment.shuffle_options ?? true,
  });
};

/* ============================================================
   CREATE ATTEMPT
============================================================ */

exports.createAttempt = async (
  assessment,
  student,
  questions,
  durationSecondsOverride = null,
  teamId = null,
) => {
  if (!assessment.duration_minutes) {
    throw new Error("Assessment duration missing.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions generated for this attempt.");
  }

  const configuredDurationSeconds = Number(assessment.duration_minutes) * 60;
  const durationSeconds =
    Number.isFinite(Number(durationSecondsOverride)) &&
    Number(durationSecondsOverride) > 0
      ? Math.min(configuredDurationSeconds, Number(durationSecondsOverride))
      : configuredDurationSeconds;

  const startedAt = new Date();

  const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  const { data, error } = await supabase
    .from("assessment_attempts")
    .insert({
      assessment_id: assessment.id,
      student_id: student.id,
      ...(teamId ? { team_id: teamId } : {}),

      started_at: startedAt.toISOString(),
      expires_at: expiresAt.toISOString(),

      resumed_count: 0,
      current_question: 1,
      answered_questions: 0,

      score: 0,
      correct: 0,
      wrong: 0,
      unanswered: 0,
      percentage: 0,

      status: "IN_PROGRESS",
    })
    .select()
    .single();

  if (error) {
    console.error("CREATE ATTEMPT ERROR:", error);
    throw error;
  }

  try {
    await exports.storeQuestions(data.id, questions);
  } catch (error) {
    // Do not leave a broken IN_PROGRESS attempt
    await supabase.from("assessment_attempts").delete().eq("id", data.id);

    throw error;
  }

  return data;
};

/* ============================================================
   STORE ATTEMPT QUESTIONS
============================================================ */

exports.storeQuestions = async (attemptId, questions) => {
  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No attempt questions to store.");
  }

  // Explicitly select DB columns. The generated paper can now carry client
  // metadata without accidentally sending unknown fields to Supabase.
  const rows = questions.map((question) => ({
    attempt_id: attemptId,
    question_id: question.question_id,
    question_order: question.question_order,
    shuffled_options: question.shuffled_options || {},
    correct_answers: question.correct_answers,
    marks: question.marks,
    negative_marks: question.negative_marks,
  }));

  const { error } = await supabase
    .from("assessment_attempt_questions")
    .insert(rows);

  if (error) {
    console.error("STORE ATTEMPT QUESTIONS ERROR:", error);
    throw error;
  }

  return true;
};

/* ============================================================
   GET QUESTION
============================================================ */

exports.getAttemptPaper = async (attemptId) => {
  const { data, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
      id,
      attempt_id,
      question_id,
      question_order,
      shuffled_options,
      marks,
      negative_marks,
      questions!inner(
        id,
        question_text,
        question_type,
        question_image_id,
        difficulty,
        estimated_seconds
      ),
      assessment_answers(
        id,
        selected_answers,
        answered_at
      )
    `,
    )
    .eq("attempt_id", attemptId)
    .order("question_order");

  if (error) {
    console.error("GET ATTEMPT PAPER DB ERROR:", error);
    throw error;
  }

  return (data || []).map((row) => ({
    id: row.id,
    attempt_id: row.attempt_id,
    attempt_question_id: row.id,
    question_id: row.question_id,
    question_order: row.question_order,
    question_text: row.questions?.question_text || "",
    question_type: normalizeQuestionType(row.questions?.question_type),
    question_image_id: row.questions?.question_image_id || null,
    difficulty: row.questions?.difficulty || null,
    estimated_seconds: Number(row.questions?.estimated_seconds || 60),
    options: row.shuffled_options || {},
    marks: Number(row.marks ?? 1),
    negative_marks: Number(row.negative_marks ?? 0),
    assessment_answers: row.assessment_answers || [],
  }));
};

exports.getQuestion = async (attemptId, questionNumber) => {
  const paper = await exports.getAttemptPaper(attemptId);
  const question = paper.find(
    (item) => Number(item.question_order) === Number(questionNumber),
  );

  if (!question) {
    throw new Error(`Question ${questionNumber} not found.`);
  }

  return question;
};

/* ============================================================
   SAVE ANSWER
============================================================ */

exports.saveAnswer = async (attemptId, attemptQuestionId, selectedAnswers) => {
  if (!attemptQuestionId) {
    throw new Error("Attempt question ID is required.");
  }

  const answers = Array.isArray(selectedAnswers) ? selectedAnswers : [];

  const { data, error } = await supabase
    .from("assessment_answers")
    .upsert(
      {
        attempt_question_id: attemptQuestionId,
        selected_answers: answers,
        answered_at: new Date().toISOString(),
      },
      {
        onConflict: "attempt_question_id",
      },
    )
    .select()
    .single();

  if (error) throw error;

  const { count, error: countError } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
        id,
        assessment_answers!inner(id)
        `,
      {
        count: "exact",
        head: true,
      },
    )
    .eq("attempt_id", attemptId);

  if (countError) throw countError;

  const { error: updateError } = await supabase
    .from("assessment_attempts")
    .update({
      answered_questions: count ?? 0,
    })
    .eq("id", attemptId);

  if (updateError) throw updateError;

  return data;
};

/* ============================================================
   QUESTION PALETTE
============================================================ */

exports.getPalette = async (attemptId) => {
  try {
    // ------------------------------------------------------------
    // 1. Get all questions belonging to this attempt
    // ------------------------------------------------------------
    const { data: questions, error: questionsError } = await supabase
      .from("assessment_attempt_questions")
      .select(
        `
          id,
          question_order,
          assessment_question_flags(
            marked_for_review
          )
        `,
      )
      .eq("attempt_id", attemptId)
      .order("question_order");

    if (questionsError) {
      throw questionsError;
    }

    // ------------------------------------------------------------
    // 2. Get ALL saved answers for this attempt
    // ------------------------------------------------------------
    const questionIds = (questions || []).map((q) => q.id);

    let answers = [];

    if (questionIds.length > 0) {
      const { data: answerRows, error: answersError } = await supabase
        .from("assessment_answers")
        .select(
          `
          attempt_question_id,
          selected_answers,
          subjective_answer,
          coding_answer,
          answered_at
        `,
        )
        .in("attempt_question_id", questionIds);

      if (answersError) {
        throw answersError;
      }

      answers = answerRows || [];
    }

    // ------------------------------------------------------------
    // 3. Build a Set of answered question IDs
    // ------------------------------------------------------------
    const answeredQuestionIds = new Set(
      answers
        .filter((answer) => {
          // MCQ / MSQ
          if (
            Array.isArray(answer.selected_answers) &&
            answer.selected_answers.length > 0
          ) {
            return true;
          }

          // Subjective
          if (
            typeof answer.subjective_answer === "string" &&
            answer.subjective_answer.trim().length > 0
          ) {
            return true;
          }

          // Coding
          if (
            typeof answer.coding_answer === "string" &&
            answer.coding_answer.trim().length > 0
          ) {
            return true;
          }

          return false;
        })
        .map((answer) => answer.attempt_question_id),
    );

    // ------------------------------------------------------------
    // 4. Build palette
    // ------------------------------------------------------------
    const palette = (questions || []).map((q) => ({
      id: q.id,

      questionOrder: q.question_order,

      answered: answeredQuestionIds.has(q.id),

      markedForReview: q.assessment_question_flags?.marked_for_review ?? false,
    }));

    return palette;
  } catch (error) {
    console.error("[EXAM] getPalette error:", error);

    throw error;
  }
};

/* ============================================================
   FINISH ATTEMPT
============================================================ */

exports.finishAttempt = async (attemptId, result, status = "SUBMITTED") => {
  const now = new Date().toISOString();

  const { data, error } = await supabase
    .from("assessment_attempts")
    .update({
      status,
      score: Number(result?.score || 0),
      correct: Number(result?.correct || 0),
      wrong: Number(result?.wrong || 0),
      unanswered: Number(result?.unanswered || 0),
      answered_questions: Number(
        result?.answeredQuestions ??
          Number(result?.correct || 0) + Number(result?.wrong || 0),
      ),
      percentage: Number(result?.percentage || 0),
      submitted_at: now,
      completed_at: now,
    })
    .eq("id", attemptId)
    .eq("status", "IN_PROGRESS")
    .select()
    .maybeSingle();

  if (error) throw error;

  // Idempotent completion: another request may have finished the attempt
  // milliseconds earlier (timer, heartbeat, anti-cheat, or manual submit).
  if (data) return data;

  const { data: existing, error: existingError } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("id", attemptId)
    .maybeSingle();
  if (existingError) throw existingError;
  if (!existing) throw new Error("Assessment attempt not found.");
  return existing;
};

/* ============================================================
   GET ATTEMPT
============================================================ */

exports.getAttempt = async (attemptId) => {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (error) {
    if (error.code === "PGRST116") {
      return null;
    }

    throw error;
  }

  return data;
};

/* ============================================================
   UPDATE CURRENT QUESTION
============================================================ */

exports.updateCurrentQuestion = async (attemptId, questionNumber) => {
  const { error } = await supabase
    .from("assessment_attempts")
    .update({
      current_question: Number(questionNumber),
    })
    .eq("id", attemptId);

  if (error) throw error;

  return true;
};

/* ============================================================
   INCREMENT RESUME COUNT
============================================================ */

exports.incrementResumeCount = async (attemptId) => {
  const attempt = await exports.getAttempt(attemptId);

  if (!attempt) {
    throw new Error("Attempt not found.");
  }

  const { error } = await supabase
    .from("assessment_attempts")
    .update({
      resumed_count: Number(attempt.resumed_count || 0) + 1,
    })
    .eq("id", attemptId);

  if (error) throw error;

  return true;
};

/* ============================================================
   MARK QUESTION
============================================================ */

exports.markQuestion = async (attemptQuestionId, marked) => {
  const { error } = await supabase.from("assessment_question_flags").upsert(
    {
      attempt_question_id: attemptQuestionId,
      marked_for_review: marked,
    },
    {
      onConflict: "attempt_question_id",
    },
  );

  if (error) throw error;

  return true;
};

/* ============================================================
   UNMARK QUESTION
============================================================ */

exports.unmarkQuestion = async (attemptQuestionId) => {
  const { error } = await supabase
    .from("assessment_question_flags")
    .delete()
    .eq("attempt_question_id", attemptQuestionId);

  if (error) throw error;

  return true;
};

/* ============================================================
   QUESTION CACHE INVALIDATION
============================================================ */

exports.invalidateQuestionBankCache = (bankId) => {
  if (bankId) questionBankCache.delete(String(bankId));
};

exports.invalidateAssessmentBankCache = (assessmentId) => {
  if (assessmentId) assessmentBankCache.delete(String(assessmentId));
};

exports.clearQuestionCaches = () => {
  questionBankCache.clear();
  assessmentBankCache.clear();
};
