"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";

export default function ApprovalModal({ isOpen, onClose, onConfirm, loading, action, payroll }) {
    const [reason, setReason] = useState("");

    if (!isOpen) return null;

    const isReject = action === "reject";

    const handleSubmit = (e) => {
        e.preventDefault();
        onConfirm(reason);
        setReason("");
    };

    const config = {
        submit: {
            title: "Gửi phê duyệt",
            desc: `Bảng lương Tháng ${payroll?.payrollMonth}/${payroll?.payrollYear} sẽ được gửi đến quản lý để phê duyệt.`,
            confirmText: "Gửi phê duyệt",
            confirmClass: "bg-blue-600 hover:bg-blue-700",
        },
        approve: {
            title: "Phê duyệt bảng lương",
            desc: `Bạn xác nhận phê duyệt bảng lương Tháng ${payroll?.payrollMonth}/${payroll?.payrollYear}?`,
            confirmText: "Phê duyệt",
            confirmClass: "bg-emerald-600 hover:bg-emerald-700",
        },
        reject: {
            title: "Từ chối bảng lương",
            desc: `Vui lòng nhập lý do từ chối bảng lương Tháng ${payroll?.payrollMonth}/${payroll?.payrollYear}.`,
            confirmText: "Từ chối",
            confirmClass: "bg-red-600 hover:bg-red-700",
        },
        lock: {
            title: "Khóa bảng lương",
            desc: `Bảng lương sẽ bị khóa và không thể chỉnh sửa. Hành động này không thể hoàn tác.`,
            confirmText: "Khóa",
            confirmClass: "bg-slate-800 hover:bg-slate-900",
        },
        unlock: {
            title: "Mở khóa bảng lương",
            desc: `Bảng lương sẽ được mở khóa để có thể chỉnh sửa lại dữ liệu.`,
            confirmText: "Mở khóa",
            confirmClass: "bg-amber-600 hover:bg-amber-700",
        },
        sendPayslips: {
            title: "Gửi phiếu lương",
            desc: `Hệ thống sẽ gửi email phiếu lương đến tất cả nhân viên trong kỳ lương này.`,
            confirmText: "Gửi phiếu lương",
            confirmClass: "bg-indigo-600 hover:bg-indigo-700",
        },
    };

    const cfg = config[action] || config.approve;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <h2 className="text-lg font-bold text-slate-900">{cfg.title}</h2>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <p className="text-sm text-slate-600">{cfg.desc}</p>

                    {isReject && (
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-1.5">
                                Lý do từ chối <span className="text-red-500">*</span>
                            </label>
                            <textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                required
                                rows={3}
                                placeholder="Nhập lý do..."
                                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 resize-none"
                            />
                        </div>
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Hủy
                        </Button>
                        <button
                            type="submit"
                            disabled={loading || (isReject && !reason.trim())}
                            className={`flex-1 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 ${cfg.confirmClass}`}
                        >
                            {loading ? "Đang xử lý..." : cfg.confirmText}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
