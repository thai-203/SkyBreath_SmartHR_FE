import api from "@/lib/api";

export const requestsService = {
    // ─── Query ──────────────────────────────────────────────────────────
    /** UC-REQ-05: Danh sách đơn của tôi */
    getMyRequests: async (params = {}) => {
        const response = await api.get("/requests/my", { params });
        return response.data;
    },

    /** UC-REQ-08: Danh sách đơn chờ tôi duyệt */
    getPendingApprovals: async (params = {}) => {
        const response = await api.get("/requests/pending", { params });
        return response.data;
    },

    /** HR/Admin: Xem tất cả đơn */
    getAllRequests: async (params = {}) => {
        const response = await api.get("/requests", { params });
        return response.data;
    },

    /** Timesheets/Excuses: đơn nhóm đi muộn/về sớm & giải trình chấm công */
    getExcuseRequests: async (params = {}) => {
        const response = await api.get("/requests/excuses", { params });
        return response.data;
    },

    /** Timesheets: Bảng tăng ca chi tiết (nhóm đơn OT — request_group_id = 1) */
    getOvertimeDetailRequests: async (params = {}) => {
        const response = await api.get("/requests/overtime-detail", { params });
        return response.data;
    },

    /** UC-REQ-06: Chi tiết đơn */
    getById: async (id) => {
        const response = await api.get(`/requests/${id}`);
        return response.data;
    },

    /** Xem trước workflow khi chọn loại đơn trên form */
    getWorkflowPreview: async (requestTypeId, employeeId) => {
        const response = await api.get("/requests/workflow-preview", {
            params: { requestTypeId, employeeId },
        });
        return response.data;
    },

    // ─── Mutations ──────────────────────────────────────────────────────
    /** UC-REQ-02: Lưu nháp */
    saveDraft: async (data) => {
        const response = await api.post("/requests/draft", data);
        return response.data;
    },

    /** UC-REQ-03: Gửi duyệt */
    submit: async (id) => {
        const response = await api.post(`/requests/${id}/submit`);
        return response.data;
    },

    /** UC-REQ-04: Hủy đơn */
    cancel: async (id) => {
        const response = await api.post(`/requests/${id}/cancel`);
        return response.data;
    },

    /** UC-REQ-09: Phê duyệt */
    approve: async (id) => {
        const response = await api.post(`/requests/${id}/approve`);
        return response.data;
    },

    /** UC-REQ-10: Từ chối */
    reject: async (id, comment) => {
        const response = await api.post(`/requests/${id}/reject`, { comment });
        return response.data;
    },

    /** Hủy duyệt (Revoke) */
    revoke: async (id, levelOrder, comment) => {
        const response = await api.post(`/requests/${id}/revoke`, { levelOrder, comment });
        return response.data;
    },

    /** Upload tài liệu đính kèm */
    uploadAttachments: async (id, files) => {
        const formData = new FormData();
        files.forEach((file) => formData.append("files", file));
        const response = await api.post(`/requests/${id}/attachments`, formData, {
            headers: { "Content-Type": "multipart/form-data" },
        });
        return response.data;
    },

    // ─── Legacy (giữ lại cho các màn hình cũ dùng) ──────────────────────
    getLeaveCalendar: async (params = {}) => {
        const response = await api.get("/requests/leaves/calendar", { params });
        return response.data;
    },
};
