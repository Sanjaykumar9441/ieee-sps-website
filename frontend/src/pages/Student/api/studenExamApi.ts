import axios from "axios";

import type {
  AttemptQuestion,
  PaletteQuestion,
  StartAssessmentResponse,
} from "../types";

const API = import.meta.env.VITE_API_URL;

const getAuthConfig = () => {
  const token =
    localStorage.getItem("studentToken") || localStorage.getItem("token");

  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

const getSessionConfig = (attemptId: string) => {
  const token =
    localStorage.getItem("studentToken") || localStorage.getItem("token");

  // sessionStorage is tab-scoped. The exam is intentionally opened in a
  // new tab, so keep a copy in localStorage as well for the active attempt.
  const sessionKey = `quiz_session_${attemptId}`;
  const sessionId =
    sessionStorage.getItem(sessionKey) ||
    localStorage.getItem(sessionKey);

  return {
    headers: {
      Authorization: `Bearer ${token}`,
      "x-assessment-session": sessionId || "",
    },
  };
};

/* ============================================================
   CHECK ASSESSMENT
============================================================ */

export const checkAssessment = async (
  assessmentId: string,
) => {
  const { data } = await axios.get(
    `${API}/api/student-assessments/${assessmentId}/check`,
    getAuthConfig(),
  );

  return data;
};

/* ============================================================
   EMAIL + COMMON PASSWORD LOGIN
============================================================ */

export const requestStudentOtp = async (assessmentId: string, email: string) => {
  const { data } = await axios.post(`${API}/api/student-auth/send-otp`, { assessmentId, email });
  if (!data.success) throw new Error(data.message || "Unable to send OTP.");
  return data;
};

export const loginStudent = async (
  assessmentId: string,
  email: string,
  passwordOrOtp: string,
  method: "PASSWORD" | "OTP" = "PASSWORD",
) => {
  const { data } = await axios.post(`${API}/api/student-auth/login`, {
    assessmentId,
    email,
    password: method === "PASSWORD" ? passwordOrOtp : undefined,
    otp: method === "OTP" ? passwordOrOtp : undefined,
  });

  if (!data.success) {
    throw new Error(data.message || "Unable to login.");
  }

  if (data.token) {
    localStorage.setItem("studentToken", data.token);
    localStorage.setItem("token", data.token);
  }

  if (data.student) {
    localStorage.setItem("student", JSON.stringify(data.student));
  }

  return data;
};

/* ============================================================
   START ASSESSMENT
============================================================ */

export const startAssessment = async (
  assessmentId: string,
): Promise<StartAssessmentResponse> => {
  const { data } = await axios.post(
    `${API}/api/student-assessments/${assessmentId}/start`,
    {},
    getAuthConfig(),
  );

  if (!data.success) {
    throw new Error(data.message || "Unable to start assessment.");
  }

  if (data.attemptId) {
    localStorage.setItem("studentAttemptId", data.attemptId);
    if (data.sessionId) {
      const sessionKey = `quiz_session_${data.attemptId}`;
      sessionStorage.setItem(sessionKey, data.sessionId);
      localStorage.setItem(sessionKey, data.sessionId);
    }
  }

  return data;
};

/* ============================================================
   GET QUESTION
============================================================ */

export const getQuestion = async (
  attemptId: string,
  questionNumber: number,
): Promise<{
  question: AttemptQuestion;
  remainingSeconds: number;
}> => {
  const { data } = await axios.get(
    `${API}/api/student-assessments/${attemptId}/question/${questionNumber}`,
    getSessionConfig(attemptId),
  );

  if (!data.success) {
    throw new Error(data.message || "Unable to load question.");
  }

  return {
    question: data.question,
    remainingSeconds: data.remainingSeconds,
  };
};

/* ============================================================
   SAVE ANSWER
============================================================ */

export const saveAnswer = async (
  attemptId: string,
  attemptQuestionId: string,
  selectedAnswers: string[],
) => {
  const { data } = await axios.post(
    `${API}/api/student-assessments/${attemptId}/save-answer`,
    {
      attemptQuestionId,
      selectedAnswers,
    },
    getSessionConfig(attemptId),
  );

  if (!data.success) {
    throw new Error(data.message || "Unable to save answer.");
  }

  return data;
};

/* ============================================================
   GET PALETTE
============================================================ */

export const getPalette = async (
  attemptId: string,
): Promise<{
  palette: PaletteQuestion[];
}> => {
  const { data } = await axios.get(
    `${API}/api/student-assessments/${attemptId}/palette`,
    getSessionConfig(attemptId),
  );

  if (!data.success) {
    throw new Error(data.message || "Unable to load question palette.");
  }

  return {
    palette: data.palette || [],
  };
};

/* ============================================================
   GET STATUS
============================================================ */

export const getAssessmentStatus = async (attemptId: string) => {
  const { data } = await axios.get(
    `${API}/api/student-assessments/${attemptId}/status`,
    getSessionConfig(attemptId),
  );

  return data;
};

/* ============================================================
   RESUME EXISTING ASSESSMENT
============================================================ */

export const resumeAssessment = async (
  assessmentId: string,
  attemptId: string,
) => {
  const status = await getAssessmentStatus(attemptId);

  if (!status?.success) {
    throw new Error(status?.message || "Unable to restore assessment.");
  }

  if (
    status.status === "SUBMITTED" ||
    status.status === "DISQUALIFIED" ||
    status.status === "EXPIRED" ||
    status.expired ||
    status.remainingSeconds <= 0
  ) {
    throw new Error("This assessment attempt is no longer active.");
  }

  /*
   * Use the saved question number if available.
   * Otherwise start from question 1.
   */
  const savedQuestion =
    Number(localStorage.getItem(`studentCurrentQuestion:${attemptId}`)) || 1;

  const questionResult = await getQuestion(attemptId, savedQuestion);

  return {
    attemptId,
    totalQuestions: status.totalQuestions || status.total_questions || 0,
    currentQuestion: savedQuestion,
    remainingSeconds: questionResult.remainingSeconds,
    question: questionResult.question,
  };
};

/* ============================================================
   SUBMIT
============================================================ */

export const submitAssessment = async (attemptId: string, reason?: string) => {
  const { data } = await axios.post(
    `${API}/api/student-assessments/${attemptId}/submit`,
    reason ? { reason } : {},
    getSessionConfig(attemptId),
  );

  return data;
};

export const assessmentHeartbeat = async (attemptId: string) => {
  const { data } = await axios.post(
    `${API}/api/student-assessments/${attemptId}/heartbeat`,
    {},
    getSessionConfig(attemptId),
  );

  return data;
};
