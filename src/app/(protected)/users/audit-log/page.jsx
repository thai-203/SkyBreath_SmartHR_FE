"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import AuditLogTable from "./components/AuditLogTable";
import { auditService } from "@/services";

export default function AuditLogPage() {
  const { success, error } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    const fetch = async () => {
      setLoading(true);
      try {
        const res = await auditService.getAll({
          page: pagination.pageIndex + 1,
          limit: pagination.pageSize,
          search,
        });
        console.log(res.data);

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

    fetch();
  }, [pagination.pageIndex, pagination.pageSize, search, error]);

  const handleExport = async () => {
    try {
      const blob = await auditService.export({ search });
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

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Lịch sử hoạt động</h1>
        <p className="text-slate-500">
          Ghi nhận các hành động quan trọng trên hệ thống
        </p>
      </div>

      <AuditLogTable
        data={data}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalPages={totalPages}
        onExport={handleExport}
      />
    </div>
  );
}
