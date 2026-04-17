"use client";

import { useRouter } from "next/navigation";
import { PageTitle } from "@/components/common/PageTitle";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import { Button } from "@/components/common/Button";
import { Camera, Settings, Shield, Activity, ChevronRight, ShieldAlert, Wallet } from "lucide-react";

export default function ConfigurationsPage() {
  const router = useRouter();

  const configurations = [
    {
      id: "face-recognition",
      title: "Nhận Diện Khuôn Mặt",
      description:
        "Cài đặt nhận diện khuôn mặt, chống giả mạo và cấu hình camera",
      icon: Camera,
      color: "indigo",
      href: "/configurations/face-recognition",
    },
    {
      id: "attendance-security",
      title: "Bảo Mật Điểm Danh",
      description:
        "Cài đặt bảo mật IP, vị trí và thiết bị cho hệ thống điểm danh",
      icon: Shield,
      color: "blue",
      href: "/configurations/attendance-security",
      disabled: false,
    },
    {
      id: "system-settings",
      title: "Cấu Hình Chặn Điểm Danh",
      description: "Thiết lập quy tắc tự động khóa theo vi phạm",
      icon: ShieldAlert,
      color: "purple",
      href: "/configurations/attendance-blocking",
      disabled: false,
    },
    {
      id: "payroll-settings",
      title: "Quy Trình Lương",
      description: "Cấu hình người phê duyệt, quy trình tính lương và thông báo",
      icon: Wallet,
      color: "emerald",
      href: "/configurations/payroll",
      disabled: false,
    },
    {
      id: "notification-settings",
      title: "Cài Đặt Thông Báo",
      description: "Quản lý các cảnh báo, email thông báo và cấu hình gửi",
      icon: Activity,
      color: "orange",
      href: "/configurations/notification-settings",
      disabled: true,
    },
  ];

  const colorClasses = {
    indigo: "bg-indigo-50 border-indigo-200 text-indigo-600",
    blue: "bg-blue-50 border-blue-200 text-blue-600",
    purple: "bg-purple-50 border-purple-200 text-purple-600",
    emerald: "bg-emerald-50 border-emerald-200 text-emerald-600",
    orange: "bg-orange-50 border-orange-200 text-orange-600",
  };

  const handleNavigate = (href) => {
    router.push(href);
  };

  return (
    <div className="space-y-6">
      <PageTitle
        icon={Settings}
        title="Quản Lý Cấu Hình"
        description="Cài đặt và quản lý các tham số hệ thống nhân sự"
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {configurations.map((config) => {
          const Icon = config.icon;
          const colorClass = colorClasses[config.color];

          return (
            <Card
              key={config.id}
              className={`transition-all cursor-pointer hover:shadow-lg ${
                config.disabled
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:border-slate-300"
              }`}
              onClick={() => !config.disabled && handleNavigate(config.href)}
            >
              <CardHeader>
                <div className="flex items-start justify-between mb-3">
                  <div className={`p-2 rounded-lg border ${colorClass}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {!config.disabled && (
                    <ChevronRight className="h-5 w-5 text-slate-400 group-hover:text-slate-600" />
                  )}
                  {config.disabled && (
                    <span className="text-xs font-medium text-slate-500 bg-slate-100 px-2 py-1 rounded">
                      Sắp Có
                    </span>
                  )}
                </div>
                <CardTitle className="text-lg">{config.title}</CardTitle>
                <CardDescription className="text-sm">
                  {config.description}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!config.disabled && (
                  <Button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNavigate(config.href);
                    }}
                    className="w-full"
                    size="sm"
                  >
                    Cài Đặt <ChevronRight className="h-4 w-4 ml-2" />
                  </Button>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info Section */}
      <Card className="bg-slate-50 border-slate-200">
        <CardHeader>
          <CardTitle className="text-base">Tìm Hiểu Thêm</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-slate-700">
          <div>
            <p className="font-medium mb-1">📋 Công Dụng Của Cấu Hình:</p>
            <ul className="list-disc list-inside space-y-1 text-xs ml-2">
              <li>
                Nhận Diện Khuôn Mặt: Tối ưu hóa độ chính xác và tốc độ xử lý
              </li>
              <li>
                Bảo Mật Điểm Danh: Bảo vệ hệ thống khỏi truy cập bất hợp pháp
              </li>
              <li>Cài Đặt Hệ Thống: Định nghĩa quy tắc và tham số hoạt động</li>
              <li>
                Cài Đặt Thông Báo: Kiểm soát thông báo và cảnh báo hệ thống
              </li>
            </ul>
          </div>
          <div>
            <p className="font-medium mb-1">⚠️ Lưu Ý Quan Trọng:</p>
            <p className="text-xs ml-2">
              Các thay đổi cấu hình sẽ áp dụng ngay lập tức. Hãy đảm bảo rằng
              bạn hiểu rõ tác động của mỗi thay đổi trước khi lưu.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
