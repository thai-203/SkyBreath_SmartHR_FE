import api from "@/lib/api";

// ==========================================
// JWT Decode Helper
// ==========================================
const decodeToken = (token) => {
  try {
    if (!token) return null;
    const parts = token.split(".");
    if (parts.length !== 3) return null;

    const decoded = JSON.parse(
      atob(parts[1].replace(/-/g, "+").replace(/_/g, "/"))
    );
    return decoded;
  } catch (error) {
    console.error("Failed to decode token:", error);
    return null;
  }
};

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

  resetPasswordWithOtp: async (otpRequestId, otp, newPassword) => {
    const response = await api.post(
      "/auth/reset-password-otp",
      {
        otpRequestId,
        otp,
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

  // ==========================================
  // Get decoded token payload
  // ==========================================
  getDecodedToken: () => {
    const token = authService.getToken();
    return decodeToken(token);
  },

  // ==========================================
  // Role & Permission checks (from JWT token)
  // ==========================================
  hasRole: (role) => {
    const token = authService.getToken();
    const decoded = decodeToken(token);
    const roles = decoded?.roles || [];
    return roles.some((r) => r.toUpperCase() === role.toUpperCase());
  },

  hasAnyRole: (roles) => {
    const token = authService.getToken();
    const decoded = decodeToken(token);
    const userRoles = decoded?.roles || [];
    return roles.some((role) =>
      userRoles.some((r) => r.toUpperCase() === role.toUpperCase()),
    );
  },

  hasPermission: (permissionCode) => {
    const token = authService.getToken();
    const decoded = decodeToken(token);
    const permissions = decoded?.permissions || [];
    return permissions.includes(permissionCode);
  },

  hasAnyPermission: (permissionCodes) => {
    const token = authService.getToken();
    const decoded = decodeToken(token);
    const permissions = decoded?.permissions || [];
    return permissionCodes.some((code) => permissions.includes(code));
  },

  getCurrentEmployeeByUserId: async () => {
    const user = JSON.parse(localStorage.getItem("user"));
    const userId = user?.id;
    const response = await api.get(`/employees/user/${userId}`);
    return response.data.data;
  },

  getProfile: async () => {
    const response = await api.get("/auth/profile");
    if (response.data && response.data.success) {
      localStorage.setItem("user", JSON.stringify(response.data.data));
    }
    return response.data.data;
  },
};
