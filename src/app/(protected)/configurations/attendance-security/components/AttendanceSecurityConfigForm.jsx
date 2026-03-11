"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/common/Card";
import { RotateCcw, Save } from "lucide-react";
import { AllowedIpList } from "./AllowedIpList";

export default function AttendanceSecurityConfigForm({
  config,
  onConfigChange,
  onSubmit,
  loading,
  errors = {},
  onResetRequest,
  allowedIps = [],
  onAllowedIpCreate,
  onAllowedIpDelete,
  currentIp,
  allowedIpsLoading = false,
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
      title: "Bảo mật định vị",
      description: "Xác minh vị trí điểm danh dựa trên tọa độ văn phòng",
      fields: [
        {
          id: "requireLocationCheck",
          label: "Yêu cầu kiểm tra vị trí",
          type: "checkbox",
          hint: "Bật để kiểm tra vị trí GPS khi điểm danh",
        },
        {
          id: "officeLatitude",
          label: "Kinh độ văn phòng",
          type: "number",
          placeholder: "Ví dụ: 10.762622",
          hint: "Nhập kinh độ của văn phòng (WGS84)",
        },
        {
          id: "officeLongitude",
          label: "Vĩ độ văn phòng",
          type: "number",
          placeholder: "Ví dụ: 106.660172",
          hint: "Nhập vĩ độ của văn phòng (WGS84)",
        },
        {
          id: "locationRadiusMeters",
          label: "Bán kính cho phép (m)",
          type: "number",
          placeholder: "Ví dụ: 100",
          hint: "Khoảng cách tối đa cho phép tính bằng mét",
        },
      ],
    },
    {
      title: "Bảo mật thiết bị",
      description: "Một số thiết lập mở rộng để ngăn chặn gian lận điểm danh",
      fields: [
        {
          id: "requireSingleFace",
          label: "Chỉ cho phép 1 khuôn mặt",
          type: "checkbox",
          hint: "Bật để buộc chỉ nhận diện 1 khuôn mặt trong khung hình",
        },
        {
          id: "blockVpn",
          label: "Chặn VPN",
          type: "checkbox",
          hint: "Bật để chặn điểm danh khi phát hiện kết nối VPN",
        },
      ],
    },
  ];

  return (
    <div className="w-full space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Bảo mật IP</CardTitle>
          <CardDescription>Chặn hoặc cho phép các dải IP cụ thể khi điểm danh</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                id="requireIpCheck"
                type="checkbox"
                checked={config.requireIpCheck || false}
                onChange={(e) => handleChange("requireIpCheck", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
              />
              <label
                htmlFor="requireIpCheck"
                className="flex-1 cursor-pointer text-sm font-medium text-slate-900"
              >
                Yêu cầu kiểm tra IP
              </label>
            </div>
            <p className="text-xs text-slate-500 ml-7">
              Bật để chỉ cho phép các IP trong danh sách truy cập
            </p>
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
              <input
                id="allowPublicNetwork"
                type="checkbox"
                checked={config.allowPublicNetwork || false}
                onChange={(e) => handleChange("allowPublicNetwork", e.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
              />
              <label
                htmlFor="allowPublicNetwork"
                className="flex-1 cursor-pointer text-sm font-medium text-slate-900"
              >
                Cho phép mạng công cộng
              </label>
            </div>
            <p className="text-xs text-slate-500 ml-7">
              Nếu bật, sẽ cho phép IP bên ngoài mà không cần trong danh sách
            </p>
          </div>

          <AllowedIpList
            allowedIps={allowedIps}
            onCreate={onAllowedIpCreate}
            onDelete={onAllowedIpDelete}
            currentIp={currentIp}
            disabled={loading || allowedIpsLoading}
            loading={allowedIpsLoading}
          />
        </CardContent>
      </Card>

      {sections.map((section, idx) => (
        <Card key={idx}>
          <CardHeader>
            <CardTitle>{section.title}</CardTitle>
            <CardDescription>{section.description}</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {section.fields.map((field) => (
              <div key={field.id} className="space-y-2">
                {field.type === "checkbox" ? (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-200">
                    <input
                      id={field.id}
                      type="checkbox"
                      checked={config[field.id] || false}
                      onChange={(e) => handleChange(field.id, e.target.checked)}
                      className="h-4 w-4 rounded border-slate-300 text-indigo-600 cursor-pointer"
                    />
                    <label
                      htmlFor={field.id}
                      className="flex-1 cursor-pointer text-sm font-medium text-slate-900"
                    >
                      {field.label}
                    </label>
                  </div>
                ) : (
                  <>
                    <Label htmlFor={field.id}>{field.label}</Label>
                    {field.type === "textarea" ? (
                      <textarea
                        id={field.id}
                        className="w-full min-h-[120px] resize-none rounded-lg border border-slate-200 bg-white p-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500"
                        placeholder={field.placeholder}
                        value={ipListText(config[field.id])}
                        onChange={(e) => handleJsonArrayChange(field.id, e.target.value)}
                      />
                    ) : (
                      <Input
                        id={field.id}
                        type={field.type}
                        placeholder={field.placeholder}
                        value={config[field.id] ?? ""}
                        onChange={(e) => handleNumberChange(field.id, e.target.value)}
                        min={field.min}
                        max={field.max}
                        step={field.step}
                        error={errors[field.id]}
                      />
                    )}
                    {field.hint && <p className="text-xs text-slate-500">{field.hint}</p>}
                  </>
                )}
                {field.hint && field.type === "checkbox" && (
                  <p className="text-xs text-slate-500 ml-7">{field.hint}</p>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

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
