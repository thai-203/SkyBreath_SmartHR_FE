"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, FileText, ChevronLeft, ChevronRight, CheckCircle, XCircle } from "lucide-react";
import { requestsService } from "@/services/requests.service";
import { useToast } from "@/components/common/Toast";
import RequestStatusBadge from "../my-requests/components/RequestStatusBadge";
import RequestDetailModal from "../my-requests/components/RequestDetailModal";

export default function PendingApprovalsPage() {
    const { success, error: toastError } = useToast();
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 20;

    const [selectedRequest, setSelectedRequest] = useState(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit };
            const res = await requestsService.getPendingApprovals(params);
            setRequests(res?.data?.items || []);
            setTotal(res?.data?.total || 0);
        } catch (err) {
            console.error("Lỗi tải danh sách:", err);
            toastError("Không thể tải danh sách đơn chờ duyệt");
        } finally {
            setLoading(false);
        }
    }, [page]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    const totalPages = Math.ceil(total / limit);
    const startItem = (page - 1) * limit + 1;
    const endItem = Math.min(page * limit, total);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Đơn Cần Phê Duyệt</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Danh sách các đơn từ đang chờ bạn phê duyệt</p>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5 flex gap-4 flex-wrap">
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors ml-auto"
                >
                    <RefreshCw className="w-4 h-4" /> Làm mới
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Mã đơn</th>
                                <th className="px-4 py-3 text-left font-semibold">Người gửi</th>
                                <th className="px-4 py-3 text-left font-semibold">Loại đơn</th>
                                <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                                <th className="px-4 py-3 text-left font-semibold">Ngày gửi</th>
                                <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16 text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="text-center py-16">
                                        <CheckCircle className="w-12 h-12 mx-auto text-green-200 mb-3" />
                                        <p className="text-slate-400 font-medium">Tuyệt vời! Không có đơn nào đang chờ duyệt</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setSelectedRequest(req)}>
                                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                                            {req.requestCode || `#${req.id}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-700">{req.employee?.fullName}</div>
                                            <div className="text-xs text-slate-400">{req.employee?.department?.name || '---'}</div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-700">{req.requestType?.name}</div>
                                            <div className="text-xs text-slate-400">{req.requestGroup?.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                            {req.startDate} → {req.endDate}
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">
                                            {req.submittedAt ? new Date(req.submittedAt).toLocaleDateString("vi-VN") : '---'}
                                        </td>
                                        <td className="px-4 py-3 text-right">
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setSelectedRequest(req);
                                                }}
                                                className="text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline px-2 py-1 rounded bg-blue-50 hover:bg-blue-100"
                                            >
                                                Xem chi tiết & Duyệt
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                {total > 0 && (
                    <div className="flex items-center justify-between px-4 py-3 border-t border-slate-100 bg-slate-50/50">
                        <p className="text-xs text-slate-500">
                            Hiển thị {startItem}–{endItem} / {total} đơn
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page === 1}
                                onClick={() => setPage((p) => p - 1)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className="text-xs px-3 text-slate-600">
                                {page} / {totalPages}
                            </span>
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => p + 1)}
                                className="p-1.5 rounded-lg hover:bg-slate-200 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modals */}
            {selectedRequest && (
                <RequestDetailModal
                    isOpen={!!selectedRequest}
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onRefresh={fetchRequests}
                    canApprove={true}
                />
            )}
        </div>
    );
}
