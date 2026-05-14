"use client";

import { useState, useEffect, useCallback } from "react";
import { History, Filter, RefreshCw } from "lucide-react";
import { notificationsService } from "@/services/notifications.service";
import { Pagination } from "@/components/common/Pagination";
import { HistoryTable } from "./components/HistoryTable";
import { HistoryDetailModal } from "./components/HistoryDetailModal";

const SOURCE_OPTIONS = [
    { value: "", label: "Tất cả loại" },
    { value: "MANUAL", label: "Thủ công" },
    { value: "WORKFLOW", label: "Phê duyệt" },
    { value: "HOLIDAY", label: "Ngày lễ" },
    { value: "PAYSLIP", label: "Phiếu lương" }
];

const STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "SENT", label: "Đã gửi" },
    { value: "SCHEDULED", label: "Hẹn giờ" },
    { value: "FAILED", label: "Thất bại" },
];

export default function NotificationHistoryPage() {
    const [items, setItems] = useState([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(false);
    const [filters, setFilters] = useState({ sourceType: "", sendStatus: "", fromDate: "", toDate: "" });
    const [selectedRecord, setSelectedRecord] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailOpen, setDetailOpen] = useState(false);
    const [detailData, setDetailData] = useState(null);

    const LIMIT = 10;
    const totalPages = Math.ceil(total / LIMIT);

    const fetchHistory = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit: LIMIT };
            if (filters.sourceType) params.sourceType = filters.sourceType;
            if (filters.sendStatus) params.sendStatus = filters.sendStatus;
            if (filters.fromDate) params.fromDate = filters.fromDate;
            if (filters.toDate) params.toDate = filters.toDate;

            const res = await notificationsService.getNotificationHistory(params);
            setItems(res.data?.items || []);
            setTotal(res.data?.total || 0);
        } catch {
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchHistory();
    }, [fetchHistory]);

    const handleFilterChange = (key, val) => {
        setFilters(prev => ({ ...prev, [key]: val }));
        setPage(1);
    };

    const handleRowClick = async (row) => {
        setSelectedRecord(row);
        setDetailOpen(true);
        setDetailLoading(true);
        try {
            const res = await notificationsService.getNotificationHistoryDetail(row.id);
            setDetailData(res.data);
        } catch {
            setDetailData(null);
        } finally {
            setDetailLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 shadow-lg shadow-indigo-200">
                            <History className="h-5 w-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-slate-800">Lịch sử thông báo</h1>
                            <p className="text-slate-500">Tra cứu và giám sát tất cả thông báo đã gửi</p>
                        </div>
                    </div>
                </div>
                <button
                    onClick={fetchHistory}
                    className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 shadow-sm transition-all"
                >
                    <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                    Làm mới
                </button>
            </div>

            {/* Filters */}
            <div className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-slate-100">
                <div className="flex items-center gap-2 mb-3">
                    <Filter className="h-4 w-4 text-slate-400" />
                    <span className="text-sm font-medium text-slate-600">Bộ lọc</span>
                </div>
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                    <select
                        value={filters.sourceType}
                        onChange={e => handleFilterChange("sourceType", e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                        {SOURCE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <select
                        value={filters.sendStatus}
                        onChange={e => handleFilterChange("sendStatus", e.target.value)}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                    >
                        {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <div>
                        <input
                            type="date"
                            value={filters.fromDate}
                            onChange={e => handleFilterChange("fromDate", e.target.value)}
                            placeholder="Từ ngày"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                    <div>
                        <input
                            type="date"
                            value={filters.toDate}
                            onChange={e => handleFilterChange("toDate", e.target.value)}
                            placeholder="Đến ngày"
                            className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm text-slate-700 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
                        />
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="rounded-2xl bg-white shadow-sm ring-1 ring-slate-100 overflow-hidden">
                <div className="border-b border-slate-100 px-6 py-3 flex items-center justify-between">
                    <span className="text-sm text-slate-500">Tổng: <span className="font-semibold text-slate-700">{total}</span> bản ghi</span>
                </div>
                <HistoryTable
                    items={items}
                    loading={loading}
                    onRowClick={handleRowClick}
                />

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-100 px-6 py-4">
                    <p className="text-sm text-slate-500">
                        Hiển thị {items.length} / Trang {page} của {Math.max(totalPages, 1)}
                    </p>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            </div>

            {/* Detail Modal */}
            <HistoryDetailModal
                open={detailOpen}
                onClose={() => { setDetailOpen(false); setDetailData(null); }}
                record={detailLoading ? selectedRecord : detailData}
            />
        </div>
    );
}
