import api from "@/lib/api";

export const penaltiesService = {
    getAll: async (params = {}) => {
        const response = await api.get("/penalties", { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/penalties/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/penalties", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/penalties/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/penalties/${id}`);
        return response.data;
    },
};
