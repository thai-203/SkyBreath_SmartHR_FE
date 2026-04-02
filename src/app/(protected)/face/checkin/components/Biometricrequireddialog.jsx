import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";

const BiometricRequiredDialog = ({ open, onOpenChange, onRegister }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-md"
        style={{ backgroundColor: "var(--card)", color: "var(--foreground)" }}
      >
        <DialogHeader className="items-center text-center">
          <div
            className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in srgb, var(--warning) 10%, transparent)" }}
          >
            <ShieldAlert className="h-7 w-7" style={{ color: "var(--warning)" }} />
          </div>
          <DialogTitle>Chưa đăng ký sinh trắc học</DialogTitle>
          <DialogDescription>
            Bạn cần đăng ký dữ liệu khuôn mặt trước khi có thể chấm công. Quá trình đăng ký chỉ mất khoảng 1 phút.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="flex-col gap-2 sm:flex-col">
          <Button onClick={onRegister} className="w-full gap-2">
            <ShieldAlert className="h-4 w-4" />
            Đăng ký ngay
          </Button>
          <Button
            variant="ghost"
            onClick={() => onOpenChange(false)}
            className="w-full"
          >
            Để sau
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default BiometricRequiredDialog;