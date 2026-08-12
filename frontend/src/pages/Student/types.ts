export interface Assessment {
  id: string;
  title: string;
  slug?: string;

  description?: string | null;
  instructions?: string | null;

  start_time: string;
  end_time: string;

  duration_minutes: number;
  total_questions: number;

  marks_per_question: number;
  negative_marks: number;

  pass_percentage: number;
  passing_score: number;

  shuffle_questions: boolean;
  shuffle_options: boolean;
  random_questions: boolean;

  allow_resume: boolean;
  auto_submit: boolean;

  show_leaderboard: boolean;

  anti_cheat_enabled: boolean;
  socket_monitoring: boolean;

  is_active: boolean;
  is_published?: boolean;

  status?: string;
}

export interface AssessmentResponse {
  success: boolean;
  assessment: Assessment;

  message?: string;

  code?: "ASSESSMENT_NOT_STARTED" | "ASSESSMENT_CLOSED";

  startTime?: string;
  endTime?: string;
  serverTime?: string;
}

export interface AttemptQuestion {
  id: string;
  attempt_id: string;
  question_id: string;
  question_order: number;

  shuffled_options: Record<string, string>;

  marks: number;
  negative_marks: number;

  questions: {
    id: string;
    question_text: string;
    question_type: string;
    question_image_id?: string | null;
    explanation?: string | null;
  };

  assessment_answers?: {
    id: string;
    selected_answers: string[] | null;
    answered_at?: string | null;
  }[];
}

export interface PaletteQuestion {
  id: string;
  questionOrder: number;
  answered: boolean;
  markedForReview: boolean;
}

export interface StartAssessmentResponse {
  success: boolean;
  attemptId: string;
  remainingSeconds: number;
  totalQuestions: number;
  currentQuestion: number;
  question: AttemptQuestion;
  message?: string;
}
