import api from "@/lib/api";

export const employeeSalariesService = {
    getAll: async () => {
        const response = await api.get("/employee-salaries");
        return response.data;
    },

    getList: async () => {
        const response = await api.get("/employee-salaries/list");
        return response.data;
    },

    getById: async (id) => {
        const response = await api.get(`/employee-salaries/${id}`);
        return response.data;
    },

    create: async (data) => {
        const response = await api.post("/employee-salaries", data);
        return response.data;
    },

    update: async (id, data) => {
        const response = await api.put(`/employee-salaries/${id}`, data);
        return response.data;
    },

    remove: async (id) => {
        const response = await api.delete(`/employee-salaries/${id}`);
        return response.data;
    },

    exportExcel: async () => {
        const response = await api.get("/employee-salaries/export/excel", {
            responseType: "blob",
        });
        return response.data;
    },

    getByEmployeeId: async (employeeId) => {
        const response = await api.get(`/employee-salaries/employee/${employeeId}`);
        return response.data;
    },

    getSelectOptions: async () => {
        const response = await api.get("/employee-salaries/list");
        const items = response.data || [];

        return items.map(item => ({
            value: item.id,
            label: item.employeeCode
                ? `${item.employeeCode} - ${item.salaryAmount ?? 0}`
                : `Salary #${item.id}`,
            data: item,
        }));
    },
};
