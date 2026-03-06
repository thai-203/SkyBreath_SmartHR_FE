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
import { Search, Edit2, Trash2, Eye } from "lucide-react";

export default function DepartmentTable({
  data,
  loading,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  departmentList,
  employeeList,
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
    [onEdit, onDelete, onViewDetail, pagination],
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
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                placeholder="Tìm kiếm..."
                value={search}
                onChange={(e) => onSearchChange(e.target.value)}
                className="pl-9 w-64"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
                value={filters.parentDepartmentId || ""}
                onChange={(e) => onFilterChange({ ...filters, parentDepartmentId: e.target.value })}
              >
                <option value="">Tất cả phòng ban cha</option>
                {departmentList.map(dept => (
                  <option key={dept.value} value={dept.value}>{dept.label}</option>
                ))}
              </select>

              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[180px]"
                value={filters.managerEmployeeId || ""}
                onChange={(e) => onFilterChange({ ...filters, managerEmployeeId: e.target.value })}
              >
                <option value="">Tất cả quản lý</option>
                {employeeList.map(emp => (
                  <option key={emp.value} value={emp.value}>{emp.label}</option>
                ))}
              </select>

              <select
                className="h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[150px]"
                value={filters.hasEmployees || ""}
                onChange={(e) => onFilterChange({ ...filters, hasEmployees: e.target.value })}
              >
                <option value="">Tình trạng NV</option>
                <option value="true">Có nhân viên</option>
                <option value="false">Không có NV</option>
              </select>

              {(search || filters.parentDepartmentId || filters.managerEmployeeId || filters.hasEmployees) && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => {
                    onSearchChange("");
                    onFilterChange({
                      parentDepartmentId: "",
                      managerEmployeeId: "",
                      hasEmployees: ""
                    });
                  }}
                  className="text-slate-500 hover:text-indigo-600"
                >
                  Xóa bộ lọc
                </Button>
              )}
            </div>
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
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
          <p className="text-sm text-slate-500">
            Hiển thị {data.length} / Trang {pagination.pageIndex + 1} của{" "}
            {totalPages}
          </p>
          <Pagination
            currentPage={pagination.pageIndex + 1}
            totalPages={totalPages}
            onPageChange={(page) =>
              onPaginationChange({ ...pagination, pageIndex: page - 1 })
            }
          />
        </div>
      </CardContent>
    </Card>
  );
}
