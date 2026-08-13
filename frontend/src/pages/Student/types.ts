export interface AttemptQuestion {
  id: string;
  attempt_id?: string;
  attempt_question_id?: string;

  question_id: string;
  question_order: number;

  question_text: string;
  question_type:
    | "MCQ"
    | "MULTIPLE_CORRECT"
    | "TRUE_FALSE"
    | "SUBJECTIVE";

  question_image_id?: string | null;
  explanation?: string | null;

  /**
   * Shuffled options returned by the assessment engine.
   *
   * Example:
   * {
   *   A: "Earth",
   *   B: "Mars",
   *   C: "Jupiter",
   *   D: "Venus"
   * }
   */
  options: Record<string, string>;

  difficulty?: string;
  estimated_seconds?: number;

  marks: number;
  negative_marks: number;

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
