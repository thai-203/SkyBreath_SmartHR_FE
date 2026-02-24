import api from "@/lib/api";

export const holidayService = {
    async findAll(params) {
        const response = await api.get('/holiday-list', { params });
        return response.data;
    },

    async findById(id) {
        const response = await api.get(`/holiday-list/${id}`);
        return response.data;
    },

    async create(data) {
        const response = await api.post('/holiday-list', data);
        return response.data;
    },

    async update(id, data) {
        const response = await api.put(`/holiday-list/${id}`, data);
        return response.data;
    },

    async delete(id) {
        const response = await api.delete(`/holiday-list/${id}`);
        return response.data;
    },

    async export(params) {
        const response = await api.get('/holiday-list/export', {
            params,
            responseType: 'blob',
        });
        return response.data;
    },
};
