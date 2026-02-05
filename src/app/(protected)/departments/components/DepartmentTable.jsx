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
import { Search, Edit2, Trash2, Eye } from "lucide-react";

export default function DepartmentTable({
    data,
    loading,
    search,
    onSearchChange,
    pagination,
    onPaginationChange,
    totalPages,
    onEdit,
    onDelete,
    onViewDetail,
}) {
    const columns = useMemo(
        () => [
            {
                accessorKey: "id",
                header: "ID",
                size: 60,
            },
            {
                accessorKey: "departmentName",
                header: "Tên phòng ban",
            },
            {
                accessorKey: "parentDepartment",
                header: "Phòng ban cha",
                cell: ({ row }) => row.original.parentDepartment?.departmentName || "-",
            },
            {
                accessorKey: "manager",
                header: "Quản lý",
                cell: ({ row }) => row.original.manager?.fullName || "-",
            },
            {
                accessorKey: "employeeCount",
                header: "Số nhân viên",
                cell: ({ row }) => (
                    <span className="font-semibold text-indigo-600">
                        {row.original.employeeCount || 0}
                    </span>
                ),
            },
            {
                id: "actions",
                header: "Thao tác",
                size: 140,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onViewDetail(row.original)}
                            title="Xem chi tiết"
                        >
                            <Eye className="h-4 w-4 text-slate-500" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row.original)}
                            title="Chỉnh sửa"
                        >
                            <Edit2 className="h-4 w-4 text-blue-500" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row.original)}
                            title="Xóa"
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                ),
            },
        ],
        [onEdit, onDelete, onViewDetail]
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
                    <CardTitle>Danh sách phòng ban</CardTitle>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input
                            placeholder="Tìm kiếm..."
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
                                            {flexRender(
                                                header.column.columnDef.header,
                                                header.getContext()
                                            )}
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
                                    <td
                                        colSpan={columns.length}
                                        className="px-4 py-8 text-center text-slate-500"
                                    >
                                        Không có dữ liệu
                                    </td>
                                </tr>
                            ) : (
                                table.getRowModel().rows.map((row) => (
                                    <tr
                                        key={row.id}
                                        className="border-b border-slate-200 hover:bg-slate-50 transition-colors"
                                    >
                                        {row.getVisibleCells().map((cell) => (
                                            <td
                                                key={cell.id}
                                                className="px-4 py-3 text-sm text-slate-700"
                                            >
                                                {flexRender(
                                                    cell.column.columnDef.cell,
                                                    cell.getContext()
                                                )}
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
