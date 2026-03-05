"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import { ShieldX } from "lucide-react";

export default function UserRemoveRoleModal({
  isOpen,
  onClose,
  onConfirm,
  user,
  loading = false,
}) {
    const message = `Bạn có chắc chắn muốn xóa vai trò khỏi tài khoản "${user?.email}" (${user?.username})?`;

//   const message = "Bạn có chắc chắn muốn xóa vai trò khỏi tài khoản ";
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Xóa vai trò người dùng">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg bg-red-50">
          <ShieldX className="h-5 w-5 text-red-600" />
          <p className="text-sm text-slate-700">{message}</p>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Hủy
          </Button>

          <Button onClick={onConfirm} loading={loading} variant="destructive">
            {loading ? "Đang xóa..." : "Xóa vai trò"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
