import api from "@/lib/api";

export const departmentsService = {
    getAll: async (params = {}) => {
        const response = await api.get("/departments", { params });
        return response.data;
    },

    getList: async () => {
        const response = await api.get("/departments/list");
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/departments/${id}`);
        return response.data;
    },

    getChart: async () => {
        const response = await api.get("/departments/chart");
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/departments", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/departments/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/departments/${id}`);
        return response.data;
    },

    export: async () => {
        const response = await api.get("/departments/export", {
            responseType: "blob",
        });
        return response.data;
    },
};
