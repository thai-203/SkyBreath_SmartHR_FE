import api from "@/lib/api";

export const userService = {
  // ===== Current User Profile =====
  /**
   * Get current user profile
   */
  getProfile: async () => {
    const response = await api.get("/auth/profile");
    return response.data?.data || response.data;
  },

  /**
   * Update user profile
   * @param {Object} data - Profile data (name, phone, address, etc.)
   */
  updateProfile: async (data) => {
    const response = await api.put("/auth/profile", data);
    return response.data;
  },

  /**
   * Upload avatar
   * @param {File} file - Avatar file
   */
  uploadAvatar: async (file) => {
    const formData = new FormData();
    formData.append("avatar", file);
    const response = await api.post("/users/profile/avatar", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Update avatar and profile together
   * @param {Object} data - Profile data with avatar file
   */
  updateProfileWithAvatar: async (data) => {
    const formData = new FormData();

    // Add avatar if provided
    if (data.avatar && data.avatar instanceof File) {
      formData.append("avatar", data.avatar);
    }

    // Add other fields
    Object.keys(data).forEach((key) => {
      if (key !== "avatar" && data[key] !== undefined && data[key] !== null) {
        formData.append(key, data[key]);
      }
    });

    const response = await api.put("/auth/profile", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  // ===== User Management (Admin) =====
  /**
   * Get all users with pagination, search, and filters
   * @param {Object} params - Query parameters (page, limit, search, role, status, etc.)
   */
  getAll: async (params = {}) => {
    const response = await api.get("/users", { params });
    return response.data;
  },

  /**
   * Get list of all users
   */
  getList: async () => {
    const response = await api.get("/users/list");
    return response.data;
  },

  /**
   * Get user metadata (roles, status options, etc.)
   */
  getMetadata: async () => {
    const response = await api.get("/users/meta-data");
    return response.data;
  },

  /**
   * Get user by ID
   * @param {string} id - User ID
   */
  getById: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Create new user
   * @param {Object} data - User data (username, email, fullName, role, status, etc.)
   */
  create: async (data) => {
    const response = await api.post("/users", data);
    return response.data;
  },

  /**
   * Update user
   * @param {string} id - User ID
   * @param {Object} data - Updated user data
   */
  update: async (id, data) => {
    console.log("Updating user with ID:", id, "and data:", data);
    const response = await api.put(`/users/${id}`, data);
    return response.data;
  },

  /**
   * Delete user
   * @param {string} id - User ID
   */
  delete: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  },

  /**
   * Get validation data (used usernames, emails, etc.)
   */
  getValidationData: async () => {
    const response = await api.get("/users/validation-data");
    return response.data;
  },

  /**
   * Reset user password (send reset link via email)
   * @param {string} id - User ID
   */
  resetPassword: async (id) => {
    const response = await api.post(`/users/${id}/reset-password`);
    return response.data;
  },

  /**
   * Send invite email to user
   * @param {string} id - User ID
   */
  sendInvite: async (id) => {
    const response = await api.post(`/users/${id}/send-invite`);
    return response.data;
  },

  /**
   * Change user status
   * @param {string} id - User ID
   * @param {string} status - New status (ACTIVE, INACTIVE, etc.)
   */
  changeStatus: async (id, status) => {
    const response = await api.patch(`/users/${id}/status`, { status });
    return response.data;
  },

  /**
   * Export users list to Excel
   */
  exportExcel: async () => {
    const response = await api.get("/users/export", {
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Lock user account
   * @param {string} id - User ID
   */
  lockAccount: async (id) => {
    const response = await api.patch(`/users/${id}/lock`);
    return response.data;
  },

  /**
   * Unlock user account
   * @param {string} id - User ID
   */
  unlockAccount: async (id) => {
    const response = await api.patch(`/users/${id}/unlock`);
    return response.data;
  },
};
