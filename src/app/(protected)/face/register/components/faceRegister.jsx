"use client";

import React, {
  useEffect,
  useRef,
  useState,
  useCallback,
  useMemo,
} from "react";
import Webcam from "react-webcam";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, Check, CheckCircle2, User } from "lucide-react";

// ─── Constants ────────────────────────────────────────────────────────────────

const STEP_SEQUENCE = [
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
  {
    id: "left_up",
    label: "Trái lên",
    icon: "↖",
    desc: "Quay trái và ngẩng lên",
  },
  {
    id: "right_up",
    label: "Phải lên",
    icon: "↗",
    desc: "Quay phải và ngẩng lên",
  },
  {
    id: "tilt_left",
    label: "Nghiêng trái",
    icon: "⤺",
    desc: "Nghiêng đầu sang trái",
  },
];

const HOLD_DURATION_MS = 1200;
const SMOOTH_WINDOW = 6;
const MEDIAPIPE_INTERVAL_MS = 80;

const CAMERA_WIDTH = 1600;
const CAMERA_HEIGHT = 1200;

const CDN = "https://cdn.jsdelivr.net/npm/@mediapipe";
const FACE_MESH_SRC = `${CDN}/face_mesh/face_mesh.js`;
const CAMERA_UTILS_SRC = `${CDN}/camera_utils/camera_utils.js`;

const ELLIPSE_RX = 130;
const ELLIPSE_RY = 175;

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

function getSteps(numSteps) {
  const count = Math.max(1, Math.min(numSteps ?? 5, STEP_SEQUENCE.length));
  return STEP_SEQUENCE.slice(0, count);
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

  const eyeSlope = (rightEye.y - leftEye.y) / (rightEye.x - leftEye.x);

  // ── 1. COMBO: left_up / right_up ──────────────────────────────
  // normY dùng eyeDist thay faceHeight để nhạy hơn khi ngước
  const eyeDistY = Math.abs(leftEye.y - rightEye.y) + eyeDist; // proxy scale
  const normYEye = diffY / Math.max(eyeDist, 0.01); // nhạy hơn ~2x

  const isUpward = normYEye < -0.15; // tương đương ~8° ngước thực tế
  const isTurnedLeft = normX > 0.3;
  const isTurnedRight = normX < -0.3;

  if (isTurnedLeft && isUpward) return "left_up";
  if (isTurnedRight && isUpward) return "right_up";

  // ── 2. NGHIÊNG ĐẦU ───────────────────────────────────────────
  if (eyeSlope > 0.25) return "tilt_left";

  // ── 3. TƯ THẾ ĐƠN THUẦN ──────────────────────────────────────
  if (normX > 0.5) return "left";
  if (normX < -0.5) return "right";
  if (normYEye < -0.22) return "up"; // dùng normYEye cho "up" luôn
  if (normY > 0.28) return "down"; // down giữ normY gốc (cúi ít ảnh hưởng)

  // ── 4. CENTER ────────────────────────────────────────────────
  if (
    Math.abs(normX) < 0.22 &&
    Math.abs(normYEye) < 0.12 &&
    Math.abs(eyeSlope) < 0.15
  )
    return "center";

  // ── 5. FALLBACK ───────────────────────────────────────────────
  return Math.abs(normX) > Math.abs(normYEye)
    ? normX > 0
      ? "left"
      : "right"
    : normYEye < 0
      ? "up"
      : "down";
}

function isEyeDistSufficient(lm, minSize) {
  const eyeDistPx = Math.abs(lm[33].x - lm[263].x) * CAMERA_WIDTH;
  return eyeDistPx >= minSize * 0.32;
}

const GUIDE_CONFIGS = {
  up: { x: 0, y: -1, rotation: -90 },
  down: { x: 0, y: 1, rotation: 90 },
  left: { x: -1, y: 0, rotation: 180 },
  right: { x: 1, y: 0, rotation: 0 },
  left_up: { x: -1, y: -1, rotation: -135 },
  right_up: { x: 1, y: -1, rotation: -45 },
  tilt_left: { x: -1, y: 1, rotation: 135 },
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function FaceRegister({ onComplete, config }) {
  const webcamRef = useRef(null);
  const canvasRef = useRef(null);

  const internals = useRef({
    stepIndex: 0,
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
  const [holdProgress, setHoldProgress] = useState(0);
  const [captured, setCaptured] = useState([]);
  const [done, setDone] = useState(false);
  const [faceDetected, setFaceDetected] = useState(false);
  const [mediapipeReady, setMediapipeReady] = useState(false);

  const poseRef = useRef("center");
  const faceDetectedRef = useRef(false);
  const lastPoseRef = useRef("center");
  const lastFaceRef = useRef(false);
  const poseCounts = useRef(new Map());

  const steps = useMemo(
    () => getSteps(config?.maxEmbeddingsPerUser ?? 5),
    [config],
  );

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
    const hist = internals.current.poseHistory;
    hist.push(newPose);
    if (hist.length > SMOOTH_WINDOW) hist.shift();
    const counts = poseCounts.current;
    counts.clear();
    for (const p of hist) counts.set(p, (counts.get(p) || 0) + 1);
    let bestPose = newPose,
      bestCount = 0;
    for (const [pose, count] of counts.entries()) {
      if (count > bestCount) {
        bestCount = count;
        bestPose = pose;
      }
    }
    return bestPose;
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
    return canvas.toDataURL("image/jpeg", 0.95);
  }, []);

  const onResults = useCallback(
    (results) => {
      const r = internals.current;
      const resetHold = () => {
        if (!r.poseMatched) return;
        r.poseMatched = false;
        r.holdStart = null;
        setHoldProgress(0);
      };

      const faces = results.multiFaceLandmarks;
      if (!faces?.length) {
        faceDetectedRef.current = false;
        resetHold();
        return;
      }

      const lm0 = faces[0];
      if (!isEyeDistSufficient(lm0, config?.faceDetectionMinSize ?? 80)) {
        faceDetectedRef.current = false;
        resetHold();
        return;
      }
      if (faces.length > (config?.maxFacesAllowed ?? 1)) return;

      const rawPose = detectPoseFromLandmarks(faces[0]);
      const pose = getSmoothedPose(rawPose);
      poseRef.current = pose;
      faceDetectedRef.current = true;

      const expected = steps[r.stepIndex].id;
      if (pose === expected) {
        if (!r.poseMatched) {
          r.poseMatched = true;
          r.holdStart = Date.now();
          setHoldProgress(0);
        } else if (r.holdStart) {
          const elapsed = Date.now() - r.holdStart;
          const pct = Math.min((elapsed / HOLD_DURATION_MS) * 100, 100);
          setHoldProgress(pct);
          if (pct >= 100) {
            const capturedIndex = r.stepIndex;
            const imageSrc = getHighQualitySnap();
            r.poseMatched = false;
            r.holdStart = null;
            setHoldProgress(0);
            if (!imageSrc) return;
            const nextStep = capturedIndex + 1;
            setCaptured((prev) => {
              const updated = [
                ...prev,
                { step: capturedIndex, image: imageSrc },
              ];
              if (nextStep < steps.length) {
                r.stepIndex = nextStep;
                setStep(nextStep);
              } else {
                setDone(true);
                if (onComplete && !r.onCompleted) {
                  r.onCompleted = true;
                  setTimeout(() => onComplete(updated), 0);
                }
              }
              return updated;
            });
          }
        }
      } else {
        resetHold();
      }
    },
    [getSmoothedPose, onComplete, steps, config, getHighQualitySnap],
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
        maxNumFaces: config?.maxFacesAllowed ?? 1,
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
          if (now - r.lastSend < MEDIAPIPE_INTERVAL_MS) return;
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
        setMediapipeReady(true);
      }
    };
    init().catch(console.error);
    return () => {
      cancelled = true;
      teardown();
    };
  }, []);

  useEffect(() => {
    let rafId,
      mounted = true,
      lastUpdate = 0;
    function updateUI(time) {
      if (!mounted) return;
      if (time - lastUpdate < 100) {
        rafId = requestAnimationFrame(updateUI);
        return;
      }
      lastUpdate = time;
      if (poseRef.current !== lastPoseRef.current) {
        lastPoseRef.current = poseRef.current;
        setCurrentPose(poseRef.current);
      }
      if (faceDetectedRef.current !== lastFaceRef.current) {
        lastFaceRef.current = faceDetectedRef.current;
        setFaceDetected(faceDetectedRef.current);
      }
      rafId = requestAnimationFrame(updateUI);
    }
    rafId = requestAnimationFrame(updateUI);
    return () => {
      mounted = false;
      cancelAnimationFrame(rafId);
    };
  }, []);

  const currentStep = steps[step];
  const isMatched = !done && faceDetected && currentPose === currentStep?.id;

  const strokeColor = done
    ? "var(--success)"
    : isMatched
      ? "var(--primary-light)"
      : faceDetected
        ? "var(--warning)"
        : "hsl(var(--muted-foreground) / 0.3)";

  const overallProgress = done ? 100 : (step / steps.length) * 100;

  return (
    <div className="w-full max-w-6xl mx-auto">
      <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
        {/* LEFT COLUMN */}
        <div className="flex-1 lg:flex-[3] min-w-0">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="relative w-full" style={{ aspectRatio: "4/3" }}>
              <AnimatePresence>
                {!mediapipeReady && (
                  <motion.div
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-card"
                  >
                    <div className="h-8 w-8 rounded-full border-2 border-primary-light border-t-transparent animate-spin" />
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

              <svg
                viewBox="0 0 560 420"
                className="absolute inset-0 w-full h-full pointer-events-none z-10"
                preserveAspectRatio="xMidYMid slice"
              >
                <defs>
                  <mask id="face-mask">
                    <rect width="560" height="420" fill="white" />
                    <ellipse
                      cx="280"
                      cy="200"
                      rx={ELLIPSE_RX}
                      ry={ELLIPSE_RY}
                      fill="black"
                    />
                  </mask>
                </defs>
                <rect
                  width="560"
                  height="420"
                  fill="rgba(0,0,0,0.45)"
                  mask="url(#face-mask)"
                />
                <ellipse
                  cx="280"
                  cy="200"
                  rx={ELLIPSE_RX}
                  ry={ELLIPSE_RY}
                  fill="none"
                  stroke={strokeColor}
                  strokeWidth="3"
                  className="transition-all duration-300"
                  style={{
                    filter: faceDetected
                      ? `drop-shadow(0 0 ${6 + holdProgress / 8}px ${strokeColor})`
                      : "none",
                  }}
                />
                {isMatched && !done && (
                  <motion.ellipse
                    cx="280"
                    cy="200"
                    rx={ELLIPSE_RX}
                    ry={ELLIPSE_RY}
                    fill="none"
                    stroke="var(--primary)"
                    strokeWidth="5"
                    initial={{ scale: 1, opacity: 0.6 }}
                    animate={{
                      scale: [1, 1.04, 1],
                      opacity: [0.6, 0.2, 0.6],
                    }}
                    transition={{
                      duration: 1.6,
                      repeat: Infinity,
                      ease: "easeInOut",
                    }}
                    style={{ transformOrigin: "center" }}
                  />
                )}
                {holdProgress > 0 && !done && (
                  <ellipse
                    cx="280"
                    cy="200"
                    rx={ELLIPSE_RX}
                    ry={ELLIPSE_RY}
                    fill="none"
                    stroke="var(--primary-light)"
                    // Viền rất mỏng hoặc trong suốt, chủ yếu dùng shadow
                    strokeWidth={1 + (holdProgress / 100) * 2}
                    className="transition-all duration-75 ease-linear"
                    style={{
                      opacity: 0.3 + (holdProgress / 100) * 0.7,
                      filter: `drop-shadow(0 0 ${10 + (holdProgress / 100) * 20}px var(--primary))`,
                    }}
                  />
                )}
              </svg>

              {!done && (
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-30 pointer-events-none">
                  <div className="px-4 py-2 bg-black/70 backdrop-blur-sm text-white text-sm font-mono rounded-lg shadow-lg border border-white/20">
                    Pose:{" "}
                    <span className="font-bold text-cyan-300">
                      {currentPose}
                    </span>
                    {currentPose === currentStep?.id && (
                      <span className="ml-2 text-green-400 font-semibold">
                        ✓ MATCH
                      </span>
                    )}
                  </div>
                </div>
              )}

              {!done && currentStep?.id !== "center" && (
                <div className="absolute inset-0 z-20 pointer-events-none flex items-center justify-center">
                  {faceDetected &&
                    !isMatched &&
                    GUIDE_CONFIGS[currentStep.id] && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.5 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute"
                        style={{
                          left: `calc(50% + ${GUIDE_CONFIGS[currentStep.id].x * 100}px)`,
                          top: `calc(47% + ${GUIDE_CONFIGS[currentStep.id].y * 80}px)`,
                        }}
                      >
                        <motion.svg
                          width="40"
                          height="40"
                          viewBox="0 0 24 24"
                          animate={{
                            x: [0, GUIDE_CONFIGS[currentStep.id].x * 6, 0],
                          }}
                          transition={{ repeat: Infinity, duration: 1.2 }}
                        >
                          <path
                            d="M5 12h14M12 5l7 7-7 7"
                            stroke="white"
                            strokeWidth="2"
                            fill="none"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            transform={`rotate(${GUIDE_CONFIGS[currentStep.id].rotation} 12 12)`}
                          />
                        </motion.svg>
                      </motion.div>
                    )}
                </div>
              )}

              <AnimatePresence>
                {done && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/60 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", delay: 0.2 }}
                    >
                      <CheckCircle2 className="h-16 w-16 text-green-400" />
                    </motion.div>
                    <p className="mt-4 text-xl font-semibold text-white">
                      Hoàn tất đăng ký!
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
          {currentStep && !done && (
            <div className="mt-4 lg:hidden">
              <MobileInstruction
                currentStep={currentStep}
                step={step}
                steps={steps}
                faceDetected={faceDetected}
                holdProgress={holdProgress}
              />
            </div>
          )}
        </div>

        {/* RIGHT COLUMN */}
        <div className="lg:flex-[2] min-w-0 flex flex-col gap-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-500/10">
              <Shield className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-foreground leading-tight">
                Xác thực sinh trắc học
              </h1>
              <p className="text-xs text-muted-foreground">
                Đăng ký khuôn mặt — Nhận diện nhân sự
              </p>
            </div>
          </div>

          <div>
            <div className="flex justify-between text-xs text-muted-foreground mb-1.5">
              <span>Tiến trình</span>
              <span>
                {done ? steps.length : step}/{steps.length}
              </span>
            </div>
            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
              <motion.div
                className="h-full rounded-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>

          <div className="hidden lg:block">
            <VerticalStepper steps={steps} currentStep={step} done={done} />
          </div>

          {currentStep && !done && (
            <div className="hidden lg:block">
              <div className="rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-2xl">
                    {currentStep.icon}
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Bước {step + 1} / {steps.length}
                    </p>
                    <p className="text-sm font-medium text-foreground">
                      {currentStep.desc}
                    </p>
                  </div>
                </div>
                {holdProgress > 0 && (
                  <div className="h-1 w-full rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${holdProgress}%` }}
                    />
                  </div>
                )}
                <div className="flex items-center gap-2 mt-3">
                  <span
                    className={`h-2 w-2 rounded-full ${faceDetected ? "bg-green-500" : "bg-muted-foreground/40"}`}
                  />
                  <span className="text-xs text-muted-foreground">
                    {faceDetected
                      ? "Đã nhận diện khuôn mặt"
                      : "Đang tìm kiếm..."}
                  </span>
                </div>
              </div>
            </div>
          )}

          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">
              Ảnh đã chụp
            </p>
            <div className="grid grid-cols-4 lg:grid-cols-3 gap-2">
              {steps.map((s, i) => {
                const cap = captured.find((c) => c.step === i);
                return (
                  <div
                    key={s.id}
                    className="relative aspect-square rounded-lg border border-border bg-muted/50 overflow-hidden"
                  >
                    {cap ? (
                      <>
                        <img
                          src={cap.image}
                          alt={s.label}
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full gap-1">
                        <User className="h-4 w-4 text-muted-foreground/30" />
                        <span className="text-[10px] text-muted-foreground/40">
                          {s.label}
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          <p className="text-[11px] text-muted-foreground/60 leading-relaxed mt-auto">
            🔒 Dữ liệu sinh trắc học được mã hoá an toàn.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function VerticalStepper({ steps, currentStep, done }) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((s, i) => {
        const isDone = i < currentStep || done;
        const isActive = i === currentStep && !done;
        const isLast = i === steps.length - 1;
        return (
          <div key={s.id} className="flex items-stretch gap-3">
            <div className="flex flex-col items-center">
              <div
                className={`flex h-7 w-7 items-center justify-center rounded-full text-xs font-medium shrink-0 ${isDone ? "bg-gray-500/10 text-primary" : isActive ? "bg-primary text-primary-foreground ring-2 ring-primary/20" : "bg-muted text-muted-foreground"}`}
              >
                {isDone ? <Check className="h-3.5 w-3.5" /> : i + 1}
              </div>
              {!isLast && (
                <div
                  className={`w-px flex-1 min-h-[16px] ${isDone ? "bg-primary" : "bg-border"}`}
                />
              )}
            </div>
            <div className="pb-3">
              <span
                className={`text-sm leading-7 ${isActive ? "font-medium text-foreground" : isDone ? "text-muted-foreground line-through" : "text-muted-foreground/60"}`}
              >
                {s.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MobileInstruction({
  currentStep,
  step,
  steps,
  faceDetected,
  holdProgress,
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-xl">
          {currentStep.icon}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-muted-foreground">
            Bước {step + 1} / {steps.length}
          </p>
          <p className="text-sm font-medium text-foreground truncate">
            {currentStep.desc}
          </p>
        </div>
      </div>
      {holdProgress > 0 && (
        <div className="mt-3 h-1 w-full rounded-full bg-muted overflow-hidden">
          <div
            className="h-full rounded-full bg-primary transition-all duration-100"
            style={{ width: `${holdProgress}%` }}
          />
        </div>
      )}
      <div className="flex items-center gap-2 mt-2">
        <span
          className={`h-2 w-2 rounded-full ${faceDetected ? "bg-green-500" : "bg-muted-foreground/40"}`}
        />
        <span className="text-xs text-muted-foreground">
          {faceDetected ? "Đã nhận diện khuôn mặt" : "Đang tìm kiếm..."}
        </span>
      </div>
    </div>
  );
}
