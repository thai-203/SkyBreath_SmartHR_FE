"use client";

import { Modal } from "@/components/common/Modal";

const dayStatusColors = {
    PRESENT: "bg-emerald-50 text-emerald-700",
    ABSENT: "bg-rose-50 text-rose-700",
    WEEKEND: "bg-slate-100 text-slate-500",
    HOLIDAY: "bg-blue-50 text-blue-700",
};

const dayStatusLabels = {
    PRESENT: "Có mặt",
    ABSENT: "Vắng",
    WEEKEND: "Cuối tuần",
    HOLIDAY: "Nghỉ lễ",
};

export default function AttendanceDetailModal({ isOpen, onClose, data }) {
    if (!data) return null;

    const { timesheet, dailyDetails, summary } = data;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết chấm công" size="xl">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                <SummaryCard label="Có mặt" value={summary?.presentDays ?? 0} color="text-emerald-600" />
                <SummaryCard label="Vắng" value={summary?.absentDays ?? 0} color="text-rose-600" />
                <SummaryCard label="Đi trễ" value={summary?.lateDays ?? 0} color="text-amber-600" />
                <SummaryCard label="Về sớm" value={summary?.earlyLeaveDays ?? 0} color="text-orange-600" />
            </div>

            {/* Employee Info */}
            <div className="mb-4 p-3 bg-slate-50 rounded-lg">
                <p className="text-sm text-slate-600">
                    <span className="font-medium">Nhân viên:</span>{" "}
                    {timesheet?.employee?.fullName} ({timesheet?.employee?.employeeCode})
                </p>
                <p className="text-sm text-slate-600">
                    <span className="font-medium">Kỳ chấm công:</span>{" "}
                    Tháng {timesheet?.month}/{timesheet?.year}
                </p>
            </div>

            {/* Daily Details Table */}
            <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 sticky top-0">
                        <tr>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Ngày</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Thứ</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Vào</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Ra</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Giờ</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Trễ (phút)</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Sớm (phút)</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">OT</th>
                            <th className="px-3 py-2 text-left font-medium text-slate-600">Trạng thái</th>
                        </tr>
                    </thead>
                    <tbody>
                        {(dailyDetails || []).map((day, idx) => (
                            <tr
                                key={idx}
                                className={`border-b border-slate-100 ${day.status === "WEEKEND" || day.status === "HOLIDAY"
                                        ? "bg-slate-50/50"
                                        : ""
                                    }`}
                            >
                                <td className="px-3 py-2 text-slate-700">{day.date}</td>
                                <td className="px-3 py-2 text-slate-500">{day.dayOfWeek}</td>
                                <td className="px-3 py-2">{day.checkIn || "-"}</td>
                                <td className="px-3 py-2">{day.checkOut || "-"}</td>
                                <td className="px-3 py-2 font-medium">{day.workingHours || "-"}</td>
                                <td className="px-3 py-2">
                                    {day.lateMinutes > 0 ? (
                                        <span className="text-amber-600 font-medium">{day.lateMinutes}</span>
                                    ) : "-"}
                                </td>
                                <td className="px-3 py-2">
                                    {day.earlyLeaveMinutes > 0 ? (
                                        <span className="text-orange-600 font-medium">{day.earlyLeaveMinutes}</span>
                                    ) : "-"}
                                </td>
                                <td className="px-3 py-2">
                                    {day.overtimeHours > 0 ? (
                                        <span className="text-blue-600 font-medium">{day.overtimeHours}</span>
                                    ) : "-"}
                                </td>
                                <td className="px-3 py-2">
                                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${dayStatusColors[day.status] || ""}`}>
                                        {dayStatusLabels[day.status] || day.status}
                                    </span>
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
