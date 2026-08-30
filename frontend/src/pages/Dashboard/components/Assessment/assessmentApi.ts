// Add these functions to the existing assessmentApi.ts

export const getAssessmentSettings = async (assessmentId: string) => {
  const { data } = await api.get(`/assessments/${assessmentId}/settings`);
  return data.settings;
};

export const updateAssessmentSettings = async (
  assessmentId: string,
  payload: Record<string, unknown>,
) => {
  const { data } = await api.put(
    `/assessments/${assessmentId}/settings`,
    payload,
  );
  return data;
};

export const downloadAssessmentExport = async (
  assessmentId: string,
  format: "excel" | "pdf" | "csv",
) => {
  const response = await api.get(`/exports/${format}/${assessmentId}`, {
    responseType: "blob",
  });

  const blob = new Blob([response.data]);
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;

  const extension = format === "excel" ? "xlsx" : format;
  link.download = `assessment-${assessmentId}-results.${extension}`;

  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
};
