"use client";

import React, { useState, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AlertCircle,
  Brain,
  Camera,
  ChevronLeft,
  Cpu,
  Eye,
  Info,
  RotateCcw,
  Save,
  ScanFace,
  Shield,
  ShieldCheck,
  Sliders,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/common/Toast";
import { PermissionGate } from "@/components/common/AuthGuard";

// ─── Animations ───────────────────────────────────────────────────────────────

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.4, ease: [0, 0, 0.2, 1] },
  },
};

// ─── Sub-Components ───────────────────────────────────────────────────────────

function ModelInfoPanel({ config }) {
  const technologies = [
    {
      icon: Brain,
      name:
        config.arcfaceModelName === "buffalo_l"
          ? "ArcFace — Buffalo-L"
          : config.arcfaceModelName === "buffalo_m"
            ? "ArcFace — Buffalo-M"
            : "ArcFace — AntelopeV2",
      role: "Nhận diện khuôn mặt",
      whatItDoes:
        "Chuyển khuôn mặt thành mã số học (vector) để so sánh với dữ liệu đã lưu, giúp xác định danh tính nhân viên khi điểm danh.",
      specs:
        config.arcfaceModelName === "buffalo_l"
          ? "Mô hình lớn · Xử lý kỹ hơn · Phù hợp hệ thống cần độ chính xác cao"
          : config.arcfaceModelName === "buffalo_m"
            ? "Mô hình vừa · Xử lý nhanh · Phù hợp hệ thống cần tốc độ"
            : "Thế hệ mới · Tối ưu hiệu năng · Phù hợp thiết bị nhúng",
      color: "text-primary",
      bgColor: "bg-primary-10",
    },
    {
      icon: Shield,
      name: "Anti-Spoof RGB",
      role: "Chống giả mạo",
      whatItDoes:
        "Phân biệt khuôn mặt thật với ảnh in, ảnh trên màn hình hoặc video phát lại, đảm bảo chỉ người thật mới điểm danh được.",
      specs: "Phân tích màu sắc & kết cấu da · Hoạt động với camera thường",
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: Cpu,
      name:
        config.similarityMetric === "cosine"
          ? "Cosine Similarity"
          : config.similarityMetric === "l2"
            ? "Khoảng cách L2"
            : "Dot Product",
      role: "Phương pháp so khớp",
      whatItDoes:
        config.similarityMetric === "cosine"
          ? "So sánh hướng của hai vector khuôn mặt. Kết quả càng gần 1 thì hai khuôn mặt càng giống nhau."
          : config.similarityMetric === "l2"
            ? "Đo khoảng cách giữa hai vector. Khoảng cách càng nhỏ thì hai khuôn mặt càng giống nhau."
            : "Nhân hai vector với nhau. Giá trị càng lớn thì hai khuôn mặt càng giống nhau.",
      specs:
        config.similarityMetric === "cosine"
          ? "Ổn định với ánh sáng khác nhau · Được dùng phổ biến nhất"
          : "Nhạy với độ sáng · Cần chuẩn hoá dữ liệu",
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-500/10",
    },
  ];

  return (
    <motion.div variants={itemVariants}>
      <Card className="overflow-hidden border-border/40 bg-white backdrop-blur-md">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-10">
              <Zap className="w-5 h-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">Công Nghệ Đang Sử Dụng</CardTitle>
              <CardDescription>
                Hệ thống đang vận hành với các công nghệ sau
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          {technologies.map((tech, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-border/30 bg-background/50 p-4 space-y-2.5"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${tech.bgColor}`}
                >
                  <tech.icon className={`h-4.5 w-4.5 ${tech.color}`} />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold leading-tight text-foreground">
                    {tech.name}
                  </p>
                  <p className="text-xs text-muted-foreground">{tech.role}</p>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-foreground/80">
                {tech.whatItDoes}
              </p>
              <p className="text-[11px] text-muted-foreground italic">
                {tech.specs}
              </p>
            </div>
          ))}
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SliderField({
  label,
  value,
  onChange,
  min,
  max,
  step,
  hint,
  unit,
  error,
  disabled,
}) {
  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <Label
          className={`text-sm font-medium ${error ? "text-destructive" : ""}`}
        >
          {label}
        </Label>
        <div className="flex items-center gap-1.5">
          <Input
            type="number"
            value={value}
            onChange={(e) => onChange(parseFloat(e.target.value) || min)}
            min={min}
            max={max}
            step={step}
            disabled={disabled}
            className={`w-20 h-8 font-mono text-sm text-center ${error ? "border-destructive focus-visible:ring-destructive" : ""}`}
          />
          {unit && (
            <span className="text-xs text-muted-foreground">{unit}</span>
          )}
        </div>
      </div>
      <Slider
        value={[value]}
        onValueChange={(v) => onChange(v[0])}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className="w-full"
      />
      <div className="flex items-center justify-between">
        <span className="text-[11px] text-muted-foreground">
          {min}
          {unit}
        </span>
        <span className="text-[11px] text-muted-foreground">
          {max}
          {unit}
        </span>
      </div>
      {hint && !error && (
        <p className="text-xs text-muted-foreground">{hint}</p>
      )}
      {error && <p className="text-xs font-medium text-destructive">{error}</p>}
    </div>
  );
}

const sectionIcons = {
  recognition: { icon: ScanFace, color: "text-primary", bg: "bg-primary-10" },
  antispoof: {
    icon: ShieldCheck,
    color: "text-emerald-600 dark:text-emerald-400",
    bg: "bg-emerald-500/10",
  },
  camera: {
    icon: Camera,
    color: "text-violet-600 dark:text-violet-400",
    bg: "bg-violet-500/10",
  },
};

// ─── Validation Logic ─────────────────────────────────────────────────────────

const validateConfigField = (field, value, configState) => {
  switch (field) {
    case "recognitionThreshold":
      if (value < 0.3 || value > 0.9) return "Giá trị phải từ 0.3 đến 0.9";
      break;
    case "spoofThreshold":
      if (value < 0.0 || value > 0.95) return "Giá trị phải từ 0.5 đến 0.95";
      break;
    case "maxEmbeddingsPerUser":
      if (value < 3 || value > 8) return "Giá trị phải từ 3 đến 8";
      break;
    case "requiredFrames":
      if (
        configState.livenessMode === "MULTI_FRAME" &&
        (value < 5 || value > 30)
      ) {
        return "Giá trị phải từ 5 đến 30";
      }
      break;
    case "captureIntervalMs":
      if (value < 200 || value > 2000) return "Giá trị phải từ 200 đến 2000 ms";
      break;
    case "faceDetectionMinSize":
      if (value < 40 || value > 200) return "Giá trị phải từ 40 đến 200 px";
      break;
    case "maxFacesAllowed":
      if (value < 1 || value > 3) return "Giá trị phải từ 1 đến 3";
      break;
    default:
      return null;
  }
  return null;
};

// ─── Main Component ───────────────────────────────────────────────────────────

export default function ConfigurationsForm({
  config,
  savedConfig,
  onChange,
  onSave,
  saving,
  onResetRequest,
  router,
}) {
  const { error } = useToast();
  const [errors, setErrors] = useState({});

  const isDirty = useMemo(
    () => JSON.stringify(config) !== JSON.stringify(savedConfig),
    [config, savedConfig],
  );

  const updateField = useCallback(
    (field, value) => {
      const nextConfig = { ...config, [field]: value };
      onChange(nextConfig); // Bắn lên Page lưu trữ

      // Validate Real-time
      const errorMsg = validateConfigField(field, value, nextConfig);
      setErrors((prevErrors) => {
        const nextErrors = { ...prevErrors };
        if (errorMsg) nextErrors[field] = errorMsg;
        else delete nextErrors[field];
        return nextErrors;
      });
    },
    [config, onChange],
  );

  const handleSaveClick = () => {
    const newErrors = {};
    Object.keys(config).forEach((key) => {
      const errorMsg = validateConfigField(key, config[key], config);
      if (errorMsg) newErrors[key] = errorMsg;
    });

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      error("Vui lòng kiểm tra lại các giá trị nhập bị lỗi");
      return;
    }

    onSave(config);
  };
  const goBack = () => {
    router.push("/configurations");
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="max-w space-y-6"
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-11 h-11 rounded-xl bg-primary-10">
              <Sliders className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-foreground">
                Cấu Hình Nhận Diện
              </h1>
              <p className="text-sm text-muted-foreground">
                Quản lý cài đặt nhận diện khuôn mặt và chống giả mạo
              </p>
            </div>
          </div>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="outline" onClick={goBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại cấu hình
          </Button>
        </div>
      </motion.div>
      <motion.div
        variants={itemVariants}
        className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between"
      >
        <div></div>
        <div className="flex items-center gap-2">
          <PermissionGate permission="ATTENDANCE_FACE_RECOGNITION_CONFIG_UPDATE">
            <Button
              variant="outline"
              size="sm"
              onClick={onResetRequest}
              disabled={saving}
            >
              <RotateCcw className="mr-1.5 h-4 w-4" />
              Đặt lại
            </Button>
          </PermissionGate>
          <PermissionGate permission="ATTENDANCE_FACE_RECOGNITION_CONFIG_UPDATE">
            <Button
              size="sm"
              onClick={handleSaveClick}
              disabled={saving || !isDirty || Object.keys(errors).length > 0}
            >
              <Save className="mr-1.5 h-4 w-4" />
              {saving ? "Đang lưu..." : "Lưu cấu hình"}
            </Button>
          </PermissionGate>
        </div>
      </motion.div>

      {/* ── Unsaved Banner ──────────────────────────────────────── */}
      <AnimatePresence>
        {isDirty && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
          >
            <div className="flex items-center gap-3 px-4 py-3 border rounded-xl border-amber-200 bg-amber-50 dark:border-amber-900/40 dark:bg-amber-950/20">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600 dark:text-amber-400" />
              <p className="text-sm text-amber-800 dark:text-amber-200">
                Bạn có thay đổi chưa lưu. Nhấn <strong>Lưu cấu hình</strong> để
                áp dụng.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Info Alert ───────────────────────────────────────────── */}
      <motion.div variants={itemVariants}>
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Lưu ý:</p>
            <ul className="list-disc list-inside space-y-1 text-xs">
              <li>
                Các thay đổi sẽ áp dụng cho tất cả phiên nhận diện mới. Ngưỡng
                cao hơn = yêu cầu khớp chính xác hơn nhưng dễ bị từ chối.
              </li>
            </ul>
          </div>
        </div>
      </motion.div>

      {/* ── Two-Column Layout ────────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Config Sections */}
        <div className="space-y-5">
          {/* Recognition */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-border/40 bg-white backdrop-blur-md">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${sectionIcons.recognition.bg}`}
                  >
                    <ScanFace
                      className={`h-5 w-5 ${sectionIcons.recognition.color}`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Cổng Nhận Diện</CardTitle>
                    <CardDescription>
                      Ngưỡng và dữ liệu nhận diện khuôn mặt
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SliderField
                  label="Ngưỡng nhận diện"
                  value={config?.recognitionThreshold}
                  onChange={(v) => updateField("recognitionThreshold", v)}
                  min={0.3}
                  max={0.9}
                  step={0.05}
                  hint="Giá trị cao hơn = yêu cầu khớp chính xác hơn"
                  error={errors.recognitionThreshold}
                />
                <Separator className="bg-border/40" />
                <SliderField
                  label="Số khuôn mặt tối đa / người"
                  value={config.maxEmbeddingsPerUser}
                  onChange={(v) => updateField("maxEmbeddingsPerUser", v)}
                  min={3}
                  max={8}
                  step={1}
                  unit=" mẫu"
                  hint="Số lượng dữ liệu khuôn mặt lưu cho mỗi nhân viên"
                  error={errors.maxEmbeddingsPerUser}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Anti-Spoof */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-border/40 bg-white backdrop-blur-md">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${sectionIcons.antispoof.bg}`}
                  >
                    <ShieldCheck
                      className={`h-5 w-5 ${sectionIcons.antispoof.color}`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Chống Giả Mạo</CardTitle>
                    <CardDescription>
                      Ngăn chặn sử dụng ảnh/video giả
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SliderField
                  label="Ngưỡng chống giả mạo"
                  value={config.spoofThreshold}
                  onChange={(v) => updateField("spoofThreshold", v)}
                  min={0.0}
                  max={0.95}
                  step={0.05}
                  hint="Cao hơn = bảo mật tốt hơn nhưng dễ bị từ chối nhầm"
                  error={errors.spoofThreshold}
                />
                <Separator className="bg-border/40" />
                <div className="space-y-2">
                  <Label className="text-sm font-medium">Chế độ Liveness</Label>
                  <Select
                    value={config.livenessMode}
                    onValueChange={(v) => updateField("livenessMode", v)}
                  >
                    <SelectTrigger className="w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SINGLE_FRAME">
                        <div className="flex items-center gap-2">
                          <Zap className="w-3.5 h-3.5 text-amber-500" />
                          <span>Nhanh (1 khung hình)</span>
                        </div>
                      </SelectItem>
                      <SelectItem value="MULTI_FRAME">
                        <div className="flex items-center gap-2">
                          <Eye className="w-3.5 h-3.5 text-primary" />
                          <span>Chính xác (nhiều khung hình)</span>
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <SliderField
                  label="Số frame yêu cầu"
                  value={config.requiredFrames}
                  onChange={(v) => updateField("requiredFrames", v)}
                  min={5}
                  max={30}
                  step={1}
                  unit=" frame"
                  disabled={config.livenessMode === "SINGLE_FRAME"}
                  hint="Chỉ áp dụng khi dùng Multi-frame"
                  error={errors.requiredFrames}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Camera */}
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-border/40 bg-white backdrop-blur-md">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-xl ${sectionIcons.camera.bg}`}
                  >
                    <Camera
                      className={`h-5 w-5 ${sectionIcons.camera.color}`}
                    />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Cài Đặt Camera</CardTitle>
                    <CardDescription>
                      Điều chỉnh cách camera thu thập dữ liệu
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <SliderField
                  label="Khoảng thời gian chụp"
                  value={config.captureIntervalMs}
                  onChange={(v) => updateField("captureIntervalMs", v)}
                  min={200}
                  max={2000}
                  step={100}
                  unit="ms"
                  hint="Khoảng cách giữa các lần capture tự động"
                  error={errors.captureIntervalMs}
                />
                <Separator className="bg-border/40" />
                <SliderField
                  label="Kích thước mặt tối thiểu"
                  value={config.faceDetectionMinSize}
                  onChange={(v) => updateField("faceDetectionMinSize", v)}
                  min={40}
                  max={200}
                  step={10}
                  unit="px"
                  error={errors.faceDetectionMinSize}
                />
                <Separator className="bg-border/40" />
                <SliderField
                  label="Số khuôn mặt tối đa"
                  value={config.maxFacesAllowed}
                  onChange={(v) => updateField("maxFacesAllowed", v)}
                  min={1}
                  max={3}
                  step={1}
                  error={errors.maxFacesAllowed}
                />
                <Separator className="bg-border/40" />
                <div className="flex items-center justify-between p-4 border rounded-lg border-border/30 bg-background/50">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Lưu ảnh điểm danh
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Dùng để audit hoặc kiểm tra sau
                    </p>
                  </div>
                  <Switch
                    checked={config.saveAttendanceImage}
                    onCheckedChange={(v) =>
                      updateField("saveAttendanceImage", v)
                    }
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Right: Model Info Panel (sticky) */}
        <div className="lg:top-6 lg:self-start">
          <ModelInfoPanel config={config} />
        </div>
      </div>
    </motion.div>
  );
}
