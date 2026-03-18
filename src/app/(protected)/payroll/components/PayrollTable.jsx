"use client";

import { Search, ChevronUp, ChevronDown, MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { authService } from "@/services/auth.service";

const STATUS_MAP = {
    DRAFT: { label: "Nháp", color: "bg-slate-100 text-slate-600" },
    PENDING_APPROVAL: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700" },
    APPROVED: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700" },
    LOCKED: { label: "Đã khóa", color: "bg-emerald-100 text-emerald-700" },
};

const fmt = (n) =>
    new Intl.NumberFormat("vi-VN", { notation: "compact", maximumFractionDigits: 1 }).format(parseFloat(n || 0));

export default function PayrollTable({
    data = [],
    loading = false,
    search,
    onSearchChange,
    pagination,
    onPaginationChange,
    totalPages,
    onCalculate,
    onEdit,
    onSubmit,
    onApprove,
    onReject,
    onLock,
    onSendPayslips,
    onExportSummary,
    onExportPayslips,
    onViewDetail,
}) {
    const [openMenu, setOpenMenu] = useState(null);

    const toggleMenu = (id) => setOpenMenu(openMenu === id ? null : id);

    if (loading) {
        return (
            <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex gap-4 items-center">
                    <div className="h-9 w-64 bg-slate-200 rounded-lg animate-pulse" />
                </div>
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 border-b border-slate-100">
                        {Array.from({ length: 6 }).map((_, j) => (
                            <div key={j} className="h-4 bg-slate-100 rounded animate-pulse flex-1" />
                        ))}
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Toolbar */}
            <div className="flex items-center gap-3 p-4 border-b border-slate-100 bg-slate-50/50">
                <div className="relative flex-1 max-w-xs">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm bảng lương..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg w-full focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead>
                        <tr className="border-b border-slate-100 bg-slate-50">
                            {["Kỳ lương", "Trạng thái", "Số nhân viên", "Tổng thực nhận", "Thao tác"].map((h) => (
                                <th key={h} className="text-left px-4 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wider">
                                    {h}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {data.length === 0 ? (
                            <tr>
                                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                                    Chưa có bảng lương nào
                                </td>
                            </tr>
                        ) : (
                            data.map((payroll) => {
                                const status = STATUS_MAP[payroll.payrollStatus] || STATUS_MAP.DRAFT;
                                const isLocked = payroll.payrollStatus === "LOCKED";
                                const isDraft = payroll.payrollStatus === "DRAFT";
                                const isPending = payroll.payrollStatus === "PENDING_APPROVAL";
                                const isApproved = payroll.payrollStatus === "APPROVED";

                                return (
                                    <tr key={payroll.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-4 py-3">
                                            <button
                                                onClick={() => onViewDetail(payroll)}
                                                className="font-semibold text-indigo-600 hover:text-indigo-800 hover:underline"
                                            >
                                                Tháng {payroll.payrollMonth}/{payroll.payrollYear}
                                            </button>
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${status.color}`}>
                                                {status.label}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600">
                                            {payroll.employeeCount || 0} NV
                                        </td>
                                        <td className="px-4 py-3 font-medium text-slate-900">
                                            {fmt(payroll.totalNetSalary)} ₫
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <button
                                                    onClick={() => toggleMenu(payroll.id)}
                                                    className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-slate-700 transition-colors"
                                                >
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </button>
                                                {openMenu === payroll.id && (
                                                    <div
                                                        className="absolute right-0 top-8 z-20 bg-white border border-slate-200 rounded-lg shadow-lg py-1 min-w-[180px]"
                                                        onMouseLeave={() => setOpenMenu(null)}
                                                    >
                                                        <button onClick={() => { onViewDetail(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">
                                                            👁 Xem chi tiết
                                                        </button>
                                                        {isDraft && authService.hasPermission("PAYROLL_UPDATE") && (
                                                            <button onClick={() => { onCalculate(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">
                                                                ⚡ Tính toán tự động
                                                            </button>
                                                        )}
                                                        {isDraft && authService.hasPermission("PAYROLL_APPROVE") && (
                                                            <button onClick={() => { onSubmit(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-blue-50 text-blue-700">
                                                                📤 Gửi phê duyệt
                                                            </button>
                                                        )}
                                                        {isPending && authService.hasPermission("PAYROLL_APPROVE") && (
                                                            <>
                                                                <button onClick={() => { onApprove(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-emerald-50 text-emerald-700">
                                                                    ✅ Phê duyệt
                                                                </button>
                                                                <button onClick={() => { onReject(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-red-50 text-red-700">
                                                                    ❌ Từ chối
                                                                </button>
                                                            </>
                                                        )}
                                                        {isApproved && authService.hasPermission("PAYROLL_LOCK") && (
                                                            <button onClick={() => { onLock(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">
                                                                🔒 Khóa bảng lương
                                                            </button>
                                                        )}
                                                        {isLocked && authService.hasPermission("PAYROLL_LOCK") && (
                                                            <button onClick={() => { onSendPayslips(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-indigo-50 text-indigo-700">
                                                                📧 Gửi phiếu lương
                                                            </button>
                                                        )}
                                                        {authService.hasPermission("PAYROLL_EXPORT") && (
                                                            <>
                                                                <div className="border-t border-slate-100 my-1" />
                                                                <button onClick={() => { onExportSummary(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">
                                                                    📊 Xuất tổng hợp
                                                                </button>
                                                                {isLocked && (
                                                                    <button onClick={() => { onExportPayslips(payroll); setOpenMenu(null); }} className="w-full text-left px-4 py-2 text-sm hover:bg-slate-50 text-slate-700">
                                                                        📄 Xuất phiếu lương
                                                                    </button>
                                                                )}
                                                            </>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                    <p className="text-xs text-slate-500">
                        Trang {pagination.pageIndex + 1} / {totalPages}
                    </p>
                    <div className="flex gap-1">
                        <button
                            disabled={pagination.pageIndex === 0}
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex - 1 })}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                        >
                            ← Trước
                        </button>
                        <button
                            disabled={pagination.pageIndex + 1 >= totalPages}
                            onClick={() => onPaginationChange({ ...pagination, pageIndex: pagination.pageIndex + 1 })}
                            className="px-3 py-1.5 text-xs rounded-lg border border-slate-200 disabled:opacity-40 hover:bg-slate-100 transition-colors"
                        >
                            Sau →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
