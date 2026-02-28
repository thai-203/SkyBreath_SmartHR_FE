"use client";

import { usePathname, useRouter } from "next/navigation";
import Link from "next/link";
import { Menu, Bell, Search, LogOut, User } from "lucide-react";
import { Button } from "../common/Button";
import { useState, useRef, useEffect } from "react";
import { authService } from "@/services";

export function Header({ onMenuClick }) {
  const pathname = usePathname();
  const router = useRouter();
  const [showDropdown, setShowDropdown] = useState(false);
  const dropdownRef = useRef(null);

  // Breadcrumb translations
  const breadcrumbLabels = {
    dashboard: "Trang chủ",
    departments: "Phòng ban",
    employees: "Nhân viên",
    contracts: "Hợp đồng lao động",
    settings: "Cài đặt",
    general: "Hồ sơ",
    chart: "Sơ đồ tổ chức",
    create: "Thêm mới",
    edit: "Chỉnh sửa",
    security: "Bảo mật",
    "audit-log": "Lịch sử hoạt động",
    roles: "Vai trò",
    users: "Người dùng",
    onboardings: "Tiếp nhận nhân sự",
    template: "Mẫu",
    users: "Người dùng",
  };

  const pathParts = pathname.split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => ({
    label:
      breadcrumbLabels[part] || part.charAt(0).toUpperCase() + part.slice(1),
    href: "/" + pathParts.slice(0, index + 1).join("/"),
  }));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    authService.logout();
    router.push("/login");
  };

  const user = authService.getCurrentUser() || {};

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-slate-200 bg-white/80 backdrop-blur-md px-4 sm:px-6">
      <div className="flex items-center gap-4">
        <button
          onClick={onMenuClick}
          className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
        >
          <Menu className="h-5 w-5" />
        </button>
        <nav className="hidden sm:flex items-center gap-2 text-sm">
          {breadcrumbs.map((crumb, index) => (
            <span key={crumb.href} className="flex items-center gap-2">
              {index > 0 && <span className="text-slate-300">/</span>}
              <span
                className={
                  index === breadcrumbs.length - 1
                    ? "font-medium text-slate-900"
                    : "text-slate-500"
                }
              >
                {crumb.label}
              </span>
            </span>
          ))}
        </nav>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="hidden sm:flex">
          <Search className="h-5 w-5 text-slate-500" />
        </Button>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5 text-slate-500" />
          <span className="absolute right-1 top-1 h-2 w-2 rounded-full bg-red-500" />
        </Button>
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setShowDropdown(!showDropdown)}
            className="flex items-center gap-2 rounded-lg p-2 hover:bg-slate-100"
          >
            <div className="h-8 w-8 rounded-full bg-indigo-500 flex items-center justify-center text-white font-medium text-sm">
              {user.username?.charAt(0)?.toUpperCase() || "A"}
            </div>
            <span className="hidden sm:block text-sm font-medium text-slate-700">
              {user.username || "Admin"}
            </span>
          </button>
          {showDropdown && (
            <div className="absolute right-0 top-full mt-2 w-48 rounded-lg bg-white border border-slate-200 shadow-lg py-1 z-50">
              <Link
                href="/settings/general"
                onClick={() => setShowDropdown(false)}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <User className="h-4 w-4" />
                Hồ sơ của tôi
              </Link>
              <button
                onClick={handleLogout}
                className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <LogOut className="h-4 w-4" />
                Đăng xuất
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
