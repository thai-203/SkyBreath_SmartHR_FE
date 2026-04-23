"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";

const fmt = (n) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(parseFloat(n || 0)));

export default function PayrollDetailEditModal({ isOpen, onClose, onSubmit, loading, detail }) {
    // Các trường có thể chỉnh sửa: Thưởng, Khấu trừ, Phạt, Ghi chú
    const [form, setForm] = useState({
        bonus: parseFloat(detail?.bonus || 0),
        deduction: parseFloat(detail?.deduction || 0),
        penalty: parseFloat(detail?.penalty || 0),
        note: detail?.note || "",
    });

    if (!isOpen || !detail) return null;

    // Preview lương NET (chỉ thay đổi khi thưởng/khấu trừ/phạt thay đổi)
    const netPreview = Math.round((() => {
        // Lương đã tính sẵn từ backend
        const p1ThựcNhận = parseFloat(detail.p1Amount || 0);
        const p21ThựcNhận = parseFloat(detail.p21Amount || 0);
        const p22ThựcNhận = parseFloat(detail.p22Amount || 0);
        const pTVThựcNhận = parseFloat(detail.probationAmount || 0);

        const totalInc = p1ThựcNhận + p21ThựcNhận + p22ThựcNhận + pTVThựcNhận +
                        parseFloat(detail.overtimePay || 0) +
                        parseFloat(detail.allowanceAmount || 0) +
                        form.bonus +
                        (parseFloat(detail.adjustmentTaxable || 0) + parseFloat(detail.adjustmentNonTaxable || 0) + parseFloat(detail.otherIncomeNonTaxable || 0));

        const bhxh = parseFloat(detail.insuranceDeduction || 0);
        const tax = parseFloat(detail.taxDeduction || 0) + parseFloat(detail.taxAdjustment || 0);

        return totalInc - bhxh - tax - form.deduction - form.penalty;
    })());

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(detail.id, form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Chỉnh sửa lương</h2>
                        <p className="text-xs text-slate-500 mt-0.5">{detail.employee?.fullName} ({detail.employee?.employeeCode})</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {/* Read-only fields */}
                    <div className="grid grid-cols-2 gap-3 bg-slate-50 rounded-xl p-4 text-sm">
                        <div>
                            <p className="text-slate-500 text-xs">Ngày công</p>
                            <p className="font-semibold text-slate-800">{detail.workingDays} ngày</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Lương cơ bản</p>
                            <p className="font-semibold text-slate-800">{fmt(detail.baseSalary)} ₫</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Phụ cấp OT</p>
                            <p className="font-semibold text-slate-800">{fmt(detail.overtimePay)} ₫</p>
                        </div>
                        <div>
                            <p className="text-slate-500 text-xs">Bảo hiểm + Thuế</p>
                            <p className="font-semibold text-red-600">-{fmt(parseFloat(detail.insuranceDeduction || 0) + parseFloat(detail.taxDeduction || 0))} ₫</p>
                        </div>
                    </div>

                    {/* Thông tin P2 (chỉ đọc - được tính từ performance_reviews) */}
                    <div className="bg-indigo-50 rounded-xl p-4 text-sm">
                        <p className="text-xs text-indigo-500 mb-2">Thông tin hiệu suất (từ đánh giá năng lực)</p>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <p className="text-slate-500 text-xs">% P2.1</p>
                                <p className="font-bold text-indigo-700">{detail.p1p2Percentage?.toFixed(1) || 0}%</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs">% P2.2</p>
                                <p className="font-bold text-indigo-700">{detail.p3Percentage?.toFixed(1) || 0}%</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs">P2.1 thực</p>
                                <p className="font-bold text-indigo-700">{fmt(detail.p21Amount || 0)}</p>
                            </div>
                            <div>
                                <p className="text-slate-500 text-xs">P2.2 thực</p>
                                <p className="font-bold text-indigo-700">{fmt(detail.p22Amount || 0)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { key: "bonus", label: "Thưởng (₫)", color: "text-emerald-600" },
                            { key: "deduction", label: "Khấu trừ (₫)", color: "text-red-600" },
                            { key: "penalty", label: "Phạt (₫)", color: "text-red-600" },
                        ].map(({ key, label, color }) => (
                            <div key={key}>
                                <label className={`block text-xs font-medium mb-1 ${color}`}>{label}</label>
                                <input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: parseFloat(e.target.value) || 0 })}
                                    className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                                />
                            </div>
                        ))}
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-slate-600 mb-1">Ghi chú</label>
                        <textarea
                            value={form.note}
                            onChange={(e) => setForm({ ...form, note: e.target.value })}
                            rows={2}
                            placeholder="Nhập ghi chú (nếu có)..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>

                    {/* Net preview */}
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-4 py-3">
                        <div className="flex justify-between items-center">
                            <span className="text-sm font-semibold text-emerald-800">Dự kiến thực nhận:</span>
                            <span className="text-lg font-bold text-emerald-700">{fmt(netPreview)} ₫</span>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">Hủy</Button>
                        <Button type="submit" loading={loading} className="flex-1">Lưu thay đổi</Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
