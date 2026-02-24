import api from "@/lib/api";

export const employeesService = {
    getAll: async (params = {}) => {
        const response = await api.get("/employees", { params });
        return response.data;
    },

    getList: async () => {
        const response = await api.get("/employees/list");
        return response.data;
    },

    getMetadata: async () => {
        const response = await api.get("/employees/meta-data");
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/employees/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/employees", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/employees/${id}`, data);
        return response.data;
    },

    delete: async (id) => {
        const response = await api.delete(`/employees/${id}`);
        return response.data;
    },

    getValidationData: async () => {
        const response = await api.get("/employees/validation-data");
        return response.data;
    },

    exportExcel: async () => {
        const response = await api.get("/employees/export", {
            responseType: "blob",
        });
        return response.data;
    },

    getEmployeeNoPlanId: async () => {
        const response = await api.get("/employees/no-plan");
        return response.data;
    },
};
