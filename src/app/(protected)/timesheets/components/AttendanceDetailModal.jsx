"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Lock, Unlock, Pencil, X, Check } from "lucide-react";

const dayStatusColors = {
    PRESENT: "bg-emerald-50 text-emerald-700",
    ABSENT: "bg-rose-50 text-rose-700",
    WEEKEND: "bg-slate-100 text-slate-500",
    HOLIDAY: "bg-blue-50 text-blue-700",
    LEAVE: "bg-purple-50 text-purple-700",
    UNPAID_LEAVE: "bg-orange-50 text-orange-700",
};

const dayStatusLabels = {
    PRESENT: "Có mặt",
    ABSENT: "Vắng",
    WEEKEND: "Cuối tuần",
    HOLIDAY: "Nghỉ lễ",
    LEAVE: "Nghỉ phép có lương",
    UNPAID_LEAVE: "Nghỉ không lương",
};

const attendanceStatusColors = {
    ON_TIME: "bg-emerald-50 text-emerald-700",
    LATE: "bg-amber-50 text-amber-500",
    EARLY_LEAVE: "bg-orange-50 text-orange-500",
    LATE_AND_EARLY_LEAVE: "bg-rose-50 text-rose-500",
};

const attendanceStatusLabels = {
    ON_TIME: "Đúng giờ",
    LATE: "Đi trễ",
    EARLY_LEAVE: "Về sớm",
    LATE_AND_EARLY_LEAVE: "Trễ & Về sớm",
};

export default function AttendanceDetailModal({
    isOpen,
    onClose,
    data,
    onUpdate,   // async (id, { totalWorkingDays, totalWorkingHours, overtimeHours, editReason }) => void
    onLock,     // async (timesheetId) => void
    onUnlock,   // async (timesheetId) => void
    canEdit = false, // HR/Admin only
}) {
    const [editMode, setEditMode] = useState(false);
    const [editData, setEditData] = useState(null);
    const [saving, setSaving] = useState(false);
    const [locking, setLocking] = useState(false);

    // Reset edit mode when modal opens/closes or data changes
    useEffect(() => {
        if (!isOpen) {
            setEditMode(false);
            setEditData(null);
        }
    }, [isOpen]);

    useEffect(() => {
        if (data?.timesheet) {
            setEditData({
                totalWorkingDays: data.timesheet.totalWorkingDays ?? 0,
                totalWorkingHours: data.timesheet.totalWorkingHours ?? 0,
                overtimeHours: data.timesheet.overtimeHours ?? 0,
                editReason: "",
            });
        }
    }, [data]);

    if (!data) return null;

    const { timesheet, dailyDetails, summary } = data;
    const isLocked = timesheet?.isLocked;

    const handleSave = async () => {
        if (!onUpdate) return;
        setSaving(true);
        try {
            await onUpdate(timesheet.id, editData);
            setEditMode(false);
        } finally {
            setSaving(false);
        }
    };

    const handleLockToggle = async () => {
        setLocking(true);
        try {
            if (isLocked) {
                await onUnlock?.(timesheet.id);
            } else {
                await onLock?.(timesheet.id);
            }
        } finally {
            setLocking(false);
        }
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết chấm công" size="3xl">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <SummaryCard label="Có mặt" value={summary?.presentDays ?? 0} color="text-emerald-600" />
                <SummaryCard label="Vắng" value={summary?.absentDays ?? 0} color="text-rose-600" />
                <SummaryCard label="Đi trễ" value={summary?.lateDays ?? 0} color="text-amber-600" />
                <SummaryCard label="Về sớm" value={summary?.earlyLeaveDays ?? 0} color="text-orange-600" />
            </div>

            {/* Employee Info + actions */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                <div className="space-y-1">
                    <p className="text-sm text-slate-600">
                        <span className="font-medium">Nhân viên:</span>{" "}
                        {timesheet?.employee?.fullName} ({timesheet?.employee?.employeeCode})
                    </p>
                    <p className="text-sm text-slate-600">
                        <span className="font-medium">Kỳ:</span>{" "}
                        Tháng {timesheet?.month}/{timesheet?.year}
                    </p>
                    {timesheet?.shiftName && (
                        <p className="text-sm text-slate-600">
                            <span className="font-medium">Ca:</span>{" "}
                            {timesheet.shiftName}
                            {timesheet.shiftStartTime && timesheet.shiftEndTime && (
                                <span className="ml-1 text-slate-400">({timesheet.shiftStartTime} – {timesheet.shiftEndTime})</span>
                            )}
                        </p>
                    )}
                    {/* Lock status badge */}
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                        isLocked ? "bg-rose-50 text-rose-600 border border-rose-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"
                    }`}>
                        {isLocked ? <Lock className="h-3 w-3" /> : <Unlock className="h-3 w-3" />}
                        {isLocked ? "Đã khóa" : "Đang mở"}
                    </span>
                </div>

                {/* Action buttons (HR only) */}
                {canEdit && (
                    <div className="flex items-center gap-2 flex-shrink-0">
                        {!isLocked && !editMode && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-indigo-600 border-indigo-200 hover:bg-indigo-50"
                                onClick={() => setEditMode(true)}
                            >
                                <Pencil className="h-3.5 w-3.5" />
                                Chỉnh sửa
                            </Button>
                        )}
                        {editMode && (
                            <Button
                                size="sm"
                                variant="outline"
                                className="gap-1.5 text-slate-500 border-slate-200"
                                onClick={() => setEditMode(false)}
                                disabled={saving}
                            >
                                <X className="h-3.5 w-3.5" />
                                Hủy
                            </Button>
                        )}
                        <Button
                            size="sm"
                            variant="outline"
                            loading={locking}
                            onClick={handleLockToggle}
                            className={`gap-1.5 ${isLocked
                                ? "text-amber-600 border-amber-200 hover:bg-amber-50"
                                : "text-rose-600 border-rose-200 hover:bg-rose-50"
                            }`}
                        >
                            {isLocked ? <Unlock className="h-3.5 w-3.5" /> : <Lock className="h-3.5 w-3.5" />}
                            {isLocked ? "Mở khóa" : "Khóa"}
                        </Button>
                    </div>
                )}
            </div>

            {/* Inline edit form (shown when editMode = true) */}
            {editMode && editData && (
                <div className="mb-4 p-4 border border-indigo-200 bg-indigo-50/50 rounded-lg">
                    <p className="text-sm font-medium text-indigo-800 mb-3">Chỉnh sửa tổng hợp tháng</p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Ngày công</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editData.totalWorkingDays}
                                onChange={e => setEditData(d => ({ ...d, totalWorkingDays: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Giờ công</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editData.totalWorkingHours}
                                onChange={e => setEditData(d => ({ ...d, totalWorkingHours: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-slate-600 mb-1">Giờ OT</label>
                            <input
                                type="number"
                                step="0.5"
                                min="0"
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                                value={editData.overtimeHours}
                                onChange={e => setEditData(d => ({ ...d, overtimeHours: parseFloat(e.target.value) || 0 }))}
                            />
                        </div>
                    </div>
                    <div className="mb-3">
                        <label className="block text-xs font-medium text-slate-600 mb-1">
                            Lý do chỉnh sửa <span className="text-slate-400 font-normal">(tùy chọn)</span>
                        </label>
                        <textarea
                            rows={2}
                            placeholder="Ví dụ: điều chỉnh do máy chấm công lỗi ngày 15..."
                            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm text-slate-900 bg-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            value={editData.editReason}
                            onChange={e => setEditData(d => ({ ...d, editReason: e.target.value }))}
                        />
                    </div>
                    <div className="flex justify-end">
                        <Button size="sm" onClick={handleSave} loading={saving} className="gap-1.5">
                            <Check className="h-3.5 w-3.5" />
                            Lưu thay đổi
                        </Button>
                    </div>
                </div>
            )}

            {/* Totals summary row */}
            <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Ngày công</p>
                    <p className="text-lg font-bold text-slate-800">{timesheet?.totalWorkingDays ?? 0}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Giờ công</p>
                    <p className="text-lg font-bold text-slate-800">{timesheet?.totalWorkingHours ?? 0}</p>
                </div>
                <div className="p-3 bg-white border border-slate-200 rounded-lg">
                    <p className="text-xs text-slate-500 mb-0.5">Giờ OT</p>
                    <p className="text-lg font-bold text-blue-600">{timesheet?.overtimeHours ?? 0}</p>
                </div>
            </div>

            {/* Daily Details Table */}
            <div className="max-h-[45vh] overflow-y-auto rounded-lg border border-slate-200">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Ngày</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Thứ</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Ca</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Giờ ca</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Vào</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Ra</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Ngày công</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Giờ</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Trễ (p)</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Sớm (p)</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">OT</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(dailyDetails || []).map((day, idx) => (
                            <tr
                                key={idx}
                                className={`border-b border-slate-100 ${
                                    day.status === "WEEKEND" || day.status === "HOLIDAY"
                                        ? "bg-slate-50/50"
                                        : ""
                                }`}
                            >
                                <td className="px-3 py-2 text-slate-700 whitespace-nowrap">{day.date}</td>
                                <td className="px-3 py-2 text-slate-500">{day.dayOfWeek}</td>
                                <td className="px-3 py-2 text-xs text-slate-500">{day.shiftName || '-'}</td>
                                <td className="px-3 py-2 text-xs text-slate-500 whitespace-nowrap">
                                    {day.shiftStartTime && day.shiftEndTime
                                        ? `${day.shiftStartTime}–${day.shiftEndTime}`
                                        : '-'}
                                </td>
                                <td className="px-3 py-2 text-slate-700">{day.checkIn || day.check_in || "-"}</td>
                                <td className="px-3 py-2 text-slate-700">{day.checkOut || day.check_out || "-"}</td>
                                <td className="px-3 py-2 font-medium text-slate-700">{day.workingDayValue || day.working_day_value || "-"}</td>
                                <td className="px-3 py-2 font-medium text-slate-600">{day.workingHours || day.working_hours || "-"}</td>
                                <td className="px-3 py-2 text-slate-700">
                                    {day.lateMinutes > 0 ? (
                                        <span className="text-amber-600 font-medium">{day.lateMinutes}</span>
                                    ) : "-"}
                                </td>
                                <td className="px-3 py-2 text-slate-700">
                                    {day.earlyLeaveMinutes > 0 ? (
                                        <span className="text-orange-600 font-medium">{day.earlyLeaveMinutes}</span>
                                    ) : "-"}
                                </td>
                                <td className="px-3 py-2 text-slate-700">
                                    {day.overtimeHours > 0 ? (
                                        <span className="text-blue-600 font-medium">{day.overtimeHours}</span>
                                    ) : "-"}
                                </td>
                                <td className="px-3 py-2">
                                    <div className="flex flex-col gap-1 items-start">
                                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium leading-none ${dayStatusColors[day.status] || ""}`}>
                                            {dayStatusLabels[day.status] || day.status}
                                        </span>
                                        {day.attendanceStatus && (
                                            <span className={`px-2 py-0.5 rounded-full text-[11px] font-medium leading-none ${attendanceStatusColors[day.attendanceStatus] || "bg-slate-100 text-slate-700"}`}>
                                                {attendanceStatusLabels[day.attendanceStatus] || day.attendanceStatus}
                                            </span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Modal>
    );
}

function SummaryCard({ label, value, color }) {
    return (
        <div className="p-3 bg-white border border-slate-200 rounded-lg text-center">
            <p className={`text-2xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-1">{label}</p>
        </div>
    );
}
