"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { timesheetsService } from "@/services/timesheets.service";
import { departmentsService } from "@/services/departments.service";
import { employeesService } from "@/services/employees.service";
import { authService } from "@/services/auth.service";
import TimesheetTable from "../components/TimesheetTable";
import GenerateTimesheetModal from "../components/GenerateTimesheetModal";
import { UserPlus, Plus, History, CalendarDays, Filter, FilterX } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const currentDate = new Date();

export default function GenerationPage() {
    const [timesheets, setTimesheets] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [search, setSearch] = useState("");
    const [departments, setDepartments] = useState([]);
    const defaultFilters = {
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear(),
        departmentId: "",
    };
    const searchParams = useSearchParams();
    const initialFilters = {
        month: parseInt(searchParams.get("month") || defaultFilters.month),
        year: parseInt(searchParams.get("year") || defaultFilters.year),
        departmentId: searchParams.get("departmentId") || "",
    };
    const [draft, setDraft] = useState({ ...initialFilters });
    const [filters, setFilters] = useState({ ...initialFilters });
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(0);
    const [isInitialized, setIsInitialized] = useState(false);
    const [employeeList, setEmployeeList] = useState([]);

    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    const [addEmployeeModalOpen, setAddEmployeeModalOpen] = useState(false);
    const [confirmModal, setConfirmModal] = useState({ open: false, data: null, action: null });
    const [confirmLoading, setConfirmLoading] = useState(false);
    const router = useRouter();

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
            } catch (err) {
                console.error(err);
            }
        };
        fetchDeps();
        setIsInitialized(true);
    }, []);

    const fetchTimesheets = useCallback(async () => {
        if (!isInitialized) return;
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
        } catch (err) {
            toastError("Lỗi khi tải danh sách");
        } finally {
            setLoading(false);
        }
    }, [pagination, search, filters, isInitialized]);

    useEffect(() => {
        fetchTimesheets();
    }, [fetchTimesheets]);

    const handleGenerateSubmit = async (employeeIds, regenerateMode = false) => {
        setGenerating(true);
        try {
            const res = await timesheetsService.generate({
                month: filters.month,
                year: filters.year,
                employeeIds,
                regenerate: regenerateMode,
            });
            const { generated = 0, updated = 0, failed = 0 } = res?.data || {};
            success(`Tạo mới: ${generated} | Ghi đè: ${updated} | Thất bại: ${failed}`);
            fetchTimesheets();
            setGenerateModalOpen(false);
        } catch (err) {
            toastError("Lỗi khi tạo bảng công");
        } finally {
            setGenerating(false);
        }
    };

    const handleAddEmployeeSubmit = async (employeeId) => {
        try {
            await timesheetsService.addEmployee({
                employeeId,
                month: filters.month,
                year: filters.year
            });
            success("Đã thêm nhân viên");
            setAddEmployeeModalOpen(false);
            fetchTimesheets();
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi thêm");
        }
    };

    const handleDelete = (timesheet) => {
        setConfirmModal({ open: true, data: timesheet, action: "delete" });
    };

    const handleConfirmAction = async () => {
        setConfirmLoading(true);
        try {
            if (confirmModal.action === "delete") {
                await timesheetsService.remove(confirmModal.data.id);
                success("Đã xóa nhân viên khỏi bảng công");
            }
            setConfirmModal({ open: false, data: null, action: null });
            fetchTimesheets();
        } catch (err) {
            toastError("Lỗi khi thực hiện");
        } finally {
            setConfirmLoading(false);
        }
    };

    const syncURL = useCallback((f) => {
        const params = new URLSearchParams();
        if (f.month !== defaultFilters.month) params.set("month", f.month);
        if (f.year !== defaultFilters.year) params.set("year", f.year);
        if (f.departmentId) params.set("departmentId", f.departmentId);
        const qs = params.toString();
        router.replace(`/timesheets/generation${qs ? `?${qs}` : ''}`, { scroll: false });
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
                        <Plus className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Khởi tạo bảng công</h1>
                        <p className="text-sm text-slate-500">Tạo mới và quản lý nhân sự trong bảng công tháng</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push('/timesheets/history')} className="gap-2">
                        <History className="h-4 w-4" /> Lịch sử
                    </Button>
                    <Button onClick={() => setGenerateModalOpen(true)} loading={generating} className="gap-2">
                        <Plus className="h-4 w-4" /> Tạo bảng công
                    </Button>
                </div>
            </div>

            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
                <div className="w-32">
                    <Select
                        hidePlaceholder
                        value={draft.month}
                        onChange={(e) => setDraft({ ...draft, month: parseInt(e.target.value) })}
                        options={Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` }))}
                    />
                </div>
                <div className="w-24">
                    <Select
                        hidePlaceholder
                        value={draft.year}
                        onChange={(e) => setDraft({ ...draft, year: parseInt(e.target.value) })}
                        options={Array.from({ length: 5 }, (_, i) => ({ value: currentDate.getFullYear() - 2 + i, label: `${currentDate.getFullYear() - 2 + i}` }))}
                    />
                </div>
                <div className="w-64">
                    <Select
                        placeholder="Phòng ban"
                        value={draft.departmentId}
                        onChange={(e) => setDraft({ ...draft, departmentId: e.target.value })}
                        options={departments.map(d => ({ value: d.id, label: d.departmentName }))}
                    />
                </div>
                <Button onClick={handleApplyFilter} className="gap-2 h-10">
                    <Filter className="h-4 w-4" /> Lọc
                </Button>
                <button onClick={handleClearFilters} className="text-slate-400 hover:text-rose-500 p-2" title="Xóa bộ lọc">
                    <FilterX className="h-5 w-5" />
                </button>
            </div>

            <TimesheetTable
                mode="generation"
                data={timesheets}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalPages={totalPages}
                onDelete={handleDelete}
            />

            <GenerateTimesheetModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onSubmit={handleGenerateSubmit}
                departments={departments}
                employees={employeeList}
                existingTimesheets={timesheets}
                loading={generating}
            />


            <ConfirmModal
                isOpen={confirmModal.open}
                onClose={() => setConfirmModal({ open: false, data: null, action: null })}
                onConfirm={handleConfirmAction}
                title="Xác nhận xóa"
                description={`Xóa nhân viên ${confirmModal.data?.employee?.fullName} khỏi bảng công tháng ${filters.month}/${filters.year}?`}
                variant="destructive"
                loading={confirmLoading}
            />
        </div>
    );
}
