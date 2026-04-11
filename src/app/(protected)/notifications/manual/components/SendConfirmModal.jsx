"use client";

import { X, Send, Clock, Users, Building2, UserCheck, AlertTriangle } from "lucide-react";

const SCOPE_LABELS = { ALL: "Tất cả nhân viên", DEPARTMENT: "Theo phòng ban", USERS: "Chọn người nhận" };
const SCOPE_ICONS = { ALL: Users, DEPARTMENT: Building2, USERS: UserCheck };

export function SendConfirmModal({ open, onClose, onConfirm, form, loading }) {
    if (!open) return null;
    const ScopeIcon = SCOPE_ICONS[form.recipientScope] || Users;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100">
                            <Send className="h-4 w-4 text-indigo-600" />
                        </div>
                        <h2 className="text-base font-semibold text-slate-800">
                            {form.scheduledAt ? "Xác nhận lên lịch gửi" : "Xác nhận gửi thông báo"}
                        </h2>
                    </div>
                    <button onClick={onClose} className="rounded-lg p-1.5 hover:bg-slate-100 transition-colors">
                        <X className="h-4 w-4 text-slate-500" />
                    </button>
                </div>

                {/* Body */}
                <div className="space-y-4 px-6 py-5">
                    <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 space-y-3">
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Tiêu đề</p>
                            <p className="text-sm font-semibold text-slate-800">{form.title}</p>
                        </div>
                        <div>
                            <p className="text-xs text-slate-400 mb-0.5">Nội dung</p>
                            <p className="text-sm text-slate-600 line-clamp-3">{form.message}</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <ScopeIcon className="h-4 w-4 text-slate-400" />
                            <span className="text-sm text-slate-600">{SCOPE_LABELS[form.recipientScope]}</span>
                            {form.recipientScope !== "ALL" && form.scopeIds.length > 0 && (
                                <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs text-indigo-700">
                                    {form.scopeIds.length} đã chọn
                                </span>
                            )}
                        </div>
                        {form.scheduledAt && (
                            <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-amber-500" />
                                <span className="text-sm text-amber-700">
                                    Gửi lúc: {new Date(form.scheduledAt).toLocaleString("vi-VN")}
                                </span>
                            </div>
                        )}
                    </div>

                    <div className="flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <AlertTriangle className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                        <p className="text-xs text-amber-700">
                            {form.scheduledAt
                                ? "Thông báo sẽ được gửi tự động vào đúng thời điểm đã chọn."
                                : "Thông báo sẽ được gửi ngay lập tức đến tất cả người nhận được chọn."}
                        </p>
                    </div>
                </div>

                {/* Footer */}
                <div className="flex justify-end gap-3 border-t border-slate-100 px-6 py-4">
                    <button
                        onClick={onClose}
                        disabled={loading}
                        className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:opacity-60 transition-all"
                    >
                        Hủy bỏ
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200
                            hover:bg-indigo-700 disabled:opacity-60 transition-all"
                    >
                        <Send className="h-4 w-4" />
                        {loading ? "Đang gửi..." : form.scheduledAt ? "Lên lịch" : "Xác nhận gửi"}
                    </button>
                </div>
            </div>
        </div>
    );
}
