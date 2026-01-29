import api from "@/lib/api";

export const authService = {
    login: async (email, password) => {
        const response = await api.post("/auth/login", { email, password });
        return response.data;
    },

    logout: () => {
        localStorage.removeItem("token");
        localStorage.removeItem("user");
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
