import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

const api = axios.create({
  baseURL: `${API}/api`,
});

api.interceptors.request.use((config) => {
  config.headers.Authorization = authHeaders().Authorization;
  return config;
});

export const getAssessments = async () => {
  const { data } = await api.get("/assessments");
  return data.assessments;
};

export const getAssessment = async (assessmentId: string) => {
  const { data } = await api.get(`/assessments/${assessmentId}`);

  return data.assessment;
};

export const createAssessment = async (payload: any) => {
  const { data } = await api.post("/assessments", payload);

  return data;
};

export const updateAssessment = async (assessmentId: string, payload: any) => {
  const { data } = await api.put(`/assessments/${assessmentId}`, payload);

  return data;
};

export const deleteAssessment = async (assessmentId: string) => {
  const { data } = await api.delete(`/assessments/${assessmentId}`);

  return data;
};

export const duplicateAssessment = async (assessmentId: string) => {
  const { data } = await api.post(`/assessments/${assessmentId}/duplicate`);

  return data;
};

export const publishAssessment = async (assessmentId: string) => {
  const { data } = await api.patch(`/assessments/${assessmentId}/publish`);

  return data;
};

export const activateAssessment = async (assessmentId: string) => {
  const { data } = await api.patch(`/assessments/${assessmentId}/activate`);

  return data;
};

export const deactivateAssessment = async (assessmentId: string) => {
  const { data } = await api.patch(`/assessments/${assessmentId}/deactivate`);

  return data;
};

export const archiveAssessment = async (assessmentId: string) => {
  const { data } = await api.patch(`/assessments/${assessmentId}/archive`);

  return data;
};

/* ==========================================================
   QUESTION BANKS
========================================================== */

export const getQuestionBanks = async (assessmentId: string) => {
  const { data } = await api.get(`/question-banks/assessment/${assessmentId}`);

  return data.questionBanks;
};

export const createQuestionBank = async (payload: any) => {
  const { data } = await api.post("/question-banks", payload);

  return data;
};

export const updateQuestionBank = async (id: string, payload: any) => {
  const { data } = await api.put(`/question-banks/${id}`, payload);

  return data;
};

export const duplicateQuestionBank = async (id: string) => {
  const { data } = await api.post(`/question-banks/${id}/duplicate`);
  return data;
};

export const deleteQuestionBank = async (id: string) => {
  const { data } = await api.delete(`/question-banks/${id}`);

  return data;
};

/* ==========================================================
   QUESTIONS
========================================================== */

export const getQuestions = async (questionBankId: string) => {
  const { data } = await api.get(`/questions/bank/${questionBankId}`);

  return data.questions;
};

export const getQuestion = async (id: string) => {
  const { data } = await api.get(`/questions/${id}`);

  return data.question;
};

export const createQuestion = async (payload: any) => {
  const { data } = await api.post("/questions", payload);

  return data;
};

export const updateQuestion = async (id: string, payload: any) => {
  const { data } = await api.put(`/questions/${id}`, payload);

  return data;
};

export const deleteQuestion = async (id: string) => {
  const { data } = await api.delete(`/questions/${id}`);

  return data;
};

export const duplicateQuestion = async (id: string) => {
  const { data } = await api.post(`/questions/${id}/duplicate`);

  return data;
};

export const searchQuestions = async (
  questionBankId: string,
  keyword: string,
) => {
  const { data } = await api.get(`/questions/bank/${questionBankId}/search`, {
    params: {
      keyword,
    },
  });

  return data.questions;
};

/* ==========================================================
   DASHBOARD ANALYTICS
========================================================== */

export const getDashboardAnalytics = async (
  assessmentId: string,
  department = "all",
) => {
  const { data } = await api.get(`/dashboard-analytics/${assessmentId}`, {
    params: {
      department,
    },
  });

  return data.analytics;
};

export const getAllowedStudents = async (assessmentId: string) => {
  const { data } = await api.get(`/student-auth/${assessmentId}`);
  return data.students;
};

export const sendBulkOtp = async (
  assessmentId: string,
  studentIds: string[],
) => {
  const { data } = await api.post("/student-auth/send-bulk-otp", {
    assessmentId,
    studentIds,
  });

  return data;
};

export const blockStudents = async (
  assessmentId: string,
  studentIds: string[],
) => {
  const { data } = await api.post("/student-auth/block", {
    assessmentId,
    studentIds,
  });

  return data;
};

export const unblockStudents = async (
  assessmentId: string,
  studentIds: string[],
) => {
  const { data } = await api.post("/student-auth/unblock", {
    assessmentId,
    studentIds,
  });

  return data;
};

export const deleteStudents = async (
  assessmentId: string,
  studentIds: string[],
) => {
  const { data } = await api.post("/student-auth/delete", {
    assessmentId,
    studentIds,
  });

  return data;
};

export const getStudentDetails = async (studentId: string) => {
  const { data } = await api.get(`/student-auth/details/${studentId}`);

  return data;
};

export const getLiveStudents = async (assessmentId: string) => {
  const { data } = await api.get(`/live-monitor/${assessmentId}`);

  return data.students;
};

export const getLiveStudentDetails = async (attemptId: string) => {
  const { data } = await api.get(`/live-monitor/attempt/${attemptId}`);

  return data;
};

export const forceSubmitAttempt = async (attemptId: string) => {
  const { data } = await api.post(`/admin-force-submit/student/${attemptId}`);

  return data;
};

export const disqualifyAttempt = async (attemptId: string, reason: string) => {
  const { data } = await api.post(
    `/admin-force-submit/student/${attemptId}/disqualify`,
    {
      reason,
    },
  );

  return data;
};

export const getLeaderboard = async (assessmentId: string) => {
  const { data } = await api.get(`/leaderboard/${assessmentId}`);

  return data.leaderboard;
};
