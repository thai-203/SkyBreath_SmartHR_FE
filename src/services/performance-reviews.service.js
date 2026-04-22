import api from "@/lib/api";

export const performanceReviewsService = {
    getAll: async (params = {}) => {
        const response = await api.get("/performance-reviews", { params });
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/performance-reviews/${id}`);
        return response.data;
    },

    getManagedEmployees: async () => {
        const response = await api.get("/performance-reviews/managed-employees");
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/performance-reviews", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/performance-reviews/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/performance-reviews/${id}`);
        return response.data;
    },
};
