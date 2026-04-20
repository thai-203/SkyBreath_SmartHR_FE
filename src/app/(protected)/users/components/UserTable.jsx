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
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Search, Edit2, Trash2, Eye, Lock, LockOpen } from "lucide-react";
import { PermissionGate } from "@/components/common/AuthGuard";

export default function UserTable({
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
  onLock,
  onUnlock,
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
        accessorKey: "username",
        header: "Tên đăng nhập",
        size: 120,
        cell: ({ row }) => (
          <span className="font-mono text-sm text-indigo-600 font-medium">
            {row.original.username}{" "}
            {row.original.isCurrentUser && (
              <span className="ml-1 text-xs text-green-500">(Bạn)</span>
            )}
          </span>
        ),
      },
      {
        accessorKey: "email",
        header: "Email",
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-500">
              {row.original.email}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "role",
        header: "Vai trò",
        size: 100,
        cell: ({ row }) => {
          const role = row.original.userRoles[0]?.role.roleName;
          const roleColors = {
            ADMIN: "bg-red-100 text-red-800",
            MANAGER: "bg-blue-100 text-blue-800",
            HR: "bg-green-100 text-green-800",
            USER: "bg-gray-100 text-gray-800",
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[role] || "bg-slate-100 text-slate-800"}`}
            >
              {role}
            </span>
          );
        },
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        size: 110,
        cell: ({ row }) => {
          const status = row.original.status;
          const statusColors = {
            ACTIVE: "bg-green-100 text-green-800",
            INACTIVE: "bg-gray-100 text-gray-800",
            LOCKED: "bg-red-100 text-red-800",
            PENDING: "bg-yellow-100 text-yellow-800",
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-slate-100 text-slate-800"}`}
            >
              {status === "ACTIVE" && "Hoạt động"}
              {status === "INACTIVE" && "Không hoạt động"}
              {status === "LOCKED" && "Bị khóa"}
              {status === "PENDING" && "Chờ duyệt"}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: "Hành động",
        size: 150,
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onViewDetail(row.original)}
              title="Xem chi tiết"
              className="h-8 w-8 p-0"
            >
              <Eye className="h-4 w-4 text-slate-500" />
            </Button>
            <PermissionGate permission="USER_UPDATE">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit(row.original)}
                title="Chỉnh sửa"
                disabled={row.original.isCurrentUser}
                className="h-8 w-8 p-0"
              >
                <Edit2 className="h-4 w-4 text-blue-500" />
              </Button>
            </PermissionGate>
            <PermissionGate permission="USER_LOCK">
              {row.original.status === "LOCKED" ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onUnlock && onUnlock(row.original)}
                  title="Mở khóa"
                  disabled={row.original.isCurrentUser}
                  className="h-8 w-8 p-0"
                >
                  <LockOpen className="h-4 w-4 text-green-500" />
                </Button>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onLock && onLock(row.original)}
                  title="Khóa tài khoản"
                  disabled={row.original.isCurrentUser}
                  className="h-8 w-8 p-0"
                >
                  <Lock className="h-4 w-4 text-orange-500" />
                </Button>
              )}
            </PermissionGate>
            <PermissionGate permission="USER_DELETE">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete(row.original)}
                title="Xóa"
                disabled={row.original.isCurrentUser}
                className="h-8 w-8 p-0"
              >
                <Trash2 className="h-4 w-4 text-red-500" />
              </Button>
            </PermissionGate>
          </div>
        ),
      },
    ],
    [onEdit, onDelete, onViewDetail, onLock, onUnlock, pagination],
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
      <CardHeader>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle>Danh sách người dùng</CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
            <Input
              placeholder="Tìm kiếm..."
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              {table.getHeaderGroups().map((headerGroup) => (
                <tr
                  key={headerGroup.id}
                  className="border-b border-slate-200 bg-slate-50"
                >
                  {headerGroup.headers.map((header) => (
                    <th
                      key={header.id}
                      className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wide text-slate-700"
                      style={{ width: header.getSize() }}
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                            header.column.columnDef.header,
                            header.getContext(),
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
                    className="px-6 py-8 text-center text-slate-500"
                  >
                    Không có dữ liệu
                  </td>
                </tr>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <tr
                    key={row.id}
                    className="border-b border-slate-200 transition-colors hover:bg-slate-50"
                  >
                    {row.getVisibleCells().map((cell) => (
                      <td
                        key={cell.id}
                        className="px-6 py-4 text-sm"
                        style={{ width: cell.column.getSize() }}
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6">
            <Pagination
              currentPage={pagination.pageIndex + 1}
              totalPages={totalPages}
              onPageChange={(page) =>
                onPaginationChange({
                  ...pagination,
                  pageIndex: page - 1,
                })
              }
              pageSize={pagination.pageSize}
              onPageSizeChange={(size) =>
                onPaginationChange({
                  ...pagination,
                  pageSize: size,
                  pageIndex: 0,
                })
              }
            />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
