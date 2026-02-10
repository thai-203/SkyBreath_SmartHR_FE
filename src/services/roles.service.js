import api from '@/lib/api';

export const RoleService = {
    async getRoles() {
        const response = await api.get('/roles');
        return response.data;
    },

    async createRole(data) {
        const response = await api.post('/roles', data);
        return response.data;
    },

    async updateRole(id, data) {
        const response = await api.put(`/roles/${id}`, data);
        return response.data;
    },

    async deleteRole(id) {
        const response = await api.delete(`/roles/${id}`);
        return response.data;
    },

    async getPermissions(id) {
        const response = await api.get(`/roles/${id}/permissions`);
        return response.data;
    },

    async assignPermissions(id, permissionIds) {
        const response = await api.post(`/roles/${id}/permissions`, { permissionIds });
        return response.data;
    },
};

export const PermissionService = {
    async getPermissions() {
        const response = await api.get('/permissions');
        return response.data;
    }
};
