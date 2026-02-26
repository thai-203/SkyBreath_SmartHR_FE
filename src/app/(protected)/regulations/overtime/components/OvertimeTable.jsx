"use client";

import { Button } from "@/components/common/Button";
import { Pagination } from "@/components/common/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { Pencil, Trash2, Search } from "lucide-react";

export default function OvertimeTable({
    data = [],
    loading = false,
    search,
    onSearchChange,
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    onEdit,
    onDelete,
}) {
    const columnCount = 8;

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Search Bar */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-base font-semibold text-slate-900">
                    Danh sách quy định OT
                </h2>
                <div className="relative w-64">
                    <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm quy định..."
                        value={search}
                        onChange={(e) => onSearchChange(e.target.value)}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                    />
                </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                STT
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Tên quy định
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Hệ số lương
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Giờ OT tối đa/ngày
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Giờ OT tối đa/tháng
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Áp dụng cho
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Trạng thái
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Thao tác
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    {Array.from({ length: columnCount }).map((_, j) => (
                                        <td key={j} className="px-4 py-3">
                                            <Skeleton className="h-5 w-full" />
                                        </td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((rule, index) => (
                                <tr
                                    key={rule.id}
                                    className="transition-colors hover:bg-slate-50"
                                >
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {(currentPage - 1) * pageSize + index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                        {rule.name}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                            x{rule.salaryMultiplier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                                        {rule.maxHoursPerDay}h
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                                        {rule.maxHoursPerMonth}h
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        <div className="flex flex-wrap gap-1">
                                            {rule.departments && rule.departments.length > 0
                                                ? rule.departments.map((dept) => (
                                                      <span
                                                          key={dept.id}
                                                          className="inline-flex items-center rounded-full bg-indigo-50 px-2 py-0.5 text-xs font-medium text-indigo-700"
                                                      >
                                                          {dept.departmentName}
                                                      </span>
                                                  ))
                                                : "—"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                rule.status === "ACTIVE"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {rule.status === "ACTIVE"
                                                ? "Hoạt động"
                                                : "Ngừng hoạt động"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-indigo-500 hover:text-indigo-700 hover:bg-indigo-50"
                                                onClick={() => onEdit(rule)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => onDelete(rule)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td
                                    colSpan={columnCount}
                                    className="px-4 py-12 text-center text-sm text-slate-400"
                                >
                                    {search
                                        ? "Không tìm thấy quy định phù hợp"
                                        : "Chưa có quy định OT nào"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">
                    Hiển thị {data.length} / Trang {currentPage} của{" "}
                    {totalPages || 1}
                </p>
                <Pagination
                    currentPage={currentPage}
                    totalPages={totalPages}
                    onPageChange={onPageChange}
                />
            </div>
        </div>
    );
}
