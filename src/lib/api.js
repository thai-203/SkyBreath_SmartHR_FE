import axios from "axios";
import { toast } from "sonner";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1",
  headers: {
    Accept: "application/json",
  },
  withCredentials: true,
});

// Request interceptor to attach JWT token
api.interceptors.request.use(
  (config) => {
    const token =
      typeof window !== "undefined" ? localStorage.getItem("token") : null;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
  failedQueue.forEach((prom) => {
    if (error) prom.reject(error);
    else prom.resolve(token);
  });
  failedQueue = [];
};

const handleForceLogout = (message) => {
  if (typeof window !== "undefined") {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    toast.error(message, {
      duration: 3000,
      onAutoClose: () => (window.location.href = "/login"),
      onDismiss: () => (window.location.href = "/login"),
    });
  }
  return new Promise(() => {});
};

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    const status = error.response?.status;
    const errorCode = error.response?.data?.errorCode;

    if (!error.response) {
      return Promise.reject(error);
    }

    // 403 — dù là admin đổi quyền hay user xấu đều force logout
    if (status === 403 || errorCode === "PERMISSION_DENIED") {
      return handleForceLogout(
        "Phiên làm việc không hợp lệ, vui lòng đăng nhập lại",
      );
    }

    if (!originalRequest?.skipAuthRedirect) {
      if (status === 401 && originalRequest.url.includes("auth/refresh")) {
        return handleForceLogout(
          "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
        );
      }
      if (status === 401 && !originalRequest._retry) {
        originalRequest._retry = true;

        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({
              resolve: (token) => {
                originalRequest.headers.Authorization = `Bearer ${token}`;
                resolve(api(originalRequest));
              },
              reject,
            });
          });
        }

        isRefreshing = true;

        try {
          const { authService } = await import("@/services/auth.service");
          const res = await authService.refreshToken();

          // Bulletproof extraction: check all possible locations for the token string
          let newAccessToken = null;
          if (typeof res === "string") {
            newAccessToken = res;
          } else if (res && typeof res.data === "string") {
            newAccessToken = res.data;
          } else if (
            res &&
            res.data &&
            typeof res.data.accessToken === "string"
          ) {
            newAccessToken = res.data.accessToken;
          } else if (res && typeof res.accessToken === "string") {
            newAccessToken = res.accessToken;
          }

          if (!newAccessToken) {
            throw new Error("Không thể lấy mã truy cập mới");
          }

          localStorage.setItem("token", newAccessToken);
          originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
          processQueue(null, newAccessToken);
          return api(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);
          return handleForceLogout(
            "Phiên đăng nhập đã hết hạn, vui lòng đăng nhập lại",
          );
        } finally {
          isRefreshing = false;
        }
      }
    }
    return Promise.reject(error);
  },
);
export default api;
