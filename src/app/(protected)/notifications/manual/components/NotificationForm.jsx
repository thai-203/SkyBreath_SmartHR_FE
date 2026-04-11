"use client";

import { Send, Clock, AlertCircle } from "lucide-react";
import { RecipientSelector } from "./RecipientSelector";
import { RichTextEditor } from "@/components/common/RichTextEditor";

export function NotificationForm({ form, setForm, errors, loading, onSubmit }) {
    const handleChange = (field, val) => {
        setForm(prev => ({ ...prev, [field]: val }));
    };

    return (
        <form onSubmit={onSubmit} className="space-y-6">
            {/* Tiêu đề */}
            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    value={form.title}
                    onChange={e => handleChange("title", e.target.value)}
                    placeholder="Nhập tiêu đề thông báo..."
                    className={`w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-all
                        focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100
                        ${errors.title ? "border-red-400 bg-red-50" : "border-slate-200"}`}
                />
                {errors.title && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.title}
                    </p>
                )}
            </div>

            {/* Nội dung */}
            <div>
                <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Nội dung <span className="text-red-500">*</span>
                </label>
                <RichTextEditor
                    value={form.message}
                    onChange={val => handleChange("message", val)}
                    placeholder="Nhập nội dung thông báo..."
                    error={errors.message}
                />
                {errors.message && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.message}
                    </p>
                )}
            </div>

            {/* Phạm vi người nhận */}
            <div>
                <label className="mb-2 block text-sm font-semibold text-slate-700">
                    Phạm vi người nhận <span className="text-red-500">*</span>
                </label>
                <RecipientSelector
                    value={{ scope: form.recipientScope, scopeIds: form.scopeIds }}
                    onChange={({ scope, scopeIds }) => {
                        handleChange("recipientScope", scope);
                        handleChange("scopeIds", scopeIds);
                    }}
                />
                {errors.recipientScope && (
                    <p className="mt-1 flex items-center gap-1 text-xs text-red-500">
                        <AlertCircle className="h-3 w-3" /> {errors.recipientScope}
                    </p>
                )}
            </div>

            {/* Hẹn giờ */}
            <div>
                <label className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Clock className="h-4 w-4 text-slate-400" />
                    Hẹn giờ gửi
                    <span className="rounded-md bg-slate-100 px-2 py-0.5 text-xs font-normal text-slate-500">Tùy chọn</span>
                </label>
                <input
                    type="datetime-local"
                    value={form.scheduledAt || ""}
                    min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
                    onChange={e => handleChange("scheduledAt", e.target.value || null)}
                    className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition-all
                        focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                />
                <p className="mt-1 text-xs text-slate-400">
                    Để trống để gửi ngay lập tức. Nếu chọn thời điểm thì hệ thống sẽ lên lịch gửi.
                </p>
            </div>

            {/* Action */}
            <div className="flex justify-end gap-3 pt-2">
                <button
                    type="button"
                    onClick={() => setForm({ title: "", message: "", recipientScope: "ALL", scopeIds: [], scheduledAt: null })}
                    className="rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 hover:bg-slate-50 transition-all"
                >
                    Đặt lại
                </button>
                <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center gap-2 rounded-xl bg-indigo-600 px-6 py-2.5 text-sm font-semibold text-white shadow-md shadow-indigo-200
                        hover:bg-indigo-700 disabled:opacity-70 transition-all"
                >
                    <Send className="h-4 w-4" />
                    {loading ? "Đang xử lý..." : form.scheduledAt ? "Lên lịch gửi" : "Gửi ngay"}
                </button>
            </div>
        </form>
    );
}
