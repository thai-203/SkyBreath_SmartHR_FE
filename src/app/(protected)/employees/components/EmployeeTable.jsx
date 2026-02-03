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
import { Search, Edit2, Trash2, User } from "lucide-react";

const BACKEND_URL = "http://localhost:3000";

export default function EmployeeTable({
    data,
    loading,
    search,
    onSearchChange,
    pagination,
    onPaginationChange,
    totalPages,
    onEdit,
    onDelete,
}) {
    const columns = useMemo(
        () => [
            {
                accessorKey: "avatar",
                header: "Ảnh",
                size: 60,
                cell: ({ row }) => (
                    <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {row.original.avatar ? (
                            <img
                                src={row.original.avatar.startsWith('http') ? row.original.avatar : `${BACKEND_URL}/${row.original.avatar}`}
                                alt={row.original.fullName}
                                className="h-full w-full object-cover"
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = ""; // Fallback will show the User icon
                                }}
                            />
                        ) : (
                            <User className="h-5 w-5 text-slate-400" />
                        )}
                    </div>
                )
            },
            {
                accessorKey: "fullName",
                header: "Họ và tên",
                cell: ({ row }) => (
                    <div>
                        <div className="font-medium text-slate-900">{row.original.fullName}</div>
                        <div className="text-xs text-slate-500">{row.original.companyEmail || row.original.personalEmail}</div>
                    </div>
                )
            },
            {
                accessorKey: "department",
                header: "Phòng ban",
                cell: ({ row }) => row.original.department?.departmentName || "-",
            },
            {
                accessorKey: "position",
                header: "Chức vụ",
                cell: ({ row }) => row.original.position?.positionName || "-",
            },
            {
                accessorKey: "employmentStatus",
                header: "Trạng thái",
                cell: ({ row }) => {
                    const status = row.original.employmentStatus;
                    const colors = {
                        ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
                        PROBATION: "bg-amber-50 text-amber-700 border-amber-200",
                        ON_LEAVE: "bg-blue-50 text-blue-700 border-blue-200",
                        TERMINATED: "bg-rose-50 text-rose-700 border-rose-200",
                    };
                    const labels = {
                        ACTIVE: "Hoạt động",
                        PROBATION: "Thử việc",
                        ON_LEAVE: "Nghỉ phép",
                        TERMINATED: "Đã nghỉ",
                    };
                    return (
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${colors[status] || "bg-slate-50 text-slate-700 border-slate-200"}`}>
                            {labels[status] || status}
                        </span>
                    );
                }
            },
            {
                id: "actions",
                header: "Thao tác",
                size: 100,
                cell: ({ row }) => (
                    <div className="flex items-center gap-2">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onEdit(row.original)}
                        >
                            <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onDelete(row.original)}
                        >
                            <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                    </div>
                ),
            },
        ],
        [onEdit, onDelete]
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
                    <CardTitle>Danh sách nhân viên</CardTitle>
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
