const { supabase } = require("../lib/supabase");

const {
  shuffle,
  selectRandomQuestions,
  buildAttemptQuestions,
} = require("../lib/randomizeQuiz");

/* ============================================================
   PRIVATE HELPERS
============================================================ */

async function getAssessmentBanks(assessmentId) {
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

  return data || [];
}

async function getBankQuestions(bankId) {
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
    .eq("is_active", true)
    .in("question_type", ["MCQ", "MULTIPLE_CORRECT"]);

  if (error) throw error;

  return data || [];
}

async function buildQuestionPaper(assessment) {
  const mappings = await getAssessmentBanks(assessment.id);

  let paper = [];
  const randomQuestions = assessment.random_questions ?? true;
  const shuffleQuestions = assessment.shuffle_questions ?? true;

  for (const mapping of mappings) {
    const bankQuestions = await getBankQuestions(mapping.question_bank_id);
    const count = Number(mapping.questions_to_pick);

    if (bankQuestions.length < count) {
      throw new Error(
        `Question bank has only ${bankQuestions.length} active MCQ questions but ${count} are required.`,
      );
    }

    const picked = randomQuestions
      ? selectRandomQuestions(bankQuestions, count)
      : bankQuestions.slice(0, count);

    paper.push(...picked);
  }

  return shuffleQuestions ? shuffle(paper) : paper;
}

/* ============================================================
   NORMALIZE QUESTION
============================================================ */

function normalizeQuestion(question, assessment) {
  return {
    id: question.id,
    bank_id: question.bank_id,
    question_text: question.question_text,
    question_type: String(question.question_type || "MCQ").toUpperCase() === "MULTIPLE_CORRECT" ? "MULTIPLE_CORRECT" : "MCQ",
    options: question.options || {},
    correct_answers: Array.isArray(question.correct_answers) ? [...question.correct_answers] : [],
    // Freeze assessment-level marking into the attempt.
    marks: Math.max(0, Number(assessment?.marks_per_question ?? 1)),
    negative_marks: Math.max(0, Number(assessment?.negative_marks || 0)),
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

  const normalized = paper.map((question) => normalizeQuestion(question, assessment));

  return buildAttemptQuestions(null, normalized, normalized.length, {
    selectRandom: false,
    shuffleQuestions: false,
    shuffleOptions: assessment.shuffle_options ?? true,
  });
};

/* ============================================================
   CREATE ATTEMPT
============================================================ */

exports.createAttempt = async (assessment, student, questions) => {
  if (!assessment.duration_minutes) {
    throw new Error("Assessment duration missing.");
  }

  if (!Array.isArray(questions) || questions.length === 0) {
    throw new Error("No questions generated for this attempt.");
  }

  const durationSeconds = Number(assessment.duration_minutes) * 60;

  const startedAt = new Date();

  const expiresAt = new Date(startedAt.getTime() + durationSeconds * 1000);

  const { data, error } = await supabase
    .from("assessment_attempts")
    .insert({
      assessment_id: assessment.id,
      student_id: student.id,

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

  const rows = questions.map((question) => ({
    ...question,
    attempt_id: attemptId,
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

exports.getQuestion = async (attemptId, questionNumber) => {
  const { data, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
      id,
      attempt_id,
      question_id,
      question_order,
      shuffled_options,
      correct_answers,
      marks,
      negative_marks,

      questions!inner(
        id,
        question_text,
        question_type,
        question_image_id,
        explanation,
        options,
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
    .eq("question_order", Number(questionNumber))
    .single();

  if (error) {
    console.error("GET QUESTION DB ERROR:", error);
    throw error;
  }

  if (!data) {
    throw new Error(`Question ${questionNumber} not found.`);
  }

  const source = data.questions;

  if (!source) {
    throw new Error(`Question ${data.question_id} could not be loaded.`);
  }

  /*
   * IMPORTANT:
   * Always return the exact object expected by the frontend.
   */

  return {
    id: data.id,
    attempt_question_id: data.id,

    question_id: data.question_id,
    question_order: data.question_order,

    question_text: source.question_text,
    question_type: source.question_type === "MULTIPLE_CORRECT" ? "MULTIPLE_CORRECT" : "MCQ",

    options: data.shuffled_options || {},

    marks: Number(data.marks ?? 1),

    negative_marks: Number(data.negative_marks ?? 0),

    assessment_answers: data.assessment_answers || [],
  };
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
    const { data: questions, error: questionsError } =
      await supabase
        .from("assessment_attempt_questions")
        .select(`
          id,
          question_order,
          assessment_question_flags(
            marked_for_review
          )
        `)
        .eq("attempt_id", attemptId)
        .order("question_order");

    if (questionsError) {
      throw questionsError;
    }

    // ------------------------------------------------------------
    // 2. Get ALL saved answers for this attempt
    // ------------------------------------------------------------
    const questionIds =
      (questions || []).map((q) => q.id);

    let answers = [];

    if (questionIds.length > 0) {
      const {
        data: answerRows,
        error: answersError,
      } = await supabase
        .from("assessment_answers")
        .select(`
          attempt_question_id,
          selected_answers,
          subjective_answer,
          coding_answer,
          answered_at
        `)
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
        .map((answer) => answer.attempt_question_id)
    );

    // ------------------------------------------------------------
    // 4. Build palette
    // ------------------------------------------------------------
    const palette = (questions || []).map((q) => ({
      id: q.id,

      questionOrder: q.question_order,

      answered: answeredQuestionIds.has(q.id),

      markedForReview:
        q.assessment_question_flags?.marked_for_review ?? false,
    }));

    return palette;
  } catch (error) {
    console.error(
      "[EXAM] getPalette error:",
      error
    );

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
      percentage: Number(result?.percentage || 0),

      submitted_at: now,
      completed_at: now,
    })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) throw error;

  return data;
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
