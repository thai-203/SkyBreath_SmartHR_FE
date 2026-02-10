"use client";

import React, { useEffect, useState, useMemo } from "react";
import { onboardingsService, employeesService } from "@/services";
import { toast } from "sonner";
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
import { on } from "events";
import { set } from "nprogress";

/**
 * Normalize list response từ backend
 * Hỗ trợ:
 * - data = []
 * - data = { items: [] }
 */
const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function OnboardingPage() {
  const [showCreatePlan, setShowCreatePlan] = useState(false);
  const [plans, setPlans] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [progress, setProgress] = useState([]);
  const [stats, setStats] = useState({
    totalNewHires: 0,
    inProgress: 0,
    completed: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [plansRes, progsRes, statsRes, empRes] = await Promise.all([
          onboardingsService.getPlans(),
          onboardingsService.getProgress(),
          onboardingsService.getProgressStats(),
          employeesService.getAll(),
        ]);
        console.log("Fetched plans:", progsRes);

        // 🔒 Normalize data
        setPlans(normalizeList(plansRes?.data));
        setEmployees(normalizeList(empRes?.data));
        setProgress(normalizeList(progsRes?.data));

        setStats({
          totalNewHires: statsRes?.data?.totalNewHires || 0,
          inProgress: statsRes?.data?.inProgress || 0,
          completed: statsRes?.data?.completed || 0,
        });
      } catch (error) {
        console.error("Onboarding fetch error:", error);
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
  };

  /**
   * 🔐 plans luôn là array
   */
  const safePlans = useMemo(
    () => (Array.isArray(plans) ? plans : []),
    [plans]
  );

  /**
   * Tabs filter + count
   */
  const filterTabs = useMemo(
    () => [
      { id: "all", label: "Tất cả", count: safePlans.length },
      {
        id: "not_started",
        label: "Chưa bắt đầu",
        count: safePlans.filter((p) => p.status === "not_started").length,
      },
      {
        id: "in_progress",
        label: "Đang thực hiện",
        count: safePlans.filter((p) => p.status === "in_progress").length,
      },
      {
        id: "completed",
        label: "Đã hoàn thành",
        count: safePlans.filter((p) => p.status === "completed").length,
      },
    ],
    [safePlans]
  );

  /**
   * Filtered plans cho table
   */
  const filteredPlans = useMemo(() => {
    if (activeFilter === "all") return safePlans;
    return safePlans.filter((p) => p.status === activeFilter);
  }, [safePlans, activeFilter]);

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        {/* Header */}
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
            <button className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-white border border-slate-200 rounded-xl hover:bg-slate-50 transition-all shadow-sm">
              <FileDown className="w-4 h-4" />
              Xuất File
            </button>

            <button
              onClick={() => setShowCreatePlan(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Tạo kế hoạch
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <OnboardingStatsCard
            title="Nhân viên mới"
            value={stats.totalNewHires}
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

        {/* Table */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between p-4 gap-4 bg-slate-50/50 border-b border-slate-100">
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

            <div className="relative w-full lg:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm nhân viên..."
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
              />
            </div>
          </div>

          <OnboardingPlansTable plans={filteredPlans} loading={loading} />
        </div>
      </div>

      {showCreatePlan && (
        <CreatePlanModal
          employees={employees}
          onClose={() => setShowCreatePlan(false)}
          onSuccess={handlePlanCreated}
        />
      )}
    </div>
  );
}
