import axios from "axios";
import type {
  AssessmentResponse,
  AttemptQuestion,
  PaletteQuestion,
  StartAssessmentResponse,
} from "../types";

const API = import.meta.env.VITE_API_URL;

const getToken = () =>
  localStorage.getItem("studentToken") ||
  localStorage.getItem("token") ||
  "";

const getAuthConfig = () => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
  },
});

const getSessionConfig = (attemptId: string) => ({
  headers: {
    Authorization: `Bearer ${getToken()}`,
    "x-assessment-session":
      sessionStorage.getItem(
        `quiz_session_${attemptId}`,
      ) ||
      localStorage.getItem(
        `quiz_session_${attemptId}`,
      ) ||
      "",
  },
});

export const checkAssessment = async (
  assessmentId: string,
): Promise<AssessmentResponse> => {
  const { data } = await axios.get(
    `${API}/api/student-assessments/${assessmentId}/check`,
    getAuthConfig(),
  );

  return data;
};

export const sendOtp = async (
  assessmentId: string,
  email: string,
) => {
  const { data } = await axios.post(
    `${API}/api/student-auth/send-otp`,
    { assessmentId, email },
    getAuthConfig(),
  );

  return data;
};

export const requestStudentOtp = (
  assessmentId: string,
  email: string,
) => sendOtp(assessmentId, email);

export const verifyOtp = async (
  assessmentId: string,
  email: string,
  otp: string,
) => {
  const { data } = await axios.post(
    `${API}/api/student-auth/login`,
    { assessmentId, email, otp },
    getAuthConfig(),
  );

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Unable to verify OTP.",
    );
  }

  if (data.token) {
    localStorage.setItem(
      "studentToken",
      data.token,
    );
    localStorage.setItem(
      "token",
      data.token,
    );
  }

  if (data.student) {
    localStorage.setItem(
      "student",
      JSON.stringify(data.student),
    );
  }

  return data;
};

export const loginStudent = async (
  assessmentId: string,
  email: string,
  passwordOrOtp: string,
  loginMethod:
    | "PASSWORD"
    | "OTP" = "PASSWORD",
) => {
  const payload =
    loginMethod === "OTP"
      ? {
          assessmentId,
          email,
          otp: passwordOrOtp,
        }
      : {
          assessmentId,
          email,
          password: passwordOrOtp,
        };

  const { data } = await axios.post(
    `${API}/api/student-auth/login`,
    payload,
    getAuthConfig(),
  );

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Unable to login.",
    );
  }

  if (data.token) {
    localStorage.setItem(
      "studentToken",
      data.token,
    );
    localStorage.setItem(
      "token",
      data.token,
    );
  }

  if (data.student) {
    localStorage.setItem(
      "student",
      JSON.stringify(data.student),
    );
  }

  return data;
};

export const startAssessment = async (
  assessmentId: string,
): Promise<StartAssessmentResponse> => {
  const { data } = await axios.post(
    `${API}/api/student-assessments/${assessmentId}/start`,
    {},
    getAuthConfig(),
  );

  if (
    !data?.success ||
    !data?.attemptId ||
    !data?.question
  ) {
    throw new Error(
      data?.message ||
        "Unable to start assessment.",
    );
  }

  if (data.attemptId) {
    localStorage.setItem(
      "studentAttemptId",
      data.attemptId,
    );

    if (data.sessionId) {
      sessionStorage.setItem(
        `quiz_session_${data.attemptId}`,
        data.sessionId,
      );

      localStorage.setItem(
        `quiz_session_${data.attemptId}`,
        data.sessionId,
      );
    }
  }

  return data;
};

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

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Unable to load question.",
    );
  }

  return {
    question: data.question,
    remainingSeconds: Number(
      data.remainingSeconds || 0,
    ),
  };
};

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

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Unable to save answer.",
    );
  }

  return data;
};

export const getPalette = async (
  attemptId: string,
): Promise<{
  palette: PaletteQuestion[];
}> => {
  const { data } = await axios.get(
    `${API}/api/student-assessments/${attemptId}/palette`,
    getSessionConfig(attemptId),
  );

  if (!data?.success) {
    throw new Error(
      data?.message ||
        "Unable to load question palette.",
    );
  }

  return {
    palette: data.palette || [],
  };
};

export const getAssessmentStatus = async (
  attemptId: string,
) => {
  const { data } = await axios.get(
    `${API}/api/student-assessments/${attemptId}/status`,
    getSessionConfig(attemptId),
  );

  return data;
};

export const resumeAssessment = async (
  assessmentId: string,
  attemptId: string,
) => {
  void assessmentId;

  const status =
    await getAssessmentStatus(
      attemptId,
    );

  if (!status?.success) {
    throw new Error(
      status?.message ||
        "Unable to restore assessment.",
    );
  }

  if (
    status.status === "SUBMITTED" ||
    status.status === "EXPIRED" ||
    status.expired ||
    Number(status.remainingSeconds) <= 0
  ) {
    throw new Error(
      "This assessment attempt is no longer active.",
    );
  }

  const savedQuestion =
    Number(
      localStorage.getItem(
        `studentCurrentQuestion:${attemptId}`,
      ),
    ) || 1;

  const questionResult =
    await getQuestion(
      attemptId,
      savedQuestion,
    );

  return {
    attemptId,

    totalQuestions:
      status.totalQuestions ||
      status.total_questions ||
      0,

    currentQuestion:
      savedQuestion,

    remainingSeconds:
      questionResult.remainingSeconds,

    question:
      questionResult.question,
  };
};

export const submitAssessment = async (
  attemptId: string,
  reason:
    | "STUDENT_SUBMIT"
    | "AUTO_SUBMIT"
    | "SECURITY_AUTO_SUBMIT" = "STUDENT_SUBMIT",
) => {
  try {
    const { data } = await axios.post(
      `${API}/api/student-assessments/${attemptId}/submit`,
      { reason },
      getSessionConfig(attemptId),
    );

    return data;
  } catch (error: any) {
    /*
     * Anti-cheat/timer and the student's click can reach
     * the server almost simultaneously. A second request
     * must be treated as an idempotent success.
     */
    if (
      error?.response?.status === 400 &&
      /already submitted/i.test(
        String(
          error?.response?.data
            ?.message || "",
        ),
      )
    ) {
      return {
        success: true,
        alreadySubmitted: true,
        status: "SUBMITTED",
      };
    }

    throw error;
  }
};

export const assessmentHeartbeat = async (
  attemptId: string,
) => {
  const { data } = await axios.post(
    `${API}/api/student-assessments/${attemptId}/heartbeat`,
    {},
    getSessionConfig(attemptId),
  );

  return data;
};
