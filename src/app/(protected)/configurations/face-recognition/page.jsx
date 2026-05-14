"use client";

import React, { useState, useEffect } from "react";
import ConfigurationsLayout from "../layout";
import ConfigurationsForm from "./components/FaceRecognitionConfigForm";
import ConfirmModal from "./components/ConfirmModal";
import { faceRecognitionService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { useRouter } from "next/navigation";

const DEFAULT_CONFIG = {
  recognitionThreshold: 0.6,
  maxEmbeddingsPerUser: 5,
  spoofThreshold: 0.8,
  livenessMode: "SINGLE_FRAME",
  requiredFrames: 1,
  captureIntervalMs: 1000,
  faceDetectionMinSize: 80,
  maxFacesAllowed: 1,
  arcfaceModelName: "buffalo_l",
  antiSpoofModelVersion: "modelrgb.onnx",
  saveAttendanceImage: true,
};

export default function ConfigurationsPage() {
  const router = useRouter();
  const { success, error } = useToast();
  const [config, setConfig] = useState({ ...DEFAULT_CONFIG });
  const [savedConfig, setSavedConfig] = useState({ ...DEFAULT_CONFIG });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);

  // ── Load Config from API ──
  useEffect(() => {
    const loadConfig = async () => {
      try {
        setLoading(true);
        const data = await faceRecognitionService.getConfig();
        const loadedConfig = data.data || data;
        setConfig(loadedConfig);
        setSavedConfig(loadedConfig);
      } catch (err) {
        error("Không thể tải cấu hình, sử dụng mặc định");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const handleSave = async (validConfig) => {
    setSaving(true);
    try {
      const response = await faceRecognitionService.updateConfig(validConfig);
      const saved = response.data || response;
      setConfig(saved);
      setSavedConfig(saved);
      success("Cấu hình đã được lưu thành công");
    } catch (error) {
      error("Đã xảy ra lỗi khi lưu cấu hình");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = async () => {
    try {
      setSaving(true);
      const response = await faceRecognitionService.resetToDefaults();
      const resetConfig = response.data || response;
      setConfig(resetConfig);
      setSavedConfig(resetConfig);
      setResetModalOpen(false);
      success("Đã đặt lại cấu hình về mặc định");
    } catch (error) {
      error("Đã xảy ra lỗi khi khôi phục cấu hình");
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <ConfigurationsLayout>
        <div className="flex justify-center p-12 text-muted-foreground">
          Đang tải cấu hình...
        </div>
      </ConfigurationsLayout>
    );
  }

  return (
    <ConfigurationsLayout>
      <ConfigurationsForm
        router={router}
        config={config}
        savedConfig={savedConfig}
        onChange={setConfig}
        onSave={handleSave}
        saving={saving}
        onResetRequest={() => setResetModalOpen(true)}
      />

      <ConfirmModal
        open={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        onConfirm={handleReset}
        loading={saving}
        message="Hành động này sẽ khôi phục tất cả cài đặt nhận diện khuôn mặt về giá trị mặc định ban đầu. Bạn có chắc chắn muốn tiếp tục?"
      />
    </ConfigurationsLayout>
  );
}
