"use client";

import React, { useEffect, useState, useMemo } from "react";
import { onboardingsService, departmentsService, positionsService } from "@/services";
import { useToast } from "@/components/common/Toast";
import {
  Plus,
  Search,
  LayoutTemplate,
  FileStack,
  CheckCircle2,
  Trash2,
  AlertTriangle,
} from "lucide-react";

import TemplateStatsCard from "./components/TemplateStatsCard";
import TemplatesTable from "./components/TemplatesTable";
import CreateTemplateModal from "./components/CreateTemplateModal";
import ViewTemplateModal from "./components/ViewTemplateModal";
import ConfirmDeleteModal from "./components/ConfirmDeleteModal";

/* ================= UTILS ================= */
const normalizeList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  return [];
};

/* ================= PAGE ================= */
export default function OnboardingTemplatesPage() {
  const { success, error } = useToast();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [positionsList, setPositionsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  /* ================= FETCH ================= */
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        setLoading(true);
        const res = await onboardingsService.getPlanTemplates();
        setTemplates(normalizeList(res?.data));
      } catch (error) {
        console.error(error);
        error("Lỗi khi tải danh sách mẫu hội nhập");
      } finally {
        setLoading(false);
      }
    };

    fetchTemplates();
  }, [refreshKey]);

  
  const fetchPositionsList = async () => {
    try {
      const response = await positionsService.getAll();
      const items = Array.isArray(response.data) ? response.data : [];
      setPositionsList(
        items.map((e) => ({
          value: e.id,
          label: e.positionName,
          data: e,
        })),
      );
    } catch (err) {
      console.error("Error fetching positions:", err);
    }
  };

    const fetchDepartmentList = async () => {
    try {
      const response = await departmentsService.getAll();
      const departments = Array.isArray(response.data) ? response.data : [];
      const mappedData = departments.map((dept) => ({
        value: dept.id,
        label: dept.departmentName || dept.name || "Unnamed Department",
        data: dept,
      }));
      setDepartmentsList(mappedData);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

    useEffect(() => {
    fetchPositionsList();
    fetchDepartmentList();
  }, []);

  /* ================= HANDLERS ================= */
  const handleCreate = () => {
    setSelectedTemplate(null);
    setShowCreateModal(true); 
  };

  const handleEdit = (template) => {
    setSelectedTemplate(template);
    setShowCreateModal(true);
  };

  const handleView = (template) => {
    setSelectedTemplate(template);
    setShowViewModal(true);
  };

  const handleModalSuccess = () => {
    setShowCreateModal(false);
    setShowViewModal(false);
    setSelectedTemplate(null);
    setRefreshKey((prev) => prev + 1);
  };

  const openDeleteConfirm = (template) => {
    setDeleteModal({ show: true, data: template, loading: false });
  };

  const handleConfirmDelete = async () => {
    const templateId = deleteModal.data?.id;
    if (!templateId) return;

    setDeleteModal(prev => ({ ...prev, loading: true }));
    try {
      await onboardingsService.deletePlan(templateId);
      success("Đã xóa mẫu quy trình thành công!");
      setRefreshKey(prev => prev + 1);
      setDeleteModal({ show: false, data: null, loading: false });
    } catch (err) {
      error(err?.response?.data?.message || "Lỗi khi xóa quy trình");
      setDeleteModal(prev => ({ ...prev, loading: false }));
    }
  };

  const safeTemplates = useMemo(
    () => (Array.isArray(templates) ? templates : []),
    [templates]
  );

  /* ================= STATS ================= */
  const stats = useMemo(
    () => ({
      total: safeTemplates.length,
      active: safeTemplates.filter(
        (t) => t.status?.toLowerCase() === "active"
      ).length,
      draft: safeTemplates.filter(
        (t) => t.status?.toLowerCase() === "draft"
      ).length,
    }),
    [safeTemplates]
  );

  const [deleteModal, setDeleteModal] = useState({ 
    show: false, 
    data: null, 
    loading: false 
  });

  /* ================= FILTER ================= */
  const filterTabs = useMemo(
    () => [
      { id: "all", label: "Tất cả mẫu", count: stats.total },
      { id: "active", label: "Đang sử dụng", count: stats.active },
      { id: "draft", label: "Bản nháp", count: stats.draft },
    ],
    [stats]
  );

  const filteredTemplates = useMemo(() => {
    return safeTemplates.filter((t) => {
      const status = t.status?.toLowerCase();
      if (activeFilter === "active" && status !== "active") return false;
      if (activeFilter === "draft" && status !== "draft") return false;

      const q = searchQuery.toLowerCase();
      return (
        t.planName?.toLowerCase().includes(q) ||
        t.department?.departmentName?.toLowerCase().includes(q) ||
        t.position?.positionName?.toLowerCase().includes(q)
      );
    });
  }, [safeTemplates, activeFilter, searchQuery]);

  /* ================= UI ================= */
  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div className="max-w-[1400px] mx-auto space-y-8 animate-in fade-in duration-500">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Mẫu quy trình hội nhập
            </h1>
            <p className="text-slate-500 mt-1 font-medium">
              Thiết lập các bộ khung nhiệm vụ chuẩn hóa theo vị trí và phòng ban.
            </p>
          </div>

          <button
            onClick={handleCreate}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 shadow-md shadow-indigo-200"
          >
            <Plus className="w-4 h-4" />
            Tạo mẫu mới
          </button>
        </div>

        {/* STATS */}
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

        {/* TABLE */}
        <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
          <div className="flex flex-col lg:flex-row items-center justify-between p-4 gap-4 bg-slate-50/50 border-b">
            <div className="flex p-1 bg-slate-200/50 rounded-xl">
              {filterTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveFilter(tab.id)}
                  className={`px-4 py-2 text-sm font-bold rounded-lg transition ${
                    activeFilter === tab.id
                      ? "bg-white text-indigo-600 shadow"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {tab.label}
                  <span className="ml-1 text-xs opacity-60">
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="relative w-full lg:w-72">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                placeholder="Tìm tên mẫu, phòng ban..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm border rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
              />
            </div>
          </div>

          <TemplatesTable
            templates={filteredTemplates}
            loading={loading}
            onEdit={handleEdit}
            onView={handleView}
            onDelete={openDeleteConfirm}
          />
        </div>
      </div>

      {showCreateModal && (
        <CreateTemplateModal
          initialData={selectedTemplate}
          onClose={() => {
            setShowCreateModal(false);
            setSelectedTemplate(null);
          }}
          departmentsList={departmentsList}
          positionsList={positionsList} 
          onSuccess={handleModalSuccess}
        />
      )}

      {showViewModal && (
        <ViewTemplateModal
          data={selectedTemplate}
          onClose={() => {
            setShowViewModal(false);
            setSelectedTemplate(null);
          }}
          departmentsList={departmentsList}
          positionsList={positionsList}
        />
      )}

      <ConfirmDeleteModal
        isOpen={deleteModal.show}
        title={deleteModal.data?.planName || deleteModal.data?.plan_name}
        loading={deleteModal.loading}
        onClose={() => setDeleteModal({ show: false, data: null, loading: false })}
        onConfirm={handleConfirmDelete}
      />
    </div>
  );
}
