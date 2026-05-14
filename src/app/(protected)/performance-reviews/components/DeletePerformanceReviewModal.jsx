"use client";

import { AlertTriangle } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

export default function DeletePerformanceReviewModal({
    isOpen,
    onClose,
    onConfirm,
    review,
    loading,
}) {
    if (!review) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận xóa" size="sm">
            <div className="space-y-4 mt-4">
                <div className="flex items-center justify-center">
                    <div className="w-14 h-14 rounded-full bg-red-100 flex items-center justify-center">
                        <AlertTriangle className="h-7 w-7 text-red-600" />
                    </div>
                </div>

                <div className="text-center">
                    <h3 className="text-lg font-semibold text-slate-900">
                        Xóa đánh giá KPI
                    </h3>
                    <p className="text-sm text-slate-500 mt-2">
                        Bạn có chắc chắn muốn xóa đánh giá của{" "}
                        <span className="font-semibold text-slate-700">
                            {review.employee?.fullName}
                        </span>{" "}
                        tháng{" "}
                        <span className="font-semibold text-slate-700">
                            {review.reviewMonth}/{review.reviewYear}
                        </span>
                        ?
                    </p>
                    <p className="text-xs text-red-500 mt-2">
                        Hành động này không thể hoàn tác.
                    </p>
                </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
                <Button
                    variant="outline"
                    onClick={onClose}
                    disabled={loading}
                    className="border-slate-200 text-slate-600"
                >
                    Hủy bỏ
                </Button>
                <Button
                    variant="destructive"
                    onClick={onConfirm}
                    loading={loading}
                >
                    Xóa
                </Button>
            </div>
        </Modal>
    );
}
