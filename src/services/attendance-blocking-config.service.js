import api from "@/lib/api";

export const attendanceBlockingConfigService = {
  // Lấy danh sách rule render ra bảng ban đầu
  getRules: async () => {
    const response = await api.get("/attendance-blocking-configs");
    return response.data;
  },

  // Lưu rule mới (Create)
  createRule: async (payload) => {
    const response = await api.post("/attendance-blocking-configs", payload);
    return response.data;
  },

  // Cập nhật rule (Update)
  updateRule: async (id, payload) => {
    const response = await api.put(
      `/attendance-blocking-configs/${id}`,
      payload,
    );
    return response.data;
  },

  // Bật/tắt trạng thái rule (Toggle)
  toggleRule: async (id, isActive) => {
    // Thường backend sẽ có 1 endpoint PATCH riêng cho việc đổi trạng thái
    const response = await api.patch(
      `/attendance-blocking-configs/${id}/status`,
      { isActive },
    );
    return response.data;
  },

  // Xóa rule
  deleteRule: async (id) => {
    const response = await api.delete(`/attendance-blocking-configs/${id}`);
    return response.data;
  },
};
