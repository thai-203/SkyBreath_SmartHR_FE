"use client";

import React, { useEffect, useState, useMemo } from "react";
import { onboardingsService } from "@/services";
import { toast } from "sonner";
import {
  Plus,
  Search,
  LayoutTemplate,
  FileStack,
  CheckCircle2,
  Settings,
} from "lucide-react";

import TemplateStatsCard from "./components/TemplateStatsCard";
import TemplatesTable from "./components/TemplatesTable";
import CreateTemplateModal from "./components/CreateTemplateModal";

/**
 * Normalize list response từ backend dựa trên cấu trúc service của bạn
 */
const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

export default function OnboardingTemplatesPage() {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const res = await onboardingsService.getPlanTemplates();
        setTemplates(normalizeList(res?.data));
      } catch (error) {
        console.error("Template fetch error:", error);
        toast.error("Lỗi khi tải danh sách mẫu hội nhập");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [refreshKey]);

  const handleTemplateCreated = () => {
    setShowCreateModal(false);
    setRefreshKey((prev) => prev + 1);
  };

  const safeTemplates = useMemo(
    () => (Array.isArray(templates) ? templates : []),
    [templates]
  );

    const stats = useMemo(() => ({
    total: safeTemplates.length,
    active: safeTemplates.filter(t => t.status?.toLowerCase() === "active").length,
    draft: safeTemplates.filter(t => t.status?.toLowerCase() === "draft").length,
    }), [safeTemplates]);


  const filterTabs = useMemo(() => [
    { id: "all", label: "Tất cả mẫu", count: safeTemplates.length },
    {
      id: "active",
      label: "Đang sử dụng",
      count: stats.active,
    },
    {
      id: "draft",
      label: "Bản nháp",
      count: stats.draft,
    },
  ], [safeTemplates, stats]);

    const filteredTemplates = useMemo(() => {
    return safeTemplates.filter((t) => {
        const status = t.status?.toLowerCase();

        let matchesFilter = true;
        if (activeFilter === "active") {
        matchesFilter = status === "active";
        } else if (activeFilter === "draft") {
        matchesFilter = status === "draft";
        }

        const q = searchQuery.toLowerCase();

        const matchesSearch =
        t.planName?.toLowerCase().includes(q) ||
        t.department?.name?.toLowerCase().includes(q) ||
        t.position?.name?.toLowerCase().includes(q);

        return matchesFilter && matchesSearch;
    });
    }, [safeTemplates, activeFilter, searchQuery]);
    console.log("Filtered templates:", filteredTemplates);
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        
        {/* Header tương tự mẫu Plan */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Mẫu quy trình hội nhập
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Thiết lập các bộ khung nhiệm vụ chuẩn hóa theo vị trí và phòng ban.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all shadow-md shadow-indigo-200"
            >
              <Plus className="w-4 h-4" />
              Tạo mẫu mới
            </button>
          </div>
        </div>

        {/* Stats Section sử dụng OnboardingStatsCard style */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <TemplateStatsCard
            title="Tổng số mẫu"
            value={stats.total}
            icon={<LayoutTemplate className="w-5 h-5" />}
            color="indigo"
          />
          <TemplateStatsCard
            title="Đang kích hoạt"
            value={stats.active}
            icon={<CheckCircle2 className="w-5 h-5" />}
            color="emerald"
          />
          <TemplateStatsCard
            title="Bản nháp"
            value={stats.draft}
            icon={<FileStack className="w-5 h-5" />}
            color="amber"
          />
        </div>

        {/* Table & Search */}
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

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm tên mẫu, phòng ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none shadow-sm"
              />
            </div>
          </div>

          <TemplatesTable 
            templates={filteredTemplates} 
            loading={loading} 
            onRefresh={() => setRefreshKey(prev => prev + 1)}
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateTemplateModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={handleTemplateCreated}
        />
      )}
    </div>
  );
}