"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { auditService } from "@/services/audit.service";
import { format } from "date-fns";
import { CheckCircle2, XCircle, Clock } from "lucide-react";

export default function TimesheetActionLogModal({ isOpen, onClose }) {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(false);
    const { error: toastError } = useToast();

    useEffect(() => {
        if (isOpen) {
            fetchLogs();
        }
    }, [isOpen]);

    const fetchLogs = async () => {
        setLoading(true);
        try {
            const res = await auditService.getAllForTimesheet({
                targetTable: 'timesheets',
                limit: 50, // Get last 50 actions
                sortOrder: 'DESC'
            });
            setLogs(res?.data?.data || []);
        } catch (err) {
            console.error("Error fetching logs:", err);
            toastError("Lỗi khi tải lịch sử thao tác");
        } finally {
            setLoading(false);
        }
    };

    const getActionTypeLabel = (actionType) => {
        const labels = {
            'GENERATE': 'Tạo bảng công',
            'RECALCULATE': 'Tính lại',
            'LOCK': 'Khóa / Chốt',
            'UPDATE': 'Chỉnh sửa',
            'DELETE': 'Xóa',
            'EXPORT': 'Xuất Excel',
        };
        return labels[actionType] || actionType;
    };

    const getActionTypeColor = (actionType) => {
        const colors = {
            'GENERATE': 'bg-emerald-100 text-emerald-700',
            'RECALCULATE': 'bg-amber-100 text-amber-700',
            'LOCK': 'bg-slate-200 text-slate-700',
            'UPDATE': 'bg-blue-100 text-blue-700',
            'DELETE': 'bg-rose-100 text-rose-700',
            'EXPORT': 'bg-purple-100 text-purple-700',
        };
        return colors[actionType] || 'bg-slate-100 text-slate-600';
    };

    const getStatusIcon = (status) => {
        if (status === 'SUCCESS') return <CheckCircle2 className="h-4 w-4 text-emerald-500" />;
        return <XCircle className="h-4 w-4 text-rose-500" />;
    };

    const renderDescription = (log) => {
        let desc = log.description;
        if (log.actionType === 'UPDATE' && log.beforeData && log.afterData) {
            const changes = [];
            const fieldsMap = {
                totalWorkingDays: 'Ngày công',
                totalWorkingHours: 'Giờ công',
                overtimeHours: 'Giờ OT',
                isLocked: 'Trạng thái khóa'
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
                    changes.push(`${fieldName}: ${beforeVal} -> ${afterVal}`);
                }
            });

            if (changes.length > 0) {
                return (
                    <div className="flex flex-col gap-1">
                        <span title={desc}>{desc}</span>
                        <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                            {changes.map((change, idx) => (
                                <span key={idx} className="bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                                    {change}
                                </span>
                            ))}
                        </div>
                    </div>
                );
            }
        }
        return <span title={desc} className="truncate block">{desc}</span>;
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Lịch sử thao tác (Bảng chấm công)" size="4xl">
            <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto max-h-[60vh]">
                    <table className="min-w-full divide-y divide-slate-200">
                        <thead className="bg-slate-50 sticky top-0 z-10">
                            <tr>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">
                                    Thời gian
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-32">
                                    Người thao tác
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider w-40">
                                    Hành động
                                </th>
                                <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                                    Mô tả
                                </th>
                                <th scope="col" className="px-4 py-3 text-center text-xs font-medium text-slate-500 uppercase tracking-wider w-24">
                                    Trạng thái
                                </th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-slate-200 relative">
                            {loading && logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                        Đang tải dữ liệu...
                                    </td>
                                </tr>
                            ) : logs.length === 0 ? (
                                <tr>
                                    <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                        Chưa có lịch sử thao tác nào.
                                    </td>
                                </tr>
                            ) : (
                                logs.map((log) => (
                                    <tr key={log.id} className="hover:bg-slate-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-500 flex items-center gap-2">
                                            <Clock className="w-3.5 h-3.5 text-slate-400" />
                                            {format(new Date(log.createdAt), 'dd/MM/yyyy HH:mm')}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-indigo-600">
                                            {log.user?.username || log.user?.email || 'Hệ thống'}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-slate-700">
                                            <span className={`px-2 py-1 rounded text-xs font-medium ${getActionTypeColor(log.actionType)}`}>
                                                {getActionTypeLabel(log.actionType)}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 text-sm text-slate-600 max-w-sm">
                                            {renderDescription(log)}
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap text-center flex justify-center">
                                            {getStatusIcon(log.status)}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <div className="flex justify-end mt-6">
                <Button onClick={onClose}>Đóng</Button>
            </div>
        </Modal>
    );
}
