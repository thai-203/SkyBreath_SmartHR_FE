"use client";

import { createContext, useContext, useEffect, useRef, useState, useCallback } from "react";
import { io } from "socket.io-client";
import { authService } from "@/services/auth.service";
import { notificationsService } from "@/services/notifications.service";
import { toast } from "sonner";

const SocketContext = createContext(null);

export function useSocket() {
    return useContext(SocketContext);
}

export function SocketProvider({ children }) {
    const socketRef = useRef(null);
    const [connected, setConnected] = useState(false);
    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);

    // Lấy danh sách thông báo ban đầu từ API
    const fetchNotifications = useCallback(async () => {
        try {
            const res = await notificationsService.getMyNotifications({ page: 1, limit: 30 });
            setNotifications(res?.data?.items || []);
        } catch (err) {
            console.error("[Socket] Lỗi lấy thông báo:", err);
        }
    }, []);

    const fetchUnreadCount = useCallback(async () => {
        try {
            const res = await notificationsService.getUnreadCount();
            setUnreadCount(res?.data?.count || 0);
        } catch (err) {
            console.error("[Socket] Lỗi lấy unread count:", err);
        }
    }, []);

    // Kết nối socket
    useEffect(() => {
        const token = authService.getToken();
        if (!token) return;

        const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
        // Socket.io connect tới root domain, không phải API path
        const socketUrl = apiUrl.replace(/\/api\/v\d+$/, "");

        const socket = io(socketUrl, {
            auth: { token },
            transports: ["websocket", "polling"],
            reconnection: true,
            reconnectionAttempts: 5,
            reconnectionDelay: 2000,
        });

        socketRef.current = socket;

        socket.on("connect", () => {
            console.log("[Socket] Connected:", socket.id);
            setConnected(true);
            // Load thông báo ban đầu
            fetchNotifications();
            fetchUnreadCount();
        });

        socket.on("disconnect", (reason) => {
            console.log("[Socket] Disconnected:", reason);
            setConnected(false);
        });

        // Lắng nghe thông báo mới
        socket.on("NEW_NOTIFICATION", (data) => {
            console.log("[Socket] NEW_NOTIFICATION:", data);
            setNotifications((prev) => [data, ...prev]);
            setUnreadCount((prev) => prev + 1);

            // Hiển thị toast
            toast.info(data.title, {
                description: data.message,
                duration: 5000,
            });

            // Dispatch custom event cho các trang lắng nghe
            window.dispatchEvent(
                new CustomEvent("socket:new-notification", { detail: data })
            );
        });

        // Lắng nghe REMOVE_PENDING_REQUEST
        socket.on("REMOVE_PENDING_REQUEST", (data) => {
            console.log("[Socket] REMOVE_PENDING_REQUEST:", data);
            window.dispatchEvent(
                new CustomEvent("socket:remove-pending-request", { detail: data })
            );
        });

        socket.on("connect_error", (err) => {
            console.warn("[Socket] Connection error:", err.message);
        });

        return () => {
            socket.disconnect();
            socketRef.current = null;
        };
    }, []);

    // Đánh dấu đã đọc
    const markAsRead = useCallback(async (notificationId) => {
        try {
            await notificationsService.markAsRead(notificationId);
            setNotifications((prev) =>
                prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
            );
            setUnreadCount((prev) => Math.max(0, prev - 1));
        } catch (err) {
            console.error("[Socket] Lỗi đánh dấu đã đọc:", err);
        }
    }, []);

    // Đánh dấu tất cả đã đọc
    const markAllAsRead = useCallback(async () => {
        try {
            await notificationsService.markAllAsRead();
            setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
            setUnreadCount(0);
        } catch (err) {
            console.error("[Socket] Lỗi đánh dấu tất cả:", err);
        }
    }, []);

    const value = {
        socket: socketRef.current,
        connected,
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        fetchNotifications,
        fetchUnreadCount,
    };

    return (
        <SocketContext.Provider value={value}>
            {children}
        </SocketContext.Provider>
    );
}
