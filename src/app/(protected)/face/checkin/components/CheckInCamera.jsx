import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, User, Loader2 } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const CAMERA_WIDTH = 1280;
const CAMERA_HEIGHT = 960;
const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe";
const FACE_MESH_SRC = `${CDN}/face_mesh/face_mesh.js`;
const CAMERA_UTILS_SRC = `${CDN}/camera_utils/camera_utils.js`;
const SMOOTH_WINDOW = 5;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve();
    s.onerror = () => resolve();
    document.body.appendChild(s);
  });
}

function waitFor(predicate, intervalMs = 100) {
  return new Promise((resolve) => {
    const id = setInterval(() => {
      if (predicate()) {
        clearInterval(id);
        resolve();
      }
    }, intervalMs);
  });
}

function detectPoseFromLandmarks(lm) {
  const nose = lm[1],
    leftEye = lm[33],
    rightEye = lm[263],
    chin = lm[152],
    forehead = lm[10];
  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const midFaceY = (chin.y + forehead.y) / 2;
  const diffX = nose.x - eyeCenterX;
  const diffY = nose.y - midFaceY;
  const eyeDist = Math.abs(leftEye.x - rightEye.x);
  const faceHeight = Math.abs(chin.y - forehead.y);
  const normX = diffX / Math.max(eyeDist, 0.01);
  const normY = diffY / Math.max(faceHeight, 0.01);

  if (Math.abs(normX) < 0.85 && Math.abs(normY) < 0.7) return "center";
  return null;
}

function isEyeDistSufficient(lm, minSize) {
  const eyeDistPx = Math.abs(lm[33].x - lm[263].x) * CAMERA_WIDTH;
  return eyeDistPx >= minSize * 0.32;
}

// ─── Status Display ───────────────────────────────────────────────────────────

const STATUS_CONFIG = {
  initializing: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    label: "Đang khởi tạo camera...",
    color: "text-muted-foreground",
    bgColor: "bg-muted",
  },
  "no-face": {
    icon: <User className="h-5 w-5" />,
    label: "Không tìm thấy khuôn mặt",
    color: "text-[var(--warning)]",
    bgColor: "bg-[color-mix(in_srgb,var(--warning)_10%,transparent)]",
  },
  "face-found": {
    icon: <User className="h-5 w-5" />,
    label: "Đã tìm thấy khuôn mặt",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  scanning: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    label: "Đang nhận diện...",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  success: {
    icon: <CheckCircle2 className="h-5 w-5" />,
    label: "Nhận diện thành công!",
    color: "text-[var(--success)]",
    bgColor: "bg-[color-mix(in_srgb,var(--success)_10%,transparent)]",
  },
  submitting: {
    icon: <Loader2 className="h-5 w-5 animate-spin" />,
    label: "Đang nhận diện...",
    color: "text-primary",
    bgColor: "bg-primary/10",
  },
  error: {
    icon: <AlertCircle className="h-5 w-5" />,
    label: "Có lỗi xảy ra",
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};
// ─── Main Component ───────────────────────────────────────────────────────────

export default function CheckInCamera({ config, onCapture }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const maxFaces = config?.maxFacesAllowed ?? 1;
  const requiredFrames = config?.requiredFrames ?? 10;
  const captureIntervalMs = config?.captureIntervalMs ?? 1000;
  const faceMinSize = config?.faceDetectionMinSize ?? 80;
  const livenessMode = config?.livenessMode ?? "SINGLE_FRAME";

  const [status, setStatus] = useState("initializing");
  const [scanProgress, setScanProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);

  // Thêm vào internals.current
  const internals = useRef({
    faceMesh: null,
    camera: null,
    running: false,
    lastSend: 0,
    centerFrameCount: 0,
    lastCaptureTime: 0,
    completed: false,
    poseHistory: [],
    poseCounts: new Map(),
    capturedFrames: [],
  });

  const statusRef = useRef("initializing");

  const teardown = useCallback(() => {
    const r = internals.current;
    r.running = false;
    if (r.camera) {
      try {
        r.camera.stop();
      } catch {}
      r.camera = null;
    }
    if (r.faceMesh) {
      try {
        r.faceMesh.close();
      } catch {}
      r.faceMesh = null;
    }
  }, []);

  const getSmoothedPose = useCallback((newPose) => {
    const r = internals.current;
    r.poseHistory.push(newPose);
    if (r.poseHistory.length > SMOOTH_WINDOW) r.poseHistory.shift();
    r.poseCounts.clear();
    let centerCount = 0;
    let nullCount = 0;
    for (const p of r.poseHistory) {
      if (p === "center") centerCount++;
      else nullCount++;
    }
    return centerCount > nullCount ? "center" : null;
  }, []);

  const getHighQualitySnap = useCallback(() => {
    const video = webcamRef.current?.video;
    if (!video) return null;
    if (!canvasRef.current)
      canvasRef.current = document.createElement("canvas");
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d", { alpha: false });
    ctx?.drawImage(video, 0, 0, canvas.width, canvas.height);

    // Tạo canvas riêng để lưu snapshot (tránh bị overwrite frame tiếp theo)
    const snapshot = document.createElement("canvas");
    snapshot.width = canvas.width;
    snapshot.height = canvas.height;
    snapshot.getContext("2d").drawImage(canvas, 0, 0);
    return snapshot; // ← trả canvas element, không phải blob/base64
  }, []);

  // handleCapture — nhận array canvas, convert sang Blob tại đây
  const handleCapture = useCallback(
    async (snapshots) => {
      if (internals.current.completed) return;
      internals.current.completed = true;
      setStatus("submitting");

      try {
        console.log("=== BẮT ĐẦU onCapture ===");
        console.log("Số frames:", snapshots.length);
        console.time("onCapture");

        // Convert canvas array → Blob array
        const blobs = await Promise.all(
          snapshots.map(
            (canvas) =>
              new Promise((resolve) =>
                canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.95),
              ),
          ),
        );

        const result = await onCapture(blobs);

        console.timeEnd("onCapture");
        console.log("Kết quả:", result);

        if (result?.success) {
          setStatus("success");
          statusRef.current = "success";
        } else {
          setStatus("error");
          setErrorMessage(result?.message || "Thất bại");
        }
      } catch (err) {
        console.error("=== LỖI onCapture ===", err);
        setStatus("error");
        setErrorMessage(`Lỗi: ${err.message || err}`);
      }
    },
    [onCapture],
  );

  const handleCaptureRef = useRef(handleCapture);
  useEffect(() => {
    handleCaptureRef.current = handleCapture;
  }, [handleCapture]);

  const onResults = useCallback(
    (results) => {
      const r = internals.current;
      if (r.completed) return;
      const curStatus = statusRef.current;
      if (curStatus === "submitting" || curStatus === "success") return;

      const faces = results.multiFaceLandmarks;

      if (!faces?.length) {
        r.centerFrameCount = 0;
        r.capturedFrames = []; // ← reset frames khi mất mặt
        setScanProgress(0);
        if (curStatus !== "no-face" && curStatus !== "initializing") {
          setStatus("no-face");
          statusRef.current = "no-face";
        }
        return;
      }

      if (faces.length > maxFaces) {
        r.centerFrameCount = Math.max(0, r.centerFrameCount - 1);
        r.capturedFrames = r.capturedFrames.slice(0, r.centerFrameCount); // ← sync frames
        setScanProgress((r.centerFrameCount / requiredFrames) * 100);
        if (curStatus !== "no-face" && curStatus !== "initializing") {
          setStatus("no-face");
          statusRef.current = "no-face";
        }
        return;
      }

      const lm0 = faces[0];
      if (!isEyeDistSufficient(lm0, faceMinSize)) {
        if (curStatus !== "no-face") {
          setStatus("no-face");
          statusRef.current = "no-face";
        }
        return;
      }

      const rawPose = detectPoseFromLandmarks(lm0);
      const smoothed = getSmoothedPose(rawPose);

      if (smoothed !== "center") {
        if (curStatus !== "face-found") {
          setStatus("face-found");
          statusRef.current = "face-found";
        }
        return;
      }

      const targetFrames = livenessMode === "SINGLE_FRAME" ? 1 : requiredFrames;

      if (livenessMode === "SINGLE_FRAME") {
        // Chụp ngay 1 ảnh và gửi dưới dạng array 1 phần tử
        r.centerFrameCount = 1;
        const image = getHighQualitySnap();
        if (image) {
          handleCaptureRef.current([image]); // ← wrap thành array
        }
        return;
      }

      // MULTI_FRAME — tích lũy từng frame theo interval
      const now = Date.now();
      if (now - r.lastCaptureTime < captureIntervalMs) {
        if (curStatus !== "scanning" && curStatus !== "face-found") {
          setStatus("face-found");
          statusRef.current = "face-found";
        }
        return;
      }

      // Đủ interval — chụp và lưu frame này
      r.lastCaptureTime = now;
      const snap = getHighQualitySnap();
      if (snap) {
        r.capturedFrames.push(snap); // ← lưu từng frame
      }
      r.centerFrameCount = r.capturedFrames.length;

      const progress = Math.min((r.centerFrameCount / targetFrames) * 100, 100);
      setScanProgress(progress);

      if (r.centerFrameCount >= 3 && curStatus !== "scanning") {
        setStatus("scanning");
        statusRef.current = "scanning";
      }

      // Đủ frames — gửi cả array
      if (r.centerFrameCount >= targetFrames) {
        handleCaptureRef.current([...r.capturedFrames]); // ← gửi array đủ frames
      }
    },
    [
      maxFaces,
      faceMinSize,
      captureIntervalMs,
      requiredFrames,
      livenessMode,
      getSmoothedPose,
      getHighQualitySnap,
    ],
  );

  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    let cancelled = false;
    const init = async () => {
      await Promise.all([
        loadScript(FACE_MESH_SRC),
        loadScript(CAMERA_UTILS_SRC),
      ]);
      await waitFor(() => window.FaceMesh && window.Camera);
      await waitFor(() => {
        const v = webcamRef.current?.video;
        return !!(v && v.readyState >= 2);
      }, 200);
      if (cancelled) return;
      const video = webcamRef.current?.video;
      if (!video) return;

      const faceMesh = new window.FaceMesh({
        locateFile: (file) => `${CDN}/face_mesh/${file}`,
      });
      faceMesh.setOptions({
        maxNumFaces: maxFaces,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });
      faceMesh.onResults((r) => onResultsRef.current(r));

      const camera = new window.Camera(video, {
        onFrame: async () => {
          const r = internals.current;
          if (!r.running || !r.faceMesh) return;
          const now = performance.now();
          if (now - r.lastSend < 80) return;
          r.lastSend = now;
          try {
            await r.faceMesh.send({ image: video });
          } catch {}
        },
        width: CAMERA_WIDTH,
        height: CAMERA_HEIGHT,
      });

      internals.current.faceMesh = faceMesh;
      internals.current.camera = camera;
      internals.current.running = true;
      if (!cancelled) {
        camera.start();
        setStatus("no-face");
        statusRef.current = "no-face";
      } else {
        try {
          faceMesh.close();
        } catch {}
      }
    };
    init().catch(console.error);
    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  const statusInfo = STATUS_CONFIG[status];
  const borderColor =
    status === "success"
      ? "ring-[var(--success)]"
      : status === "scanning"
        ? "ring-primary"
        : status === "face-found"
          ? "ring-primary/50"
          : status === "error"
            ? "ring-destructive"
            : "ring-transparent";

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-lg mx-auto">
      <div
        className={`relative w-full rounded-2xl overflow-hidden ring-4 transition-all duration-500 ${borderColor}`}
        style={{ aspectRatio: "4/3" }}
      >
        <AnimatePresence>
          {status === "initializing" && (
            <motion.div
              initial={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-card"
            >
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="mt-3 text-sm text-muted-foreground">
                Đang khởi tạo camera...
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        <Webcam
          ref={webcamRef}
          audio={false}
          mirrored
          videoConstraints={{
            width: CAMERA_WIDTH,
            height: CAMERA_HEIGHT,
            facingMode: "user",
          }}
          className="absolute inset-0 w-full h-full object-cover"
        />

        <AnimatePresence>
          {status === "scanning" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-10 pointer-events-none"
            >
              <motion.div
                className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
                animate={{ top: ["10%", "90%", "10%"] }}
                transition={{
                  repeat: Infinity,
                  duration: 2.5,
                  ease: "easeInOut",
                }}
              />
            </motion.div>
          )}
        </AnimatePresence>

        <div className="absolute inset-0 z-10 pointer-events-none">
          <div className="absolute top-4 left-4 w-8 h-8 border-l-2 border-t-2 border-white/60 rounded-tl-lg" />
          <div className="absolute top-4 right-4 w-8 h-8 border-r-2 border-t-2 border-white/60 rounded-tr-lg" />
          <div className="absolute bottom-4 left-4 w-8 h-8 border-l-2 border-b-2 border-white/60 rounded-bl-lg" />
          <div className="absolute bottom-4 right-4 w-8 h-8 border-r-2 border-b-2 border-white/60 rounded-br-lg" />
        </div>

        <AnimatePresence>
          {status === "success" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/50 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.1 }}
              >
                <CheckCircle2 className="h-16 w-16 text-[var(--success)]" />
              </motion.div>
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="mt-3 text-lg font-semibold text-white"
              >
                Nhận diện thành công!
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <motion.div
        layout
        className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl ${statusInfo.bgColor} transition-colors duration-300`}
      >
        <span className={statusInfo.color}>{statusInfo.icon}</span>
        <span className={`text-sm font-medium ${statusInfo.color}`}>
          {errorMessage || statusInfo.label}
        </span>
      </motion.div>

      {status !== "success" && status !== "submitting" && (
        <p className="text-xs text-muted-foreground text-center max-w-xs">
          Đặt khuôn mặt vào giữa khung hình và giữ nguyên. Hệ thống sẽ tự động
          nhận diện.
        </p>
      )}
    </div>
  );
}
