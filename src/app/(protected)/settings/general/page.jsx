"use client";

import { useState, useEffect, useCallback } from "react";
import { useToast } from "@/components/common/Toast";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Skeleton } from "@/components/common/Skeleton";
import { userService } from "@/services";
import ProfileEditModal from "./components/ProfileEditModal";
import { ProfileHeroSection } from "./components/ProfileHeroSection";
import { ProfileSection } from "./components/ProfileSection";
import { ProfileField } from "./components/ProfileField";
import { ExpandableSection } from "./components/ExpandableSection";
import {
  Mail,
  Phone,
  MapPin,
  Building2,
  User,
  Calendar,
  FileText,
  Heart,
  Globe,
  Briefcase,
  Clock,
} from "lucide-react";

export default function ProfilePage() {
  const { success: toastSuccess, error: toastError } = useToast();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showSensitive, setShowSensitive] = useState({});

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userService.getProfile();

      setProfile(data.data || data);
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể tải hồ sơ");
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [toastError]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleProfileUpdated = async () => {
    setIsEditModalOpen(false);
    await loadProfile();
  };

  const toggleSensitiveDisplay = (fieldName) => {
    setShowSensitive((prev) => ({
      ...prev,
      [fieldName]: !prev[fieldName],
    }));
  };

  const formatDate = (date) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  const formatDateTime = (datetime) => {
    if (!datetime) return "-";
    return new Date(datetime).toLocaleDateString("vi-VN", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <PageTitle title="Hồ sơ của tôi" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <div className="grid gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32 w-full rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="space-y-6">
        <PageTitle title="Hồ sơ của tôi" />
        <div className="bg-white border border-slate-200 rounded-lg p-8 text-center">
          <p className="text-slate-500">Không thể tải hồ sơ</p>
          <Button onClick={loadProfile} variant="secondary" className="mt-4">
            Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <PageTitle title="Hồ sơ của tôi" />
        <Button onClick={() => setIsEditModalOpen(true)}>
          Chỉnh sửa hồ sơ
        </Button>
      </div>

      {/* Hero Section */}
      <ProfileHeroSection profile={profile} loading={loading} />

      {/* Account Information */}
      <ProfileSection
        title="Thông tin tài khoản"
        description="Các trường nhạy cảm đã được ẩn mặc định"
      >
        <ProfileField
          label="Tên đăng nhập"
          value={profile.username}
          icon={User}
          fieldName="username"
          isSensitive={true}
          showSensitive={showSensitive.username}
          onToggleSensitive={toggleSensitiveDisplay}
          variant="sensitive"
        />
        <ProfileField
          label="Email công ty"
          value={profile.companyEmail || profile.email}
          icon={Mail}
          fieldName="email"
          isSensitive={true}
          showSensitive={showSensitive.email}
          onToggleSensitive={toggleSensitiveDisplay}
          variant="sensitive"
        />
        <ProfileField
          label="Vai trò"
          value={profile.roles?.[0] || profile.role}
          icon={Briefcase}
          fieldName="role"
          isSensitive={true}
          showSensitive={showSensitive.role}
          onToggleSensitive={toggleSensitiveDisplay}
          variant="sensitive"
        />
        <ProfileField
          label="Trạng thái"
          value={
            profile.status === "ACTIVE"
              ? "Hoạt động"
              : profile.status === "LOCKED"
                ? "Bị khóa"
                : profile.status === "INACTIVE"
                  ? "Không hoạt động"
                  : profile.status === "DELETED"
                    ? "Đã xóa"
                    : profile.status
          }
          icon={Briefcase}
          variant="readonly"
        />
      </ProfileSection>

      {/* Organization Information */}
      <ProfileSection
        title="Thông tin tổ chức"
        description="Chi tiết tổ chức chỉ đọc"
      >
        <ProfileField
          label="Phòng ban"
          value={profile?.department?.name || profile?.department}
          icon={Building2}
          variant="readonly"
        />
        <ProfileField
          label="Chức vụ"
          value={profile.position?.name || profile.position}
          icon={Briefcase}
          variant="readonly"
        />
        {profile.jobGrade && (
          <ProfileField
            label="Bậc lương"
            value={profile.jobGrade?.name || profile.jobGrade}
            icon={FileText}
            variant="readonly"
          />
        )}
        <ProfileField
          label="Quản lý trực tiếp"
          value={profile?.directManager?.name || "Chưa được phân công"}
          icon={User}
          variant="readonly"
        />
        {profile.hrMentor && (
          <ProfileField
            label="Cố vấn HR"
            value={profile.hrMentor}
            icon={User}
            variant="readonly"
          />
        )}
        {profile.employmentStatus && (
          <ProfileField
            label="Tình trạng công việc"
            value={
              profile.employmentStatus === "ACTIVE"
                ? "Đang làm việc"
                : profile.employmentStatus === "PROBATION"
                  ? "Thử việc"
                  : profile.employmentStatus === "ON_LEAVE"
                    ? "Nghỉ phép"
                    : profile.employmentStatus === "TERMINATED"
                      ? "Đã nghỉ việc"
                      : profile.employmentStatus
            }
            icon={Briefcase}
            variant="readonly"
          />
        )}
        {profile.joinDate && (
          <ProfileField
            label="Ngày gia nhập"
            value={formatDate(profile.joinDate)}
            icon={Calendar}
            variant="readonly"
          />
        )}
      </ProfileSection>

      {/* Contact Information */}
      <ProfileSection
        title="Thông tin liên hệ"
        description="Thông tin liên hệ có thể chỉnh sửa"
      >
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
          label="Địa chỉ hiện tại"
          value={profile.currentAddress}
          icon={MapPin}
        />
      </ProfileSection>

      {/* Expandable Sections */}
      <div className="space-y-4">
        {/* Personal Details */}
        <ExpandableSection
          title="Chi tiết cá nhân"
          icon="📋"
          defaultOpen={false}
        >
          {profile.dateOfBirth && (
            <ProfileField
              label="Ngày sinh"
              value={formatDate(profile.dateOfBirth)}
              icon={Calendar}
              variant="readonly"
            />
          )}
          {profile.gender && (
            <ProfileField
              label="Giới tính"
              value={
                profile.gender === "MALE"
                  ? "Nam"
                  : profile.gender === "FEMALE"
                    ? "Nữ"
                    : "Khác"
              }
              icon={User}
              variant="readonly"
            />
          )}
          {profile.maritalStatus && (
            <ProfileField
              label="Tình trạng hôn nhân"
              value={
                profile.maritalStatus === "SINGLE"
                  ? "Độc thân"
                  : profile.maritalStatus === "MARRIED"
                    ? "Đã kết hôn"
                    : profile.maritalStatus
              }
              icon={Heart}
              variant="readonly"
            />
          )}
          {profile.nationality && (
            <ProfileField
              label="Quốc tịch"
              value={profile.nationality}
              icon={Globe}
              variant="readonly"
            />
          )}
        </ExpandableSection>

        {/* Address Details */}
        {(profile.currentAddress || profile.permanentAddress) && (
          <ExpandableSection
            title="Chi tiết địa chỉ"
            icon="🏠"
            defaultOpen={false}
          >
            {profile.currentAddress && (
              <ProfileField
                label="Địa chỉ hiện tại"
                value={profile.currentAddress}
                icon={MapPin}
                variant="readonly"
              />
            )}
            {profile.permanentAddress && (
              <ProfileField
                label="Địa chỉ thường trú"
                value={profile.permanentAddress}
                icon={MapPin}
                variant="readonly"
              />
            )}
          </ExpandableSection>
        )}

        {/* Government IDs */}
        {(profile.nationalId || profile.taxCode) && (
          <ExpandableSection
            title="Chứng minh thư & mã số thuế"
            icon="🪪"
            defaultOpen={false}
          >
            {profile.nationalId && (
              <ProfileField
                label="CMND/Hộ chiếu"
                value={profile.nationalId}
                icon={FileText}
                variant="readonly"
              />
            )}
            {profile.nationalIdIssuedDate && (
              <ProfileField
                label="Ngày cấp"
                value={formatDate(profile.nationalIdIssuedDate)}
                icon={Calendar}
                variant="readonly"
              />
            )}
            {profile.nationalIdIssuedPlace && (
              <ProfileField
                label="Nơi cấp"
                value={profile.nationalIdIssuedPlace}
                icon={Building2}
                variant="readonly"
              />
            )}
            {profile.taxCode && (
              <ProfileField
                label="Mã số thuế"
                value={profile.taxCode}
                icon={FileText}
                variant="readonly"
              />
            )}
          </ExpandableSection>
        )}
      </div>

      {/* System Information */}
      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6 shadow-sm">
        <h3 className="text-sm font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4" />
          Thông tin hệ thống
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-slate-600 font-medium">Tạo lúc</p>
            <p className="text-slate-900 mt-1">
              {formatDateTime(profile.createdAt)}
            </p>
          </div>
          <div>
            <p className="text-slate-600 font-medium">Cập nhật lần cuối</p>
            <p className="text-slate-900 mt-1">
              {formatDateTime(profile.updatedAt)}
            </p>
          </div>
          <div>
            <p className="text-slate-600 font-medium">Last Login</p>
            <p className="text-slate-900 mt-1">
              {profile.lastLoginTime
                ? formatDateTime(profile.lastLoginTime)
                : "Chưa từng"}
            </p>
          </div>
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
