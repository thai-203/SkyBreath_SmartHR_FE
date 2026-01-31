import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const RoleService = {
    async getRoles() {
        const response = await axios.get(`${API_URL}/roles`, {
            withCredentials: true,
        });
        return response.data;
    },

    async createRole(data) {
        const response = await axios.post(`${API_URL}/roles`, data, {
            withCredentials: true,
        });
        return response.data;
    },

    async updateRole(id, data) {
        const response = await axios.put(`${API_URL}/roles/${id}`, data, {
            withCredentials: true,
        });
        return response.data;
    },

    async deleteRole(id) {
        const response = await axios.delete(`${API_URL}/roles/${id}`, {
            withCredentials: true,
        });
        return response.data;
    },

    async getPermissions(id) {
        const response = await axios.get(`${API_URL}/roles/${id}/permissions`, {
            withCredentials: true,
        });
        return response.data;
    },

    async assignPermissions(id, permissionIds) {
        const response = await axios.post(`${API_URL}/roles/${id}/permissions`, { permissionIds }, {
            withCredentials: true,
        });
        return response.data;
    },
};

export const PermissionService = {
    async getPermissions() {
        const response = await axios.get(`${API_URL}/permissions`, {
            withCredentials: true,
        });
        return response.data;
    }
};
