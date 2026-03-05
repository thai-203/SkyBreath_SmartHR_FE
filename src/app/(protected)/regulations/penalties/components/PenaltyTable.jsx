"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/Button";
import { Pagination } from "@/components/common/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { Pencil, Trash2, Search, Filter, ChevronDown, ChevronUp } from "lucide-react";

const penaltyTypeLabels = {
    WARNING: "Cảnh cáo",
    SALARY_DEDUCTION: "Trừ lương",
    SUSPENSION: "Đình chỉ",
    TERMINATION: "Sa thải",
};

const penaltyTypeColors = {
    WARNING: "bg-yellow-50 text-yellow-700",
    SALARY_DEDUCTION: "bg-orange-50 text-orange-700",
    SUSPENSION: "bg-red-50 text-red-700",
    TERMINATION: "bg-rose-50 text-rose-700",
};

const severityLabels = {
    LOW: "Thấp",
    MEDIUM: "Trung bình",
    HIGH: "Cao",
    CRITICAL: "Nghiêm trọng",
};

const severityColors = {
    LOW: "bg-slate-100 text-slate-600",
    MEDIUM: "bg-blue-50 text-blue-700",
    HIGH: "bg-orange-50 text-orange-700",
    CRITICAL: "bg-red-50 text-red-700",
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
    const columnCount = 8;
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    const hasActiveFilters = filters.penaltyType || filters.severityLevel ||
        filters.status || filters.minDeductionAmount || filters.maxDeductionAmount;

    const handleClearFilters = () => {
        onFilterChange({
            penaltyType: "",
            severityLevel: "",
            status: "",
            minDeductionAmount: "",
            maxDeductionAmount: "",
        });
    };

    const formatCurrency = (value) => {
        if (value === null || value === undefined) return "—";
        return Number(value).toLocaleString("vi-VN") + "đ";
    };

    const formatPercentage = (value) => {
        if (value === null || value === undefined) return "—";
        return Number(value) + "%";
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Search & Filter Toggle */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-base font-semibold text-slate-900">
                    Danh sách quy định hình phạt
                </h2>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc số tiền..."
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
                            <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-xs font-bold text-indigo-600">
                                !
                            </span>
                        )}
                        {showFilters ? (
                            <ChevronUp className="h-5 w-5" />
                        ) : (
                            <ChevronDown className="h-5 w-5" />
                        )}
                    </Button>
                </div>
            </div>

            {/* Filter Panel */}
            {showFilters && (
                <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Penalty Type */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Loại hình phạt</label>
                            <select
                                value={filters.penaltyType || ""}
                                onChange={(e) => handleFilterChange("penaltyType", e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="WARNING">Cảnh cáo</option>
                                <option value="SALARY_DEDUCTION">Trừ lương</option>
                                <option value="SUSPENSION">Đình chỉ</option>
                                <option value="TERMINATION">Sa thải</option>
                            </select>
                        </div>

                        {/* Severity Level */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Mức độ</label>
                            <select
                                value={filters.severityLevel || ""}
                                onChange={(e) => handleFilterChange("severityLevel", e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                            >
                                <option value="">Tất cả</option>
                                <option value="LOW">Thấp</option>
                                <option value="MEDIUM">Trung bình</option>
                                <option value="HIGH">Cao</option>
                                <option value="CRITICAL">Nghiêm trọng</option>
                            </select>
                        </div>

                        {/* Status */}
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

                        {/* Deduction Amount Range */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Số tiền trừ</label>
                            <div className="flex items-center gap-1.5">
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Từ"
                                    value={filters.minDeductionAmount || ""}
                                    onChange={(e) => handleFilterChange("minDeductionAmount", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                />
                                <span className="text-xs text-slate-400">–</span>
                                <input
                                    type="number"
                                    min="0"
                                    placeholder="Đến"
                                    value={filters.maxDeductionAmount || ""}
                                    onChange={(e) => handleFilterChange("maxDeductionAmount", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Clear Filters */}
                    {hasActiveFilters && (
                        <div className="flex justify-end">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={handleClearFilters}
                                className="text-xs text-slate-500 hover:text-slate-700"
                            >
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
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                STT
                            </th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Tên hình phạt
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Loại
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Mức độ
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                Số tiền trừ
                            </th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">
                                % Trừ lương
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
                            data.map((penalty, index) => (
                                <tr
                                    key={penalty.id}
                                    className="transition-colors hover:bg-slate-50"
                                >
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {(currentPage - 1) * pageSize + index + 1}
                                    </td>
                                    <td className="px-4 py-3 text-sm font-medium text-slate-900">
                                        <div>
                                            {penalty.name}
                                            {penalty.description && (
                                                <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                                                    {penalty.description}
                                                </p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                penaltyTypeColors[penalty.penaltyType] || "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {penaltyTypeLabels[penalty.penaltyType] || penalty.penaltyType}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                severityColors[penalty.severityLevel] || "bg-slate-100 text-slate-600"
                                            }`}
                                        >
                                            {severityLabels[penalty.severityLevel] || penalty.severityLevel}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                                        {formatCurrency(penalty.deductionAmount)}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                                        {formatPercentage(penalty.deductionPercentage)}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        <span
                                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                                penalty.status === "ACTIVE"
                                                    ? "bg-emerald-50 text-emerald-700"
                                                    : "bg-slate-100 text-slate-500"
                                            }`}
                                        >
                                            {penalty.status === "ACTIVE"
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
                                                onClick={() => onEdit(penalty)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50"
                                                onClick={() => onDelete(penalty)}
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
                                    {search || hasActiveFilters
                                        ? "Không tìm thấy hình phạt phù hợp"
                                        : "Chưa có quy định hình phạt nào"}
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                <p className="text-sm text-slate-500">
                    Tổng {totalItems} bản ghi / Trang {currentPage} của{" "}
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
