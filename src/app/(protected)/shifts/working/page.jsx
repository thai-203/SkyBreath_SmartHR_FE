"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { 
  Plus, Search, Clock, RefreshCcw, Filter, 
  ChevronDown, Check, CalendarDays 
} from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { workingShiftsService, shiftGroupsService } from "@/services";

import WorkingShiftTable from "./components/WorkingShiftTable";
import WorkingShiftFormModal from "./components/WorkingShiftFormModal";
import WorkingShiftDeleteModal from "./components/WorkingShiftDeleteModal";

const initialData = {
  shiftName: "",
  startTime: "",
  endTime: "",
  breakStartTime: "",
  breakEndTime: "",
  groupId: "",
};

export default function WorkingShiftsPage() {
  const { success, error } = useToast();
  
  // -- States --
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = useState(1);
  const [groupOptions, setGroupOptions] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState("");
  
  // Dropdown Filter State
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const filterRef = useRef(null);

  // Modal States
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [formLoading, setFormLoading] = useState(false);

  // -- Actions --
  const fetchGroups = async () => {
    try {
      const res = await shiftGroupsService.getAll({ page: 1, limit: 100 });
      setGroupOptions(
        (res.items || []).map((g) => ({
          value: g.id,
          label: g.groupName,
        }))
      );
    } catch (err) {
      console.error("Lỗi lấy danh sách nhóm:", err);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await workingShiftsService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search,
        groupId: selectedGroup || undefined,
      });
      setData(res.items || []);
      setTotalPages(res.total || 1);
    } catch (err) {
      error(err.response?.data?.message || "Lỗi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, selectedGroup, error]);

  // -- Effects --
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchGroups();
  }, []);

  // Đóng dropdown khi click ngoài vùng filter
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (filterRef.current && !filterRef.current.contains(event.target)) {
        setIsFilterOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // -- Handlers --
  const handleCreate = () => {
    setSelected(null);
    setFormData(initialData);
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setSelected(item);
    setFormData({
      shiftName: item.shiftName,
      startTime: item.startTime || "",
      endTime: item.endTime || "",
      breakStartTime: item.breakStartTime || "",
      breakEndTime: item.breakEndTime || "",
      groupId: item.groupId || "",
    });
    setIsFormOpen(true);
  };

  const handleDelete = (item) => {
    setSelected(item);
    setIsDeleteOpen(true);
  };

  const submitForm = async () => {
    setFormLoading(true);
    try {
      if (selected) {
        await workingShiftsService.update(selected.id, formData);
        success("Cập nhật ca làm việc thành công");
      } else {
        await workingShiftsService.create(formData);
        success("Tạo ca làm việc thành công");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Đã xảy ra lỗi");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    setFormLoading(true);
    try {
      await workingShiftsService.delete(selected.id);
      success("Xóa ca làm việc thành công");
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Lỗi khi xóa");
    } finally {
      setFormLoading(false);
    }
  };

  // Lấy nhãn của nhóm đang chọn
  const activeGroupName = groupOptions.find(g => g.value === selectedGroup)?.label || "Tất cả nhóm";

  return (
    <div className="p-6 space-y-6 bg-slate-50/50 min-h-screen">
      {/* --- Section: Header --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-600 mb-1">
            <Clock size={18} />
            <span className="text-[11px] font-bold uppercase tracking-wider">Lịch trình nhân sự</span>
          </div>
          <PageTitle title="Quản lý ca làm việc" className="text-2xl font-bold text-slate-800" />
          <p className="text-slate-500 text-sm">Quản lý khung giờ làm việc và nghỉ ngơi của nhân viên.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={fetchData}
            className="p-2.5 text-slate-500 hover:bg-white hover:shadow-sm rounded-xl transition-all border border-transparent hover:border-slate-200"
            title="Làm mới dữ liệu"
          >
            <RefreshCcw size={20} className={loading ? "animate-spin" : ""} />
          </button>
          <Button 
            onClick={handleCreate} 
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-100 flex items-center gap-2 border-none transition-all active:scale-95"
          >
            <Plus size={18} strokeWidth={2.5} />
            <span className="font-semibold">Thêm ca mới</span>
          </Button>
        </div>
      </div>

      {/* --- Section: Main Content --- */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        
        {/* Toolbar: Filters & Search */}
        <div className="p-5 border-b border-slate-100 bg-white">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            
            <div className="flex flex-wrap items-center gap-4">
              {/* Custom Dropdown Filter */}
              <div className="relative" ref={filterRef}>
                <button
                  onClick={() => setIsFilterOpen(!isFilterOpen)}
                  className={`flex items-center gap-2 bg-white border ${
                    isFilterOpen ? "border-blue-500 ring-2 ring-blue-500/10" : "border-slate-200"
                  } rounded-xl px-3 py-1.5 shadow-sm hover:border-blue-400 transition-all text-left min-w-[200px]`}
                >
                  <div className="text-slate-400 pr-2 border-r border-slate-100">
                    <Filter size={18} />
                  </div>
                  <div className="flex flex-col flex-1 overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tight leading-none pt-0.5">Nhóm ca</span>
                    <span className="text-[14px] font-semibold text-slate-700 truncate pt-0.5">{activeGroupName}</span>
                  </div>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
                </button>

                {isFilterOpen && (
                  <div className="absolute z-50 w-full bg-white border border-slate-100 rounded-xl shadow-xl py-1 animate-in fade-in zoom-in duration-100 origin-top">
                    <ul className="max-h-60 overflow-auto">
                      <li
                        onClick={() => { setSelectedGroup(""); setIsFilterOpen(false); }}
                        className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                          selectedGroup === "" ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                        }`}
                      >
                        Tất cả nhóm
                        {selectedGroup === "" && <Check size={14} />}
                      </li>
                      {groupOptions.map((opt) => (
                        <li
                          key={opt.value}
                          onClick={() => { setSelectedGroup(opt.value); setIsFilterOpen(false); }}
                          className={`flex items-center justify-between px-3 py-2.5 text-sm cursor-pointer transition-colors ${
                            selectedGroup === opt.value ? "bg-blue-50 text-blue-600 font-bold" : "text-slate-600 hover:bg-slate-50"
                          }`}
                        >
                          <span className="truncate">{opt.label}</span>
                          {selectedGroup === opt.value && <Check size={14} />}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              
              <div className="h-8 w-[1px] bg-slate-100 hidden md:block"></div>
              
              <div className="flex items-center gap-2 text-slate-400">
                <span className="text-xs font-medium uppercase tracking-wider">Tổng cộng:</span>
                <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-md text-xs font-bold">
                  {data.length}
                </span>
              </div>
            </div>

            {/* Search Box */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input 
                type="text"
                placeholder="Tìm kiếm theo tên ca..."
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* --- Section: Table --- */}
        <div className="p-2">
          <WorkingShiftTable
            data={data}
            loading={loading}
            pagination={pagination}
            onPaginationChange={setPagination}
            totalPages={totalPages}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        </div>
      </div>

      {/* --- Modals --- */}
      <WorkingShiftFormModal
        open={isFormOpen}
        loading={formLoading}
        data={formData}
        setData={setFormData}
        groups={groupOptions}
        onClose={() => setIsFormOpen(false)}
        onSubmit={submitForm}
        isEdit={!!selected}
      />
      <WorkingShiftDeleteModal
        open={isDeleteOpen}
        loading={formLoading}
        name={selected?.shiftName}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
    </div>
  );
}