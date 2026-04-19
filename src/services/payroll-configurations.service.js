import api from "@/lib/api";

const BASE_URL = "/payroll-config";

export const payrollConfigurationsService = {
  async getConfig() {
    const response = await api.get(BASE_URL);
    return response.data.data;
  },

  async updateConfig(configData) {
    const { id, createdAt, updatedAt, deletedAt, isDeleted, ...payload } =
      configData;
    const response = await api.put(BASE_URL, payload);
    return response.data.data;
  },
};
