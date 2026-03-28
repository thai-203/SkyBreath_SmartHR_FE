"use client";

import React from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

const violationTypeLabels = {
    LATE: "Đi muộn",
    EARLY: "Về sớm",
};

export default function PenaltyDetailModal({ isOpen, onClose, penalty }) {
    if (!penalty) return null;

    const formatDate = (dateStr) => {
        if (!dateStr) return "—";
        return new Date(dateStr).toLocaleDateString("vi-VN");
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết quy định vi phạm" size="default">
            <div className="space-y-5">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Trường hợp</p>
                        <p className="text-sm font-medium text-slate-900">
                            {violationTypeLabels[penalty.violationType] || penalty.violationType}
                        </p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Trạng thái</p>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            penalty.status === "ACTIVE" ? "bg-emerald-50 text-emerald-700" : "bg-slate-100 text-slate-500"
                        }`}>
                            {penalty.status === "ACTIVE" ? "Hoạt động" : "Ngừng hoạt động"}
                        </span>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Ngày hiệu lực</p>
                        <p className="text-sm text-slate-900">{formatDate(penalty.effectiveFrom)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Ngày hết hiệu lực</p>
                        <p className="text-sm text-slate-900">{formatDate(penalty.effectiveTo)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Thời gian từ (phút)</p>
                        <p className="text-sm text-slate-900">{penalty.fromMinute}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Thời gian đến (phút)</p>
                        <p className="text-sm text-slate-900">{penalty.toMinute}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Số giờ quy đổi</p>
                        <p className="text-sm text-slate-900">{penalty.convertedHours}</p>
                    </div>
                    <div className="space-y-1 col-span-2">
                        <p className="text-xs font-medium text-slate-500">Ghi chú</p>
                        <p className="text-sm text-slate-900">{penalty.note || "—"}</p>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-3 border-t border-slate-100">
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Ngày tạo</p>
                        <p className="text-sm text-slate-600">{formatDate(penalty.createdAt)}</p>
                    </div>
                    <div className="space-y-1">
                        <p className="text-xs font-medium text-slate-500">Ngày cập nhật</p>
                        <p className="text-sm text-slate-600">{formatDate(penalty.updatedAt)}</p>
                    </div>
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>Đóng</Button>
                </div>
            </div>
        </Modal>
    );
}
