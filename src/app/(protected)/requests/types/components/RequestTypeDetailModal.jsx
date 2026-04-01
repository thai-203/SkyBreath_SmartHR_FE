"use client";

import { X, FileText, Settings2, CheckCircle, XCircle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/common/Button";
import { TRACKING_CYCLE_LABELS, POLICY_UNIT_LABELS } from "@/constants/request.enum";

function InfoRow({ label, value }) {
    return (
        <div className="flex items-start py-2.5 border-b border-slate-100 last:border-0">
            <span className="w-40 text-sm text-slate-500 shrink-0">{label}</span>
            <span className="text-sm font-medium text-slate-800">{value || "—"}</span>
        </div>
    );
}

export default function RequestTypeDetailModal({ isOpen, onClose, typeItem, onEditPolicy }) {
    if (!isOpen || !typeItem) return null;

    const policy = typeItem.policy;
    const hasPolicy = !!policy;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-lg p-0 overflow-hidden bg-white border-none rounded-xl">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50 relative">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                            <FileText className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-800">
                                Chi tiết Loại Đơn
                            </DialogTitle>
                            <p className="text-xs text-slate-500 mt-0.5">{typeItem.requestGroup?.name || "—"}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
                    {/* Thông tin cơ bản */}
                    <div>
                        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                            Thông tin cơ bản
                        </h3>
                        <div className="bg-slate-50 rounded-lg px-4 divide-y divide-slate-100">
                            <InfoRow label="Tên loại đơn" value={typeItem.name} />
                            <InfoRow label="Nhóm đơn" value={typeItem.requestGroup?.name} />
                            <InfoRow label="Mô tả" value={typeItem.description} />
                            <div className="flex items-start py-2.5">
                                <span className="w-40 text-sm text-slate-500 shrink-0">Trạng thái</span>
                                <Badge variant={typeItem.status === "ACTIVE" ? "success" : "secondary"}>
                                    {typeItem.status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}
                                </Badge>
                            </div>
                        </div>
                    </div>

                    {/* Cấu hình Policy */}
                    <div>
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Cấu hình Policy
                            </h3>
                            {onEditPolicy && (
                                <button
                                    onClick={() => { onClose(); onEditPolicy(typeItem); }}
                                    className="flex items-center gap-1.5 text-xs text-emerald-600 hover:text-emerald-700 font-medium transition-colors"
                                >
                                    <Settings2 className="h-3.5 w-3.5" />
                                    Chỉnh sửa
                                </button>
                            )}
                        </div>

                        {hasPolicy ? (
                            <div className="bg-slate-50 rounded-lg px-4 divide-y divide-slate-100">
                                <InfoRow
                                    label="Chu kỳ theo dõi"
                                    value={TRACKING_CYCLE_LABELS[policy.trackingCycle] || policy.trackingCycle}
                                />
                                <InfoRow
                                    label="Đơn vị tính"
                                    value={POLICY_UNIT_LABELS[policy.unit] || policy.unit}
                                />
                                <InfoRow
                                    label="Hạn mức tối đa"
                                    value={`${policy.maxQuantity} ${POLICY_UNIT_LABELS[policy.unit] || policy.unit}`}
                                />
                                <div className="flex items-start py-2.5">
                                    <span className="w-40 text-sm text-slate-500 shrink-0">Được tính công</span>
                                    {policy.isWorkedTime ? (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-emerald-600">
                                            <CheckCircle className="h-4 w-4" /> Có
                                        </span>
                                    ) : (
                                        <span className="flex items-center gap-1.5 text-sm font-medium text-slate-400">
                                            <XCircle className="h-4 w-4" /> Không
                                        </span>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center py-6 bg-slate-50 rounded-lg border border-dashed border-slate-300">
                                <Settings2 className="h-8 w-8 text-slate-300 mb-2" />
                                <p className="text-sm text-slate-400">Chưa cấu hình policy</p>
                                {onEditPolicy && (
                                    <button
                                        onClick={() => { onClose(); onEditPolicy(typeItem); }}
                                        className="mt-2 text-xs text-emerald-600 hover:underline font-medium"
                                    >
                                        Cấu hình ngay
                                    </button>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                <div className="px-6 py-4 border-t bg-slate-50 flex justify-end">
                    <Button variant="outline" onClick={onClose}>Đóng</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
