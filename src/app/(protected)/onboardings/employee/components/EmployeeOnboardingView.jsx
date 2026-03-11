"use client";

import React, { useState, useEffect } from "react";
import {
  Calendar,
  UploadCloud,
  Laptop,
  FileText,
  ShieldCheck,
  Users,
  Save,
  Clock,
  ChevronDown,
  Loader2,
  Briefcase,
  Building2,
  X,
  Eye,
} from "lucide-react";
import { onboardingsService } from "@/services";
import { useToast } from "@/components/common/Toast";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const CATEGORY_CONFIG = {
  Asset: {
    label: "Tài sản & Thiết bị",
    icon: Laptop,
    color: "text-blue-600",
    bg: "bg-blue-50",
  },
  Document: {
    label: "Tài liệu & Hồ sơ",
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
  },
  System: {
    label: "Hệ thống & Tài khoản",
    icon: ShieldCheck,
    color: "text-purple-600",
    bg: "bg-purple-50",
  },
  Training: {
    label: "Đào tạo & Định hướng",
    icon: Users,
    color: "text-orange-600",
    bg: "bg-orange-50",
  },
};

export default function EmployeeOnboardingView({ onboardingData, onRefresh }) {
  const { success, error } = useToast();
  const [expandedTaskId, setExpandedTaskId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);

  const [editForm, setEditForm] = useState({
    status: "",
    assetCode: "",
    notes: "",
  });

  useEffect(() => {
    if (onboardingData?.taskAssignments && !expandedTaskId) {
      const firstIncomplete = onboardingData.taskAssignments.find(
        (t) => t.status !== "COMPLETED",
      );
      if (firstIncomplete) handleExpand(firstIncomplete);
    }
  }, [onboardingData?.id]);

  const handleExpand = (task) => {
    if (onboardingData.overallStatus === "COMPLETED") {
      success("Lộ trình đã hoàn tất, không thể chỉnh sửa thêm.");
      return;
    }

    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
      setSelectedFile(null);
      setPreviewUrl(null);
    } else {
      setExpandedTaskId(task.id);
      setSelectedFile(null);
      setPreviewUrl(
        task.evidencePath ? `${API_BASE_URL}/${task.evidencePath}` : null,
      );
      setEditForm({
        status: task.status || "NOT_STARTED",
        assetCode: task.assetCode || "",
        notes: task.notes || "",
      });
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) {
        error("File quá lớn (tối đa 10MB)");
        return;
      }
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleUpdate = async (taskId) => {
    setUpdatingId(taskId);
    try {
      const formData = new FormData();
      formData.append("status", editForm.status);
      formData.append("assetCode", editForm.assetCode);
      formData.append("notes", editForm.notes);

      if (selectedFile) {
        formData.append("evidence", selectedFile);
      }

      await onboardingsService.updateAssignment(taskId, formData);
      success("Cập nhật nhiệm vụ thành công!");
      setExpandedTaskId(null);
      setSelectedFile(null);
      setPreviewUrl(null);
      if (onRefresh) await onRefresh();
    } catch (err) {
      error(err?.response?.data?.message || "Lỗi cập nhật dữ liệu");
    } finally {
      setUpdatingId(null);
    }
  };

  const formatUpdatedAt = (dateString) => {
    if (!dateString) return "Chưa có dữ liệu";
    return new Date(dateString).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!onboardingData) return null;

  return (
    <div className="relative min-h-screen bg-[#f8fafc] flex flex-col animate-in fade-in duration-500 font-sans">
      <div className="max-w-6xl mx-auto w-full p-6 md:p-8">
        <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm mb-10 flex flex-wrap justify-between items-center gap-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="w-24 h-24 bg-slate-100 rounded-full border-4 border-white shadow-md overflow-hidden flex items-center justify-center">
                <img
                  src={`https://ui-avatars.com/api/?name=${encodeURIComponent(onboardingData.employee?.fullName || "U")}&background=6366f1&color=fff`}
                  alt="Avatar"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute bottom-1 right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full"></div>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-black text-slate-800">
                  {onboardingData.employee?.fullName}
                </h1>
                <span className="text-xs font-bold bg-slate-100 text-slate-500 px-3 py-1 rounded-full uppercase">
                  #OB-{onboardingData.id?.toString().padStart(4, "0")}
                </span>
              </div>
              <div className="flex flex-wrap gap-4 text-sm font-bold">
                <span className="flex items-center gap-1.5 text-indigo-600">
                  <Briefcase className="w-4 h-4" />
                  {onboardingData.employee?.position?.positionName}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 border-l pl-4 border-slate-200">
                  <Building2 className="w-4 h-4" />
                  {onboardingData.employee?.department?.departmentName}
                </span>
                <span className="flex items-center gap-1.5 text-slate-400 border-l pl-4 border-slate-200">
                  <Calendar className="w-4 h-4" /> Bắt đầu:{" "}
                  {onboardingData.startDate}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-8 min-w-[320px] flex-1 lg:flex-none">
            <div className="flex-1">
              <div className="flex justify-between text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">
                <span>Tiến độ hoàn thành</span>
                <span className="text-indigo-600">
                  {onboardingData.progressPercentage || 0}%
                </span>
              </div>
              <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-indigo-600 rounded-full transition-all duration-1000 shadow-[0_0_12px_rgba(79,70,229,0.4)]"
                  style={{
                    width: `${onboardingData.progressPercentage || 0}%`,
                  }}
                ></div>
              </div>
              <p className="text-[11px] font-bold text-slate-400 mt-3 text-right">
                {onboardingData.taskAssignments?.filter(
                  (t) => t.status === "COMPLETED",
                ).length || 0}{" "}
                / {onboardingData.taskAssignments?.length || 0} nhiệm vụ
              </p>
            </div>
          </div>
        </div>

        <h2 className="text-2xl font-black text-slate-800 mb-8 flex items-center gap-3">
          Nhiệm vụ cần thực hiện
          <span className="text-sm font-medium text-slate-400 bg-white border px-3 py-1 rounded-full">
            {onboardingData.taskAssignments?.length || 0}
          </span>
        </h2>

        <div className="space-y-5">
          {onboardingData.taskAssignments?.map((task) => {
            const isExpanded = expandedTaskId === task.id;
            const isSaving = updatingId === task.id;
            const config = CATEGORY_CONFIG[task.task?.category] || {
              label: "Chung",
              icon: FileText,
              color: "text-slate-600",
              bg: "bg-slate-50",
            };
            const Icon = config.icon;

            return (
              <div
                key={task.id}
                className={`bg-white rounded-[24px] border-2 transition-all duration-300 overflow-hidden ${
                  isExpanded
                    ? "border-indigo-500 shadow-xl scale-[1.01]"
                    : "border-transparent shadow-sm hover:border-slate-200"
                }`}
              >
                <div
                  onClick={() => handleExpand(task)}
                  className={`p-6 flex items-center justify-between transition-all ${
                    onboardingData.overallStatus === "COMPLETED"
                      ? "opacity-80 cursor-not-allowed"
                      : "cursor-pointer"
                  }`}
                >
                  <div className="flex items-center gap-5">
                    <div
                      className={`p-4 rounded-2xl transition-colors ${isExpanded ? "bg-indigo-50 text-indigo-600" : "bg-slate-50 text-slate-400"}`}
                    >
                      <Icon className="w-7 h-7" />
                    </div>
                    <div>
                      <h3
                        className={`text-lg font-bold leading-tight transition-all ${task.status === "COMPLETED" ? "text-slate-300 line-through" : "text-slate-800"}`}
                      >
                        {task.task?.description}
                      </h3>
                      <p className="text-[10px] font-black text-slate-400 mt-1 uppercase tracking-wider">
                        Phân loại: {config.label}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <span
                      className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${
                        task.status === "COMPLETED"
                          ? "bg-emerald-50 text-emerald-600 border-emerald-100"
                          : task.status === "IN_PROGRESS"
                            ? "bg-amber-50 text-amber-600 border-amber-100"
                            : "bg-slate-50 text-slate-400 border-slate-100"
                      }`}
                    >
                      {task.status === "COMPLETED"
                        ? "Hoàn thành"
                        : task.status === "IN_PROGRESS"
                          ? "Đang làm"
                          : "Chờ xử lý"}
                    </span>
                    <div
                      className={`p-2 rounded-full bg-slate-50 transition-transform duration-300 ${isExpanded ? "rotate-180" : ""}`}
                    >
                      <ChevronDown className="w-5 h-5 text-slate-400" />
                    </div>
                  </div>
                </div>

                {isExpanded && (
                  <div className="p-8 pt-0 border-t border-slate-50 animate-in slide-in-from-top-4 duration-500">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mt-8">
                      <div className="space-y-8">
                        <div>
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                            Trạng thái hiện tại
                          </label>
                          <div className="flex bg-slate-100 p-1.5 rounded-2xl w-fit">
                            {[
                              { val: "NOT_STARTED", label: "Chờ xử lý" },
                              { val: "IN_PROGRESS", label: "Đang làm" },
                              { val: "COMPLETED", label: "Đã xong" },
                            ].map((s) => (
                              <button
                                key={s.val}
                                onClick={() =>
                                  setEditForm({ ...editForm, status: s.val })
                                }
                                className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                  editForm.status === s.val
                                    ? "bg-white text-indigo-600 shadow-md scale-105"
                                    : "text-slate-400 hover:text-slate-600"
                                }`}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                            Mã tài sản / Số Serial
                          </label>
                          <input
                            type="text"
                            value={editForm.assetCode}
                            onChange={(e) =>
                              setEditForm({
                                ...editForm,
                                assetCode: e.target.value,
                              })
                            }
                            placeholder="Ví dụ: MAC-2023-X9221"
                            className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-medium focus:bg-white focus:border-indigo-400 transition-all outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                            Hình ảnh minh chứng{" "}
                            {selectedFile && (
                              <span className="text-emerald-500 font-black">
                                (MỚI)
                              </span>
                            )}
                          </label>
                          <div className="relative group border-2 border-dashed border-slate-200 rounded-3xl overflow-hidden bg-slate-50 transition-all hover:border-indigo-300">
                            {previewUrl ? (
                              <div className="relative aspect-video flex items-center justify-center bg-slate-900">
                                <img
                                  src={previewUrl}
                                  className="w-full h-full object-contain"
                                  alt="Evidence"
                                  onError={(e) => {
                                    e.target.src =
                                      "https://placehold.co/600x400?text=File+Không+Hỗ+Trợ+Xem+Trước";
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
                                  <label className="cursor-pointer bg-white text-slate-900 px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:scale-105 transition-transform">
                                    Thay đổi
                                    <input
                                      type="file"
                                      className="hidden"
                                      onChange={handleFileChange}
                                      accept="image/*"
                                    />
                                  </label>
                                  <a
                                    href={previewUrl}
                                    target="_blank"
                                    className="bg-white/20 backdrop-blur-md p-2 rounded-xl text-white hover:bg-white/40"
                                  >
                                    <Eye className="w-5 h-5" />
                                  </a>
                                  {selectedFile && (
                                    <button
                                      onClick={(e) => {
                                        e.preventDefault();
                                        setSelectedFile(null);
                                        setPreviewUrl(
                                          task.evidencePath
                                            ? `${API_BASE_URL}/${task.evidencePath}`
                                            : null,
                                        );
                                      }}
                                      className="bg-rose-500 p-2 rounded-xl text-white"
                                    >
                                      <X className="w-5 h-5" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ) : (
                              <label className="flex flex-col items-center justify-center p-12 cursor-pointer hover:bg-white transition-colors w-full">
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={handleFileChange}
                                  accept="image/*"
                                />
                                <UploadCloud className="w-10 h-10 text-indigo-500 mb-3" />
                                <p className="text-sm font-bold text-slate-700">
                                  Chưa có minh chứng
                                </p>
                                <p className="text-[10px] text-slate-400 mt-1 uppercase">
                                  Click để tải lên ảnh (Tối đa 10MB)
                                </p>
                              </label>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex flex-col">
                        <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-4 block">
                          Ghi chú phản hồi
                        </label>
                        <textarea
                          value={editForm.notes}
                          onChange={(e) =>
                            setEditForm({ ...editForm, notes: e.target.value })
                          }
                          placeholder="Nhập ghi chú cụ thể..."
                          className="flex-1 w-full p-6 bg-slate-50 border border-slate-200 rounded-[24px] text-sm font-medium focus:bg-white focus:border-indigo-400 transition-all outline-none resize-none min-h-[200px]"
                        ></textarea>
                        <div className="flex items-center justify-end gap-4 mt-6">
                          <button
                            onClick={() => {
                              setExpandedTaskId(null);
                              setSelectedFile(null);
                              setPreviewUrl(null);
                            }}
                            className="px-6 py-3 rounded-2xl font-bold text-slate-400 hover:text-rose-500 hover:bg-rose-50 transition-all"
                          >
                            Hủy bỏ
                          </button>
                          <button
                            disabled={isSaving}
                            onClick={() => handleUpdate(task.id)}
                            className="flex items-center gap-2 px-8 py-3 bg-indigo-600 text-white rounded-2xl font-black hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all active:scale-95"
                          >
                            {isSaving ? (
                              <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                              <Save className="w-5 h-5" />
                            )}
                            Lưu thay đổi
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="mt-12 p-6 bg-white rounded-[32px] border border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-slate-50 rounded-xl">
              <Clock className="w-5 h-5 text-slate-400" />
            </div>
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Cập nhật cuối cùng
              </p>
              <p className="text-sm font-bold text-slate-700">
                {formatUpdatedAt(onboardingData.updatedAt)}
              </p>
            </div>
          </div>
          <p className="text-[11px] italic text-slate-400 hidden md:block">
            SkyBreath SmartHR • 2026
          </p>
        </div>
      </div>
    </div>
  );
}
