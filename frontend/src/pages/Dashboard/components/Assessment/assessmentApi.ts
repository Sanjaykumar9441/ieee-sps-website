import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const authHeaders = () => {
  const token = localStorage.getItem("token");

  return {
    Authorization: `Bearer ${token}`,
  };
};

export const getAssessments = async () => {
  const { data } = await axios.get(
    `${API}/api/assessments`,
    {
      headers: authHeaders(),
    }
  );

  return data.assessments || [];
};

export const deleteAssessment = async (id: string) => {
  return axios.delete(
    `${API}/api/assessments/${id}`,
    {
      headers: authHeaders(),
    }
  );
};

export const duplicateAssessment = async (id: string) => {
  return axios.post(
    `${API}/api/assessments/${id}/duplicate`,
    {},
    {
      headers: authHeaders(),
    }
  );
};

export const publishAssessment = async (id: string) => {
  return axios.patch(
    `${API}/api/assessments/${id}/publish`,
    {},
    {
      headers: authHeaders(),
    }
  );
};

export const activateAssessment = async (id: string) => {
  return axios.patch(
    `${API}/api/assessments/${id}/activate`,
    {},
    {
      headers: authHeaders(),
    }
  );
};

export const archiveAssessment = async (id: string) => {
  return axios.patch(
    `${API}/api/assessments/${id}/archive`,
    {},
    {
      headers: authHeaders(),
    }
  );
};