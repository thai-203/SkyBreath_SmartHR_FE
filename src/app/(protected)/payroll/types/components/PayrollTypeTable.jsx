"use client";

import { Edit, Trash2 } from "lucide-react";
import { PermissionGate } from "@/components/common/AuthGuard";

export default function PayrollTypeTable({ types, onEdit, onDelete }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white shadow-sm">
      <table className="w-full text-left text-sm text-slate-600">
        <thead className="bg-slate-50 text-xs font-semibold uppercase text-slate-500">
          <tr>
            <th className="px-6 py-4">Người tạo</th>
            <th className="px-6 py-4">Mã</th>
            <th className="px-6 py-4">Tên bảng lương</th>
            <th className="px-6 py-4">Từ khoá (Key)</th>
            <th className="px-6 py-4">Phòng ban</th>
            <th className="px-6 py-4">Vị trí</th>
            <th className="px-6 py-4 text-center">Thao tác</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {types.length > 0 ? (
            types.map((type) => (
              <tr key={type.id} className="hover:bg-slate-50/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 text-xs font-bold text-indigo-600">
                      {type.creator?.username?.charAt(0).toUpperCase()}
                    </div>
                    <span className="font-medium text-slate-700">
                      {type.creator?.username}
                    </span>
                  </div>
                </td>
                <td className="px-6 py-4 font-mono text-xs">{type.payrollTypeCode}</td>
                <td className="px-6 py-4 font-medium text-slate-900">{type.name}</td>
                <td className="px-6 py-4 font-mono text-xs text-indigo-600 bg-indigo-50 px-2 py-1 rounded inline-block">
                  {type.keyword}
                </td>
                <td className="px-6 py-4 text-slate-600">
                   {type.department?.departmentName || "Tất cả"}
                </td>
                <td className="px-6 py-4 text-slate-600">
                   {type.position?.positionName || "Tất cả"}
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <PermissionGate permission="PAYROLL_TYPE_UPDATE">
                      <button
                        onClick={() => onEdit(type)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                        title="Sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </button>
                    </PermissionGate>
                    <PermissionGate permission="PAYROLL_TYPE_DELETE">
                      <button
                        onClick={() => onDelete(type.id)}
                        className="rounded-lg p-2 text-slate-400 hover:bg-red-50 hover:text-red-600 transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </PermissionGate>
                  </div>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="px-6 py-10 text-center text-slate-400">
                Chưa có dữ liệu loại bảng lương.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
