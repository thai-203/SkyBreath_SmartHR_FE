import api from "@/lib/api";

export const requestsService = {
    getLeaveCalendar: async (params = {}) => {
        const response = await api.get("/requests/leaves/calendar", { params });
        return response.data;
    },
    create: async (payload) => {
        const response = await api.post("/requests", payload);
        return response.data;
    },
    updateStatus: async (id, status) => {
        const response = await api.patch(`/requests/${id}/status`, { status });
        return response.data;
    },
    uploadImage: async (file) => {
        const formData = new FormData();
        formData.append("file", file);
        const response = await api.post("/upload", formData, {
            headers: {
                "Content-Type": "multipart/form-data"
            }
        });
        return response.data;
    }
};
