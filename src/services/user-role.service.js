import api from "@/lib/api";

export const userRoleService = {
  delete: async (id) => {
    const response = await api.delete(`/users/${id}/user-roles`);
    return response.data;
  },
};
