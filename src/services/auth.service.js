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
};
