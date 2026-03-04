"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";

export default function ShiftGroupDeleteModal({
  open,
  loading,
  name,
  onClose,
  onConfirm,
}) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Thêm bg-white và border rõ ràng ở đây */}
      <DialogContent className="bg-white border-none shadow-2xl sm:max-w-[440px] p-0 overflow-hidden">
        <div className="p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-gray-800">
              Xác nhận xóa
            </DialogTitle>
          </DialogHeader>
          
          <div className="mt-4">
            <p className="text-gray-600 leading-relaxed">
              Bạn có chắc chắn muốn xóa nhóm ca 
              <span className="font-semibold text-red-600"> "{name}" </span> 
              không? Hành động này không thể hoàn tác.
            </p>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="rounded-md border-gray-300 hover:bg-gray-100 transition-all"
          >
            Hủy
          </Button>
          <Button 
            variant="destructive" 
            onClick={onConfirm} 
            loading={loading}
            className="rounded-md bg-red-500 hover:bg-red-600 transition-all"
          >
            Xóa
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}