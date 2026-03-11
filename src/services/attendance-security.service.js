import api from "@/lib/api";

const BASE_URL = "/attendance-security-config";

export const attendanceSecurityService = {
  async getConfig() {
    const response = await api.get(BASE_URL);
    return response.data;
  },

  async updateConfig(configData) {
    const { id, createdAt, updatedAt, deletedAt, isDeleted, ...payload } =
      configData;
    const response = await api.put(BASE_URL, payload);
    return response.data;
  },

  async resetToDefaults() {
    const response = await api.post(`${BASE_URL}/reset`);
    return response.data;
  },
};
