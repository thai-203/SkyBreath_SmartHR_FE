import api from "@/lib/api";

export const requestGroupsService = {
    getAll: async (params = {}) => {
        const response = await api.get("/request-groups", { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/request-groups/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/request-groups", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/request-groups/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/request-groups/${id}`);
        return response.data;
    },

    restore: async (id) => {
        const response = await api.post(`/request-groups/${id}/restore`);
        return response.data;
    },
};
