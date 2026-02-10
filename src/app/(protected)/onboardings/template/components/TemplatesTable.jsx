"use client";

import React from "react";
import { 
  Layers, 
  Briefcase, 
  Calendar, 
  MoreVertical, 
  Edit3, 
  Copy, 
  Trash2,
  ChevronRight 
} from "lucide-react";

export default function TemplatesTable({ templates, loading }) {
    console.log("Rendering TemplatesTable with templates:", templates, "and loading:", loading);
  if (loading) {
    return (
      <div className="w-full p-20 flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-4 border-indigo-600/20 border-t-indigo-600 rounded-full animate-spin" />
        <p className="mt-4 text-slate-500 font-medium">Đang tải danh sách mẫu...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-slate-50/50 border-b border-slate-100">
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Thông tin mẫu</th>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Phòng ban</th>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400 text-center">Vị Trí</th>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Trạng thái</th>
            <th className="px-6 py-4 text-[11px] font-bold uppercase tracking-wider text-slate-400">Ngày cập nhật</th>
            <th className="px-6 py-4"></th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {templates.map((template) => (
            <tr key={template.id} className="group hover:bg-slate-50/80 transition-all cursor-pointer">
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">
                      {template.planName || "Mẫu không tên"}
                    </div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">
                      ID: {template.id?.toString().slice(-6)}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-slate-600">
                  <Briefcase className="w-4 h-4 text-slate-300" />
                  {template.department.departmentName || "Nghiệp vụ chung"}
                </div>
              </td>
              <td className="px-6 py-4 text-center">
                <span className="px-3 py-1 bg-slate-100 rounded-full text-xs font-bold text-slate-600">
                  {template.position.positionName || "Tất cả vị trí"}
                </span>
              </td>
              <td className="px-6 py-4">
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold ${
                  template.status === "ACTIVE" 
                  ? "bg-emerald-50 text-emerald-600" 
                  : "bg-amber-50 text-amber-600"
                }`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${template.status === "ACTIVE" ? "bg-emerald-500" : "bg-amber-500"}`} />
                  {template.status === "ACTIVE" ? "ĐANG DÙNG" : "BẢN NHÁP"}
                </span>
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                  <Calendar className="w-4 h-4" />
                  {template.updatedAt ? new Date(template.updatedAt).toLocaleDateString("vi-VN") : "---"}
                </div>
              </td>
              <td className="px-6 py-4 text-right">
                <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all">
                  <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-indigo-600">
                    <Copy className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-amber-600">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button className="p-2 hover:bg-white rounded-lg border border-transparent hover:border-slate-200 text-slate-400 hover:text-red-600">
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <ChevronRight className="w-5 h-5 text-slate-300 ml-2" />
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}