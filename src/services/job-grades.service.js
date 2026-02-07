import api from "@/lib/api";

export const jobGradesService = {
    // Lấy danh sách có phân trang
    getAll: async (params = {}) => {
        const response = await api.get("/job-grades", { params });
        return response.data;
    },

    // Lấy danh sách rút gọn
    getList: async () => {
        const response = await api.get("/job-grades/list");
        return response.data;
    },

    // Lấy chi tiết theo ID
    getById: async (id) => {
        const response = await api.get(`/job-grades/${id}`);
        return response.data;
    },

    // Tạo mới
    create: async (data) => {
        const response = await api.post("/job-grades", data);
        return response.data;
    },

    // Cập nhật
    update: async (id, data) => {
        const response = await api.put(`/job-grades/${id}`, data);
        return response.data;
    },

    // Xóa
    remove: async (id) => {
        const response = await api.delete(`/job-grades/${id}`);
        return response.data;
    },

    // Export Excel
    exportExcel: async () => {
        const response = await api.get("/job-grades/export/excel", {
            responseType: "blob",
        });
        return response.data;
    },

    // Dùng cho Select / Dropdown
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
