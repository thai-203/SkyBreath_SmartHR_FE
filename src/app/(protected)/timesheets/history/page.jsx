"use client";

import { useState, useCallback, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Select } from "@/components/common/Select";
import { Button } from "@/components/common/Button";
import { Pagination } from "@/components/common/Pagination";
import { useToast } from "@/components/common/Toast";
import { auditService } from "@/services/audit.service";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock, History, Search, FilterX, Download, Filter } from "lucide-react";

const ACTION_TYPES = [
    { value: "GENERATE", label: "Tạo bảng công" },
    { value: "RECALCULATE", label: "Tính lại" },
    { value: "LOCK", label: "Khóa / Chốt" },
    { value: "UPDATE", label: "Chỉnh sửa" },
    { value: "DELETE", label: "Xóa" },
    { value: "EXPORT", label: "Xuất Excel" },
    { value: "SYNC_ATTENDANCE", label: "Đồng bộ công" },
    { value: "FINALIZE", label: "Chốt công (ma trận)" },
    { value: "UNFINALIZE", label: "Bỏ chốt công" },
];

/** Khớp với targetTable backend (action-logs) */
const TIMESHEET_HISTORY_TARGET_TABLES = "timesheets,processed_attendance_records";

const targetTableLabel = (table) => {
    if (table === "timesheets") return "Bảng công";
    if (table === "processed_attendance_records") return "Công đã xử lý";
    return table || "—";
};

const getActionTypeLabel = (actionType) => {
    const found = ACTION_TYPES.find(a => a.value === actionType);
    return found ? found.label : actionType;
};

const getActionTypeColor = (actionType) => {
    const colors = {
        'GENERATE': 'bg-emerald-100 text-emerald-700',
        'RECALCULATE': 'bg-amber-100 text-amber-700',
        'LOCK': 'bg-slate-200 text-slate-700',
        'UPDATE': 'bg-blue-100 text-blue-700',
        'DELETE': 'bg-rose-100 text-rose-700',
        'EXPORT': 'bg-purple-100 text-purple-700',
        'SYNC_ATTENDANCE': 'bg-cyan-100 text-cyan-800',
        'FINALIZE': 'bg-violet-100 text-violet-800',
        'UNFINALIZE': 'bg-orange-100 text-orange-800',
    };
    return colors[actionType] || 'bg-slate-100 text-slate-600';
};

const getStatusIcon = (status) => {
    if (status === 'SUCCESS') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
    return <XCircle className="h-4 w-4 text-rose-500" />;
};

const PAGE_SIZE = 12;

export default function ActionHistoryPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    // Read initial values from URL params (persist on F5)
    const initialFilters = {
        actionType: searchParams.get("actionType") || "",
        fromDate: searchParams.get("fromDate") || "",
        toDate: searchParams.get("toDate") || "",
        search: searchParams.get("search") || "",
    };
    const initialPage = parseInt(searchParams.get("page") || "1", 10);

    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);
    const [totalItems, setTotalItems] = useState(0);
    const [page, setPage] = useState(initialPage);

    const [draft, setDraft] = useState({ ...initialFilters });
    const [applied, setApplied] = useState({ ...initialFilters });

    const { error: toastError, success } = useToast();

    // Sync filters + page to URL
    const syncURL = useCallback((filters, pg) => {
        const params = new URLSearchParams();
        if (filters.actionType) params.set("actionType", filters.actionType);
        if (filters.fromDate) params.set("fromDate", filters.fromDate);
        if (filters.toDate) params.set("toDate", filters.toDate);
        if (filters.search) params.set("search", filters.search);
        if (pg > 1) params.set("page", pg.toString());
        const qs = params.toString();
        router.replace(`/timesheets/history${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [router]);

    const fetchLogs = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                targetTable: TIMESHEET_HISTORY_TARGET_TABLES,
                page,
                limit: PAGE_SIZE,
                sortOrder: 'DESC',
            };
            if (applied.actionType) params.actionType = applied.actionType;
            if (applied.fromDate) params.fromDate = formatDateForAPI(applied.fromDate);
            if (applied.toDate) params.toDate = formatDateForAPI(applied.toDate);
            if (applied.search) params.search = applied.search;

            const res = await auditService.getAllForTimesheet(params);
            setLogs(res?.data?.data || []);
            setTotalPages(res?.data?.meta?.totalPages || 0);
            setTotalItems(res?.data?.meta?.totalItems ?? 0);
        } catch (err) {
            console.error("Error fetching logs:", err);
            const msg = err?.response?.data?.message;
            if (msg?.includes('fromDate must be before')) {
                toastError("Ngày bắt đầu phải nhỏ hơn hoặc bằng ngày kết thúc");
            } else if (msg?.includes('cannot be in the future')) {
                toastError("Ngày lọc không được vượt quá ngày hiện tại");
            } else if (msg) {
                toastError(msg);
            } else {
                toastError("Lỗi khi tải lịch sử thao tác");
            }
        } finally {
            setLoading(false);
        }
    }, [page, applied]);

    useEffect(() => { fetchLogs(); }, [fetchLogs]);

    const formatDateForAPI = (dateStr) => {
        if (!dateStr) return '';
        const [y, m, d] = dateStr.split('-');
        return `${d}/${m}/${y}`;
    };

    const handleApplyFilter = () => {
        setApplied({ ...draft });
        setPage(1);
        syncURL(draft, 1);
    };

    const handleClearFilters = () => {
        const empty = { actionType: "", fromDate: "", toDate: "", search: "" };
        setDraft(empty);
        setApplied(empty);
        setPage(1);
        syncURL(empty, 1);
    };

    const handlePageChange = (newPage) => {
        setPage(newPage);
        syncURL(applied, newPage);
    };

    const handleExportExcel = async () => {
        try {
            const blob = await auditService.exportForTimesheet();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `lich_su_thao_tac.xlsx`;
            a.click();
            success("Xuất file thành công");
        } catch (err) {
            toastError("Lỗi khi xuất file");
        }
    };

    const renderDescription = (log) => {
        let desc = log.description;
        if (log.actionType === 'UPDATE' && log.beforeData && log.afterData) {
            const changes = [];
            const fieldsMap = {
                totalWorkingDays: 'Ngày công', totalWorkingHours: 'Giờ công',
                overtimeHours: 'Giờ OT', isLocked: 'Trạng thái khóa'
            };
            Object.keys(log.afterData).forEach(key => {
                const beforeVal = log.beforeData[key];
                const afterVal = log.afterData[key];
                const beforeNum = Number(beforeVal);
                const afterNum = Number(afterVal);
                const isDifferent = (!isNaN(beforeNum) && !isNaN(afterNum))
                    ? beforeNum !== afterNum
                    : String(beforeVal || '') !== String(afterVal || '');
                if (isDifferent) {
                    const fieldName = fieldsMap[key] || key;
                    changes.push(`${fieldName}: ${beforeVal} → ${afterVal}`);
                }
            });
            if (changes.length > 0) {
                return (
                    <div className="flex flex-col gap-1">
                        <span title={desc}>{desc}</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            {changes.map((change, idx) => (
                                <span key={idx} className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">{change}</span>
                            ))}
                        </div>
                    </div>
                );
            }
        }
        return <span title={desc} className="truncate block">{desc}</span>;
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
                        <History className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Lịch sử thao tác</h1>
                        <p className="text-sm text-slate-500">
                            Nhật ký thao tác trên bảng công và dữ liệu công đã xử lý (đồng bộ, chỉnh sửa, chốt công…)
                        </p>
                    </div>
                </div>
                <Button variant="outline" onClick={handleExportExcel} className="gap-2">
                    <Download className="h-4 w-4" /> Xuất Excel
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-3 items-center">
                <div className="w-40">
                    <Select placeholder="Loại hành động" value={draft.actionType}
                        onChange={(e) => setDraft(f => ({ ...f, actionType: e.target.value }))}
                        options={ACTION_TYPES} />
                </div>
                <div className="flex items-center gap-2">
                    <input type="date" value={draft.fromDate}
                        onChange={(e) => setDraft(f => ({ ...f, fromDate: e.target.value }))}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                        style={{ colorScheme: 'light' }} />
                    <span className="text-slate-400 text-sm">→</span>
                    <input type="date" value={draft.toDate}
                        onChange={(e) => setDraft(f => ({ ...f, toDate: e.target.value }))}
                        className="h-10 rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1"
                        style={{ colorScheme: 'light' }} />
                </div>
                <div className="relative flex-1 min-w-[180px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input type="text" placeholder="Tìm theo người thao tác..."
                        value={draft.search}
                        onChange={(e) => setDraft(f => ({ ...f, search: e.target.value }))}
                        className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-1" />
                </div>
                <Button onClick={handleApplyFilter} className="gap-2 h-10">
                    <Filter className="h-4 w-4" /> Lọc
                </Button>
                <button onClick={handleClearFilters} className="text-slate-400 hover:text-rose-500 p-2" title="Xóa bộ lọc">
                    <FilterX className="h-5 w-5" />
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-44">Thời gian</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-36">Người thao tác</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-36">Hành động</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">Bảng dữ liệu</th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">Mô tả</th>
                                <th className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200">
                            {loading ? (
                                <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-500">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="h-6 w-6 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent"></div>
                                        Đang tải...
                                    </div>
                                </td></tr>
                            ) : logs.length === 0 ? (
                                <tr><td colSpan="6" className="px-4 py-12 text-center text-slate-400">Chưa có lịch sử thao tác nào.</td></tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500">
                                            <div className="flex items-center gap-2">
                                                <Clock className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                                                {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm:ss')}
                                            </div>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            {log.user?.username || log.user?.email || 'Hệ thống'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeColor(log.actionType)}`}>
                                                {getActionTypeLabel(log.actionType)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-xs text-slate-600">
                                            <span className="font-mono bg-slate-50 border border-slate-200 rounded px-2 py-0.5">
                                                {targetTableLabel(log.targetTable)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-md">
                                            {renderDescription(log)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center">
                                            <div className="flex justify-center">{getStatusIcon(log.status)}</div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Common Pagination  */}
                <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50">
                    <span className="text-sm text-slate-500">
                        Trang {page} / {totalPages || 1} — {totalItems} bản ghi
                    </span>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={handlePageChange}
                    />
                </div>
            </div>
        </div>
    );
}
