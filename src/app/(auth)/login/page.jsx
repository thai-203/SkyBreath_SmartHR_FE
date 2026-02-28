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
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { authService } from "@/services";
import { useToast } from "@/components/common/Toast";
import { validate, required, email, minLength } from "@/lib/validation";

export default function LoginPage() {
  const { error: toastError, success: toastSuccess } = useToast();
  const [loading, setLoading] = useState(false);
  const [emailValue, setEmailValue] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const router = useRouter();

  useEffect(() => {
    if (authService.isAuthenticated()) {
      router.replace("/dashboard");
    }
  }, [router]);

  const validationErrors = validate(
    { email: emailValue, password },
    {
      email: [required("Email là bắt buộc"), email()],
      password: [
        required("Mật khẩu là bắt buộc"),
        minLength(8, "Mật khẩu phải có ít nhất 8 ký tự"),

        (value) =>
          !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*]).{8,}$/.test(value)
            ? "Mật khẩu phải có chữ hoa, chữ thường, số và ký tự đặc biệt"
            : null,
      ],
    },
  );

  const handleLogin = async (e) => {
    e.preventDefault();

    if (validationErrors) {
      setErrors(validationErrors);
      return;
    }

    setErrors({});
    setLoading(true);

    try {
      const response = await authService.login(emailValue, password);
      const { accessToken, user } = response.data;

      localStorage.setItem("token", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      toastSuccess(response.message);
      router.push("/dashboard");
    } catch (err) {
      toastError(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white text-2xl font-bold shadow-lg shadow-[var(--primary)]/20">
            S
          </div>
          <h2 className="mt-6 text-3xl font-bold tracking-tight text-slate-900">
            Chào mừng trở lại
          </h2>
          <p className="mt-2 text-sm text-slate-500">Đăng nhập để tiếp tục</p>
        </div>

        <Card className="border-none shadow-xl shadow-slate-200/50">
          <CardHeader className="space-y-1">
            <CardTitle className="text-xl">Đăng nhập</CardTitle>
            <CardDescription>
              Nhập email và mật khẩu để truy cập hệ thống
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@example.com"
                  value={emailValue}
                  onChange={(e) => setEmailValue(e.target.value)}
                  error={errors.email}
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Mật khẩu</Label>
                  <Link
                    href="/forgot-password"
                    className="text-xs font-medium text-[var(--primary)] hover:underline"
                  >
                    Quên mật khẩu?
                  </Link>
                </div>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                />
              </div>
              <Button type="submit" className="w-full" loading={loading}>
                Đăng nhập
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-sm text-slate-500">
          Chưa có tài khoản?{" "}
          <Link
            href="#"
            className="font-medium text-[var(--primary)] hover:underline"
          >
            Liên hệ HR
          </Link>
        </p>
      </div>
    </div>
  );
}
