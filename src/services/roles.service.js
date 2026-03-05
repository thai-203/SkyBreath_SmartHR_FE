import api from '@/lib/api';

export const RoleService = {
    async getRoles(search = '') {
        const response = await api.get('/roles', { params: { search } });
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
    async getPermissions(params = {}) {
        // params can include search, module, page, limit
        const response = await api.get('/permissions', { params });
        return response.data;
    },

    async createPermission(data) {
        const response = await api.post('/permissions', data);
        return response.data;
    },

    async updatePermission(id, data) {
        const response = await api.put(`/permissions/${id}`, data);
        return response.data;
    },

    async deletePermission(id) {
        const response = await api.delete(`/permissions/${id}`);
        return response.data;
    },
};
