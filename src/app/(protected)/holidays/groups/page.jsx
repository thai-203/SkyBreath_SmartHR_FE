"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Plus, 
  Trash2, 
  Edit, 
  Calendar,
  Layers,
  ChevronDown,
  Search,
} from "lucide-react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Card } from "@/components/common/Card";
import { useToast } from "@/components/common/Toast";
import { holidayConfigService, holidayService } from "@/services";
import { HolidayGroupModal } from "../components/HolidayGroupModal";
import { HolidayModal } from "../components/HolidayModal";
import { HolidayTable } from "../components/HolidayTable";
import { useRouter } from "next/navigation";

export default function HolidayGroupsPage() {
  const router = useRouter();
  const { success: toastSuccess, error: toastError } = useToast();
  
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // ── Group Modal State ────────────────────────────────
  const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);

  // ── Inline Holiday Filtering ─────────────────────────
  const [filterGroupId, setFilterGroupId] = useState("");
  const [holidays, setHolidays] = useState([]);
  const [loadingHolidays, setLoadingHolidays] = useState(false);
  const [holidayFilters, setHolidayFilters] = useState({
    search: "", holidayType: "", startDate: "", endDate: ""
  });
  const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
  const [editingHoliday, setEditingHoliday] = useState(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const groupsRes = await holidayConfigService.getGroups();
      if (groupsRes.success) setGroups(groupsRes.data);
    } catch (err) {
      toastError("Không thể tải danh sách danh mục");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);

  // ── Group Actions ─────────────────────────────────────
  const handleOpenGroupModal = (group = null) => {
    setEditingGroup(group || null);
    setIsGroupModalOpen(true);
  };

  const handleSaveGroup = async (data) => {
    try {
      if (editingGroup) {
        await holidayConfigService.updateGroup(editingGroup.id, data);
        toastSuccess("Cập nhật danh mục thành công");
      } else {
        await holidayConfigService.createGroup(data);
        toastSuccess("Thêm danh mục mới thành công");
      }
      setIsGroupModalOpen(false);
      fetchData();
    } catch (err) {
      toastError(err.response?.data?.message || "Lỗi khi lưu danh mục");
    }
  };

  const handleDeleteGroup = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa nhóm này?")) {
      try {
        await holidayConfigService.deleteGroup(id);
        toastSuccess("Xóa nhóm thành công");
        if (String(filterGroupId) === String(id)) setFilterGroupId("");
        fetchData();
      } catch (err) {
        toastError(err.response?.data?.message || "Lỗi khi xóa nhóm");
      }
    }
  };

  // ── Holiday Actions (Inline) ──────────────────────────
  const fetchHolidays = useCallback(async () => {
    if (!filterGroupId) { setHolidays([]); return; }
    setLoadingHolidays(true);
    try {
      const res = await holidayService.findAll({
        holidayGroupId: filterGroupId,
        ...holidayFilters,
      });
      if (res.success) setHolidays(res.data || []);
    } catch {
      toastError("Không thể tải danh sách ngày nghỉ");
    } finally {
      setLoadingHolidays(false);
    }
  }, [filterGroupId, holidayFilters]);

  useEffect(() => { fetchHolidays(); }, [fetchHolidays]);

  const handleHolidaySubmit = async (data) => {
    try {
      const payload = { ...data, holidayGroupId: parseInt(filterGroupId) };
      if (editingHoliday) {
        await holidayService.update(editingHoliday.id, payload);
        toastSuccess("Cập nhật ngày nghỉ thành công");
      } else {
        await holidayService.create(payload);
        toastSuccess("Thêm mới ngày nghỉ thành công");
      }
      setIsHolidayModalOpen(false);
      fetchHolidays();
    } catch (error) {
      toastError(error.response?.data?.message || "Thao tác thất bại");
      throw error;
    }
  };

  const handleDeleteHoliday = async (id) => {
    if (confirm("Bạn có chắc chắn muốn xóa ngày nghỉ này?")) {
      try {
        await holidayService.delete(id);
        toastSuccess("Xóa ngày nghỉ thành công");
        fetchHolidays();
      } catch {
        toastError("Xóa ngày nghỉ thất bại");
      }
    }
  };

  const activeGroupName = groups.find(g => String(g.id) === String(filterGroupId))?.groupName;

  if (loading) {
    return <div className="p-8 text-center text-slate-500 animate-pulse">Đang tải danh mục...</div>;
  }

  return (
    <div className="space-y-6 container mx-auto py-8">
      <PageTitle title="Danh mục Nhóm Ngày lễ" />

      <Card className="p-6">
        <div className="flex items-center justify-between mb-6 border-b pb-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-6 w-6 text-indigo-500" />
            <div>
              <h2 className="text-xl font-bold text-slate-900">Danh mục Nhóm Ngày lễ</h2>
              <p className="text-sm text-slate-500 mt-0.5">Quản lý và thiết lập các nhóm ngày lễ theo năm.</p>
            </div>
          </div>
          <Button onClick={() => handleOpenGroupModal()}>
            <Plus className="h-4 w-4 mr-2" />
            Thêm nhóm mới
          </Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse">
            <thead className="bg-slate-50 text-slate-500 font-semibold uppercase text-[11px] tracking-wider">
              <tr>
                <th className="px-5 py-4 whitespace-nowrap border-b">Mã nhóm</th>
                <th className="px-5 py-4 whitespace-nowrap border-b">Tên danh mục</th>
                <th className="px-5 py-4 whitespace-nowrap border-b">Năm áp dụng</th>
                <th className="px-5 py-4 whitespace-nowrap border-b">Trạng thái</th>
                <th className="px-5 py-4 whitespace-nowrap border-b">Mô tả</th>
                <th className="px-5 py-4 text-right whitespace-nowrap border-b">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {groups.map((group) => (
                <tr key={group.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="px-5 py-4 font-mono text-xs text-indigo-600 font-medium">{group.groupCode}</td>
                  <td className="px-5 py-4 font-semibold text-slate-800">{group.groupName}</td>
                  <td className="px-5 py-4 text-slate-600">{group.year}</td>
                  <td className="px-5 py-4">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide shadow-sm ${
                      group.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {group.status}
                    </span>
                  </td>
                  <td className="px-5 py-4 text-slate-500 italic max-w-xs truncate">{group.description || "Không có mô tả"}</td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleOpenGroupModal(group)} className="hover:bg-indigo-50 hover:text-indigo-600">
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => handleDeleteGroup(group.id)} className="text-red-500 hover:bg-red-50 hover:text-red-600">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {groups.length === 0 && (
                <tr>
                  <td colSpan="6" className="px-5 py-10 text-center text-slate-400 italic bg-slate-50/30">
                    Chưa có danh mục nào được định nghĩa
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ── Section Divider ─────────────────────────────────── */}
        <div className="flex items-center gap-3 my-10">
          <div className="flex-1 h-px bg-slate-200" />
          <span className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-600 text-[11px] font-bold uppercase tracking-widest">
            <Layers className="h-3.5 w-3.5" />
            Chi tiết ngày nghỉ trong nhóm
          </span>
          <div className="flex-1 h-px bg-slate-200" />
        </div>

        {/* ── Inline Holiday Content ────────────────────────────── */}
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 bg-slate-50/50 rounded-xl border border-slate-100 shadow-sm">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${filterGroupId ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-200 text-slate-400'}`}>
                <Layers className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-bold text-slate-800">Cấu hình ngày nghỉ</h3>
                {activeGroupName && (
                  <p className="text-xs text-indigo-500 font-medium">Đang xem: {activeGroupName}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={filterGroupId}
                  onChange={(e) => {
                    setFilterGroupId(e.target.value);
                    setHolidayFilters({ search: "", holidayType: "", startDate: "", endDate: "" });
                  }}
                  className="appearance-none h-10 pl-4 pr-10 border border-slate-200 rounded-xl text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-slate-700 shadow-sm transition-all"
                >
                  <option value="">-- Chọn danh mục để xem --</option>
                  {groups.map(g => (
                    <option key={g.id} value={g.id}>
                      {g.groupName} ({g.year})
                    </option>
                  ))}
                </select>
                <ChevronDown className="pointer-events-none absolute right-3.5 top-3 h-4 w-4 text-slate-400" />
              </div>
              
              {filterGroupId && (
                <Button size="sm" onClick={() => { setEditingHoliday(null); setIsHolidayModalOpen(true); }} className="h-10 px-4">
                  <Plus className="h-4 w-4 mr-2" /> Thêm ngày nghỉ
                </Button>
              )}
            </div>
          </div>

          {filterGroupId && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 bg-white p-5 rounded-2xl border border-slate-200/60 shadow-inner">
              <div className="relative">
                <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo tên lễ..."
                  className="bg-slate-50/50 border border-slate-200 text-sm h-10 w-full pl-10 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                  value={holidayFilters.search}
                  onChange={(e) => setHolidayFilters(p => ({ ...p, search: e.target.value }))}
                />
              </div>
              <div>
                <select
                  className="bg-slate-50/50 border border-slate-200 text-sm h-10 w-full px-3 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none transition-all"
                  value={holidayFilters.holidayType}
                  onChange={(e) => setHolidayFilters(p => ({ ...p, holidayType: e.target.value }))}
                >
                  <option value="">-- Loại ngày nghỉ --</option>
                  <option value="Nghỉ lễ, tết">Nghỉ lễ, tết</option>
                  <option value="Nghỉ bù lễ">Nghỉ bù lễ</option>
                  <option value="Nghỉ bất thường">Nghỉ bất thường</option>
                  <option value="Nghỉ đi du lịch/teambuilding">Nghỉ đi du lịch/teambuilding</option>
                </select>
              </div>
              <div className="flex items-center gap-2">
                <input type="date"
                  className="bg-slate-50/50 border border-slate-200 text-[12px] h-10 w-full px-3 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                  value={holidayFilters.startDate}
                  onChange={(e) => setHolidayFilters(p => ({ ...p, startDate: e.target.value }))}
                />
                <span className="text-slate-300">to</span>
                <input type="date"
                  className="bg-slate-50/50 border border-slate-200 text-[12px] h-10 w-full px-3 rounded-xl focus:ring-2 focus:ring-indigo-200 focus:border-indigo-400 outline-none"
                  value={holidayFilters.endDate}
                  onChange={(e) => setHolidayFilters(p => ({ ...p, endDate: e.target.value }))}
                />
              </div>
              <Button variant="ghost" size="sm" className="h-10 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-xl font-semibold"
                onClick={() => setHolidayFilters({ search: "", holidayType: "", startDate: "", endDate: "" })}>
                Xóa bộ lọc
              </Button>
            </div>
          )}

          {!filterGroupId ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50/30 rounded-3xl border border-dashed border-slate-200 gap-4 text-slate-400">
              <div className="p-4 bg-white rounded-2xl shadow-sm border border-slate-100">
                <Layers className="h-10 w-10 text-slate-200" />
              </div>
              <p className="text-sm italic font-medium">Chọn một danh mục phía trên để xem và quản lý danh sách ngày nghỉ chi tiết.</p>
            </div>
          ) : loadingHolidays ? (
            <div className="h-40 flex items-center justify-center text-slate-400 animate-pulse font-medium">Đang tải danh sách ngày nghỉ...</div>
          ) : (
            <div className="bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm">
              <HolidayTable
                holidays={holidays}
                onEdit={(h) => { setEditingHoliday(h); setIsHolidayModalOpen(true); }}
                onDelete={handleDeleteHoliday}
                onView={(h) => router.push(`/holidays/entry/${h.id}`)}
                onOpenNotification={(h) => router.push(`/holidays/notifications?holidayId=${h?.id ?? ""}`)}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Modals */}
      <HolidayGroupModal 
        isOpen={isGroupModalOpen}
        onClose={() => setIsGroupModalOpen(false)}
        onSubmit={handleSaveGroup}
        group={editingGroup}
      />
      <HolidayModal
        isOpen={isHolidayModalOpen}
        onClose={() => setIsHolidayModalOpen(false)}
        onSubmit={handleHolidaySubmit}
        holiday={editingHoliday}
      />
    </div>
  );
}
