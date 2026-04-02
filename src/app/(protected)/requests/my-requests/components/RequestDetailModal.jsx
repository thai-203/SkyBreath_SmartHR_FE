"use client";

import { useState, useEffect } from "react";
import { X, CheckCircle, XCircle, RotateCcw, FileText, Download, Clock, User } from "lucide-react";
import { requestsService } from "@/services/requests.service";
import { toast } from "sonner";
import RequestStatusBadge from "./RequestStatusBadge";

const LEVEL_STATUS_CONFIG = {
    PENDING:  { label: "Chờ duyệt",  color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    APPROVED: { label: "Đã duyệt",   color: "text-green-600 bg-green-50 border-green-200" },
    REJECTED: { label: "Từ chối",    color: "text-red-600 bg-red-50 border-red-200" },
    REVOKED:  { label: "Hủy duyệt",  color: "text-orange-600 bg-orange-50 border-orange-200" },
};

export default function RequestDetailModal({ isOpen, request: initialRequest, onClose, onRefresh, canApprove = false }) {
    const [request, setRequest] = useState(initialRequest);
    const [loading, setLoading] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showRevokeForm, setShowRevokeForm] = useState({ show: false, levelOrder: null });
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);

    useEffect(() => {
        if (!isOpen || !initialRequest?.id) return;
        setLoading(true);
        requestsService.getById(initialRequest.id)
            .then((res) => setRequest(res?.data))
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isOpen, initialRequest?.id]);

    const handleApprove = async () => {
        if (!confirm("Xác nhận phê duyệt đơn này?")) return;
        setSubmitting(true);
        try {
            await requestsService.approve(request.id);
            toast.success("Phê duyệt thành công!");
            onRefresh?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Phê duyệt thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            toast.error("Vui lòng nhập lý do từ chối");
            return;
        }
        setSubmitting(true);
        try {
            await requestsService.reject(request.id, comment);
            toast.success("Đã từ chối đơn");
            onRefresh?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Từ chối thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async () => {
        setSubmitting(true);
        try {
            await requestsService.revoke(request.id, showRevokeForm.levelOrder, comment);
            toast.success("Hủy duyệt thành công. Đơn đã quay lại cấp duyệt này.");
            onRefresh?.();
            onClose();
        } catch (err) {
            toast.error(err?.response?.data?.message || "Hủy duyệt thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const levels = request?.approvalLevels || [];
    const attachments = request?.attachments || [];

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50 shrink-0">
                    <div>
                        <h2 className="text-lg font-bold text-slate-800">Chi Tiết Đơn Từ</h2>
                        {request?.requestCode && (
                            <p className="text-xs font-mono text-blue-600 mt-0.5">{request.requestCode}</p>
                        )}
                    </div>
                    <div className="flex items-center gap-3">
                        {request?.status && <RequestStatusBadge status={request.status} />}
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {loading ? (
                        <div className="text-center py-10 text-slate-400">Đang tải...</div>
                    ) : (
                        <>
                            {/* Thông tin đơn */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <InfoRow label="Người được tạo đơn" value={request?.employee?.fullName} />
                                <InfoRow label="Loại đơn" value={request?.requestType?.name} />
                                <InfoRow label="Nhóm đơn" value={request?.requestGroup?.name} />
                                <InfoRow label="Tính công" value={request?.isWorkedTime ? "Có" : "Không"} />
                                <InfoRow
                                    label="Thời gian"
                                    value={
                                        request?.startDate && request?.endDate
                                            ? `${request.startDate}${request.startTime ? " " + request.startTime : ""} → ${request.endDate}${request.endTime ? " " + request.endTime : ""}`
                                            : "—"
                                    }
                                />
                                <InfoRow label="Ngày gửi duyệt" value={request?.submittedAt ? new Date(request.submittedAt).toLocaleString("vi-VN") : "Chưa gửi"} />
                            </div>

                            {request?.description && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1">Mô tả</p>
                                    <p className="text-sm text-slate-700 bg-slate-50 rounded-lg px-4 py-3">{request.description}</p>
                                </div>
                            )}

                            {/* Tài liệu đính kèm */}
                            {attachments.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">Tài liệu đính kèm</p>
                                    <div className="space-y-2">
                                        {attachments.map((att) => (
                                            <a
                                                key={att.id}
                                                href={`/${att.filePath}`}
                                                target="_blank"
                                                rel="noreferrer"
                                                className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-blue-50 hover:border-blue-200 transition-colors"
                                            >
                                                <FileText className="w-4 h-4 text-blue-500" />
                                                <span className="text-sm text-slate-700 flex-1 truncate">{att.fileName}</span>
                                                <Download className="w-4 h-4 text-slate-400" />
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {/* Lịch sử cấp duyệt */}
                            {levels.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Thông tin cấp duyệt</p>
                                    <div className="space-y-2">
                                        {levels.map((level) => {
                                            const cfg = LEVEL_STATUS_CONFIG[level.status] || LEVEL_STATUS_CONFIG.PENDING;
                                            const isApproved = level.status === "APPROVED";
                                            return (
                                                <div key={level.id} className={`rounded-xl border px-4 py-3 ${cfg.color}`}>
                                                    <div className="flex items-center justify-between">
                                                        <div>
                                                            <p className="font-semibold text-sm">
                                                                Cấp {level.levelOrder}: {level.levelName}
                                                            </p>
                                                            <p className="text-xs mt-0.5 flex items-center gap-1">
                                                                <User className="w-3 h-3" />
                                                                {level.approver?.fullName || "Chưa xác định"}
                                                            </p>
                                                        </div>
                                                        <div className="text-right">
                                                            <span className="text-xs font-semibold">{cfg.label}</span>
                                                            {level.actionedAt && (
                                                                <p className="text-xs opacity-70 mt-0.5">
                                                                    {new Date(level.actionedAt).toLocaleString("vi-VN")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                    {level.comment && (
                                                        <p className="text-xs mt-2 italic opacity-80">"{level.comment}"</p>
                                                    )}
                                                    {/* Nút hủy duyệt nếu cấp đã APPROVED */}
                                                    {isApproved && canApprove && (
                                                        <button
                                                            onClick={() => setShowRevokeForm({ show: true, levelOrder: level.levelOrder })}
                                                            className="mt-2 text-xs underline opacity-70 hover:opacity-100"
                                                        >
                                                            Hủy duyệt cấp này
                                                        </button>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer actions — chỉ hiển thị nếu canApprove và đơn PENDING */}
                {canApprove && request?.status === "PENDING" && (
                    <div className="shrink-0 border-t px-6 py-4 bg-slate-50 space-y-3">
                        {showRejectForm ? (
                            <div className="space-y-3">
                                <textarea
                                    placeholder="Nhập lý do từ chối..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setShowRejectForm(false)}
                                        className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                                    >
                                        Huỷ
                                    </button>
                                    <button
                                        onClick={handleReject}
                                        disabled={submitting}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 disabled:opacity-50"
                                    >
                                        Xác nhận từ chối
                                    </button>
                                </div>
                            </div>
                        ) : showRevokeForm.show ? (
                            <div className="space-y-3">
                                <p className="text-sm text-orange-700 font-medium">Hủy duyệt cấp {showRevokeForm.levelOrder}?</p>
                                <textarea
                                    placeholder="Lý do hủy duyệt (tùy chọn)..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-300 resize-none"
                                />
                                <div className="flex gap-2 justify-end">
                                    <button
                                        onClick={() => setShowRevokeForm({ show: false, levelOrder: null })}
                                        className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-100"
                                    >
                                        Huỷ
                                    </button>
                                    <button
                                        onClick={handleRevoke}
                                        disabled={submitting}
                                        className="px-4 py-2 text-sm font-semibold text-white bg-orange-600 rounded-lg hover:bg-orange-700 disabled:opacity-50"
                                    >
                                        Xác nhận hủy duyệt
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex gap-3 justify-end">
                                <button
                                    onClick={() => setShowRejectForm(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-red-700 bg-red-50 border border-red-200 rounded-xl hover:bg-red-100 transition-colors"
                                >
                                    <XCircle className="w-4 h-4" /> Từ chối
                                </button>
                                <button
                                    onClick={handleApprove}
                                    disabled={submitting}
                                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-green-600 rounded-xl hover:bg-green-700 transition-colors disabled:opacity-50"
                                >
                                    <CheckCircle className="w-4 h-4" /> Phê duyệt
                                </button>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div>
            <p className="text-xs text-slate-400 font-medium mb-0.5">{label}</p>
            <p className="text-slate-700 font-medium">{value || "—"}</p>
        </div>
    );
}
