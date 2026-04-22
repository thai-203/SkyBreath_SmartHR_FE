"use client";

import { useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import {
    Search,
    Edit2,
    Trash2,
    Eye,
    FileText,
    Calendar,
    RotateCcw,
    User,
} from "lucide-react";

const REVIEW_STATUS_CONFIG = {
    DRAFT: {
        label: "Nháp",
        class: "bg-amber-100 text-amber-700 border-amber-200",
    },
    SUBMITTED: {
        label: "Đã đánh giá",
        class: "bg-emerald-100 text-emerald-700 border-emerald-200",
    },
};

const MONTHS = [
    { value: 1, label: "Tháng 1" },
    { value: 2, label: "Tháng 2" },
    { value: 3, label: "Tháng 3" },
    { value: 4, label: "Tháng 4" },
    { value: 5, label: "Tháng 5" },
    { value: 6, label: "Tháng 6" },
    { value: 7, label: "Tháng 7" },
    { value: 8, label: "Tháng 8" },
    { value: 9, label: "Tháng 9" },
    { value: 10, label: "Tháng 10" },
    { value: 11, label: "Tháng 11" },
    { value: 12, label: "Tháng 12" },
];

export default function PerformanceReviewTable({
    data = [],
    loading,
    search,
    onSearchChange,
    filterMonth,
    onMonthChange,
    filterYear,
    onYearChange,
    onReset,
    pagination = { pageIndex: 0, pageSize: 10 },
    onPaginationChange,
    totalPages,
    onView,
    onEdit,
    onDelete,
}) {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

    const handleFilterUpdate = (updateFn, value) => {
        updateFn(value);
        onPaginationChange({ ...pagination, pageIndex: 0 });
    };

    const columns = useMemo(
        () => [
            {
                header: "Nhân viên",
                cell: ({ row }) => {
                    const name = row.original.employee?.fullName || "Chưa xác định";
                    const dept = row.original.employee?.department?.departmentName || "";
                    return (
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 uppercase text-xs font-bold">
                                {name.charAt(0)}
                            </div>
                            <div className="flex flex-col">
                                <span className="font-medium text-slate-900">{name}</span>
                                <span className="text-[11px] text-slate-500">{dept || "---"}</span>
                            </div>
                        </div>
                    );
                },
            },
            {
                header: "Tháng/Năm",
                cell: ({ row }) => {
                    const month = row.original.reviewMonth;
                    const year = row.original.reviewYear;
                    const monthLabel = MONTHS.find((m) => m.value === month)?.label || month;
                    return (
                        <div className="flex items-center gap-2 text-sm text-slate-700">
                            <Calendar className="h-4 w-4 text-slate-400" />
                            <span className="font-medium">{monthLabel}/{year}</span>
                        </div>
                    );
                },
            },
            {
                header: "Điểm Hành vi",
                cell: ({ row }) => {
                    const behaviorScore =
                        (parseFloat(row.original.scoreCompliance) || 0) +
                        (parseFloat(row.original.scoreAttitude) || 0) +
                        (parseFloat(row.original.scoreLearning) || 0) +
                        (parseFloat(row.original.scoreTeamwork) || 0) +
                        (parseFloat(row.original.scoreSkills) || 0);
                    const maxScore = 5.0;
                    const percentage = (behaviorScore / maxScore) * 100;
                    return (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">{behaviorScore.toFixed(1)}/{maxScore}</span>
                                <span className={`font-medium ${
                                    percentage >= 80 ? 'text-emerald-600' : 
                                    percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                                }`}>{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        percentage >= 80 ? 'bg-emerald-500' : 
                                        percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                },
            },
            {
                header: "Điểm KQTT",
                cell: ({ row }) => {
                    const score = parseFloat(row.original.scoreResult) || 0;
                    const percentage = (score / 5) * 100;
                    return (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className="text-slate-600">{score.toFixed(1)}/5.0</span>
                                <span className={`font-medium ${
                                    percentage >= 80 ? 'text-emerald-600' : 
                                    percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                                }`}>{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-20 h-1.5 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full ${
                                        percentage >= 80 ? 'bg-emerald-500' : 
                                        percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                },
            },
            {
                header: "Tổng điểm",
                cell: ({ row }) => {
                    const total = parseFloat(row.original.totalScore) || 0;
                    const maxScore = 10.0;
                    const percentage = (total / maxScore) * 100;
                    return (
                        <div className="space-y-1">
                            <div className="flex items-center justify-between text-xs">
                                <span className={`font-bold ${percentage >= 80 ? 'text-emerald-700' : percentage >= 60 ? 'text-amber-700' : 'text-rose-700'}`}>
                                    {total.toFixed(1)}/{maxScore}
                                </span>
                                <span className={`font-bold ${
                                    percentage >= 80 ? 'text-emerald-600' : 
                                    percentage >= 60 ? 'text-amber-600' : 'text-rose-600'
                                }`}>{percentage.toFixed(0)}%</span>
                            </div>
                            <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all ${
                                        percentage >= 80 ? 'bg-emerald-500' : 
                                        percentage >= 60 ? 'bg-amber-500' : 'bg-rose-500'
                                    }`}
                                    style={{ width: `${Math.min(percentage, 100)}%` }}
                                />
                            </div>
                        </div>
                    );
                },
            },
            {
                header: "Trạng thái",
                cell: ({ row }) => {
                    const statusKey = row.original.status;
                    const status = REVIEW_STATUS_CONFIG[statusKey] || {
                        label: statusKey,
                        class: "bg-gray-100 text-gray-600 border-gray-200",
                    };
                    return (
                        <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.class}`}
                        >
                            <span className="w-1.5 h-1.5 rounded-full bg-current mr-1.5" />
                            {status.label}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: () => <div className="text-right mr-4">Thao tác</div>,
                cell: ({ row }) => (
                    <div className="flex items-center justify-end gap-1">
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
                            onClick={() => onView(row.original)}
                        >
                            <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-500 hover:text-blue-600 hover:bg-blue-50"
                            onClick={() => onEdit(row.original)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                            onClick={() => onDelete(row.original)}
                        >
                            <Trash2 className="h-4 w-4" />
                        </Button>
                    </div>
                ),
            },
        ],
        [onView, onEdit, onDelete],
    );

    const table = useReactTable({
        data,
        columns,
        state: { pagination },
        pageCount: totalPages,
        manualPagination: true,
        onPaginationChange,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
    });

    return (
        <Card className="border-none shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-white px-6 py-5 border-b border-slate-100">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-end">
                    <div className="lg:col-span-3 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                            Tìm kiếm
                        </label>
                        <div className="relative group">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                            <Input
                                className="pl-9 w-full bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg h-10"
                                placeholder="Tên nhân viên..."
                                value={search}
                                onChange={(e) =>
                                    handleFilterUpdate(onSearchChange, e.target.value)
                                }
                            />
                        </div>
                    </div>

                    <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                            Tháng
                        </label>
                        <select
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            value={filterMonth}
                            onChange={(e) => handleFilterUpdate(onMonthChange, e.target.value)}
                        >
                            <option value="">Tất cả</option>
                            {MONTHS.map((m) => (
                                <option key={m.value} value={m.value}>
                                    {m.label}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-2 space-y-1.5">
                        <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
                            Năm
                        </label>
                        <select
                            className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
                            value={filterYear}
                            onChange={(e) => handleFilterUpdate(onYearChange, e.target.value)}
                        >
                            <option value="">Tất cả</option>
                            {years.map((y) => (
                                <option key={y} value={y}>
                                    {y}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="lg:col-span-5 flex items-end justify-end gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                onReset();
                                onPaginationChange({ ...pagination, pageIndex: 0 });
                            }}
                            className="flex items-center justify-center gap-2 text-slate-500 hover:text-rose-600 border-slate-200 hover:border-rose-200 rounded-lg h-10 transition-colors"
                        >
                            <RotateCcw className="h-3.5 w-3.5" />
                            <span className="text-xs font-semibold uppercase">Đặt lại</span>
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {table.getHeaderGroups().map((group) => (
                                <tr key={group.id} className="bg-slate-50/50">
                                    {group.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-6 py-3.5 text-left text-[11px] uppercase tracking-wider font-bold text-slate-500 border-b border-slate-100"
                                        >
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext(),
                                            )}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>

                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i}>
                                        {columns.map((_, j) => (
                                            <td key={j} className="px-6 py-4">
                                                <Skeleton className="h-4 w-full rounded" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : data.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="text-center py-12">
                                        <div className="flex flex-col items-center justify-center text-slate-400">
                                            <FileText className="h-10 w-10 mb-2 opacity-20" />
                                            <p className="text-sm font-medium">
                                                Không tìm thấy đánh giá nào
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="group hover:bg-indigo-50/30 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-6 py-4 text-sm leading-tight"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext(),
                                                )}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-white border-t border-slate-50 gap-4">
                    <span className="text-xs font-medium text-slate-500">
                        Trang <span className="text-slate-900">{pagination.pageIndex + 1}</span> /
                        tổng <span className="text-slate-900">{totalPages}</span>
                    </span>
                    <Pagination
                        currentPage={pagination.pageIndex + 1}
                        totalPages={totalPages}
                        onPageChange={(p) =>
                            onPaginationChange({ ...pagination, pageIndex: p - 1 })
                        }
                    />
                </div>
            </CardContent>
        </Card>
    );
}
