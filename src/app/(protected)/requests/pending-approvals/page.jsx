"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, RefreshCw, FileText, CheckCircle, XCircle } from "lucide-react";
import { requestsService } from "@/services/requests.service";
import { authService } from "@/services/auth.service";
import { useToast } from "@/components/common/Toast";
import RequestStatusBadge from "../my-requests/components/RequestStatusBadge";
import RequestDetailModal from "../my-requests/components/RequestDetailModal";
import { Pagination } from "@/components/common/Pagination";
import { cn } from "@/lib/utils";


export default function PendingApprovalsPage() {
    const { success, error: toastError } = useToast();
    const [requests, setRequests] = useState([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [filter, setFilter] = useState("ALL"); // ALL, WAITING, APPROVED
    const [currentEmployee, setCurrentEmployee] = useState(null);
    const limit = 10;

    const [selectedRequest, setSelectedRequest] = useState(null);

    useEffect(() => {
        authService.getCurrentEmployeeByUserId().then(setCurrentEmployee);
    }, []);


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

    // 🔔 Real-time: Lắng nghe socket events
    useEffect(() => {
        const handleRemovePending = (e) => {
            const { requestId } = e.detail || {};
            if (requestId) {
                setRequests((prev) => prev.filter((r) => r.id !== requestId));
                setTotal((prev) => Math.max(0, prev - 1));
            }
        };

        const handleNewNotification = (e) => {
            const data = e.detail || {};
            // Nếu thông báo liên quan tới trang pending-approvals → refresh
            if (data.link === "/requests/pending-approvals") {
                fetchRequests();
            }
        };

        window.addEventListener("socket:remove-pending-request", handleRemovePending);
        window.addEventListener("socket:new-notification", handleNewNotification);
        return () => {
            window.removeEventListener("socket:remove-pending-request", handleRemovePending);
            window.removeEventListener("socket:new-notification", handleNewNotification);
        };
    }, [fetchRequests]);

    const filterRequests = (items) => {
        if (!currentEmployee) return items;
        if (filter === "WAITING") {
            return items.filter(req => {
                const myLevel = req.approvalLevels?.find(l => l.approverEmployeeId === currentEmployee.id);
                return myLevel && myLevel.status === "PENDING" && req.currentApprovalLevel === myLevel.levelOrder;
            });
        }
        if (filter === "APPROVED") {
            return items.filter(req => {
                const myLevel = req.approvalLevels?.find(l => l.approverEmployeeId === currentEmployee.id);
                return myLevel && myLevel.status === "APPROVED";
            });
        }
        return items;
    };

    const displayRequests = filterRequests(requests);
    const totalPages = Math.ceil(total / limit);


    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800">Đơn Cần Phê Duyệt</h1>
                    <p className="text-sm text-slate-500 mt-0.5">Danh sách các đơn từ đang chờ bạn phê duyệt</p>
                </div>
            </div>

            {/* Tabs & Refresh */}
            <div className="flex items-center justify-between mb-5 bg-white p-2 rounded-xl border border-slate-200 shadow-sm">
                <div className="flex p-1 bg-slate-100 rounded-lg">
                    {[
                        { id: "ALL", label: "Tất cả" },
                        { id: "WAITING", label: "Chờ tôi duyệt" },
                        { id: "APPROVED", label: "Tôi đã duyệt" },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setFilter(tab.id)}
                            className={cn(
                                "px-4 py-1.5 text-sm font-medium rounded-md transition-all",
                                filter === tab.id
                                    ? "bg-white text-blue-600 shadow-sm"
                                    : "text-slate-500 hover:text-slate-700 hover:bg-slate-200/50"
                            )}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
                <button
                    onClick={fetchRequests}
                    className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                >
                    <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} /> Làm mới
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
                                <th className="px-4 py-3 text-left font-semibold">Trạng thái của tôi</th>
                                <th className="px-4 py-3 text-left font-semibold">Thời gian</th>
                                <th className="px-4 py-3 text-left font-semibold">Ngày gửi</th>
                                <th className="px-4 py-3 text-right font-semibold">Thao tác</th>

                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 text-slate-900">
                            {loading ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16 text-slate-400">
                                        <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Đang tải...
                                    </td>
                                </tr>
                            ) : displayRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="text-center py-16">
                                        <CheckCircle className="w-12 h-12 mx-auto text-green-200 mb-3" />
                                        <p className="text-slate-400 font-medium whitespace-pre-line">
                                            {filter === "ALL" ? "Tuyệt vời! Không có đơn nào cần xử lý" : 
                                             filter === "WAITING" ? "Không có đơn nào đang chờ bạn duyệt" : 
                                             "Bạn chưa phê duyệt đơn nào"}
                                        </p>
                                    </td>
                                </tr>
                            ) : (
                                displayRequests.map((req) => {
                                    const myLevel = req.approvalLevels?.find(l => l.approverEmployeeId === currentEmployee?.id);
                                    const isMyTurn = myLevel && myLevel.status === "PENDING" && req.currentApprovalLevel === myLevel.levelOrder;
                                    const isAlreadyApproved = myLevel && myLevel.status === "APPROVED";
                                    
                                    return (
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
                                            <td className="px-4 py-3">
                                                {isMyTurn ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-amber-100 text-amber-800 border border-amber-200">
                                                        Chờ bạn duyệt
                                                    </span>
                                                ) : isAlreadyApproved ? (
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                        Bạn đã duyệt
                                                    </span>
                                                ) : (
                                                    <span className="text-xs text-slate-400 italic">Chưa đến cấp</span>
                                                )}
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
                                                    {isMyTurn ? "Duyệt đơn" : "Xem chi tiết"}
                                                </button>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>

                    </table>
                </div>

                {/* Pagination */}
                <div className="flex items-center justify-between border-t border-slate-200 px-4 py-3">
                    <p className="text-sm text-slate-500">
                        Hiển thị {displayRequests.length} / Trang {page} của {Math.max(totalPages, 1)}
                    </p>
                    <Pagination
                        currentPage={page}
                        totalPages={totalPages}
                        onPageChange={setPage}
                    />
                </div>
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
