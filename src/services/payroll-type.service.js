import api from "@/lib/api";

export const payrollTypeService = {
  getAll: async (params = {}) => {
    const response = await api.get("/payroll-types", { params });
    return response.data;
  },

  getById: async (id) => {
    const response = await api.get(`/payroll-types/${id}`);
    return response.data;
  },

  create: async (data) => {
    const response = await api.post("/payroll-types", data);
    return response.data;
  },

  update: async (id, data) => {
    const response = await api.put(`/payroll-types/${id}`, data);
    return response.data;
  },

  delete: async (id) => {
    const response = await api.delete(`/payroll-types/${id}`);
    return response.data;
  },
};
