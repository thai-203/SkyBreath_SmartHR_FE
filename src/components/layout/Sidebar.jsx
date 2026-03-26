"use client";

import { cn } from "@/lib/utils";
import { authService } from "@/services";
import {
  BookOpen,
  Building2,
  Calendar,
  CalendarClock,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Clock,
  DollarSign,
  FileText,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldAlert,
  User,
  UserPlus,
  Users,
  X
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Phòng ban",
    icon: Building2,
    href: "/departments",
    roles: ["ADMIN", "HR", "MANAGER"],
    permission: "DEPT_READ",
    children: [
      { title: "Danh sách", href: "/departments", permission: "DEPT_READ" },
      { title: "Sơ đồ tổ chức", href: "/departments/chart", permission: "DEPT_READ" },
    ],
  },
  {
    title: "Nhân viên",
    icon: Users,
    href: "/employees",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    permission: "EMPLOYEE_READ",
    children: [
      { title: "Danh sách", href: "/employees", roles: ["ADMIN", "HR", "MANAGER"], permission: "EMPLOYEE_READ" }
    ],
  },
  {
    title: "Hợp đồng",
    icon: FileText,
    href: "/contracts",
    roles: ["ADMIN", "HR", "MANAGER"],
    permission: "CONTRACT_READ",
  },
  {
    title: "Bảng chấm công",
    icon: Clock,
    href: "/timesheets",
    roles: ["ADMIN", "HR", "EMPLOYEE"],
    permission: "TIMESHEET_READ",
  },
  {
    title: "Bảng lương",
    icon: DollarSign,
    href: "/payroll",
    roles: ["ADMIN", "HR"],
    permission: "PAYROLL_READ",
    children: [
      { title: "Bảng lương tháng", href: "/payroll", permission: "PAYROLL_READ" },
      { title: "Loại bảng lương", href: "/payroll/types", permission: "PAYROLL_READ" },
    ],
  },
  {
    title: "Ca làm việc",
    icon: CalendarClock,
    href: "/shifts/groups",
    roles: ["ADMIN", "HR", "MANAGER"],
    permission: "SHIFT_READ",
    children: [
      { title: "Nhóm ca", href: "/shifts/groups", permission: "SHIFT_READ" },
      { title: "Ca làm việc", href: "/shifts/working", permission: "SHIFT_READ" },
      { title: "Phân ca", href: "/shifts/assignments", permission: "SHIFT_READ" },
      { title: "Lịch ca", href: "/shifts/schedule", permission: "SHIFT_READ" },
    ],
  },
  {
    title: "Lịch cá nhân",
    icon: Calendar,
    href: "/shifts/personal",
    roles: ["EMPLOYEE", "ADMIN", "HR", "MANAGER"],
  },
  {
    title: "Ngày nghỉ lễ",
    icon: Calendar,
    href: "/holidays",
    roles: ["ADMIN", "HR", "MANAGER"],
    permission: "HOLIDAY_READ",
    children: [
      { title: "Danh sách", href: "/holidays", permission: "HOLIDAY_READ" },
      { title: "Danh mục", href: "/holidays/groups", permission: "HOLIDAY_READ" },
      { title: "Cấu hình", href: "/holidays/configuration", permission: "HOLIDAY_READ" },
    ],
  },
  {
    title: "Việc cần làm",
    icon: ClipboardCheck,
    href: "/onboardings/employee",
    roles: ["EMPLOYEE", "ADMIN", "HR", "MANAGER"],
  },
  {
    title: "Quản lý tiếp nhận nhân sự mới",
    icon: UserPlus,
    href: "/onboardings/plans",
    roles: ["ADMIN", "HR"],
    permission: "ONBOARDING_PLAN_READ",
    children: [
      { title: "Danh sách", href: "/onboardings/plans", permission: "ONBOARDING_PLAN_READ" },
      { title: "Mẫu", href: "/onboardings/template", permission: "ONBOARDING_PLAN_READ" },
    ],
  },
  {
    title: "Quy định",
    icon: BookOpen,
    href: "/regulations",
    roles: ["HR", "ADMIN"],
    children: [
      { title: "Làm thêm giờ", href: "/regulations/overtime" },
      { title: "Hình phạt", href: "/regulations/penalties" },
    ],
  },
  {
    title: "Quy định",
    icon: ScrollText,
    href: "/policy/overtime",
    roles: ["EMPLOYEE"],
    children: [
      { title: "Làm thêm giờ", href: "/policy/overtime" },
      { title: "Hình phạt", href: "/policy/penalties" },
    ],
  },
  {
    title: "Người dùng",
    icon: User,
    href: "/users",
    roles: ["ADMIN"],
    permission: "USER_READ",
    children: [
      { title: "Danh sách", href: "/users", permission: "USER_READ" },
      { title: "Lịch sử hoạt động", href: "/users/audit-log", permission: "USER_READ" },
    ],
  },
  {
    title: "Phân quyền",
    icon: ShieldAlert,
    href: "/roles",
    roles: ["ADMIN"],
    permission: "ROLE_READ",
    children: [
      { title: "Vai trò", href: "/roles", permission: "ROLE_READ" },
      { title: "Quyền hệ thống", href: "/permissions", permission: "ROLE_READ" },
    ],
  },
  {
    title: "Cài đặt",
    icon: Settings,
    href: "/settings",
    roles: ["ADMIN", "HR", "MANAGER", "EMPLOYEE"],
    children: [
      { title: "Hồ sơ", href: "/settings/general" },
      { title: "Mật khẩu", href: "/settings/security" },
    ],
  },
];

function MenuItem({ item, isActive, isOpen, onToggle, onMobileClose }) {
  const hasChildren = item.children && item.children.length > 0;
  const pathname = usePathname();

  const handleClick = () => {
    if (hasChildren) {
      onToggle(); // Gọi hàm toggle từ Sidebar
    } else if (onMobileClose) {
      onMobileClose();
    }
  };

  return (
    <div>
      {hasChildren ? (
        <button
          onClick={handleClick}
          className={cn(
            "flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <span className="flex items-center gap-3">
            <item.icon className="h-5 w-5" />
            {item.title}
          </span>
          {isOpen ? (
            <ChevronDown className="h-4 w-4" />
          ) : (
            <ChevronRight className="h-4 w-4" />
          )}
        </button>
      ) : (
        <Link
          href={item.href}
          onClick={onMobileClose}
          className={cn(
            "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-indigo-500 text-white shadow-lg shadow-indigo-500/20"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900",
          )}
        >
          <item.icon className="h-5 w-5" />
          {item.title}
        </Link>
      )}
      {hasChildren && isOpen && (
        <div className="ml-4 mt-1 space-y-1 border-l-2 border-slate-200 pl-4">
          {item.children
            .filter(child => {
              if (child.permission) return authService.hasPermission(child.permission);
              return !child.roles || authService.hasAnyRole(child.roles);
            })
            .map((child) => (
              <Link
                key={child.href}
                href={child.href}
                onClick={onMobileClose}
                className={cn(
                  "block rounded-lg px-3 py-2 text-sm transition-all duration-200",
                  pathname === child.href
                    ? "bg-slate-100 font-medium text-indigo-500"
                    : "text-slate-500 hover:bg-slate-50 hover:text-slate-900",
                )}
              >
                {child.title}
              </Link>
            ))}
        </div>
      )}
    </div>
  );
}

export function Sidebar({ className, onMobileClose }) {
  const pathname = usePathname();
  const user = authService.getCurrentUser();
  const [openMenuHref, setOpenMenuHref] = useState(null);

  const isMenuActive = (item) => {
    if (item.children && item.children.length) {
      if (pathname === item.href) return true;
      return item.children.some(
        (child) => pathname === child.href || pathname.startsWith(child.href),
      );
    }
    return pathname === item.href || pathname.startsWith(item.href);
  };

  useEffect(() => {
    const activeItem = menuItems.find((item) => isMenuActive(item));
    if (activeItem && activeItem.children) {
      setOpenMenuHref(activeItem.href);
    }
  }, [pathname]);

  const handleToggle = (href) => {
    setOpenMenuHref((prev) => (prev === href ? null : href));
  };

  return (
    <aside
      className={cn(
        "flex h-full w-64 flex-col bg-white border-r border-slate-200 transition-transform duration-300",
        className,
      )}
    >
      <div className="flex h-16 items-center justify-between border-b border-slate-200 px-4">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20">
            S
          </div>
          <span className="text-lg font-bold text-slate-900">SmartHR</span>
        </Link>
        {onMobileClose && (
          <button
            onClick={onMobileClose}
            className="rounded-lg p-2 hover:bg-slate-100 lg:hidden"
          >
            <X className="h-5 w-5" />
          </button>
        )}
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-4">
        {menuItems
          .filter((item) => {
            if (item.permission) return authService.hasPermission(item.permission);
            return !item.roles || authService.hasAnyRole(item.roles);
          })
          .map((item) => (
            <MenuItem
              key={item.href}
              item={item}
              isActive={isMenuActive(item)}
              isOpen={openMenuHref === item.href}
              onToggle={() => handleToggle(item.href)}
              onMobileClose={onMobileClose}
            />
          ))}
      </nav>
    </aside>
  );
}
