"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Plus, Search, LayoutGrid, RefreshCcw, Info } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { shiftGroupsService } from "@/services";

import ShiftGroupTable from "./components/ShiftGroupTable";
import ShiftGroupFormModal from "./components/ShiftGroupFormModal";
import ShiftGroupDeleteModal from "./components/ShiftGroupDeleteModal";
import ShiftGroupDetailModal from "./components/ShiftGroupDetailModal"; // detail view

export default function ShiftGroupsPage() {
  const { success, error } = useToast();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = useState(1);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailGroup, setDetailGroup] = useState(null);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState({
    groupName: "",
    description: "",
    status: "active",
  });
  const [formLoading, setFormLoading] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shiftGroupsService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search,
      });
      setData(res?.items || []);
      setTotalPages(res?.total || 1);
    } catch (err) {
      error(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, error]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleCreate = () => {
    setSelected(null);
    setFormData({ groupName: "", description: "", status: "active" });
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setSelected(item);
    setFormData({
      groupName: item.groupName,
      description: item.description || "",
      status: item.status || "active",
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    setSelected(item);
    setIsDeleteOpen(true);
  };

  const handleView = async (item) => {
    try {
      const res = await shiftGroupsService.getById(item.id);
      setDetailGroup(res.data);
      setIsDetailOpen(true);
    } catch (err) {
      error(err.response?.data?.message || "Lỗi tải chi tiết");
    }
  };

  const submitForm = async () => {
    setFormLoading(true);
    try {
      if (selected) {
        await shiftGroupsService.update(selected.id, formData);
        success("Cập nhật nhóm ca thành công");
      } else {
        await shiftGroupsService.create(formData);
        success("Tạo nhóm ca thành công");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Lỗi");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    setFormLoading(true);
    try {
      await shiftGroupsService.delete(selected.id);
      success("Xóa nhóm ca thành công");
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Lỗi");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <LayoutGrid size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Thiết lập tổ chức
            </span>
          </div>
          <PageTitle
            title="Quản lý nhóm ca"
            className="text-2xl font-bold text-slate-800"
          />
          <p className="text-slate-500 text-sm mt-1">
            Tổ chức và phân loại các nhóm làm việc theo ca kíp.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={fetchData}
            className="p-2.5 text-slate-500 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200"
            title="Làm mới"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <Button
            onClick={handleCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 border-none"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="font-semibold">Thêm nhóm mới</span>
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row justify-between items-center gap-4 bg-white">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-700">Danh sách nhóm ca</h3>
            <span className="px-2.5 py-0.5 bg-blue-50 text-blue-600 rounded-full text-xs font-bold border border-blue-100">
              {data.length} nhóm
            </span>
          </div>

          <div className="relative w-full sm:w-80">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              placeholder="Tìm kiếm theo tên hoặc mô tả..."
              className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>

        <div className="p-2">
          <ShiftGroupTable
            data={data}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalPages={totalPages}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onView={handleView}
          />
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex items-center gap-2">
          <Info size={14} className="text-slate-400" />
          <span className="text-[12px] text-slate-500 italic">
            Nhấn vào biểu tượng bút chì để chỉnh sửa hoặc thùng rác để xóa nhóm
            ca.
          </span>
        </div>
      </div>

      <ShiftGroupFormModal
        open={isFormOpen}
        loading={formLoading}
        data={formData}
        setData={setFormData}
        onClose={() => setIsFormOpen(false)}
        onSubmit={submitForm}
        isEdit={!!selected}
      />
      <ShiftGroupDeleteModal
        open={isDeleteOpen}
        loading={formLoading}
        name={selected?.groupName}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
      <ShiftGroupDetailModal
        open={isDetailOpen}
        group={detailGroup}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
