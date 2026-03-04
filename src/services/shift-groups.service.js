import api from "@/lib/api";

export const shiftGroupsService = {
  getAll: async (params = {}) => {
    const response = await api.get("/shifts/groups", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/shifts/groups/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/shifts/groups", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/shifts/groups/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/shifts/groups/${id}`);
    return response.data;
  },
};
