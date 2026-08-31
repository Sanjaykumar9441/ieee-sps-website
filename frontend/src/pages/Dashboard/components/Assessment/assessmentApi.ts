
import axios from "axios";

const API = import.meta.env.VITE_API_URL;
const api = axios.create({ baseURL: `${API}/api`, timeout: 20000 });

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token") || localStorage.getItem("studentToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const getAssessments = async () => (await api.get("/assessments")).data.assessments || [];
export const createAssessment = async (payload:any) => (await api.post("/assessments",payload)).data;
export const updateAssessment = async (id:string,payload:any) => (await api.put(`/assessments/${id}`,payload)).data;
export const deleteAssessment = async (id:string) => (await api.delete(`/assessments/${id}`)).data;
export const duplicateAssessment = async (id:string) => (await api.post(`/assessments/${id}/duplicate`)).data;
export const publishAssessment = async (id:string) => (await api.patch(`/assessments/${id}/publish`)).data;
export const unpublishAssessment = async (id:string) => (await api.patch(`/assessments/${id}/unpublish`)).data;
export const archiveAssessment = async (id:string) => (await api.patch(`/assessments/${id}/archive`)).data;
export const getQuestionBanks = async (assessmentId:string) => (await api.get(`/question-banks/assessment/${assessmentId}`)).data.questionBanks || [];
export const createQuestionBank = async (payload:any) => (await api.post("/question-banks",payload)).data;
export const updateQuestionBank = async (id:string,payload:any) => (await api.put(`/question-banks/${id}`,payload)).data;
export const deleteQuestionBank = async (id:string) => (await api.delete(`/question-banks/${id}`)).data;
export const duplicateQuestionBank = async (id:string) => (await api.post(`/question-banks/${id}/duplicate`)).data;
export const getQuestions = async (bankId:string) => (await api.get(`/questions/bank/${bankId}`)).data.questions || [];
export const searchQuestions = async (bankId:string,keyword:string) => (await api.get(`/questions/bank/${bankId}/search`,{params:{keyword}})).data.questions || [];
export const createQuestion = async (payload:any) => (await api.post("/questions",payload)).data;
export const updateQuestion = async (id:string,payload:any) => (await api.put(`/questions/${id}`,payload)).data;
export const deleteQuestion = async (id:string) => (await api.delete(`/questions/${id}`)).data;
export const duplicateQuestion = async (id:string) => (await api.post(`/questions/${id}/duplicate`)).data;
export const validateImportedQuestions = async (bankId:string,questions:any[]) => (await api.post(`/questions/bank/${bankId}/validate`,{questions})).data;
export const checkQuestionDuplicates = async (bankId:string,questions:any[]) => (await api.post(`/questions/bank/${bankId}/check-duplicates`,{questions})).data;
export const finalImportQuestions = async (bankId:string,questions:any[]) => (await api.post(`/questions/bank/${bankId}/final-import`,{questions})).data;
export const getAllowedStudents = async (assessmentId:string) => (await api.get(`/student-auth/${assessmentId}`)).data.students || [];
export const getStudentDetails = async (studentId:string,assessmentId:string) => (await api.get(`/student-auth/details/${studentId}`,{params:{assessmentId}})).data;
export const addAllowedStudent = async (payload:any) => (await api.post("/student-auth/add",payload)).data;
export const deleteStudents = async (assessmentId:string,studentIds:string[]) => (await api.post("/student-auth/delete",{assessmentId,studentIds})).data;
export const blockStudents = async (assessmentId:string,studentIds:string[]) => (await api.post("/student-auth/block",{assessmentId,studentIds})).data;
export const unblockStudents = async (assessmentId:string,studentIds:string[]) => (await api.post("/student-auth/unblock",{assessmentId,studentIds})).data;
export const getLiveStudents = async (assessmentId:string) => (await api.get(`/admin/live-monitor/${assessmentId}`)).data.students || [];
export const getLiveStudentDetails = async (attemptId:string) => (await api.get(`/admin/live-monitor/attempt/${attemptId}`)).data;
export const forceSubmitAttempt = async (attemptId:string) => (await api.post(`/admin/force-submit/${attemptId}`)).data;
export const getLeaderboard = async (assessmentId:string) => (await api.get(`/admin/leaderboard/${assessmentId}`)).data.leaderboard || [];
export const getDashboardAnalytics = async (assessmentId:string,params?:any) => (await api.get(`/admin/dashboard-analytics/${assessmentId}`,{params})).data.analytics || {};
export const getAssessmentSettings = async (assessmentId:string) => (await api.get(`/assessment-settings/${assessmentId}`)).data.settings;
export const updateAssessmentSettings = async (assessmentId:string,payload:any) => (await api.put(`/assessment-settings/${assessmentId}`,payload)).data;
export const downloadAssessmentExport = async (assessmentId:string,format:"excel"|"pdf"|"csv") => {
  const response=await api.get(`/admin/export/${format}/${assessmentId}`,{responseType:"blob"});
  const blob=new Blob([response.data],{type:response.headers["content-type"]});
  const url=URL.createObjectURL(blob); const link=document.createElement("a");
  link.href=url; link.download=`assessment-${assessmentId}-results.${format==="excel"?"xlsx":format}`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
};
