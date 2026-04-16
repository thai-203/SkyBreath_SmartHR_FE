"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, RefreshCw, FileText } from "lucide-react";
import { requestsService } from "@/services/requests.service";
import { useToast } from "@/components/common/Toast";
import RequestFormModal from "./components/RequestFormModal";
import RequestStatusBadge from "./components/RequestStatusBadge";
import RequestDetailModal from "./components/RequestDetailModal";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { Pagination } from "@/components/common/Pagination";

const STATUS_OPTIONS = [
    { value: "", label: "Tất cả trạng thái" },
    { value: "DRAFT", label: "Nháp" },
    { value: "PENDING", label: "Chờ duyệt" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "REJECTED", label: "Từ chối" },
    { value: "CANCELLED", label: "Đã hủy" },
];

export default function MyRequestsPage() {
    const { success, error: toastError } = useToast();
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const limit = 10;

    const [filters, setFilters] = useState({ status: "" });
    const [showForm, setShowForm] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState(null);
    const [editRequestId, setEditRequestId] = useState(null);

    const fetchRequests = useCallback(async () => {
        setLoading(true);
        try {
            const params = { page, limit, ...(filters.status ? { status: filters.status } : {}) };
            const res = await requestsService.getMyRequests(params);
            setRequests(res?.data?.items || []);
            setTotal(res?.data?.total || 0);
        } catch (err) {
            console.error("Lỗi khi tải danh sách:", err);
            toastError("Không thể tải danh sách đơn từ");
        } finally {
            setLoading(false);
        }
    }, [page, filters]);

    useEffect(() => {
        fetchRequests();
    }, [fetchRequests]);

    //  Real-time: Lắng nghe socket events để tự refresh
    useEffect(() => {
        const handleNewNotification = (e) => {
            const data = e.detail || {};
            if (data.link === "/requests/my-requests") {
                fetchRequests();
            }
        };
        window.addEventListener("socket:new-notification", handleNewNotification);
        return () => {
            window.removeEventListener("socket:new-notification", handleNewNotification);
        };
    }, [fetchRequests]);

    const [confirmCancel, setConfirmCancel] = useState(null);

    const handleCancel = async () => {
        if (!confirmCancel) return;
        try {
            await requestsService.cancel(confirmCancel);
            success("Hủy đơn thành công");
            fetchRequests();
        } catch (err) {
            console.error(err);
            toastError(err?.response?.data?.message || "Hủy đơn thất bại");
        } finally {
            setConfirmCancel(null);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Đơn Từ Của Tôi</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Quản lý và theo dõi các đơn từ bạn đã tạo</p>
                </div>
                <Button onClick={() => setShowForm(true)} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" />
                    Tạo đơn mới
                </Button>
            </div>

            {/* Filters */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-5 flex gap-4 flex-wrap">
                <select
                    value={filters.status}
                    onChange={(e) => { setFilters((f) => ({ ...f, status: e.target.value })); setPage(1); }}
                    className="h-9 px-3 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white min-w-[180px]"
                >
                    {STATUS_OPTIONS.map((o) => (
                        <option key={o.value} value={o.value}>{o.label}</option>
                    ))}
                </select>
                <Button variant="outline" onClick={fetchRequests} className="flex items-center gap-1.5 ml-auto">
                    <RefreshCw className="w-4 h-4" /> Làm mới
                </Button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 text-slate-600">
                            <tr>
                                <th className="px-4 py-3 text-left font-semibold">Mã đơn</th>
                                <th className="px-4 py-3 text-left font-semibold">Loại đơn</th>
                                <th className="px-4 py-3 text-left font-semibold">Người được tạo đơn</th>
                                <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                                <th className="px-4 py-3 text-left font-semibold">Trạng thái</th>
                                <th className="px-4 py-3 text-left font-semibold">Ngày tạo</th>
                                <th className="px-4 py-3 text-right font-semibold">Thao tác</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : requests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <FileText className="w-12 h-12 mx-auto text-slate-200 mb-3" />
                                        <p className="text-slate-400 font-medium">Chưa có đơn từ nào</p>
                                        <p className="text-slate-300 text-xs mt-1">Nhấn "Tạo đơn mới" để bắt đầu</p>
                                    </td>
                                </tr>
                            ) : (
                                requests.map((req) => (
                                    <tr key={req.id} className="hover:bg-slate-50/60 transition-colors cursor-pointer" onClick={() => setSelectedRequest(req)}>
                                        <td className="px-4 py-3 font-mono text-xs text-blue-600 font-semibold">
                                            {req.requestCode || `#${req.id}`}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="font-medium text-slate-700">{req.requestType?.name}</div>
                                            <div className="text-xs text-slate-400">{req.requestGroup?.name}</div>
                                        </td>
                                        <td className="px-4 py-3 text-slate-700">{req.employee?.fullName}</td>
                                        <td className="px-4 py-3 text-slate-600 text-xs">
                                            {req.startDate} → {req.endDate}
                                        </td>
                                        <td className="px-4 py-3">
                                            <RequestStatusBadge status={req.status} />
                                        </td>
                                        <td className="px-4 py-3 text-slate-400 text-xs">
                                            {new Date(req.createdAt).toLocaleDateString("vi-VN")}
                                        </td>
                                        <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                                            {(req.status === "DRAFT" || req.status === "PENDING") && (
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => setConfirmCancel(req.id)}
                                                    className="text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    Hủy đơn
                                                </Button>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-500">
                        Hiển thị {requests.length} / Trang {page} của {totalPages}
                    </p>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
            </div>

            {/* Modals */}
            {showForm && (
                <RequestFormModal
                    isOpen={showForm}
                    requestId={editRequestId}
                    onClose={() => {
                        setShowForm(false);
                        setEditRequestId(null);
                    }}
                    onSuccess={fetchRequests}
                />
            )}

            {selectedRequest && (
                <RequestDetailModal
                    isOpen={!!selectedRequest}
                    request={selectedRequest}
                    onClose={() => setSelectedRequest(null)}
                    onRefresh={fetchRequests}
                    onEdit={(req) => {
                        setSelectedRequest(null);
                        setEditRequestId(req.id);
                        setShowForm(true);
                    }}
                />
            )}

            <ConfirmModal 
                isOpen={!!confirmCancel} 
                onClose={() => setConfirmCancel(null)}
                onConfirm={handleCancel}
                title="Xác nhận hủy đơn"
                description="Bạn có thực sự muốn hủy đơn này? Hành động này không thể hoàn tác."
                confirmText="Xác nhận hủy"
                cancelText="Quay lại"
                variant="destructive"
            />
        </div>
    );
}
