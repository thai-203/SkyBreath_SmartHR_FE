"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  ArrowUpRight,
  Building2,
  CalendarCheck2,
  Clock3,
  ClipboardList,
  LogIn,
  LogOut,
  MapPin,
  ScanFace,
  TrendingUp,
  Users,
} from "lucide-react";

import { Badge } from "@/components/common/Badge";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/common/Card";
import { Skeleton } from "@/components/common/Skeleton";
import { PageTitle } from "@/components/common/PageTitle";
import { PermissionGate, canAccess } from "@/components/common/AuthGuard";
import {
  authService,
  attendanceService,
  departmentsService,
  employeesService,
  onboardingsService,
  requestsService,
} from "@/services";

const DEFAULT_OVERVIEW_ROLES = ["ADMIN", "HR", "MANAGER", "DIRECTOR"];
const DEFAULT_FACE_CHECKIN_ROLES = ["ADMIN", "HR", "MANAGER", "DIRECTOR"];
const DEFAULT_PENDING_APPROVAL_ROLES = ["ADMIN", "HR", "MANAGER", "DIRECTOR"];

function buildRoleSet(rawValue, fallbackRoles) {
  const source = rawValue || fallbackRoles.join(",");
  return new Set(
    source
      .split(",")
      .map((role) => role.trim().toUpperCase())
      .filter(Boolean),
  );
}

const overviewRoleSet = buildRoleSet(
  process.env.NEXT_PUBLIC_DASHBOARD_OVERVIEW_ROLES,
  DEFAULT_OVERVIEW_ROLES,
);
const faceCheckinRoleSet = buildRoleSet(
  process.env.NEXT_PUBLIC_DASHBOARD_FACE_CHECKIN_ROLES,
  DEFAULT_FACE_CHECKIN_ROLES,
);
const pendingApprovalRoleSet = buildRoleSet(
  process.env.NEXT_PUBLIC_DASHBOARD_APPROVAL_ROLES,
  DEFAULT_PENDING_APPROVAL_ROLES,
);

function unwrapResponse(response) {
  return response?.data?.data ?? response?.data ?? response ?? null;
}

function extractItems(payload) {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.items)) return payload.items;
  if (Array.isArray(payload?.data)) return payload.data;
  return [];
}

function extractTotal(payload, fallback = 0) {
  if (typeof payload?.total === "number") return payload.total;
  if (typeof payload?.totalItems === "number") return payload.totalItems;
  if (typeof payload?.meta?.total === "number") return payload.meta.total;
  if (typeof payload?.meta?.totalItems === "number")
    return payload.meta.totalItems;
  if (typeof payload?.count === "number") return payload.count;
  if (Array.isArray(payload)) return payload.length;
  if (Array.isArray(payload?.items)) return payload.items.length;
  return fallback;
}

function flattenDepartments(nodes = []) {
  return nodes.flatMap((node) => [
    node,
    ...flattenDepartments(node.children || []),
  ]);
}

function normalizeId(value) {
  if (value === null || value === undefined || value === "") return null;
  return String(value);
}

function buildCurrentUserIdSet(user) {
  return new Set(
    [user?.employeeId, user?.id, user?.userId, user?.employee?.id]
      .map(normalizeId)
      .filter(Boolean),
  );
}

function isDepartmentManagedByUser(department, userIdSet) {
  if (!department || userIdSet.size === 0) return false;

  const manager = department.manager || {};
  const managerIds = [
    department.managerEmployeeId,
    manager.id,
    manager.employeeId,
    manager.userId,
    manager.user?.id,
  ]
    .map(normalizeId)
    .filter(Boolean);

  return managerIds.some((managerId) => userIdSet.has(managerId));
}

function getManagedDepartmentIds(departments, user) {
  const userIdSet = buildCurrentUserIdSet(user);
  const ids = departments
    .filter((department) => isDepartmentManagedByUser(department, userIdSet))
    .map((department) => normalizeId(department?.id))
    .filter(Boolean);

  return Array.from(new Set(ids));
}

function buildOnboardingStatsFromProgress(progressItems, managedDepartmentIds) {
  const managedDepartmentIdSet = new Set(managedDepartmentIds);
  const now = Date.now();
  const dayMs = 24 * 60 * 60 * 1000;
  const currentWindowMs = 30 * dayMs;
  const previousWindowMs = 60 * dayMs;

  const scopedItems = progressItems.filter((item) => {
    const departmentId = normalizeId(
      item?.employee?.departmentId || item?.employee?.department?.id,
    );
    return departmentId && managedDepartmentIdSet.has(departmentId);
  });

  const inProgress = scopedItems.filter(
    (item) => item?.overallStatus === "IN_PROGRESS",
  ).length;
  const completed = scopedItems.filter(
    (item) => item?.overallStatus === "COMPLETED",
  ).length;

  const employeeCreatedAtByEmployeeId = new Map();
  scopedItems.forEach((item) => {
    const employeeId = normalizeId(item?.employee?.id || item?.employeeId);
    const createdAt = item?.employee?.createdAt;

    if (!employeeId || !createdAt) return;
    if (!employeeCreatedAtByEmployeeId.has(employeeId)) {
      employeeCreatedAtByEmployeeId.set(employeeId, createdAt);
    }
  });

  let currentNewEmployees = 0;
  let previousNewEmployees = 0;

  employeeCreatedAtByEmployeeId.forEach((createdAt) => {
    const createdTime = new Date(createdAt).getTime();
    if (Number.isNaN(createdTime)) return;

    const ageMs = now - createdTime;
    if (ageMs >= 0 && ageMs <= currentWindowMs) {
      currentNewEmployees += 1;
      return;
    }

    if (ageMs > currentWindowMs && ageMs <= previousWindowMs) {
      previousNewEmployees += 1;
    }
  });

  let growthRate = 0;
  if (previousNewEmployees > 0) {
    growthRate = Math.round(
      ((currentNewEmployees - previousNewEmployees) / previousNewEmployees) *
        100,
    );
  } else if (currentNewEmployees > 0) {
    growthRate = 100;
  }

  return {
    newEmployeesLast30Days: currentNewEmployees,
    inProgress,
    completed,
    growthRate,
  };
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Chào buổi sáng";
  if (hour < 18) return "Chào buổi chiều";
  return "Chào buổi tối";
}

function getRoleFlags(user) {
  const normalizedRoles = (user?.roles || []).map((role) =>
    String(role || "").toUpperCase(),
  );

  const isEmployee = normalizedRoles.includes("EMPLOYEE");
  const hasAnyRole = (roleSet) =>
    normalizedRoles.some((role) => roleSet.has(role));
  const canViewOrgOverview = hasAnyRole(overviewRoleSet);
  const canUseFaceCheckin = hasAnyRole(faceCheckinRoleSet);
  const canViewPendingApprovals = hasAnyRole(pendingApprovalRoleSet);

  return {
    isEmployee,
    isEmployeeOnly:
      isEmployee &&
      normalizedRoles.length === 1 &&
      !canViewOrgOverview &&
      !canViewPendingApprovals,
    canViewOrgOverview,
    canUseFaceCheckin,
    canViewPendingApprovals,
  };
}

function formatDate(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";
  return new Intl.DateTimeFormat("vi-VN", {
    weekday: "long",
    day: "2-digit",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatTime(value) {
  if (!value) return "--:--";
  if (typeof value === "string" && /^\d{2}:\d{2}/.test(value)) {
    return value.slice(0, 5);
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--:--";
  return new Intl.DateTimeFormat("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

function formatMinutes(value) {
  const minutes = Number(value) || 0;
  const hours = Math.floor(minutes / 60);
  const remaining = minutes % 60;
  return `${hours}h ${remaining}m`;
}

function formatRelativeTime(value) {
  if (!value) return "--";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "--";

  const diffMinutes = Math.round((Date.now() - date.getTime()) / 60000);
  if (diffMinutes < 1) return "Vừa xong";
  if (diffMinutes < 60) return `${diffMinutes} phút trước`;

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours} giờ trước`;

  return formatDate(value);
}

function StatCard({ stat, loading }) {
  if (loading) {
    return (
      <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-sm">
        <CardContent className="p-6">
          <div className="space-y-3">
            <Skeleton className="h-4 w-28" />
            <div className="flex items-end justify-between gap-4">
              <div className="space-y-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-4 w-24" />
              </div>
              <Skeleton className="h-12 w-12 rounded-2xl" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="group relative overflow-hidden border-slate-200/70 bg-white/90 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
      <div
        className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.gradient}`}
      />
      <CardContent className="p-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-slate-500">{stat.title}</p>
            <p className="text-3xl font-semibold tracking-tight text-slate-900">
              {stat.value}
            </p>
            <p className={`text-sm font-medium ${stat.deltaClass}`}>
              {stat.delta}
            </p>
          </div>
          <div
            className={`flex h-12 w-12 items-center justify-center rounded-2xl ${stat.iconBg} text-white shadow-lg shadow-slate-900/10`}
          >
            <stat.icon className="h-6 w-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingCard({ rows = 3 }) {
  return (
    <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-4">
          <Skeleton className="h-5 w-40" />
          {Array.from({ length: rows }).map((_, index) => (
            <div
              key={index}
              className="space-y-2 rounded-2xl border border-slate-100 p-4"
            >
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-3 w-1/2" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const [loading, setLoading] = useState(true);
  const [currentUser] = useState(() => authService.getCurrentUser());
  const [attendanceContext, setAttendanceContext] = useState(null);
  const [employeesTotal, setEmployeesTotal] = useState(0);
  const [departmentTree, setDepartmentTree] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingApprovalsTotal, setPendingApprovalsTotal] = useState(0);
  const [approvalsAvailable, setApprovalsAvailable] = useState(true);
  const [onboardingStats, setOnboardingStats] = useState({
    newEmployeesLast30Days: 0,
    inProgress: 0,
    completed: 0,
    growthRate: 0,
  });

  const permissions = useMemo(
    () => ({
      canReadEmployees: canAccess({ permissions: ["EMPLOYEE_READ"] }),
      canReadAttendanceOwn: canAccess({ permissions: ["ATTENDANCE_READ_OWN"] }),
      canReadOnboardingProgress: canAccess({
        permissions: ["ONBOARDING_PROGRESS_READ"],
      }),
      canReadRequests: canAccess({ permissions: ["REQUEST_READ"] }),
      canReadDepartments: canAccess({ permissions: ["DEPARTMENT_READ"] }),
    }),
    [],
  );

  useEffect(() => {
    setCurrentUser(authService.getCurrentUser());
  }, []);

  useEffect(() => {
    let active = true;

    const loadDashboard = async () => {
      setLoading(true);

      try {
        const [
          employeesRes,
          departmentsRes,
          requestsRes,
          onboardingRes,
          attendanceRes,
        ] = await Promise.allSettled([
          permissions.canReadEmployees
            ? employeesService.getAll({ page: 1, limit: 1 })
            : Promise.resolve(null),
          permissions.canReadDepartments
            ? departmentsService.getChart()
            : Promise.resolve(null),
          permissions.canReadRequests
            ? requestsService.getPendingApprovals({ page: 1, limit: 5 })
            : Promise.resolve(null),
          permissions.canReadOnboardingProgress
            ? onboardingsService.getProgressStats()
            : Promise.resolve(null),
          permissions.canReadAttendanceOwn
            ? attendanceService.getTodayContext()
            : Promise.resolve(null),
        ]);
        console.log("Dashboard data loaded:", attendanceRes);

        if (!active) return;

        if (
          permissions.canReadEmployees &&
          employeesRes.status === "fulfilled" &&
          employeesRes.value
        ) {
          const employeesPayload = unwrapResponse(employeesRes.value);
          setEmployeesTotal(extractTotal(employeesPayload));
        } else {
          setEmployeesTotal(0);
        }

        if (
          permissions.canReadDepartments &&
          departmentsRes.status === "fulfilled" &&
          departmentsRes.value
        ) {
          const departmentsPayload = unwrapResponse(departmentsRes.value);
          setDepartmentTree(extractItems(departmentsPayload));
        } else {
          setDepartmentTree([]);
        }

        if (
          permissions.canReadRequests &&
          requestsRes.status === "fulfilled" &&
          requestsRes.value
        ) {
          const requestsPayload = unwrapResponse(requestsRes.value);
          setPendingRequests(extractItems(requestsPayload).slice(0, 5));
          setPendingApprovalsTotal(extractTotal(requestsPayload));
          setApprovalsAvailable(true);
        } else if (!roleFlags.canViewPendingApprovals) {
          setPendingRequests([]);
          setPendingApprovalsTotal(0);
          setApprovalsAvailable(true);
        } else {
          setPendingRequests([]);
          setPendingApprovalsTotal(0);
          setApprovalsAvailable(false);
        }

        if (
          permissions.canReadOnboardingProgress &&
          onboardingRes.status === "fulfilled" &&
          onboardingRes.value
        ) {
          const onboardingPayload = unwrapResponse(onboardingRes.value) || {};
          setOnboardingStats({
            newEmployeesLast30Days:
              onboardingPayload.newEmployeesLast30Days ?? 0,
            inProgress: onboardingPayload.inProgress ?? 0,
            completed: onboardingPayload.completed ?? 0,
            growthRate: onboardingPayload.growthRate ?? 0,
          });
        } else {
          setOnboardingStats({
            newEmployeesLast30Days: 0,
            inProgress: 0,
            completed: 0,
            growthRate: 0,
          });
        }

        if (
          permissions.canReadAttendanceOwn &&
          attendanceRes.status === "fulfilled" &&
          attendanceRes.value
        ) {
          setAttendanceContext(unwrapResponse(attendanceRes.value));
        } else {
          setAttendanceContext(null);
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    loadDashboard();

    return () => {
      active = false;
    };
  }, [
    currentUser,
    isManagerScoped,
    roleFlags.canViewOrgOverview,
    roleFlags.canViewPendingApprovals,
  ]);

  const departmentsFlat = useMemo(
    () => flattenDepartments(departmentTree),
    [departmentTree],
  );

  const visibleDepartments = useMemo(() => {
    if (!isManagerScoped) return departmentsFlat;

    const userIdSet = buildCurrentUserIdSet(currentUser);
    return departmentsFlat.filter((department) =>
      isDepartmentManagedByUser(department, userIdSet),
    );
  }, [currentUser, departmentsFlat, isManagerScoped]);

  const topDepartments = useMemo(() => {
    return visibleDepartments
      .filter((department) => department?.departmentName)
      .sort((a, b) => (b.totalEmployeeCount || 0) - (a.totalEmployeeCount || 0))
      .slice(0, 4);
  }, [visibleDepartments]);

  const attendanceStatus = useMemo(() => {
    if (!attendanceContext) {
      return {
        label: "Đang tải",
        variant: "secondary",
        description: "Hệ thống đang lấy trạng thái chấm công hôm nay.",
      };
    }

    if (attendanceContext.isBlocked) {
      return {
        label: "Bị tạm khóa",
        variant: "danger",
        description:
          "Tài khoản đang bị chặn chấm công do vượt ngưỡng thất bại.",
      };
    }

    if (!attendanceContext.hasShift) {
      return {
        label: "Chưa có ca",
        variant: "secondary",
        description: "Nhân sự chưa được gán ca làm việc cho hôm nay.",
      };
    }

    const checkedIn = Boolean(attendanceContext.attendance?.checkInTime);
    const checkedOut = Boolean(attendanceContext.attendance?.checkOutTime);

    if (checkedIn && checkedOut) {
      return {
        label: "Đã hoàn thành",
        variant: "success",
        description: "Đã check-in và check-out đầy đủ trong ngày.",
      };
    }

    if (checkedIn) {
      return {
        label: "Đã check-in",
        variant: "warning",
        description: "Đã ghi nhận check-in, chờ check-out cuối ngày.",
      };
    }

    return {
      label: "Sẵn sàng check-in",
      variant: "info",
      description: "Có thể thực hiện chấm công khi đến khung giờ làm việc.",
    };
  }, [attendanceContext]);

  const heroName =
    attendanceContext?.userName ||
    currentUser?.fullName ||
    currentUser?.name ||
    "bạn";
  const heroDate = formatDate(new Date());

  const heroActions = useMemo(() => {
    if (roleFlags.isEmployeeOnly) {
      return [
        {
          href: "/requests/my-requests",
          label: "Đơn của tôi",
          variant: "primary",
        },
        {
          href: "/timesheets/data",
          label: "Bảng công cá nhân",
          variant: "secondary",
        },
        {
          href: "/settings/general",
          label: "Cập nhật hồ sơ",
          variant: "secondary",
        },
      ];
    }

    return [
      {
        href: roleFlags.canUseFaceCheckin
          ? "/face/checkin"
          : "/timesheets/data",
        label: roleFlags.canUseFaceCheckin
          ? "Chấm công ngay"
          : "Bảng công cá nhân",
        variant: "primary",
      },
      ...(roleFlags.canViewPendingApprovals
        ? [
            {
              href: "/requests/pending-approvals",
              label: "Xem đơn chờ duyệt",
              variant: "secondary",
            },
          ]
        : [
            {
              href: "/requests/my-requests",
              label: "Đơn của tôi",
              variant: "secondary",
            },
          ]),
      ...(roleFlags.canViewOrgOverview
        ? [
            {
              href: "/departments/chart",
              label: "Cơ cấu phòng ban",
              variant: "secondary",
            },
          ]
        : [
            {
              href: "/shifts/personal",
              label: "Lịch cá nhân",
              variant: "secondary",
            },
          ]),
    ];
  }, [
    roleFlags.canUseFaceCheckin,
    roleFlags.canViewOrgOverview,
    roleFlags.canViewPendingApprovals,
    roleFlags.isEmployeeOnly,
  ]);

  const kpis = useMemo(
    () =>
      [
        permissions.canReadEmployees
          ? {
              title: "Tổng nhân sự",
              value: employeesTotal.toLocaleString("vi-VN"),
              delta: "Dữ liệu tổng hợp từ danh sách nhân viên",
              deltaClass: "text-slate-500",
              icon: Users,
              iconBg: "bg-gradient-to-br from-sky-500 to-blue-600",
              gradient: "from-sky-500 to-blue-500",
            }
          : null,
        permissions.canReadDepartments
          ? {
              title: "Phòng ban",
              value: departmentsFlat.length.toLocaleString("vi-VN"),
              delta: topDepartments[0]?.departmentName || "Cơ cấu tổ chức",
              deltaClass: "text-slate-500",
              icon: Building2,
              iconBg: "bg-gradient-to-br from-emerald-500 to-teal-600",
              gradient: "from-emerald-500 to-teal-500",
            }
          : null,
        permissions.canReadRequests
          ? {
              title: "Đơn chờ duyệt",
              value: pendingApprovalsTotal.toLocaleString("vi-VN"),
              delta: approvalsAvailable
                ? "Từ danh sách phê duyệt hiện tại"
                : "Không có quyền xem danh sách này",
              deltaClass: approvalsAvailable
                ? "text-slate-500"
                : "text-amber-600",
              icon: ClipboardList,
              iconBg: "bg-gradient-to-br from-amber-500 to-orange-600",
              gradient: "from-amber-500 to-orange-500",
            }
          : null,
        permissions.canReadOnboardingProgress
          ? {
              title: "Onboarding đang chạy",
              value: onboardingStats.inProgress.toLocaleString("vi-VN"),
              delta: `${onboardingStats.growthRate >= 0 ? "+" : ""}${onboardingStats.growthRate}% trong 30 ngày`,
              deltaClass:
                onboardingStats.growthRate >= 0
                  ? "text-emerald-600"
                  : "text-rose-600",
              icon: TrendingUp,
              iconBg: "bg-gradient-to-br from-violet-500 to-fuchsia-600",
              gradient: "from-violet-500 to-fuchsia-500",
            }
          : null,
      ].filter(Boolean),
    [
      approvalsAvailable,
      visibleDepartments.length,
      employeesTotal,
      onboardingStats.growthRate,
      onboardingStats.inProgress,
      pendingApprovalsTotal,
      permissions.canReadDepartments,
      permissions.canReadEmployees,
      permissions.canReadOnboardingProgress,
      permissions.canReadRequests,
      topDepartments,
    ],
  );

  const recentActivities = attendanceContext?.recentRecords || [];
  const checkInTime = attendanceContext?.attendance?.checkInTime;
  const checkOutTime = attendanceContext?.attendance?.checkOutTime;
  const shiftStart = attendanceContext?.currentShift?.startTime;
  const shiftEnd = attendanceContext?.currentShift?.endTime;

  return (
    <div className="relative space-y-8 overflow-hidden">
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top_left,_rgba(14,165,233,0.18),_transparent_32%),radial-gradient(circle_at_top_right,_rgba(99,102,241,0.16),_transparent_26%),linear-gradient(180deg,_rgba(248,250,252,1),_rgba(255,255,255,1))]" />
      <div className="pointer-events-none absolute left-1/2 top-24 -z-10 h-72 w-72 -translate-x-1/2 rounded-full bg-cyan-200/30 blur-3xl" />

      <PageTitle title="Trang chủ" />

      <section className="relative overflow-hidden rounded-3xl border border-slate-200/70 bg-slate-950 px-6 py-8 text-white shadow-2xl shadow-slate-200/60 sm:px-8 lg:px-10">
        <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(15,23,42,0.96),rgba(30,41,59,0.92),rgba(15,118,110,0.84))]" />
        <div className="absolute inset-0 opacity-60 [background-image:radial-gradient(rgba(255,255,255,0.12)_1px,transparent_1px)] [background-size:18px_18px]" />

        <div className="relative grid gap-8 xl:grid-cols-[1.35fr_0.65fr] xl:items-end">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center gap-3 text-xs font-medium text-cyan-100/90">
              <Badge
                variant="info"
                className="border-0 bg-white/10 text-cyan-50 backdrop-blur"
              >
                Dashboard vận hành
              </Badge>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                <Clock3 className="h-3.5 w-3.5" />
                {heroDate}
              </span>
              {attendanceContext?.hasShift && (
                <span className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-3 py-1">
                  <CalendarCheck2 className="h-3.5 w-3.5" />
                  Ca làm {formatTime(shiftStart)} - {formatTime(shiftEnd)}
                </span>
              )}
            </div>

            <div className="space-y-3">
              <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
                {getGreeting()}, {heroName}
              </h1>
              <p className="max-w-2xl text-sm leading-6 text-slate-200/85 sm:text-base">
                {isManagerScoped
                  ? "Bảng điều khiển này tổng hợp tình trạng chấm công hôm nay, nhân sự thuộc phòng ban bạn quản lý, đơn đang chờ duyệt và tiến độ onboarding để bạn nắm nhanh tình hình vận hành."
                  : "Bảng điều khiển này tổng hợp tình trạng chấm công hôm nay, nhân sự toàn hệ thống, đơn đang chờ duyệt và tiến độ onboarding để bạn nắm nhanh tình hình vận hành."}
              </p>
            </div>

            <div className="flex flex-wrap gap-3">
              <PermissionGate permission="ATTENDANCE_READ_OWN">
                <Link
                  href="/face/checkin"
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-slate-900 shadow-lg shadow-black/10 transition-transform hover:-translate-y-0.5"
                >
                  Chấm công ngay
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </PermissionGate>
              <PermissionGate permission="REQUEST_READ">
                <Link
                  href="/requests/pending-approvals"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  Xem đơn chờ duyệt
                </Link>
              </PermissionGate>
              <PermissionGate permission="DEPARTMENT_READ">
                <Link
                  href="/departments/chart"
                  className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-semibold text-white backdrop-blur transition-colors hover:bg-white/10"
                >
                  Cơ cấu phòng ban
                </Link>
              </PermissionGate>
            </div>
          </div>

          <PermissionGate permission="ATTENDANCE_READ_OWN">
            <Card className="border-0 bg-white/10 text-white shadow-none backdrop-blur-xl">
              <CardContent className="space-y-4 p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-[0.2em] text-cyan-100/70">
                      Trạng thái hôm nay
                    </p>
                    <p className="mt-1 text-lg font-semibold">
                      {attendanceStatus.label}
                    </p>
                  </div>
                  <Badge
                    variant={attendanceStatus.variant}
                    className="border-0 bg-white/15 text-white"
                  >
                    {attendanceStatus.label}
                  </Badge>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-cyan-100/70">Check-in</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatTime(checkInTime)}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-xs text-cyan-100/70">Check-out</p>
                    <p className="mt-1 text-2xl font-semibold">
                      {formatTime(checkOutTime)}
                    </p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs text-cyan-100/70">Tổng giờ công</p>
                      <p className="mt-1 text-xl font-semibold">
                        {formatMinutes(
                          attendanceContext?.attendance?.totalWorkMinutes || 0,
                        )}
                      </p>
                    </div>
                    <Badge
                      variant={
                        attendanceContext?.hasBiometric ? "success" : "warning"
                      }
                      className="border-0 bg-white/15 text-white"
                    >
                      {attendanceContext?.hasBiometric
                        ? "Đã đăng ký khuôn mặt"
                        : "Chưa có dữ liệu khuôn mặt"}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2 text-xs text-cyan-50/90">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                    <MapPin className="h-3.5 w-3.5" />
                    {attendanceContext?.security?.requireLocationCheck
                      ? "Yêu cầu vị trí"
                      : "Không yêu cầu vị trí"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                    <ScanFace className="h-3.5 w-3.5" />
                    {attendanceContext?.security?.requiredFrames
                      ? `${attendanceContext.security.requiredFrames} khung hình`
                      : "Liveness theo cấu hình"}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1">
                    <Activity className="h-3.5 w-3.5" />
                    {attendanceStatus.description}
                  </span>
                </div>
              </CardContent>
            </Card>
          </PermissionGate>
        </div>
      </section>

      {roleFlags.canViewOrgOverview && (
        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {kpis.map((stat) => (
            <StatCard key={stat.title} stat={stat} loading={loading} />
          ))}
        </section>
      )}

      <section className="grid gap-6 xl:grid-cols-[1.25fr_0.75fr]">
        <PermissionGate permission="ATTENDANCE_READ_OWN">
          {loading ? (
            <LoadingCard rows={4} />
          ) : (
            <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-sm">
              <CardHeader className="border-b border-slate-100 bg-slate-50/60">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <CardTitle>Chấm công hôm nay</CardTitle>
                    <CardDescription>
                      Trạng thái sinh trắc học, lịch làm việc và các lần ghi
                      nhận gần nhất.
                    </CardDescription>
                  </div>
                  <Badge variant={attendanceStatus.variant}>
                    {attendanceStatus.label}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-6 pt-6">
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Ngày làm việc
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {formatDate(attendanceContext?.workDate || new Date())}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {attendanceContext?.hasShift
                        ? "Đã có ca làm được gán"
                        : "Chưa có ca làm hôm nay"}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      Ca làm
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {attendanceContext?.hasShift
                        ? `${formatTime(shiftStart)} - ${formatTime(shiftEnd)}`
                        : "Chưa gán"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      Tổng thời lượng:{" "}
                      {formatMinutes(attendanceContext?.totalWorkMinutes || 0)}
                    </p>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4">
                    <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">
                      An toàn chấm công
                    </p>
                    <p className="mt-2 text-lg font-semibold text-slate-900">
                      {attendanceContext?.isBlocked ? "Tạm khóa" : "Bình thường"}
                    </p>
                    <p className="mt-1 text-sm text-slate-500">
                      {attendanceContext?.security?.requireLocationCheck
                        ? "Kiểm tra vị trí được bật"
                        : "Kiểm tra vị trí chưa bật"}
                    </p>
                  </div>
                </div>

                <div>
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-sm font-semibold uppercase tracking-[0.16em] text-slate-500">
                      Lịch sử gần nhất
                    </h3>
                    <span className="text-xs text-slate-400">
                      {recentActivities.length} bản ghi
                    </span>
                  </div>

                  {recentActivities.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center text-sm text-slate-500">
                      Chưa có hoạt động nào trong ngày hôm nay.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {recentActivities.map((record) => {
                        const isCheckIn = record.actionType === "check_in";

                        return (
                          <div
                            key={record.actionId}
                            className="flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm"
                          >
                            <div className="flex items-center gap-3">
                              <div
                                className={`flex h-11 w-11 items-center justify-center rounded-2xl ${isCheckIn ? "bg-sky-50 text-sky-600" : "bg-amber-50 text-amber-600"}`}
                              >
                                {isCheckIn ? (
                                  <LogIn className="h-5 w-5" />
                                ) : (
                                  <LogOut className="h-5 w-5" />
                                )}
                              </div>
                              <div>
                                <p className="font-medium text-slate-900">
                                  {isCheckIn ? "Check-in" : "Check-out"}
                                </p>
                                <p className="text-sm text-slate-500">
                                  {formatRelativeTime(record.createdAt)}
                                </p>
                              </div>
                            </div>

                            <div className="text-right text-xs text-slate-500">
                              <p>
                                {record.deviceInfo?.device ||
                                  "Thiết bị không xác định"}
                              </p>
                              <Badge
                                variant={
                                  record.status === "SUCCESS"
                                    ? "success"
                                    : "danger"
                                }
                              >
                                {record.status === "SUCCESS"
                                  ? "Thành công"
                                  : "Thất bại"}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </PermissionGate>

        <div className="space-y-6">
          <PermissionGate permission="REQUEST_READ">
            {loading ? (
              <LoadingCard rows={3} />
            ) : (
              <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Đơn chờ xử lý</CardTitle>
                      <CardDescription>
                        Danh sách ngắn các đơn đang chờ cấp duyệt hiện tại.
                      </CardDescription>
                    </div>
                    <Badge variant="warning">{pendingApprovalsTotal}</Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-3 pt-6">
                  {!approvalsAvailable ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500">
                      Mục này chỉ hiển thị cho người có quyền duyệt đơn.
                    </div>
                  ) : pendingRequests.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500">
                      Không có đơn nào đang chờ xử lý.
                    </div>
                  ) : (
                    pendingRequests.map((request) => (
                      <Link
                        key={request.id}
                        href="/requests/pending-approvals"
                        className="group block rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-sm font-semibold text-slate-900">
                              {request.requestType?.name ||
                                request.requestCode ||
                                `Đơn #${request.id}`}
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              {request.employee?.fullName || "Nhân sự"}
                              {request.employee?.department?.name
                                ? ` • ${request.employee.department.name}`
                                : ""}
                            </p>
                          </div>
                          <ArrowUpRight className="h-4 w-4 text-slate-300 transition-colors group-hover:text-slate-500" />
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            {request.startDate || "--"} -{" "}
                            {request.endDate || "--"}
                          </span>
                          <span className="rounded-full bg-slate-100 px-2.5 py-1">
                            Gửi {formatRelativeTime(request.submittedAt)}
                          </span>
                        </div>
                      </Link>
                    ))
                  )}
                </CardContent>
              </Card>
            )}
          </PermissionGate>

          <PermissionGate permission="ONBOARDING_PROGRESS_READ">
            {loading ? (
              <LoadingCard rows={3} />
            ) : (
              <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <CardTitle>Hội nhập</CardTitle>
                      <CardDescription>
                        Trạng thái onboarding toàn hệ thống trong 30 ngày gần
                        nhất.
                      </CardDescription>
                    </div>
                    <Badge variant="primary">
                      +{onboardingStats.growthRate}%
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Nhân viên mới
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {onboardingStats.newEmployeesLast30Days}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Đang thực hiện
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {onboardingStats.inProgress}
                      </p>
                    </div>
                    <div className="rounded-2xl bg-slate-50 p-4">
                      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">
                        Hoàn thành
                      </p>
                      <p className="mt-2 text-2xl font-semibold text-slate-900">
                        {onboardingStats.completed}
                      </p>
                    </div>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between text-sm">
                      <span className="font-medium text-slate-700">
                        Tăng trưởng onboarding
                      </span>
                      <span
                        className={
                          onboardingStats.growthRate >= 0
                            ? "text-emerald-600"
                            : "text-rose-600"
                        }
                      >
                        {onboardingStats.growthRate >= 0 ? "+" : ""}
                        {onboardingStats.growthRate}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-slate-100">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-violet-500 via-indigo-500 to-cyan-500"
                        style={{
                          width: `${Math.min(100, Math.max(0, Math.abs(onboardingStats.growthRate) * 5))}%`,
                        }}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </PermissionGate>

          <PermissionGate permission="DEPARTMENT_READ">
            {loading ? (
              <LoadingCard rows={4} />
            ) : (
              <Card className="overflow-hidden border-slate-200/70 bg-white/90 shadow-sm">
                <CardHeader className="border-b border-slate-100 bg-slate-50/60">
                  <CardTitle>Phòng ban nổi bật</CardTitle>
                  <CardDescription>
                    Thứ tự theo quy mô nhân sự, dựa trên cây phòng ban hiện tại.
                  </CardDescription>
                </CardHeader>

                <CardContent className="space-y-4 pt-6">
                  {topDepartments.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-5 text-sm text-slate-500">
                      Chưa có dữ liệu phòng ban.
                    </div>
                  ) : (
                    topDepartments.map((department) => {
                      const maxCount =
                        topDepartments[0]?.totalEmployeeCount || 1;
                      const width = Math.max(
                        8,
                        Math.round(
                          ((department.totalEmployeeCount || 0) / maxCount) *
                            100,
                        ),
                      );

                      return (
                        <div
                          key={department.id}
                          className="space-y-2 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="font-semibold text-slate-900">
                                {department.departmentName}
                              </p>
                              <p className="mt-1 text-sm text-slate-500">
                                Quản lý:{" "}
                                {department.manager?.fullName || "Chưa gán"}
                              </p>
                            </div>
                            <div className="text-right text-sm">
                              <p className="font-semibold text-slate-900">
                                {department.totalEmployeeCount || 0}
                              </p>
                              <p className="text-slate-500">nhân sự</p>
                            </div>
                          </div>

                          <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                            <div
                              className="h-full rounded-full bg-gradient-to-r from-sky-500 via-indigo-500 to-violet-500"
                              style={{ width: `${width}%` }}
                            />
                          </div>

                          <div className="flex items-center gap-2 text-xs text-slate-500">
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {department.totalProbationCount || 0} thử việc
                            </span>
                            <span className="rounded-full bg-slate-100 px-2.5 py-1">
                              {department.children?.length || 0} phòng ban con
                            </span>
                          </div>
                        </div>
                      );
                    })
                  )}
                </CardContent>
              </Card>
            )}
          </PermissionGate>
        </div>
      </section>
    </div>
  );
}
