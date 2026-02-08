import api from "@/lib/api";

export const positionsService = {
    getAll: async () => {
        const response = await api.get("/positions");
        return response.data;
    },


    getList: async () => {
        const response = await api.get("/positions/list");
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/positions/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/positions", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/positions/${id}`, data);
        return response.data;
    },

    remove: async (id) => {
        const response = await api.delete(`/positions/${id}`);
        return response.data;
    },

    exportExcel: async () => {
        const response = await api.get("/positions/export/excel", {
            responseType: "blob",
        });
        return response.data;
    },

    getSelectOptions: async () => {
        const response = await api.get("/positions/list");
        const items = response.data || [];

        return items.map(item => ({
            value: item.id,
            label: item.positionName || item.name || "N/A", 
            data: item,
        }));
    },
};