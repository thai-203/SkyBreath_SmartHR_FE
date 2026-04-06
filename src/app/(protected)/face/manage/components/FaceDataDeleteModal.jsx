"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { AlertTriangle } from "lucide-react";

export default function FaceDataDeleteModal({
  isOpen,
  onClose,
  onConfirm,
  group,
  loading,
}) {
  if (!group) return null;

  const { employeeCode } = group;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={"Xác nhận xoá toàn bộ"}
      size="sm"
    >
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-red-50">
            <AlertTriangle className="h-5 w-5 text-red-500" />
          </div>
          <p className="text-sm text-slate-600 leading-relaxed pt-1.5">
            Bạn có chắc muốn xoá toàn bộ dữ liệu sinh trắc của nhân viên {employeeCode}?
            Hành động này không thể hoàn tác.
          </p>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <Button variant="outline" onClick={onClose} disabled={loading}>
            Huỷ
          </Button>
          <Button variant="destructive" onClick={onConfirm} loading={loading}>
            {loading ? "Đang xoá..." : "Xoá"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
