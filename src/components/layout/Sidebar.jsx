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
  FolderGit2,
  LayoutDashboard,
  ScrollText,
  Settings,
  ShieldAlert,
  User,
  UserPlus,
  Users,
  X,
  UserCog,
  CalendarCheck,
  Bell,
  Bot,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { permission } from "node:process";
import { useEffect, useState } from "react";

const menuItems = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Chấm công",
    icon: CalendarCheck,
    href: "/face",
    permissions: [
      "ATTENDANCE_READ_OWN",
      "ATTENDANCE_FACE_DATA_READ_OWN",
      "ATTENDANCE_FACE_DATA_READ",
    ],
    children: [
      {
        title: "Điểm danh (Camera)",
        href: "/face/checkin",
        permissions: ["ATTENDANCE_READ_OWN"],
      },
      {
        title: "Đăng ký khuôn mặt",
        href: "/face/register",
        permissions: ["ATTENDANCE_FACE_DATA_READ_OWN"],
      },
      {
        title: "Quản lý Face Data",
        href: "/face/manage",
        permissions: ["ATTENDANCE_FACE_DATA_READ"],
      },
    ],
  },
  {
    title: "Phòng ban",
    icon: Building2,
    href: "/departments",
    permissions: ["DEPARTMENT_READ"],
    children: [
      {
        title: "Danh sách",
        href: "/departments",
        permissions: ["DEPARTMENT_READ"],
      },
      {
        title: "Sơ đồ tổ chức",
        href: "/departments/chart",
        permissions: ["DEPARTMENT_READ"],
      },
    ],
  },
  {
    title: "Nhân viên",
    icon: Users,
    href: "/employees",
    permissions: ["EMPLOYEE_READ"],
    children: [
      {
        title: "Danh sách",
        href: "/employees",
        permissions: ["EMPLOYEE_READ"],
      },
    ],
  },
  {
    title: "Hợp đồng",
    icon: FileText,
    href: "/contracts",
    permissions: ["CONTRACT_READ"],
  },
  {
    title: "Bảng chấm công",
    icon: Clock,
    href: "/timesheets",
    permissions: ["TIMESHEET_READ_OWN", "TIMESHEET_READ"],

    children: [
      {
        title: "Khởi tạo bảng công",
        href: "/timesheets/generation",
        permissions: ["TIMESHEET_READ"],
      },
      // {
      //   title: "Quản lý dữ liệu",
      //   href: "/timesheets/data",
      //   permissions: ["TIMESHEET_READ", "TIMESHEET_READ_OWN"],
      // },
      { title: "Bảng tăng ca chi tiết", href: "/timesheets/overtime-detail", permissions: ["TIMESHEET_READ", "TIMESHEET_READ_OWN"] },

      // {
      //   title: "Chốt công",
      //   href: "/timesheets/locking",
      //   permissions: ["TIMESHEET_READ"],
      // },
      {
        title: "Đơn giải trình",
        href: "/timesheets/excuses",
        permissions: ["TIMESHEET_READ"],
      },
      {
        title: "Lịch sử thao tác",
        href: "/timesheets/history",
        permissions: ["TIMESHEET_READ"],
      },
    ],
  },
  {
    title: "Bảng lương",
    icon: DollarSign,
    href: "/payroll",
    permissions: ["PAYROLL_READ", "PAYROLL_TYPE_READ"],
    children: [
      {
        title: "Bảng lương tháng",
        href: "/payroll",
        permissions: ["PAYROLL_READ"],
      },
      {
        title: "Loại bảng lương",
        href: "/payroll/types",
        permissions: ["PAYROLL_TYPE_READ"],
      },
    ],
  },
  {
    title: "Ca làm việc",
    icon: CalendarClock,
    href: "/shifts",
    role: ["ADMIN", "HR"],
    permissions: [
      "SHIFT_GROUP_READ",
      "SHIFT_READ",
      "SHIFT_ASSIGN_READ",
      "SHIFT_SCHEDULE_READ",
    ],
    children: [
      {
        title: "Nhóm ca",
        href: "/shifts/groups",
        permissions: ["SHIFT_GROUP_READ"],
      },
      {
        title: "Ca làm việc",
        href: "/shifts/working",
        permissions: ["SHIFT_READ"],
      },
      {
        title: "Phân ca",
        href: "/shifts/assignments",
        permissions: ["SHIFT_ASSIGN_READ"],
      },
      {
        title: "Lịch ca",
        href: "/shifts/schedule",
        permissions: ["SHIFT_SCHEDULE_READ"],
      },
    ],
  },
  {
    title: "Lịch cá nhân",
    icon: Calendar,
    href: "/shifts/personal",
    permissions: ["SHIFT_READ_OWN"],
  },
  {
    title: "Ngày nghỉ lễ",
    icon: Calendar,
    href: "/holidays",
    permissions: ["HOLIDAY_READ_OWN", "HOLIDAY_READ", 'HOLIDAY_GROUP_READ', 'HOLIDAY_CONFIG', 'HOLIDAY_NOTIFICATION_SEND'],
    children: [
      {
        title: "Danh mục ngày lễ",
        href: "/holidays/groups",
        permissions: ["HOLIDAY_GROUP_READ"],
      },
      {
        title: "Danh sách",
        href: "/holidays",
        permissions: ["HOLIDAY_READ", "HOLIDAY_READ_OWN"],
      },
      {
        title: "Gửi nhắc nhở",
        href: "/holidays/notifications",
        permissions: ["HOLIDAY_NOTIFICATION_SEND"],
      },
      {
        title: "Cấu hình",
        href: "/holidays/configuration",
        permissions: ["HOLIDAY_CONFIG"],
      },
    ],
  },
  {
    title: "Việc cần làm",
    icon: ClipboardCheck,
    href: "/onboardings/employee",
    role: ["EMPLOYEE"],
    permissions: ["ONBOARDING_PROGRESS_READ_OWN"],
  },
  {
    title: "Quản lý tiếp nhận nhân sự mới",
    icon: UserPlus,
    role: ["ADMIN", "HR"],
    href: "/onboardings",
    permissions: ["ONBOARDING_PLAN_READ", "ONBOARDING_PROGRESS_READ"],
    children: [
      {
        title: "Danh sách",
        href: "/onboardings/plans",
        permissions: ["ONBOARDING_PROGRESS_READ"],
      },
      {
        title: "Mẫu",
        href: "/onboardings/template",
        permissions: ["ONBOARDING_PLAN_READ"],
      },
    ],
  },
  {
    title: "Quy định",
    icon: BookOpen,
    href: "/regulations",
    permissions: ["OVERTIME_RULE_READ", "PENALTY_READ"],
    children: [
      {
        title: "Làm thêm giờ",
        href: "/regulations/overtime",
        permissions: ["OVERTIME_RULE_READ"],
      },
      {
        title: "Hình phạt",
        href: "/regulations/penalties",
        permissions: ["PENALTY_READ"],
      },
    ],
  },
  {
    title: "Quản lý đơn từ",
    icon: FolderGit2,
    href: "/request",
    permissions: ["REQUEST_GROUP_READ", "REQUEST_TYPE_READ"],
    children: [
      {
        title: "Nhóm đơn",
        href: "/requests/groups",
        permissions: ["REQUEST_GROUP_READ"],
      },
      {
        title: "Loại đơn từ",
        href: "/requests/types",
        permissions: ["REQUEST_TYPE_READ"],
      },
    ],
  },
  {
    title: "Yêu cầu",
    icon: FileText,
    href: "/requests",
    permissions: ["REQUEST_READ_OWN", "REQUEST_READ"],
    children: [
      {
        title: "Đơn từ của tôi",
        href: "/requests/my-requests",
        permissions: ["REQUEST_READ_OWN"],
      },
      {
        title: "Đơn cần phê duyệt",
        href: "/requests/pending-approvals",
        permissions: ["REQUEST_READ"],
      },
    ],
  },
  {
    title: "Chính sách & Quy định",
    icon: ScrollText,
    href: "/policy",
    permissions: ["OVERTIME_RULE_READ_OWN", "PENALTY_READ_OWN"],
    children: [
      {
        title: "Quy định Overtime",
        href: "/policy/overtime",
        permissions: ["OVERTIME_RULE_READ_OWN"],
      },
      {
        title: "Quy định Vi phạm (Penalty)",
        href: "/policy/penalties",
        permissions: ["PENALTY_READ_OWN"],
      },
    ],
  },
  {
    title: "Người dùng",
    icon: User,
    href: "/users",
    permissions: ["USER_READ", "USER_ACTION_LOG_READ"],
    children: [
      { title: "Danh sách", href: "/users", permissions: ["USER_READ"] },
      {
        title: "Lịch sử hoạt động",
        href: "/users/audit-log",
        permissions: ["USER_ACTION_LOG_READ"],
      },
    ],
  },
  {
    title: "Phân quyền",
    icon: ShieldAlert,
    href: "/roles",
    role: ["ADMIN"],
    // permissions: ["ROLE_READ"],
    children: [
      { title: "Vai trò", href: "/roles" },
      {
        title: "Quyền hệ thống",
        href: "/permissions",
      },
    ],
  },
  {
    title: "Thông báo",
    icon: Bell,
    href: "/notifications/manual",
    roles: ["ADMIN", "HR"],
    permissions: ["SEND_MANUAL_NOTIFICATION", "VIEW_NOTIFICATION_HISTORY"],
    children: [
      {
        title: "Gửi thông báo",
        permissions: ["SEND_MANUAL_NOTIFICATION"],
        href: "/notifications/manual"
      },
      { title: "Lịch sử thông báo", permissions: ["VIEW_NOTIFICATION_HISTORY"], href: "/notifications/history" },
    ],
  },
  {
    title: "Cài đặt",
    icon: UserCog,
    href: "/settings",
    children: [
      {
        title: "Hồ sơ",
        href: "/settings/general",
      },
      {
        title: "Mật khẩu",
        href: "/settings/security",
      },
    ],
  },
  {
    title: "Cấu hình hệ thống",
    icon: Settings,
    href: "/configurations",
    roles: ["ADMIN"],
    // permissions: [
    //   "ATTENDANCE_FACE_RECOGNITION_CONFIG_READ",
    //   "ATTENDANCE_SECURITY_CONFIG_READ",
    //   "ATTENDANCE_BLOCKING_CONFIG_READ",
    // ],
    children: [
      { title: "Tổng quan", href: "/configurations" },
      { title: "Quy trình lương", href: "/configurations/payroll" },
    ]
  },
  {
    title: "Cấu hình AI",
    icon: Bot,
    href: "/ai-configurations",
    permissions: ["AI_CONFIGURATION_READ"],
    roles: ["ADMIN"],
  },
  {
    title: "AI Prompts",
    icon: FileText,
    href: "/ai-prompts",
    permissions: ["AI_PROMPT_READ"],
    roles: ["ADMIN"],
  },
];

function MenuItem({ item, isActive, isOpen, onToggle, onMobileClose, user }) {
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
          {item.children.filter(canShowItem).map((child) => {
            const isEmployeeOnly =
              user?.roles?.includes("EMPLOYEE") &&
              !user?.roles?.some((r) => ["ADMIN", "HR"].includes(r));
            const displayTitle =
              child.href === "/timesheets/data" && isEmployeeOnly
                ? "Bảng công cá nhân"
                : child.title;
            return (
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
                {displayTitle}
              </Link>
            );
          })}
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
        {menuItems.filter(canShowItem).map((item) => (
          <MenuItem
            key={item.href}
            item={item}
            isActive={isMenuActive(item)}
            isOpen={openMenuHref === item.href}
            onToggle={() => handleToggle(item.href)}
            onMobileClose={onMobileClose}
            user={user}
          />
        ))}
      </nav>
    </aside>
  );
}

function canShowItem(item) {
  // 1. Check role trước (nếu có)
  const hasRole = !item.role || authService.hasAnyRole(item.role);

  if (!hasRole) return false;

  // 2. Check permission của chính nó
  const hasPermission =
    !item.permissions || authService.hasAnyPermission(item.permissions);

  if (hasPermission) return true;

  // 3. Check children (QUAN TRỌNG)
  if (item.children?.length) {
    return item.children.some((child) =>
      authService.hasAnyPermission(child.permissions || []),
    );
  }

  return false;
}
