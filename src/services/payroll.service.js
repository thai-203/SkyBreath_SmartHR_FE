import api from "@/lib/api";

export const payrollService = {
    // UC27 - Create payroll batch
    create: async (data) => {
        const response = await api.post("/payroll", data);
        return response.data;
    },

    // UC27 - Auto-calculate payroll
    calculate: async (id) => {
        const response = await api.post(`/payroll/${id}/calculate`);
        return response.data;
    },

    // UC27 - Update employee detail (bonus/deduction/penalty)
    updateDetail: async (detailId, data) => {
        const response = await api.put(`/payroll/details/${detailId}`, data);
        return response.data;
    },

    // UC28 - List payrolls
    getAll: async (params = {}) => {
        const response = await api.get("/payroll", { params });
        return response.data;
    },

    // UC28 - Get payroll with full employee details
    getById: async (id) => {
        const response = await api.get(`/payroll/${id}`);
        return response.data;
    },

    // UC28 - Get details by department
    getDetailsByDepartment: async (payrollId, departmentId) => {
        const response = await api.get(`/payroll/${payrollId}/department/${departmentId}`);
        return response.data;
    },

    // UC28 - Export summary Excel
    exportSummary: async (id) => {
        const response = await api.get(`/payroll/export/${id}`, { responseType: "blob" });
        return response.data;
    },

    // UC29 - Submit for approval
    submit: async (id) => {
        const response = await api.post(`/payroll/${id}/submit`);
        return response.data;
    },

    // UC29 - Approve
    approve: async (id) => {
        const response = await api.post(`/payroll/${id}/approve`);
        return response.data;
    },

    // UC29 - Reject with reason
    reject: async (id, reason) => {
        const response = await api.post(`/payroll/${id}/reject`, { reason });
        return response.data;
    },

    // UC30 - Lock payroll
    lock: async (id) => {
        const response = await api.post(`/payroll/${id}/lock`);
        return response.data;
    },

    // UC30 - Send payslips by email
    sendPayslips: async (id) => {
        const response = await api.post(`/payroll/${id}/send-payslips`);
        return response.data;
    },

    // UC30 - Export payslips Excel
    exportPayslips: async (id) => {
        const response = await api.get(`/payroll/payslips/${id}`, { responseType: "blob" });
        return response.data;
    },
};
