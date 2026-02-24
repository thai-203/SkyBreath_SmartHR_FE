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
import { Input } from "@/components/common/Input";
import { Skeleton } from "@/components/common/Skeleton";
import { Pagination } from "@/components/common/Pagination";
import { Search, Eye } from "lucide-react";
import { Modal } from "@/components/common/Modal";

export default function AuditLogTable({
  data,
  loading,
  search,
  onSearchChange,
  pagination,
  onPaginationChange,
  totalPages,
  onExport,
}) {
  const [selected, setSelected] = useState(null);

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
        accessorKey: "createdAt",
        header: "Thời gian",
        cell: ({ row }) => {
          const d = new Date(row.original.createdAt);
          return d.toLocaleString();
        },
      },
      {
        accessorKey: "actor",
        header: "Người thực hiện",
        cell: ({ row }) =>
          row.original.user?.username || row.original.user || "-",
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
    [pagination],
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
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  placeholder="Tìm kiếm (người, hành động, đối tượng)..."
                  value={search}
                  onChange={(e) => onSearchChange(e.target.value)}
                  className="pl-9 w-full sm:w-72"
                />
              </div>
              <Button variant="outline" onClick={onExport}>
                Xuất CSV
              </Button>
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

      <Modal
        isOpen={!!selected}
        onClose={() => setSelected(null)}
        title="Chi tiết sự kiện"
        size="lg"
      >
        {selected && (
          <div className="space-y-4">
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
