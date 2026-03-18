"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { timesheetsService } from "@/services/timesheets.service";
import { departmentsService } from "@/services/departments.service";
import TimesheetTable from "./components/TimesheetTable";
import AttendanceDetailModal from "./components/AttendanceDetailModal";
import TimesheetEditModal from "./components/TimesheetEditModal";
import AddEmployeeTimesheetModal from "./components/AddEmployeeTimesheetModal";
import { CalendarDays, Plus, Download, FileSpreadsheet, LayoutGrid, Calendar as CalendarIcon, Lock, UserPlus } from "lucide-react";
import { authService } from "@/services/auth.service";
import { employeesService } from "@/services/employees.service";
import CalendarView from "./components/CalendarView";

const currentDate = new Date();

export default function TimesheetsPage() {
    // State
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [search, setSearch] = useState("");
    const [departments, setDepartments] = useState([]);
    const [filters, setFilters] = useState({
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        departmentId: "",
        status: "",
    });
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(0);
    const [viewMode, setViewMode] = useState("table"); // 'table' or 'calendar'
    const [calendarEmployeeId, setCalendarEmployeeId] = useState("");
    const [calendarData, setCalendarData] = useState(null);
    const [calendarLoading, setCalendarLoading] = useState(false);

    // Modals
    const [detailModal, setDetailModal] = useState({ open: false, data: null });
    const [editModal, setEditModal] = useState({ open: false, data: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, data: null, action: null });
    const [addEmployeeModal, setAddEmployeeModal] = useState(false);
    const [employeeList, setEmployeeList] = useState([]);
    const [addEmployeeLoading, setAddEmployeeLoading] = useState(false);
    const [editLoading, setEditLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Toast
    const { success, error: toastError } = useToast();

    // Fetch departments for filter
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    departmentsService.getAll(),
                    employeesService.getList()
                ]);
                setDepartments(deptRes?.data || []);
                setEmployeeList(empRes?.data || []);
            } catch (err) {
                console.error("Error fetching dependencies:", err);
            }
        };
        fetchDepartments();
    }, []);

    // Fetch timesheets
    const fetchTimesheets = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: search || undefined,
                month: filters.month,
                year: filters.year,
                departmentId: filters.departmentId || undefined,
                status: filters.status || undefined,
            };
            const res = await timesheetsService.getAll(params);
            const data = res?.data || {};
            setTimesheets(data.items || []);
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error("Error fetching timesheets:", err);
            toastError("Lỗi khi tải bảng chấm công");
        } finally {
            setLoading(false);
        }
    }, [pagination, search, filters]);

    useEffect(() => {
        fetchTimesheets();
    }, [fetchTimesheets]);

    // Auto-select first employee when switching to calendar
    useEffect(() => {
        if (viewMode === "calendar" && !calendarEmployeeId && timesheets.length > 0) {
            const userTimesheet = timesheets.find(ts => ts.employee?.userId === authService.getCurrentUser()?.id);
            if (userTimesheet) {
                setCalendarEmployeeId(userTimesheet.employee?.id?.toString() || "");
            } else {
                setCalendarEmployeeId(timesheets[0].employee?.id?.toString() || "");
            }
        }
    }, [viewMode, timesheets, calendarEmployeeId]);

    // Fetch calendar data (attendance details)
    const fetchCalendarData = useCallback(async () => {
        if (viewMode !== "calendar") return;
        if (!calendarEmployeeId) return; // Wait for employee selection

        setCalendarLoading(true);
        try {
            let targetTimesheetId = null;

            // Fetch timesheet specifically for the selected employee and month/year
            const params = {
                month: filters.month,
                year: filters.year,
                employeeId: calendarEmployeeId,
                limit: 1,
            };
            const res = await timesheetsService.getAll(params);

            if (res?.data?.items?.length > 0) {
                targetTimesheetId = res.data.items[0].id;
                const detailRes = await timesheetsService.getAttendanceDetails(targetTimesheetId);
                setCalendarData(detailRes?.data);
            } else {
                setCalendarData(null);
            }
        } catch (err) {
            console.error("Error fetching calendar data:", err);
            toastError("Lỗi khi tải dữ liệu lịch");
        } finally {
            setCalendarLoading(false);
        }
    }, [viewMode, calendarEmployeeId, filters.month, filters.year]);

    useEffect(() => {
        fetchCalendarData();
    }, [fetchCalendarData]);

    // Generate
    const handleGenerateClick = () => {
        if (timesheets.length > 0) {
            setConfirmModal({
                open: true,
                data: null,
                action: "regenerate",
            });
        } else {
            doGenerate();
        }
    };

    const doGenerate = async () => {
        setGenerating(true);
        try {
            const res = await timesheetsService.generate({
                month: filters.month,
                year: filters.year,
                departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
            });
            success(`Đã tạo bảng chấm công cho ${res?.data?.generated || 0} nhân viên`);
            fetchTimesheets();
        } catch (err) {
            console.error("Error generating:", err);
            toastError("Lỗi khi tạo bảng chấm công");
        } finally {
            setGenerating(false);
        }
    };

    // View Detail
    const handleViewDetail = async (timesheet) => {
        try {
            const res = await timesheetsService.getAttendanceDetails(timesheet.id);
            setDetailModal({ open: true, data: res?.data });
        } catch (err) {
            console.error("Error fetching details:", err);
            toastError("Lỗi khi tải chi tiết chấm công");
        }
    };

    // Edit
    const handleOpenEdit = (timesheet) => {
        setEditModal({
            open: true,
            data: {
                ...timesheet,
                totalWorkingDays: timesheet.totalWorkingDays ?? 0,
                totalWorkingHours: timesheet.totalWorkingHours ?? 0,
                overtimeHours: timesheet.overtimeHours ?? 0,
            },
        });
    };

    const handleSubmitEdit = async () => {
        setEditLoading(true);
        try {
            await timesheetsService.update(editModal.data.id, {
                totalWorkingDays: editModal.data.totalWorkingDays,
                totalWorkingHours: editModal.data.totalWorkingHours,
                overtimeHours: editModal.data.overtimeHours,
            });
            success("Cập nhật bảng chấm công thành công");
            setEditModal({ open: false, data: null });
            fetchTimesheets();
        } catch (err) {
            console.error("Error updating:", err);
            toastError(err?.response?.data?.message || "Lỗi khi cập nhật");
        } finally {
            setEditLoading(false);
        }
    };

    // Recalculate & Delete
    const handleRecalculate = (timesheet) => {
        setConfirmModal({
            open: true,
            data: timesheet,
            action: "recalculate",
        });
    };

    const handleDelete = (timesheet) => {
        setConfirmModal({
            open: true,
            data: timesheet,
            action: "delete",
        });
    };

    // Lock / Unlock
    const handleLock = (timesheet) => {
        setConfirmModal({ open: true, data: timesheet, action: "lock" });
    };

    const handleUnlock = (timesheet) => {
        setConfirmModal({ open: true, data: timesheet, action: "unlock" });
    };

    const handleBulkLock = () => {
        setConfirmModal({ open: true, data: null, action: "bulkLock" });
    };

    const handleConfirmAction = async () => {
        const { data, action } = confirmModal;
        setConfirmLoading(true);
        try {
            if (action === "regenerate") {
                setConfirmModal({ open: false, data: null, action: null });
                setConfirmLoading(false);
                await doGenerate();
                return;
            } else if (action === "recalculate") {
                await timesheetsService.recalculate(data.id);
                success("Đã tính lại bảng chấm công");
            } else if (action === "lock") {
                await timesheetsService.lock(data.id);
                success("Đã khóa bảng chấm công");
            } else if (action === "unlock") {
                await timesheetsService.unlock(data.id);
                success("Đã mở khóa bảng chấm công");
            } else if (action === "bulkLock") {
                const res = await timesheetsService.bulkLock({
                    month: filters.month,
                    year: filters.year,
                    departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
                });
                success(`Đã khóa ${res?.data?.locked || 0} bảng chấm công`);
            } else if (action === "delete") {
                await timesheetsService.remove(data.id);
                success("Đã xóa nhân viên khỏi bảng chấm công kỳ này");
            }
            setConfirmModal({ open: false, data: null, action: null });
            fetchTimesheets();
        } catch (err) {
            console.error(`Error ${action}:`, err);
            toastError(err?.response?.data?.message || `Lỗi khi thực hiện`);
        } finally {
            setConfirmLoading(false);
        }
    };

    const handleAddEmployeeSubmit = async (data) => {
        setAddEmployeeLoading(true);
        try {
            await timesheetsService.addEmployee(data);
            success("Đã thêm nhân viên vào bảng chấm công");
            setAddEmployeeModal(false);
            fetchTimesheets();
        } catch (err) {
            console.error("Error adding employee:", err);
            toastError(err?.response?.data?.message || "Lỗi khi thêm nhân viên");
        } finally {
            setAddEmployeeLoading(false);
        }
    };

    // Export
    const handleExportSummary = async () => {
        try {
            const blob = await timesheetsService.exportSummary({
                month: filters.month,
                year: filters.year,
                departmentId: filters.departmentId || undefined,
            });
            downloadBlob(blob, `bang_cham_cong_T${filters.month}_${filters.year}.xlsx`);
            success("Xuất file tổng hợp thành công");
        } catch (err) {
            console.error("Export error:", err);
            toastError("Lỗi khi xuất file");
        }
    };

    const handleExportDetailed = async () => {
        try {
            const blob = await timesheetsService.exportDetailed({
                month: filters.month,
                year: filters.year,
            });
            downloadBlob(blob, `chi_tiet_cham_cong_T${filters.month}_${filters.year}.xlsx`);
            success("Xuất file chi tiết thành công");
        } catch (err) {
            console.error("Export error:", err);
            toastError("Lỗi khi xuất file");
        }
    };

    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    // Month/Year options
    const monthOptions = Array.from({ length: 12 }, (_, i) => ({
        value: i + 1,
        label: `Tháng ${i + 1}`,
    }));

    const yearOptions = Array.from({ length: 5 }, (_, i) => {
        const y = currentDate.getFullYear() - 2 + i;
        return { value: y, label: `${y}` };
    });

    const confirmMessages = {
        regenerate: `Đã có dữ liệu chấm công cho Tháng ${filters.month}/${filters.year}. Bạn có chắc chắn muốn tạo lại? Dữ liệu cũ sẽ được cập nhật.`,
        recalculate: "Bạn có chắc chắn muốn tính lại bảng chấm công này? Dữ liệu sẽ được cập nhật từ bảng chấm công gốc.",
        lock: "Bạn có chắc chắn muốn khóa bảng chấm công này? Sau khi khóa sẽ không thể chỉnh sửa.",
        unlock: "Bạn có chắc chắn muốn mở khóa bảng chấm công này?",
        bulkLock: `Bạn có chắc chắn muốn khóa TẤT CẢ bảng chấm công đang mở trong Tháng ${filters.month}/${filters.year}? Các bảng đã khóa sẽ không thể chỉnh sửa.`,
        delete: "Bạn có chắc chắn muốn xóa nhân viên này khỏi bảng chấm công? Dữ liệu điểm danh của nhân viên trong tháng này sẽ bị xóa nếu không được lưu trước.",
    };

    const confirmTitles = {
        regenerate: "Tạo lại bảng chấm công",
        recalculate: "Tính lại bảng chấm công",
        lock: "Khóa bảng chấm công",
        unlock: "Mở khóa bảng chấm công",
        bulkLock: "Khóa TẤT CẢ bảng chấm công",
        delete: "Xóa nhân viên khỏi bảng chấm công",
    };

    return (
        <div className="space-y-6">

            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
                        <CalendarDays className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bảng chấm công</h1>
                        <p className="text-sm text-slate-500">
                            Quản lý bảng chấm công hàng tháng
                        </p>
                    </div>
                </div>
                <div className="flex flex-wrap items-center justify-start sm:justify-end gap-2 w-full sm:w-auto mt-4 sm:mt-0">
                    {authService.hasPermission("TIMESHEET_CREATE") && (
                        <>
                            <Button variant="outline" onClick={() => setAddEmployeeModal(true)} className="gap-2 border-indigo-200 text-indigo-700 hover:bg-indigo-50 bg-white shadow-sm">
                                <UserPlus className="h-4 w-4" />
                                Thêm nhân viên
                            </Button>
                            <Button onClick={handleGenerateClick} loading={generating} className="gap-2 shadow-sm">
                                <Plus className="h-4 w-4" />
                                Tạo bảng chấm công
                            </Button>
                        </>
                    )}
                    {authService.hasPermission("TIMESHEET_LOCK") && (
                        <Button variant="outline" onClick={handleBulkLock} className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 bg-white shadow-sm">
                            <Lock className="h-4 w-4" />
                            Khóa tất cả
                        </Button>
                    )}
                    <Button variant="outline" onClick={handleExportSummary} className="gap-2 bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-sm">
                        <FileSpreadsheet className="h-4 w-4" />
                        Xuất tổng hợp
                    </Button>
                    <Button variant="outline" onClick={handleExportDetailed} className="gap-2 bg-white hover:bg-slate-50 text-indigo-700 border-indigo-200 shadow-sm">
                        <Download className="h-4 w-4" />
                        Xuất chi tiết
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col xl:flex-row gap-4 items-start xl:items-end justify-between">
                <div className="flex flex-wrap gap-4 items-end flex-1">
                    <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[160px] flex-1">
                        <Select
                            label="Tháng"
                            value={filters.month}
                            onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                            options={monthOptions}
                            placeholder="-- Chọn tháng --"
                        />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[160px] flex-1">
                        <Select
                            label="Năm"
                            value={filters.year}
                            onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                            options={yearOptions}
                            placeholder="-- Chọn năm --"
                        />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[160px] flex-1">
                        <Select
                            label="Phòng ban"
                            placeholder="-- Tất cả phòng ban --"
                            value={filters.departmentId}
                            onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                            options={(departments || []).map(d => ({ value: d.id, label: d.departmentName }))}
                        />
                    </div>
                    <div className="space-y-1.5 w-full sm:w-auto sm:min-w-[160px] flex-1">
                        <Select
                            label="Trạng thái"
                            placeholder="-- Tất cả --"
                            value={filters.status}
                            onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                            options={[
                                { value: "unlocked", label: "Đang mở" },
                                { value: "locked", label: "Đã khóa" },
                            ]}
                        />
                    </div>
                </div>

                {/* View Toggle */}
                <div className="flex items-center gap-1 bg-slate-100 p-1 border border-slate-200 rounded-lg shrink-0 mt-4 xl:mt-0 w-full sm:w-auto justify-center sm:justify-start">
                    <button
                        onClick={() => setViewMode("table")}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === "table"
                            ? "bg-white shadow-sm text-indigo-600"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                        title="Chế độ bảng"
                    >
                        <LayoutGrid className="h-4 w-4" />
                        <span className="hidden sm:inline">Dạng Bảng</span>
                    </button>
                    <button
                        onClick={() => setViewMode("calendar")}
                        className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm font-medium ${viewMode === "calendar"
                            ? "bg-white shadow-sm text-indigo-600"
                            : "text-slate-500 hover:text-slate-700"
                            }`}
                        title="Chế độ lịch"
                    >
                        <CalendarIcon className="h-4 w-4" />
                        <span className="hidden sm:inline">Dạng Lịch</span>
                    </button>
                </div>
            </div>

            {/* Content View */}
            {viewMode === "table" ? (
                <TimesheetTable
                    data={timesheets}
                    loading={loading}
                    search={search}
                    onSearchChange={setSearch}
                    pagination={pagination}
                    onPaginationChange={setPagination}
                    totalPages={totalPages}
                    onViewDetail={handleViewDetail}
                    onEdit={handleOpenEdit}
                    onRecalculate={handleRecalculate}
                    onLock={handleLock}
                    onUnlock={handleUnlock}
                    onDelete={handleDelete}
                />
            ) : (
                <div className="space-y-4">
                    {/* Employee Selector for Calendar View */}
                    <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center gap-4">
                        <label className="text-sm font-medium text-slate-700 whitespace-nowrap">
                            Đang xem lịch của nhân viên:
                        </label>
                        <div className="w-full sm:w-80">
                            <Select
                                value={calendarEmployeeId}
                                onChange={(e) => setCalendarEmployeeId(e.target.value)}
                                options={(employeeList || []).map(e => ({
                                    value: e.id,
                                    label: e.employeeCode ? `${e.employeeCode} - ${e.fullName}` : e.fullName
                                }))}
                                placeholder="-- Chọn nhân viên --"
                            />
                        </div>
                    </div>

                    {calendarLoading ? (
                        <div className="flex justify-center items-center py-20 bg-white rounded-xl border border-slate-200">
                            <div className="flex flex-col items-center gap-2">
                                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent"></div>
                                <p className="text-slate-500 font-medium">Đang tải lịch...</p>
                            </div>
                        </div>
                    ) : calendarData ? (
                        <CalendarView
                            data={calendarData}
                            month={filters.month}
                            year={filters.year}
                            onMonthChange={(m, y) => setFilters({ ...filters, month: m, year: y })}
                        />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-20 bg-white rounded-xl border border-slate-200 text-slate-500">
                            <CalendarIcon className="h-12 w-12 mb-4 opacity-20" />
                            <p className="font-medium">Chưa có dữ liệu chấm công cho kỳ này</p>
                            <p className="text-sm opacity-70">Vui lòng liên hệ quản trị viên để tạo bảng công</p>
                        </div>
                    )}
                </div>
            )}

            {/* Attendance Detail Modal */}
            <AttendanceDetailModal
                isOpen={detailModal.open}
                onClose={() => setDetailModal({ open: false, data: null })}
                data={detailModal.data}
            />

            {/* Edit Modal */}
            <TimesheetEditModal
                isOpen={editModal.open}
                onClose={() => setEditModal({ open: false, data: null })}
                onSubmit={handleSubmitEdit}
                formData={editModal.data}
                onFormChange={(data) => setEditModal({ ...editModal, data })}
                loading={editLoading}
            />

            {/* Add Employee Modal */}
            <AddEmployeeTimesheetModal
                isOpen={addEmployeeModal}
                onClose={() => setAddEmployeeModal(false)}
                onSubmit={handleAddEmployeeSubmit}
                employees={employeeList}
                loading={addEmployeeLoading}
                month={filters.month}
                year={filters.year}
            />

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, data: null, action: null })}
                onConfirm={handleConfirmAction}
                title={confirmTitles[confirmModal.action] || "Xác nhận"}
                description={confirmMessages[confirmModal.action] || ""}
                confirmText="Xác nhận"
                cancelText="Hủy"
                variant={["lock", "bulkLock", "delete"].includes(confirmModal.action) ? "destructive" : "default"}
                loading={confirmLoading}
            />
        </div>
    );
}
