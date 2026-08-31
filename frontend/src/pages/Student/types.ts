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
