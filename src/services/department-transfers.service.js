import api from "@/lib/api";

export const departmentTransfersService = {
    create: async (data) => {
        const response = await api.post("/department-transfers", data);
        return response.data;
    },
    getAll: async (params = {}) => {
        const response = await api.get("/department-transfers", { params });
        return response.data;
    },
    getById: async (id) => {
        const response = await api.get(`/department-transfers/${id}`);
        return response.data;
    },
};
