"use client";

import { ConfirmModal } from "@/components/common/Modal";

export default function DeleteContractModal({
    isOpen,
    onClose,
    onConfirm,
    contract,
    loading,
}) {
    return (
        <ConfirmModal
            isOpen={isOpen}
            onClose={onClose}
            onConfirm={onConfirm}
            title="Xóa hợp đồng"
            description={`Bạn có chắc chắn muốn xóa hợp đồng của nhân viên ${contract?.employee?.fullName || ""}? Hành động này không thể hoàn tác.`}
            confirmText="Xóa"
            cancelText="Hủy"
            variant="destructive"
            loading={loading}
        />
    );
}
