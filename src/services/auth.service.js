import api from "@/lib/api";

export const authService = {
  login: async (email, password) => {
    const response = await api.post(
      "/auth/login",
      { email, password },
      { skipAuthRedirect: true },
    );
    return response.data;
  },

  logout: async () => {
    await api.post("/auth/logout");
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  },

  forgotPassword: async (email) => {
    const response = await api.post(
      "/auth/forgot-password",
      { email },
      { skipAuthRedirect: true },
    );
    return response.data;
  },

  resetPassword: async (token, newPassword) => {
    const response = await api.post(
      "/auth/reset-password",
      {
        token,
        newPassword,
      },
      { skipAuthRedirect: true },
    );
    return response.data;
  },

  changePassword: async (currentPassword, newPassword) => {
    const response = await api.post("auth/change-password", {
      currentPassword,
      newPassword,
    });
    return response.data;
  },

  refreshToken: async () => {
    const response = await api.post("auth/refresh");
    console.log(response);

    return response.data;
  },

  getCurrentUser: () => {
    const user = localStorage.getItem("user");
    return user ? JSON.parse(user) : null;
  },

  getToken: () => {
    return localStorage.getItem("token");
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("token");
  },

  hasRole: (role) => {
    const user = authService.getCurrentUser();
    const userRoles = user?.roles || [];
    return userRoles.some((r) => r.toUpperCase() === role.toUpperCase());
  },

  hasAnyRole: (roles) => {
    const user = authService.getCurrentUser();
    const userRoles = user?.roles || [];
    return roles.some((role) =>
      userRoles.some((r) => r.toUpperCase() === role.toUpperCase()),
    );
  },

  hasPermission: (permissionCode) => {
    const user = authService.getCurrentUser();
    const permissions = user?.permissions || [];
    return permissions.includes(permissionCode);
  },

  hasAnyPermission: (permissionCodes) => {
    const user = authService.getCurrentUser();
    const permissions = user?.permissions || [];
    return permissionCodes.some((code) => permissions.includes(code));
  },

  getCurrentEmployeeByUserId: async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;
    const response = await api.get(`/employees/user/${userId}`);
    return response.data;
  },
};
