"use client";

import { useRef, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, X } from "lucide-react";
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

function stripHtml(html) {
    if (!html) return "";
    return html.replace(/<[^>]*>?/gm, '');
}

const FILTER_OPTIONS = [
    { id: "all", label: "Tất cả" },
    { id: "unread", label: "Chưa đọc" },
    { id: "read", label: "Đã đọc" },
];

export default function NotificationDropdown() {
    const router = useRouter();
    const { notifications, unreadCount, markAsRead, markAllAsRead } = useSocket() || {};
    const [open, setOpen] = useState(false);
    const [filter, setFilter] = useState("all");
    const dropdownRef = useRef(null);
    const [selectedNotification, setSelectedNotification] = useState(null);

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
        // Hành động
        setOpen(false);
        if (notification.link) {
            router.push(notification.link);
        } else {
            // Không có link thì mở modal để đọc chi tiết (vd thông báo thủ công)
            setSelectedNotification(notification);
        }
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
                                            {stripHtml(n.message)}
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

            {/* Modal hiển thị chi tiết Thông báo thủ công (không có link) */}
            {selectedNotification && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4">
                    <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl relative flex flex-col max-h-[90vh]">
                        <div className="flex items-center justify-between border-b px-6 py-4">
                            <h2 className="text-lg font-bold text-slate-800">Chi tiết thông báo</h2>
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="p-6 overflow-y-auto">
                            <h3 className="mb-2 text-xl font-bold text-slate-900">{selectedNotification.title}</h3>
                            <div className="mb-6 flex items-center gap-2 text-sm text-slate-500">
                                <span className="rounded bg-indigo-50 px-2 py-0.5 text-xs font-semibold text-indigo-600">
                                    {selectedNotification.notificationType}
                                </span>
                                <span>•</span>
                                <span>{new Date(selectedNotification.createdAt).toLocaleString("vi-VN")}</span>
                            </div>
                            <div 
                                className="prose prose-sm prose-slate max-w-none 
                                    [&_ul]:list-disc [&_ul]:ml-4 [&_ol]:list-decimal [&_ol]:ml-4 
                                    [&_a]:text-indigo-600 [&_a]:underline"
                                dangerouslySetInnerHTML={{ __html: selectedNotification.message }}
                            />
                        </div>
                        <div className="border-t px-6 py-4 text-right">
                            <button
                                onClick={() => setSelectedNotification(null)}
                                className="rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 transition-colors"
                            >
                                Đóng
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
