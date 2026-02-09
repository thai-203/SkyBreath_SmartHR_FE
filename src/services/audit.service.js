import api from "@/lib/api";

export const auditService = {
  getAll: async (params = {}) => {
    const response = await api.get("/action-logs", { params });
    return response.data;
  },

  export: async (params = {}) => {
    const response = await api.get("/action-logs/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/action-logs/${id}`);
    return response.data;
  },
};
