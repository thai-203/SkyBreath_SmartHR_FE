"use client";

import { useEffect, useState, useCallback } from "react";
import { Plus, Search, Layers } from "lucide-react";
import { payrollTypeService } from "@/services";
import { PermissionGate } from "@/components/common/AuthGuard";
import PayrollTypeTable from "./components/PayrollTypeTable";
import CreatePayrollTypeModal from "./components/CreatePayrollTypeModal";
import { toast } from "sonner";

export default function PayrollTypesPage() {
  const [types, setTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingType, setEditingType] = useState(null);

  const fetchTypes = useCallback(async () => {
    setLoading(true);
    try {
      const data = await payrollTypeService.getAll({ search: searchTerm });
      setTypes(data.items || []);
    } catch (error) {
      toast.error("Không thể tải danh sách loại bảng lương");
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchTypes();
  }, [fetchTypes]);

  const handleCreate = () => {
    setEditingType(null);
    setIsModalOpen(true);
  };

  const handleEdit = (type) => {
    setEditingType(type);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Bạn có chắc chắn muốn xóa loại bảng lương này?")) {
      try {
        await payrollTypeService.delete(id);
        toast.success("Xóa thành công");
        fetchTypes();
      } catch (error) {
        toast.error("Xóa thất bại");
      }
    }
  };

  const handleSave = async (data) => {
    try {
      if (editingType) {
        await payrollTypeService.update(editingType.id, data);
        toast.success("Cập nhật thành công");
      } else {
        await payrollTypeService.create(data);
        toast.success("Tạo mới thành công");
      }
      fetchTypes();
    } catch (error) {
      toast.error(error.response?.data?.message || "Lưu thất bại");
      throw error;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Danh sách loại bảng lương</h1>
          <p className="text-sm text-slate-500">Quản lý các cấu hình bảng lương khác nhau</p>
        </div>
        <PermissionGate permission="PAYROLL_TYPE_CREATE">
          <button
            onClick={handleCreate}
            className="flex items-center gap-2 rounded-lg bg-indigo-500 px-4 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/20 transition-all hover:bg-indigo-600 active:scale-95"
          >
            <Plus className="h-4 w-4" />
            Thêm loại bảng lương
          </button>
        </PermissionGate>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col gap-4 rounded-xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm tên bảng lương..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2 pl-10 pr-4 text-sm transition-all focus:border-indigo-500 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 text-slate-700"
          />
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
            <Layers className="h-4 w-4" />
            <span>Tổng cộng: <span className="font-semibold text-slate-900">{types.length}</span> loại</span>
        </div>
      </div>

      {/* Table */}
      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
        </div>
      ) : (
        <PayrollTypeTable 
          types={types} 
          onEdit={handleEdit} 
          onDelete={handleDelete} 
        />
      )}

      {/* Modals */}
      <CreatePayrollTypeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        initialData={editingType}
      />
    </div>
  );
}
