"use client";

import { useState } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/common/Card";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { useToast } from "@/components/common/Toast";
import api from "@/lib/api";
import { validate, required, minLength } from "@/lib/validation";
import { Eye, EyeOff, Lock } from "lucide-react";
import { authService } from "@/services";

export default function SecuritySettingsPage() {
  const { success: toastSuccess, error: toastError } = useToast();

  // Change password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [savingPassword, setSavingPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password criteria
  const criteria = {
    length: newPassword.length >= 8,
    number: /\d/.test(newPassword),
    upper: /[A-Z]/.test(newPassword),
    lower: /[a-z]/.test(newPassword),
    special: /[!@#$%^&*(),.?":{}|<>]/.test(newPassword),
  };

  const strength = Object.values(criteria).filter(Boolean).length; // 0..3

  const confirmError =
    confirmPassword && confirmPassword !== newPassword
      ? "Mật khẩu xác nhận không khớp"
      : null;

  const isFormValid =
    currentPassword && strength === 5 && confirmPassword === newPassword;

  const handleChangePassword = async (e) => {
    e?.preventDefault();

    const validationErrors = validate(
      { currentPassword, newPassword, confirmPassword },
      {
        currentPassword: [required("Mật khẩu hiện tại là bắt buộc")],
        newPassword: [required("Mật khẩu mới là bắt buộc"), minLength(8)],
        confirmPassword: [required("Xác nhận mật khẩu là bắt buộc")],
      },
    );

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    if (newPassword !== confirmPassword) {
      setErrors({ confirmPassword: "Mật khẩu xác nhận không khớp" });
      return;
    }

    setErrors({});
    setSavingPassword(true);

    try {
      const response = await authService.changePassword(
        currentPassword,
        newPassword,
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      toastSuccess(response.message);
    } catch (err) {
      toastError(err.response?.data?.message || "Không thể đổi mật khẩu");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Cài đặt - Bảo mật" />

      <div>
        <h1 className="text-2xl font-bold text-slate-900">Đổi mật khẩu</h1>
        <p className="text-slate-500">
          Sử dụng mật khẩu mạnh và duy nhất để bảo vệ tài khoản của bạn.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6">
        <Card>
          <CardHeader className="flex-row items-center gap-4 bg-indigo-500/10 rounded-t-xl overflow-hidden border-b border-b-slate-200">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-indigo-500/20">
              <Lock className="h-5 w-5 text-indigo-600" />
            </div>

            <div className="flex flex-col justify-center space-y-1">
              <CardTitle className="leading-tight">
                Khuyến nghị bảo mật
              </CardTitle>
              <CardDescription className="leading-snug">
                Vui lòng nhập mật khẩu hiện tại và mật khẩu mới
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="pt-6">
            <form onSubmit={handleChangePassword} className="space-y-8">
              <div className="space-y-8">
                <div>
                  <Label htmlFor="currentPassword">Mật khẩu hiện tại</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      type={showCurrentPassword ? "text" : "password"}
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      error={errors.currentPassword}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowCurrentPassword(!showCurrentPassword)
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                    >
                      {showCurrentPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="newPassword">Mật khẩu mới</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      type={showNewPassword ? "text" : "password"}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      error={errors.newPassword}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                    >
                      {showNewPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>

                  {/* Strength bar */}
                  <div className="mt-3">
                    <div className="flex gap-2">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div
                          key={i}
                          className={`h-2 flex-1 rounded ${
                            strength >= i
                              ? i === 1
                                ? "bg-indigo-500"
                                : i === 2
                                  ? "bg-indigo-500"
                                  : i === 3
                                    ? "bg-indigo-500"
                                    : i === 4
                                      ? "bg-indigo-500"
                                      : "bg-indigo-500"
                              : "bg-slate-100"
                          }`}
                        />
                      ))}
                    </div>
                    <div className="mt-2 text-sm text-slate-500">
                      {strength === 0 && "Độ mạnh của mật khẩu"}
                      {strength === 1 && "Rất yếu"}
                      {strength === 2 && "Yếu"}
                      {strength === 3 && "Trung bình"}
                      {strength === 4 && "Mạnh"}
                      {strength === 5 && "Rất mạnh"}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Xác nhận mật khẩu</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      error={errors.confirmPassword || confirmError}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-3 flex items-center text-slate-500 hover:text-slate-700"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                </div>
                {/* Criteria list */}
                <div className="mt-4 space-y-2 text-sm bg-slate-100 rounded-xl border border-slate-200 p-4">
                  <Label className="uppercase">Tiêu chí mật khẩu</Label>
                  <div
                    className={`${criteria.length ? "text-green-600" : "text-slate-400"} flex items-center gap-2`}
                  >
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        criteria.length ? "bg-green-600" : "bg-slate-300"
                      }`}
                    />
                    Tối thiểu 8 ký tự
                  </div>

                  <div
                    className={`${criteria.number ? "text-green-600" : "text-slate-400"} flex items-center gap-2`}
                  >
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        criteria.number ? "bg-green-600" : "bg-slate-300"
                      }`}
                    />
                    Có ít nhất 1 chữ số
                  </div>

                  <div
                    className={`${criteria.upper ? "text-green-600" : "text-slate-400"} flex items-center gap-2`}
                  >
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        criteria.upper ? "bg-green-600" : "bg-slate-300"
                      }`}
                    />
                    Có ít nhất 1 chữ hoa
                  </div>

                  <div
                    className={`${criteria.lower ? "text-green-600" : "text-slate-400"} flex items-center gap-2`}
                  >
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        criteria.lower ? "bg-green-600" : "bg-slate-300"
                      }`}
                    />
                    Có ít nhất 1 chữ thường
                  </div>

                  <div
                    className={`${criteria.special ? "text-green-600" : "text-slate-400"} flex items-center gap-2`}
                  >
                    <span
                      className={`inline-block h-3 w-3 rounded-full ${
                        criteria.special ? "bg-green-600" : "bg-slate-300"
                      }`}
                    />
                    Có ít nhất 1 ký tự đặc biệt
                  </div>
                </div>

                <div className="flex justify-start">
                  <Button
                    type="submit"
                    loading={savingPassword}
                    disabled={!isFormValid}
                  >
                    Lưu thay đổi
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
