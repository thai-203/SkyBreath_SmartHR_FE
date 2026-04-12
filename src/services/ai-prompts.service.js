import api from "@/lib/api";

export const aiPromptsService = {
  getAll: async () => {
    const response = await api.get("/ai-prompts");
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/ai-prompts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/ai-prompts", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/ai-prompts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/ai-prompts/${id}`);
    return response.data;
  },
};
