"use client";

import { CheckCircle, Clock, XCircle, AlertTriangle, Users, ChevronRight } from "lucide-react";

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
    SENT: { label: "Đã gửi", icon: CheckCircle, color: "text-green-600 bg-green-50 border-green-200" },
    SCHEDULED: { label: "Hẹn giờ", icon: Clock, color: "text-amber-700 bg-amber-50 border-amber-200" },
    FAILED: { label: "Thất bại", icon: XCircle, color: "text-red-600 bg-red-50 border-red-200" },
    PENDING: { label: "Đang xử lý", icon: AlertTriangle, color: "text-slate-600 bg-slate-50 border-slate-200" },
};

export function HistoryTable({ items, loading, onRowClick }) {
    if (loading) {
        return (
            <div className="space-y-2 p-2">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-100" />
                ))}
            </div>
        );
    }

    if (!items.length) {
        return (
            <div className="flex flex-col items-center justify-center py-16 text-slate-400">
                <AlertTriangle className="h-10 w-10 mb-3 opacity-30" />
                <p className="text-sm">Chưa có lịch sử thông báo</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full text-sm">
                <thead>
                    <tr className="border-b border-slate-100">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Tiêu đề</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Loại</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Trạng thái</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Người nhận</th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-slate-400 uppercase tracking-wide">Thời gian</th>
                        <th className="px-4 py-3" />
                    </tr>
                </thead>
                <tbody>
                    {items.map(row => {
                        const statusCfg = STATUS_CONFIG[row.sendStatus] || STATUS_CONFIG.PENDING;
                        const StatusIcon = statusCfg.icon;

                        return (
                            <tr
                                key={row.id}
                                onClick={() => onRowClick(row)}
                                className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                            >
                                <td className="px-4 py-3.5">
                                    <p className="font-medium text-slate-800 truncate max-w-[220px]">{row.title}</p>
                                    <p className="text-xs text-slate-400 truncate max-w-[220px]">{row.message}</p>
                                </td>
                                <td className="px-4 py-3.5">
                                    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${SOURCE_COLORS[row.sourceType] || "bg-slate-100 text-slate-600"}`}>
                                        {SOURCE_LABELS[row.sourceType] || row.sourceType}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium ${statusCfg.color}`}>
                                        <StatusIcon className="h-3 w-3" />
                                        {statusCfg.label}
                                    </span>
                                </td>
                                <td className="px-4 py-3.5">
                                    <div className="flex items-center gap-1.5 text-slate-600">
                                        <Users className="h-3.5 w-3.5 text-slate-400" />
                                        <span>{row.recipientCount} người</span>
                                    </div>
                                </td>
                                <td className="px-4 py-3.5 text-xs text-slate-500">
                                    {new Date(row.createdAt).toLocaleString("vi-VN")}
                                </td>
                                <td className="px-4 py-3.5 text-slate-300">
                                    <ChevronRight className="h-4 w-4" />
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </div>
    );
}
