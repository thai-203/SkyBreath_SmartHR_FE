"use client";

import { PermissionGate } from "@/components/common/AuthGuard";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ConfirmModal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";
import { Select } from "@/components/common/Select";
import { useToast } from "@/components/common/Toast";
import { authService } from "@/services/auth.service";
import { departmentsService } from "@/services/departments.service";
import { employeesService } from "@/services/employees.service";
import { timesheetsService } from "@/services/timesheets.service";
import { Download, Eye, FileSpreadsheet, LayoutGrid, Lock, RefreshCw, Search, Unlock } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import AttendanceDetailModal from "../components/AttendanceDetailModal";
import CalendarView from "../components/CalendarView";
import ExcuseRequestModal from "../components/ExcuseRequestModal";
import ProcessedRecordEditModal from "../components/ProcessedRecordEditModal";
import { useTimesheetDetail } from "../hooks/useTimesheetDetail";

const currentDate = new Date();

export default function DataManagementPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUser = authService.getCurrentUser();
    // Kiểm tra xem user hiện tại có phải là Nhân viên bình thường hay không (không có vai trò ADMIN hay HR)
    const isEmployeeOnly = currentUser?.roles?.includes('EMPLOYEE') && !currentUser?.roles?.some(r => ['ADMIN', 'HR'].includes(r));

    // ==========================================
    // CÁC TRẠNG THÁI (STATE HOOKS) QUẢN LÝ DỮ LIỆU
    // ==========================================
    const [matrixData, setMatrixData] = useState([]); // Mảng chứa dữ liệu ma trận công của các nhân viên được tải về từ API
    const [loading, setLoading] = useState(false); // Trạng thái hiển thị vòng quay loading khi tải dữ liệu từ API
    const [search, setSearch] = useState(""); // Lưu từ khóa tìm kiếm nhân viên theo họ tên hoặc mã
    const [departments, setDepartments] = useState([]); // Danh sách phòng ban phục vụ hiển thị ô lọc Dropdown

    // Thiết lập bộ lọc mặc định ban đầu (lấy tháng và năm hiện tại của hệ thống)
    const defaultFilters = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        departmentId: "",
        status: "",
        showTerminated: false,
    };
    
    // Đọc các giá trị lọc từ URL Query Parameters nếu có (để giữ trạng thái lọc khi reload trang)
    const initialFilters = {
        month: parseInt(searchParams.get("month") || defaultFilters.month),
        year: parseInt(searchParams.get("year") || defaultFilters.year),
        departmentId: searchParams.get("departmentId") || "",
        status: searchParams.get("status") || "",
        showTerminated: searchParams.get("showTerminated") === "true",
    };
    const [filters, setFilters] = useState({ ...initialFilters });

    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 }); // Phân trang ở Frontend (10 bản ghi mỗi trang)
    const [totalPages, setTotalPages] = useState(0); // Tổng số trang nhận về từ API
    const [totalRecords, setTotalRecords] = useState(0); // Tổng số bản ghi (nhân viên) khớp bộ lọc
    const [viewMode, setViewMode] = useState("table"); // Chế độ xem: "table" (Ma trận công) hoặc "calendar" (Lịch cá nhân)
    const [calendarEmployeeId, setCalendarEmployeeId] = useState(""); // ID nhân viên được chọn để hiển thị lịch cá nhân
    const [calendarData, setCalendarData] = useState(null); // Chi tiết dữ liệu chấm công ngày của nhân viên được chọn xem lịch
    const [calendarLoading, setCalendarLoading] = useState(false); // Vòng quay loading khi tải lịch
    const [employeeList, setEmployeeList] = useState([]); // Danh sách toàn bộ nhân viên phục vụ dropdown ở chế độ xem Lịch

    const [confirmModal, setConfirmModal] = useState({ open: false, data: null, action: null }); // Quản lý modal xác nhận chốt/tính lại công
    const [confirmLoading, setConfirmLoading] = useState(false);
    const [syncLoading, setSyncLoading] = useState(false); // Vòng quay loading khi bấm đồng bộ công
    const [isInitialized, setIsInitialized] = useState(false); // Tránh chạy fetch API trước khi component mount xong
    const [cellModal, setCellModal] = useState({ open: false, cell: null }); // Modal hiển thị khi click vào ô công ngày để sửa tay
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState(new Set()); // Lưu danh sách ID nhân viên được tích chọn check-box

    const { success, error: toastError } = useToast();

    // useEffect tải danh mục Phòng ban và Nhân viên ngay khi truy cập trang lần đầu
    useEffect(() => {
        const fetchDeps = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    departmentsService.getAllForTimeSheet(),
                    employeesService.getAllForPublic({ limit: 1000 })
                ]);
                setDepartments(deptRes?.data || []);
                setEmployeeList(empRes?.data?.items || []);
            } catch (err) { console.error(err); }
        };
        fetchDeps();
        setIsInitialized(true);
    }, []);

    // ========================================================
    // BƯỚC 1: LẤY DỮ LIỆU MA TRẬN CÔNG TỪ API (FETCH DATA FLOW)
    // ========================================================
    const fetchMatrix = useCallback(async () => {
        if (!isInitialized) return;
        setLoading(true);
        try {
            // Gửi request HTTP GET lên API getProcessedMatrix của Backend
            const res = await timesheetsService.getProcessedMatrix({
                page: pagination.pageIndex + 1, // API nhận page bắt đầu từ 1, MUI/ReactTable nhận từ 0
                limit: pagination.pageSize,
                search: search || undefined,
                month: filters.month,
                year: filters.year,
                departmentId: filters.departmentId || undefined,
                status: filters.status || undefined,
                showTerminated: filters.showTerminated,
            });
            const data = res?.data || res || {};
            // Gán dữ liệu trả về vào các State để React tự động re-render lên màn hình
            setMatrixData(data.items || []); // Danh sách nhân viên kèm dailyDetails
            setTotalPages(data.totalPages || 0); // Tổng số trang
            setTotalRecords(data.total || 0); // Tổng số dòng dữ liệu
        } catch (err) { toastError("Lỗi khi tải dữ liệu"); }
        finally { setLoading(false); }
    }, [pagination, search, filters, isInitialized]);

    // Tự động chạy lại fetchMatrix mỗi khi phân trang, bộ lọc hoặc từ khóa tìm kiếm thay đổi
    useEffect(() => { fetchMatrix(); }, [fetchMatrix]);

    // Tải dữ liệu xem lịch cá nhân của một nhân viên được chọn
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

    // Gọi API để lấy chi tiết bảng công của một nhân viên phục vụ hiển thị Modal chi tiết
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

    // Gọi API thực hiện đồng bộ dữ liệu điểm danh thô cho các nhân sự được tích chọn
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
            fetchMatrix(); // Load lại ma trận công
        } catch (err) { toastError("Lỗi khi đồng bộ công"); }
        finally { setSyncLoading(false); }
    };

    // Tích chọn hoặc bỏ chọn toàn bộ checkbox nhân viên trên trang hiện tại
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

    // Tích chọn hoặc bỏ chọn checkbox của một nhân viên cụ thể
    const toggleSelectRow = (employeeId, checked) => {
        setSelectedEmployeeIds(prev => {
            const next = new Set(prev);
            if (checked) next.add(employeeId);
            else next.delete(employeeId);
            return next;
        });
    };

    // Gọi API xử lý các hành động chốt công, bỏ chốt công, tính toán lại công
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
        if (selectedEmployeeIds.size === 0) {
            toastError("Vui lòng chọn ít nhất 1 nhân viên để xuất chi tiết");
            return;
        }
        try {
            const employeeIds = Array.from(selectedEmployeeIds).join(',');
            const blob = await timesheetsService.exportDetailed({ month: filters.month, year: filters.year, employeeIds });
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
        if (f.showTerminated) params.set("showTerminated", "true");
        const qs = params.toString();
        router.replace(`/timesheets/data${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [router]);

    const handleClearFilters = () => {
        setFilters({ ...defaultFilters });
        setSearch("");
        setPagination(p => ({ ...p, pageIndex: 0 }));
        syncURL(defaultFilters);
    };

    // ========================================================
    // BƯỚC 2: TỰ ĐỘNG DỰNG TIÊU ĐỀ CÁC CỘT NGÀY (COLUMNS GENERATOR)
    // ========================================================
    // Lấy số ngày trong tháng được lọc (ví dụ tháng 4 có 30 ngày, tháng 5 có 31 ngày)
    const daysInMonth = new Date(filters.year, filters.month, 0).getDate();
    
    // Khởi tạo mảng cấu hình tiêu đề cột ngày
    const dayColumns = Array.from({ length: daysInMonth }, (_, i) => {
        const d = new Date(filters.year, filters.month - 1, i + 1);
        const dayOfWeek = ["Chủ nhật", "Thứ hai", "Thứ ba", "Thứ tư", "Thứ năm", "Thứ sáu", "Thứ bảy"][d.getDay()];
        const shortDateStr = `${String(i + 1).padStart(2, '0')}/${String(filters.month).padStart(2, '0')}`;
        return {
            id: `day-${i + 1}`,
            label: dayOfWeek, // Thứ trong tuần (Thứ Hai, Thứ Ba...)
            shortDateStr: shortDateStr, // Chuỗi ngày hiển thị dạng DD/MM
            isWeekend: d.getDay() === 0 || d.getDay() === 6, // Cờ đánh dấu ngày cuối tuần để tô màu vàng nhạt
            dayIndex: i + 1, // Chỉ số ngày từ 1 đến hết tháng
        };
    });

    // Mở modal sửa tay công ngày khi click vào ô lưới
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

    // =========================================================================
    // BƯỚC 3: MÁP KÝ HIỆU CHẤM CÔNG VÀO Ô LƯỚI MA TRẬN (CELL TO DAY MAPPER)
    // =========================================================================
    // Hàm tìm kiếm và gán ký hiệu chấm công chuẩn vào ô lưới theo từng ngày tương ứng của từng nhân viên
    const getDayCellContent = (dailyDetails, dayIndex) => {
        if (!dailyDetails || !Array.isArray(dailyDetails)) return '-';
        // Tìm ngày trùng khớp trong mảng chi tiết ngày 'dailyDetails' của nhân viên
        const dayData = dailyDetails.find(d => {
            if (d.date) {
                const parts = d.date.split('/');
                if (parts.length === 3) {
                    return parseInt(parts[0], 10) === dayIndex; // So sánh chỉ số ngày
                }
            }
            return false;
        });

        if (!dayData) return '-';
        // Nếu là ngày nghỉ tuần, hiển thị ký hiệu 'N'
        if (dayData.attendanceStatus === 'WEEKEND' || dayData.attendanceStatus === 'N') return 'N';
        
        // Nếu là ngày vắng hoặc không đi làm, hiển thị số giờ làm thực tế (0 hoặc số giờ)
        if (['X', 'KL', 'ABSENT', '0'].includes(dayData.attendanceStatus)) {
            return dayData.workingHours !== undefined && dayData.workingHours !== null ? dayData.workingHours : 0;
        }
        // Trả về ký hiệu công chuẩn (ví dụ: ON_TIME, LATE, LEAVE...)
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
                            {isEmployeeOnly ? "bảng công cá nhân" : "Dữ liệu chấm công"}
                        </h1>
                        <p className="text-sm text-slate-500 mt-1">
                            {isEmployeeOnly 
                                ? "Xem chi tiết dữ liệu công của bạn" 
                                : `Kỳ công: Tháng ${filters.month}/${filters.year} • ${
                                    filters.departmentId 
                                        ? (departments.find(d => d.id?.toString() === filters.departmentId)?.departmentName || "Phòng ban đã chọn") 
                                        : "Tất cả phòng ban"
                                  }`
                            }
                        </p>
                    </div>
                </div>
                {!isEmployeeOnly && (
                    <div className="flex flex-wrap gap-2">
                        <PermissionGate permission="TIMESHEET_UPDATE">
                            <Button variant="outline" onClick={handleSync} loading={syncLoading} className="gap-2 text-teal-700 border-teal-200">
                                <RefreshCw className="h-4 w-4" /> Đồng bộ công
                            </Button>
                        </PermissionGate>
                        <PermissionGate permission="TIMESHEET_LOCK">
                            <Button variant="outline" onClick={handleFinalizeMatrix} className="gap-2 text-rose-700 border-rose-200">
                                <Lock className="h-4 w-4" /> Chốt công
                            </Button>
                        </PermissionGate>
                        <PermissionGate permission="TIMESHEET_LOCK">
                            <Button variant="outline" onClick={handleUnfinalizeMatrix} className="gap-2 text-slate-700 border-slate-200">
                                <Unlock className="h-4 w-4" /> Bỏ chốt công
                            </Button>
                        </PermissionGate>
                        <PermissionGate permission="TIMESHEET_EXPORT">
                            <Button variant="outline" onClick={handleExportDetailed} className="gap-2 text-indigo-700 border-indigo-200">
                                <Download className="h-4 w-4" /> Xuất chi tiết
                            </Button>
                        </PermissionGate>
                    </div>
                )}
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4 items-start lg:items-center justify-between">
                <div className="flex flex-wrap gap-3 items-center flex-1">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                        <Input placeholder="Tìm nhân viên..." value={search} onChange={(e) => { setSearch(e.target.value); setPagination(p => ({ ...p, pageIndex: 0 })); }} className="pl-9 w-full sm:w-64" />
                    </div>
                    {!isEmployeeOnly && (
                        <label className="flex items-center gap-2 text-sm font-medium text-slate-600 cursor-pointer ml-2">
                            <input
                                type="checkbox"
                                checked={filters.showTerminated}
                                onChange={(e) => handleFilterChange('showTerminated', e.target.checked)}
                                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer"
                            />
                            Hiển thị nhân viên đã nghỉ việc
                        </label>
                    )}
                </div>

                <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border">
                    </div>
                </div>
            </div>

            {viewMode === "table" ? (
                <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        {/* =========================================================
                            BƯỚC 4: RENDER BẢNG MA TRẬN 30 NGÀY CHO HR (RENDER THE GRID)
                            ========================================================= */}
                        <table className="w-full text-sm text-left border-collapse" style={{ minWidth: "1500px" }}>
                            <thead className="bg-slate-50 border-b border-slate-200">
                                <tr>
                                    <th className="px-2 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-0 bg-slate-50 z-20 whitespace-nowrap text-center" style={{ minWidth: '45px', maxWidth: '45px' }}>
                                        <input
                                            type="checkbox"
                                            aria-label="Chọn tất cả nhân viên trong trang"
                                            checked={matrixData.length > 0 && matrixData.every(r => selectedEmployeeIds.has(r.id))}
                                            onChange={(e) => toggleSelectAllOnPage(e.target.checked)}
                                        />
                                    </th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[45px] bg-slate-50 z-10 whitespace-nowrap text-center" style={{ minWidth: '45px', maxWidth: '45px' }}>STT</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[90px] bg-slate-50 z-10 whitespace-nowrap text-center" style={{ minWidth: '90px', maxWidth: '90px' }}>Thao tác</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[180px] bg-slate-50 z-10 whitespace-nowrap" style={{ minWidth: '150px', maxWidth: '150px' }}>Họ tên</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[330px] bg-slate-50 z-10 whitespace-nowrap" style={{ minWidth: '90px', maxWidth: '90px' }}>Mã NS</th>
                                    <th className="px-3 py-2 border-r border-slate-200 font-medium text-slate-600 sticky left-[420px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] bg-slate-50 z-10 whitespace-nowrap" style={{ minWidth: '120px', maxWidth: '120px' }}>Chức danh</th>

                                    {/* Map qua các ngày trong tháng để vẽ header ngày */}
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
                                    <tr><td colSpan={dayColumns.length + 6} className="p-8 text-center text-slate-500">Đang tải dữ liệu...</td></tr>
                                ) : matrixData.length === 0 ? (
                                    <tr><td colSpan={dayColumns.length + 6} className="p-8 text-center text-slate-500">Không có dữ liệu bảng công cho kỳ này</td></tr>
                                ) : (
                                    // Duyệt qua từng nhân viên để render từng dòng thông tin
                                    matrixData.map((row, idx) => (
                                        <tr key={row.id} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                            <td className="px-2 py-2 border-r border-slate-200 sticky left-0 bg-white group-hover:bg-slate-50 z-20 text-center" style={{ minWidth: '45px', maxWidth: '45px' }}>
                                                <input
                                                    type="checkbox"
                                                    aria-label={`Chọn ${row.fullName}`}
                                                    checked={selectedEmployeeIds.has(row.id)}
                                                    onChange={(e) => toggleSelectRow(row.id, e.target.checked)}
                                                />
                                            </td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[45px] bg-white group-hover:bg-slate-50 z-10 font-medium text-center" style={{ minWidth: '45px', maxWidth: '45px' }}>{pagination.pageIndex * pagination.pageSize + idx + 1}</td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[90px] bg-white group-hover:bg-slate-50 z-10 text-center" style={{ minWidth: '90px', maxWidth: '90px' }}>
                                                <button
                                                    type="button"
                                                    onClick={() => handleViewAttendanceDetailFromMatrix(row)}
                                                    className="inline-flex items-center justify-center h-8 w-8 rounded-md hover:bg-slate-100 transition-colors"
                                                    title="Xem chi tiết"
                                                >
                                                    <Eye className="h-4 w-4 text-slate-500" />
                                                </button>
                                            </td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[180px] bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap font-medium text-slate-800" style={{ minWidth: '150px', maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.fullName}</td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[330px] bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap font-mono text-xs" style={{ minWidth: '90px', maxWidth: '90px' }}>{row.employeeCode}</td>
                                            <td className="px-3 py-2 border-r border-slate-200 sticky left-[420px] shadow-[2px_0_4px_-2px_rgba(0,0,0,0.1)] bg-white group-hover:bg-slate-50 z-10 whitespace-nowrap text-xs text-slate-600" style={{ minWidth: '120px', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis' }}>{row.position || '-'}</td>

                                            {/* Với từng nhân viên, duyệt qua 30 ngày để điền dữ liệu tương ứng */}
                                            {dayColumns.map(col => {
                                                const dayData = row.dailyDetails?.find(d => {
                                                    if (!d.date) return false;
                                                    const parts = d.date.split('/');
                                                    return parts.length === 3 && parseInt(parts[0], 10) === col.dayIndex;
                                                });
                                                const cellContent = getDayCellContent(row.dailyDetails, col.dayIndex);
                                                // Điều kiện click sửa tay: Có data ngày công, không phải cuối tuần, và ngày công đó chưa bị chốt (finalize)
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
                            ? `Chốt công sẽ khóa toàn bộ bản ghi trong theo bộ lọc hiện tại (Tháng ${filters.month}/${filters.year}${filters.departmentId ? `, phòng ban #${filters.departmentId}` : ''}${search ? `, tìm kiếm "${search}"` : ''}). Sau khi chốt, bạn không thể chỉnh sửa từng ngày. Xác nhận?`
                            : confirmModal.action === "unfinalizeMatrix"
                                ? `Bỏ chốt sẽ mở khóa toàn bộ bản ghi trong theo bộ lọc hiện tại (Tháng ${filters.month}/${filters.year}${filters.departmentId ? `, phòng ban #${filters.departmentId}` : ''}${search ? `, tìm kiếm "${search}"` : ''}). Xác nhận?`
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
