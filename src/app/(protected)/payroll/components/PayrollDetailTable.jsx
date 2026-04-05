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
                        <th className="px-3 py-2.5 font-bold text-slate-500 text-xs uppercase sticky left-0 bg-slate-50 z-10 border-r border-slate-200">STT</th>
                        <th className="px-3 py-2.5 font-bold text-slate-500 text-xs uppercase sticky left-10 bg-slate-50 z-10 border-r border-slate-200 min-w-[180px]">Nhân viên</th>
                        <th className="px-3 py-2.5 font-bold text-slate-500 text-xs uppercase min-w-[150px]">Phòng ban</th>
                        
                        {/* Granular Timesheet Columns */}
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[70px]">Số lương chuẩn</th>
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-indigo-50/30 min-w-[80px]">Tổng công</th>
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[80px]">Công CT</th>
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[80px]">Công TV</th>
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[100px]">Công tác/Học</th>
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[70px]">Lễ</th>
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[100px]">Chế độ</th>
                        <th className="px-2 py-2.5 font-bold text-slate-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[80px]">Phép</th>
                        <th className="px-2 py-2.5 font-bold text-red-500 text-[10px] uppercase text-center bg-red-50/10 min-w-[100px]">KL / BHXH</th>
                        <th className="px-2 py-2.5 font-bold text-indigo-500 text-[10px] uppercase text-center bg-slate-100/30 min-w-[90px]">Đêm CT</th>
                        <th className="px-2 py-2.5 font-bold text-indigo-400 text-[10px] uppercase text-center bg-slate-100/30 min-w-[90px]">Đêm TV</th>
                        <th className="px-2 py-2.5 font-bold text-slate-400 text-[10px] uppercase text-center bg-slate-100/30 min-w-[80px]">Chờ việc</th>
                        <th className="px-2 py-2.5 font-bold text-slate-600 text-[10px] uppercase text-center bg-slate-100/30 min-w-[80px]">Cơm</th>
                        <th className="px-2 py-2.5 font-bold text-emerald-600 text-[10px] uppercase text-center bg-slate-100/30 min-w-[100px]">Phép dùng</th>
                        <th className="px-2 py-2.5 font-bold text-blue-600 text-[10px] uppercase text-center bg-blue-50/10 min-w-[80px]">Phép tồn</th>

                        <th className="px-3 py-2.5 font-bold text-indigo-600 text-xs uppercase text-right min-w-[120px]">Lương CB</th>
                        <th className="px-3 py-2.5 font-bold text-indigo-600 text-xs uppercase text-right min-w-[100px]">OT</th>
                        <th className="px-3 py-2.5 font-bold text-indigo-600 text-xs uppercase text-right min-w-[100px]">Thưởng</th>
                        <th className="px-3 py-2.5 font-bold text-indigo-600 text-xs uppercase text-right min-w-[100px]">Khấu trừ</th>
                        <th className="px-3 py-2.5 font-bold text-indigo-600 text-xs uppercase text-right min-w-[100px]">Phạt</th>
                        <th className="px-3 py-2.5 font-bold text-indigo-600 text-xs uppercase text-right min-w-[110px]">Bảo hiểm</th>
                        <th className="px-3 py-2.5 font-bold text-indigo-600 text-xs uppercase text-right min-w-[100px]">Thuế</th>
                        <th className="px-3 py-2.5 font-bold text-indigo-700 text-xs uppercase text-right sticky right-0 bg-slate-50 z-10 border-l border-slate-200 min-w-[130px]">Thực nhận</th>
                        {canEdit && <th className="px-3 py-2.5 sticky right-0 bg-slate-50 z-10"></th>}
                        {/* Buffer for floating buttons */}
                        <th className="w-[100px] bg-slate-50"></th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {details.length === 0 ? (
                        <tr>
                            <td colSpan={28} className="text-center py-10 text-slate-400 text-sm italic bg-slate-50/30">
                                Chưa có dữ liệu bảng lương. Bấm "Cập nhật chấm công" hoặc "Tính toán tự động" để bắt đầu.
                            </td>
                        </tr>
                    ) : (
                        details.map((d, idx) => (
                            <tr key={d.id} className="hover:bg-slate-50 transition-colors group divide-x divide-slate-100">
                                <td className="px-3 py-2.5 text-slate-400 text-[10px] text-center sticky left-0 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">{idx + 1}</td>
                                <td className="px-3 py-2.5 sticky left-10 bg-white group-hover:bg-slate-50 z-10 border-r border-slate-200">
                                    <p className="font-bold text-slate-800 text-[13px]">{d.employee?.fullName}</p>
                                    <p className="text-[10px] text-slate-400 font-medium tracking-wider">{d.employee?.employeeCode}</p>
                                </td>
                                <td className="px-3 py-2.5 text-slate-500 text-[11px] font-medium italic">
                                    {d.employee?.department?.departmentName || "—"}
                                </td>

                                {/* Metric Cells */}
                                <td className="px-2 py-2.5 text-center text-slate-500 font-medium">{d.standardDays || 26}</td>
                                <td className="px-2 py-2.5 text-center font-bold text-indigo-600 bg-indigo-50/10 underline decoration-indigo-200">{d.workingDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-600">{d.officialDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-600">{d.probationDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-400 text-[10px]">{d.businessTripDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-600">{d.holidayDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-400 text-[11px]">{d.benefitLeaveDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-600 italic font-medium">{d.annualLeaveDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-red-500 font-bold bg-red-50/10">-{d.unpaidLeaveDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-indigo-500 font-medium">{d.nightShiftOfficialDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-indigo-400">{d.nightShiftProbationDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-300 italic">{d.waitingDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-slate-700 bg-slate-50/50 font-bold">{d.mealCount || 0}</td>
                                <td className="px-2 py-2.5 text-center text-emerald-600 font-medium">{d.usedLeaveDays || 0}</td>
                                <td className="px-2 py-2.5 text-center text-blue-600 font-extrabold">{d.remainingLeaveDays || 0}</td>

                                {/* Salary Cells */}
                                <td className="px-3 py-2.5 text-right font-medium text-slate-700 whitespace-nowrap bg-slate-50/20">{fmt(d.baseSalary)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-medium text-slate-700 whitespace-nowrap">{fmt(d.overtimePay)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-bold text-emerald-600 whitespace-nowrap">+{fmt(d.bonus)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-medium text-red-500 whitespace-nowrap">-{fmt(d.deduction)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-medium text-red-500 whitespace-nowrap">-{fmt(d.penalty)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-medium text-slate-500 whitespace-nowrap">-{fmt(d.insuranceDeduction)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-medium text-slate-500 whitespace-nowrap">-{fmt(d.taxDeduction)} ₫</td>
                                <td className="px-3 py-2.5 text-right font-extrabold text-slate-900 whitespace-nowrap sticky right-0 bg-white group-hover:bg-slate-50 z-10 border-l border-slate-200 shadow-[-4px_0_8px_rgba(0,0,0,0.02)]">
                                    <span title={fmtFull(d.netSalary) + " ₫"}>
                                        {fmt(d.netSalary)} ₫
                                    </span>
                                </td>
                                {canEdit && (
                                    <td className="px-3 py-2.5 sticky right-0 bg-white group-hover:bg-slate-50 z-10">
                                        <button
                                            onClick={() => onEdit(d)}
                                            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-indigo-50 text-indigo-500 transition-all"
                                            title="Chỉnh sửa"
                                        >
                                            <Pencil className="h-3.5 w-3.5" />
                                        </button>
                                    </td>
                                )}
                                {/* Buffer for floating buttons */}
                                <td className="bg-slate-50/10"></td>
                            </tr>
                        ))
                    )}
                </tbody>
                {details.length > 0 && (
                    <tfoot className="border-t-2 border-slate-200 bg-slate-50/50 font-bold divide-x divide-slate-100">
                        <tr>
                            <td colSpan={3} className="px-3 py-3 text-xs uppercase text-slate-500 sticky left-0 bg-slate-50 z-10 border-r border-slate-200">Tổng cộng ({details.length} NV)</td>
                            
                            {/* Metric Totals */}
                            <td className="px-2 py-3 text-center text-slate-500 text-[11px]">-</td>
                            <td className="px-2 py-3 text-center text-indigo-700">{details.reduce((s, d) => s + parseFloat(d.workingDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-slate-500 text-[11px]">{details.reduce((s, d) => s + parseFloat(d.officialDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-slate-500 text-[11px]">{details.reduce((s, d) => s + parseFloat(d.probationDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-slate-400 text-[10px]">{details.reduce((s, d) => s + parseFloat(d.businessTripDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-slate-500 text-[11px]">{details.reduce((s, d) => s + parseFloat(d.holidayDays || 0), 0).toFixed(0)}</td>
                            <td className="px-2 py-3 text-center text-slate-400 text-[10px]">{details.reduce((s, d) => s + parseFloat(d.benefitLeaveDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-slate-500 text-[11px] font-medium italic">{details.reduce((s, d) => s + parseFloat(d.annualLeaveDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-red-600 font-bold">{details.reduce((s, d) => s + parseFloat(d.unpaidLeaveDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-indigo-500 font-medium">{details.reduce((s, d) => s + parseFloat(d.nightShiftOfficialDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-indigo-400">{details.reduce((s, d) => s + parseFloat(d.nightShiftProbationDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-slate-300 italic">{details.reduce((s, d) => s + parseFloat(d.waitingDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-slate-700 bg-slate-50 font-bold">{details.reduce((s, d) => s + parseFloat(d.mealCount || 0), 0).toFixed(0)}</td>
                            <td className="px-2 py-3 text-center text-emerald-600">{details.reduce((s, d) => s + parseFloat(d.usedLeaveDays || 0), 0).toFixed(1)}</td>
                            <td className="px-2 py-3 text-center text-blue-700">{details.reduce((s, d) => s + parseFloat(d.remainingLeaveDays || 0), 0).toFixed(1)}</td>

                            {/* Salary Placeholder Cells */}
                            <td colSpan={7} className="bg-slate-50/30" />

                            <td className="px-3 py-3 text-right font-extrabold text-slate-900 whitespace-nowrap sticky right-0 bg-slate-50 z-10 border-l border-slate-200">
                                {fmt(details.reduce((s, d) => s + parseFloat(d.netSalary || 0), 0))} ₫
                            </td>
                            {canEdit && <td className="sticky right-0 bg-slate-50 z-10" />}
                            {/* Buffer for floating buttons */}
                            <td className="bg-slate-50"></td>
                        </tr>
                    </tfoot>
                )}
            </table>
        </div>
    );
}
