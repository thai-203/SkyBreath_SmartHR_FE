"use client";

import { useState, useEffect, useRef } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { useToast } from "@/components/common/Toast";
import { userService } from "@/services";
import {
  validate,
  email as emailValidator,
  phone as phoneValidator,
  maxLength,
  fileSize,
  fileType,
} from "@/lib/validation";
import { Upload, X, Lock, Info } from "lucide-react";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000";

const BACKEND_URL = "http://localhost:3000";

export default function ProfileEditModal({
  isOpen,
  onClose,
  profile,
  onSuccess,
}) {
  const { success: toastSuccess, error: toastError } = useToast();
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState({});
  const [previewAvatar, setPreviewAvatar] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    // full name is displayed but not editable
    name: "",
    personalEmail: "",
    phone: "",
    currentAddress: "",
    permanentAddress: "",
    avatar: null,
  });
  const [initialData, setInitialData] = useState(null);

  useEffect(() => {
    if (isOpen) {
      const initialFormData = {
        // name pulled from profile for display only
        name: profile?.fullName || "",
        personalEmail: profile?.personalEmail || "",
        phone: profile?.phoneNumber || "",
        currentAddress: profile?.currentAddress || "",
        permanentAddress: profile?.permanentAddress || "",
        avatar: profile?.avatar || null,
      };
      setFormData(initialFormData);
      setInitialData(initialFormData);
      setPreviewAvatar(null);
      setSelectedFile(null);
      setErrors({});
    }
  }, [isOpen, profile]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: null }));
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const fileSizeError = fileSize(
      5,
      "Kích thước avatar không được vượt quá 5MB",
    )(file);
    if (fileSizeError)
      return setErrors((p) => ({ ...p, avatar: fileSizeError }));

    const fileTypeError = fileType(
      ["image/jpeg", "image/png", "image/gif", "image/webp"],
      "Chỉ hỗ trợ các định dạng: JPEG, PNG, GIF, WebP",
    )(file);
    if (fileTypeError)
      return setErrors((p) => ({ ...p, avatar: fileTypeError }));

    const reader = new FileReader();
    reader.onloadend = () => setPreviewAvatar(reader.result);
    reader.readAsDataURL(file);

    setSelectedFile(file);
    setFormData((prev) => ({ ...prev, avatar: file }));
    setErrors((p) => ({ ...p, avatar: null }));
  };

  const removeAvatar = () => {
    setPreviewAvatar(null);
    setSelectedFile(null);
    setFormData((p) => ({ ...p, avatar: null }));
  };

  // Track changed fields for logging
  const getChangedFields = () => {
    const changed = {};
    // fullName cannot be changed by user
    if (formData.personalEmail !== initialData?.personalEmail)
      changed.personalEmail = formData.personalEmail;
    if (formData.phone !== initialData?.phone)
      changed.phoneNumber = formData.phone;
    if (formData.currentAddress !== initialData?.currentAddress)
      changed.currentAddress = formData.currentAddress;
    if (formData.permanentAddress !== initialData?.permanentAddress)
      changed.permanentAddress = formData.permanentAddress;
    if (selectedFile) changed.avatar = "changed";
    return changed;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, {
      // name is read-only so skip validation
      personalEmail: [emailValidator("Email không hợp lệ")],
      phone: [phoneValidator("Số điện thoại không hợp lệ")],
      currentAddress: [
        maxLength(255, "Địa chỉ hiện tại không được vượt quá 255 ký tự"),
      ],
      permanentAddress: [
        maxLength(255, "Địa chỉ thường trú không được vượt quá 255 ký tự"),
      ],
    });

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      // Prepare update data (exclude fullName as it's not editable)
      const updateData = {
        personalEmail: formData.personalEmail,
        phoneNumber: formData.phone,
        currentAddress: formData.currentAddress,
        permanentAddress: formData.permanentAddress,
      };

      if (selectedFile) updateData.avatar = selectedFile;

      // Get changed fields for logging
      const changedFields = getChangedFields();

      // Update profile (use multipart when avatar file present)
      let res;
      if (selectedFile) {
        res = await userService.updateProfileWithAvatar(updateData);
      } else {
        res = await userService.updateProfile(updateData);
      }

      // Log profile update with changed fields
      if (Object.keys(changedFields).length > 0) {
        try {
          await userService.logProfileUpdate?.(changedFields);
        } catch (logErr) {
          console.warn("Failed to log profile update:", logErr);
        }
      }

      toastSuccess(res?.message || "Hồ sơ đã được cập nhật thành công");

      onSuccess();
    } catch (err) {
      const msg = err.response?.data?.message || "Không thể cập nhật hồ sơ";
      toastError(msg);
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chỉnh sửa hồ sơ"
      description="Cập nhật thông tin cá nhân của bạn"
      size="lg"
    >
      <div className="max-h-[70vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Avatar Section */}
          <div>
            <Label>Ảnh đại diện</Label>
            <div className="mt-2 space-y-4">
              {/* Upload Area */}
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-xl p-8 flex flex-col items-center justify-center hover:border-blue-400 hover:bg-blue-50/50 cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mb-3 group-hover:scale-110 transition-transform shadow-inner">
                  <Upload size={20} />
                </div>
                <p className="text-sm font-semibold text-slate-700">
                  Tải lên ảnh đại diện
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Kéo thả hoặc nhấn để chọn (JPEG, PNG, GIF, WebP - Tối đa 5MB)
                </p>
              </div>

              {/* Current Avatar or Preview */}
              {previewAvatar || formData.avatar ? (
                <div className="space-y-3">
                  <div className="flex items-center gap-4 p-3 bg-white border border-slate-200 rounded-lg hover:shadow-sm transition-shadow">
                    <div className="relative">
                      <img
                        src={
                          previewAvatar || `${API_BASE_URL}/${formData.avatar}`
                        }
                        alt="Avatar hiện tại"
                        width={64}
                        height={64}
                        className="w-16 h-16 rounded-lg object-cover border-2 border-slate-100"
                        unoptimized
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-slate-700">
                        {previewAvatar
                          ? "Ảnh mới được chọn"
                          : "Ảnh đại diện hiện tại"}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">
                        {selectedFile
                          ? `${(selectedFile.size / 1024).toFixed(1)} KB`
                          : "Đã lưu trên hệ thống"}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {profile?.avatar && !selectedFile && (
                        <a
                          href={`${API_BASE_URL}/${profile.avatar}`}
                          target="_blank"
                          rel="noreferrer"
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Xem ảnh"
                        >
                          <Info size={16} />
                        </a>
                      )}
                      <button
                        type="button"
                        onClick={removeAvatar}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="Xóa ảnh"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}

              {errors.avatar && (
                <p className="text-red-500 text-sm flex items-center gap-1">
                  <span className="w-1 h-1 bg-red-500 rounded-full" />
                  {errors.avatar}
                </p>
              )}
            </div>
          </div>

          {/* Read-Only Information */}
          <div className="bg-slate-50 border border-slate-200 rounded-lg p-4">
            <h3 className="text-sm font-semibold text-slate-700 mb-3 flex items-center gap-2">
              <Lock className="w-4 h-4" />
              Thông tin hệ thống
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label className="text-xs font-medium text-slate-600">
                  Tên đăng nhập
                </Label>
                <div className="mt-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700">
                  {profile?.username || "-"}
                </div>
              </div>
              <div>
                <Label className="text-xs font-medium text-slate-600">
                  Vai trò
                </Label>
                <div className="mt-1 px-3 py-2 bg-white border border-slate-200 rounded-md text-sm text-slate-700">
                  {profile?.role || "-"}
                </div>
              </div>
            </div>
          </div>

          {/* Editable Information */}
          <div>
            <Label htmlFor="name">Họ và tên *</Label>
            <Input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleInputChange}
              placeholder="Nhập họ và tên"
              error={errors.name}
              disabled={true}
            />
            {errors.name && (
              <p className="text-red-500 text-sm mt-1">{errors.name}</p>
            )}
          </div>

          <div>
            <Label htmlFor="personalEmail">Email cá nhân</Label>
            <Input
              id="personalEmail"
              name="personalEmail"
              type="email"
              value={formData.personalEmail}
              onChange={handleInputChange}
              placeholder="Nhập email cá nhân"
              error={errors.personalEmail}
              disabled={saving}
            />
            {errors.personalEmail && (
              <p className="text-red-500 text-sm mt-1">
                {errors.personalEmail}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="phone">Số điện thoại</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleInputChange}
              placeholder="Ví dụ: 0912345678"
              error={errors.phone}
              disabled={saving}
            />
            {errors.phone && (
              <p className="text-red-500 text-sm mt-1">{errors.phone}</p>
            )}
          </div>

          <div>
            <Label htmlFor="currentAddress">Địa chỉ hiện tại</Label>
            <Input
              id="currentAddress"
              name="currentAddress"
              type="text"
              value={formData.currentAddress}
              onChange={handleInputChange}
              placeholder="Nhập địa chỉ hiện tại"
              error={errors.currentAddress}
              disabled={saving}
            />
            {errors.currentAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.currentAddress}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="permanentAddress">Địa chỉ thường trú</Label>
            <Input
              id="permanentAddress"
              name="permanentAddress"
              type="text"
              value={formData.permanentAddress}
              onChange={handleInputChange}
              placeholder="Nhập địa chỉ thường trú"
              error={errors.permanentAddress}
              disabled={saving}
            />
            {errors.permanentAddress && (
              <p className="text-red-500 text-sm mt-1">
                {errors.permanentAddress}
              </p>
            )}
          </div>

          {/* Notice Box */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-sm text-blue-900">
              <strong>Lưu ý:</strong> Các thông tin trong phần &quot;Thông tin
              hệ thống&quot; không thể chỉnh sửa từ đây. Vui lòng liên hệ quản
              trị viên để yêu cầu thay đổi.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3 justify-end">
            <Button
              type="button"
              variant="secondary"
              onClick={onClose}
              disabled={saving}
            >
              Hủy
            </Button>
            <Button type="submit" disabled={saving} loading={saving}>
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
