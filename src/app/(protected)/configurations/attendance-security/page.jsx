"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { ShieldOff, ShieldCheck, ChevronLeft, AlertCircle } from "lucide-react";
import { useToast } from "@/components/common/Toast";
import {
  attendanceSecurityService,
  attendanceAllowedIpService,
} from "@/services";
import { Skeleton } from "@/components/common/Skeleton";
import { Button } from "@/components/common/Button";
import AttendanceSecurityConfigForm from "./components/AttendanceSecurityConfigForm";
import { PageTitle } from "@/components/common/PageTitle";
import { useRouter } from "next/navigation";
import { ConfirmModal } from "@/components/common/Modal";

export default function AttendanceSecurityPage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const router = useRouter();

  const [config, setConfig] = useState(null);
  const [savedConfig, setSavedConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const [allowedIps, setAllowedIps] = useState([]);
  const [allowedIpsLoading, setAllowedIpsLoading] = useState(true);
  const [currentIp, setCurrentIp] = useState(null);

  const loadConfig = useCallback(async () => {
    try {
      setLoading(true);
      const data = await attendanceSecurityService.getConfig();
      const loadedConfig = data.data || data;
      setConfig(loadedConfig);
      setSavedConfig(loadedConfig);
      setErrors({});
    } catch (err) {
      toastError(
        err.response?.data?.message ||
          "Không thể tải cấu hình bảo mật điểm danh",
      );
      console.error(err);

      const defaultConfig = {
        requireIpCheck: true,
        allowPublicNetwork: false,
        requireLocationCheck: false,
        officeLatitude: null,
        officeLongitude: null,
        locationRadiusMeters: null,
        requireSingleFace: true,
        blockVpn: false,
      };
      setConfig(defaultConfig);
      setSavedConfig(defaultConfig);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  const loadAllowedIps = useCallback(async () => {
    try {
      setAllowedIpsLoading(true);
      const data = await attendanceAllowedIpService.listAllowedIps();
      setAllowedIps(data.data || data);
    } catch (err) {
      toastError(
        err.response?.data?.message || "Không thể tải danh sách IP cho phép",
      );
      console.error(err);
      setAllowedIps([]);
    } finally {
      setAllowedIpsLoading(false);
    }
  }, [toastError]);

  const loadCurrentIp = useCallback(async () => {
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      if (!res.ok) throw new Error("Failed to fetch current IP");
      const json = await res.json();
      setCurrentIp(json.ip);
    } catch (err) {
      console.error("Unable to fetch current IP", err);
      setCurrentIp(null);
    }
  }, []);

  useEffect(() => {
    loadConfig();
    loadAllowedIps();
    loadCurrentIp();
  }, [loadConfig, loadAllowedIps, loadCurrentIp]);

  const handleConfigChange = (newConfig) => {
    setConfig(newConfig);
    setErrors({});
  };

  const handleSubmit = async () => {
    try {
      setSaving(true);
      setErrors({});

      const validationErrors = {};

      if (config.requireLocationCheck) {
        if (config.officeLatitude === null || isNaN(config.officeLatitude)) {
          validationErrors.officeLatitude = "Vui lòng nhập kinh độ văn phòng";
        }
        if (config.officeLongitude === null || isNaN(config.officeLongitude)) {
          validationErrors.officeLongitude = "Vui lòng nhập vĩ độ văn phòng";
        }
        if (!config.locationRadiusMeters || config.locationRadiusMeters < 1) {
          validationErrors.locationRadiusMeters = "Bán kính phải lớn hơn 0";
        }
      }

      if (Object.keys(validationErrors).length > 0) {
        setErrors(validationErrors);
        toastError("Vui lòng kiểm tra lại các giá trị nhập");
        return;
      }

      const payload = { ...config };
      const response = await attendanceSecurityService.updateConfig(payload);
      const saved = response.data || response;
      setConfig(saved);
      setSavedConfig(saved);
      toastSuccess("Cấu hình bảo mật điểm danh đã được lưu thành công");
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể lưu cấu hình");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateAllowedIp = async (payload) => {
    try {
      const response =
        await attendanceAllowedIpService.createAllowedIp(payload);
      const newItem = response.data || response;
      setAllowedIps((prev) => [...prev, newItem]);
      toastSuccess("Đã thêm IP vào danh sách");
      return newItem;
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể thêm IP cho phép");
      console.error(err);
      throw err;
    }
  };

  const handleDeleteAllowedIp = async (id) => {
    try {
      await attendanceAllowedIpService.deleteAllowedIp(id);
      setAllowedIps((prev) => prev.filter((item) => item.id !== id));
      toastSuccess("Đã xóa IP khỏi danh sách");
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể xóa IP");
      console.error(err);
      throw err;
    }
  };

  const requestReset = () => {
    setIsResetModalOpen(true);
  };

  const isDirty = useMemo(() => {
    if (!savedConfig || !config) return false;

    try {
      return JSON.stringify(savedConfig) !== JSON.stringify(config);
    } catch {
      return false;
    }
  }, [savedConfig, config]);

  const performReset = async () => {
    setIsResetModalOpen(false);
    try {
      setSaving(true);
      const response = await attendanceSecurityService.resetToDefaults();
      const resetConfig = response.data || response;
      setConfig(resetConfig);
      setSavedConfig(resetConfig);
      setErrors({});
      toastSuccess("Cấu hình đã được đặt lại về mặc định");
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể đặt lại cấu hình");
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const goBack = () => {
    router.push("/configurations");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle
          icon={ShieldOff}
          title="Bảo Mật Điểm Danh"
          description="Thiết lập các biện pháp bảo mật khi điểm danh"
        />
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-8 w-28" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageTitle
        icon={ShieldOff}
        title="Bảo Mật Điểm Danh"
        description="Thiết lập các biện pháp bảo mật khi điểm danh"
      />

      {isDirty && (
        <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="text-amber-800 flex items-center gap-2">
            <AlertCircle className="text-yellow-500" size={20} />
            <p className="font-medium d-flex">Bạn có thay đổi chưa lưu</p>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Bảo Mật Điểm Danh
          </h1>
          <p className="text-slate-500">
            Thiết lập các biện pháp bảo mật khi điểm danh
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <Button variant="outline" onClick={goBack}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Quay lại cấu hình
          </Button>
        </div>
      </div>

      <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg flex gap-3">
        <ShieldCheck className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Lưu ý:</p>
          <ul className="list-disc list-inside space-y-1 text-xs">
            <li>
              Chỉ bật kiểm tra IP khi bạn đã định nghĩa danh sách IP cho phép.
            </li>
            <li>
              Kiểm tra vị trí sẽ yêu cầu GPS chính xác từ thiết bị
              (mobile/desktop).
            </li>
            <li>
              Chặn VPN có thể ảnh hưởng đến người dùng thực (tùy thuộc vào môi
              trường).
            </li>
          </ul>
        </div>
      </div>

      {config && (
        <AttendanceSecurityConfigForm
          config={config}
          onConfigChange={handleConfigChange}
          onSubmit={handleSubmit}
          loading={saving}
          errors={errors}
          onResetRequest={requestReset}
          allowedIps={allowedIps}
          allowedIpsLoading={allowedIpsLoading}
          onAllowedIpCreate={handleCreateAllowedIp}
          onAllowedIpDelete={handleDeleteAllowedIp}
          currentIp={currentIp}
        />
      )}

      <ConfirmModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={performReset}
        title="Đặt lại cấu hình về mặc định"
        description="Hành động này sẽ khôi phục tất cả cài đặt bảo mật điểm danh về mặc định. Bạn có chắc chắn?"
        confirmText="Đặt lại"
        cancelText="Hủy"
        loading={saving}
      />
    </div>
  );
}
