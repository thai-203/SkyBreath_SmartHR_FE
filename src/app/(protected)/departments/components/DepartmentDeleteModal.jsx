"use client";

import { ConfirmModal } from "@/components/common/Modal";

export default function DepartmentDeleteModal({
    isOpen,
    onClose,
    onConfirm,
    department,
    loading,
}) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Xác nhận xóa"
            description={`Bạn có chắc chắn muốn xóa phòng ban "${department?.departmentName}"? Hành động này không thể hoàn tác.`}
            confirmText="Xóa"
            loading={loading}
        />
    );
}
