"use client";

import React, { useMemo, useState } from "react";
import {
  X,
  LayoutTemplate,
  Clock,
  Briefcase,
  Layers,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertCircle,
  FileText,
} from "lucide-react";

export default function ViewTemplateModal({
  onClose,
  data = null,
  departmentsList = [],
  positionsList = [],
}) {
  const ITEMS_PER_PAGE = 6;
  const [currentPage, setCurrentPage] = useState(1);

  /* =========================
   * 1. DATA MAPPING
   ========================= */
  const departmentLabel = useMemo(() => {
    const id = data?.departmentId || data?.department_id;
    return (
      departmentsList.find((d) => String(d.value) === String(id))?.label ||
      "N/A"
    );
  }, [data, departmentsList]);

  const positionLabel = useMemo(() => {
    const id = data?.positionId || data?.position_id;
    return (
      positionsList.find((p) => String(p.value) === String(id))?.label || "N/A"
    );
  }, [data, positionsList]);

  const tasks = data?.tasks || [];

  /* =========================
   * 2. PAGINATION
   ========================= */
  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
  const currentTasks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    return tasks.slice(start, start + ITEMS_PER_PAGE);
  }, [tasks, currentPage]);

  if (!data) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex justify-center items-center p-4">
      <div className="bg-slate-50 w-full max-w-5xl max-h-[90vh] rounded-3xl shadow-2xl overflow-hidden flex flex-col">
        {/* HEADER */}
        <div className="bg-white border-b px-8 py-5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <LayoutTemplate className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-800">
                  {data.planName || data.plan_name}
                </h2>
                <span
                  className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase tracking-wider ${
                    data.status === "ACTIVE"
                      ? "bg-emerald-100 text-emerald-600"
                      : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {data.status}
                </span>
              </div>
              <p className="text-sm text-slate-500 font-medium">
                Chi tiết mẫu quy trình đào tạo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-slate-400" />
          </button>
        </div>

        <div className="overflow-y-auto p-8 space-y-8">
          {/* SECTION 1: THÔNG TIN TỔNG QUAN */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Phòng ban
                </p>
                <p className="font-semibold text-slate-700">
                  {departmentLabel}
                </p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                <Briefcase className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Vị trí áp dụng
                </p>
                <p className="font-semibold text-slate-700">{positionLabel}</p>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="text-[11px] font-bold text-slate-400 uppercase">
                  Thời lượng dự kiến
                </p>
                <p className="font-semibold text-slate-700">
                  {data.durationDays || data.duration_days} Ngày
                </p>
              </div>
            </div>
          </div>

          {/* MÔ TẢ */}
          {data.description && (
            <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100">
              <div className="flex items-center gap-2 mb-2">
                <FileText className="w-4 h-4 text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wide">
                  Mục tiêu & Mô tả
                </h4>
              </div>
              <p className="text-slate-600 leading-relaxed italic">
                {data.description}
              </p>
            </div>
          )}

          {/* SECTION 2: DANH SÁCH NHIỆM VỤ */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                Danh sách nhiệm vụ
                <span className="bg-slate-200 text-slate-600 text-xs py-1 px-2.5 rounded-full">
                  {tasks.length}
                </span>
              </h3>

              {totalPages > 1 && (
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => p - 1)}
                    className="p-1.5 hover:bg-white border rounded-lg disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="text-sm font-medium text-slate-600">
                    {currentPage} / {totalPages}
                  </span>
                  <button
                    disabled={currentPage === totalPages}
                    onClick={() => setCurrentPage((p) => p + 1)}
                    className="p-1.5 hover:bg-white border rounded-lg disabled:opacity-30 transition-all shadow-sm"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 gap-3">
              {currentTasks.map((task, idx) => (
                <div
                  key={idx}
                  className="bg-white border border-slate-200 rounded-2xl p-4 hover:shadow-md transition-shadow flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className="w-10 h-10 rounded-full bg-slate-50 flex items-center justify-center text-slate-400 font-bold text-sm group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                      {(currentPage - 1) * ITEMS_PER_PAGE + idx + 1}
                    </div>
                    <div>
                      <h4 className="font-bold text-slate-700">
                        {task.taskTitle || task.task_title}
                      </h4>
                      <div className="flex gap-4 mt-1">
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Layers className="w-3 h-3" /> {task.category}
                        </span>
                        <span className="text-xs font-medium text-slate-400 flex items-center gap-1">
                          <Briefcase className="w-3 h-3" /> Phòng ban thực hiện:{" "}
                          {departmentsList.find(
                            (d) =>
                              String(d.value) ===
                              String(
                                task.responsibleDepartmentId ||
                                  task.responsible_department_id,
                              ),
                          )?.label || "Chưa phân công"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Hoàn thành
                      </p>
                      <p className="text-sm font-bold text-slate-600">
                        {task.estimatedDays || task.estimated_days} ngày
                      </p>
                    </div>
                    <div className="flex flex-col items-center">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Bắt buộc
                      </p>
                      {task.isMandatory || task.is_mandatory ? (
                        <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-slate-300" />
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div className="p-6 bg-white border-t flex justify-end">
          <button
            onClick={onClose}
            className="px-8 py-2.5 bg-slate-800 text-white rounded-xl hover:bg-slate-900 transition-all font-semibold shadow-lg shadow-slate-200"
          >
            Đóng cửa sổ
          </button>
        </div>
      </div>
    </div>
  );
}
