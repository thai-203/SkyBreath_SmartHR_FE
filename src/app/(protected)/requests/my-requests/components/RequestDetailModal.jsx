"use client";

import { useState, useEffect } from "react";
import { X, Check, CheckCircle, XCircle, RotateCcw, FileText, Download, Clock, User } from "lucide-react";
import { requestsService } from "@/services/requests.service";
import { authService } from "@/services/auth.service";
import { useToast } from "@/components/common/Toast";
import RequestStatusBadge from "./RequestStatusBadge";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";

const LEVEL_STATUS_CONFIG = {
    PENDING:  { label: "Chờ duyệt",  color: "text-yellow-600 bg-yellow-50 border-yellow-200" },
    APPROVED: { label: "Đã duyệt",   color: "text-green-600 bg-green-50 border-green-200" },
    REJECTED: { label: "Từ chối",    color: "text-red-600 bg-red-50 border-red-200" },
    REVOKED:  { label: "Hủy duyệt",  color: "text-orange-600 bg-orange-50 border-orange-200" },
};

export default function RequestDetailModal({ isOpen, request: initialRequest, onClose, onRefresh, canApprove = false, onEdit }) {
    const { success, error: toastError } = useToast();
    const [request, setRequest] = useState(initialRequest);
    const [loading, setLoading] = useState(false);
    const [showRejectForm, setShowRejectForm] = useState(false);
    const [showRevokeForm, setShowRevokeForm] = useState({ show: false, levelOrder: null });
    const [showConfirmApprove, setShowConfirmApprove] = useState(false);
    const [comment, setComment] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [previewLevels, setPreviewLevels] = useState([]);
    const [currentEmployee, setCurrentEmployee] = useState(null);

    useEffect(() => {
        authService.getCurrentEmployeeByUserId().then(setCurrentEmployee);
    }, []);


    useEffect(() => {
        if (!isOpen || !initialRequest?.id) return;
        setLoading(true);
        requestsService.getById(initialRequest.id)
            .then(async (res) => {
                const data = res?.data;
                setRequest(data);
                
                // Fetch preview for DRAFT 
                if (data?.status === "DRAFT" && data.requestTypeId && data.employeeId) {
                    try {
                        const previewRes = await requestsService.getWorkflowPreview(data.requestTypeId, data.employeeId);
                        setPreviewLevels(previewRes?.data || []);
                    } catch (err) {
                        console.error("Lỗi lấy preview", err);
                    }
                }
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isOpen, initialRequest?.id]);

    const handleApprove = async () => {
        setSubmitting(true);
        try {
            await requestsService.approve(request.id);
            success("Phê duyệt thành công!");
            onRefresh?.();
            onClose();
        } catch (err) {
            toastError(err?.response?.data?.message || "Phê duyệt thất bại");
        } finally {
            setSubmitting(false);
            setShowConfirmApprove(false);
        }
    };

    const handleReject = async () => {
        if (!comment.trim()) {
            toastError("Vui lòng nhập lý do từ chối");
            return;
        }
        setSubmitting(true);
        try {
            await requestsService.reject(request.id, comment);
            success("Đã từ chối đơn");
            onRefresh?.();
            onClose();
        } catch (err) {
            toastError(err?.response?.data?.message || "Từ chối thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRevoke = async () => {
        setSubmitting(true);
        try {
            await requestsService.revoke(request.id, showRevokeForm.levelOrder, comment);
            success("Hủy duyệt thành công. Đơn đã quay lại cấp duyệt này.");
            onRefresh?.();
            onClose();
        } catch (err) {
            toastError(err?.response?.data?.message || "Hủy duyệt thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    let levels = request?.approvalLevels || [];
    const attachments = request?.attachments || [];
    let isPreview = false;

    if (request?.status === "DRAFT" && levels.length === 0 && previewLevels.length > 0) {
        isPreview = true;
        levels = previewLevels.map((p) => ({
            id: p.levelOrder, // temporary key
            levelOrder: p.levelOrder,
            levelName: p.levelName,
            status: "PENDING",
            approver: p.approverEmployee ? { fullName: p.approverEmployee.fullName, avatar: p.approverEmployee.avatar } : null
        }));
    }

    const myCurrentLevel = levels.find(l => l.approverEmployeeId === currentEmployee?.id && l.levelOrder === request?.currentApprovalLevel);
    const isMyTurn = !!myCurrentLevel && myCurrentLevel.status === "PENDING" && request?.status === "PENDING";


    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
            <div className="relative z-10 bg-white text-slate-900 rounded-2xl shadow-2xl w-full max-w-4xl mx-4 max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
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
                                <InfoRow label="Từ (Bắt đầu)" value={`${request?.startDate || "—"} ${request?.startTime || ""}`} />
                                <InfoRow label="Đến (Kết thúc)" value={`${request?.endDate || "—"} ${request?.endTime || ""}`} />
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
                                        {attachments.map((att) => {
                                            const isImage = att.fileName?.match(/\.(jpg|jpeg|png|gif)$/i) || att.filePath?.match(/\.(jpg|jpeg|png|gif)$/i);
                                            const fileUrl = att.filePath.startsWith('http') ? att.filePath : `http://localhost:3000/${att.filePath}`;
                                            return (
                                            <div key={att.id} className="flex flex-col gap-2 p-2 bg-slate-50 rounded-lg border border-slate-200 hover:bg-blue-50 transition-colors">
                                                <a
                                                    href={fileUrl}
                                                    target="_blank"
                                                    rel="noreferrer"
                                                    className="flex items-center gap-3 px-1"
                                                >
                                                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                                    <span className="text-sm text-slate-700 flex-1 truncate hover:underline">{att.fileName}</span>
                                                    <Download className="w-4 h-4 text-slate-400" />
                                                </a>
                                                {isImage && (
                                                    <div className="mt-1 rounded overflow-hidden max-w-full sm:max-w-[400px] border border-slate-200 bg-white">
                                                        <img src={fileUrl} alt={att.fileName} className="w-full h-auto object-contain max-h-[300px]" />
                                                    </div>
                                                )}
                                            </div>
                                        )})}
                                    </div>
                                </div>
                            )}

                            {/* Lịch sử cấp duyệt */}
                            {levels.length > 0 && (
                                <div>
                                    <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                                        {isPreview ? "Dự kiến cấp duyệt" : "Thông tin cấp duyệt"}
                                    </p>
                                    <div className="flex items-start gap-8 mt-2 overflow-x-auto pb-4">
                                        {levels.map((level, idx) => {
                                            const isApproved = level.status === "APPROVED";
                                            const isRejected = level.status === "REJECTED";
                                            
                                            // Lấy chữ cái đầu của tên nếu không có avatar
                                            const initials = level.approver?.fullName 
                                                ? level.approver.fullName.split(' ').pop().charAt(0).toUpperCase() 
                                                : "?";

                                            return (
                                                <div key={level.id} className="relative flex flex-col min-w-[200px]">
                                                    {/* Header: Status Icon + Level Name */}
                                                    <div className="flex items-center gap-2 mb-3">
                                                        {isApproved ? (
                                                            <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0">
                                                                <Check className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        ) : isRejected ? (
                                                            <div className="w-5 h-5 rounded-full bg-red-500 flex items-center justify-center shrink-0">
                                                                <X className="w-3.5 h-3.5 text-white" />
                                                            </div>
                                                        ) : (
                                                            <div className="w-5 h-5 rounded-full bg-slate-200 shrink-0" />
                                                        )}
                                                        <span className="font-semibold text-slate-800 text-sm whitespace-nowrap">
                                                            {level.levelName}
                                                        </span>
                                                    </div>

                                                    {/* Approver Info */}
                                                    <div className="flex items-center gap-3 pl-7">
                                                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center shrink-0 overflow-hidden border border-slate-200">
                                                            {level.approver?.avatar ? (
                                                                <img src={level.approver.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                            ) : (
                                                                <span className="text-xs font-medium text-slate-500">{initials}</span>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm text-slate-700">{level.approver?.fullName || "Chưa cập nhật"}</p>
                                                            {level.actionedAt && (
                                                                <p className="text-[11px] text-slate-400 mt-0.5">
                                                                    {new Date(level.actionedAt).toLocaleString("vi-VN")}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>

                                                    {/* Comment & Actions */}
                                                    {(level.comment || (isApproved && canApprove && level.approverEmployeeId === currentEmployee?.id)) && (
                                                        <div className="mt-3 pl-7 space-y-2">
                                                            {level.comment && (
                                                                <p className="text-xs italic bg-slate-50 p-2 rounded border border-slate-100 text-slate-600">
                                                                    "{level.comment}"
                                                                </p>
                                                            )}
                                                            {isApproved && canApprove && level.approverEmployeeId === currentEmployee?.id && request?.status === "PENDING" && (
                                                                <button
                                                                    onClick={() => setShowRevokeForm({ show: true, levelOrder: level.levelOrder })}
                                                                    className="text-xs text-orange-600 hover:text-orange-700 underline font-medium"
                                                                >
                                                                    Hủy duyệt cấp này
                                                                </button>
                                                            )}
                                                        </div>
                                                    )}


                                                    {/* Line connecting to next item (pseudo-element style) */}
                                                    {idx < levels.length - 1 && (
                                                        <div className="absolute top-[9px] left-[100%] w-6 h-[2px] bg-slate-100 -ml-4" />
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

                {/* Footer actions */}
                {((canApprove && request?.status === "PENDING") || (request?.status === "DRAFT" && onEdit)) && (
                    <div className="shrink-0 border-t px-6 py-4 bg-slate-50 space-y-3">
                        {request?.status === "DRAFT" && onEdit && (
                            <div className="flex justify-end gap-3">
                                <Button
                                    onClick={() => onEdit(request)}
                                >
                                    Sửa & Gửi duyệt
                                </Button>
                            </div>
                        )}
                        {canApprove && request?.status === "PENDING" && (
                            showRejectForm ? (
                            <div className="space-y-3">
                                <textarea
                                    placeholder="Nhập lý do từ chối..."
                                    value={comment}
                                    onChange={(e) => setComment(e.target.value)}
                                    rows={2}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white text-slate-900"
                                />
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRejectForm(false)}
                                    >
                                        Huỷ
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={handleReject}
                                        loading={submitting}
                                    >
                                        Xác nhận từ chối
                                    </Button>
                                </div>
                            </div>
                        ) : showRevokeForm.show ? (
                            <div className="space-y-3">
                                <p className="text-sm text-orange-700 font-medium">Bạn có chắc chắn muốn hủy quyết định phê duyệt cấp {showRevokeForm.levelOrder}?</p>
                                <p className="text-xs text-orange-600/80">Đơn sẽ quay lại trạng thái chờ bạn xử lý từ đầu.</p>
                                <div className="flex gap-2 justify-end">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowRevokeForm({ show: false, levelOrder: null })}
                                    >
                                        Huỷ
                                    </Button>
                                    <Button
                                        onClick={handleRevoke}
                                        loading={submitting}
                                        className="bg-orange-500 hover:bg-orange-600 shadow-orange-500/20"
                                    >
                                        Xác nhận hủy duyệt
                                    </Button>
                                </div>
                            </div>
                        ) : isMyTurn ? (
                            <div className="flex gap-3 justify-end">
                                <Button
                                    variant="outline"
                                    onClick={() => setShowRejectForm(true)}
                                    className="text-red-600 border-red-200 hover:bg-red-50"
                                >
                                    <XCircle className="w-4 h-4 mr-2" /> Từ chối
                                </Button>
                                <Button
                                    variant="success"
                                    onClick={() => setShowConfirmApprove(true)}
                                    loading={submitting}
                                >
                                    <CheckCircle className="w-4 h-4 mr-2" /> Phê duyệt
                                </Button>
                            </div>
                        ) : (
                            <div className="flex justify-end italic text-xs text-slate-400 py-2">
                                Bạn đã xử lý đơn này hoặc chưa đến cấp duyệt của bạn.
                            </div>
                        ))}

                    </div>
                )}
            </div>

            <ConfirmModal 
                isOpen={showConfirmApprove} 
                onClose={() => setShowConfirmApprove(false)}
                onConfirm={handleApprove}
                title="Xác nhận phê duyệt"
                description="Bạn có chắc chắn muốn phê duyệt đơn này không? Hành động này sẽ chuyển đơn sang cấp tiếp theo (nếu có) hoặc hoàn tất đơn."
                confirmText="Phê duyệt"
                cancelText="Quay lại"
                variant="success"
            />
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
