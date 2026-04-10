"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ConfirmModal } from "@/components/common/Modal";
import { Input } from "@/components/common/Input";
import { Pagination } from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";
import { timesheetsService } from "@/services/timesheets.service";
import { departmentsService } from "@/services/departments.service";
import { employeesService } from "@/services/employees.service";
import { authService } from "@/services/auth.service";
import CalendarView from "../components/CalendarView";
import AttendanceDetailModal from "../components/AttendanceDetailModal";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import { useTimesheetDetail } from "../hooks/useTimesheetDetail";
import { Download, FileSpreadsheet, LayoutGrid, Calendar as CalendarIcon, FilterX, RefreshCw, Search, Eye, Lock, Unlock } from "lucide-react";
import ProcessedRecordEditModal from "../components/ProcessedRecordEditModal";

const currentDate = new Date();

export default function DataManagementPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = authService.getCurrentUser();
    const isEmployeeOnly = currentUser?.roles?.includes('EMPLOYEE') && !currentUser?.roles?.some(r => ['ADMIN', 'HR'].includes(r));

    const [matrixData, setMatrixData] = useState([]);
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
    const [filters, setFilters] = useState({ ...initialFilters });

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(0);
    const [totalRecords, setTotalRecords] = useState(0);
    const [viewMode, setViewMode] = useState("table");
    const [calendarEmployeeId, setCalendarEmployeeId] = useState("");
    const [calendarData, setCalendarData] = useState(null);
    const [calendarLoading, setCalendarLoading] = useState(false);
    const [employeeList, setEmployeeList] = useState([]);

    const [confirmModal, setConfirmModal] = useState({ open: false, data: null, action: null });
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false);
    const [isInitialized, setIsInitialized] = useState(false);
    const [cellModal, setCellModal] = useState({ open: false, cell: null });
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(new Set());

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
        setIsInitialized(true);
    }, []);

    const fetchMatrix = useCallback(async () => {
        if (!isInitialized) return;
        setLoading(true);
        try {
            const res = await timesheetsService.getProcessedMatrix({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: search || undefined,
                month: filters.month,
                year: filters.year,
                departmentId: filters.departmentId || undefined,
                status: filters.status || undefined,
            });
            const data = res?.data || res || {};
            setMatrixData(data.items || []);
            setTotalPages(data.totalPages || 0);
            setTotalRecords(data.total || 0);
        } catch (err) { toastError("Lỗi khi tải dữ liệu"); }
        finally { setLoading(false); }
    }, [pagination, search, filters, isInitialized]);

    useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

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

    useEffect(() => {
        if (viewMode === "calendar" && !calendarEmployeeId && matrixData.length > 0) {
            const userTimesheet = matrixData.find(ts => ts.employeeCode === currentUser?.employeeCode);
            if (userTimesheet) {
                setCalendarEmployeeId(employeeList.find(e => e.employeeCode === userTimesheet.employeeCode)?.id?.toString() || "");
            } else {
                setCalendarEmployeeId(employeeList.find(e => e.employeeCode === matrixData[0].employeeCode)?.id?.toString() || "");
            }
        }
    }, [viewMode, matrixData, calendarEmployeeId, employeeList]);

    const {
        detailModal, handleViewDetail, closeDetailModal, handleDetailUpdate,
        excuseModal, handleViewExcuse, handleCreateExcuse, closeExcuseModal, handleExcuseSuccess,
    } = useTimesheetDetail({ fetchTimesheets: fetchMatrix, canEdit: !isEmployeeOnly });

    const handleViewAttendanceDetailFromMatrix = useCallback(async (row) => {
        try {
            const res = await timesheetsService.getAll({
                month: filters.month,
                year: filters.year,
                employeeId: row?.id,
                limit: 1,
                page: 1,
            });
            const ts = res?.data?.items?.[0];
            if (!ts?.id) {
                toastError("Chưa có bảng công cho nhân viên này trong kỳ đã chọn");
                return;
            }
            await handleViewDetail(ts);
        } catch (err) {
            toastError("Lỗi khi tải chi tiết chấm công");
        }
    }, [filters.month, filters.year, handleViewDetail, toastError]);

    const handleBulkRecalculate = () => {
        setConfirmModal({ open: true, data: { count: matrixData.filter(t => !t.isLocked).length }, action: "bulkRecalculate" });
    };

    const handleFinalizeMatrix = () => {
        setConfirmModal({ open: true, data: null, action: "finalizeMatrix" });
    };

    const handleUnfinalizeMatrix = () => {
        setConfirmModal({ open: true, data: null, action: "unfinalizeMatrix" });
    };

    const handleSync = async () => {
        const ids = Array.from(selectedEmployeeIds);
        if (ids.length === 0) {
            toastError("Vui lòng chọn ít nhất 1 nhân viên để đồng bộ");
            return;
        }
        setSyncLoading(true);
        try {
            const res = await timesheetsService.syncAttendance({
                month: filters.month,
                year: filters.year,
                employeeIds: ids,
            });
            success(`Đã đồng bộ ${res?.data?.syncedRecords || 0} bản ghi`);
            setSelectedEmployeeIds(new Set());
            fetchMatrix();
        } catch (err) { toastError("Lỗi khi đồng bộ công"); }
        finally { setSyncLoading(false); }
    };

    const toggleSelectAllOnPage = (checked) => {
        if (checked) {
            setSelectedEmployeeIds(prev => {
                const next = new Set(prev);
                for (const row of matrixData) {
                    if (row?.id) next.add(row.id);
                }
                return next;
            });
            return;
        }
        setSelectedEmployeeIds(prev => {
            const next = new Set(prev);
            for (const row of matrixData) {
                if (row?.id) next.delete(row.id);
            }
            return next;
        });
    };

    const toggleSelectRow = (employeeId, checked) => {
        setSelectedEmployeeIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(employeeId);
            else next.delete(employeeId);
            return next;
        });
    };

    const handleConfirmAction = async () => {
        const { action } = confirmModal;
        setConfirmLoading(true);
        try {
            if (action === "bulkRecalculate") {
                const res = await timesheetsService.bulkRecalculate({
                    month: filters.month,
                    year: filters.year,
                    departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
                });
                success(`Đã tính lại ${res?.data?.recalculated || 0} bảng`);
            }
            if (action === "finalizeMatrix") {
                const res = await timesheetsService.finalizeProcessedMatrix({
                    month: filters.month,
                    year: filters.year,
                    departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
                    search: search || undefined,
                });
                success(`Đã chốt công ${res?.data?.affected || 0} bản ghi`);
            }
            if (action === "unfinalizeMatrix") {
                const res = await timesheetsService.unfinalizeProcessedMatrix({
                    month: filters.month,
                    year: filters.year,
                    departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
                    search: search || undefined,
                });
                success(`Đã bỏ chốt công ${res?.data?.affected || 0} bản ghi`);
            }
            setConfirmModal({ open: false, data: null, action: null });
            fetchMatrix();
        } catch (err) { toastError("Lỗi khi thực hiện"); }
        finally { setConfirmLoading(false); }
    };

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        setPagination(p => ({ ...p, pageIndex: 0 }));
        syncURL(newFilters);
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

    const handleClearFilters = () => {
        setFilters({ ...defaultFilters });
        setSearch("");
        setPagination(p => ({ ...p, pageIndex: 0 }));
        syncURL(defaultFilters);
    };

    const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
    const dayColumns = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(filters.year, filters.month - 1, i + 1);
        const dayOfWeek = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][d.getDay()];
        const shortDateStr = `${String(i + 1).padStart(2, '0')}/${String(filters.month).padStart(2, '0')}`;
        return {
            id: `day-${i + 1}`,
            label: dayOfWeek,
            shortDateStr: shortDateStr,
            isWeekend: d.getDay() === 0 || d.getDay() === 6,
            dayIndex: i + 1,
        };
    });

    const handleCellClick = (row, dayData) => {
        if (!dayData || dayData.attendanceStatus === 'WEEKEND') return;
        if (dayData.isFinalized) {
            toastError("Ngày công đã được chốt, không thể chỉnh sửa");
            return;
        }
        setCellModal({
            open: true,
            cell: {
                ...dayData,
                employeeName: row.fullName,
                employeeCode: row.employeeCode,
            },
        });
    };

    const getDayCellContent = (dailyDetails, dayIndex) => {
        if (!dailyDetails || !Array.isArray(dailyDetails)) return '-';
        const dayData = dailyDetails.find(d => {
            if (d.date) {
                const parts = d.date.split('/');
                if (parts.length === 3) {
                    return parseInt(parts[0], 10) === dayIndex;
                }
            }
            return false;
        });

        if (!dayData) return '-';
        if (dayData.attendanceStatus === 'WEEKEND') return 'N';
        if (['X', 'KL', 'ABSENT', '0'].includes(dayData.attendanceStatus)) {
            return dayData.workingHours !== undefined && dayData.workingHours !== null ? dayData.workingHours : 0;
        }
        return dayData.attendanceStatus || '-';
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
                            {isEmployeeOnly ? "Ma trận bảng công cá nhân" : "Ma trận dữ liệu chấm công"}
                        </h1>
                        <p className="text-sm text-slate-500">
                            {isEmployeeOnly ? "Xem chi tiết dữ liệu công ma trận của bạn" : "Hiển thị dữ liệu công dạng ma trận theo tháng"}
                        </p>
                    </div>
                </div>
                {!isEmployeeOnly && (
                    <div className="flex flex-wrap gap-2">
                        <Button
                            variant="outline"
                            onClick={handleSync}
                            loading={syncLoading}
                            className="gap-2 text-teal-700 border-teal-200"
                            disabled={selectedEmployeeIds.size === 0}
                        >
                            <RefreshCw className="h-4 w-4" /> Đồng bộ ({selectedEmployeeIds.size})
                        </Button>

                        <Button variant="outline" onClick={handleFinalizeMatrix} className="gap-2 text-slate-700 border-slate-200">
                            <Lock className="h-4 w-4" /> Chốt công
                        </Button>

                        <Button variant="outline" onClick={handleUnfinalizeMatrix} className="gap-2 text-slate-700 border-slate-200">
                            <Unlock className="h-4 w-4" /> Bỏ chốt
                        </Button>
                        
                        <Button variant="outline" onClick={handleExportDetailed} className="gap-2 text-indigo-700 border-indigo-200">
                            <Download className="h-4 w-4" /> Xuất chi tiết
                        </Button>
                    </div>
                )}
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input placeholder="Tìm nhân viên..." value={search} onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }} className="pl-9 w-full sm:w-64" />
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border">
                        <button onClick={() => setViewMode("table")} className={`p-2 rounded-md transition-all flex items-center gap-2 text-sm ${viewMode === "table" ? "bg-white shadow text-indigo-600" : "text-slate-500"}`}>
                            <LayoutGrid className="h-4 w-4" /><span className="hidden sm:inline">Ma trận</span>
                        </button>

                    </div>
                </div>
            </div>

            {viewMode === "table" ? (
                <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left border-collapse" style={{ minWidth: "1500px" }}>
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-0 bg-slate-50 z-20 whitespace-nowrap text-center">
                                        <input
                                            type="checkbox"
                                            aria-label="Chọn tất cả nhân viên trong trang"
                                            checked={matrixData.length > 0 && matrixData.every(r => selectedEmployeeIds.has(r.id))}
                                            onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                                        />
                                    </th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[45px] bg-slate-50 z-10 whitespace-nowrap text-center">STT</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[90px] bg-slate-50 z-10 whitespace-nowrap">Họ tên</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[240px] bg-slate-50 z-10 whitespace-nowrap">Mã NS</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[330px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] bg-slate-50 z-10 whitespace-nowrap">Chức danh</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[450px] bg-slate-50 z-10 whitespace-nowrap text-center">Thao tác</th>

                                    {dayColumns.map(col => (
                                        <th key={col.id} className={`px-1 py-1 border-r border-slate-200 font-medium text-center text-[10px] min-w-[50px] ${col.isWeekend ? 'bg-amber-50 text-amber-700' : 'text-slate-600'}`}>
                                            <div className="flex flex-col items-center">
                                                <span>{col.label}</span>
                                                <span className="text-slate-400 font-normal">({col.shortDateStr})</span>
                                            </div>
                                        </th>
                                    ))}
                                    <th className="px-3 py-2 font-medium text-slate-600 text-center whitespace-nowrap bg-teal-50 border-x border-slate-200">Tổng công</th>
                                    <th className="px-3 py-2 font-medium text-slate-600 text-center whitespace-nowrap bg-slate-50 border-r border-slate-200">Công chuẩn</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan={dayColumns.length + 6} className="p-8 text-center text-slate-500">Đang tải dữ liệu ma trận...</td></tr>
                                ) : matrixData.length === 0 ? (
                                    <tr><td colSpan={dayColumns.length + 6} className="p-8 text-center text-slate-500">Không có dữ liệu bảng công cho kỳ này</td></tr>
                                ) : (
                                    matrixData.map((row, idx) => (
                                        <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="px-2 py-2 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-20 text-center">
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Chọn ${row.fullName}`}
                                                    checked={selectedEmployeeIds.has(row.id)}
                                                    onChange={(e) => toggleSelectRow(row.id, e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[45px] bg-white group-hover:bg-slate-50 z-10 font-medium text-center">{pagination.pageIndex * pagination.pageSize + idx + 1}</td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[90px] bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap font-medium text-slate-800" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.fullName}</td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[240px] bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap font-mono text-xs">{row.employeeCode}</td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[330px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap text-xs text-slate-600" style={{ maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.position || '-'}</td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[450px] bg-white group-hover:bg-slate-50 z-10 text-center">
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewAttendanceDetailFromMatrix(row)}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4 text-slate-500" />
                                                </button>
                                            </td>

                                            {dayColumns.map(col => {
                                                const dayData = row.dailyDetails?.find(d => {
                                                    if (!d.date) return false;
                                                    const parts = d.date.split('/');
                                                    return parts.length === 3 && parseInt(parts[0], 10) === col.dayIndex;
                                                });
                                                const cellContent = getDayCellContent(row.dailyDetails, col.dayIndex);
                                                const isClickable = dayData && dayData.attendanceStatus !== 'WEEKEND' && !dayData.isFinalized;
                                                return (
                                                    <td
                                                        key={`${row.id}-${col.id}`}
                                                        onClick={() => isClickable && handleCellClick(row, dayData)}
                                                        className={`px-1 py-2 border-r border-slate-200 text-center font-medium text-xs transition-colors
                                                            ${col.isWeekend ? 'bg-amber-50/50 text-amber-600' : 'text-slate-700'}
                                                            ${dayData?.isFinalized ? 'bg-slate-50 text-slate-400 cursor-not-allowed' : ''}
                                                            ${isClickable && !isEmployeeOnly ? 'cursor-pointer hover:bg-indigo-50 hover:text-indigo-700' : ''}
                                                        `}
                                                    >
                                                        <div className="flex items-center justify-center gap-1">
                                                            {dayData?.isFinalized && <Lock className="h-3 w-3" />}
                                                            <span>{cellContent}</span>
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                            <td className="px-3 py-2 text-center font-bold text-teal-700 bg-teal-50/50 border-x border-slate-200">
                                                {row.totalWorkingDays}
                                            </td>
                                            <td className="px-3 py-2 text-center font-medium text-slate-600 bg-slate-50/50 border-r border-slate-200">
                                                {dayColumns.filter(c => !c.isWeekend).length}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3 bg-white">
                        <p className="text-sm text-slate-500">
                            Hiển thị {matrixData.length} / Trang {pagination.pageIndex + 1} của {totalPages} (Tổng: {totalRecords})
                        </p>
                        <Pagination
                            currentPage={pagination.pageIndex + 1}
                            totalPages={totalPages}
                            onPageChange={(page) => setPagination({ ...pagination, pageIndex: page - 1 })}
                        />
                    </div>
                </div>
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

            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, data: null, action: null })}
                onConfirm={handleConfirmAction}
                title={
                    confirmModal.action === "bulkRecalculate"
                        ? "Tính lại hàng loạt"
                        : confirmModal.action === "finalizeMatrix"
                            ? "Chốt công"
                            : confirmModal.action === "unfinalizeMatrix"
                                ? "Bỏ chốt công"
                                : "Xác nhận"
                }
                description={
                    confirmModal.action === "bulkRecalculate"
                        ? "Tính lại tất cả bảng công chưa khóa?"
                        : confirmModal.action === "finalizeMatrix"
                            ? `Chốt công sẽ khóa toàn bộ bản ghi trong ma trận theo bộ lọc hiện tại (Tháng ${filters.month}/${filters.year}${filters.departmentId ? `, phòng ban #${filters.departmentId}` : ''}${search ? `, tìm kiếm "${search}"` : ''}). Sau khi chốt, bạn không thể chỉnh sửa từng ngày. Xác nhận?`
                            : confirmModal.action === "unfinalizeMatrix"
                                ? `Bỏ chốt sẽ mở khóa toàn bộ bản ghi trong ma trận theo bộ lọc hiện tại (Tháng ${filters.month}/${filters.year}${filters.departmentId ? `, phòng ban #${filters.departmentId}` : ''}${search ? `, tìm kiếm "${search}"` : ''}). Xác nhận?`
                                : "Xác nhận?"
                }
                loading={confirmLoading}
            />

            <ProcessedRecordEditModal
                isOpen={cellModal.open}
                onClose={() => setCellModal({ open: false, cell: null })}
                cell={cellModal.cell}
                canEdit={!isEmployeeOnly}
                onSuccess={fetchMatrix}
            />
        </div>
    );
}
