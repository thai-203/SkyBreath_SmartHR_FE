"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import { RotateCcw, Save } from "lucide-react";

export default function FaceRecognitionConfigForm({
  config,
  onConfigChange,
  onSubmit,
  loading,
  errors = {},
  onResetRequest,
}) {
  const handleChange = (field, value) => {
    onConfigChange({
      ...config,
      [field]: value,
    });
  };

  const handleNumberChange = (field, value) => {
    const numValue = value === "" ? null : parseFloat(value);
    handleChange(field, numValue);
  };

  const sections = [
    {
      title: "Cổng Nhận Diện (Recognition)",
      description: "Cài đặt ngưỡng và phương pháp nhận diện khuôn mặt",
      fields: [
        {
          id: "recognitionThreshold",
          label: "Ngưỡng Nhận Diện (0-1)",
          type: "number",
          placeholder: "Ví dụ: 0.6",
          min: 0,
          max: 1,
          step: 0.001,
          hint: "Giá trị cao hơn = yêu cầu khớp tốt hơn",
        },
        {
          id: "similarityMetric",
          label: "Phương Pháp So Sánh",
          type: "select",
          options: [
            { value: "cosine", label: "Cosine (Mặc định)" },
            { value: "euclidean", label: "Euclidean" },
          ],
        },
        {
          id: "maxEmbeddingsPerUser",
          label: "Tối Đa Embedding/Người Dùng",
          type: "number",
          placeholder: "Ví dụ: 5",
          min: 1,
          max: 100,
          hint: "Số lượng khuôn mặt tối đa lưu trữ cho mỗi người",
        },
      ],
    },
    {
      title: "Chống Giả Mạo (Anti-Spoof)",
      description: "Cài đặt bảo vệ chống nhận diện từ ảnh/video",
      fields: [
        {
          id: "spoofThreshold",
          label: "Ngưỡng Chống Giả Mạo (0-1)",
          type: "number",
          placeholder: "Ví dụ: 0.8",
          min: 0,
          max: 1,
          step: 0.001,
          hint: "Giá trị cao hơn = bảo vệ tốt hơn nhưng có thể bị từ chối",
        },
        {
          id: "livenessMode",
          label: "Chế Độ Kiểm Tra Sống",
          type: "select",
          options: [
            { value: "MULTI_FRAME", label: "Multi-Frame (Mặc định)" },
            { value: "SINGLE_FRAME", label: "Single-Frame" },
            { value: "ADVANCED", label: "Advanced" },
          ],
        },
        {
          id: "requiredFrames",
          label: "Số Frame Yêu Cầu",
          type: "number",
          placeholder: "Ví dụ: 10",
          min: 1,
          max: 100,
          hint: "Số khung hình cần xác thực cho liveness check",
        },
      ],
    },
    {
      title: "Cài Đặt Camera",
      description: "Cấu hình hành vi quay và phát hiện khuôn mặt",
      fields: [
        {
          id: "captureIntervalMs",
          label: "Khoảng Thời Gian Quay (ms)",
          type: "number",
          placeholder: "Ví dụ: 1000",
          min: 100,
          max: 10000,
          hint: "Thời gian chờ giữa các lần quay (miligiây)",
        },
        {
          id: "faceDetectionMinSize",
          label: "Kích Thước Tối Thiểu Phát Hiện (px)",
          type: "number",
          placeholder: "Ví dụ: 80",
          min: 20,
          max: 500,
          hint: "Kích thước pixel tối thiểu để nhận diện khuôn mặt",
        },
        {
          id: "maxFacesAllowed",
          label: "Số Khuôn Mặt Tối Đa Được Phép",
          type: "number",
          placeholder: "Ví dụ: 1",
          min: 1,
          max: 10,
          hint: "Số lượng khuôn mặt tối đa trong một khung hình",
        },
      ],
    },
    {
      title: "Cài Đặt Mô Hình",
      description: "Cấu hình mô hình AI và bộ nhớ",
      fields: [
        {
          id: "arcfaceModelName",
          label: "Tên Mô Hình ArcFace",
          type: "select",
          options: [
            { value: "buffalo_l", label: "Buffalo-L (Mặc định)" },
            { value: "buffalo_m", label: "Buffalo-M" },
            { value: "buffalo_s", label: "Buffalo-S" },
            { value: "vit_l", label: "ViT-L" },
            { value: "vit_m", label: "ViT-M" },
          ],
          hint: "Các mô hình lớn hơn cao hơn độ chính xác nhưng chậm hơn",
        },
        {
          id: "antiSpoofModelVersion",
          label: "Phiên Bản Mô Hình Chống Giả Mạo",
          type: "text",
          placeholder: "Ví dụ: 2.7",
          hint: "Bỏ trống để sử dụng phiên bản mặc định gần nhất",
        },
        {
          id: "saveAttendanceImage",
          label: "Lưu Ảnh Điểm Danh",
          type: "checkbox",
          hint: "Lưu ảnh khuôn mặt khi điểm danh thành công",
        },
      ],
    },
  ];

  return (
    <div className="w-full space-y-6">
      {sections.map((section, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type !== "checkbox" ? (
                  <>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.type === "select" ? (
                      <Select
                        id={field.id}
                        value={config[field.id] || ""}
                        onChange={(e) =>
                          handleChange(field.id, e.target.value)
                        }
                        options={field.options}
                        error={errors[field.id]}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={config[field.id] || ""}
                        onChange={(e) => handleNumberChange(field.id, e.target.value)}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        error={errors[field.id]}
                      />
                    )}
                    {field.hint && (
                      <p className="text-xs text-slate-500">{field.hint}</p>
                    )}
                  </>
                ) : (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                      id={field.id}
                      type="checkbox"
                      checked={config[field.id] || false}
                      onChange={(e) =>
                        handleChange(field.id, e.target.checked)
                      }
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                    />
                    <label
                      htmlFor={field.id}
                      className="flex-1 cursor-pointer text-sm font-medium text-slate-900"
                    >
                      {field.label}
                    </label>
                  </div>
                )}
                {field.hint && field.type === "checkbox" && (
                  <p className="text-xs text-slate-500 ml-7">{field.hint}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {/* Action Buttons */}
      <div className="sticky bottom-0 bg-white p-4 rounded-lg border border-slate-200 flex justify-between gap-3">
        <Button
          onClick={onResetRequest}
          disabled={loading}
          variant="outline"
          className="flex items-center gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Đặt Lại Mặc Định
        </Button>
        <Button
          onClick={onSubmit}
          disabled={loading}
          className="flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {loading ? "Đang Lưu..." : "Lưu Cấu Hình"}
        </Button>
      </div>
    </div>
  );
}
