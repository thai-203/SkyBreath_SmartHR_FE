"use client";

import { useState, useEffect } from "react";
import { X, Clock, Calendar, AlertTriangle, CheckCircle, FileText } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { timesheetsService } from "@/services/timesheets.service";
import RequestDetailModal from "@/app/(protected)/requests/my-requests/components/RequestDetailModal";

const STATUS_LABELS = {
    X: { label: "Có mặt", color: "bg-emerald-100 text-emerald-700" },
    KL: { label: "Có mặt (Trừ công)", color: "bg-amber-100 text-amber-700" },
    ABSENT: { label: "Vắng mặt", color: "bg-rose-100 text-rose-700" },
    WEEKEND: { label: "Cuối tuần", color: "bg-slate-100 text-slate-500" },
    L: { label: "Ngày lễ", color: "bg-violet-100 text-violet-700" },
    P: { label: "Nghỉ phép", color: "bg-blue-100 text-blue-700" },
    CT: { label: "Công tác", color: "bg-indigo-100 text-indigo-700" },
};

/**
 * Popup hiển thị chi tiết 1 ô ngày công trong và cho HR sửa work_value.
 * Props:
 *   isOpen     – bool
 *   onClose    – fn()
 *   cell       – { recordId, date, checkIn, checkOut, lateMinutes, earlyLeaveMinutes,
 *                  attendanceStatus, workingHours, employeeName, employeeCode }
 *   canEdit    – bool (HR/ADMIN only)
 *   onSuccess  – fn() called after successful save (to reload matrix)
 */
export default function ProcessedRecordEditModal({ isOpen, onClose, cell, canEdit, onSuccess }) {
    const { success, error: toastError } = useToast();
    const [editValue, setEditValue] = useState("");
    const [note, setNote] = useState("");
    const [confirmOpen, setConfirmOpen] = useState(false);
    const [saving, setSaving] = useState(false);
    const [requestDetailOpen, setRequestDetailOpen] = useState(false);

    useEffect(() => {
        if (isOpen && cell) {
            setEditValue(cell.workingHours ?? "");
            setNote("");
            setRequestDetailOpen(false);
        }
    }, [isOpen, cell]);

    if (!isOpen || !cell) return null;

    const formatTime = (val) => {
        if (!val) return "—";
        const d = new Date(val);
        if (isNaN(d.getTime())) return String(val).substring(0, 5);
        return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
    };

    const formatShiftTime = (val) => {
        if (!val) return null;
        const s = String(val);
        return s.length >= 5 ? s.slice(0, 5) : s;
    };

    const statusInfo = STATUS_LABELS[cell.attendanceStatus] || { label: cell.attendanceStatus || "—", color: "bg-slate-100 text-slate-600" };
    const parsedValue = parseFloat(editValue);
    const isValueInvalid = isNaN(parsedValue) || parsedValue < 0 || parsedValue > 1;
    const isValueUnchanged = parsedValue === Number(cell.workingHours);
    const requestId = cell.requestId ?? cell.request_id ?? null;

    const handleSaveClick = () => {
        if (isValueInvalid || isValueUnchanged) return;
        setConfirmOpen(true);
    };

    const handleConfirmSave = async () => {
        setSaving(true);
        try {
            await timesheetsService.updateProcessedRecord(cell.recordId, {
                workValue: parsedValue,
                note: note.trim() || undefined,
            });
            success("Đã cập nhật ngày công thành công!");
            setConfirmOpen(false);
            onClose();
            onSuccess?.();
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi cập nhật ngày công");
        } finally {
            setSaving(false);
        }
    };

    return (
        <>
            {/* Backdrop */}
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
                <div
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="bg-gradient-to-r from-indigo-600 to-indigo-500 px-6 py-4 flex items-center justify-between">
                        <div>
                            <h2 className="text-white font-semibold text-lg">Chi tiết ngày công</h2>
                            <p className="text-indigo-200 text-sm mt-0.5">{cell.employeeName} · {cell.employeeCode}</p>
                        </div>
                        <button onClick={onClose} className="text-indigo-200 hover:text-white transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 space-y-5">
                        {/* Date & Status */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-slate-700 font-medium">
                                <Calendar className="h-4 w-4 text-indigo-500" />
                                <span>{cell.date}</span>
                            </div>
                            <span className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.color}`}>
                                {statusInfo.label}
                            </span>
                        </div>

                        {/* Check-in / Check-out */}
                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Giờ vào
                                </p>
                                <p className="text-slate-800 font-semibold text-base">{formatTime(cell.checkIn)}</p>
                            </div>
                            <div className="bg-slate-50 rounded-xl p-3 border border-slate-200">
                                <p className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                                    <Clock className="h-3.5 w-3.5" /> Giờ ra
                                </p>
                                <p className="text-slate-800 font-semibold text-base">{formatTime(cell.checkOut)}</p>
                            </div>
                        </div>

                        {/* Shift time */}
                        <div className="bg-slate-50 rounded-xl p-3 border border-slate-200 flex items-center justify-between">
                            <span className="text-sm text-slate-600 font-medium">Giờ ca</span>
                            <span className="text-slate-800 font-semibold">
                                {formatShiftTime(cell.shiftStartTime || cell.shift_start_time) && formatShiftTime(cell.shiftEndTime || cell.shift_end_time)
                                    ? `${formatShiftTime(cell.shiftStartTime || cell.shift_start_time)} – ${formatShiftTime(cell.shiftEndTime || cell.shift_end_time)}`
                                    : "08:00 – 17:00"}
                            </span>
                        </div>

                        {/* Late / Early */}
                        {(cell.lateMinutes > 0 || cell.earlyLeaveMinutes > 0) && (
                            <div className="grid grid-cols-2 gap-3">
                                {cell.lateMinutes > 0 && (
                                    <div className="bg-amber-50 rounded-xl p-3 border border-amber-200">
                                        <p className="text-xs text-amber-600 mb-1">Đi trễ</p>
                                        <p className="text-amber-700 font-semibold">{cell.lateMinutes} phút</p>
                                    </div>
                                )}
                                {cell.earlyLeaveMinutes > 0 && (
                                    <div className="bg-orange-50 rounded-xl p-3 border border-orange-200">
                                        <p className="text-xs text-orange-600 mb-1">Về sớm</p>
                                        <p className="text-orange-700 font-semibold">{cell.earlyLeaveMinutes} phút</p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Current work value */}
                        <div className="bg-teal-50 rounded-xl p-3 border border-teal-200 flex items-center justify-between">
                            <span className="text-sm text-teal-700 font-medium">Ngày công hiện tại</span>
                            <span className="text-teal-800 font-bold text-lg">{cell.workingHours ?? "—"}</span>
                        </div>

                        {/* Edit section (HR only) */}
                        {canEdit && cell.recordId && (
                            <div className="space-y-3 border-t border-slate-100 pt-4">
                                <p className="text-sm font-semibold text-slate-700">Chỉnh sửa ngày công</p>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Giá trị mới (0 – 1)</label>
                                    <Input
                                        type="number"
                                        min="0"
                                        max="1"
                                        step="0.0625"
                                        value={editValue}
                                        onChange={(e) => setEditValue(e.target.value)}
                                        placeholder="Ví dụ: 1, 0.9375, 0.5, 0"
                                        className={isValueInvalid && editValue !== "" ? "border-rose-400" : ""}
                                    />
                                    {isValueInvalid && editValue !== "" && (
                                        <p className="text-xs text-rose-500 mt-1 flex items-center gap-1">
                                            <AlertTriangle className="h-3 w-3" /> Giá trị phải nằm trong khoảng 0 – 1
                                        </p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs text-slate-500 mb-1">Lý do chỉnh sửa (tùy chọn)</label>
                                    <Input
                                        type="text"
                                        value={note}
                                        onChange={(e) => setNote(e.target.value)}
                                        placeholder="Nhập lý do..."
                                    />
                                </div>
                                <Button
                                    className="w-full gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
                                    onClick={handleSaveClick}
                                    disabled={isValueInvalid || isValueUnchanged}
                                >
                                    <CheckCircle className="h-4 w-4" />
                                    Lưu thay đổi
                                </Button>
                            </div>
                        )}

                        {!canEdit && (
                            <div className="text-center text-sm text-slate-400 pt-2">
                                Chỉ HR / Admin mới có thể chỉnh sửa ngày công
                            </div>
                        )}

                        {/* Requests section */}
                        <div className="border-t border-slate-100 pt-4 space-y-2">
                            <p className="text-sm font-semibold text-slate-700">Đơn từ</p>
                            {requestId ? (
                                <div className="flex items-center justify-between gap-3 bg-slate-50 rounded-xl p-3 border border-slate-200">
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-500">Request ID</p>
                                        <p className="text-sm font-semibold text-slate-800 truncate">#{requestId}</p>
                                    </div>
                                    <Button
                                        variant="outline"
                                        className="gap-2 shrink-0"
                                        onClick={() => setRequestDetailOpen(true)}
                                    >
                                        <FileText className="h-4 w-4" />
                                        Xem chi tiết
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">Không có đơn từ liên kết cho ngày này</p>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <RequestDetailModal
                isOpen={requestDetailOpen}
                request={requestId ? { id: requestId } : null}
                onClose={() => setRequestDetailOpen(false)}
            />

            {/* Confirmation dialog */}
            <ConfirmModal
                isOpen={confirmOpen}
                onClose={() => setConfirmOpen(false)}
                onConfirm={handleConfirmSave}
                loading={saving}
                title="Xác nhận chỉnh sửa ngày công"
                description={
                    `Bạn đang thay đổi ngày công ngày ${cell.date} của ${cell.employeeName} từ ` +
                    `${cell.workingHours} → ${editValue}. ` +
                    (note ? `Lý do: "${note}". ` : "") +
                    `Hành động này sẽ được ghi vào nhật ký. Xác nhận?`
                }
            />
        </>
    );
}
