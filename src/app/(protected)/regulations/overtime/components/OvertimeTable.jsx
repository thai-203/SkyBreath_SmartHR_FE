"use client";

import React, { useState } from "react";
import { Button } from "@/components/common/Button";
import { Pagination } from "@/components/common/Pagination";
import { Skeleton } from "@/components/common/Skeleton";
import { Search, Filter, ChevronDown, ChevronUp, Pencil, Trash2, Zap } from "lucide-react";
import { authService } from "@/services";

// badge coloring by overtime type code
const overtimeTypeColors = {
    WEEKDAY: "bg-blue-50 text-blue-700",
    WEEKEND: "bg-violet-50 text-violet-700",
    HOLIDAY: "bg-rose-50 text-rose-700",
};

// Status styling logic is calculated dynamically inside component

export default function OvertimeTable({
    data = [],
    loading = false,
    search,
    onSearchChange,
    filters = {},
    onFilterChange,
    departments = [],
    overtimeTypes = [],   // danh sách loại OT từ API /overtime-types
    currentPage,
    totalPages,
    onPageChange,
    pageSize,
    totalItems = 0,
    onEdit,
    onDelete,
    onActivate,
}) {
    const columnCount = 10;
    const [showFilters, setShowFilters] = useState(false);

    const handleFilterChange = (field, value) => {
        onFilterChange({ ...filters, [field]: value });
    };

    const hasActiveFilters =
        filters.versionStatus || filters.overtimeType || filters.departmentId ||
        filters.minMultiplier || filters.maxMultiplier ||
        filters.minHoursPerDay || filters.maxHoursPerDay ||
        filters.minHoursPerMonth || filters.maxHoursPerMonth;

    const handleClearFilters = () => {
        onFilterChange({
            versionStatus: "", overtimeType: "", departmentId: "",
            minMultiplier: "", maxMultiplier: "",
            minHoursPerDay: "", maxHoursPerDay: "",
            minHoursPerMonth: "", maxHoursPerMonth: "",
        });
    };

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    };

    const getDynamicStatus = (rule) => {
        if (rule.versionStatus === "DRAFT") {
            return { label: "Nháp", color: "bg-slate-100 text-slate-600 border border-slate-200" };
        }
        if (rule.versionStatus === "EXPIRED") {
            return { label: "Đã bị hủy", color: "bg-slate-700 text-white shadow-sm" };
        }

        if (rule.versionStatus === "ACTIVE") {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            
            const fromDate = rule.effectiveFrom ? new Date(rule.effectiveFrom) : new Date(0);
            fromDate.setHours(0, 0, 0, 0);
            
            if (fromDate > today) {
                return { label: "Sắp áp dụng", color: "bg-amber-100 text-amber-800 border border-amber-200" };
            }
            
            if (rule.effectiveTo) {
                const toDate = new Date(rule.effectiveTo);
                toDate.setHours(0, 0, 0, 0);
                if (toDate < today) {
                    return { label: "Hết hiệu lực", color: "bg-rose-100 text-rose-800 border border-rose-200" };
                }
            }
            
            return { label: "Đang áp dụng", color: "bg-emerald-100 text-emerald-800 border border-emerald-200 shadow-sm" };
        }
        
        return { label: rule.versionStatus || "Unknown", color: "bg-slate-100 text-slate-500" };
    };

    return (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm">
            {/* Search & Filter Toggle */}
            <div className="flex items-center justify-between border-b border-slate-200 p-4">
                <h2 className="text-base font-semibold text-slate-900">Danh sách quy định OT</h2>
                <div className="flex items-center gap-2">
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên hoặc mã..."
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

            {/* Filter Panel */}
            {showFilters && (
                <div className="border-b border-slate-200 bg-slate-50 p-4 space-y-3">
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                        {/* Loại OT */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Loại OT</label>
                            <select value={filters.overtimeTypeId || ""} onChange={(e) => handleFilterChange("overtimeTypeId", e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                <option value="">Tất cả</option>
                                {overtimeTypes.map((ot) => (
                                    <option key={ot.id} value={ot.id}>{ot.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Trạng thái version */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Trạng thái</label>
                            <select value={filters.versionStatus || ""} onChange={(e) => handleFilterChange("versionStatus", e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                <option value="">Tất cả</option>
                                <option value="DRAFT">Nháp</option>
                                <option value="ACTIVE">Đang áp dụng</option>
                                <option value="EXPIRED">Hết hiệu lực</option>
                            </select>
                        </div>

                        {/* Phòng ban */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Phòng ban</label>
                            <select value={filters.departmentId || ""} onChange={(e) => handleFilterChange("departmentId", e.target.value)}
                                className="h-9 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                                <option value="">Tất cả phòng ban</option>
                                {departments.map((dept) => (
                                    <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                                ))}
                            </select>
                        </div>

                        {/* Hệ số lương */}
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-slate-500">Hệ số lương</label>
                            <div className="flex items-center gap-1.5">
                                <input type="number" step="0.1" min="0" placeholder="Từ" value={filters.minMultiplier || ""}
                                    onChange={(e) => handleFilterChange("minMultiplier", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                                <span className="text-xs text-slate-400">–</span>
                                <input type="number" step="0.1" min="0" placeholder="Đến" value={filters.maxMultiplier || ""}
                                    onChange={(e) => handleFilterChange("maxMultiplier", e.target.value)}
                                    className="h-9 w-full rounded-lg border border-slate-200 bg-white px-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500" />
                            </div>
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
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Tên quy định</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Loại OT</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Hệ số</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Giờ/ngày</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Giờ/tháng</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 w-32">Phòng ban</th>
                            <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-slate-500">Hiệu lực</th>
                            <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Trạng thái</th>
                            {(authService.hasPermission("OVERTIME_RULE_UPDATE") || authService.hasPermission("OVERTIME_RULE_DELETE")) && (
                                <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider text-slate-500">Thao tác</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {loading ? (
                            Array.from({ length: 5 }).map((_, i) => (
                                <tr key={i} className="border-b border-slate-100">
                                    {Array.from({ length: columnCount }).map((_, j) => (
                                        <td key={j} className="px-4 py-3"><Skeleton className="h-5 w-full" /></td>
                                    ))}
                                </tr>
                            ))
                        ) : data.length > 0 ? (
                            data.map((rule, index) => (
                                <tr key={rule.id} className="transition-colors hover:bg-slate-50">
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {(currentPage - 1) * pageSize + index + 1}
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="text-sm font-medium text-slate-900">{rule.name}</div>
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {rule.overtimeType ? (
                                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${overtimeTypeColors[rule.overtimeType.code] || "bg-slate-100 text-slate-600"}`}>
                                                {rule.overtimeType.name}
                                            </span>
                                        ) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">
                                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
                                            x{rule.salaryMultiplier}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">{rule.maxHoursPerDay}h</td>
                                    <td className="px-4 py-3 text-center text-sm text-slate-600">{rule.maxHoursPerMonth}h</td>
                                    <td className="px-4 py-3">
                                        <div 
                                            className="text-xs text-slate-600 truncate max-w-[150px]" 
                                            title={rule.departments?.map(d => d.departmentName).join(", ") || "Tất cả"}
                                        >
                                            {rule.departments?.map(d => d.departmentName).join(", ") || "Tất cả"}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-sm text-slate-600">
                                        {rule.effectiveFrom ? (
                                            <div className="text-xs">
                                                <div>Từ: {formatDate(rule.effectiveFrom)}</div>
                                                <div className="text-slate-400">
                                                    {rule.effectiveTo ? `Đến: ${formatDate(rule.effectiveTo)}` : "Vô thời hạn"}
                                                </div>
                                            </div>
                                        ) : "—"}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                        {(() => {
                                            const status = getDynamicStatus(rule);
                                            return (
                                                <span className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-semibold tracking-wide ${status.color}`}>
                                                    {status.label}
                                                </span>
                                            );
                                        })()}
                                    </td>
                                    {(authService.hasPermission("OVERTIME_RULE_UPDATE") || authService.hasPermission("OVERTIME_RULE_DELETE")) && (
                                        <td className="px-4 py-3 text-center">
                                            <div className="flex items-center justify-center gap-1">
                                                {/* Activate — chỉ hiện với DRAFT */}
                                                {rule.versionStatus === "DRAFT" && onActivate && authService.hasPermission("OVERTIME_RULE_UPDATE") && (
                                                    <Button
                                                        variant="ghost"
                                                        size="icon"
                                                        onClick={() => onActivate(rule)}
                                                        title="Kích hoạt"
                                                        className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
                                                    >
                                                        <Zap className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {authService.hasPermission("OVERTIME_RULE_UPDATE") && (
                                                    <Button variant="ghost" size="icon" onClick={() => onEdit(rule)} title="Chỉnh sửa">
                                                        <Pencil className="h-4 w-4" />
                                                    </Button>
                                                )}
                                                {rule.versionStatus === "DRAFT" && authService.hasPermission("OVERTIME_RULE_DELETE") && (
                                                    <Button variant="ghost" size="icon" onClick={() => onDelete(rule)} title="Xóa"
                                                        className="text-red-500 hover:text-red-600 hover:bg-red-50">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                )}
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={columnCount} className="px-4 py-12 text-center text-sm text-slate-400">
                                    {search || hasActiveFilters ? "Không tìm thấy quy định phù hợp" : "Chưa có quy định OT nào"}
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
