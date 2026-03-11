"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { AlertCircle, Camera, ChevronLeft } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import { faceRecognitionService } from "@/services";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import FaceRecognitionConfigForm from "./components/FaceRecognitionConfigForm";
import { PageTitle } from "@/components/common/PageTitle";
import { useRouter } from "next/navigation";

export default function FaceRecognitionPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  // State
  const [config, setConfig] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});

  // Load config on mount
  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await faceRecognitionService.getConfig();
      const loadedConfig = data.data || data;
      setConfig(loadedConfig);
      setSavedConfig(loadedConfig);
      setErrors({});
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          "Không thể tải cấu hình nhận diện khuôn mặt",
      );
      console.error(err);

      // Set default values if load fails
      const defaultConfig = {
        recognitionThreshold: 0.6,
        similarityMetric: "cosine",
        maxEmbeddingsPerUser: 5,
        spoofThreshold: 0.8,
        livenessMode: "MULTI_FRAME",
        requiredFrames: 10,
        captureIntervalMs: 1000,
        faceDetectionMinSize: 80,
        maxFacesAllowed: 1,
        arcfaceModelName: "buffalo_l",
        antiSpoofModelVersion: null,
        saveAttendanceImage: true,
      };
      setConfig(defaultConfig);
      setSavedConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    setErrors({});
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setErrors({});

      // Validate inputs
      const validationErrors = {};

      if (
        !config.recognitionThreshold ||
        config.recognitionThreshold < 0 ||
        config.recognitionThreshold > 1
      ) {
        validationErrors.recognitionThreshold = "Ngưỡng phải từ 0 đến 1";
      }

      if (
        !config.spoofThreshold ||
        config.spoofThreshold < 0 ||
        config.spoofThreshold > 1
      ) {
        validationErrors.spoofThreshold = "Ngưỡng phải từ 0 đến 1";
      }

      if (!config.maxEmbeddingsPerUser || config.maxEmbeddingsPerUser < 1) {
        validationErrors.maxEmbeddingsPerUser = "Phải lớn hơn 0";
      }

      if (!config.requiredFrames || config.requiredFrames < 1) {
        validationErrors.requiredFrames = "Phải lớn hơn 0";
      }

      if (!config.captureIntervalMs || config.captureIntervalMs < 100) {
        validationErrors.captureIntervalMs = "Phải lớn hơn 100ms";
      }

      if (!config.faceDetectionMinSize || config.faceDetectionMinSize < 20) {
        validationErrors.faceDetectionMinSize = "Phải lớn hơn 20px";
      }

      if (!config.maxFacesAllowed || config.maxFacesAllowed < 1) {
        validationErrors.maxFacesAllowed = "Phải lớn hơn 0";
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toastError("Vui lòng kiểm tra lại các giá trị nhập");
        return;
      }

      // Call API to save config
      const response = await faceRecognitionService.updateConfig(config);
      const saved = response.data || response;
      setConfig(saved);
      setSavedConfig(saved);
      toastSuccess("Cấu hình nhận diện khuôn mặt đã được lưu thành công");
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể lưu cấu hình");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const requestReset = () => {
    setIsResetModalOpen(true);
  };

  const isDirty = useMemo(() => {
    if (!savedConfig || !config) return false;

    try {
      return JSON.stringify(savedConfig) !== JSON.stringify(config);
    } catch {
      return false;
    }
  }, [savedConfig, config]);

  const performReset = async () => {
    setIsResetModalOpen(false);
    try {
      setSaving(true);
      const response = await faceRecognitionService.resetToDefaults();
      const resetConfig = response.data || response;
      setConfig(resetConfig);
      setSavedConfig(resetConfig);
      setErrors({});
      toastSuccess("Cấu hình đã được đặt lại về mặc định");
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể đặt lại cấu hình");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const router = useRouter();

  const goBack = () => {
    router.push("/configurations");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle
          icon={Camera}
          title="Cấu Hình Nhận Diện Khuôn Mặt"
          description="Quản lý cài đặt nhận diện khuôn mặt và chống giả mạo"
        />

        {/* header skeleton */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>

        <Skeleton className="h-96" />
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        icon={Camera}
        title="Cấu Hình Nhận Diện Khuôn Mặt"
        description="Quản lý cài đặt nhận diện khuôn mặt và chống giả mạo"
      />

      {isDirty && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-amber-800 flex items-center gap-2">
            <AlertCircle className="text-yellow-500" size={20} />
            <p className="font-medium d-flex">Bạn có thay đổi chưa lưu</p>
          </div>
        </div>
      )}

      {/* header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Cấu Hình Nhận Diện Khuôn Mặt
          </h1>
          <p className="text-slate-500">
            Quản lý cài đặt nhận diện khuôn mặt và chống giả mạo
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="outline" onClick={goBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại cấu hình
          </Button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Thông tin quan trọng:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>Các thay đổi sẽ áp dụng cho tất cả các phiên nhận diện mới</li>
            <li>
              Ngưỡng nhận diện cao hơn = yêu cầu khớp tốt hơn nhưng ít chính xác
              hơn
            </li>
            <li>
              Các mô hình lớn hơn có độ chính xác cao hơn nhưng xử lý chậm hơn
            </li>
          </ul>
        </div>
      </div>

      {/* Form */}
      {config && (
        <FaceRecognitionConfigForm
          config={config}
          onConfigChange={handleConfigChange}
          onSubmit={handleSubmit}
          loading={saving}
          errors={errors}
          onResetRequest={requestReset}
        />
      )}

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={performReset}
        title="Đặt lại cấu hình về mặc định"
        description="Hành động này sẽ khôi phục tất cả cài đặt nhận diện khuôn mặt về giá trị mặc định. Bạn có chắc chắn?"
        confirmText="Đặt lại"
        cancelText="Hủy"
        loading={saving}
      />
    </div>
  );
}
