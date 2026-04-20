"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";

const fmt = (n) =>
    new Intl.NumberFormat("vi-VN", { maximumFractionDigits: 0 }).format(Math.round(parseFloat(n || 0)));

export default function PayrollDetailEditModal({ isOpen, onClose, onSubmit, loading, detail }) {
    const [form, setForm] = useState({
        bonus: parseFloat(detail?.bonus || 0),
        deduction: parseFloat(detail?.deduction || 0),
        penalty: parseFloat(detail?.penalty || 0),
        p1p2Percentage: parseFloat(detail?.kpiPercentage || 0),
        note: detail?.note || "",
    });

    if (!isOpen || !detail) return null;

    const netPreview = Math.round((() => {
        const ncChuẩn = parseFloat(detail.standardDays || 26);
        const ncChínhThức = parseFloat(detail.officialDays || 0);
        const ncKhác = (parseFloat(detail.benefitLeaveDays) || 0) + (parseFloat(detail.annualLeaveDays) || 0) + (parseFloat(detail.holidayDays) || 0) + (parseFloat(detail.businessTripDays) || 0);
        const kpi = (form.kpiPercentage || 0) / 100;
        
        const p1 = parseFloat(detail.p1Salary || detail.baseSalary || 0);
        const p21 = parseFloat(detail.p21Salary || 0);
        const p22 = parseFloat(detail.p22Salary || 0);
        
        const lvtThực = ncChuẩn > 0 ? (p1 / ncChuẩn) * (ncChínhThức + ncKhác) : 0;
        const t21Thực = ncChuẩn > 0 ? (p21 / ncChuẩn) * (ncChínhThức + ncKhác) * kpi : 0;
        const t22Thực = p22 * kpi;
        const ltvThực = ncChuẩn > 0 ? (parseFloat(detail.probationSalary || 0) / ncChuẩn) * parseFloat(detail.probationDays || 0) : 0;
        
        const totalInc = lvtThực + t21Thực + t22Thực + ltvThực + 
                        parseFloat(detail.overtimePay || 0) + 
                        parseFloat(detail.allowanceAmount || 0) + 
                        form.bonus + 
                        (parseFloat(detail.adjustmentTaxable || 0) + parseFloat(detail.adjustmentNonTaxable || 0) + parseFloat(detail.otherIncomeNonTaxable || 0));
        
        const bhxh = 0.105 * parseFloat(detail.baseSalary || 0) + (parseFloat(detail.insuranceAdjustment || 0) + parseFloat(detail.unionFee || 0) + parseFloat(detail.partyFee || 0));
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

                    {/* Editable fields */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="col-span-1">
                            <label className="block text-xs font-medium mb-1 text-indigo-600">KPI / Hiệu quả (P2.1) %</label>
                            <div className="relative">
                                <input
                                    type="number"
                                    min="0"
                                    max="200"
                                    step="1"
                                    value={form.kpiPercentage}
                                    onChange={(e) => setForm({ ...form, kpiPercentage: parseFloat(e.target.value) || 0 })}
                                    className="w-full border border-slate-300 rounded-lg pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-bold text-indigo-700"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-xs font-bold">%</span>
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
