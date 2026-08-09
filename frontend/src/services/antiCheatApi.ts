import api from "../services/api";

import { AntiCheatPayload } from "../types/antiCheat";

const BASE = "/api/student-assessment";

export async function reportInfraction(
  attemptId: string,
  payload: AntiCheatPayload,
) {
  const { data } = await api.post(
    `${BASE}/${attemptId}/infractions`,
    payload,
  );

  return data;
}

export async function getAntiCheatConfig() {
  const { data } = await api.get(
    `${BASE}/anti-cheat/config`,
  );

  return data.config;
}