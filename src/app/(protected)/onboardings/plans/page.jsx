"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  onboardingsService,
  employeesService,
  departmentsService,
} from "@/services";
import { getProgressDisplayMeta } from "@/lib/onboarding-status";
import { useToast } from "@/components/common/Toast";
import { PermissionGate } from "@/components/common/AuthGuard";
import {
  FileDown,
  Plus,
  Users,
  ClipboardList,
  CheckCircle2,
  Search,
} from "lucide-react";

import OnboardingStatsCard from "./components/OnboardingStatsCard";
import OnboardingPlansTable from "./components/OnboardingPlansTable";
import CreatePlanModal from "./components/CreatePlanModal";
import OnboardingDetailView from "./components/OnboardingDetailView";

/* ===================== HELPERS ===================== */

const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

/* ===================== COMPONENT ===================== */

export default function OnboardingPage() {
  const toast = useToast();

  const [showCreatePlan, setShowCreatePlan] = useState(false);

  const [progress, setProgress] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [templates, setTemplates] = useState([]);

  const [stats, setStats] = useState({
    newEmployeesLast30Days: 0,
    inProgress: 0,
    completed: 0,
    growthRate: 0,
  });

  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [editingPlan, setEditingPlan] = useState(null);
  const [exportLoading, setExportLoading] = useState(false);

  // pagination state handled inside table; server will return full list

  /* ===================== FETCH DATA ===================== */

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [progsRes, statsRes, empRes, depRes, tmpRes] = await Promise.all([
          onboardingsService.getProgress(),
          onboardingsService.getProgressStats(),
          employeesService.getEmployeeNoPlanId(),
          departmentsService.getList(),
          onboardingsService.getPlanTemplates(),
        ]);

        setProgress(normalizeList(progsRes?.data));
        // meta no longer used
        setEmployees(normalizeList(empRes?.data));
        setDepartments(normalizeList(depRes?.data));
        setTemplates(normalizeList(tmpRes?.data));
        setStats({
          newEmployeesLast30Days: statsRes?.data?.newEmployeesLast30Days || 0,
          inProgress: statsRes?.data?.inProgress || 0,
          completed: statsRes?.data?.completed || 0,
          growthRate: statsRes?.data?.growthRate || 0,
        });
      } catch (err) {
        console.error("Onboarding fetch error:", err);
        toast.error("Lỗi khi tải dữ liệu hội nhập");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [refreshKey]);

  const handlePlanCreated = () => {
    setShowCreatePlan(false);
    setRefreshKey((prev) => prev + 1);
    toast.success("Tạo kế hoạch thành công");
  };

  const handlePlanUpdate = () => {
    setEditingPlan(null);
    setSelectedPlan(null);
    setRefreshKey((prev) => prev + 1);
    toast.success("Kiểm tra và cập nhật kế hoạch thành công");
  };

  const handleEditPlan = async (progressItem) => {
    if (!progressItem?.id || !getProgressDisplayMeta(progressItem).status) {
      return;
    }

    try {
      const planId = progressItem.planId || progressItem.plan?.id;
      if (!planId) {
        toast.error("Không tìm thấy dữ liệu kế hoạch để chỉnh sửa");
        return;
      }

      const planRes = await onboardingsService.getPlanById(planId);
      const planData = planRes?.data || {};

      setEditingPlan({
        ...planData,
        employee: progressItem.employee,
        employeeId: progressItem.employeeId,
        startDate: progressItem.startDate,
        planId,
      });
      setSelectedPlan(null);
    } catch (err) {
      console.error("Load edit plan error:", err);
      toast.error("Không thể mở màn hình chỉnh sửa kế hoạch");
    }
  };

  /* ===================== SAFE DATA ===================== */

  const safeProgress = useMemo(
    () => (Array.isArray(progress) ? progress : []),
    [progress],
  );

  /* ===================== EXPORT HANDLER ===================== */
  const handleExport = async () => {
    setExportLoading(true);
    try {
      const blob = await onboardingsService.exportProgress();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `onboarding_progress_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      toast.success("Xuất file thành công");
    } catch (err) {
      toast.error("Xuất file thất bại");
    } finally {
      setExportLoading(false);
    }
  };

  /* ===================== FILTER TABS ===================== */

  const filterTabs = useMemo(
    () => [
      { id: "all", label: "Tất cả", count: safeProgress.length },
      {
        id: "NOT_STARTED",
        label: "Chưa bắt đầu",
        count: safeProgress.filter(
          (p) => getProgressDisplayMeta(p).status === "NOT_STARTED",
        ).length,
      },
      {
        id: "IN_PROGRESS",
        label: "Đang thực hiện",
        count: safeProgress.filter(
          (p) => getProgressDisplayMeta(p).status === "IN_PROGRESS",
        ).length,
      },
      {
        id: "COMPLETED",
        label: "Đã hoàn thành",
        count: safeProgress.filter(
          (p) => getProgressDisplayMeta(p).status === "COMPLETED",
        ).length,
      },
      {
        id: "OVERDUE",
        label: "Quá hạn",
        count: safeProgress.filter(
          (p) => getProgressDisplayMeta(p).status === "OVERDUE",
        ).length,
      },
    ],
    [safeProgress],
  );

  /* ===================== FILTER LOGIC ===================== */

  const filteredProgress = useMemo(() => {
    let result = safeProgress;

    if (activeFilter !== "all") {
      result = result.filter(
        (p) => getProgressDisplayMeta(p).status === activeFilter,
      );
    }

    if (searchTerm.trim()) {
      const keyword = searchTerm.toLowerCase();
      result = result.filter((p) =>
        p.employee?.fullName?.toLowerCase().includes(keyword),
      );
    }

    return result;
  }, [safeProgress, activeFilter, searchTerm]);

  /* ===================== RENDER ===================== */

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Kế hoạch hội nhập
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Quản lý và theo dõi tiến độ nhân sự mới gia nhập.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PermissionGate permission="ONBOARDING_PLAN_EXPORT">
              <button
                onClick={handleExport}
                disabled={exportLoading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm disabled:opacity-50"
              >
                <FileDown className="w-4 h-4" />
                {exportLoading ? "Đang xuất..." : "Xuất File"}
              </button>
            </PermissionGate>

            <PermissionGate permission="ONBOARDING_PLAN_CREATE">
              <button
                onClick={() => setShowCreatePlan(true)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
              >
                <Plus className="w-4 h-4" />
                Tạo kế hoạch
              </button>
            </PermissionGate>
          </div>
        </div>

        {/* STATS */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <OnboardingStatsCard
            title="Nhân viên mới"
            value={stats.newEmployeesLast30Days}
            trend={stats.growthRate}
            icon={<Users className="w-5 h-5" />}
            color="indigo"
          />
          <OnboardingStatsCard
            title="Đang thực hiện"
            value={stats.inProgress}
            icon={<ClipboardList className="w-5 h-5" />}
            color="amber"
          />
          <OnboardingStatsCard
            title="Đã hoàn thành"
            value={stats.completed}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
          />
        </div>

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between p-4 gap-4 bg-slate-50/50 border-b border-slate-100">
            {/* Tabs */}
            <div className="flex p-1 bg-slate-200/50 rounded-xl w-full lg:w-auto overflow-x-auto">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`whitespace-nowrap px-4 py-2 text-sm font-bold rounded-lg transition-all ${
                    activeFilter === tab.id
                      ? "bg-white text-indigo-600 shadow-sm"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 opacity-60 text-xs font-normal">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
              />
            </div>
          </div>

          <OnboardingPlansTable
            progressList={filteredProgress}
            loading={loading}
            onRowClick={(plan) => setSelectedPlan(plan)}
          />
        </div>
      </div>

      {showCreatePlan && (
        <CreatePlanModal
          employees={employees}
          departments={departments}
          templates={templates}
          onClose={() => setShowCreatePlan(false)}
          onSuccess={handlePlanCreated}
        />
      )}

      {selectedPlan && (
        <OnboardingDetailView
          onboardingPlan={selectedPlan}
          onClose={() => setSelectedPlan(null)}
          onEdit={handleEditPlan}
          onSuccess={handlePlanUpdate}
        />
      )}

      {editingPlan && (
        <CreatePlanModal
          initialData={editingPlan}
          mode="edit"
          employees={employees}
          departments={departments}
          templates={templates}
          onClose={() => setEditingPlan(null)}
          onSuccess={handlePlanUpdate}
        />
      )}
    </div>
  );
}
