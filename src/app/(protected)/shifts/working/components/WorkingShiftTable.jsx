"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/common/Button";
import { PermissionGate } from "@/components/common/AuthGuard";
import { Skeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Edit2, Trash2, Clock, CalendarDays } from "lucide-react";

export default function WorkingShiftTable({
  data,
  loading,
  pagination,
  onPaginationChange,
  totalPages,
  onEdit,
  onDelete,
}) {
  const columns = useMemo(
    () => [
      {
        id: "stt",
        header: "STT",
        size: 70,
        cell: ({ row }) => (
          <div className="font-medium text-slate-400 pl-2">
            {pagination.pageIndex * pagination.pageSize + row.index + 1}
          </div>
        ),
      },
      {
        accessorKey: "shiftName",
        header: "Tên ca làm việc",
        cell: ({ row }) => (
          <div className="flex flex-col">
            <span className="font-semibold text-slate-700">{row.original.shiftName}</span>
            <span className="text-[11px] text-slate-400 sm:hidden">
              {row.original.group?.groupName || "Không thuộc nhóm"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "group",
        header: "Nhóm ca",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400"></div>
            <span className="text-slate-600 font-medium">
              {row.original.group?.groupName || "-"}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "time",
        header: "Khung giờ",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-slate-600 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100 w-fit">
            <Clock size={14} className="text-blue-500" />
            <span className="font-mono text-xs font-bold">
              {row.original.startTime} - {row.original.endTime}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "breakTime",
        header: "Nghỉ giữa ca",
        cell: ({ row }) => {
          const { breakStartTime, breakEndTime } = row.original;
          if (!breakStartTime || !breakEndTime) return <span className="text-slate-300 italic text-xs">Không có</span>;
          return (
            <span className="text-xs text-slate-500 underline decoration-slate-200 underline-offset-4">
              {breakStartTime} - {breakEndTime}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right">Thao tác</div>,
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <PermissionGate permission="SHIFT_UPDATE">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                onClick={() => onEdit(row.original)}
                title="Chỉnh sửa"
              >
                <Edit2 size={16} />
              </Button>
            </PermissionGate>
            <PermissionGate permission="SHIFT_DELETE">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                onClick={() => onDelete(row.original)}
                title="Xóa"
              >
                <Trash2 size={16} />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, pagination]
  );

  const table = useReactTable({
    data,
    columns,
    pageCount: totalPages,
    state: { pagination },
    onPaginationChange,
    getCoreRowModel: getCoreRowModel(),
    manualPagination: true,
  });

  return (
    <div className="flex flex-col h-full">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-4 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50 first:rounded-tl-xl last:rounded-tr-xl"
                    style={{ width: header.getSize() }}
                  >
                    {flexRender(header.column.columnDef.header, header.getContext())}
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
                    <td key={j} className="px-4 py-4">
                      <Skeleton className="h-5 w-full rounded-md" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-4 py-16">
                  <div className="flex flex-col items-center justify-center text-slate-400 gap-2">
                    <CalendarDays size={48} strokeWidth={1} className="text-slate-200" />
                    <p className="text-sm">Chưa có dữ liệu ca làm việc</p>
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
                      className="px-4 py-4 text-sm align-middle"
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 bg-slate-50/50 border-t border-slate-100">
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <span className="text-slate-900">{data.length}</span> trên trang <span className="text-slate-900">{pagination.pageIndex + 1}</span> của <span className="text-slate-900">{totalPages}</span>
        </div>
        <Pagination table={table} />
      </div>
    </div>
  );
}