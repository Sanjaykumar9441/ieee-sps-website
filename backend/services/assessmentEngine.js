const { supabase } = require("../config/supabase");
const randomizeQuiz = require("../lib/randomizeQuiz");

exports.generateAttempt = async (assessment, studentEmail) => {
  const { data: questions, error } = await supabase
    .from("questions")
    .select("*")
    .eq("assessment_id", assessment.id)
    .eq("is_active", true);

  if (error) throw error;

  return randomizeQuiz(questions, assessment.questions_per_attempt);
};

exports.createAttempt = async (assessment, student) => {
  const { data, error } = await supabase
    .from("attempts")
    .insert({
      assessment_id: assessment.id,

      student_email: student.email,

      status: "in_progress",

      started_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

exports.storeQuestions = async (attemptId, questions) => {
  const rows = [];

  questions.forEach((q, index) => {
    rows.push({
      attempt_id: attemptId,

      question_id: q.id,

      serve_order: index + 1,

      shuffled_options: q.options,

      correct_key: q.correct_option,

      marks: q.marks,

      negative_marks: q.negative_marks,
    });
  });

  const { error } = await supabase
    .from("assessment_attempt_questions")
    .insert(rows);

  if (error) throw error;
};

exports.getQuestion = async (attemptId, number) => {
  const { data, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
    *,
    questions(
        question_text,
        image_url
    ),
    answers(
        selected_key
    )
`,
    )
    .eq("attempt_id", attemptId)
    .eq("serve_order", number)
    .single();

  if (error) throw error;

  return data;
};

exports.saveAnswer = async (attemptId, attemptQuestionId, selectedKey) => {
  const { data, error } = await supabase
    .from("answers")
    .upsert({
      attempt_id: attemptId,
      attempt_question_id: attemptQuestionId,
      selected_key: selectedKey,
      answered_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw error;

  return data;
};

exports.getPalette = async (attemptId) => {
  const { data, error } = await supabase
    .from("assessment_attempt_questions")
    .select(
      `
            id,
            serve_order,
            answers(
                selected_key
            )
        `,
    )
    .eq("attempt_id", attemptId)
    .order("serve_order");

  if (error) throw error;

  return data;
};

exports.finishAttempt = async (attemptId, score) => {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .update({
      status: "submitted",

      score,

      submitted_at: new Date().toISOString(),
    })
    .eq("id", attemptId)
    .select()
    .single();

  if (error) throw error;

  return data;
};

exports.getAttempt = async (attemptId) => {
  const { data, error } = await supabase
    .from("assessment_attempts")
    .select("*")
    .eq("id", attemptId)
    .single();

  if (error) throw error;

  return data;
};
