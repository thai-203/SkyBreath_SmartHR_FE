"use client";

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
import { useState } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { authService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { validate, required, email, minLength } from "@/lib/validation";

export default function ForgotPasswordPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();

  const token = searchParams.get("token"); // 👈 QUAN TRỌNG

  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [form, setForm] = useState({
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});

  // ======================
  // FORGOT PASSWORD
  // ======================
  const handleForgotPassword = async (e) => {
    e.preventDefault();

    const validationErrors = validate(
      { email: emailValue },
      { email: [required("Email là bắt buộc"), email()] },
    );

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await authService.forgotPassword(emailValue);
      setSubmitted(true);
      toastSuccess(response.message);
    } catch (err) {
      toastError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // ======================
  // RESET PASSWORD
  // ======================
  const handleResetPassword = async (e) => {
    e.preventDefault();

    const validationErrors = validate(form, {
      password: [required("Mật khẩu là bắt buộc"), minLength(6)],
      confirmPassword: [
        required("Xác nhận mật khẩu"),
        (value) =>
          value !== form.password ? "Mật khẩu xác nhận không khớp" : null,
      ],
    });

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      await authService.resetPassword(token, form.password);

      setSubmitted(true);
      toastSuccess("Đặt lại mật khẩu thành công");
    } catch (err) {
      toastError(
        err.response?.data?.message || "Token không hợp lệ hoặc đã hết hạn",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold">
            S
          </div>
          <h2 className="mt-6 text-3xl font-bold text-slate-900">
            {token ? "Đặt lại mật khẩu" : "Quên mật khẩu"}
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            {token
              ? "Nhập mật khẩu mới cho tài khoản của bạn"
              : "Nhập email để nhận link đặt lại mật khẩu"}
          </p>
        </div>

        <Card className="border-none shadow-xl">
          <CardHeader>
            <CardTitle>
              {token ? "Mật khẩu mới" : "Khôi phục mật khẩu"}
            </CardTitle>
            <CardDescription>
              {!submitted
                ? token
                  ? "Mật khẩu phải có ít nhất 6 ký tự"
                  : "Chúng tôi sẽ gửi link đặt lại mật khẩu qua email"
                : token
                  ? "Mật khẩu đã được thay đổi thành công"
                  : "Vui lòng kiểm tra email của bạn"}
            </CardDescription>
          </CardHeader>

          <CardContent>
            {!submitted ? (
              token ? (
                // ===== RESET PASSWORD FORM =====
                <form onSubmit={handleResetPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Mật khẩu mới</Label>
                    <Input
                      type="password"
                      value={form.password}
                      onChange={(e) =>
                        setForm({ ...form, password: e.target.value })
                      }
                      error={errors.password}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>Xác nhận mật khẩu</Label>
                    <Input
                      type="password"
                      value={form.confirmPassword}
                      onChange={(e) =>
                        setForm({
                          ...form,
                          confirmPassword: e.target.value,
                        })
                      }
                      error={errors.confirmPassword}
                    />
                  </div>

                  <Button type="submit" className="w-full" loading={loading}>
                    Đặt lại mật khẩu
                  </Button>
                </form>
              ) : (
                // ===== FORGOT PASSWORD FORM =====
                <form onSubmit={handleForgotPassword} className="space-y-4">
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input
                      type="email"
                      placeholder="admin@example.com"
                      value={emailValue}
                      onChange={(e) => setEmailValue(e.target.value)}
                      error={errors.email}
                    />
                  </div>

                  <Button type="submit" className="w-full" loading={loading}>
                    Gửi link đặt lại mật khẩu
                  </Button>

                  <div className="text-center">
                    <Link
                      href="/login"
                      className="text-sm font-medium text-[var(--primary)] hover:underline"
                    >
                      ← Quay lại đăng nhập
                    </Link>
                  </div>
                </form>
              )
            ) : (
              <Button className="w-full" onClick={() => router.push("/login")}>
                Quay lại đăng nhập
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
