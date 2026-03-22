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
} from "lucide-react";

// Cấu hình nhãn loại hợp đồng
const contractTypeLabels = {
  probation: "Thử việc",
  internship: "Học việc",
  fixed_term: "Có thời hạn",
  permanent: "Không thời hạn",
};

// Cấu hình trạng thái hợp đồng
const contractStatusConfig = {
  active: {
    label: "Đang hiệu lực",
    class: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  terminated: {
    label: "Đã chấm dứt",
    class: "bg-rose-100 text-rose-700 border-rose-200",
  },
  expired: {
    label: "Hết hạn",
    class: "bg-amber-100 text-amber-700 border-amber-200",
  },
};

export default function ContractTable({
  data = [],
  loading,
  search,
  onSearchChange,
  filterType,
  onTypeChange,
  filterStatus,
  onStatusChange,
  onReset,
  // pagination prop comes from parent; default to first page of 10 items
  pagination = { pageIndex: 0, pageSize: 10 },
  onPaginationChange,
  totalPages,
  onView,
  onEdit,
  onDelete,
  onTerminate,
}) {
  // ensure pageSize always 10 regardless of parent
  const fixedPageSize = 10;
  if (pagination.pageSize !== fixedPageSize) {
    pagination = { ...pagination, pageSize: fixedPageSize };
  }
  /**
   * Logic: Khi thay đổi bất kỳ bộ lọc nào (Search, Type, Status),
   * ta sẽ đưa pageIndex về 0 để tránh lỗi hiển thị trang trống.
   */
  const handleFilterUpdate = (updateFn, value) => {
    updateFn(value);
    onPaginationChange({ ...pagination, pageIndex: 0 });
  };

  const columns = useMemo(
    () => [
      {
        accessorKey: "contractNumber",
        header: "Số hợp đồng",
        cell: ({ row }) => (
          <span className="font-mono font-medium text-slate-600">
            {row.original.contractNumber || `#${row.original.id}`}
          </span>
        ),
      },
      {
        header: "Nhân viên",
        cell: ({ row }) => {
          const name = row.original.employee?.fullName || "Chưa xác định";
          return (
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 border border-indigo-100 uppercase text-xs font-bold">
                {name.charAt(0)}
              </div>
              <div className="flex flex-col">
                <span className="font-medium text-slate-900">{name}</span>
                <span className="text-[11px] text-slate-500">
                  {row.original.position || "Nhân viên"}
                </span>
              </div>
            </div>
          );
        },
      },
      {
        header: "Loại hợp đồng",
        cell: ({ row }) => {
          const typeKey = row.original.contractType?.toLowerCase();
          return (
            <span className="text-sm text-slate-700 font-medium">
              {contractTypeLabels[typeKey] || row.original.contractType}
            </span>
          );
        },
      },
      {
        header: "Thời hạn",
        cell: ({ row }) => (
          <div className="flex items-center gap-2 text-xs text-slate-600">
            <Calendar className="h-3 w-3 text-slate-400" />
            <span>
              {row.original.startDate
                ? new Date(row.original.startDate).toLocaleDateString("vi-VN")
                : "-"}
            </span>
            <span className="text-slate-300">→</span>
            <span>
              {row.original.endDate
                ? new Date(row.original.endDate).toLocaleDateString("vi-VN")
                : "∞"}
            </span>
          </div>
        ),
      },
      {
        header: "Trạng thái",
        cell: ({ row }) => {
          const statusKey = row.original.contractStatus?.toLowerCase();
          const status = contractStatusConfig[statusKey] || {
            label: row.original.contractStatus,
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
        header: "Ngày chấm dứt",
        cell: ({ row }) => {
          const dateStr = row.original.terminationDate;
          if (!dateStr) return "-";
          const date = new Date(dateStr);
          const formatted = date.toLocaleDateString("vi-VN");
          const isFuture = date > new Date();
          return (
            <span
              className={
                isFuture ? "text-yellow-600 font-medium" : "text-slate-500"
              }
            >
              {formatted}
              {isFuture ? " (sắp)" : ""}
            </span>
          );
        },
      },
      {
        id: "actions",
        header: () => <div className="text-right mr-4">Thao tác</div>,
        cell: ({ row }) => {
          const isActive =
            row.original.contractStatus?.toLowerCase() === "active";
          return (
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
              {isActive && (
                <Button
                  size="icon"
                  variant="ghost"
                  className="h-8 w-8 text-orange-500 hover:bg-orange-50"
                  title="Chấm dứt hợp đồng"
                  onClick={() => onTerminate(row.original)}
                >
                  <FileText className="h-4 w-4" />
                </Button>
              )}
              <Button
                size="icon"
                variant="ghost"
                className="h-8 w-8 text-slate-400 hover:text-rose-600 hover:bg-rose-50"
                onClick={() => onDelete(row.original)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          );
        },
      },
    ],
    [onView, onEdit, onDelete, onTerminate],
  );

  const table = useReactTable({
    data,
    columns,
    state: {
      pagination: {
        ...pagination,
        pageSize: 1, // Ép hiển thị mỗi trang 1 dòng
      },
    },
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
          {/* Tìm kiếm */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
              Tìm kiếm
            </label>
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
              <Input
                className="pl-9 w-full bg-slate-50 border-slate-200 focus:bg-white transition-all rounded-lg h-10"
                placeholder="Mã HĐ, tên nhân viên..."
                value={search}
                onChange={(e) =>
                  handleFilterUpdate(onSearchChange, e.target.value)
                }
              />
            </div>
          </div>

          {/* Loại hợp đồng */}
          <div className="lg:col-span-3 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
              Loại hợp đồng
            </label>
            <select
              className="w-full h-10 px-3 bg-slate-50 border border-slate-200 rounded-lg text-sm text-slate-600 focus:outline-none focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none cursor-pointer"
              value={filterType}
              onChange={(e) => handleFilterUpdate(onTypeChange, e.target.value)}
            >
              <option value="">Tất cả loại hình</option>
              {Object.entries(contractTypeLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Trạng thái */}
          <div className="lg:col-span-4 space-y-1.5">
            <label className="text-[11px] font-bold text-slate-400 uppercase ml-1">
              Trạng thái
            </label>
            <div className="flex flex-wrap gap-2">
              {Object.entries(contractStatusConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => handleFilterUpdate(onStatusChange, key)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                    filterStatus === key
                      ? `${config.class} border-current ring-2 ring-offset-1 ring-current/10`
                      : "bg-white text-slate-500 border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          {/* Nút Reset */}
          <div className="lg:col-span-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onReset();
                onPaginationChange({ ...pagination, pageIndex: 0 });
              }}
              className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-rose-600 border-slate-200 hover:border-rose-200 rounded-lg h-10 transition-colors"
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
                Array.from({ length: 1 }).map((_, i) => (
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
                        Không tìm thấy hợp đồng nào
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

        {/* Footer Phân trang */}
        <div className="flex flex-col sm:flex-row justify-between items-center px-6 py-4 bg-white border-t border-slate-50 gap-4">
          <span className="text-xs font-medium text-slate-500">
            Hợp đồng số{" "}
            <span className="text-slate-900">{pagination.pageIndex + 1}</span> /
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
