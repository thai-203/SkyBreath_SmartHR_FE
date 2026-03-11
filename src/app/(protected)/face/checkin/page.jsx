"use client";

import { useEffect, useRef, useState } from "react";
import Webcam from "react-webcam";
import * as faceapi from "face-api.js";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/common/Button";
import { faceRecognitionService, faceService } from "@/services";

const MODEL_URL = "https://justadudewhohacks.github.io/face-api.js/models";

export default function FaceCheckInPage() {
  const { success, error } = useToast();
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);
  const [photoBlob, setPhotoBlob] = useState(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [maxFacesAllowed, setMaxFacesAllowed] = useState(1);
  const [statusMessage, setStatusMessage] = useState("Đang tải... hãy chờ");
  const consecutiveOkFrames = useRef(0);

  useEffect(() => {
    const init = async () => {
      try {
        const config = await faceRecognitionService.getConfig();
        setMaxFacesAllowed(config?.maxFacesAllowed ?? 1);
      } catch (err) {
        console.warn("Cannot load face config", err);
      }

      try {
        await Promise.all([
          faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
          faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
        ]);
        setModelsLoaded(true);
      } catch (err) {
        console.error("Failed to load face-api models", err);
        error("Không thể tải mô hình nhận diện khuôn mặt");
      }
    };

    init();
  }, []);

  useEffect(() => {
    if (!modelsLoaded || !webcamRef.current?.video) return;

    const interval = setInterval(async () => {
      const videoEl = webcamRef.current?.video;
      if (!videoEl || videoEl.readyState !== 4) return;

      const detections = await faceapi.detectAllFaces(
        videoEl,
        new faceapi.TinyFaceDetectorOptions(),
      );

      const faceCount = detections.length;

      if (faceCount === maxFacesAllowed) {
        setStatusMessage(
          `Phát hiện ${faceCount} khuôn mặt. Tự động chụp sau 1s...`,
        );
        consecutiveOkFrames.current += 1;
      } else {
        setStatusMessage(
          `Phát hiện ${faceCount} khuôn mặt. Vui lòng điều chỉnh để chỉ còn ${maxFacesAllowed}.`,
        );
        consecutiveOkFrames.current = 0;
      }

      if (consecutiveOkFrames.current >= 3 && !photoBlob) {
        capture();
      }
    }, 500);

    return () => clearInterval(interval);
  }, [modelsLoaded, maxFacesAllowed, photoBlob]);

  const capture = () => {
    const video = webcamRef.current?.video;
    if (!video || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const context = canvas.getContext("2d");

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    context.drawImage(video, 0, 0, canvas.width, canvas.height);

    canvas.toBlob((blob) => {
      if (blob) {
        setPhotoBlob(blob);
        setIsCapturing(true);
      }
    }, "image/jpeg", 0.9);
  };

  const retake = () => {
    setPhotoBlob(null);
    setIsCapturing(false);
    consecutiveOkFrames.current = 0;
  };

  const handleCheckIn = async () => {
    if (!photoBlob) {
      error("Vui lòng chụp ảnh trước khi điểm danh");
      return;
    }

    setSaving(true);
    try {
      const result = await faceService.checkIn(photoBlob);
      if (result.success) {
        success("Điểm danh thành công");
      } else {
        error(result.message || "Điểm danh thất bại");
      }
      retake();
    } catch (err) {
      console.error(err);
      error(err?.response?.data?.message || "Điểm danh thất bại");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Điểm danh bằng khuôn mặt</h1>
          <p className="text-sm text-slate-500">Chụp khuôn mặt để điểm danh nhanh chóng.</p>
        </div>
        <div className="text-sm text-slate-500">{statusMessage}</div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Camera</h2>
          <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-black">
            <Webcam
              ref={webcamRef}
              audio={false}
              mirrored
              videoConstraints={{ facingMode: "user" }}
              className="h-72 w-full object-cover"
            />
            <canvas ref={canvasRef} className="hidden" />
          </div>
          <div className="mt-4 flex gap-2">
            <Button onClick={capture} disabled={!modelsLoaded || photoBlob}>
              Chụp ảnh
            </Button>
            {photoBlob && (
              <Button variant="outline" onClick={retake}>
                Chụp lại
              </Button>
            )}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-slate-800 mb-3">Xem trước</h2>
          {photoBlob ? (
            <img
              src={URL.createObjectURL(photoBlob)}
              alt="Preview"
              className="h-72 w-full rounded-lg object-cover"
            />
          ) : (
            <div className="flex h-72 items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50">
              <p className="text-sm text-slate-500">Chưa có ảnh</p>
            </div>
          )}

          <div className="mt-4">
            <Button onClick={handleCheckIn} loading={saving} disabled={!photoBlob}>
              Điểm danh
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
