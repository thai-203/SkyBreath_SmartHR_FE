import api from "@/lib/api";

export const jobGradesService = {
    getAll: async (params = {}) => {
        const response = await api.get("/job-grades", { params });
        return response.data;
    },

    getList: async () => {
        const response = await api.get("/job-grades/list");
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/job-grades/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/job-grades", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/job-grades/${id}`, data);
        return response.data;
    },

    remove: async (id) => {
        const response = await api.delete(`/job-grades/${id}`);
        return response.data;
    },

    exportExcel: async () => {
        const response = await api.get("/job-grades/export/excel", {
            responseType: "blob",
        });
        return response.data;
    },

    getSelectOptions: async () => {
        const response = await api.get("/job-grades/list");
        const items = response.data || [];

        return items.map(item => ({
            value: item.id,
            label: item.gradeName,
            data: item,
        }));
    },
};
