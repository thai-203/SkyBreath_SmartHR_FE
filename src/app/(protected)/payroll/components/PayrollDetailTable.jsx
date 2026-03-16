"use client";

import { Pencil } from "lucide-react";
import { authService } from "@/services/auth.service";

const fmt = (n) =>
    new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(parseFloat(n || 0));

const fmtFull = (n) =>
    new Intl.NumberFormat("vi-VN").format(parseFloat(n || 0));

export default function PayrollDetailTable({ details = [], loading = false, canEdit = false, onEdit }) {
    if (loading) {
        return (
            <div className="space-y-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-12 bg-slate-100 rounded-lg animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
            <table className="w-full text-sm">
                <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                        {[
                            "STT", "Nhân viên", "Phòng ban", "Ngày công",
                            "Lương CB", "OT", "Thưởng", "Khấu trừ", "Phạt",
                            "Bảo hiểm", "Thuế", "Thực nhận",
                            ...(canEdit ? [""] : [])
                        ].map((h) => (
                            <th key={h} className="text-left px-3 py-2.5 font-semibold text-slate-500 text-xs uppercase tracking-wider whitespace-nowrap">
                                {h}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {details.length === 0 ? (
                        <tr>
                            <td colSpan={canEdit ? 13 : 12} className="text-center py-10 text-slate-400 text-sm">
                                Chưa có dữ liệu lương. Bấm "Tính toán tự động" để bắt đầu.
                            </td>
                        </tr>
                    ) : (
                        details.map((d, idx) => (
                            <tr key={d.id} className="hover:bg-slate-50/50 transition-colors group">
                                <td className="px-3 py-2.5 text-slate-400 text-xs">{idx + 1}</td>
                                <td className="px-3 py-2.5">
                                    <p className="font-medium text-slate-800">{d.employee?.fullName}</p>
                                    <p className="text-xs text-slate-400">{d.employee?.employeeCode}</p>
                                </td>
                                <td className="px-3 py-2.5 text-slate-600 text-xs whitespace-nowrap">
                                    {d.employee?.department?.departmentName || "—"}
                                </td>
                                <td className="px-3 py-2.5 text-center text-slate-700">{d.workingDays}</td>
                                <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">{fmt(d.baseSalary)} ₫</td>
                                <td className="px-3 py-2.5 text-right text-slate-700 whitespace-nowrap">{fmt(d.overtimePay)} ₫</td>
                                <td className="px-3 py-2.5 text-right text-emerald-600 whitespace-nowrap">+{fmt(d.bonus)} ₫</td>
                                <td className="px-3 py-2.5 text-right text-red-500 whitespace-nowrap">-{fmt(d.deduction)} ₫</td>
                                <td className="px-3 py-2.5 text-right text-red-500 whitespace-nowrap">-{fmt(d.penalty)} ₫</td>
                                <td className="px-3 py-2.5 text-right text-red-400 whitespace-nowrap">-{fmt(d.insuranceDeduction)} ₫</td>
                                <td className="px-3 py-2.5 text-right text-red-400 whitespace-nowrap">-{fmt(d.taxDeduction)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-bold text-slate-900 whitespace-nowrap">
                                    <span title={fmtFull(d.netSalary) + " ₫"}>
                                        {fmt(d.netSalary)} ₫
                                    </span>
                                    {d.payslipSentAt && (
                                        <span className="ml-1.5 text-xs bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full font-normal">✓ Đã gửi</span>
                                    )}
                                </td>
                                {canEdit && (
                                    <td className="px-3 py-2.5">
                                        <button
                                            onClick={() => onEdit(d)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-all"
                                            title="Chỉnh sửa"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                )}
                            </tr>
                        ))
                    )}
                </tbody>
                {details.length > 0 && (
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50">
                        <tr>
                            <td colSpan={3} className="px-3 py-3 font-bold text-slate-700 text-xs uppercase">Tổng cộng</td>
                            <td className="px-3 py-3 text-center font-semibold text-slate-700">{details.reduce((s, d) => s + parseFloat(d.workingDays || 0), 0).toFixed(0)}</td>
                            <td colSpan={7} />
                            <td className="px-3 py-3 text-right font-bold text-slate-900 whitespace-nowrap">
                                {fmt(details.reduce((s, d) => s + parseFloat(d.netSalary || 0), 0))} ₫
                            </td>
                            {canEdit && <td />}
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}
