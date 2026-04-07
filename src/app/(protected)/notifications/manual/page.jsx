"use client";

import { useState } from "react";
import { Bell, Send, CheckCircle, AlertCircle } from "lucide-react";
import { notificationsService } from "@/services/notifications.service";
import { NotificationForm } from "./components/NotificationForm";
import { SendConfirmModal } from "./components/SendConfirmModal";

const INITIAL_FORM = {
    title: "",
    message: "",
    recipientScope: "ALL",
    scopeIds: [],
    scheduledAt: null,
};

export default function ManualNotificationPage() {
    const [form, setForm] = useState(INITIAL_FORM);
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [result, setResult] = useState(null); // { type: 'success'|'error', message }

    const validate = () => {
        const e = {};
        if (!form.title.trim()) e.title = "Vui lòng nhập tiêu đề";
        if (!form.message.trim()) e.message = "Vui lòng nhập nội dung";
        if (form.recipientScope !== "ALL" && form.scopeIds.length === 0) {
            e.recipientScope = "Vui lòng chọn ít nhất một đối tượng nhận";
        }
        if (form.scheduledAt && new Date(form.scheduledAt) <= new Date()) {
            e.scheduledAt = "Thời điểm hẹn giờ phải sau thời điểm hiện tại";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validate()) return;
        setConfirmOpen(true);
    };

    const handleConfirm = async () => {
        setLoading(true);
        try {
            const payload = {
                title: form.title.trim(),
                message: form.message.trim(),
                recipientScope: form.recipientScope,
                scopeIds: form.scopeIds,
                scheduledAt: form.scheduledAt || null,
            };
            const res = await notificationsService.sendManualNotification(payload);
            setResult({ type: "success", message: res.message });
            setForm(INITIAL_FORM);
            setErrors({});
            setConfirmOpen(false);
        } catch (err) {
            setResult({
                type: "error",
                message: err?.response?.data?.message || "Gửi thông báo thất bại. Vui lòng thử lại.",
            });
            setConfirmOpen(false);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
                            <Bell className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Gửi thông báo thủ công</h1>
                            <p className="text-slate-500">Tạo và gửi thông báo nội bộ đến nhân viên</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Result banner */}
            {result && (
                <div className={`flex items-start gap-3 rounded-xl px-4 py-3 text-sm
                    ${result.type === "success"
                        ? "bg-green-50 border border-green-200 text-green-800"
                        : "bg-red-50 border border-red-200 text-red-800"}`}
                >
                    {result.type === "success"
                        ? <CheckCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-green-600" />
                        : <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0 text-red-500" />}
                    <p>{result.message}</p>
                    <button onClick={() => setResult(null)} className="ml-auto text-xs opacity-60 hover:opacity-100">✕</button>
                </div>
            )}

            {/* Form card */}
            <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-100">
                <NotificationForm
                    form={form}
                    setForm={setForm}
                    errors={errors}
                    loading={loading}
                    onSubmit={handleSubmit}
                />
            </div>

            {/* Confirm modal */}
            <SendConfirmModal
                open={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirm}
                form={form}
                loading={loading}
            />
        </div>
    );
}
