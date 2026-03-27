"use client";

import { holidayService, holidayConfigService } from "@/services";
import { Calendar, Download, Plus, Search, Bell, Settings, ChevronDown, Layers } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HolidayModal } from "./components/HolidayModal";
import { HolidayTable } from "./components/HolidayTable";
import Link from "next/link";
import { useToast } from "@/components/common/Toast";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HolidaysPage() {
    const router = useRouter();
    const { success: toastSuccess, error: toastError } = useToast();

    // ── Groups ─────────────────────────────────────────────
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);

    // ── Group filter + inline holidays ─────────────────────
    const [filterGroupId, setFilterGroupId] = useState("");
    const [holidays, setHolidays] = useState([]);
    const [loadingHolidays, setLoadingHolidays] = useState(false);
    const [holidayFilters, setHolidayFilters] = useState({
        search: "", holidayType: "", startDate: "", endDate: ""
    });
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [editingHoliday, setEditingHoliday] = useState(null);

    // ── Notifications ──────────────────────────────────────
    const handleOpenNotification = (holiday = null) => {
        if (holiday) {
            router.push(`/holidays/notifications?holidayId=${holiday.id}`);
        } else {
            router.push('/holidays/notifications');
        }
    };

    // ── Fetch groups ───────────────────────────────────────
    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await holidayConfigService.getGroups();
            setGroups(response.data || []);
        } catch (error) {
            toastError("Không thể tải danh sách danh mục ngày lễ");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);

    // ── Fetch holidays for selected group ──────────────────
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


    // ── Holiday CRUD ───────────────────────────────────────
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

    const handleExport = async () => {
        try {
            const params = {
                ...holidayFilters,
                holidayGroupId: filterGroupId || undefined
            };
            const blob = await holidayService.export(params);
            const url = window.URL.createObjectURL(
                new Blob([blob], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" })
            );
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", `danh-sach-ngay-le${activeGroupName ? `-${activeGroupName}` : ""}.xlsx`);
            document.body.appendChild(link);
            link.click();
            link.remove();
            window.URL.revokeObjectURL(url);
        } catch (error) {
            console.error("Export error:", error);
            toastError("Xuất dữ liệu thất bại");
        }
    };

    const activeGroupName = groups.find(g => String(g.id) === String(filterGroupId))?.groupName;

    return (
        <div className="container mx-auto py-8 space-y-6 max-w-7xl">
            <PageTitle title="Holiday Management | SmartHR" />

            {/* Header */}
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        Danh sách ngày nghỉ
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý chi tiết các ngày nghỉ lễ theo từng danh mục.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/holidays/configuration">
                        <Button variant="ghost" className="text-slate-600 border-slate-100 hover:bg-slate-50 font-semibold">
                            <Settings className="mr-2 h-4 w-4" /> Cấu hình
                        </Button>
                    </Link>
                    <Button variant="ghost" onClick={() => handleOpenNotification()}
                        className="text-orange-600 border-orange-100 hover:bg-orange-50 hover:text-orange-700 transition-all font-semibold">
                        <Bell className="mr-2 h-4 w-4" /> Gửi thông báo
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="border-gray-200 hover:bg-gray-100">
                        <Download className="mr-2 h-4 w-4" /> Xuất Excel
                    </Button>
                </div>
            </div>

            {/* ── Inline Holiday Section ──────────────────────────── */}
            <div className="rounded-xl border border-gray-100 bg-white shadow-sm p-6 space-y-4">
                {/* Section header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                        <Layers className="h-5 w-5 text-indigo-500" />
                        <h2 className="text-lg font-bold text-gray-900">Chi tiết ngày nghỉ</h2>
                        {activeGroupName && (
                            <span className="ml-1 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[12px] font-semibold">
                                {activeGroupName}
                            </span>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {/* Group dropdown filter */}
                        <div className="relative">
                            <select
                                value={filterGroupId}
                                onChange={(e) => {
                                    setFilterGroupId(e.target.value);
                                    setHolidayFilters({ search: "", holidayType: "", startDate: "", endDate: "" });
                                }}
                                className="appearance-none h-9 pl-3 pr-8 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 text-gray-700"
                            >
                                <option value="">-- Chọn nhóm ngày lễ --</option>
                                {groups.map(g => (
                                    <option key={g.id} value={g.id}>
                                        {g.groupName} ({g.year})
                                    </option>
                                ))}
                            </select>
                            <ChevronDown className="pointer-events-none absolute right-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        </div>

                        {filterGroupId && (
                            <Button
                                size="sm"
                                className="bg-blue-600 hover:bg-blue-700 shadow-sm"
                                onClick={() => {
                                    setEditingHoliday(null);
                                    setIsHolidayModalOpen(true);
                                }}
                            >
                                <Plus className="h-4 w-4 mr-1.5" /> Thêm ngày nghỉ
                            </Button>
                        )}
                    </div>
                </div>

                {/* Holiday filters (only when group selected) */}
                {filterGroupId && (
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-gray-50/60 p-4 rounded-xl border border-gray-100">
                        <div className="relative">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Tìm tên ngày nghỉ..."
                                className="bg-white border border-gray-200 text-sm h-9 w-full pl-9 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                value={holidayFilters.search}
                                onChange={(e) => setHolidayFilters(p => ({ ...p, search: e.target.value }))}
                            />
                        </div>
                        <div>
                            <select
                                className="bg-white border border-gray-200 text-sm h-9 w-full px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
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
                                className="bg-white border border-gray-200 text-[12px] h-9 w-full px-2 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                value={holidayFilters.startDate}
                                onChange={(e) => setHolidayFilters(p => ({ ...p, startDate: e.target.value }))}
                            />
                            <span className="text-gray-400">-</span>
                            <input type="date"
                                className="bg-white border border-gray-200 text-[12px] h-9 w-full px-2 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none"
                                value={holidayFilters.endDate}
                                onChange={(e) => setHolidayFilters(p => ({ ...p, endDate: e.target.value }))}
                            />
                        </div>
                        <Button variant="ghost" size="sm" className="h-9 text-gray-500 hover:text-blue-600"
                            onClick={() => setHolidayFilters({ search: "", holidayType: "", startDate: "", endDate: "" })}>
                            Xóa lọc
                        </Button>
                    </div>
                )}

                {/* Holiday table or empty state */}
                {!filterGroupId ? (
                    <div className="flex flex-col items-center justify-center py-14 text-gray-400 gap-3">
                        <Layers className="h-10 w-10 text-gray-200" />
                        <p className="text-[14px] italic">Chọn một nhóm ngày lễ để xem danh sách ngày nghỉ.</p>
                    </div>
                ) : loadingHolidays ? (
                    <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse">
                        Đang tải...
                    </div>
                ) : (
                    <HolidayTable
                        holidays={holidays}
                        onEdit={(h) => { setEditingHoliday(h); setIsHolidayModalOpen(true); }}
                        onDelete={handleDeleteHoliday}
                        onView={(h) => router.push(`/holidays/entry/${h.id}`)}
                        onOpenNotification={handleOpenNotification}
                    />
                )}
            </div>

            <HolidayModal
                isOpen={isHolidayModalOpen}
                onClose={() => setIsHolidayModalOpen(false)}
                onSubmit={handleHolidaySubmit}
                holiday={editingHoliday}
            />
        </div>
    );
}
