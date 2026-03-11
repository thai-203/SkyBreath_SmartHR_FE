"use client";

/**
 * FaceRegister.jsx
 *
 * Camera component dùng MediaPipe FaceMesh để hướng dẫn người dùng
 * chụp khuôn mặt theo 5 tư thế. Sau khi hoàn tất gọi onComplete(images[]).
 *
 * Cleanup đầy đủ: camera.stop() + faceMesh.close() khi unmount / cancel / navigate away.
 */

import React, { useEffect, useRef, useState, useCallback } from "react";
import Webcam from "react-webcam";

// ─── Constants ────────────────────────────────────────────────────────────────

export const FACE_STEPS = [
  {
    id: "center",
    label: "Nhìn thẳng",
    icon: "◎",
    desc: "Giữ mặt thẳng vào camera",
  },
  {
    id: "left",
    label: "Quay trái",
    icon: "←",
    desc: "Từ từ quay đầu sang trái",
  },
  {
    id: "right",
    label: "Quay phải",
    icon: "→",
    desc: "Từ từ quay đầu sang phải",
  },
  { id: "up", label: "Ngước lên", icon: "↑", desc: "Ngẩng đầu nhìn lên trên" },
  {
    id: "down",
    label: "Cúi xuống",
    icon: "↓",
    desc: "Cúi đầu nhìn xuống dưới",
  },
];

const HOLD_DURATION_MS = 1200;
const SMOOTH_WINDOW = 6; // số frame để smooth pose
const TICK_INTERVAL_MS = 30;
const SEND_INTERVAL_MS = 80; // throttle FaceMesh.send -> ~12fps

const CAMERA_WIDTH = 320;
const CAMERA_HEIGHT = 240;

const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe";
const FACE_MESH_SRC = `${CDN}/face_mesh/face_mesh.js`;
const CAMERA_UTILS_SRC = `${CDN}/camera_utils/camera_utils.js`;

// ─── Sub-components ────────────────────────────────────────────────────────────

/** Arrow chỉ hướng, dùng SVG thuần */
const DirectionArrow = React.memo(({ dir, active }) => {
  const color = active ? "#22d3ee" : "rgba(255,255,255,0.15)";
  const glowFilter = active ? "drop-shadow(0 0 8px #22d3ee)" : "none";
  const polygonStyle = { filter: glowFilter, transition: "filter 0.3s ease" };

  const shapes = {
    up: <polygon points="40,8 72,56 8,56" fill={color} style={polygonStyle} />,
    down: (
      <polygon points="40,72 72,24 8,24" fill={color} style={polygonStyle} />
    ),
    left: (
      <polygon points="8,40 56,8 56,72" fill={color} style={polygonStyle} />
    ),
    right: (
      <polygon points="72,40 24,8 24,72" fill={color} style={polygonStyle} />
    ),
  };

  if (!shapes[dir]) return null;
  return (
    <svg
      width="80"
      height="80"
      viewBox="0 0 80 80"
      aria-hidden="true"
      style={{ transition: "opacity 0.3s", opacity: active ? 1 : 0.4 }}
    >
      {shapes[dir]}
    </svg>
  );
});
DirectionArrow.displayName = "DirectionArrow";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = resolve; // không hang nếu CDN chậm
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
  const nose = lm[1];
  const leftEye = lm[33];
  const rightEye = lm[263];
  const chin = lm[152];
  const forehead = lm[10];

  const eyeCenterX = (leftEye.x + rightEye.x) / 2;
  const midFaceY = (chin.y + forehead.y) / 2;

  const diffX = nose.x - eyeCenterX;
  const diffY = nose.y - midFaceY;
  const eyeDist = Math.abs(leftEye.x - rightEye.x);
  const faceHeight = Math.abs(chin.y - forehead.y);

  const normX = diffX / Math.max(eyeDist, 0.01);
  const normY = diffY / Math.max(faceHeight, 0.01);

  // Ngưỡng tilt dứt khoát
  if (normX > 0.7) return "left";
  if (normX < -0.7) return "right";
  if (normY < -0.35) return "up";
  if (normY > 0.35) return "down";

  // Dead-zone trung tâm
  if (Math.abs(normX) < 0.35 && Math.abs(normY) < 0.15) return "center";

  // Vùng mơ hồ → ưu tiên trục dominant
  return Math.abs(normX) > Math.abs(normY)
    ? normX > 0
      ? "left"
      : "right"
    : normY < 0
      ? "up"
      : "down";
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function FaceRegister({ onComplete }) {
  const webcamRef = useRef(null);

  /**
   * internals: mọi giá trị mutable không cần trigger re-render
   * đều sống ở đây — tránh scattered refs, dễ cleanup.
   */
  const internals = useRef({
    stepIndex: 0,
    holdTimer: null,
    poseMatched: false,
    holdStart: null,
    poseHistory: [],
    camera: null,
    faceMesh: null,
    lastSend: 0,
    onCompleted: false,
    running: false,
  });

  const [step, setStep] = useState(0);
  const [currentPose, setCurrentPose] = useState("center");
  const [holdProgress, setHoldProgress] = useState(0); // 0–100
  const [captured, setCaptured] = useState([]);
  const [done, setDone] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [mediapipeReady, setMediapipeReady] = useState(false);

  const poseRef = useRef("center");
  const faceDetectedRef = useRef(false);
  const lastPoseRef = useRef("center");
  const lastFaceRef = useRef(false);

  // ─── Camera teardown (tập trung, gọi được từ mọi nơi) ────────────────────

  const teardown = useCallback(() => {
    const r = internals.current;

    r.running = false; // QUAN TRỌNG

    if (r.holdTimer) {
      clearTimeout(r.holdTimer);
      r.holdTimer = null;
    }

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

  // ─── Pose smoothing ──────────────────────────────────────────────────────

  const poseCounts = useRef(new Map());

  const getSmoothedPose = useCallback((newPose) => {
    const hist = internals.current.poseHistory;
    hist.push(newPose);
    if (hist.length > SMOOTH_WINDOW) hist.shift();

    const counts = poseCounts.current;
    counts.clear();

    for (const p of hist) {
      counts.set(p, (counts.get(p) || 0) + 1);
    }

    let bestPose = newPose;
    let bestCount = 0;

    for (const [pose, count] of counts.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestPose = pose;
      }
    }

    return bestPose;
  }, []);

  // ─── MediaPipe results handler ───────────────────────────────────────────

  const onResults = useCallback(
    (results) => {
      const faces = results.multiFaceLandmarks;

      if (!faces?.length) {
        faceDetectedRef.current = false;
        // Reset nếu mất face giữa chừng
        const r = internals.current;
        if (r.poseMatched) {
          r.poseMatched = false;
          r.holdStart = null;
          setHoldProgress(0);
          if (r.holdTimer) {
            clearTimeout(r.holdTimer);
            r.holdTimer = null;
          }
        }
        return;
      }

      // maxNumFaces=1 nhưng phòng thủ thêm
      if (faces.length > 1) return;

      const r = internals.current;
      const rawPose = detectPoseFromLandmarks(faces[0]);
      const pose = getSmoothedPose(rawPose);

      poseRef.current = pose;
      faceDetectedRef.current = true;

      const expected = FACE_STEPS[r.stepIndex].id;

      if (pose === expected) {
        // Bắt đầu hold timer nếu chưa
        if (!r.poseMatched) {
          r.poseMatched = true;
          r.holdStart = Date.now();

          const tick = () => {
            // Kiểm tra pose vẫn khớp (không bị interrupt bởi teardown)
            if (!r.poseMatched || !r.holdStart) return;

            const elapsed = Date.now() - r.holdStart;
            const pct = Math.min((elapsed / HOLD_DURATION_MS) * 100, 100);
            setHoldProgress(pct);

            if (pct < 100) {
              r.holdTimer = setTimeout(tick, TICK_INTERVAL_MS);
              return;
            }

            // ── Capture ────────────────────────────────────────────
            const capturedIndex = r.stepIndex;
            const imageSrc = webcamRef.current?.getScreenshot({
              quality: 0.7,
            });

            // Reset hold state ngay lập tức
            r.poseMatched = false;
            r.holdStart = null;
            r.holdTimer = null;
            setHoldProgress(0);

            if (!imageSrc) return;

            const nextStep = capturedIndex + 1;

            setCaptured((prev) => {
              const updated = [
                ...prev,
                { step: capturedIndex, image: imageSrc },
              ];

              if (nextStep < FACE_STEPS.length) {
                r.stepIndex = nextStep;
                setStep(nextStep);
              } else {
                setDone(true);
                // onComplete chỉ gọi đúng 1 lần dù strict-mode gọi 2 lần
                if (onComplete && !r.onCompleted) {
                  r.onCompleted = true;
                  // setTimeout 0 để thoát khỏi batch setState, tránh warning
                  setTimeout(() => onComplete(updated), 0);
                }
              }

              return updated;
            });
          };

          r.holdTimer = setTimeout(tick, TICK_INTERVAL_MS);
        }
      } else {
        // Pose không khớp → hủy hold
        if (r.poseMatched) {
          r.poseMatched = false;
          r.holdStart = null;
          setHoldProgress(0);
          if (r.holdTimer) {
            clearTimeout(r.holdTimer);
            r.holdTimer = null;
          }
        }
      }
    },
    [getSmoothedPose, onComplete],
  );

  // ─── MediaPipe init ───────────────────────────────────────────────────────

  useEffect(() => {
    let cancelled = false;

    const init = async () => {
      // 1. Load scripts
      await Promise.all([
        loadScript(FACE_MESH_SRC),
        loadScript(CAMERA_UTILS_SRC),
      ]);

      // 2. Chờ globals sẵn sàng
      await waitFor(() => window.FaceMesh && window.Camera);

      // 3. Chờ video element sẵn sàng
      await waitFor(() => {
        const v = webcamRef.current?.video;
        return v && v.readyState >= 2;
      }, 200);

      // Nếu đã unmount trong lúc chờ → dừng lại
      if (cancelled) return;

      const video = webcamRef.current?.video;
      if (!video) return;

      const { FaceMesh, Camera } = window;

      const faceMesh = new FaceMesh({
        locateFile: (file) => `${CDN}/face_mesh/${file}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.6,
        minTrackingConfidence: 0.6,
      });

      faceMesh.onResults((r) => onResultsRef.current(r));

      const camera = new Camera(video, {
        onFrame: async () => {
          const r = internals.current;

          if (!r.running || !r.faceMesh) return;

          const now = performance.now();
          if (now - r.lastSend < SEND_INTERVAL_MS) return;
          r.lastSend = now;

          try {
            await r.faceMesh.send({ image: video });
          } catch (err) {
            // ignore lỗi khi component unmount
            if (process.env.NODE_ENV === "development") {
              console.warn("FaceMesh send aborted:", err);
            }
          }
        },
        width: CAMERA_WIDTH,
        height: CAMERA_HEIGHT,
      });
      internals.current.faceMesh = faceMesh;
      internals.current.camera = camera;
      internals.current.running = true;

      if (!cancelled) {
        camera.start();
        setMediapipeReady(true);
      } else {
        // Race: unmount xảy ra giữa lúc init xong và camera.start()
        try {
          faceMesh.close();
        } catch (_) {}
      }
    };

    init().catch(console.error);

    return () => {
      cancelled = true;
      teardown();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // chỉ chạy 1 lần, onResults được capture qua internals

  /**
   * Vấn đề: nếu onResults thay đổi reference (do re-render), FaceMesh đang chạy
   * vẫn giữ callback cũ. Giải pháp: dùng stable ref cho onResults.
   */
  const onResultsRef = useRef(onResults);
  useEffect(() => {
    onResultsRef.current = onResults;
  }, [onResults]);

  useEffect(() => {
    let rafId;
    let mounted = true;
    let lastUpdate = 0;
    const UI_INTERVAL = 100; // 10fps

    function updateUI(time) {
      if (!mounted) return;

      if (time - lastUpdate < UI_INTERVAL) {
        rafId = requestAnimationFrame(updateUI);
        return;
      }

      lastUpdate = time;

      const pose = poseRef.current;
      const face = faceDetectedRef.current;

      if (pose !== lastPoseRef.current) {
        lastPoseRef.current = pose;
        setCurrentPose(pose);
      }

      if (face !== lastFaceRef.current) {
        lastFaceRef.current = face;
        setFaceDetected(face);
      }

      rafId = requestAnimationFrame(updateUI);
    }

    rafId = requestAnimationFrame(updateUI);

    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  // ─── Derived UI state ────────────────────────────────────────────────────

  const currentStep = FACE_STEPS[step];
  const isMatched = !done && faceDetected && currentPose === currentStep?.id;

  const ringColor = done
    ? "#22c55e"
    : isMatched
      ? "#22d3ee"
      : faceDetected
        ? "#f59e0b"
        : "#ef4444";

  const ARROW_POSITIONS = [
    { dir: "up", top: -40, left: "50%", transform: "translateX(-50%)" },
    { dir: "down", bottom: -40, left: "50%", transform: "translateX(-50%)" },
    { dir: "left", left: -50, top: "50%", transform: "translateY(-50%)" },
    { dir: "right", right: -50, top: "50%", transform: "translateY(-50%)" },
  ];

  // Ellipse circumference ≈ 812px (cho strokeDasharray)
  const ELLIPSE_CIRCUMFERENCE = 812;

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <div
      style={{
        minHeight: "100vh",
        background:
          "radial-gradient(ellipse at 20% 50%, #0d1f3c 0%, #050d1a 60%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        color: "white",
        fontFamily: "'Segoe UI', system-ui, sans-serif",
        padding: "20px",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background grid decorative */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed",
          inset: 0,
          opacity: 0.04,
          backgroundImage:
            "linear-gradient(#22d3ee 1px, transparent 1px), linear-gradient(90deg, #22d3ee 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          pointerEvents: "none",
        }}
      />

      {/* Title */}
      <div style={{ marginBottom: 28, textAlign: "center" }}>
        <p
          style={{
            margin: 0,
            fontSize: 11,
            letterSpacing: 4,
            color: "#22d3ee",
            textTransform: "uppercase",
            marginBottom: 6,
          }}
        >
          Biometric Enrollment
        </p>
        <h1
          style={{ margin: 0, fontSize: 22, fontWeight: 700, color: "#e0f2fe" }}
        >
          Đăng ký khuôn mặt
        </h1>
      </div>

      {/* Step indicators */}
      <div
        role="list"
        aria-label="Các bước chụp"
        style={{ display: "flex", gap: 10, marginBottom: 24 }}
      >
        {FACE_STEPS.map((s, i) => {
          const isDone = i < step || done;
          const isActive = i === step && !done;
          return (
            <div
              key={s.id}
              role="listitem"
              aria-label={`${s.label}: ${isDone ? "hoàn tất" : isActive ? "đang thực hiện" : "chưa thực hiện"}`}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 4,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "50%",
                  border: `2px solid ${isDone ? "#22c55e" : isActive ? "#22d3ee" : "#1e3a5f"}`,
                  background: isDone
                    ? "#14532d"
                    : isActive
                      ? "rgba(34,211,238,0.1)"
                      : "rgba(15,23,42,0.8)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 14,
                  color: isDone ? "#22c55e" : isActive ? "#22d3ee" : "#334155",
                  transition: "all 0.4s ease",
                  boxShadow: isActive
                    ? "0 0 12px #22d3ee66"
                    : isDone
                      ? "0 0 8px #22c55e44"
                      : "none",
                }}
              >
                {isDone ? "✓" : s.icon}
              </div>
              <span
                style={{
                  fontSize: 9,
                  color: isDone ? "#22c55e" : isActive ? "#22d3ee" : "#334155",
                  letterSpacing: 0.5,
                }}
              >
                {s.label}
              </span>
            </div>
          );
        })}
      </div>

      {/* Camera area */}
      <div style={{ position: "relative", width: 420 }}>
        {/* Direction arrows */}
        {ARROW_POSITIONS.map(({ dir, ...pos }) => (
          <div key={dir} style={{ position: "absolute", zIndex: 10, ...pos }}>
            <DirectionArrow
              dir={dir}
              active={currentStep?.id === dir && faceDetected && !done}
            />
          </div>
        ))}

        {/* Loading overlay khi mediapipe chưa sẵn sàng */}
        {!mediapipeReady && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              zIndex: 20,
              borderRadius: 16,
              background: "rgba(5,13,26,0.85)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                width: 32,
                height: 32,
                border: "3px solid #22d3ee",
                borderTopColor: "transparent",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontSize: 13, color: "#94a3b8", margin: 0 }}>
              Đang khởi tạo camera...
            </p>
          </div>
        )}

        <Webcam
          ref={webcamRef}
          mirrored
          screenshotFormat="image/jpeg"
          screenshotQuality={0.7}
          width={420}
          videoConstraints={{
            width: CAMERA_WIDTH,
            height: CAMERA_HEIGHT,
            facingMode: "user",
          }}
          style={{ borderRadius: 16, display: "block" }}
        />

        {/* Oval overlay SVG */}
        <svg
          viewBox="0 0 420 315"
          aria-hidden="true"
          style={{
            position: "absolute",
            inset: 0,
            width: "100%",
            height: "100%",
            pointerEvents: "none",
          }}
        >
          <defs>
            <mask id="faceOvalMask">
              <rect width="420" height="315" fill="white" />
              <ellipse cx="210" cy="157" rx="110" ry="148" fill="black" />
            </mask>
          </defs>

          {/* Vùng tối ngoài oval */}
          <rect
            width="420"
            height="315"
            fill="rgba(5,13,26,0.55)"
            mask="url(#faceOvalMask)"
          />

          {/* Viền oval chính */}
          <ellipse
            cx="210"
            cy="157"
            rx="110"
            ry="148"
            fill="none"
            stroke={ringColor}
            strokeWidth="2.5"
            style={{
              filter: `drop-shadow(0 0 10px ${ringColor})`,
              transition: "stroke 0.4s ease, filter 0.4s ease",
            }}
          />

          {/* Scanning animation khi pose khớp */}
          {isMatched && (
            <ellipse
              cx="210"
              cy="157"
              rx="110"
              ry="148"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="1"
              strokeDasharray="30 200"
              opacity="0.6"
            >
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 210 157"
                to="360 210 157"
                dur="2s"
                repeatCount="indefinite"
              />
            </ellipse>
          )}

          {/* Corner brackets */}
          {[
            [115, 30, 135, 30, 115, 50],
            [285, 30, 305, 30, 305, 50],
            [115, 280, 115, 265, 135, 280],
            [285, 265, 305, 265, 305, 280],
          ].map(([x1, y1, x2, y2, x3, y3], i) => (
            <polyline
              key={i}
              points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`}
              fill="none"
              stroke={ringColor}
              strokeWidth="2"
              style={{ transition: "stroke 0.4s ease" }}
            />
          ))}
        </svg>

        {/* Hold progress arc (layer riêng để transition mượt) */}
        {holdProgress > 0 && (
          <svg
            viewBox="0 0 420 315"
            aria-hidden="true"
            style={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              pointerEvents: "none",
            }}
          >
            <ellipse
              cx="210"
              cy="157"
              rx="110"
              ry="148"
              fill="none"
              stroke="#22d3ee"
              strokeWidth="4"
              strokeDasharray={`${(holdProgress / 100) * ELLIPSE_CIRCUMFERENCE} ${ELLIPSE_CIRCUMFERENCE}`}
              strokeLinecap="round"
              transform="rotate(-90 210 157)"
              style={{
                filter: "drop-shadow(0 0 6px #22d3ee)",
                transition: `stroke-dasharray ${TICK_INTERVAL_MS}ms linear`,
              }}
            />
          </svg>
        )}

        {/* Done overlay */}
        {done && (
          <div
            role="status"
            aria-live="polite"
            style={{
              position: "absolute",
              inset: 0,
              borderRadius: 16,
              background: "rgba(5,13,26,0.8)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <div
              style={{
                fontSize: 56,
                filter: "drop-shadow(0 0 20px #22c55e)",
                lineHeight: 1,
              }}
            >
              ✓
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 700,
                color: "#22c55e",
              }}
            >
              Đăng ký thành công!
            </p>
          </div>
        )}
      </div>

      {/* Status / instruction bar */}
      <div style={{ marginTop: 56, width: 420 }}>
        {!done && (
          <div
            role="status"
            aria-live="polite"
            style={{
              background: "rgba(14,30,58,0.8)",
              border: `1px solid ${isMatched ? "#22d3ee44" : "#1e3a5f"}`,
              borderRadius: 12,
              padding: "12px 20px",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              transition: "border-color 0.4s ease, box-shadow 0.4s ease",
              boxShadow: isMatched ? "0 0 20px #22d3ee22" : "none",
            }}
          >
            <div>
              <p
                style={{
                  margin: "0 0 3px 0",
                  fontSize: 11,
                  color: "#64748b",
                  letterSpacing: 2,
                  textTransform: "uppercase",
                }}
              >
                Bước {step + 1} / {FACE_STEPS.length}
              </p>
              <p
                style={{
                  margin: 0,
                  fontSize: 15,
                  fontWeight: 600,
                  color: isMatched ? "#22d3ee" : "#e0f2fe",
                }}
              >
                {currentStep?.desc}
              </p>
            </div>
            <span
              aria-hidden="true"
              style={{
                fontSize: 28,
                opacity: isMatched ? 1 : 0.3,
                filter: isMatched ? "drop-shadow(0 0 8px #22d3ee)" : "none",
                transition: "opacity 0.3s, filter 0.3s",
              }}
            >
              {currentStep?.icon}
            </span>
          </div>
        )}

        <div
          style={{
            marginTop: 10,
            display: "flex",
            justifyContent: "space-between",
            fontSize: 11,
            color: "#475569",
            padding: "0 4px",
          }}
        >
          <span role="status" aria-live="polite">
            {faceDetected ? (
              <span style={{ color: "#22c55e" }}>● Phát hiện khuôn mặt</span>
            ) : (
              <span style={{ color: "#ef4444" }}>
                ● Không tìm thấy khuôn mặt
              </span>
            )}
          </span>
          <span>
            Tư thế: <span style={{ color: "#22d3ee" }}>{currentPose}</span>
          </span>
        </div>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
