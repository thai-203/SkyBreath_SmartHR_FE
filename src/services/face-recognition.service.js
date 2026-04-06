import api from "@/lib/api";

const BASE_URL = "/face-recognition-config";

export const faceRecognitionService = {
  // Get current face recognition configuration
  async getConfig() {
    try {
      const response = await api.get(BASE_URL);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Update face recognition configuration
  async updateConfig(configData) {
    try {
      const { id, createdAt, updatedAt, deletedAt, isDeleted, ...payload } =
        configData;
      const response = await api.put(BASE_URL, payload);
      return response.data;
    } catch (error) {
      throw error;
    }
  },

  // Reset to default configuration
  async resetToDefaults() {
    try {
      const response = await api.post(`${BASE_URL}/reset`, {});
      return response.data;
    } catch (error) {
      throw error;
    }
  },
};
