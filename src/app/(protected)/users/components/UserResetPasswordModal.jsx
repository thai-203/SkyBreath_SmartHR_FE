"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { KeyRound } from "lucide-react";

export default function UserResetPasswordModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading = false,
}) {
  const message = `Bạn có chắc chắn muốn đặt lại mật khẩu cho tài khoản "${user?.email}" (${user?.username})?`;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Đặt lại mật khẩu người dùng"
    >
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50">
          <KeyRound className="h-5 w-5 text-amber-600" />
          <p className="text-sm text-slate-700">{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>

          <Button onClick={onConfirm} loading={loading} variant="destructive">
            {loading ? "Đang đặt lại..." : "Xác nhận reset"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
