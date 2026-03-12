"use client";

import React, { useState } from "react";
import { 
  Layout, 
  Briefcase, 
  User, 
  Mail, 
  ChevronRight, 
  ChevronLeft 
} from "lucide-react";

export default function OnboardingProgressTable({ progressList = [], loading, onRowClick }) {
  /* ================== PHÂN TRANG LOGIC ================== */
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6; // Số dòng trên mỗi trang

  // Tính toán chỉ số dữ liệu
  const totalPages = Math.ceil(progressList.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = progressList.slice(startIndex, startIndex + itemsPerPage);

  // Reset về trang 1 nếu dữ liệu thay đổi (ví dụ khi filter)
  React.useEffect(() => {
    setCurrentPage(1);
  }, [progressList.length]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium italic">Đang tải dữ liệu tiến trình...</p>
      </div>
    );
  }

  if (!progressList || progressList.length === 0) {
    return (
      <div className="p-20 text-center border-2 border-dashed border-slate-100 rounded-3xl m-8">
        <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <User className="w-8 h-8 text-slate-300" />
        </div>
        <p className="text-slate-400 font-medium">Không có tiến trình onboarding nào đang chạy</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <div className="overflow-x-auto px-4">
        <table className="w-full text-left border-separate border-spacing-y-3">
          <thead>
            <tr className="text-slate-400">
              <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest">Nhân sự</th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest">Phòng ban & Vị trí</th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest">Thời hạn (Waterfall)</th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest">Trạng thái</th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest w-1/5">Tiến độ</th>
              <th className="px-6 py-2 text-[10px] font-bold uppercase tracking-widest text-center">Chi tiết</th>
            </tr>
          </thead>

          <tbody>
            {currentItems.map((p) => (
              <tr
                key={p.id}
                className="group bg-white border border-slate-100 rounded-2xl shadow-sm hover:shadow-md hover:border-indigo-100 transition-all cursor-pointer"
                onClick={() => onRowClick(p)}
              >
                {/* Nhân viên */}
                <td className="px-6 py-4 rounded-l-2xl border-y border-l border-transparent group-hover:border-indigo-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 font-bold text-sm border border-indigo-100">
                      {p.employee?.fullName?.charAt(0) || "?"}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 text-sm leading-none mb-1">
                        {p.employee?.fullName || "—"}
                      </div>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400">
                        <Mail className="w-3 h-3" />
                        {p.employee?.companyEmail || "N/A"}
                      </div>
                    </div>
                  </div>
                </td>

                {/* Phòng ban & Vị trí */}
                <td className="px-6 py-4 border-y border-transparent group-hover:border-indigo-100">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                      <Layout className="w-3.5 h-3.5 text-slate-400" />
                      {p.employee?.department?.departmentName || "—"}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-500 uppercase tracking-tighter">
                      <Briefcase className="w-3.5 h-3.5 text-slate-300" />
                      {p.employee?.position?.positionName || "—"}
                    </div>
                  </div>
                </td>

                {/* Thời hạn */}
                <td className="px-6 py-4 border-y border-transparent group-hover:border-indigo-100">
                  <div className="flex flex-col">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">S</span>
                      <span className="text-sm font-bold text-slate-700">
                        {p.startDate ? formatDate(p.startDate) : "—"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-1.5 py-0.5 rounded">E</span>
                      <span className="text-sm font-bold text-slate-700">
                        {p.expectedEndDate ? formatDate(p.expectedEndDate) : "—"}
                      </span>
                    </div>
                  </div>
                </td>

                {/* Trạng thái */}
                <td className="px-6 py-4 border-y border-transparent group-hover:border-indigo-100">
                  <StatusBadge status={p.overallStatus} />
                </td>

                {/* Tiến độ */}
                <td className="px-6 py-4 border-y border-transparent group-hover:border-indigo-100">
                  <div className="flex flex-col gap-1.5">
                    <div className="flex justify-between items-end">
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">Hoàn thành</span>
                      <span className="text-xs font-black text-indigo-600">
                        {Math.round(p.progressPercentage || 0)}%
                      </span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all duration-1000 ease-out shadow-[0_0_8px_rgba(79,70,229,0.4)]"
                        style={{ width: `${p.progressPercentage || 0}%` }}
                      />
                    </div>
                  </div>
                </td>

                {/* Chi tiết button */}
                <td className="px-6 py-4 rounded-r-2xl border-y border-r border-transparent group-hover:border-indigo-100 text-center">
                  <button
                    className="p-2 hover:bg-indigo-50 rounded-full text-slate-300 hover:text-indigo-600 transition-all"
                    onClick={(e) => {
                      e.stopPropagation();
                      onRowClick(p);
                    }}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* ================== ĐIỀU HƯỚNG PHÂN TRANG ================== */}
      <div className="px-6 py-4 flex items-center justify-between mt-2 border-t border-slate-50">
        <div className="text-xs text-slate-500 font-medium">
          Hiển thị <span className="text-slate-900 font-bold">{startIndex + 1}</span> -{" "}
          <span className="text-slate-900 font-bold">
            {Math.min(startIndex + itemsPerPage, progressList.length)}
          </span>{" "}
          trên <span className="text-slate-900 font-bold">{progressList.length}</span> kết quả
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="p-2 rounded-xl border border-slate-200 hover:bg-white hover:border-indigo-300 disabled:opacity-30 disabled:hover:border-slate-200 transition-all shadow-sm group"
          >
            <ChevronLeft className="w-4 h-4 text-slate-600 group-hover:text-indigo-600" />
          </button>

          <div className="flex items-center gap-1.5">
            {[...Array(totalPages)].map((_, i) => (
              <button
                key={i + 1}
                onClick={() => setCurrentPage(i + 1)}
                className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                  currentPage === i + 1
                    ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100 scale-110"
                    : "text-slate-500 hover:bg-white hover:text-indigo-600 border border-transparent hover:border-indigo-100"
                }`}
              >
                {i + 1}
              </button>
            ))}
          </div>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="p-2 rounded-xl border border-slate-200 hover:bg-white hover:border-indigo-300 disabled:opacity-30 disabled:hover:border-slate-200 transition-all shadow-sm group"
          >
            <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-indigo-600" />
          </button>
        </div>
      </div>
    </div>
  );
}

/* ================== HELPER: FORMAT DATE ================== */
function formatDate(dateStr) {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  return date.toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ================== STATUS BADGE ================== */
function StatusBadge({ status }) {
  const configs = {
    COMPLETED: {
      label: "Hoàn thành",
      className: "bg-emerald-50 text-emerald-700 border-emerald-100",
    },
    IN_PROGRESS: {
      label: "Đang diễn ra",
      className: "bg-indigo-50 text-indigo-700 border-indigo-100",
    },
    NOT_STARTED: {
      label: "Chưa bắt đầu",
      className: "bg-slate-50 text-slate-500 border-slate-200",
    },
    DELAYED: {
      label: "Trễ hạn",
      className: "bg-rose-50 text-rose-700 border-rose-100",
    },
  };

  const config = configs[status] || configs.NOT_STARTED;

  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-xl text-[10px] font-black border uppercase tracking-wider ${config.className}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current mr-2 animate-pulse" />
      {config.label}
    </span>
  );
}