"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/Button";
import { Pagination } from "@/components/common/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { Search, Filter, ChevronDown, ChevronUp, Eye, Pencil, Trash2 } from "lucide-react";
import { authService } from "@/services";

const violationTypeLabels = {
    LATE: "Đi muộn",
    EARLY: "Về sớm",
};

const violationTypeColors = {
    LATE: "bg-orange-50 text-orange-700",
    EARLY: "bg-blue-50 text-blue-700",
};

export default function PenaltyTable({
    data = [],
    loading = false,
    search,
    onSearchChange,
    filters = {},
    onFilterChange,
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    totalItems = 0,
    onEdit,
    onDelete,
}) {
    const columnCount = 9;
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    const hasActiveFilters = filters.violationType || filters.status;

    const handleClearFilters = () => {
        onFilterChange({ violationType: "", status: "" });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-base font-semibold text-slate-900">
                    Danh sách quy định vi phạm
                </h2>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-9 pr-3 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1"
                        />
                    </div>
                    <Button
                        variant={hasActiveFilters ? "default" : "outline"}
                        className="gap-1.5 h-10"
                        onClick={() => setShowFilters(!showFilters)}
                    >
                        <Filter className="h-5 w-5" />
                        Lọc
                        {hasActiveFilters && (
                            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">!</span>
                        )}
                        {showFilters ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            {showFilters && (
                <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Trường hợp</label>
                            <select
                                value={filters.violationType || ""}
                                onChange={(e) => handleFilterChange("violationType", e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="LATE">Đi muộn</option>
                                <option value="EARLY">Về sớm</option>
                            </select>
                        </div>
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Trạng thái</label>
                            <select
                                value={filters.status || ""}
                                onChange={(e) => handleFilterChange("status", e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="ACTIVE">Hoạt động</option>
                                <option value="INACTIVE">Ngừng hoạt động</option>
                            </select>
                        </div>
                    </div>
                    {hasActiveFilters && (
                        <div className="flex justify-end">
                            <Button variant="ghost" size="sm" onClick={handleClearFilters} className="text-xs text-slate-500 hover:text-slate-700">
                                Xóa bộ lọc
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="border-b border-slate-200 bg-slate-50">
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-12">STT</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Trường hợp</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Thời gian đi muộn/<br/>về sớm từ (phút)</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Thời gian đi muộn/<br/>về sớm đến (phút)</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Số giờ quy đổi</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày hiệu lực</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Ngày hết hiệu lực</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500 w-28">Hành động</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i}>
                                    {Array.from({ length: columnCount }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((penalty, index) => (
                                <tr key={penalty.id} className="transition-colors hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {(currentPage - 1) * pageSize + index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${violationTypeColors[penalty.violationType] || "bg-slate-100 text-slate-600"}`}>
                                            {violationTypeLabels[penalty.violationType] || penalty.violationType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">{penalty.fromMinute}</td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">{penalty.toMinute}</td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">{penalty.convertedHours}</td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">{formatDate(penalty.effectiveFrom)}</td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">{formatDate(penalty.effectiveTo)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                            penalty.status === "ACTIVE"
                                                ? "bg-emerald-50 text-emerald-700"
                                                : "bg-slate-100 text-slate-500"
                                        }`}>
                                            {penalty.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-1">
                                            {authService.hasPermission("PENALTY_UPDATE") && (
                                                <button onClick={() => onEdit(penalty)} className="rounded-lg p-1.5 text-slate-400 hover:bg-blue-50 hover:text-blue-600 transition-colors" title="Chỉnh sửa">
                                                    <Pencil className="h-4 w-4" />
                                                </button>
                                            )}
                                            {authService.hasPermission("PENALTY_DELETE") && (
                                                <button onClick={() => onDelete(penalty)} className="rounded-lg p-1.5 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors" title="Xóa">
                                                    <Trash2 className="h-4 w-4" />
                                                </button>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columnCount} className="px-4 py-12 text-center text-sm text-slate-400">
                                    {search || hasActiveFilters ? "Không tìm thấy quy định vi phạm phù hợp" : "Chưa có quy định vi phạm nào"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">
                    Tổng {totalItems} bản ghi / Trang {currentPage} của {totalPages || 1}
                </p>
                <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={onPageChange} />
            </div>
        </div>
    );
}
