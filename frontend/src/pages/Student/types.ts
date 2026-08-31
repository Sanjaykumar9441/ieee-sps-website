export interface Assessment {
  id?: string;
  title: string;
  description?: string | null;

  total_questions: number;
  duration_minutes: number;

  marks_per_question?: number;
  negative_marks?: number;
  pass_percentage?: number;
  passing_score?: number;

  is_active: boolean;
  status?: string;
  is_published?: boolean;

  created_at?: string;

  start_time?: string | null;
  end_time?: string | null;

  shuffle_questions?: boolean;
  shuffle_options?: boolean;
  random_questions?: boolean;
  allow_resume?: boolean;
  auto_submit?: boolean;

  show_leaderboard?: boolean;
  anti_cheat_enabled?: boolean;
  socket_monitoring?: boolean;

  login_method?: "PASSWORD" | "OTP";

  live_updates_enabled?: boolean;
}

export interface AssessmentResponse {
  success: boolean;
  assessment: Assessment;
  examStatus: "NOT_STARTED" | "LIVE" | "CLOSED";
  serverTime: string;
  startTime?: string | null;
  endTime?: string | null;
  message?: string;
}

export interface AttemptQuestion {
  id: string;
  attempt_id?: string;
  question_id: string;
  question_order: number;
  question_text: string;
  question_type: "MCQ" | "MULTIPLE_CORRECT" | "TRUE_FALSE";
  question_image_id?: string | null;
  options: Record<string, string>;
  marks: 1;
  negative_marks: 0;
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
  sessionId?: string;
  remainingSeconds: number;
  totalQuestions: number;
  currentQuestion: number;
  question: AttemptQuestion;
  message?: string;
}
