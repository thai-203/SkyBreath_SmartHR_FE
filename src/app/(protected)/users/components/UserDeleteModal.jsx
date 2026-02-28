"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { AlertCircle } from "lucide-react";

export default function UserDeleteModal({
    isOpen,
    onClose,
    user,
    onConfirm,
    loading,
}) {
    if (!user) return null;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Xác nhận xóa"
            size="sm"
        >
            <div className="space-y-4">
                <div className="flex gap-4 rounded-lg bg-red-50 p-4">
                    <AlertCircle className="h-5 w-5 flex-shrink-0 text-red-600" />
                    <div className="space-y-2">
                        <p className="text-sm font-medium text-red-900">
                            Bạn có chắc chắn muốn xóa người dùng này?
                        </p>
                        <p className="text-sm text-red-800">
                            <strong>Email:</strong> {user.email}
                        </p>
                        <p className="text-sm text-red-800">
                            <strong>Tên đăng nhập:</strong> {user.username}
                        </p>
                    </div>
                </div>

                <div className="rounded-lg bg-amber-50 p-3">
                    <p className="text-xs text-amber-800">
                        ⚠️ <strong>Lưu ý:</strong> Thao tác này không thể hoàn tác. Tất cả dữ liệu liên quan sẽ bị xóa.
                    </p>
                </div>

                <div className="flex justify-end gap-3 border-t border-slate-200 pt-4">
                    <Button
                        type="button"
                        variant="outline"
                        onClick={onClose}
                        disabled={loading}
                    >
                        Hủy
                    </Button>
                    <Button
                        type="button"
                        variant="danger"
                        onClick={onConfirm}
                        disabled={loading}
                    >
                        {loading ? "Đang xóa..." : "Xóa"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
