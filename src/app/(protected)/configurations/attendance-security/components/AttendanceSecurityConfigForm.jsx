"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import { Switch } from "@/components/ui/switch";
import { AllowedIpList } from "./AllowedIpList";
import { motion } from "framer-motion";
import LocationMapPicker from "./LocationMapPicker";

export default function AttendanceSecurityConfigForm({
  config,
  onConfigChange,
  loading,
  errors = {},
  allowedIps = [],
  onAllowedIpCreate,
  onAllowedIpDelete,
  currentIp,
  allowedIpsLoading = false,
  itemVariants,
}) {
  // Trạng thái lưu trữ lỗi cục bộ để validate real-time
  const [localErrors, setLocalErrors] = useState({});

  // Đồng bộ lỗi từ component cha (nếu có lúc submit)
  useEffect(() => {
    setLocalErrors((prev) => ({ ...prev, ...errors }));
  }, [errors]);

  // Logic validate dữ liệu
  const validateField = (field, value, currentConfig) => {
    let errorMsg = null;
    if (currentConfig.requireLocationCheck) {
      if (field === "officeLatitude") {
        if (value === null || value === "") errorMsg = "Vui lòng nhập vĩ độ";
        else if (value < -90 || value > 90)
          errorMsg = "Vĩ độ phải từ -90 đến 90";
      }
      if (field === "officeLongitude") {
        if (value === null || value === "") errorMsg = "Vui lòng nhập kinh độ";
        else if (value < -180 || value > 180)
          errorMsg = "Kinh độ phải từ -180 đến 180";
      }
      if (field === "locationRadiusMeters") {
        if (value === null || value === "") errorMsg = "Vui lòng nhập bán kính";
        else if (value < 1) errorMsg = "Bán kính phải lớn hơn 0m";
      }
    }
    return errorMsg;
  };

  const handleChange = (field, value) => {
    const nextConfig = { ...config, [field]: value };
    onConfigChange(nextConfig);
    console.log(nextConfig);
    

    // Validate field hiện tại
    const errorMsg = validateField(field, value, nextConfig);

    // Nếu thay đổi trạng thái bật/tắt vị trí, cần validate/xóa lỗi các trường liên quan
    if (field === "requireLocationCheck") {
      setLocalErrors({
        ...localErrors,
        [field]: errorMsg,
        officeLatitude: validateField(
          "officeLatitude",
          nextConfig.officeLatitude,
          nextConfig,
        ),
        officeLongitude: validateField(
          "officeLongitude",
          nextConfig.officeLongitude,
          nextConfig,
        ),
        locationRadiusMeters: validateField(
          "locationRadiusMeters",
          nextConfig.locationRadiusMeters,
          nextConfig,
        ),
      });
    } else {
      setLocalErrors((prev) => ({ ...prev, [field]: errorMsg }));
    }
  };

  const handleNumberChange = (field, value) => {
    const numValue = value === "" ? null : parseFloat(value);
    handleChange(field, numValue);
  };

  const handleLocationSelect = (location) => {
    const nextConfig = {
      ...config,
      officeLatitude: location?.latitude ?? null,
      officeLongitude: location?.longitude ?? null,
    };
    onConfigChange(nextConfig);
    console.log(nextConfig);

    setLocalErrors((prev) => ({
      ...prev,
      officeLatitude: validateField(
        "officeLatitude",
        nextConfig.officeLatitude,
        nextConfig,
      ),
      officeLongitude: validateField(
        "officeLongitude",
        nextConfig.officeLongitude,
        nextConfig,
      ),
    }));
  };

  const sections = [
    {
      title: "Bảo mật định vị",
      description: "Xác minh vị trí điểm danh dựa trên tọa độ văn phòng",
      fields: [
        {
          id: "requireLocationCheck",
          label: "Yêu cầu kiểm tra vị trí",
          type: "switch",
          hint: "Bật để kiểm tra vị trí GPS khi điểm danh",
        },
        {
          id: "locationRadiusMeters",
          label: "Bán kính cho phép (m)",
          type: "number",
          placeholder: "Ví dụ: 100",
          hint: "Khoảng cách tối đa cho phép tính bằng mét",
          dependentOn: "requireLocationCheck",
        },
      ],
    },
    {
      title: "Bảo mật thiết bị",
      description: "Một số thiết lập mở rộng để ngăn chặn gian lận điểm danh",
      fields: [
        {
          id: "blockVpn",
          label: "Chặn VPN",
          type: "switch",
          hint: "Bật để chặn điểm danh khi phát hiện kết nối VPN",
        },
      ],
    },
  ];

  return (
    <motion.div variants={itemVariants} className="w-full space-y-6">
      {/* ── BẢO MẬT IP ── */}
      <Card>
        <CardHeader>
          <CardTitle>Bảo mật IP</CardTitle>
          <CardDescription>
            Chặn hoặc cho phép các dải IP cụ thể khi điểm danh
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-0.5">
              <Label
                htmlFor="requireIpCheck"
                className="text-sm font-medium text-slate-900 cursor-pointer"
              >
                Yêu cầu kiểm tra IP
              </Label>
              <p className="text-xs text-slate-500">
                Bật để chỉ cho phép các IP trong danh sách truy cập
              </p>
            </div>
            <Switch
              id="requireIpCheck"
              checked={config.requireIpCheck || false}
              onCheckedChange={(v) => handleChange("requireIpCheck", v)}
            />
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

      {/* ── CÁC SECTIONS KHÁC (VỊ TRÍ & THIẾT BỊ) ── */}
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.title === "Bảo mật định vị" && config.requireLocationCheck && (
            <>
              <LocationMapPicker
                latitude={config.officeLatitude}
                longitude={config.officeLongitude}
                onLocationSelect={handleLocationSelect}
                disabled={!config.requireLocationCheck}
              />
              <div className="mt-6" />
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.fields.map((field) => {
                // Khóa các ô input nếu chưa bật Switch
                const isDisabled =
                  field.dependentOn && !config[field.dependentOn];

                return (
                  <div key={field.id} className="space-y-2">
                    {field.type === "switch" ? (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor={field.id}
                            className="text-sm font-medium text-slate-900 cursor-pointer"
                          >
                            {field.label}
                          </Label>
                          {field.hint && (
                            <p className="text-xs text-slate-500">
                              {field.hint}
                            </p>
                          )}
                        </div>
                        <Switch
                          id={field.id}
                          checked={config[field.id] || false}
                          onCheckedChange={(v) =>
                            handleChange(field.id, v)
                          }
                        />
                      </div>
                    ) : (
                      <div
                        className={`space-y-1.5 ${
                          isDisabled ? "opacity-60" : ""
                        }`}
                      >
                        <Label htmlFor={field.id}>{field.label}</Label>

                        <Input
                          id={field.id}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={config[field.id] ?? ""}
                          onChange={(e) =>
                            handleNumberChange(field.id, e.target.value)
                          }
                          disabled={isDisabled}
                          error={localErrors[field.id]}
                          className={
                            localErrors[field.id]
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </motion.div>
  );
}
