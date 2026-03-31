import api from "@/lib/api";

export const requestTypesService = {
    getAll: async (params = {}) => {
        const response = await api.get("/request-types", { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/request-types/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/request-types", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/request-types/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/request-types/${id}`);
        return response.data;
    },
};
