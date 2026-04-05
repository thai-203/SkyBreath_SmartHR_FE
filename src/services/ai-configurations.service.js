import api from "@/lib/api";

export const aiConfigurationsService = {
  getAll: async () => {
    const response = await api.get("/ai-configurations");
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/ai-configurations", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/ai-configurations/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/ai-configurations/${id}`);
    return response.data;
  },
};
