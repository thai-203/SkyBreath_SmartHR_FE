"use client";

import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import {
  LogIn,
  LogOut,
  Clock,
  TrendingUp,
  Timer,
  AlertCircle,
  Ban,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/components/common/Toast";
import AttendanceClock from "./components/AttendanceClock";
import RecentActivity from "./components/RecentActivity";
import BiometricRequiredDialog from "./components/Biometricrequireddialog";
import CheckInDialog from "./components/CheckInDialog";
import { attendanceService } from "@/services/attendance.service";
import { Skeleton } from "@/components/common/Skeleton";
import { canAccess } from "@/components/common/AuthGuard";

function isWithinShiftWindow(startTime, endTime) {
  const now = new Date();
  const [sh, sm] = startTime.split(":").map(Number);
  const [eh, em] = endTime.split(":").map(Number);

  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = sh * 60 + sm;
  const endMinutes = eh * 60 + em;

  const windowStart = startMinutes - 120;
  const windowEnd = endMinutes + 120;

  if (windowStart < 0) {
    return nowMinutes >= windowStart + 1440 || nowMinutes <= windowEnd;
  }

  if (windowEnd > 1440) {
    return nowMinutes >= windowStart || nowMinutes <= windowEnd - 1440;
  }

  return nowMinutes >= windowStart && nowMinutes <= windowEnd;
}

function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Chào buổi sáng";
  if (h < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function formatMinutesToHM(min) {
  if (min <= 0) return "0h 0m";
  return `${Math.floor(min / 60)}h ${min % 60}m`;
}

const Index = () => {
  const { success, error: toastError } = useToast();
  const [isCheckedIn, setIsCheckedIn] = useState(false);
  const [isCheckedOut, setIsCheckedOut] = useState(false);
  const [activities, setActivities] = useState([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogMode, setDialogMode] = useState("check-in");
  const [biometricDialogOpen, setBiometricDialogOpen] = useState(false);
  const [ctx, setCtx] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmit, setIsSubmit] = useState(false);

  const attendanceStatus = isCheckedOut
    ? "checked-out"
    : isCheckedIn
      ? "checked-in"
      : "not-started";

  const shiftWindowValid = ctx?.hasShift
    ? isWithinShiftWindow(ctx?.shift.startTime, ctx?.shift.endTime)
    : false;

  const handleOpenDialog = (mode) => {
    if (!ctx?.hasBiometric) {
      setBiometricDialogOpen(true);
      return;
    }

    if (ctx?.isBlocked) {
      toastError(
        "Bạn đã vượt quá giới hạn check-in thất bại. Vui lòng liên hệ quản lý.",
      );
      return;
    }

    if (!shiftWindowValid) {
      toastError(
        `Ca làm ${ctx?.shift.startTime} — ${ctx?.shift.endTime} đã kết thúc. Không thể chấm công lúc này.`,
      );
      return;
    }

    setDialogMode(mode);
    setDialogOpen(true);
  };
  const fetchMetadata = async () => {
    setIsLoading(true);
    try {
      const data = await attendanceService.getTodayContext();
      const { recentRecords, ...metaData } = data.data || {};
      if (data.data?.attendance.checkInTime) {
        setIsCheckedIn(true);
        if (data.data?.attendance.checkOutTime) {
          setIsCheckedOut(true);
        }
      }
      setCtx(metaData);
      setActivities(recentRecords || []);
    } catch (error) {
      toastError("Không thể tải dữ liệu cấu hình");
    } finally {
      setIsLoading(false);
    }
  };
  useEffect(() => {
    fetchMetadata();
  }, []);

  const handleCapture = async (blobs, lat, lng) => {
    setIsSubmit(true);
    try {
      // Nếu requireLocation=true mà không có coords → lỗi (safety guard)
      if (ctx?.security?.requireLocationCheck && (lat == null || lng == null)) {
        return {
          success: false,
          message: "Không có thông tin vị trí. Vui lòng thử lại.",
        };
      }

      const res =
        dialogMode === "check-in"
          ? await attendanceService.checkIn(lat, lng, blobs)
          : await attendanceService.checkOut(lat, lng, blobs);

      if (!res.success) return { success: false, message: res.message };

      await fetchMetadata();
      success(
        dialogMode === "check-in"
          ? "✅ Check-in thành công"
          : "✅ Check-out thành công",
      );
      setTimeout(() => setDialogOpen(false), 1500);
      return { success: true };
    } catch (err) {
      await fetchMetadata();
      toastError(err.response?.data?.message || "Lỗi kết nối server.");
      return {
        success: false,
        message: err.response?.data?.message || "Lỗi kết nối server.",
      };
    } finally {
      setIsSubmit(false);
    }
  };

  const handleRegisterBiometric = () => {
    setBiometricDialogOpen(false);
    success("Chuyển hướng đến trang đăng ký khuôn mặt...");
  };

  const stats = useMemo(() => {
    if (!ctx?.attendance) {
      return {
        firstIn: "--:--",
        firstOut: "--:--",
        totalHours: "0h 0m",
        overtime: "0h 0m",
      };
    }

    const { checkInTime, checkOutTime } = ctx.attendance;

    let firstIn = "--:--";
    let firstOut = "--:--";
    let totalMinutes = 0;

    if (checkInTime) {
      const checkInDate = new Date(checkInTime);

      firstIn = new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(checkInDate);
    }

    if (checkOutTime) {
      const checkOutDate = new Date(checkOutTime);

      firstOut = new Intl.DateTimeFormat("vi-VN", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
      }).format(checkOutDate);

      if (checkInTime) {
        const checkInDate = new Date(checkInTime);
        totalMinutes = Math.max(
          0,
          Math.round((checkOutDate - checkInDate) / 60000),
        );
      }
    }

    const overtime =
      totalMinutes > (ctx?.totalWorkMinutes || 0)
        ? totalMinutes - ctx.totalWorkMinutes
        : 0;

    return {
      firstIn,
      firstOut,
      totalHours: formatMinutesToHM(totalMinutes),
      overtime: formatMinutesToHM(overtime),
    };
  }, [ctx]);

  const checkInDisabled = !ctx?.hasShift || isCheckedIn || ctx?.isBlocked;
  const checkOutDisabled =
    !ctx?.hasShift || !isCheckedIn || isCheckedOut || ctx?.isBlocked;

  return (
    <div className="min-h-screen bg-muted/30">
      <div className="max-w">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">
            {getGreeting()}, {ctx?.userName}! 👋
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Hệ thống chấm công sinh trắc học
          </p>
        </motion.div>

        {/* Blocked warning */}
        {ctx?.isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <Card className="border-destructive/50">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 text-destructive">
                  <Ban className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Tài khoản bị tạm khóa</p>
                    <p className="text-sm text-muted-foreground">
                      Bạn đã vượt quá giới hạn check-in thất bại cho phép. Vui
                      lòng liên hệ quản lý.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No biometric warning */}
        {!isLoading && !ctx?.hasBiometric && !ctx?.isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.15,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-6"
          >
            <Card
              style={{
                borderColor:
                  "color-mix(in srgb, var(--warning) 50%, transparent)",
              }}
            >
              <CardContent className="pt-6">
                <div
                  className="flex items-center gap-3"
                  style={{ color: "var(--warning)" }}
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Chưa đăng ký sinh trắc học</p>
                    <p className="text-sm text-muted-foreground">
                      Bạn cần đăng ký dữ liệu khuôn mặt để có thể chấm công.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* No shift warning */}
        {!isLoading && !ctx?.hasShift && !ctx?.isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
            className="mb-6"
          >
            <Card
              style={{
                borderColor:
                  "color-mix(in srgb, var(--warning) 50%, transparent)",
              }}
            >
              <CardContent className="pt-6">
                <div
                  className="flex items-center gap-3"
                  style={{ color: "var(--warning)" }}
                >
                  <AlertCircle className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Không có ca làm việc</p>
                    <p className="text-sm text-muted-foreground">
                      Hôm nay bạn không có ca làm việc nào được lên lịch.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Shift ended warning */}
        {ctx?.hasShift && !shiftWindowValid && !ctx?.isBlocked && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.25,
              ease: [0.22, 1, 0.36, 1],
            }}
            className="mb-6"
          >
            <Card
              style={{
                borderColor:
                  "color-mix(in srgb, var(--warning) 50%, transparent)",
              }}
            >
              <CardContent className="pt-6">
                <div
                  className="flex items-center gap-3"
                  style={{ color: "var(--warning)" }}
                >
                  <Clock className="h-5 w-5 shrink-0" />
                  <div>
                    <p className="font-medium">Ngoài khung giờ cho phép</p>
                    <p className="text-sm text-muted-foreground">
                      Ca làm {ctx?.shift.startTime} — {ctx?.shift.endTime} đã
                      kết thúc. Không thể chấm công lúc này.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Clock Card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="mb-6"
        >
          <Card>
            <CardContent className="pt-6">
              <AttendanceClock status={attendanceStatus} />

              {isLoading ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Ca làm: 00:00:00 — 00:00:00 (0h 0m)</span>
                </div>
              ) : !isLoading && !ctx?.hasShift ? (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="h-4 w-4" />
                  <span>Bạn không có ca làm việc hôm nay</span>
                </div>
              ) : (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mb-4">
                  <Clock className="h-4 w-4" />
                  <span>
                    Ca làm: {ctx?.shift.startTime} — {ctx?.shift.endTime} (
                    {formatMinutesToHM(ctx?.totalWorkMinutes)})
                  </span>
                </div>
              )}

              <div className="flex items-center justify-center gap-3 pb-2">
                <Button
                  size="lg"
                  onClick={() => handleOpenDialog("check-in")}
                  title={
                    !canAccess("ATTENDANCE_RECORD")
                      ? "Bạn chưa được cấp quyền chấm công"
                      : ""
                  }
                  disabled={
                    checkInDisabled ||
                    isSubmit ||
                    !canAccess("ATTENDANCE_RECORD")
                  }
                  className="gap-2 min-w-[140px]"
                >
                  <LogIn className="h-4 w-4" />
                  Check In
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  title={
                    !canAccess("ATTENDANCE_RECORD")
                      ? "Bạn chưa được cấp quyền chấm công"
                      : ""
                  }
                  onClick={() => handleOpenDialog("check-out")}
                  disabled={
                    checkOutDisabled ||
                    isSubmit ||
                    !canAccess("ATTENDANCE_RECORD")
                  }
                  className="gap-2 min-w-[140px]"
                >
                  <LogOut className="h-4 w-4" />
                  Check Out
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Stat Cards */}
        <div className="mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.35,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tổng hôm nay
                  </CardTitle>
                  <Clock className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                    {stats.totalHours}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.4,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Vào lúc
                  </CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                    {stats.firstIn}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.45,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Ra lúc
                  </CardTitle>
                  <Timer className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                    {stats.firstOut}
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.5,
                ease: [0.22, 1, 0.36, 1],
              }}
            >
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    Tăng ca
                  </CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold tabular-nums">
                    {stats.overtime}
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.55, ease: [0.22, 1, 0.36, 1] }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Hoạt động gần đây</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentActivity activities={activities} />
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Biometric registration dialog */}
      <BiometricRequiredDialog
        open={biometricDialogOpen}
        onOpenChange={setBiometricDialogOpen}
        onRegister={handleRegisterBiometric}
      />

      {/* Check-in/out Dialog */}
      <CheckInDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        mode={dialogMode}
        securityConfig={ctx?.security}
        onSuccess={handleCapture}
      />
    </div>
  );
};

export default Index;
