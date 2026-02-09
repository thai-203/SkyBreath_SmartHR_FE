import api from "@/lib/api";

export const contractsService = {
    getAll: async (params = {}) => {
        const response = await api.get("/contracts", { params });
        return response.data;
    },

    getList: async () => {
        const response = await api.get("/contracts/list");
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/contracts/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/contracts", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/contracts/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/contracts/${id}`);
        return response.data;
    },

    terminate: async (id, data) => {
        const response = await api.put(`/contracts/${id}/terminate`, data);
        return response.data;
    },

    export: async () => {
        const response = await api.get("/contracts/export", {
            responseType: "blob",
        });
        return response.data;
    },

    getDetails: async (id) => {
        const response = await api.get(`/contracts/${id}/details`);
        return response.data;
    },
};
