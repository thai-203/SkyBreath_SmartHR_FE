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
import { Search, Eye, Trash2, User, Clock } from "lucide-react";
import { PermissionGate } from "@/components/common/AuthGuard";

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function getInitials(name = "") {
  return name.split(" ").map((w) => w[0]).slice(-2).join("").toUpperCase();
}

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit", month: "2-digit", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}

// ─── Component ───────────────────────────────────────────────────────────────────
// data shape từ API (đã join):
// [
//   {
//     employeeId: 1,
//     employeeCode: "NV001",
//     fullName: "Nguyễn Văn An",
//     avatar: "...",
//     companyEmail: "...",
//     departmentName: "Kỹ thuật",
//     positionName: "Lập trình viên",
//     count: 3,
//     lastRegisteredAt: "2025-01-15T09:32:00",
//     faces: [{ id, imageUrl, registeredAt }, ...]
//   },
//   ...
// ]

export default function FaceDataTable({
  data,
  loading,
  search,
  onSearchChange,
  pagination,
  onPaginationChange,
  totalPages,
  onViewDetail,
  onDeleteEmployee,
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
        cell: ({ getValue }) => (
          <span className="font-mono text-sm text-indigo-600">{getValue() || "-"}</span>
        ),
      },
      {
        id: "avatar",
        header: "Ảnh",
        size: 60,
        cell: ({ row }) => (
          <div className="h-9 w-9 rounded-full bg-slate-100 flex items-center justify-center border border-slate-200 text-xs font-medium text-indigo-600 overflow-hidden">
            {row.original.avatar ? (
              <img
                src={row.original.avatar}
                alt={row.original.fullName}
                className="h-full w-full object-cover"
                onError={(e) => { e.target.onerror = null; e.target.style.display = "none"; }}
              />
            ) : (
              getInitials(row.original.fullName)
            )}
          </div>
        ),
      },
      {
        id: "fullName",
        header: "Họ và tên",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900">{row.original.fullName}</div>
            <div className="text-xs text-slate-500">{row.original.companyEmail || "-"}</div>
          </div>
        ),
      },
      {
        accessorKey: "departmentName",
        header: "Phòng ban",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "positionName",
        header: "Chức vụ",
        cell: ({ getValue }) => getValue() || "-",
      },
      {
        accessorKey: "count",
        header: "Số mẫu",
        size: 80,
        cell: ({ getValue }) => (
          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200">
            {getValue()}
          </span>
        ),
      },
      {
        accessorKey: "lastRegisteredAt",
        header: "Đăng ký lần cuối",
        cell: ({ getValue }) => (
          <div className="flex items-center gap-1.5 text-slate-500">
            <Clock className="h-3 w-3 shrink-0" />
            {formatDateTime(getValue())}
          </div>
        ),
      },
      {
        id: "actions",
        header: "Thao tác",
        size: 100,
        cell: ({ row }) => (
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => onViewDetail(row.original)}
              title="Xem chi tiết"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            <PermissionGate permission="ATTENDANCE_FACE_DATA_DELETE">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => onDeleteEmployee(row.original)}
                title="Xoá toàn bộ"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    [onViewDetail, onDeleteEmployee, pagination]
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
              placeholder="Tìm theo tên, mã NV, phòng ban..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-9 w-full sm:w-72"
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
                    <div className="flex flex-col items-center gap-2">
                      <User className="h-10 w-10 text-slate-300" />
                      <p>{search ? "Không tìm thấy nhân viên phù hợp" : "Chưa có dữ liệu khuôn mặt"}</p>
                    </div>
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 hover:bg-slate-50 transition-colors cursor-pointer"
                    onClick={() => onViewDetail(row.original)}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-4 py-3 text-sm text-slate-700"
                        onClick={cell.column.id === "actions" ? (e) => e.stopPropagation() : undefined}
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
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">
            Hiển thị {data.length} / Trang {pagination.pageIndex + 1} của {totalPages || 1}
          </p>
          <Pagination
            currentPage={pagination.pageIndex + 1}
            totalPages={totalPages || 1}
            onPageChange={(page) =>
              onPaginationChange({ ...pagination, pageIndex: page - 1 })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}