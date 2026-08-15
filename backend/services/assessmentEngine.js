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
    .eq("is_active", true);

  if (error) throw error;

  return data || [];
}

async function buildQuestionPaper(assessmentId) {
  const mappings = await getAssessmentBanks(assessmentId);

  let paper = [];

  for (const mapping of mappings) {
    const bankQuestions = await getBankQuestions(mapping.question_bank_id);

    const picked = selectRandomQuestions(
      bankQuestions,
      Number(mapping.questions_to_pick),
    );

    paper.push(...picked);
  }

  return shuffle(paper);
}

/* ============================================================
   NORMALIZE QUESTION
============================================================ */

function normalizeQuestion(question) {
  return {
    id: question.id,
    bank_id: question.bank_id,

    question_text: question.question_text,
    question_type: question.question_type,

    question_image_id: question.question_image_id ?? null,

    explanation: question.explanation ?? "",

    options: question.options || [],

    correct_answers: question.correct_answers || [],

    difficulty: question.difficulty,

    marks: Number(question.marks || 1),

    negative_marks: Number(question.negative_marks || 0),

    estimated_seconds: Number(question.estimated_seconds || 60),
  };
}

/* ============================================================
   GENERATE ATTEMPT
============================================================ */

exports.generateAttempt = async (assessment) => {
  const paper = await buildQuestionPaper(assessment.id);

  if (!paper.length) {
    throw new Error("No active questions are available for this assessment.");
  }

  const normalized = paper.map(normalizeQuestion);

  return buildAttemptQuestions(null, normalized, normalized.length);
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
    question_type: source.question_type,

    question_image_id: source.question_image_id ?? null,

    explanation: source.explanation ?? "",

    options: data.shuffled_options || {},

    difficulty: source.difficulty,

    estimated_seconds: source.estimated_seconds ?? 60,

    marks: Number(data.marks ?? source.marks ?? 1),

    negative_marks: Number(data.negative_marks ?? source.negative_marks ?? 0),

    assessment_answers: data.assessment_answers || [],
  };
};

/* ============================================================
   SAVE ANSWER
============================================================ */

exports.saveAnswer = async (attemptId, attemptQuestionId, selectedAnswers) => {
  console.log("========== SAVE ANSWER ENGINE ==========");
  console.log("attemptId:", attemptId);
  console.log("attemptQuestionId:", attemptQuestionId);
  console.log("selectedAnswers:", selectedAnswers);
  console.log("subjectiveAnswer:", subjectiveAnswer);
  console.log("codingAnswer:", codingAnswer);

  if (!attemptQuestionId) {
    throw new Error("Attempt question ID is required.");
  }

  const answers = Array.isArray(selectedAnswers) ? selectedAnswers : [];

  console.log("========== ABOUT TO SAVE TO SUPABASE ==========");
  console.log("attemptQuestionId:", attemptQuestionId);
  console.log("answers:", answers);

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

  console.log("========== SUPABASE SAVE RESULT ==========");
  console.log("data:", data);
  console.log("error:", error);

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
  const { data, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
      id,
      question_order,

      assessment_answers(
        id,
        selected_answers
      ),

      assessment_question_flags(
        marked_for_review
      )
    `,
    )
    .eq("attempt_id", attemptId)
    .order("question_order");

  if (error) throw error;

  return (data || []).map((q) => ({
    id: q.id,

    questionOrder: q.question_order,

    answered:
      Array.isArray(q.assessment_answers) && q.assessment_answers.length > 0,

    markedForReview: q.assessment_question_flags?.marked_for_review ?? false,
  }));
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
