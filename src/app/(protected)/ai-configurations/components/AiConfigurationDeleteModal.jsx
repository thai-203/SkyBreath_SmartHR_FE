"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { AlertTriangle } from "lucide-react";

export default function AiConfigurationDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    config,
    loading,
}) {
    if (!config) return null;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Xác nhận xóa" size="sm">
            <div className="flex flex-col items-center justify-center p-4 text-center">
                <div className="mb-4 h-12 w-12 rounded-full bg-red-100 flex items-center justify-center">
                    <AlertTriangle className="h-6 w-6 text-red-600" />
                </div>
                <h3 className="mb-2 text-lg font-bold text-slate-900">
                    Xóa cấu hình: {config.configKey}?
                </h3>
                <p className="text-sm text-slate-500 mb-2">
                    Bạn có chắc chắn muốn xóa vĩnh viễn cấu hình này?
                </p>
                <div className="rounded-md bg-red-50 p-3 text-xs text-red-600 w-full mb-4 text-left">
                    <strong>Lưu ý:</strong> Hành động này không thể hoàn tác (`HARD DELETE`). Nếu đây là cấu hình đang ACTIVE, Chatbot AI sẽ ngừng hoạt động ngay lập tức.
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    Hủy
                </Button>
                <Button variant="danger" onClick={onConfirm} loading={loading}>
                    Xóa vĩnh viễn
                </Button>
            </div>
        </Modal>
    );
}
