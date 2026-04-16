"use client";

import { useRef, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import { Bell, Check, CheckCheck, X, ExternalLink, Clock, Tag } from "lucide-react";
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
    try {
        const tmp = document.createElement("DIV");
        tmp.innerHTML = html;
        return tmp.textContent || tmp.innerText || "";
    } catch(e) {
        return html.replace(/<[^>]*>?/gm, '');
    }
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
        const handleOpenModal = (e) => {
            setSelectedNotification(e.detail);
        };
        
        document.addEventListener("mousedown", handleClickOutside);
        window.addEventListener("open-notification-modal", handleOpenModal);
        
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            window.removeEventListener("open-notification-modal", handleOpenModal);
        };
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
        // Luôn mở popup modal để đọc chi tiết đầy đủ
        setOpen(false);
        setSelectedNotification(notification);
    };

    const handleMarkAllRead = async () => {
        if (markAllAsRead) {
            await markAllAsRead();
        }
    };

    return (
        <>
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

        </div>

        {/* Modal chi tiết thông báo - render ra ngoài body bằng Portal */}
        {selectedNotification && typeof document !== 'undefined' && createPortal(
            <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/50 p-4" onClick={() => setSelectedNotification(null)}>
                <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl relative flex flex-col max-h-[85vh] animate-in zoom-in-95 fade-in duration-200" onClick={(e) => e.stopPropagation()}>
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 bg-gradient-to-r from-slate-50 to-blue-50/40 rounded-t-2xl shrink-0">
                        <div className="flex items-center gap-2">
                            <Bell className="w-4 h-4 text-blue-500" />
                            <h2 className="text-sm font-bold text-slate-800">Chi tiết thông báo</h2>
                        </div>
                        <button
                            onClick={() => setSelectedNotification(null)}
                            className="rounded-full p-1.5 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="px-5 py-4 overflow-y-auto flex-1">
                        <h3 className="mb-2 text-base font-bold text-slate-900 leading-snug">{selectedNotification.title}</h3>
                        
                        <div className="mb-4 flex flex-wrap items-center gap-1.5">
                            <span className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-600">
                                <Tag className="w-2.5 h-2.5" />
                                {selectedNotification.sourceType || selectedNotification.notificationType}
                            </span>
                            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-500">
                                <Clock className="w-2.5 h-2.5" />
                                {new Date(selectedNotification.createdAt).toLocaleString("vi-VN")}
                            </span>
                        </div>

                        <div className="border-t border-slate-100 pt-4">
                            <div 
                                className="text-[13px] leading-relaxed text-slate-700 max-w-none
                                    [&_p]:mb-2 [&_p]:leading-relaxed
                                    [&_strong]:font-semibold [&_strong]:text-slate-800
                                    [&_em]:italic [&_em]:text-slate-600
                                    [&_ul]:list-disc [&_ul]:ml-4 [&_ul]:mb-2
                                    [&_ol]:list-decimal [&_ol]:ml-4 [&_ol]:mb-2
                                    [&_li]:mb-0.5
                                    [&_a]:text-indigo-600 [&_a]:underline
                                    [&_h1]:text-sm [&_h1]:font-bold [&_h1]:mb-1
                                    [&_h2]:text-[13px] [&_h2]:font-bold [&_h2]:mb-1
                                    [&_h3]:text-[13px] [&_h3]:font-semibold [&_h3]:mb-1
                                    [&_blockquote]:border-l-2 [&_blockquote]:border-slate-200 [&_blockquote]:pl-3 [&_blockquote]:italic [&_blockquote]:text-slate-500"
                                dangerouslySetInnerHTML={{ __html: selectedNotification.message }}
                            />
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="border-t border-slate-100 px-5 py-3 flex items-center justify-end gap-2 bg-slate-50/50 rounded-b-2xl shrink-0">
                        {selectedNotification.link && (
                            <button
                                onClick={() => {
                                    setSelectedNotification(null);
                                    router.push(selectedNotification.link);
                                }}
                                className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition-colors shadow-sm"
                            >
                                <ExternalLink className="w-3.5 h-3.5" />
                                Đi tới trang liên quan
                            </button>
                        )}
                        <button
                            onClick={() => setSelectedNotification(null)}
                            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100 transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>,
            document.body
        )}
        </>
    );
}
