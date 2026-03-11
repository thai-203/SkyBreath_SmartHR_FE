"use client";

/**
 * RegisteredFaceTable.jsx
 *
 * Hiển thị danh sách khuôn mặt đã đăng ký của nhân viên.
 * Tách thành component độc lập để page.jsx gọn hơn.
 */

import React from "react";
import { Button } from "@/components/common/Button";

// ─── Helpers ──────────────────────────────────────────────────────────────────

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3000";

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

/** Skeleton placeholder khi đang load */
function FaceItemSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[auto_1fr] sm:items-center animate-pulse">
      <div className="flex items-center gap-3">
        <div className="h-16 w-16 rounded-lg bg-slate-200" />
        <div className="space-y-2">
          <div className="h-3 w-32 rounded bg-slate-200" />
          <div className="h-3 w-48 rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}

/** Card hiển thị 1 khuôn mặt */
const FaceItem = React.memo(({ face, index }) => {
  const imageUrl = face.imageUrl ? `${API_BASE}${face.imageUrl}` : null;

  return (
    <div
      key={face.id}
      className="grid grid-cols-1 gap-3 rounded-lg bg-slate-50 p-3 sm:grid-cols-[auto_1fr] sm:items-center"
    >
      <div className="flex items-center gap-3">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={`Khuôn mặt ${index + 1}`}
            className="h-16 w-16 rounded-lg object-cover"
            loading="lazy"
            onError={(e) => {
              // Fallback nếu ảnh load lỗi
              e.currentTarget.style.display = "none";
              e.currentTarget.nextSibling?.removeAttribute("style");
            }}
          />
        ) : null}

        {/* Fallback placeholder — hidden khi ảnh load thành công */}
        <div
          className="h-16 w-16 rounded-lg bg-slate-200 flex items-center justify-center text-slate-400 text-xs"
          style={imageUrl ? { display: "none" } : undefined}
          aria-hidden={!!imageUrl}
        >
          N/A
        </div>

        <div className="text-sm text-slate-700">
          <p className="m-0">
            <span className="font-semibold">Mẫu #{index + 1}</span>
          </p>
          <p className="m-0 mt-0.5">
            <span className="font-semibold">Đăng ký:</span>{" "}
            {formatDateTime(face.registeredAt)}
          </p>
          {face.imageUrl && (
            <p className="mt-1 break-all text-xs text-slate-400 m-0">
              {face.imageUrl}
            </p>
          )}
        </div>
      </div>
    </div>
  );
});
FaceItem.displayName = "FaceItem";

// ─── Main component ────────────────────────────────────────────────────────────

/**
 * @param {object}   props
 * @param {Array}    props.faces           - Danh sách face objects từ API
 * @param {boolean}  props.loading         - Đang fetch
 * @param {Function} props.onStartRegister - Callback khi bấm "Đăng ký khuôn mặt"
 */
export default function RegisteredFaceTable({
  faces = [],
  loading = false,
  onStartRegister,
}) {
  // Số skeleton cần render khi loading
  const SKELETON_COUNT = 2;

  const hasFaces = faces.length > 0;

  const faceList = faces.map((face, i) => (
    <FaceItem key={face.id ?? i} face={face} index={i} />
  ));

  // ── Loading state ───────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6">
        <div className="h-5 w-40 rounded bg-slate-200 animate-pulse mb-2" />
        <div className="h-3 w-56 rounded bg-slate-200 animate-pulse mb-4" />
        <div className="space-y-3">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <FaceItemSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────

  if (!hasFaces) {
    return (
      <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
        <p className="text-base text-slate-600">
          Chưa có khuôn mặt nào được đăng ký.
        </p>
        <Button className="mt-4" onClick={onStartRegister}>
          Đăng ký khuôn mặt
        </Button>
      </div>
    );
  }

  // ── Has data ────────────────────────────────────────────────────────────

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-6">
      <div className="flex items-center justify-between mb-1">
        <h2 className="text-lg font-semibold text-slate-800">
          Khuôn mặt đã đăng ký
        </h2>
        <Button variant="outline" size="sm" onClick={onStartRegister}>
          Đăng ký lại
        </Button>
      </div>

      <p className="text-sm text-slate-500 mb-4">
        Hệ thống đã ghi nhận <strong>{faces.length}</strong> mẫu khuôn mặt.
      </p>

      <div className="space-y-3">{faceList}</div>
    </div>
  );
}
