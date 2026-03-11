"use client";

import React, { useMemo } from "react";
import {
  useReactTable,
  getCoreRowModel,
  flexRender,
} from "@tanstack/react-table";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Edit2, Trash2, Layers, Info } from "lucide-react";

export default function ShiftGroupTable({
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
        accessorKey: "groupName",
        header: "Tên nhóm ca",
        cell: ({ row }) => (
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 rounded-lg text-blue-600 hidden sm:block">
              <Layers size={16} />
            </div>
            <span className="font-semibold text-slate-700">
              {row.original.groupName}
            </span>
          </div>
        ),
      },
      {
        accessorKey: "description",
        header: "Mô tả",
        cell: ({ row }) => (
          <span className="text-slate-500 text-sm italic">
            {row.original.description || "—"}
          </span>
        ),
      },
      {
        id: "actions",
        header: () => <div className="text-right">Thao tác</div>,
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center justify-end gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => onEdit(row.original)}
              title="Chỉnh sửa"
            >
              <Edit2 size={16} />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              onClick={() => onDelete(row.original)}
              title="Xóa"
            >
              <Trash2 size={16} />
            </Button>
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
    <div className="flex flex-col h-full bg-white">
      <div className="overflow-x-auto">
        <table className="w-full border-separate border-spacing-0">
          <thead>
            {table.getHeaderGroups().map((headerGroup) => (
              <tr key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <th
                    key={header.id}
                    className="px-6 py-4 text-left text-[11px] font-bold uppercase tracking-wider text-slate-500 border-b border-slate-100 bg-slate-50/50"
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
          <tbody className="divide-y divide-slate-50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {columns.map((_, j) => (
                    <td key={j} className="px-6 py-4">
                      <Skeleton className="h-5 w-full rounded-md" />
                    </td>
                  ))}
                </tr>
              ))
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={columns.length} className="px-6 py-16 text-center">
                  <div className="flex flex-col items-center gap-2 text-slate-400">
                    <Info size={40} strokeWidth={1} />
                    <p className="text-sm font-medium">Không tìm thấy nhóm ca nào</p>
                  </div>
                </td>
              </tr>
            ) : (
              table.getRowModel().rows.map((row) => (
                <tr
                  key={row.id}
                  className="group hover:bg-slate-50 transition-all duration-200"
                >
                  {row.getVisibleCells().map((cell) => (
                    <td
                      key={cell.id}
                      className="px-6 py-4 text-sm align-middle"
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

      {/* Footer Pagination */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 bg-white">
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <span className="text-slate-900">{data.length}</span> kết quả
          tại trang <span className="text-slate-900">{pagination.pageIndex + 1}</span>
        </div>
        <Pagination table={table} />
      </div>
    </div>
  );
}