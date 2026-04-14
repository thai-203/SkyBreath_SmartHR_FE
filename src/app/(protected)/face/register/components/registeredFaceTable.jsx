"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Camera,
  Clock,
  Image as ImageIcon,
  UserCircle,
  Sparkles,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { PermissionGate } from "@/components/common/AuthGuard";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDateTime(dateStr) {
  if (!dateStr) return "—";
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return dateStr;
  }
}

// ─── Sub-components ────────────────────────────────────────────────────────────

function FaceItemSkeleton({ index }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.3 }}
    >
      <div className="group relative overflow-hidden rounded-xl border border-border/50 bg-card/60 backdrop-blur-sm">
        <Skeleton className="aspect-square w-full" />
        <div className="p-3 space-y-2">
          <Skeleton className="h-4 w-20" />
          <Skeleton className="h-3 w-32" />
        </div>
      </div>
    </motion.div>
  );
}

const FaceItem = React.memo(function FaceItem({ face, index, apiBase }) {
  const imageUrl = face.imageUrl ? `${apiBase}${face.imageUrl}` : null;
  const [imgError, setImgError] = React.useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.92, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        delay: index * 0.07,
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group"
    >
      <div className="relative overflow-hidden rounded-xl border border-border/40 bg-card/80 backdrop-blur-md shadow-card transition-all duration-300 group-hover:shadow-elevated group-hover:border-primary/30">
        {/* Image area */}
        <div className="relative aspect-square overflow-hidden bg-muted/30">
          {imageUrl && !imgError ? (
            <img
              src={imageUrl}
              alt={`Mẫu khuôn mặt #${index + 1}`}
              className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
              onError={() => setImgError(true)}
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-muted/40 to-muted/80">
              <UserCircle
                className="h-16 w-16 text-muted-foreground/30"
                strokeWidth={1}
              />
            </div>
          )}

          {/* Overlay gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-card/90 via-transparent to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

          {/* Index badge */}
          <Badge
            variant="secondary"
            className="absolute top-2.5 left-2.5 bg-card/80 backdrop-blur-sm text-xs font-medium border-border/30 shadow-sm"
          >
            #{index + 1}
          </Badge>

          {/* Verified indicator */}
          <div className="absolute top-2.5 right-2.5 flex h-7 w-7 items-center justify-center rounded-full bg-success/90 text-success-foreground shadow-sm">
            <ShieldCheck className="h-3.5 w-3.5" />
          </div>
        </div>

        {/* Info area */}
        <div className="p-3.5 space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-semibold text-foreground">
              Mẫu #{index + 1}
            </span>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3 flex-shrink-0" />
            <span>{formatDateTime(face.registeredAt)}</span>
          </div>
        </div>
      </div>
    </motion.div>
  );
});

// ─── Main Component ────────────────────────────────────────────────────────────

export default function RegisteredFaceTable({
  faces = [],
  loading = false,
  onStartRegister,
  apiBase = "",
}) {
  const SKELETON_COUNT = 4;
  const hasFaces = faces.length > 0;

  // ── Loading ─────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-card overflow-hidden">
        <div className="p-6 space-y-5">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-xl" />
            <div className="space-y-2">
              <Skeleton className="h-5 w-48" />
              <Skeleton className="h-3 w-32" />
            </div>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
              <FaceItemSkeleton key={i} index={i} />
            ))}
          </div>
        </div>
      </Card>
    );
  }

  // ── Empty ───────────────────────────────────────────────────────────────

  if (!hasFaces) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      >
        <Card className="border-dashed border-2 border-border/50 bg-card/40 backdrop-blur-md shadow-card overflow-hidden">
          <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <motion.div
              initial={{ scale: 0.8 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
              className="mb-5 flex h-20 w-20 items-center justify-center rounded-2xl bg-primary/10"
            >
              <Camera className="h-9 w-9 text-primary" />
            </motion.div>
            <h3 className="text-lg font-semibold text-foreground mb-1.5">
              Chưa có dữ liệu khuôn mặt
            </h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-xs">
              Đăng ký khuôn mặt để hệ thống nhận diện tự động khi chấm công
            </p>
            {onStartRegister && (
              <PermissionGate
                fallback={<>Bạn không có quyền thực hiện thao tác này</>}
                permission="ATTENDANCE_FACE_DATA_REGISTER"
              >
                <Button onClick={onStartRegister} className="gap-2">
                  <Sparkles className="h-4 w-4" />
                  Đăng ký khuôn mặt
                </Button>
              </PermissionGate>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // ── Has data ────────────────────────────────────────────────────────────

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="border-border/40 bg-card/60 backdrop-blur-md shadow-card overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-2">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10">
              <ImageIcon className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-foreground">
                Khuôn mặt đã đăng ký
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {faces.length} mẫu đã ghi nhận
              </p>
            </div>
          </div>
          <Badge
            variant="outline"
            className="gap-1.5 border-success/30 text-success bg-success/5"
          >
            <ShieldCheck className="h-3 w-3" />
            Đã xác minh
          </Badge>
        </div>

        {/* Grid */}
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            <AnimatePresence mode="popLayout">
              {faces?.map((face, i) => (
                <FaceItem
                  key={face.imageUrl || i}
                  face={face}
                  index={i}
                  apiBase={apiBase}
                />
              ))}
            </AnimatePresence>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
