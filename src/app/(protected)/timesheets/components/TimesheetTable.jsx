"use client";

import { useMemo } from "react";
import {
    useReactTable,
    getCoreRowModel,
    getPaginationRowModel,
    flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/common/Button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Search, Eye, RefreshCw, Lock, Trash2 } from "lucide-react";
import { authService } from "@/services/auth.service";

export default function TimesheetTable({
    data,
    loading,
    search,
    onSearchChange,
    pagination,
    onPaginationChange,
    totalPages,
    onViewDetail,
    onRecalculate,
    onLock,
    onDelete,
}) {
    const columns = useMemo(
        () => [
            {
                id: "stt",
                header: "STT",
                size: 60,
                cell: ({ row }) => (
                    <span className="text-slate-500">
                        {pagination.pageIndex * pagination.pageSize + row.index + 1}
                    </span>
                ),
            },
            {
                accessorKey: "employeeCode",
                header: "Mã NV",
                size: 100,
                cell: ({ row }) => (
                    <span className="font-mono text-sm text-indigo-600">
                        {row.original.employee?.employeeCode || "-"}
                    </span>
                ),
            },
            {
                accessorKey: "fullName",
                header: "Họ và tên",
                cell: ({ row }) => (
                    <div className="font-medium text-slate-900">
                        {row.original.employee?.fullName || "-"}
                    </div>
                ),
            },
            {
                accessorKey: "department",
                header: "Phòng ban",
                cell: ({ row }) => row.original.employee?.department?.departmentName || "-",
            },
            {
                accessorKey: "totalWorkingDays",
                header: "Ngày công",
                size: 90,
                cell: ({ row }) => (
                    <span className="font-medium">{row.original.totalWorkingDays ?? 0}</span>
                ),
            },
            {
                accessorKey: "totalWorkingHours",
                header: "Giờ công",
                size: 90,
                cell: ({ row }) => (
                    <span>{row.original.totalWorkingHours ?? 0}</span>
                ),
            },
            {
                accessorKey: "overtimeHours",
                header: "Giờ OT",
                size: 80,
                cell: ({ row }) => {
                    const ot = row.original.overtimeHours ?? 0;
                    return (
                        <span className={ot > 0 ? "text-orange-600 font-medium" : "text-slate-400"}>
                            {ot}
                        </span>
                    );
                },
            },
            {
                accessorKey: "isLocked",
                header: "Trạng thái",
                size: 100,
                cell: ({ row }) => {
                    const locked = row.original.isLocked;
                    return (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${locked
                            ? "bg-rose-50 text-rose-700 border-rose-200"
                            : "bg-emerald-50 text-emerald-700 border-emerald-200"
                            }`}>
                            {locked ? "Đã khóa" : "Mở"}
                        </span>
                    );
                },
            },
            {
                id: "actions",
                header: "Thao tác",
                size: 180,
                cell: ({ row }) => (
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => onViewDetail(row.original)} title="Xem chi tiết">
                            <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        {!row.original.isLocked && (
                            <>
                                {authService.hasPermission("TIMESHEET_UPDATE") && (
                                    <Button variant="ghost" size="icon" onClick={() => onRecalculate(row.original)} title="Tính lại">
                                        <RefreshCw className="h-4 w-4 text-amber-500" />
                                    </Button>
                                )}
                                {authService.hasPermission("TIMESHEET_CREATE") && (
                                    <Button variant="ghost" size="icon" onClick={() => onDelete(row.original)} title="Xóa nhân viên">
                                        <Trash2 className="h-4 w-4 text-rose-500" />
                                    </Button>
                                )}
                            </>
                        )}
                        {authService.hasPermission("TIMESHEET_LOCK") && (
                            <>
                                {row.original.isLocked ? (
                                    <span className="text-xs text-slate-400 italic px-2">Đã khóa</span>
                                ) : (
                                    <Button variant="ghost" size="icon" onClick={() => onLock(row.original)} title="Khóa">
                                        <Lock className="h-4 w-4 text-rose-500" />
                                    </Button>
                                )}
                            </>
                        )}
                    </div>
                ),
            },
        ],
        [onViewDetail, onRecalculate, onLock, onDelete, pagination]
    );

    const table = useReactTable({
        data,
        columns,
        pageCount: totalPages,
        state: { pagination },
        onPaginationChange,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        manualPagination: true,
    });

    return (
        <Card>
            <CardHeader className="border-b border-slate-200">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <CardTitle>Bảng chấm công</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm nhân viên..."
                            value={search}
                            onChange={(e) => onSearchChange(e.target.value)}
                            className="pl-9 w-full sm:w-64"
                        />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="border-b border-slate-200 bg-slate-50">
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id}>
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-4 py-3 text-left text-sm font-medium text-slate-600"
                                            style={{ width: header.getSize() }}
                                        >
                                            {flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="border-b border-slate-200">
                                        {columns.map((_, j) => (
                                            <td key={j} className="px-4 py-3">
                                                <Skeleton className="h-5 w-full" />
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            ) : table.getRowModel().rows.length === 0 ? (
                                <tr>
                                    <td colSpan={columns.length} className="px-4 py-8 text-center text-slate-500">
                                        Không có dữ liệu bảng chấm công
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr key={row.id} className="border-b border-slate-200 hover:bg-slate-50 transition-colors">
                                        {row.getVisibleCells().map((cell) => (
                                            <td key={cell.id} className="px-4 py-3 text-sm text-slate-700">
                                                {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                            </td>
                                        ))}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-500">
                        Hiển thị {data.length} / Trang {pagination.pageIndex + 1} của {totalPages}
                    </p>
                    <Pagination
                        currentPage={pagination.pageIndex + 1}
                        totalPages={totalPages}
                        onPageChange={(page) => onPaginationChange({ ...pagination, pageIndex: page - 1 })}
                    />
                </div>
            </CardContent>
        </Card>
    );
}
