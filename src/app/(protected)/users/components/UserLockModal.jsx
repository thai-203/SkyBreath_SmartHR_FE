"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { Lock, Unlock } from "lucide-react";

export default function UserLockModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading,
  action = "lock", // "lock" or "unlock"
}) {
  if (!user) return null;

  const isLock = action === "lock";
  const title = isLock ? "Khóa tài khoản" : "Mở khóa tài khoản";
  const message = isLock
    ? `Bạn có chắc chắn muốn khóa tài khoản "${user.email}" (${user.username})?`
    : `Bạn có chắc chắn muốn mở khóa tài khoản "${user.email}" (${user.username})?`;
  const confirmText = isLock ? "Khóa" : "Mở khóa";
  const buttonVariant = isLock ? "destructive" : "success";
  const Icon = isLock ? Lock : Unlock;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
          <Icon className="h-5 w-5 text-slate-600" />
          <p className="text-sm text-slate-700">{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button onClick={onConfirm} loading={loading} variant={buttonVariant}>
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
