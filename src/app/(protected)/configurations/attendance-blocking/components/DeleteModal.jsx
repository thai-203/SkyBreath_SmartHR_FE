import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/ui/button";

export function DeleteModal({ isOpen, onClose, onConfirm, isDeleting }) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Xác nhận xóa quy tắc"
      description="Hành động này không thể hoàn tác. Bạn có chắc chắn muốn xóa quy tắc này khỏi hệ thống không?"
      size="sm"
    >
      <div className="flex justify-end gap-3 mt-6">
        <Button 
          variant="outline" 
          onClick={onClose} 
          disabled={isDeleting}
        >
          Hủy
        </Button>
        <Button 
          variant="destructive" 
          onClick={onConfirm} 
          disabled={isDeleting}
        >
          {isDeleting ? "Đang xóa..." : "Xác nhận xóa"}
        </Button>
      </div>
    </Modal>
  );
}