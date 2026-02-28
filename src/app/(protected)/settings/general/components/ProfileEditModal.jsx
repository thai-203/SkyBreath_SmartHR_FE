"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { useToast } from "@/components/common/Toast";
import { userService } from "@/services";
import {
  validate,
  required,
  email as emailValidator,
  phone as phoneValidator,
  minLength,
  maxLength,
  fileSize,
  fileType,
} from "@/lib/validation";
import { Upload, X } from "lucide-react";

// Toggle to true for offline UI testing
const USE_MOCK_DATA = false;

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

  const [formData, setFormData] = useState({
    name: "",
    personalEmail: "",
    phone: "",
    address: "",
    avatar: null,
  });

  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: profile?.fullName || "",
        personalEmail: profile?.personalEmail || "",
        phone: profile?.phoneNumber || "",
        address: profile?.currentAddress || "",
        avatar: null,
      });
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const validationErrors = validate(formData, {
      name: [
        required("Họ và tên là bắt buộc"),
        minLength(2, "Tên phải tối thiểu 2 ký tự"),
        maxLength(100, "Tên không được vượt quá 100 ký tự"),
      ],
      personalEmail: [emailValidator("Email không hợp lệ")],
      phone: [phoneValidator("Số điện thoại không hợp lệ")],
      address: [maxLength(255, "Địa chỉ không được vượt quá 255 ký tự")],
    });

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setSaving(true);
    try {
      const updateData = {
        fullName: formData.name,
        personalEmail: formData.personalEmail,
        phoneNumber: formData.phone,
        currentAddress: formData.address,
      };

      if (selectedFile) updateData.avatar = selectedFile;

      if (USE_MOCK_DATA) {
        await new Promise((r) => setTimeout(r, 700));
        toastSuccess("Hồ sơ đã được cập nhật thành công (Mock Mode)");
      } else {
        // const res = await userService.updateProfileWithAvatar(updateData);
        const res = await userService.updateProfile(updateData);
        toastSuccess(res?.message || "Hồ sơ đã được cập nhật thành công");
      }

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
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <Label>Ảnh đại diện</Label>
          <div className="mt-2">
            {previewAvatar || profile?.avatar ? (
              <div className="relative w-fit">
                <img
                  src={previewAvatar || profile?.avatar}
                  alt="Avatar preview"
                  className="w-24 h-24 rounded-lg object-cover border-2 border-slate-200"
                />
                <button
                  type="button"
                  onClick={removeAvatar}
                  className="absolute top-0 right-0 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                  id="avatar-input"
                />
                <label
                  htmlFor="avatar-input"
                  className="flex items-center justify-center w-full px-4 py-8 border-2 border-dashed border-slate-300 rounded-lg hover:border-slate-400 cursor-pointer transition-colors bg-slate-50 hover:bg-slate-100"
                >
                  <div className="text-center">
                    <Upload className="w-8 h-8 text-slate-400 mx-auto mb-2" />
                    <p className="text-sm text-slate-600">
                      Tải lên ảnh đại diện
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      Hỗ trợ: JPEG, PNG, GIF, WebP (Tối đa 5MB)
                    </p>
                  </div>
                </label>
              </div>
            )}
            {errors.avatar && (
              <p className="text-red-500 text-sm mt-2">{errors.avatar}</p>
            )}
          </div>
        </div>

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
            disabled={saving}
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
            <p className="text-red-500 text-sm mt-1">{errors.personalEmail}</p>
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
          <Label htmlFor="address">Địa chỉ</Label>
          <Input
            id="address"
            name="address"
            type="text"
            value={formData.address}
            onChange={handleInputChange}
            placeholder="Nhập địa chỉ"
            error={errors.address}
            disabled={saving}
          />
          {errors.address && (
            <p className="text-red-500 text-sm mt-1">{errors.address}</p>
          )}
        </div>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <p className="text-sm text-blue-900">
            <strong>Lưu ý:</strong> Các trường như email công ty, tên đăng nhập,
            vai trò không thể chỉnh sửa từ đây. Vui lòng liên hệ quản trị viên
            để yêu cầu thay đổi.
          </p>
        </div>

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
    </Modal>
  );
}
