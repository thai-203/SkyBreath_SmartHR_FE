"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { departmentsService } from "@/services/departments.service";
import { positionsService } from "@/services/positions.service";

export default function CreatePayrollTypeModal({ isOpen, onClose, onSave, initialData }) {
  const [formData, setFormData] = useState({
    payrollTypeCode: "",
    name: "",
    keyword: "",
    description: "",
    departmentId: "",
    positionId: "",
  });

  const [departments, setDepartments] = useState([]);
  const [positions, setPositions] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchDepartments();
      fetchPositions();
      if (initialData) {
        setFormData({
          payrollTypeCode: initialData.payrollTypeCode || "",
          name: initialData.name || "",
          keyword: initialData.keyword || "",
          description: initialData.description || "",
          departmentId: initialData.departmentId || "",
          positionId: initialData.positionId || "",
        });
      } else {
        setFormData({
          payrollTypeCode: "",
          name: "",
          keyword: "",
          description: "",
          departmentId: "",
          positionId: "",
        });
      }
    }
  }, [isOpen, initialData]);

  const fetchDepartments = async () => {
    try {
      const res = await departmentsService.getList();
      setDepartments(res.data || []);
    } catch (error) {
      console.error("Failed to fetch departments", error);
    }
  };

  const fetchPositions = async () => {
    try {
      const res = await positionsService.getList();
      setPositions(res.data || []);
    } catch (error) {
      console.error("Failed to fetch positions", error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const dataToSave = {
        ...formData,
        departmentId: formData.departmentId ? parseInt(formData.departmentId) : null,
        positionId: formData.positionId ? parseInt(formData.positionId) : null,
      };
      await onSave(dataToSave);
      onClose();
    } catch (error) {
      console.error("Failed to save payroll type", error);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity" onClick={onClose} />
      
      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between border-b border-slate-100 p-6">
          <h2 className="text-xl font-bold text-slate-900">
            {initialData ? "Chỉnh sửa loại bảng lương" : "Thêm loại bảng lương"}
          </h2>
          <button onClick={onClose} className="rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 text-slate-700">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Mã loại bảng lương</label>
              <input
                required
                type="text"
                value={formData.payrollTypeCode}
                onChange={(e) => setFormData({ ...formData, payrollTypeCode: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                placeholder="Ví dụ: 101"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Từ khoá (Key)</label>
              <input
                required
                type="text"
                value={formData.keyword}
                onChange={(e) => setFormData({ ...formData, keyword: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-mono"
                placeholder="Ví dụ: CADONG"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Tên bảng lương</label>
            <input
              required
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              placeholder="Ví dụ: BẢNG LƯƠNG CẤP ĐÔNG"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Phòng ban áp dụng</label>
              <select
                value={formData.departmentId}
                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Tất cả phòng ban</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>{dept.departmentName}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-slate-700">Vị trí áp dụng</label>
              <select
                value={formData.positionId}
                onChange={(e) => setFormData({ ...formData, positionId: e.target.value })}
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              >
                <option value="">Tất cả vị trí</option>
                {positions.map((pos) => (
                  <option key={pos.id} value={pos.id}>{pos.positionName}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-slate-700">Mô tả</label>
            <textarea
              rows="3"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded-lg bg-indigo-500 px-4 py-2 text-sm font-medium text-white shadow-lg shadow-indigo-500/20 hover:bg-indigo-600 transition-all disabled:opacity-50"
            >
              {loading ? "Đang xử lý..." : initialData ? "Cập nhật" : "Tạo mới"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
