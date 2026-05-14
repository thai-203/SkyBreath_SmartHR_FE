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
        "Công nghệ cốt lõi giúp hệ thống nhận biết danh tính chính xác dựa trên các đặc điểm sinh trắc học duy nhất của mỗi nhân viên.",
      specs:
        config.arcfaceModelName === "buffalo_l"
          ? "Độ chính xác tối đa · Phù hợp môi trường văn phòng"
          : config.arcfaceModelName === "buffalo_m"
            ? "Cân bằng tốc độ và độ chính xác · Phù hợp thiết bị tầm trung"
            : "Thế hệ mới · Tối ưu cho xử lý thời gian thực",
      color: "text-primary",
      bgColor: "bg-primary-10",
    },
    {
      icon: Shield,
      name: `Anti-Spoof — ${config.antiSpoofModelVersion || "V2"}`,
      role: "Phát hiện giả mạo",
      whatItDoes:
        "Lớp bảo vệ thông minh giúp phân biệt người thật với ảnh chụp hoặc video trên điện thoại, ngăn chặn các hành vi gian lận.",
      specs: `Chế độ: ${config.livenessMode === "MULTI_FRAME" ? "Phân tích chuyển động (An toàn cao)" : "Phân tích tĩnh (Xử lý nhanh)"}`,
      color: "text-emerald-600 dark:text-emerald-400",
      bgColor: "bg-emerald-500/10",
    },
    {
      icon: ScanFace,
      name: "Cơ sở dữ liệu",
      role: "Mẫu nhận diện",
      whatItDoes: `Hệ thống ghi nhớ ${config.maxEmbeddingsPerUser} góc độ gương mặt khác nhau của mỗi nhân viên để đảm bảo việc nhận diện luôn ổn định và nhanh chóng.`,
      specs: `Tự động nhận diện tối đa ${config.maxFacesAllowed} người`,
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

const validateConfigField = (field, value) => {
  switch (field) {
    case "recognitionThreshold":
      if (value < 0.3 || value > 0.9) return "Giá trị phải từ 0.3 đến 0.9";
      break;
    case "spoofThreshold":
      if (value < 0.0 || value > 0.95) return "Giá trị phải từ 0.0 đến 0.95";
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

      {/* ── Main Configuration ───────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        {/* Left: Config Sections */}
        <div className="space-y-5">
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-border/40 bg-white backdrop-blur-md">
              <CardHeader className="pb-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary-10">
                    <ScanFace className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">Tham Số Thuật Toán</CardTitle>
                    <CardDescription>
                      Điều chỉnh độ nhạy của hệ thống nhận diện
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-8 py-6">
                <SliderField
                  label="Độ nhạy nhận diện (Recognition)"
                  value={config?.recognitionThreshold}
                  onChange={(v) => updateField("recognitionThreshold", v)}
                  min={0.3}
                  max={0.9}
                  step={0.05}
                  hint="Giá trị cao tăng độ an toàn nhưng yêu cầu nhân viên nhìn thẳng và đủ sáng."
                  error={errors.recognitionThreshold}
                />
                
                <Separator className="bg-border/40" />

                <SliderField
                  label="Mức độ chống gian lận (Anti-Spoof)"
                  value={config.spoofThreshold}
                  onChange={(v) => updateField("spoofThreshold", v)}
                  min={0.0}
                  max={0.95}
                  step={0.05}
                  hint="Giá trị cao giúp ngăn chặn tốt hơn các loại ảnh/video giả mạo."
                  error={errors.spoofThreshold}
                />
              </CardContent>
            </Card>
          </motion.div>

          {/* Info Section for Read-only settings */}
          <motion.div variants={itemVariants}>
            <div className="rounded-xl border border-border/30 bg-background/50 p-5 flex items-start gap-4">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10">
                <Camera className="h-5 w-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h4 className="text-sm font-semibold mb-1.5">Tham số phần cứng & Camera</h4>
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Các thiết lập kỹ thuật sau đây đã được tối ưu hóa để phù hợp với hiệu năng thiết bị của bạn:
                  </p>
                  <ul className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-[11px] text-foreground/70">
                    <li className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-border" />
                      Nhận diện từ: {config.faceDetectionMinSize}px
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-border" />
                      Tốc độ xử lý: {config.captureIntervalMs}ms
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-border" />
                      Lưu bằng chứng: {config.saveAttendanceImage ? "Đã bật" : "Đã tắt"}
                    </li>
                    <li className="flex items-center gap-1.5">
                      <div className="w-1 h-1 rounded-full bg-border" />
                      Giới hạn: {config.maxFacesAllowed} người/lần
                    </li>
                  </ul>
                </div>
              </div>
            </div>
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
