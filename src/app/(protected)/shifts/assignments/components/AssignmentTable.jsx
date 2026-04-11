"use client";

import { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  getPaginationRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/common/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Edit2, Eye, Trash2, Calendar } from "lucide-react";
import { cn } from "@/lib/utils"; // Giả định bạn dùng shadcn utility

export default function AssignmentTable({
  data = [],
  loading,
  pagination,
  onPaginationChange,
  totalPages,
  onView,
  onEdit,
  onDelete,
}) {
  const columns = useMemo(
    () => [
      {
        id: "stt",
        header: "STT",
        size: 50,
        cell: ({ row }) => (
          <span className="font-medium text-slate-400">
            {(pagination.pageIndex * pagination.pageSize + row.index + 1).toString().padStart(2, '0')}
          </span>
        ),
      },
      {
        accessorKey: "assignmentName",
        header: "Thông tin bảng phân ca",
        size: 250,
        cell: ({ row }) => (
          <div className="flex flex-col gap-0.5">
            <span className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors">
              {row.original.assignmentName || "Chưa đặt tên"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "appliedShifts",
        header: "Ca làm việc",
        cell: ({ row }) => (
          <div className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
            {row.original.appliedShifts || "-"}
          </div>
        ),
      },
      {
        id: "effectiveRange",
        header: "Thời gian áp dụng",
        size: 180,
        cell: ({ row }) => {
          const from = row.original.effectiveFrom || "-";
          const to = row.original.effectiveTo || "-";
          return (
            <div className="flex flex-col text-xs gap-1">
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 w-6">Từ</span>
                <span className="text-slate-700 font-medium">{from}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold uppercase text-slate-400 w-6">Đến</span>
                <span className="text-slate-700 font-medium">{to}</span>
              </div>
            </div>
          );
        },
      },
      {
        accessorKey: "appliedDepartments",
        header: "Phòng ban",
        cell: ({ row }) => (
            <span className="text-sm text-slate-600 line-clamp-2 max-w-[150px]">
                {row.original.appliedDepartments || "-"}
            </span>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 140,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-slate-100 hover:text-slate-900"
              onClick={() => onView(row.original)}
              title="Xem chi tiết"
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
              onClick={() => onEdit(row.original)}
              title="Chỉnh sửa"
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <div className="w-px h-4 bg-slate-200 mx-1" />
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-red-500 hover:bg-red-50 hover:text-red-600"
              onClick={() => onDelete(row.original)}
              title="Hủy"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ),
      },
    ],
    [onView, onEdit, onDelete, pagination],
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
    <Card className="shadow-sm border-slate-200 overflow-hidden">
      <CardHeader className="bg-white px-6 py-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-bold text-slate-800">Danh sách phân ca</CardTitle>
          <span className="text-xs font-medium px-2 py-1 bg-slate-100 text-slate-600 rounded">
            Tổng: {data.length} bản ghi
          </span>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              {table.getHeaderGroups().map((hg) => (
                <tr key={hg.id} className="bg-slate-50/50">
                  {hg.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3.5 text-left text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200"
                      style={{ width: header.getSize() }}
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
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((_, j) => (
                      <td key={j} className="px-6 py-4">
                        <Skeleton className="h-4 w-full rounded-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : table.getRowModel().rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={columns.length}
                    className="px-6 py-12 text-center"
                  >
                    <div className="flex flex-col items-center gap-2">
                        <div className="h-12 w-12 rounded-full bg-slate-50 flex items-center justify-center">
                            <Calendar className="h-6 w-6 text-slate-300" />
                        </div>
                        <p className="text-slate-400 text-sm">Không tìm thấy dữ liệu phù hợp</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="group hover:bg-blue-50/30 transition-all duration-200"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-sm align-middle"
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
        
        {/* Footer Pagination Area */}
        <div className="flex items-center justify-between border-t border-slate-200 bg-white px-6 py-4">
          <div className="text-sm text-slate-500">
            Đang hiển thị <span className="font-semibold text-slate-700">{data.length}</span> kết quả
          </div>
          <div className="flex items-center gap-6">
            <div className="text-xs text-slate-400">
                Trang <span className="text-slate-900 font-medium">{pagination.pageIndex + 1}</span> / {totalPages}
            </div>
            <Pagination table={table} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}