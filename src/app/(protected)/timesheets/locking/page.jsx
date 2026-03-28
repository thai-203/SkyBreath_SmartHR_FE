"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { timesheetsService } from "@/services/timesheets.service";
import { departmentsService } from "@/services/departments.service";
import TimesheetTable from "../components/TimesheetTable";
import AttendanceDetailModal from "../components/AttendanceDetailModal";
import { useTimesheetDetail } from "../hooks/useTimesheetDetail";
import { Lock, FileCheck, FilterX, CalendarDays, Filter } from "lucide-react";

const currentDate = new Date();

export default function LockingPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [departments, setDepartments] = useState([]);
    const defaultFilters = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        departmentId: "",
    };
    const initialFilters = {
        month: parseInt(searchParams.get("month") || defaultFilters.month),
        year: parseInt(searchParams.get("year") || defaultFilters.year),
        departmentId: searchParams.get("departmentId") || "",
    };
    const [draft, setDraft] = useState({ ...initialFilters });
    const [filters, setFilters] = useState({ ...initialFilters });
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(0);

    // Modals (shared hook)
    const [confirmModal, setConfirmModal] = useState({ open: false, data: null, action: null });
    const [confirmLoading, setConfirmLoading] = useState(false);

    const { success, error: toastError } = useToast();

    useEffect(() => {
        const fetchDeps = async () => {
            try {
                const res = await departmentsService.getAll();
                setDepartments(res?.data || []);
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
            });
            setTimesheets(res?.data?.items || []);
            setTotalPages(res?.data?.totalPages || 0);
        } catch (err) { toastError("Lỗi khi tải dữ liệu"); }
        finally { setLoading(false); }
    }, [pagination, search, filters]);

    useEffect(() => { fetchTimesheets(); }, [fetchTimesheets]);

    const handleLock = (timesheet) => {
        setConfirmModal({ open: true, data: timesheet, action: "lock" });
    };

    const handleBulkLock = () => {
        setConfirmModal({ open: true, data: { count: timesheets.filter(t => !t.isLocked).length }, action: "bulkLock" });
    };

    const handleConfirmAction = async () => {
        const { data, action } = confirmModal;
        setConfirmLoading(true);
        try {
            if (action === "lock") {
                await timesheetsService.lock(data.id);
                success("Đã khóa bảng chấm công");
            } else if (action === "bulkLock") {
                const res = await timesheetsService.bulkLock({
                    month: filters.month,
                    year: filters.year,
                    departmentId: filters.departmentId ? parseInt(filters.departmentId) : undefined,
                });
                success(`Đã khóa ${res?.data?.locked || 0} bảng`);
            }
            setConfirmModal({ open: false, data: null, action: null });
            fetchTimesheets();
        } catch (err) { toastError("Lỗi khi thực hiện"); }
        finally { setConfirmLoading(false); }
    };

    // Shared detail modal hook
    const {
        detailModal, handleViewDetail, closeDetailModal, handleDetailLock,
    } = useTimesheetDetail({ fetchTimesheets });

    const syncURL = useCallback((f) => {
        const params = new URLSearchParams();
        if (f.month !== defaultFilters.month) params.set("month", f.month);
        if (f.year !== defaultFilters.year) params.set("year", f.year);
        if (f.departmentId) params.set("departmentId", f.departmentId);
        const qs = params.toString();
        router.replace(`/timesheets/locking${qs ? `?${qs}` : ''}`, { scroll: false });
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
                        <FileCheck className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Chốt công & Khóa sổ</h1>
                        <p className="text-sm text-slate-500">Khóa dữ liệu chấm công để chốt lương cuối tháng</p>
                    </div>
                </div>
                <div>
                    <Button variant="outline" onClick={handleBulkLock} className="gap-2 text-rose-600 border-rose-200">
                        <Lock className="h-4 w-4" /> Khóa tất cả bảng công
                    </Button>
                </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
                <div className="w-32">
                    <Select hidePlaceholder value={draft.month} onChange={(e) => setDraft({ ...draft, month: parseInt(e.target.value) })}
                        options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))} />
                </div>
                <div className="w-24">
                    <Select hidePlaceholder value={draft.year} onChange={(e) => setDraft({ ...draft, year: parseInt(e.target.value) })}
                        options={Array.from({ length: 5 }, (_, i) => ({ value: currentDate.getFullYear() - 2 + i, label: `${currentDate.getFullYear() - 2 + i}` }))} />
                </div>
                <div className="w-64">
                    <Select placeholder="Phòng ban" value={draft.departmentId} onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}
                        options={departments.map(d => ({ value: d.id, label: d.departmentName }))} />
                </div>
                <Button onClick={handleApplyFilter} className="gap-2 h-10">
                    <Filter className="h-4 w-4" /> Lọc
                </Button>
                <button onClick={handleClearFilters} className="text-slate-400 hover:text-rose-500 p-2" title="Xóa bộ lọc">
                    <FilterX className="h-5 w-5" />
                </button>
            </div>

            <TimesheetTable mode="locking" data={timesheets} loading={loading} search={search} onSearchChange={setSearch} pagination={pagination} onPaginationChange={setPagination} totalPages={totalPages}
                onViewDetail={handleViewDetail} onLock={handleLock} />

            <AttendanceDetailModal isOpen={detailModal.open} onClose={closeDetailModal} data={detailModal.data}
                onLock={handleDetailLock}
                canEdit={false} />

            <ConfirmModal isOpen={confirmModal.open} onClose={() => setConfirmModal({ open: false, data: null, action: null })} onConfirm={handleConfirmAction}
                title="Xác nhận khóa"
                description={confirmModal.action === "lock" ? "Khi đã khóa, dữ liệu sẽ không thể chỉnh sửa. Bạn có chắc không?" : "Khóa toàn bộ bảng công đang mở trong kỳ này?"}
                variant="destructive"
                loading={confirmLoading} />
        </div>
    );
}
