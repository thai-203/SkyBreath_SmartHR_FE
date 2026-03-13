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
import { CalendarDays, Plus, Download, FileSpreadsheet } from "lucide-react";
import { authService } from "@/services/auth.service";

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

    // Modals
    const [detailModal, setDetailModal] = useState({ open: false, data: null });
    const [editModal, setEditModal] = useState({ open: false, data: null });
    const [confirmModal, setConfirmModal] = useState({ open: false, data: null, action: null });
    const [editLoading, setEditLoading] = useState(false);
    const [confirmLoading, setConfirmLoading] = useState(false);

    // Toast
    const { success, error: toastError } = useToast();

    // Fetch departments for filter
    useEffect(() => {
        const fetchDepartments = async () => {
            try {
                const res = await departmentsService.getAll();
                setDepartments(res?.data || []);
            } catch (err) {
                console.error("Error fetching departments:", err);
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

    // Recalculate
    const handleRecalculate = (timesheet) => {
        setConfirmModal({
            open: true,
            data: timesheet,
            action: "recalculate",
        });
    };

    // Lock / Unlock
    const handleLock = (timesheet) => {
        setConfirmModal({ open: true, data: timesheet, action: "lock" });
    };

    const handleUnlock = (timesheet) => {
        setConfirmModal({ open: true, data: timesheet, action: "unlock" });
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
    };

    const confirmTitles = {
        regenerate: "Tạo lại bảng chấm công",
        recalculate: "Tính lại bảng chấm công",
        lock: "Khóa bảng chấm công",
        unlock: "Mở khóa bảng chấm công",
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
                <div className="flex flex-wrap gap-2">
                    {authService.hasPermission("TIMESHEET_CREATE") && (
                        <Button onClick={handleGenerateClick} loading={generating} className="gap-2">
                            <Plus className="h-4 w-4" />
                            Tạo bảng chấm công
                        </Button>
                    )}
                    {authService.hasPermission("TIMESHEET_EXPORT") && (
                        <>
                            <Button variant="outline" onClick={handleExportSummary} className="gap-2">
                                <FileSpreadsheet className="h-4 w-4" />
                                Xuất tổng hợp
                            </Button>
                            <Button variant="outline" onClick={handleExportDetailed} className="gap-2">
                                <Download className="h-4 w-4" />
                                Xuất chi tiết
                            </Button>
                        </>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="w-40">
                    <Select
                        label="Tháng"
                        value={filters.month}
                        onChange={(e) => setFilters({ ...filters, month: parseInt(e.target.value) })}
                        options={monthOptions}
                        placeholder="-- Chọn tháng --"
                    />
                </div>
                <div className="w-36">
                    <Select
                        label="Năm"
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: parseInt(e.target.value) })}
                        options={yearOptions}
                        placeholder="-- Chọn năm --"
                    />
                </div>
                <div className="w-48">
                    <Select
                        label="Phòng ban"
                        placeholder="-- Tất cả phòng ban --"
                        value={filters.departmentId}
                        onChange={(e) => setFilters({ ...filters, departmentId: e.target.value })}
                        options={(departments || []).map(d => ({ value: d.id, label: d.departmentName }))}
                    />
                </div>
                <div className="w-40">
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

            {/* Table */}
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
            />

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

            {/* Confirm Modal */}
            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, data: null, action: null })}
                onConfirm={handleConfirmAction}
                title={confirmTitles[confirmModal.action] || "Xác nhận"}
                description={confirmMessages[confirmModal.action] || ""}
                confirmText="Xác nhận"
                cancelText="Hủy"
                variant={confirmModal.action === "lock" ? "destructive" : "default"}
                loading={confirmLoading}
            />
        </div>
    );
}
