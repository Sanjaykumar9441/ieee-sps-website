const { supabase } = require("../lib/supabase");

const {
  shuffle,
  selectRandomQuestions,
  buildAttemptQuestions,
} = require("../lib/randomizeQuiz");

/* ============================================================
   PRIVATE HELPERS
============================================================ */

/**
 * Returns all question banks linked to an assessment.
 */
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

/**
 * Returns all active questions for one bank.
 */
async function getBankQuestions(bankId) {
  const { data, error } = await supabase
    .from("questions")
    .select("*")
    .eq("bank_id", bankId)
    .eq("is_active", true);

  if (error) throw error;

  return data || [];
}

/**
 * Builds one combined question paper from all linked banks.
 */
async function buildQuestionPaper(assessmentId) {
  const mappings = await getAssessmentBanks(assessmentId);

  let paper = [];

  for (const mapping of mappings) {
    const bankQuestions = await getBankQuestions(mapping.question_bank_id);

    const picked = selectRandomQuestions(
      bankQuestions,
      mapping.questions_to_pick,
    );

    paper.push(...picked);
  }

  return shuffle(paper);
}

/**
 * Converts DB row into randomizer format.
 */
function normalizeQuestion(question) {
  return {
    ...question,

    options: question.options,

    correct_answers: question.correct_answers,
  };
}

/* ============================================================
   GENERATE ATTEMPT QUESTIONS
============================================================ */

exports.generateAttempt = async (assessment) => {
  const paper = await buildQuestionPaper(assessment.id);

  const normalized = paper.map(normalizeQuestion);

  /*
      Randomize question order
      Randomize options
      Freeze correct answers
  */

  return buildAttemptQuestions(null, normalized, normalized.length);
};

/* ============================================================
   CREATE ATTEMPT
============================================================ */

exports.createAttempt = async (assessment, student, questions) => {
  if (!assessment.duration_minutes) {
    throw new Error("Assessment duration missing.");
  }
  const durationSeconds = assessment.duration_minutes * 60;

  const expiresAt = new Date(Date.now() + durationSeconds * 1000).toISOString();

  const { data, error } = await supabase
    .from("assessment_attempts")
    .insert({
      assessment_id: assessment.id,

      student_id: student.id,

      started_at: new Date().toISOString(),

      expires_at: expiresAt,

      resumed_count: 0,

      current_question: 1,

      answered_questions: 0,

      score: 0,

      status: "IN_PROGRESS",
    })
    .select()
    .single();

  if (error) throw error;

  await exports.storeQuestions(data.id, questions);

  return data;
};

/* ============================================================
   STORE ATTEMPT QUESTIONS
============================================================ */

exports.storeQuestions = async (attemptId, questions) => {
  questions.forEach((question) => {
    question.attempt_id = attemptId;
  });

  const { error } = await supabase
    .from("assessment_attempt_questions")
    .insert(questions);

  if (error) throw error;

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
      questions(
        id,
        question_text,
        question_type,
        question_image_id,
        explanation,
        marks,
        negative_marks
      ),
      assessment_answers(
        id,
        selected_answers,
        answered_at
      )
      `,
    )
    .eq("attempt_id", attemptId)
    .eq("question_order", questionNumber)
    .single();

  if (error) throw error;

  if (!data) {
    throw new Error("Question not found.");
  }

  return {
    id: data.id,
    attempt_id: data.attempt_id,
    question_id: data.question_id,
    question_order: data.question_order,

    question_text: data.questions?.question_text || "",
    question_type: data.questions?.question_type || "MCQ",
    question_image_id: data.questions?.question_image_id || null,

    // IMPORTANT:
    // These are the randomized options frozen for this attempt.
    options: data.shuffled_options || {},

    marks: Number(data.questions?.marks || 1),
    negative_marks: Number(data.questions?.negative_marks || 0),

    assessment_answers: data.assessment_answers || [],
  };
};

/* ============================================================
   SAVE ANSWER
============================================================ */

exports.saveAnswer = async (attemptId, attemptQuestionId, selectedAnswers) => {
  const { data, error } = await supabase
    .from("assessment_answers")
    .upsert(
      {
        attempt_question_id: attemptQuestionId,

        selected_answers: selectedAnswers,

        answered_at: new Date().toISOString(),
      },
      {
        onConflict: "attempt_question_id",
      },
    )
    .select()
    .single();

  if (error) throw error;

  /*
      Update current answered count
  */

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

  await supabase
    .from("assessment_attempts")
    .update({
      answered_questions: count ?? 0,
    })
    .eq("id", attemptId);

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

  return data.map((q) => ({
    id: q.id,

    questionOrder: q.question_order,

    answered: q.assessment_answers?.length > 0,

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

      score: Number(result.score || 0),

      correct: Number(result.correct || 0),

      wrong: Number(result.wrong || 0),

      unanswered: Number(result.unanswered || 0),

      percentage: Number(result.percentage || 0),

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

  if (error) throw error;

  return data;
};

/* ============================================================
   UPDATE CURRENT QUESTION
============================================================ */

exports.updateCurrentQuestion = async (attemptId, questionNumber) => {
  const { error } = await supabase
    .from("assessment_attempts")
    .update({
      current_question: questionNumber,
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

  const { error } = await supabase
    .from("assessment_attempts")
    .update({
      resumed_count: (attempt.resumed_count || 0) + 1,
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
