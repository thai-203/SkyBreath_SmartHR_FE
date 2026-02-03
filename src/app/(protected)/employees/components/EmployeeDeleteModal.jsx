"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { AlertCircle } from "lucide-react";

export default function EmployeeDeleteModal({ isOpen, onClose, onConfirm, employee, loading }) {
    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận xóa">
            <div className="space-y-6">
                <div className="flex items-center gap-4 text-rose-600 bg-rose-50 p-4 rounded-lg border border-rose-100">
                    <AlertCircle className="h-6 w-6 flex-shrink-0" />
                    <p className="text-sm font-medium">
                        Hành động này không thể hoàn tác. Mọi dữ liệu liên quan đến nhân viên này sẽ bị xóa khỏi hệ thống.
                    </p>
                </div>

                <div className="space-y-2">
                    <p className="text-slate-600">
                        Bạn có chắc chắn muốn xóa nhân viên:
                    </p>
                    <p className="text-lg font-bold text-slate-900 border-l-4 border-slate-200 pl-4 py-1">
                        {employee?.fullName}
                    </p>
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={onConfirm}
                        loading={loading}
                        className="bg-rose-600 hover:bg-rose-700"
                    >
                        Xác nhận xóa
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
