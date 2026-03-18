import api from "@/lib/api";

export const auditService = {
  getAll: async (params = {}) => {
    const response = await api.get("/action-logs", { params });
    return response.data;
  },

  export: async () => {
    const response = await api.get("/action-logs/export/excel", {
      responseType: "blob",
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/action-logs/${id}`);
    return response.data;
  },
};
