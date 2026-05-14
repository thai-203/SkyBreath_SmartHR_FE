"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import AuditLogTable from "./components/AuditLogTable";
import { auditService } from "@/services";
import { Select } from "@/components/common/Select";
import { DateInput } from "@/components/common/DateInput";
import { Download, RefreshCw, Search } from "lucide-react";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";
import { format, isAfter, isBefore } from "date-fns";

export default function AuditLogPage() {
  const today = new Date();
  const { success, error } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    search: "",
    fromDate: null,
    toDate: null,
    status: "",
    sortBy: "createdAt",
    sortOrder: "DESC",
  });
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const fetch = async (params = {}) => {
    setLoading(true);
    try {
      const res = await auditService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        ...params,
      });

      setData(res.data.data || []);
      setTotalPages(res.data.meta?.totalPages || 1);
    } catch (err) {
      error(
        err.response?.data?.message ||
        "Có lỗi xảy ra khi tải lịch sử hoạt động",
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const { fromDate, toDate, ...rest } = filters;
    fetch({
      ...rest,
      fromDate: fromDate ? format(fromDate, "yyyy-MM-dd") : undefined,
      toDate: toDate ? format(toDate, "yyyy-MM-dd") : undefined,
    });
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    filters.search,
    filters.fromDate,
    filters.toDate,
    filters.status,
    filters.sortBy,
    filters.sortOrder,
    error,
  ]);

  const resetFilters = () => {
    setFilters({
      search: "",
      fromDate: null,
      toDate: null,
      status: "",
      sortBy: "createdAt",
      sortOrder: "DESC",
    });
    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  const hasFilter = Object.values(filters).some(
    (value) => value !== null && value !== "",
  );

  const handleSort = (column, nextOrder) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      sortOrder:
        nextOrder ?? (prev.sortOrder === "ASC" ? "DESC" : "ASC"),
    }));
    setPagination((p) => ({ ...p, pageIndex: 0 }));
  };

  const handleFilter = () => {
    const { fromDate, toDate } = filters;
    const today = new Date();
    if (fromDate === "INVALID_DATE" || toDate === "INVALID_DATE") {
      error("Ngày không hợp lệ, vui lòng chọn lại!");
      return;
    }

    // 1️⃣ fromDate không được > hôm nay
    if (fromDate && isAfter(fromDate, today)) {
      error("Ngày bắt đầu không được lớn hơn ngày hiện tại");
      return;
    }

    // 2️⃣ toDate không được > hôm nay
    if (toDate && isAfter(toDate, today)) {
      error("Ngày kết thúc không được lớn hơn ngày hiện tại");
      return;
    }

    // 3️⃣ toDate không được < fromDate
    if (fromDate && toDate && isBefore(toDate, fromDate)) {
      error("Ngày kết thúc không được nhỏ hơn ngày bắt đầu");
      return;
    }

    setPagination({ pageIndex: 0, pageSize: 10 });
  };

  const handleExport = async () => {
    try {
      const blob = await auditService.export();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `audit_logs_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      success("Xuất dữ liệu thành công!");
    } catch (err) {
      error(err.response?.data?.message || "Xuất dữ liệu thất bại");
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Cài đặt - Lịch sử hoạt động" />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Lịch sử hoạt động
          </h1>
          <p className="text-slate-500">
            Ghi nhận các hành động quan trọng trên hệ thống
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleExport}>
            <Download className="mr-2 h-4 w-4" />
            Xuất Excel
          </Button>
          <Button variant="default" onClick={resetFilters}>
            <RefreshCw className="mr-2 h-4 w-4" />
            Làm mới danh sách
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-12 gap-4 p-4 bg-white rounded-lg border border-slate-200 items-end">
        <div className="col-span-4 relative">
          <Search className="absolute left-3 top-11 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <Input
            label="Tìm kiếm"
            placeholder="Tìm kiếm..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value })}
            className="pl-9 w-full"
          />
        </div>

        <div className="col-span-2">
          <DateInput
            label="Từ ngày"
            maxDate={today}
            value={filters.fromDate}
            onChange={(date) => setFilters({ ...filters, fromDate: date })}
          />
        </div>

        <div className="col-span-2">
          <DateInput
            label="Đến ngày"
            minDate={filters.fromDate}
            maxDate={today}
            value={filters.toDate}
            onChange={(date) => {
              setFilters({ ...filters, toDate: date });
            }}
          />
        </div>

        <div className="col-span-2">
          <Select
            label="Trạng thái"
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
            options={[
              { value: "", label: "Tất cả" },
              { value: "SUCCESS", label: "Thành công" },
              { value: "FAILED", label: "Thất bại" },
            ]}
          />
        </div>

        <div className="col-span-2">
          <Button
            disabled={!hasFilter}
            className="w-full"
            onClick={handleFilter}
          >
            Lọc dữ liệu
          </Button>
        </div>
      </div>
      <AuditLogTable
        onSort={handleSort}
        sortBy={filters.sortBy}
        sortOrder={filters.sortOrder}
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalPages={totalPages}
      />
    </div>
  );
}
