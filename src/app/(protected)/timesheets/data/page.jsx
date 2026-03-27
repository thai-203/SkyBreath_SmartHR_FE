"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { timesheetsService } from "@/services/timesheets.service";
import { departmentsService } from "@/services/departments.service";
import { employeesService } from "@/services/employees.service";
import { authService } from "@/services/auth.service";
import TimesheetTable from "../components/TimesheetTable";
import CalendarView from "../components/CalendarView";
import AttendanceDetailModal from "../components/AttendanceDetailModal";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import { useTimesheetDetail } from "../hooks/useTimesheetDetail";
import { CalendarDays, Download, FileSpreadsheet, LayoutGrid, Calendar as CalendarIcon, FilterX, RefreshCw, Filter } from "lucide-react";

const currentDate = new Date();

export default function DataManagementPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = authService.getCurrentUser();
    const isEmployeeOnly = currentUser?.roles?.includes('EMPLOYEE') && !currentUser?.roles?.some(r => ['ADMIN', 'HR'].includes(r));

    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [departments, setDepartments] = useState([]);

    const defaultFilters = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        departmentId: "",
        status: "",
    };
    const initialFilters = {
        month: parseInt(searchParams.get("month") || defaultFilters.month),
        year: parseInt(searchParams.get("year") || defaultFilters.year),
        departmentId: searchParams.get("departmentId") || "",
        status: searchParams.get("status") || "",
    };
    const [draft, setDraft] = useState({ ...initialFilters });
    const [filters, setFilters] = useState({ ...initialFilters });

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(0);
    const [viewMode, setViewMode] = useState("table");
    const [calendarEmployeeId, setCalendarEmployeeId] = useState("");
    const [calendarData, setCalendarData] = useState(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [employeeList, setEmployeeList] = useState([]);

    // Modals (shared hook)
    const [confirmModal, setConfirmModal] = useState({ open: false, data: null, action: null });
    const [confirmLoading, setConfirmLoading] = useState(false);

    const { success, error: toastError } = useToast();

    useEffect(() => {
        const fetchDeps = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    departmentsService.getAll(),
                    employeesService.getAll({ limit: 1000 })
                ]);
                setDepartments(deptRes?.data || []);
                setEmployeeList(empRes?.data?.items || []);
            } catch (err) { console.error(err); }
        };
        fetchDeps();
    }, []);

    const fetchTimesheets = useCallback(async () => {
        setLoading(true);
        try {
            const res = await timesheetsService.getAll({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: search || undefined,
                month: filters.month,
                year: filters.year,
                departmentId: filters.departmentId || undefined,
                status: filters.status || undefined,
            });
            setTimesheets(res?.data?.items || []);
            setTotalPages(res?.data?.totalPages || 0);
        } catch (err) { toastError("Lỗi khi tải dữ liệu"); }
        finally { setLoading(false); }
    }, [pagination, search, filters]);

    useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

    const fetchCalendarData = useCallback(async () => {
        if (viewMode !== "calendar" || !calendarEmployeeId) return;
        setCalendarLoading(true);
        try {
            const res = await timesheetsService.getAll({
                month: filters.month,
                year: filters.year,
                employeeId: calendarEmployeeId,
                limit: 1,
            });
            if (res?.data?.items?.length > 0) {
                const detailRes = await timesheetsService.getAttendanceDetails(res.data.items[0].id);
                setCalendarData(detailRes?.data);
            } else { setCalendarData(null); }
        } catch (err) { toastError("Lỗi khi tải lịch"); }
        finally { setCalendarLoading(false); }
    }, [viewMode, calendarEmployeeId, filters.month, filters.year]);

    useEffect(() => { fetchCalendarData(); }, [fetchCalendarData]);

    // Auto-select first employee when switching to calendar
    useEffect(() => {
        if (viewMode === "calendar" && !calendarEmployeeId && timesheets.length > 0) {
            const currentUser = authService.getCurrentUser();
            const userTimesheet = timesheets.find(ts => ts.employee?.userId === currentUser?.id);
            if (userTimesheet) {
                setCalendarEmployeeId(userTimesheet.employee?.id?.toString() || "");
            } else {
                setCalendarEmployeeId(timesheets[0].employee?.id?.toString() || "");
            }
        }
    }, [viewMode, timesheets, calendarEmployeeId]);

    // Shared detail/excuse modal hook
    const {
        detailModal, handleViewDetail, closeDetailModal, handleDetailUpdate,
        excuseModal, handleViewExcuse, handleCreateExcuse, closeExcuseModal, handleExcuseSuccess,
    } = useTimesheetDetail({ fetchTimesheets, canEdit: !isEmployeeOnly });

    const handleRecalculate = (timesheet) => {
        setConfirmModal({ open: true, data: timesheet, action: "recalculate" });
    };

    const handleBulkRecalculate = () => {
        setConfirmModal({ open: true, data: { count: timesheets.filter(t => !t.isLocked).length }, action: "bulkRecalculate" });
    };

    const handleConfirmAction = async () => {
        const { data, action } = confirmModal;
        setConfirmLoading(true);
        try {
            if (action === "recalculate") {
                await timesheetsService.recalculate(data.id);
                success("Đã tính lại bảng chấm công");
            } else if (action === "bulkRecalculate") {
                const res = await timesheetsService.bulkRecalculate({
                    month: filters.month,
                    year: filters.year,
                    departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
                });
                success(`Đã tính lại ${res?.data?.recalculated || 0} bảng`);
            }
            setConfirmModal({ open: false, data: null, action: null });
            fetchTimesheets();
        } catch (err) { toastError("Lỗi khi thực hiện"); }
        finally { setConfirmLoading(false); }
    };

    const handleExportSummary = async () => {
        try {
            const blob = await timesheetsService.exportSummary({ month: filters.month, year: filters.year, departmentId: filters.departmentId || undefined });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `tong_hop_cong_T${filters.month}.xlsx`;
            a.click();
            success("Xuất file thành công");
        } catch (err) { toastError("Lỗi khi xuất file"); }
    };

    const handleExportDetailed = async () => {
        try {
            const blob = await timesheetsService.exportDetailed({ month: filters.month, year: filters.year });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `chi_tiet_cong_T${filters.month}.xlsx`;
            a.click();
            success("Xuất file chi tiết thành công");
        } catch (err) { toastError("Lỗi khi xuất file"); }
    };

    const syncURL = useCallback((f) => {
        const params = new URLSearchParams();
        if (f.month !== defaultFilters.month) params.set("month", f.month);
        if (f.year !== defaultFilters.year) params.set("year", f.year);
        if (f.departmentId) params.set("departmentId", f.departmentId);
        if (f.status) params.set("status", f.status);
        const qs = params.toString();
        router.replace(`/timesheets/data${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [router]);

    const handleApplyFilter = () => {
        setFilters({ ...draft });
        setPagination(p => ({ ...p, pageIndex: 0 }));
        syncURL(draft);
    };

    const handleClearFilters = () => {
        setDraft({ ...defaultFilters });
        setFilters({ ...defaultFilters });
        setSearch("");
        setPagination(p => ({ ...p, pageIndex: 0 }));
        syncURL(defaultFilters);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
                        <FileSpreadsheet className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            {isEmployeeOnly ? "Bảng dữ liệu công cá nhân" : "Quản lý dữ liệu chấm công"}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {isEmployeeOnly ? "Xem chi tiết dữ liệu công của bạn theo tháng" : "Xem và hiệu chỉnh số liệu công hàng tháng"}
                        </p>
                    </div>
                </div>
                {!isEmployeeOnly && (
                    <div className="flex flex-wrap gap-2">
                        <Button variant="outline" onClick={handleBulkRecalculate} className="gap-2 text-amber-600 border-amber-200">
                            <RefreshCw className="h-4 w-4" /> Tính lại tất cả
                        </Button>
                        <Button variant="outline" onClick={handleExportSummary} className="gap-2">
                            <FileSpreadsheet className="h-4 w-4" /> Xuất tổng hợp
                        </Button>
                        <Button variant="outline" onClick={handleExportDetailed} className="gap-2 text-indigo-700 border-indigo-200">
                            <Download className="h-4 w-4" /> Xuất chi tiết
                        </Button>
                    </div>
                )}
                {isEmployeeOnly && (
                    <div className="flex flex-wrap gap-2 h-10">
                        {/* No action buttons for employees as per request */}
                    </div>
                )}
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="w-32">
                        <Select hidePlaceholder value={draft.month} onChange={(e) => setDraft({ ...draft, month: parseInt(e.target.value) })}
                            options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))} />
                    </div>
                    <div className="w-24">
                        <Select hidePlaceholder value={draft.year} onChange={(e) => setDraft({ ...draft, year: parseInt(e.target.value) })}
                            options={Array.from({ length: 5 }, (_, i) => ({ value: currentDate.getFullYear() - 2 + i, label: `${currentDate.getFullYear() - 2 + i}` }))} />
                    </div>
                    {!isEmployeeOnly && (
                        <>
                            <div className="w-48">
                                <Select placeholder="Phòng ban" value={draft.departmentId} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}
                                    options={departments.map(d => ({ value: d.id, label: d.departmentName }))} />
                            </div>
                            <div className="w-32">
                                <Select placeholder="Trạng thái" value={draft.status} onChange={(e) => setDraft({ ...draft, status: e.target.value })}
                                    options={[{ value: "unlocked", label: "Đang mở" }, { value: "locked", label: "Đã khóa" }]} />
                            </div>
                        </>
                    )}
                    <Button onClick={handleApplyFilter} className="gap-2 h-10">
                        <Filter className="h-4 w-4" /> Lọc
                    </Button>
                    <button onClick={handleClearFilters} className="text-slate-400 hover:text-rose-500 p-2" title="Xóa bộ lọc">
                        <FilterX className="h-5 w-5" />
                    </button>
                </div>

                <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border">
                    <button onClick={() => setViewMode("table")} className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm ${viewMode === "table" ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}>
                        <LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Dạng Bảng</span>
                    </button>
                    <button onClick={() => setViewMode("calendar")} className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm ${viewMode === "calendar" ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}>
                        <CalendarIcon className="h-4 w-4" /><span className="hidden sm:inline">Dạng Lịch</span>
                    </button>
                </div>
            </div>

            {viewMode === "table" ? (
                <TimesheetTable mode="data" data={timesheets} loading={loading} search={search} onSearchChange={setSearch} pagination={pagination} onPaginationChange={setPagination} totalPages={totalPages}
                    onViewDetail={handleViewDetail} onRecalculate={handleRecalculate} />
            ) : (
                <div className="space-y-4">
                    {!isEmployeeOnly && (
                        <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex items-center gap-3">
                            <span className="text-sm font-medium text-slate-600">Nhân viên:</span>
                            <div className="w-64">
                                <Select value={calendarEmployeeId} onChange={(e) => setCalendarEmployeeId(e.target.value)}
                                    options={employeeList.map(e => ({ value: e.id, label: `${e.employeeCode || ''} - ${e.fullName}` }))} />
                            </div>
                        </div>
                    )}
                    {calendarLoading ? <div className="py-20 text-center">Đang tải...</div> : calendarData ? <CalendarView data={calendarData} month={filters.month} year={filters.year} /> : <div className="py-20 text-center text-slate-400">Không có dữ liệu</div>}
                </div>
            )}

            <AttendanceDetailModal isOpen={detailModal.open} onClose={closeDetailModal} data={detailModal.data}
                onUpdate={handleDetailUpdate}
                onViewExcuse={handleViewExcuse}
                onCreateExcuse={handleCreateExcuse}
                canEdit={!isEmployeeOnly} />

            <ExcuseRequestModal isOpen={excuseModal.open} onClose={closeExcuseModal} mode={excuseModal.mode} date={excuseModal.date} employeeId={excuseModal.employeeId} data={excuseModal.data}
                onSuccess={handleExcuseSuccess} />

            <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, data: null, action: null })} onConfirm={handleConfirmAction}
                title={confirmModal.action === "recalculate" ? "Tính lại" : "Tính lại hàng loạt"}
                description={confirmModal.action === "recalculate" ? "Tính lại bảng công cho nhân viên này?" : "Tính lại tất cả bảng công chưa khóa?"}
                loading={confirmLoading} />
        </div>
    );
}
