"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/common/Toast";
import { PageTitle } from "@/components/common/PageTitle";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { userService } from "@/services";
import ProfileEditModal from "./components/ProfileEditModal";
import {
  Eye,
  EyeOff,
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
} from "lucide-react";
import { mockUserProfile } from "./mockData";

// Set to true to use mock data instead of API
const USE_MOCK_DATA = false;

const SENSITIVE_FIELDS = {
  email: true,
  role: true,
  username: true,
};

export default function ProfilePage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSensitive, setShowSensitive] = useState({});

  // Load profile
  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      setLoading(true);

      // Use mock data if enabled
      if (USE_MOCK_DATA) {
        // Simulate network delay
        await new Promise((resolve) => setTimeout(resolve, 500));
        setProfile(mockUserProfile.data || mockUserProfile);
      } else {
        const data = await userService.getProfile();
        setProfile(data.data || data);
      }
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể tải hồ sơ");
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdated = async () => {
    setIsEditModalOpen(false);
    await loadProfile();
    toastSuccess("Hồ sơ đã được cập nhật thành công");
  };

  const maskSensitiveField = (value, fieldName) => {
    if (!SENSITIVE_FIELDS[fieldName] || !value) return value;

    if (fieldName === "email") {
      const [localPart, domain] = value.split("@");
      const maskedLocal =
        localPart.substring(0, 2) + "*".repeat(localPart.length - 2);
      return `${maskedLocal}@${domain}`;
    }

    return "*".repeat(value.length);
  };

  const toggleSensitiveDisplay = (fieldName) => {
    setShowSensitive((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const ProfileField = ({
    label,
    value,
    icon: Icon,
    fieldName,
    isSensitive = false,
  }) => {
    const displayValue =
      isSensitive && !showSensitive[fieldName]
        ? maskSensitiveField(value, fieldName)
        : value;

    return (
      <div className="flex items-center justify-between py-3 px-4 border-b border-slate-200 last:border-0 hover:bg-slate-50">
        <div className="flex items-center gap-3 flex-1">
          {Icon && <Icon className="w-5 h-5 text-slate-400" />}
          <div>
            <p className="text-sm text-slate-500">{label}</p>
            <p className="font-medium text-slate-900">{displayValue || "-"}</p>
          </div>
        </div>
        {isSensitive && value && (
          <button
            onClick={() => toggleSensitiveDisplay(fieldName)}
            className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            title={showSensitive[fieldName] ? "Ẩn trường" : "Hiện trường"}
          >
            {showSensitive[fieldName] ? (
              <EyeOff className="w-4 h-4 text-slate-400" />
            ) : (
              <Eye className="w-4 h-4 text-slate-400" />
            )}
          </button>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle title="Hồ sơ của tôi" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-40" />
          </CardHeader>
          <CardContent className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageTitle title="Hồ sơ của tôi" />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-slate-500">Không thể tải hồ sơ</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <PageTitle title="Hồ sơ của tôi" />
        <Button onClick={() => setIsEditModalOpen(true)}>
          Chỉnh sửa hồ sơ
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left: Avatar, Name, Position */}
        <div className="md:col-span-1">
          <Card>
            <CardContent className="py-6 flex flex-col items-center text-center">
              {profile.avatar ? (
                <img
                  src={profile.avatar}
                  alt="Avatar"
                  className="w-32 h-32 rounded-full object-cover border-4 border-slate-200 mb-4"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-slate-100 mb-4 flex items-center justify-center text-slate-400">
                  Không có ảnh
                </div>
              )}
              <h3 className="text-lg font-medium text-slate-900">
                {profile.fullName || "-"}
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {profile.position || "-"}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Right: Grouped cards */}
        <div className="md:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Tài khoản</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-200">
                <ProfileField
                  label="Tên đăng nhập"
                  value={profile.username}
                  icon={User}
                  fieldName="username"
                  isSensitive={true}
                />
                <ProfileField
                  label="Email công ty"
                  value={profile.email}
                  icon={Mail}
                  fieldName="email"
                  isSensitive={true}
                />
                <ProfileField
                  label="Vai trò"
                  value={profile.role}
                  icon={User}
                  fieldName="role"
                  isSensitive={true}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Tổ chức</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-200">
                <ProfileField
                  label="Phòng ban"
                  value={profile.department}
                  icon={Building2}
                />
                <ProfileField
                  label="Quản lý"
                  value={profile.manager}
                  icon={User}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Thông tin cá nhân</CardTitle>
              <CardDescription>
                Các thông tin cá nhân có thể chỉnh sửa
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="divide-y divide-slate-200">
                <ProfileField
                  label="Email cá nhân"
                  value={profile.personalEmail}
                  icon={Mail}
                />
                <ProfileField
                  label="Số điện thoại"
                  value={profile.phoneNumber}
                  icon={Phone}
                />
                <ProfileField
                  label="Địa chỉ"
                  value={profile.currentAddress}
                  icon={MapPin}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Modal */}
      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        profile={profile}
        onSuccess={handleProfileUpdated}
      />
    </div>
  );
}
