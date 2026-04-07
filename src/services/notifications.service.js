import api from "@/lib/api";

export const notificationsService = {
    /** Lấy danh sách thông báo (phân trang, lọc) */
    getMyNotifications: async (params = {}) => {
        const response = await api.get("/notifications", { params });
        return response.data;
    },

    /** Đếm số lượng chưa đọc */
    getUnreadCount: async () => {
        const response = await api.get("/notifications/unread-count");
        return response.data;
    },

    /** Đánh dấu 1 thông báo đã đọc */
    markAsRead: async (id) => {
        const response = await api.patch(`/notifications/${id}/read`);
        return response.data;
    },

    /** Đánh dấu tất cả đã đọc */
    markAllAsRead: async () => {
        const response = await api.patch("/notifications/read-all");
        return response.data;
    },

    // ─── UC-NOTI-05: Manual Notification ────────────────────────────────────

    /**
     * Gửi thông báo thủ công
     * @param {{ title, message, recipientScope, scopeIds, scheduledAt }} payload
     */
    sendManualNotification: async (payload) => {
        const response = await api.post("/notifications/manual", payload);
        return response.data;
    },

    // ─── UC-NOTI-06: Notification History ────────────────────────────────────

    /** Lấy lịch sử gửi thông báo */
    getNotificationHistory: async (params = {}) => {
        const response = await api.get("/notifications/history", { params });
        return response.data;
    },

    /** Chi tiết bản ghi lịch sử */
    getNotificationHistoryDetail: async (id) => {
        const response = await api.get(`/notifications/history/${id}`);
        return response.data;
    },
};

