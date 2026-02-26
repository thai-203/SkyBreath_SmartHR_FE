import api from "@/lib/api";

export const overtimeRulesService = {
    getAll: async () => {
        const response = await api.get("/overtime-rules");
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/overtime-rules/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/overtime-rules", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/overtime-rules/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/overtime-rules/${id}`);
        return response.data;
    },
};
