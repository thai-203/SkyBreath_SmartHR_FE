"use client";

import React, { useState, useEffect } from "react";
import {
  Briefcase,
  Building2,
  Calendar,
  X,
  Clock,
  CheckCircle2,
  AlertCircle,
  Printer,
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  FileCheck,
  UserCheck,
  AlertTriangle,
  ImageIcon,
  StickyNote,
  Hash,
  Inbox,
} from "lucide-react";
import { onboardingsService } from "@/services";
import { resolveAssetUrl } from "@/lib/utils";
import { PermissionGate } from "@/components/common/AuthGuard";

export default function OnboardingFinalReview({
  onboardingPlan,
  onClose,
  onConfirm,
  onSuccess,
}) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState(null);

  // Khóa cuộn trang khi mở modal
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  if (!onboardingPlan) return null;

  // Xử lý dữ liệu
  const taskAssignments = onboardingPlan.taskAssignments || [];
  const pendingTasks = taskAssignments.filter((t) => t.status !== "COMPLETED");
  const mandatoryPendingTasks = pendingTasks.filter(
    (t) => t.task?.isMandatory === true,
  );
  const completedTasks = taskAssignments.filter(
    (t) => t.status === "COMPLETED",
  );

  // Kiểm tra trạng thái tổng thể
  const isAlreadyCompleted = onboardingPlan.overallStatus === "COMPLETED";
  const progress = onboardingPlan.progressPercentage || 0;

  // Có thể chốt nếu không còn tác vụ bắt buộc VÀ chưa được chốt trước đó
  const canFinalize = mandatoryPendingTasks.length === 0 && !isAlreadyCompleted;

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

  const handleTaskClick = (id) => {
    setExpandedTaskId(expandedTaskId === id ? null : id);
  };

  // Component hiển thị chi tiết nhiệm vụ
  const TaskDetailsContent = ({ task }) => {
    const evidenceUrl = resolveAssetUrl(task.evidencePath);

    return (
      <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-1 duration-200">
        <div className="space-y-3">
          <div className="flex items-start gap-2">
            <Hash className="w-4 h-4 text-slate-400 mt-1" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">
                Mã tài sản / Serial
              </p>
              <p className="text-sm font-bold text-slate-700">
                {task.assetCode || "N/A"}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2">
            <StickyNote className="w-4 h-4 text-slate-400 mt-1" />
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase">
                Ghi chú
              </p>
              <p className="text-sm text-slate-600 italic leading-relaxed">
                {task.notes || "Không có ghi chú"}
              </p>
            </div>
          </div>
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-400 uppercase mb-2">
            Minh chứng
          </p>
          {evidenceUrl ? (
            <div className="rounded-lg overflow-hidden border border-slate-200 aspect-video bg-white shadow-inner">
              <img
                src={evidenceUrl}
                alt="Evidence"
                className="w-full h-full object-cover hover:scale-105 transition-transform cursor-zoom-in"
                onClick={(e) => {
                  e.stopPropagation();
                  window.open(evidenceUrl, "_blank");
                }}
              />
            </div>
          ) : (
            <div className="h-20 rounded-lg border-2 border-dashed border-slate-200 flex items-center justify-center text-slate-300 bg-slate-50/50">
              <ImageIcon className="w-5 h-5" />
            </div>
          )}
        </div>
      </div>
    );
  };

  // Component hiển thị khi danh sách trống
  const EmptyState = ({ message }) => (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
      <div className="p-4 bg-white rounded-full shadow-sm mb-4">
        <Inbox className="w-8 h-8 text-slate-300" />
      </div>
      <p className="text-slate-400 font-bold text-sm uppercase tracking-wide">
        {message}
      </p>
    </div>
  );

  const handleUpdate = async () => {
    if (!canFinalize) return;

    setIsSubmitting(true);
    try {
      const now = new Date();
      const formattedDate = now.toISOString().slice(0, 19).replace("T", " ");

      const data = {
        overallStatus: "COMPLETED",
        actualEndDate: formattedDate,
      };

      await onboardingsService.updateProgress(onboardingPlan.id, data);

      if (typeof toast !== "undefined") {
        toast.success("Cập nhật lộ trình thành công!");
      }

      if (onConfirm) {
        await onConfirm(onboardingPlan.id);
      }
      onSuccess?.();
      onClose();
    } catch (err) {
      console.error("Lỗi cập nhật:", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[999] bg-[#f8fafc] overflow-y-auto animate-in fade-in duration-300">
      {/* HEADER */}
      <div className="sticky top-0 z-[101] bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 flex justify-between items-center shadow-sm">
        <div className="flex items-center gap-2 text-sm font-bold text-slate-500">
          Nhân viên / Hội nhập /{" "}
          <span className="text-indigo-600">Đánh giá cuối cùng</span>
        </div>
        <div className="flex items-center gap-3">
          <PermissionGate permission="ONBOARDING_PROGRESS_EXPORT">
            <button className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
              <Printer className="w-4 h-4" /> In bản tóm tắt
            </button>
          </PermissionGate>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 pb-32">
        {/* PROFILE HEADER */}
        <div className="flex items-center gap-5 mb-10">
          <div className="w-20 h-20 bg-indigo-100 rounded-3xl overflow-hidden border-4 border-white shadow-sm">
            <img
              src={`https://ui-avatars.com/api/?name=${encodeURIComponent(onboardingPlan.employee?.fullName || "U")}&background=6366f1&color=fff`}
              alt="Avatar"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-800">
              Kiểm tra cuối cùng: {onboardingPlan.employee?.fullName}
            </h1>
            <p className="text-slate-400 font-bold">
              Mã NV:{" "}
              <span className="text-slate-600">
                #
                {onboardingPlan.employee?.employeeCode
                  ?.toString()
                  .padStart(5, "0")}
              </span>
              <span className="mx-2">•</span>{" "}
              {onboardingPlan.employee?.department?.departmentName}
              <span className="mx-2">•</span>{" "}
              {onboardingPlan.employee?.position?.positionName}
            </p>
          </div>
        </div>

        {/* TIẾN ĐỘ & NHẮC NHỞ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-10">
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h3 className="text-lg font-black text-slate-800">
                  Trạng thái lộ trình
                </h3>
                <p className="text-sm font-bold text-slate-400">
                  Cập nhật lúc: {formatUpdatedAt(onboardingPlan.updatedAt)}
                </p>
              </div>
              <span
                className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest 
                ${isAlreadyCompleted ? "bg-green-100 text-green-600" : canFinalize ? "bg-blue-100 text-blue-600" : "bg-amber-100 text-amber-600"}`}
              >
                {isAlreadyCompleted
                  ? "Đã hoàn tất"
                  : canFinalize
                    ? "Đủ điều kiện hoàn tất"
                    : "Chưa đủ điều kiện"}
              </span>
            </div>
            <div className="space-y-4">
              <div className="w-full h-4 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 
                  ${isAlreadyCompleted ? "bg-green-500" : canFinalize ? "bg-blue-500" : "bg-indigo-600"}`}
                  style={{ width: `${progress}%` }}
                ></div>
              </div>
              <div className="flex gap-12">
                <div>
                  <p className="text-2xl font-black text-slate-800">
                    {completedTasks.length} / {taskAssignments.length}
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Nhiệm vụ xong
                  </p>
                </div>
                <div>
                  <p className="text-2xl font-black text-blue-600">
                    {progress}%
                  </p>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider">
                    Tiến độ chung
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div
            className={`rounded-[32px] p-8 border 
            ${isAlreadyCompleted ? "bg-green-50 border-green-100" : canFinalize ? "bg-blue-50 border-blue-100" : "bg-amber-50 border-amber-100"}`}
          >
            <div
              className={`flex items-center gap-3 mb-4 
              ${isAlreadyCompleted ? "text-green-600" : canFinalize ? "text-blue-600" : "text-amber-600"}`}
            >
              {isAlreadyCompleted ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : canFinalize ? (
                <CheckCircle2 className="w-6 h-6" />
              ) : (
                <AlertTriangle className="w-6 h-6" />
              )}
              <h3 className="font-black">
                {isAlreadyCompleted ? "Trạng thái" : "Yêu cầu hành động"}
              </h3>
            </div>
            <p
              className={`text-sm font-bold leading-relaxed mb-6 
              ${isAlreadyCompleted ? "text-green-900/70" : canFinalize ? "text-blue-900/70" : "text-amber-900/70"}`}
            >
              {isAlreadyCompleted
                ? "Lộ trình hội nhập của nhân viên này đã được hoàn tất và chốt hồ sơ."
                : canFinalize
                  ? "Tuyệt vời! Tất cả nhiệm vụ bắt buộc đã hoàn tất. Bạn có thể kích hoạt tài khoản nhân viên chính thức ngay bây giờ."
                  : `Còn ${pendingTasks.length} nhiệm vụ chưa hoàn thành, trong đó có ${mandatoryPendingTasks.length} nhiệm vụ là BẮT BUỘC.`}
            </p>
          </div>
        </div>

        {/* DANH SÁCH NHIỆM VỤ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* CỘT TRÁI: PENDING */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="flex items-center gap-3 text-xl font-black text-slate-800">
                <div className="p-2 bg-orange-50 rounded-lg">
                  <Clock className="w-6 h-6 text-orange-500" />
                </div>
                Nhiệm vụ chờ
              </h3>
              <span className="px-3 py-1 bg-orange-50 text-orange-600 text-[10px] font-black rounded-full uppercase">
                {pendingTasks.length} nhiệm vụ
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] pr-2 overflow-y-auto custom-scrollbar">
              {pendingTasks.length > 0 ? (
                pendingTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className={`group p-5 rounded-2xl border-2 transition-all cursor-pointer
                      ${task.task?.isMandatory ? "bg-amber-50/30 border-amber-100 hover:border-amber-300" : "bg-white border-slate-100 hover:border-indigo-200"} 
                      ${expandedTaskId === task.id ? "ring-4 ring-indigo-50 border-indigo-500 bg-white" : ""}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center 
                          ${task.task?.isMandatory ? "bg-amber-100 text-amber-600" : "bg-slate-100 text-slate-400"}`}
                        >
                          {task.task?.isMandatory ? (
                            <AlertCircle className="w-6 h-6" />
                          ) : (
                            <ShieldCheck className="w-6 h-6" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-slate-700 line-clamp-1">
                              {task.task?.description}
                            </p>
                            {task.task?.isMandatory && (
                              <span className="text-[9px] bg-rose-500 text-white px-2 py-0.5 rounded-full font-black uppercase">
                                Bắt buộc
                              </span>
                            )}
                          </div>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                            {task.task?.category}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`p-1 rounded-lg ${expandedTaskId === task.id ? "bg-indigo-100 text-indigo-600" : "text-slate-300"}`}
                      >
                        {expandedTaskId === task.id ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    {expandedTaskId === task.id && (
                      <TaskDetailsContent task={task} />
                    )}
                  </div>
                ))
              ) : (
                <EmptyState message="Không còn nhiệm vụ nào đang chờ" />
              )}
            </div>
          </div>

          {/* CỘT PHẢI: COMPLETED */}
          <div className="bg-white rounded-[32px] p-8 border border-slate-200 shadow-sm flex flex-col">
            <div className="flex items-center justify-between mb-8 px-2">
              <h3 className="flex items-center gap-3 text-xl font-black text-slate-800">
                <div className="p-2 bg-blue-50 rounded-lg">
                  <CheckCircle2 className="w-6 h-6 text-blue-500" />
                </div>
                Đã hoàn thành
              </h3>
              <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black rounded-full uppercase">
                {completedTasks.length} nhiệm vụ
              </span>
            </div>

            <div className="space-y-4 max-h-[600px] pr-2 overflow-y-auto custom-scrollbar">
              {completedTasks.length > 0 ? (
                completedTasks.map((task) => (
                  <div
                    key={task.id}
                    onClick={() => handleTaskClick(task.id)}
                    className={`group p-5 rounded-2xl border transition-all cursor-pointer
                      ${expandedTaskId === task.id ? "bg-white border-blue-500 ring-4 ring-blue-50" : "bg-slate-50 border-transparent hover:border-blue-200"}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center 
                          ${expandedTaskId === task.id ? "bg-blue-100 text-blue-600" : "bg-white text-blue-400 shadow-sm"}`}
                        >
                          <CheckCircle2 className="w-5 h-5" />
                        </div>
                        <div>
                          <p
                            className={`text-sm font-bold ${expandedTaskId === task.id ? "text-slate-800" : "text-slate-500"}`}
                          >
                            {task.task?.description}
                          </p>
                          <p className="text-[10px] font-medium text-slate-400 italic">
                            Xác nhận:{" "}
                            {new Date(task.updatedAt).toLocaleDateString(
                              "vi-VN",
                            )}
                          </p>
                        </div>
                      </div>
                      <div
                        className={`${expandedTaskId === task.id ? "text-blue-500" : "text-slate-300"}`}
                      >
                        {expandedTaskId === task.id ? (
                          <ChevronDown className="w-5 h-5" />
                        ) : (
                          <ChevronRight className="w-5 h-5" />
                        )}
                      </div>
                    </div>
                    {expandedTaskId === task.id && (
                      <TaskDetailsContent task={task} />
                    )}
                  </div>
                ))
              ) : (
                <EmptyState message="Chưa có nhiệm vụ nào được hoàn thành" />
              )}
            </div>
          </div>
        </div>

        {/* FINAL CONFIRMATION BOX */}
        <div
          className={`mt-16 bg-white rounded-[40px] p-10 border-l-[6px] border border-slate-200 shadow-xl flex flex-col lg:flex-row lg:items-center justify-between gap-8 
          ${isAlreadyCompleted ? "border-l-green-500" : canFinalize ? "border-l-blue-500" : "border-l-slate-300"}`}
        >
          <div className="max-w-2xl">
            <h2 className="text-2xl font-black text-slate-800 mb-3">
              {isAlreadyCompleted
                ? "Lộ trình đã hoàn tất"
                : "Xác nhận hoàn tất lộ trình"}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed">
              {isAlreadyCompleted
                ? `Lộ trình của ${onboardingPlan.employee?.fullName} đã được chốt. Hồ sơ hiện tại không thể thay đổi.`
                : canFinalize
                  ? `Mọi thủ tục bắt buộc đã xong. Nhân viên ${onboardingPlan.employee?.fullName} sẽ được chuyển sang trạng thái hoạt động chính thức.`
                  : "Vui lòng hoàn thành các nhiệm vụ 'Bắt buộc' trước khi chốt hồ sơ."}
            </p>
          </div>
          <PermissionGate permission="ONBOARDING_PROGRESS_COMPLETE">
            <button
              disabled={!canFinalize || isSubmitting}
              onClick={handleUpdate}
              className={`flex items-center gap-3 px-12 py-5 rounded-[24px] font-black text-lg transition-all 
    ${isAlreadyCompleted
                  ? "bg-green-100 text-green-700 cursor-not-allowed"
                  : canFinalize
                    ? "bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-100"
                    : "bg-slate-200 text-slate-400 cursor-not-allowed"
                }`}
            >
              {isSubmitting
                ? "Đang xử lý..."
                : isAlreadyCompleted
                  ? "Đã xác nhận hoàn thành"
                  : "Xác nhận hoàn thành"}

              {!isAlreadyCompleted && (
                <CheckCircle2
                  className={`w-6 h-6 ${canFinalize ? "animate-bounce" : ""}`}
                />
              )}
            </button>
          </PermissionGate>
        </div>
      </div>
    </div>
  );
}
  