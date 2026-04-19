"use client";

import React, { useState, useEffect } from "react";
import {
  Layers,
  Briefcase,
  Calendar,
  Edit2,
  Eye,
  Trash2,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { PermissionGate } from "@/components/common/AuthGuard";

export default function TemplatesTable({
  templates = [],
  loading,
  onEdit,
  onView,
  onDelete,
}) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  useEffect(() => {
    setCurrentPage(1);
  }, [templates]);

  if (loading) {
    return (
      <div className="w-full py-24 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-500 font-medium">
          Đang tải danh sách mẫu…
        </p>
      </div>
    );
  }

  const totalItems = templates.length;
  const totalPages = Math.ceil(totalItems / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const currentTemplates = templates.slice(startIndex, startIndex + pageSize);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 border-b">
            <tr className="text-slate-500 text-xs uppercase tracking-wide">
              <th className="px-5 py-3 text-left">Mẫu onboarding</th>
              <th className="px-5 py-3 text-left">Phòng ban</th>
              <th className="px-5 py-3 text-center">Vị trí</th>
              <th className="px-5 py-3 text-left">Trạng thái</th>
              <th className="px-5 py-3 text-left">Cập nhật</th>
              <th className="px-5 py-3 text-right">Hành động</th>
            </tr>
          </thead>

          <tbody className="divide-y">
            {currentTemplates.map((template) => (
              <tr
                key={template.id}
                className="hover:bg-slate-50 transition cursor-pointer"
              >
                <td className="px-5 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <Layers className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">
                        {template.planName || "Mẫu không tên"}
                      </p>
                      <p className="text-[11px] text-slate-400">
                        ID: {template.id?.toString().slice(-6)}
                      </p>
                    </div>
                  </div>
                </td>

                <td className="px-5 py-4 text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-slate-400" />
                    {template.department?.departmentName || "Nghiệp vụ chung"}
                  </div>
                </td>

                <td className="px-5 py-4 text-center">
                  <span className="inline-block px-3 py-1 rounded-full bg-slate-100 text-xs font-semibold text-slate-600">
                    {template.position?.positionName || "Tất cả"}
                  </span>
                </td>

                <td className="px-5 py-4">
                  <span
                    className={`inline-flex items-center gap-2 px-3 py-1 rounded-md text-[11px] font-bold
                    ${
                      template.status === "ACTIVE"
                        ? "bg-emerald-50 text-emerald-600"
                        : "bg-amber-50 text-amber-600"
                    }`}
                  >
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        template.status === "ACTIVE"
                          ? "bg-emerald-500"
                          : "bg-amber-500"
                      }`}
                    />
                    {template.status === "ACTIVE" ? "Đang dùng" : "Bản nháp"}
                  </span>
                </td>

                <td className="px-5 py-4 text-slate-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4" />
                    {template.updatedAt
                      ? new Date(template.updatedAt).toLocaleDateString("vi-VN")
                      : "---"}
                  </div>
                </td>

                <td className="px-5 py-4 text-right">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onView(template)}
                      className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-indigo-600"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    <PermissionGate permission="ONBOARDING_PLAN_UPDATE">
                      <button
                        onClick={() => onEdit(template)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-amber-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="ONBOARDING_PLAN_DELETE">
                      <button
                        onClick={() => onDelete(template)}
                        className="p-2 rounded-lg hover:bg-slate-100 text-slate-500 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </PermissionGate>
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div className="px-5 py-4 border-t border-slate-200 bg-slate-50/50 flex items-center justify-between">
          <p className="text-xs text-slate-500 font-medium">
            Hiển thị <span className="text-slate-900">{startIndex + 1}</span> -{" "}
            <span className="text-slate-900">
              {Math.min(startIndex + pageSize, totalItems)}
            </span>{" "}
            trong tổng số <span className="text-slate-900">{totalItems}</span>{" "}
            mẫu
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-1">
              {[...Array(totalPages)].map((_, index) => (
                <button
                  key={index + 1}
                  onClick={() => goToPage(index + 1)}
                  className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                    currentPage === index + 1
                      ? "bg-indigo-600 text-white shadow-md shadow-indigo-200"
                      : "bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
                  }`}
                >
                  {index + 1}
                </button>
              ))}
            </div>

            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="p-2 rounded-lg border border-slate-200 bg-white text-slate-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50 transition"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
