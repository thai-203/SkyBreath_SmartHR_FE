import api from "@/lib/api";

export const workingShiftsService = {
  getAll: async (params = {}) => {
    const response = await api.get("/shifts", { params });
    return response.data;
  },

      getList: async () => {
        const response = await api.get("/shifts/list");
        return response.data;
    },

  getById: async (id) => {
    const response = await api.get(`/shifts/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/shifts", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/shifts/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/shifts/${id}`);
    return response.data;
  },
};
