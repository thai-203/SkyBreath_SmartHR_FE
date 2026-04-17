"use client";

/**
 * page.jsx — Face Register Page
 *
 * Chỉ đóng vai trò orchestrator:
 * - Quản lý state (view: idle | registering)
 * - Fetch dữ liệu
 * - Điều phối giữa RegisteredFaceTable và FaceRegister
 *
 * Không chứa logic UI phức tạp — đã tách ra components riêng.
 */

import { useEffect, useState, useCallback } from "react";
import { useToast } from "@/components/common/Toast";
import { faceService, faceRecognitionService } from "@/services";
import { Button } from "@/components/common/Button";
import RegisteredFaceTable from "./components/registeredFaceTable";
import FaceRegister from "./components/faceRegister";

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function dataURLToBlob(dataURL) {
  const res = await fetch(dataURL);
  return await res.blob();
}

// ─── View state machine ───────────────────────────────────────────────────────
// "idle"        → hiển thị danh sách hoặc empty state
// "registering" → hiển thị camera + FaceRegister
const VIEW = Object.freeze({
  IDLE: "idle",
  REGISTERING: "registering",
});

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function FaceRegisterPage() {
  const { success, error } = useToast();

  const [registeredFaces, setRegisteredFaces] = useState([]);

  // 3 trạng thái loading tách biệt để UI phản hồi chính xác
  const [loadingPage, setLoadingPage] = useState(true);
  const [loadingFaces, setLoadingFaces] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [view, setView] = useState(VIEW.IDLE);
  const [captured, setCaptured] = useState([]);
  const [faceConfig, setFaceConfig] = useState(null);

  const isRegistering = view === VIEW.REGISTERING;
  const completed = captured.length > 0; // FaceRegister đã gọi onComplete

  // ─── Fetch danh sách khuôn mặt ─────────────────────────────────────────

  const fetchFaceMetadata = useCallback(async () => {
    try {
      const res = await faceRecognitionService.getConfigForPublic();

      setFaceConfig(res?.data);
    } catch (err) {
      console.error("[FaceRegisterPage] fetchFaceMetadata:", err);
    }
  }, []);

  const fetchRegisteredFaces = useCallback(async () => {
    setLoadingFaces(true);
    try {
      const result = await faceService.getRegisteredFaces();
      setRegisteredFaces(result?.data ?? []);
    } catch (err) {
      console.error("[FaceRegisterPage] fetchRegisteredFaces:", err);
      error(
        err?.response?.data?.message ??
          "Không thể tải danh sách khuôn mặt đã đăng ký",
      );
    } finally {
      setLoadingFaces(false);
    }
  }, [error]);

  // ─── Init: lấy employee hiện tại + faces ───────────────────────────────

  useEffect(() => {
    let mounted = true;

    const init = async () => {
      try {
        await fetchFaceMetadata();
        await fetchRegisteredFaces();
      } catch (err) {
        console.error("[FaceRegisterPage] init:", err);
      } finally {
        if (mounted) setLoadingPage(false);
      }
    };

    init();

    return () => {
      mounted = false;
    };
  }, [fetchRegisteredFaces]);

  // ─── Start / cancel ─────────────────────────────────────────────────────

  const handleStartRegister = useCallback(() => {
    setCaptured([]);
    setView(VIEW.REGISTERING);
  }, []);

  const handleCancelRegister = useCallback(() => {
    // FaceRegister sẽ unmount → useEffect cleanup tự tắt camera
    setCaptured([]);
    setView(VIEW.IDLE);
  }, []);

  // ─── FaceRegister callback: nhận ảnh khi hoàn tất 5 bước ───────────────

  const handleCaptureComplete = useCallback((images) => {
    setCaptured(images);
  }, []);

  // ─── Submit ─────────────────────────────────────────────────────────────

  const handleSubmit = useCallback(async () => {
    if (!completed || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const blobs = await Promise.all(
        captured.map((entry) => dataURLToBlob(entry.image)),
      );
      await faceService.registerFaces(blobs);

      success("Đăng ký khuôn mặt hoàn tất");

      // Refresh danh sách
      await fetchRegisteredFaces();

      // Quay về idle
      setCaptured([]);
      setView(VIEW.IDLE);
    } catch (err) {
      console.error("[FaceRegisterPage] handleSubmit:", err);
      error(err?.response?.data?.message ?? "Đăng ký khuôn mặt thất bại");
    } finally {
      setIsSubmitting(false);
    }
  }, [captured, completed, isSubmitting, success, error, fetchRegisteredFaces]);

  // ─── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Đăng ký khuôn mặt
          </h1>
          <p className="text-sm text-slate-500">
            Nếu bạn chưa đăng ký, hãy làm theo hướng dẫn để ghi nhận khuôn mặt.
          </p>
        </div>
      </div>

      {/* Page loading */}
      {loadingPage && (
        <div className="rounded-lg border border-slate-200 bg-white p-6 text-center">
          <p className="text-sm text-slate-500">Đang tải thông tin...</p>
        </div>
      )}

      {/* Idle: hiển thị bảng khuôn mặt */}
      {!loadingPage && !isRegistering && (
        <RegisteredFaceTable
          faces={registeredFaces}
          loading={loadingFaces}
          onStartRegister={handleStartRegister}
        />
      )}

      {/* Registering: camera + actions */}
      {!loadingPage && isRegistering && (
        <div className="rounded-lg border border-slate-200 bg-white p-6">
          {/*
            FaceRegister unmount → useEffect cleanup chạy → camera.stop() + faceMesh.close()
            Điều này xảy ra khi:
              - Người dùng bấm "Hủy" (isRegistering = false)
              - Navigate sang page khác (component unmount)
          */}
          <FaceRegister
            config={faceConfig}
            onComplete={handleCaptureComplete}
          />

          <div className="mt-6 flex flex-wrap items-center gap-2">
            <Button
              variant="outline"
              onClick={handleCancelRegister}
              disabled={isSubmitting}
            >
              Hủy
            </Button>

            <Button
              onClick={handleSubmit}
              disabled={!completed || isSubmitting}
              loading={isSubmitting}
            >
              Hoàn tất đăng ký
            </Button>

            <span className="text-sm text-slate-500">
              {completed
                ? `✓ Đã chụp đủ ${captured.length} ảnh`
                : "Chưa chụp đủ các tư thế"}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
