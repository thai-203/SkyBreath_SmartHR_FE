"use client";

import { X, Users, Building2, UserCheck, CheckCircle, Clock, XCircle, AlertTriangle } from "lucide-react";

const SOURCE_LABELS = {
    MANUAL: "Thủ công",
    WORKFLOW: "Phê duyệt",
    HOLIDAY: "Ngày lễ",
    PAYSLIP: "Phiếu lương",
    AI_RISK: "Cảnh báo AI",
};

const SOURCE_COLORS = {
    MANUAL: "bg-indigo-100 text-indigo-700",
    WORKFLOW: "bg-blue-100 text-blue-700",
    HOLIDAY: "bg-green-100 text-green-700",
    PAYSLIP: "bg-amber-100 text-amber-700",
    AI_RISK: "bg-red-100 text-red-700",
};

const STATUS_CONFIG = {
    SENT: { label: "Đã gửi", icon: CheckCircle, color: "text-green-600 bg-green-50" },
    SCHEDULED: { label: "Hẹn giờ", icon: Clock, color: "text-amber-600 bg-amber-50" },
    FAILED: { label: "Thất bại", icon: XCircle, color: "text-red-600 bg-red-50" },
    PENDING: { label: "Đang xử lý", icon: AlertTriangle, color: "text-slate-600 bg-slate-50" },
};

const DELIVERY_COLORS = {
    DELIVERED: "text-green-600",
    FAILED: "text-red-500",
    PENDING: "text-slate-400",
};

export function HistoryDetailModal({ open, onClose, record }) {
    if (!open || !record) return null;

    const statusCfg = STATUS_CONFIG[record.sendStatus] || STATUS_CONFIG.PENDING;
    const StatusIcon = statusCfg.icon;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="w-full max-w-2xl rounded-2xl bg-white shadow-2xl flex flex-col max-h-[90vh]">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4 flex-shrink-0">
                    <h2 className="text-base font-semibold text-slate-800">Chi tiết thông báo</h2>
                    <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
                        <X className="h-4 w-4 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
                    {/* Meta info */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Loại nguồn</p>
                            <span className={`inline-block rounded-full px-2.5 py-1 text-xs font-medium ${SOURCE_COLORS[record.sourceType] || "bg-slate-100 text-slate-600"}`}>
                                {SOURCE_LABELS[record.sourceType] || record.sourceType}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Trạng thái</p>
                            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${statusCfg.color}`}>
                                <StatusIcon className="h-3 w-3" />
                                {statusCfg.label}
                            </span>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Thời gian tạo</p>
                            <p className="text-sm text-slate-700">{new Date(record.createdAt).toLocaleString("vi-VN")}</p>
                        </div>
                        {record.scheduledAt && (
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Hẹn gửi lúc</p>
                                <p className="text-sm text-slate-700">{new Date(record.scheduledAt).toLocaleString("vi-VN")}</p>
                            </div>
                        )}
                        {record.sentAt && (
                            <div>
                                <p className="text-xs text-slate-400 mb-1">Đã gửi lúc</p>
                                <p className="text-sm text-slate-700">{new Date(record.sentAt).toLocaleString("vi-VN")}</p>
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Tiêu đề</p>
                            <p className="text-sm font-semibold text-slate-800">{record.title}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-1">Nội dung</p>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{record.message}</p>
                        </div>
                    </div>

                    {/* Recipients */}
                    <div>
                        <p className="mb-2 text-xs font-semibold text-slate-500 uppercase tracking-wide">
                            Người nhận ({record.recipients?.length || 0})
                        </p>
                        {record.recipients?.length > 0 ? (
                            <div className="max-h-56 overflow-y-auto space-y-1 rounded-xl border border-slate-100 p-2">
                                {record.recipients.map((r, idx) => (
                                    <div key={idx} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-slate-50">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-700">
                                            {r.username?.[0]?.toUpperCase() || "U"}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium text-slate-700 truncate">{r.username}</p>
                                            <p className="text-xs text-slate-400 truncate">{r.email}</p>
                                        </div>
                                        <div className="text-right flex-shrink-0">
                                            <p className={`text-xs font-medium ${DELIVERY_COLORS[r.deliveryStatus] || "text-slate-400"}`}>
                                                {r.deliveryStatus === "DELIVERED" ? "✓ Đã nhận" : r.deliveryStatus === "FAILED" ? "✗ Thất bại" : "Pending"}
                                            </p>
                                            {r.isRead && (
                                                <p className="text-xs text-slate-400">Đã đọc</p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-sm text-slate-400">Không có dữ liệu người nhận</p>
                        )}
                    </div>
                </div>

                <div className="border-t border-slate-100 px-6 py-4 flex-shrink-0">
                    <button onClick={onClose} className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all">
                        Đóng
                    </button>
                </div>
            </div>
        </div>
    );
}
