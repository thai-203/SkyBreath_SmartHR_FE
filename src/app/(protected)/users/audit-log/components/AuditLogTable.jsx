"use client";

import { useMemo, useState } from "react";
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
import { Eye } from "lucide-react";
import { Modal } from "@/components/common/Modal";

export default function AuditLogTable({
  data,
  loading,
  pagination,
  onPaginationChange,
  totalPages,
  onSort,
  sortBy,
  sortOrder,
}) {
  const [selected, setSelected] = useState(null);

  const columns = useMemo(
    () => [
      {
        accessorKey: "actor",
        header: "Người thực hiện",
        // size: 60,
        cell: ({ row }) => (
          <div>
            <div className="font-medium text-slate-900">
              {row.original.user?.username || "-"}
            </div>
            <div className="text-xs text-slate-500">
              {row.original.user?.email || "-"}
            </div>
          </div>
        ),
      },
      {
        accessorKey: "createdAt",
        header: () => {
          const isActive = sortBy === "createdAt";
          const nextOrder =
            isActive && sortOrder === "ASC" ? "DESC" : "ASC";

          return (
            <button
              type="button"
              onClick={() => onSort?.("createdAt", nextOrder)}
              className="inline-flex items-center gap-2 text-left hover:text-slate-900"
              title="Sắp xếp theo thời gian"
            >
              <span>Thời gian</span>
              <span className="text-xs text-slate-400">
                {isActive ? (sortOrder === "ASC" ? "▲" : "▼") : "⇅"}
              </span>
            </button>
          );
        },
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return d.toLocaleString();
        },
      },
      {
        accessorKey: "ip",
        header: "IP",
        cell: ({ row }) => row.original.requestIp || "-",
      },
      {
        accessorKey: "device",
        header: "Thiết bị",
        cell: ({ row }) => (
          <>
            {row.original.userAgent?.browser +
              "/" +
              row.original.userAgent?.os || "-"}
            <br />
            {row.original.userAgent?.device || "-"}
          </>
        ),
      },
      {
        accessorKey: "status",
        header: "Trạng thái",
        cell: ({ row }) => {
          const status = row.original.status;
          const statusColors = {
            SUCCESS: "bg-green-100 text-green-800",
            FAILED: "bg-red-100 text-red-800",
          };
          return (
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[status] || "bg-slate-100 text-slate-800"}`}
            >
              {status === "SUCCESS" && "Thành công"}
              {status === "FAILED" && "Thất bại"}
            </span>
          );
        },
      },
      {
        id: "details",
        header: "Chi tiết",
        cell: ({ row }) => (
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSelected(row.original)}
            >
              <Eye className="h-4 w-4" />
            </Button>
          </div>
        ),
        size: 100,
      },
    ],
    [pagination, onSort, sortBy, sortOrder],
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
    <>
      <Card>
        <CardHeader className="border-b border-slate-200">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <CardTitle>Lịch sử hoạt động</CardTitle>
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

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Chi tiết sự kiện"
        size="lg"
      >
        {selected && (
          <div className="space-y-4 max-h-[70vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
            <div className="text-sm text-slate-700">
              <strong>Thời gian:</strong>{" "}
              {new Date(selected.createdAt).toLocaleString()}
            </div>
            <div className="text-sm text-slate-700">
              <strong>Người thực hiện:</strong> {selected.user?.username || "-"}
            </div>
            <div className="text-sm text-slate-700">
              <strong>IP:</strong> {selected.requestIp || "-"}
            </div>
            <div>
              <pre className="whitespace-pre-wrap rounded bg-slate-50 p-4 text-sm text-slate-700 border border-slate-200">
                {JSON.stringify(selected || {}, null, 2)}
              </pre>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
