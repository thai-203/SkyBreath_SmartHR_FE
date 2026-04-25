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

    // UC28 - Update general payroll info
    update: async (id, data) => {
        const response = await api.patch(`/payroll/${id}`, data);
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

    unlock: async (id) => {
        const response = await api.post(`/payroll/${id}/unlock`);
        return response.data;
    },

    // UC30 - Send payslips by email (toàn bộ - chỉ khi LOCKED)
    sendPayslips: async (id) => {
        const response = await api.post(`/payroll/${id}/send-payslips`);
        return response.data;
    },

    // UC30 - Send selected payslips by email (theo detailIds - mọi trạng thái)
    sendPayslipsSelected: async (id, detailIds = []) => {
        const response = await api.post(`/payroll/${id}/send-payslips-selected`, { detailIds });
        return response.data;
    },

    // UC30 - Export payslips Excel
    exportPayslips: async (id) => {
        const response = await api.get(`/payroll/payslips/${id}`, { responseType: "blob" });
        return response.data;
    },

    // UC28 - Import Details Excel
    importDetails: async (id, formData) => {
        const response = await api.post(`/payroll/${id}/import-details`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });
        return response.data;
    },

    // ── FILE ĐÍNH KÈM ──

    /** Lấy danh sách file đính kèm */
    getAttachments: async (payrollId) => {
        const response = await api.get(`/payroll/${payrollId}/attachments`);
        return response.data;
    },

    /** Upload nhiều file cùng lúc (field: "files") */
    uploadAttachments: async (payrollId, files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append('files', file));
        const response = await api.post(`/payroll/${payrollId}/attachments`, formData, {
            headers: { 'Content-Type': 'multipart/form-data' },
        });
        return response.data;
    },

    /** Xóa một file đính kèm */
    deleteAttachment: async (payrollId, attachmentId) => {
        const response = await api.delete(`/payroll/${payrollId}/attachments/${attachmentId}`);
        return response.data;
    },

    /** Download một file — trả về Blob để trigger save */
    downloadAttachment: async (payrollId, attachmentId, fileName) => {
        const response = await api.get(
            `/payroll/${payrollId}/attachments/${attachmentId}/download`,
            { responseType: 'blob' }
        );
        const url = URL.createObjectURL(response.data);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName || 'download';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    },
};

