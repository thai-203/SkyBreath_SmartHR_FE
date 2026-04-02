import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { AlertCircle, Loader2, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import CheckInCamera from "./CheckInCamera";

const CheckInDialog = ({
  open,
  onOpenChange,
  mode,
  securityConfig,
  onSuccess,
}) => {
  // step: "locating" | "camera" | "error"
  const [step, setStep] = useState("locating");
  const [locationError, setLocationError] = useState("");
  const [coords, setCoords] = useState(null); // { lat, lng }

  const requireLocation = securityConfig?.requireLocationCheck ?? true;

  // Mỗi lần dialog mở lại → reset
  useEffect(() => {
    if (!open) return;

    setLocationError("");
    setCoords(null);

    if (!requireLocation) {
      setStep("camera");
      return;
    }

    setStep("locating");

    // Thử lấy từ cache trước (maximumAge: 60s) — gần như tức thì
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCoords({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setStep("camera");
      },
      () => {
        // Cache miss → fallback lấy mới, tắt high accuracy để nhanh hơn
        navigator.geolocation.getCurrentPosition(
          (position) => {
            setCoords({
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            });
            setStep("camera");
          },
          (err) => {
            let msg = "Không thể lấy vị trí.";
            if (err.code === 1)
              msg =
                "Bạn đã từ chối quyền truy cập vị trí. Vui lòng cấp quyền và thử lại.";
            if (err.code === 2)
              msg = "Không xác định được vị trí. Vui lòng thử lại.";
            if (err.code === 3) msg = "Lấy vị trí quá lâu, vui lòng thử lại.";
            setLocationError(msg);
            setStep("error");
          },
          { enableHighAccuracy: false, timeout: 8000, maximumAge: 0 },
        );
      },
      { enableHighAccuracy: false, timeout: 3000, maximumAge: 60000 }, // đọc cache ≤ 60s tuổi
    );
  }, [open]);

  // Wrap onSuccess để truyền thêm coords
  const handleCapture = (blobs) =>
    onSuccess(blobs, coords?.lat ?? null, coords?.lng ?? null);

  const title =
    mode === "check-in"
      ? "Xác thực khuôn mặt — Check In"
      : "Xác thực khuôn mặt — Check Out";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-xl w-[95vw] max-h-[90vh] overflow-y-auto p-0"
        style={{ backgroundColor: "var(--card)", color: "var(--foreground)" }}
      >
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Nhìn thẳng vào camera để hệ thống nhận diện
          </DialogDescription>
        </DialogHeader>

        <div className="px-4 pb-6">
          {/* STEP: Đang lấy vị trí */}
          {step === "locating" && (
            <div className="flex flex-col items-center justify-center gap-3 py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4" />
                <span>Đang lấy vị trí của bạn...</span>
              </div>
            </div>
          )}

          {/* STEP: Lỗi vị trí */}
          {step === "error" && (
            <div className="flex flex-col items-center justify-center gap-4 py-10">
              <div className="flex items-center gap-3 text-destructive">
                <AlertCircle className="h-6 w-6 shrink-0" />
                <p className="text-sm font-medium">{locationError}</p>
              </div>
              <Button variant="outline" onClick={() => onOpenChange(false)}>
                Đóng
              </Button>
            </div>
          )}

          {/* STEP: Camera */}
          {step === "camera" && (
            <CheckInCamera config={securityConfig} onCapture={handleCapture} />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CheckInDialog;
