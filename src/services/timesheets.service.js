import api from "@/lib/api";

export const timesheetsService = {
    generate: async (data) => {
        const response = await api.post("/timesheets/generate", data);
        return response.data;
    },

    getAll: async (params = {}) => {
        const response = await api.get("/timesheets", { params });
        return response.data;
    },

    addEmployee: async (data) => {
        const response = await api.post("/timesheets/add-employee", data);
        return response.data;
    },

    remove: async (id) => {
        const response = await api.delete(`/timesheets/${id}`);
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/timesheets/${id}`);
        return response.data;
    },

    getAttendanceDetails: async (id) => {
        const response = await api.get(`/timesheets/${id}/attendance`);
        return response.data;
    },

    recalculate: async (id) => {
        const response = await api.post(`/timesheets/${id}/recalculate`);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/timesheets/${id}`, data);
        return response.data;
    },

    lock: async (id) => {
        const response = await api.post(`/timesheets/${id}/lock`);
        return response.data;
    },

    unlock: async (id) => {
        const response = await api.post(`/timesheets/${id}/unlock`);
        return response.data;
    },

    bulkLock: async (data) => {
        const response = await api.post("/timesheets/bulk-lock", data);
        return response.data;
    },

    bulkRecalculate: async (data) => {
        const response = await api.post("/timesheets/bulk-recalculate", data);
        return response.data;
    },

    exportSummary: async (params = {}) => {
        const response = await api.get("/timesheets/export/summary", {
            params,
            responseType: "blob",
        });
        return response.data;
    },

    exportDetailed: async (params = {}) => {
        const response = await api.get("/timesheets/export/detailed", {
            params,
            responseType: "blob",
        });
        return response.data;
    },
};
