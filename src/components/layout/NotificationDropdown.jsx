"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, Filter, X } from "lucide-react";
import { useSocket } from "../providers/SocketProvider";
import { cn } from "@/lib/utils";

function timeAgo(dateStr) {
    if (!dateStr) return "";
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now - date;
    const diffMin = Math.floor(diffMs / 60000);
    if (diffMin < 1) return "Vừa xong";
    if (diffMin < 60) return `${diffMin} phút trước`;
    const diffHour = Math.floor(diffMin / 60);
    if (diffHour < 24) return `${diffHour} giờ trước`;
    const diffDay = Math.floor(diffHour / 24);
    if (diffDay < 7) return `${diffDay} ngày trước`;
    return date.toLocaleDateString("vi-VN");
}

const FILTER_OPTIONS = [
    { id: "all", label: "Tất cả" },
    { id: "unread", label: "Chưa đọc" },
    { id: "read", label: "Đã đọc" },
];

export default function NotificationDropdown() {
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead, fetchNotifications } = useSocket() || {};
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState("all");
    const dropdownRef = useRef(null);

    // Đóng dropdown khi click bên ngoài
    useEffect(() => {
        const handleClickOutside = (e) => {
            if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
                setOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // Lọc thông báo
    const filteredNotifications = (notifications || []).filter((n) => {
        if (filter === "unread") return !n.isRead;
        if (filter === "read") return n.isRead;
        return true;
    });

    const handleClickNotification = async (notification) => {
        // Đánh dấu đã đọc
        if (!notification.isRead && markAsRead) {
            await markAsRead(notification.id);
        }
        // Chuyển hướng
        if (notification.link) {
            router.push(notification.link);
        }
        setOpen(false);
    };

    const handleMarkAllRead = async () => {
        if (markAllAsRead) {
            await markAllAsRead();
        }
    };

    return (
        <div className="relative" ref={dropdownRef}>
            {/* Bell button */}
            <button
                onClick={() => setOpen(!open)}
                className="relative p-2 rounded-lg hover:bg-slate-100 transition-colors"
                title="Thông báo"
            >
                <Bell className="h-5 w-5 text-slate-500" />
                {(unreadCount || 0) > 0 && (
                    <span className="absolute -right-0.5 -top-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-[10px] text-white font-bold shadow-sm animate-in zoom-in-50 duration-200">
                        {unreadCount > 99 ? "99+" : unreadCount}
                    </span>
                )}
            </button>

            {/* Dropdown panel */}
            {open && (
                <div className="absolute right-0 top-full mt-2 w-[400px] max-h-[520px] rounded-xl bg-white border border-slate-200 shadow-2xl z-50 flex flex-col overflow-hidden animate-in slide-in-from-top-2 fade-in duration-200">
                    {/* Header */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/50">
                        <h3 className="text-sm font-bold text-slate-800">Thông báo</h3>
                        <div className="flex items-center gap-1">
                            {(unreadCount || 0) > 0 && (
                                <button
                                    onClick={handleMarkAllRead}
                                    className="flex items-center gap-1 px-2 py-1 text-[11px] font-medium text-blue-600 hover:bg-blue-50 rounded-md transition-colors"
                                    title="Đánh dấu tất cả đã đọc"
                                >
                                    <CheckCheck className="w-3.5 h-3.5" />
                                    Đọc tất cả
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Filter tabs */}
                    <div className="flex gap-1 px-3 py-2 border-b border-slate-100 bg-slate-50/50">
                        {FILTER_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setFilter(opt.id)}
                                className={cn(
                                    "px-2.5 py-1 text-[11px] font-medium rounded-md transition-all",
                                    filter === opt.id
                                        ? "bg-white text-blue-600 shadow-sm border border-slate-200"
                                        : "text-slate-500 hover:text-slate-700 hover:bg-slate-100"
                                )}
                            >
                                {opt.label}
                                {opt.id === "unread" && (unreadCount || 0) > 0 && (
                                    <span className="ml-1 text-[10px] bg-red-100 text-red-600 px-1 rounded-full font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        ))}
                    </div>

                    {/* Notification list */}
                    <div className="flex-1 overflow-y-auto">
                        {filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
                                <Bell className="w-10 h-10 mb-2 opacity-30" />
                                <p className="text-sm">
                                    {filter === "unread"
                                        ? "Không có thông báo chưa đọc"
                                        : "Chưa có thông báo nào"}
                                </p>
                            </div>
                        ) : (
                            filteredNotifications.map((n) => (
                                <button
                                    key={n.id || n.recipientId}
                                    onClick={() => handleClickNotification(n)}
                                    className={cn(
                                        "w-full flex items-start gap-3 px-4 py-3 text-left hover:bg-slate-50 transition-colors border-b border-slate-50 last:border-0",
                                        !n.isRead && "bg-blue-50/40"
                                    )}
                                >
                                    {/* Unread dot */}
                                    <div className="pt-1.5 shrink-0">
                                        <div
                                            className={cn(
                                                "w-2 h-2 rounded-full",
                                                !n.isRead ? "bg-blue-500" : "bg-transparent"
                                            )}
                                        />
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "text-[13px] leading-snug",
                                            !n.isRead ? "font-semibold text-slate-800" : "font-medium text-slate-600"
                                        )}>
                                            {n.title}
                                        </p>
                                        <p className="text-[12px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">
                                            {n.message}
                                        </p>
                                        <p className="text-[11px] text-slate-400 mt-1">
                                            {timeAgo(n.createdAt)}
                                        </p>
                                    </div>

                                    {/* Read indicator */}
                                    {n.isRead && (
                                        <div className="pt-1 shrink-0">
                                            <Check className="w-3.5 h-3.5 text-slate-300" />
                                        </div>
                                    )}
                                </button>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
