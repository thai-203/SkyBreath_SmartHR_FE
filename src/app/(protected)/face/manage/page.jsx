"use client";

import { useState, useEffect, useCallback } from "react";
import { Camera, ShieldCheck, Users } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { faceService } from "@/services";

import FaceDataTable from "./components/FaceDataTable";
import FaceDataDetailModal from "./components/FaceDataDetailModal";
import FaceDataDeleteModal from "./components/FaceDataDeleteModal";

const TOTAL_EMPLOYEES = 12;

// ─── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ icon: Icon, label, value, sub, colorClass }) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 p-5 flex items-center gap-4">
      <div
        className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${colorClass}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        <p className="text-2xl font-bold tracking-tight text-slate-900 tabular-nums">
          {value}
        </p>
        {sub && <p className="text-xs text-slate-400 mt-0.5">{sub}</p>}
      </div>
    </div>
  );
}

// ─── Page ────────────────────────────────────────────────────────────────────────
export default function FaceDataManagePage() {
  const { success, error: toastError } = useToast();

  // Data state
  const [groups, setGroups] = useState([]);
  const [totalFaces, setTotalFaces] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [metaData, setMetaData] = useState(null);

  // UI state
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = useState(0);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Selection state
  const [detailGroup, setDetailGroup] = useState(null);
  const [deleteGroup, setDeleteGroup] = useState(null);

  const fetchMetadata = useCallback(async () => {
    try {
      const res = await faceService.getFaceManagementMetaData();
      setMetaData(res?.data);
    } catch (err) {
      console.error("fetchFaceMetadata:", err);
    }
  }, []);

  const fetchFaceData = useCallback(async () => {
    setLoading(true);
    try {
      const result = await faceService.getAllFaces({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: search || undefined,
      });
      console.log(result);

      const data = result.data || {};
      setGroups(data.items || []);
      setTotalPages(data.totalPages || 0);
      setTotalFaces(data.totalFaces || 0);
    } catch (error) {
      toastError("Không thể tải dữ liệu khuôn mặt");
    } finally {
      setLoading(false);
    }
  }, [pagination, search, toastError]);

  useEffect(() => {
    fetchMetadata();
    fetchFaceData();
  }, [fetchFaceData, fetchMetadata]);

  const registeredCount = groups.length;

  // Handlers
  const handleViewDetail = async (group) => {
    setLoading(true);
    try {
      const result = await faceService.getByEmployeeId(group.employeeId);
      setDetailGroup(result.data || group);
      setIsDetailOpen(true);
    } catch (error) {
      toastError("Không thể tải chi tiết dữ liệu khuôn mặt");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAllForEmployee = (employee) => {
    setDeleteGroup(employee);
    setIsDeleteOpen(true);
  };

  const confirmDelete = async () => {
    setSubmitting(true);
    try {
      await faceService.deleteFacesByEmployee(deleteGroup.employeeId);
      setIsDeleteOpen(false);
      success("Đã xoá ảnh dữ liệu sinh trắc của nhân viên");
      fetchMetadata();
      fetchFaceData();
    } catch (err) {
      toastError("Không thể xoá dữ liệu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
            <Camera className="h-5 w-5" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Quản lý Face Data
            </h1>
            <p className="text-sm text-slate-500">
              Theo dõi và quản lý dữ liệu khuôn mặt đã đăng ký cho hệ thống chấm
              công
            </p>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={Users}
          label="Đã đăng ký"
          value={registeredCount}
          sub={`trên tổng ${metaData?.total} nhân viên`}
          colorClass="bg-indigo-50 text-indigo-600"
        />
        <StatCard
          icon={Camera}
          label="Tổng mẫu ảnh"
          value={totalFaces}
          sub="khuôn mặt đã lưu"
          colorClass="bg-emerald-50 text-emerald-600"
        />
        <StatCard
          icon={ShieldCheck}
          label="Tỷ lệ đăng ký"
          value={`${metaData?.total > 0 ? Math.round((registeredCount / metaData?.total) * 100) : 0}%`}
          sub={`${metaData?.total - registeredCount} chưa đăng ký`}
          colorClass="bg-amber-50 text-amber-600"
        />
      </div>

      {/* Table */}
      <FaceDataTable
        data={groups}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalPages={totalPages}
        onViewDetail={handleViewDetail}
        onDeleteEmployee={handleDeleteAllForEmployee}
      />

      {/* Detail modal */}
      <FaceDataDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        group={detailGroup}
        onDeleteAll={handleDeleteAllForEmployee}
      />

      {/* Delete confirm modal */}
      <FaceDataDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
        group={deleteGroup}
        loading={submitting}
      />
    </div>
  );
}
