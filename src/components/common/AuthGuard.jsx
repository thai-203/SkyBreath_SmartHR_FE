"use client";

import { useEffect, useState } from "react";
import { usePathname, notFound } from "next/navigation";
import { Skeleton } from "./Skeleton";
import { authService } from "@/services";

const ROUTE_PERMISSIONS = {
  // Public routes
  "/login": {},
  "/forgot-password": {},

  // Dashboard
  "/dashboard": {},

  // Face Recognition & Attendance
  "/face/checkin": { permissions: ["ATTENDANCE_READ_OWN"] },
  "/face/register": { permissions: ["ATTENDANCE_FACE_DATA_READ_OWN"] },
  "/face/manage": { permissions: ["ATTENDANCE_FACE_DATA_READ"] },

  // Employee
  "/employees": { permissions: ["EMPLOYEE_READ"] },
  "/employees/leave-calendar": { permissions: [] },

  // Department
  "/departments": { permissions: ["DEPARTMENT_READ"] },
  "/departments/chart": { permissions: ["DEPARTMENT_READ"] },

  // Contracts
  "/contracts": { permissions: ["CONTRACT_READ"] },

  // Holidays
  "/holidays": { permissions: ["HOLIDAY_READ", "HOLIDAY_READ_OWN"] },
  "/holidays/groups": { permissions: ["HOLIDAY_GROUP_READ"] },
  "/holidays/configuration": { permissions: ["HOLIDAY_CONFIG"] },
  "/holidays/entry": { permissions: ["HOLIDAY_READ_OWN"] },
  "/holidays/notifications": { permissions: ["HOLIDAY_NOTIFICATION_SEND"] },
  "/holidays/[id]": { permissions: ["HOLIDAY_READ"] },
  "/holidays/entry/[id]": { permissions: ["HOLIDAY_READ_OWN"] },

  // Onboarding
  // "/onboardings": { permissions: ["ONBOARDING_PLAN_READ"] },
  "/onboardings/plans": { permissions: ["ONBOARDING_PROGRESS_READ"] },
  "/onboardings/template": { permissions: ["ONBOARDING_PLAN_READ"] },
  "/onboardings/employee": {
    permissions: ["ONBOARDING_PROGRESS_READ_OWN"],
  },

  // Payroll
  "/payroll": { permissions: ["PAYROLL_READ"] },
  "/payroll/types": { permissions: ["PAYROLL_TYPE_READ"] },

  // Permissions (ADMIN only)
  "/permissions": {
    role: ["ADMIN"],
  },

  // Policies
  "/policy/overtime": { permissions: ["OVERTIME_RULE_READ_OWN"] },
  "/policy/penalties": { permissions: ["PENALTY_READ_OWN"] },

  // Regulations
  "/regulations/overtime": { permissions: ["OVERTIME_RULE_READ"] },
  "/regulations/penalties": { permissions: ["PENALTY_READ"] },

  // Requests
  "/requests/my-requests": { permissions: ["REQUEST_READ_OWN"] },
  "/requests/pending-approvals": { permissions: ["REQUEST_READ"] },
  "/requests/groups": { permissions: ["REQUEST_GROUP_READ"] },
  "/requests/groups/[id]": { permissions: ["REQUEST_GROUP_READ"] },
  "/requests/types": { permissions: ["REQUEST_TYPE_READ"] },

  // Roles (ADMIN only)
  "/roles": {
    role: ["ADMIN"],
  },
  "/roles/create": {
    role: ["ADMIN"],
  },

  // Settings
  "/settings/general": {},
  "/settings/security": {},

  // Shifts
  "/shifts/personal": { permissions: ["SHIFT_READ_OWN"] },
  "/shifts/groups": { permissions: ["SHIFT_GROUP_READ"] },
  "/shifts/working": { permissions: ["SHIFT_READ"] },
  "/shifts/assignments": { permissions: ["SHIFT_ASSIGN_READ"] },
  "/shifts/schedule": { permissions: ["SHIFT_SCHEDULE_READ"] },

  // Timesheets
  "/timesheets/data": {
    permissions: ["TIMESHEET_READ", "TIMESHEET_READ_OWN"],
  },
  "/timesheets/generation": { permissions: ["TIMESHEET_READ"] },
  "/timesheets/locking": { permissions: ["TIMESHEET_READ"] },
  "/timesheets/excuses": { permissions: ["TIMESHEET_READ"] },
  "/timesheets/history": { permissions: ["TIMESHEET_READ"] },

  // Users
  "/users": { permissions: ["USER_READ"] },
  "/users/audit-log": { permissions: ["USER_ACTION_LOG_READ"] },

  // Configurations
  "/configurations": {
    permissions: [
      "ATTENDANCE_FACE_RECOGNITION_CONFIG_READ",
      "ATTENDANCE_SECURITY_CONFIG_READ",
      "ATTENDANCE_BLOCKING_CONFIG_READ",
    ],
  },
  "/configurations/face-recognition": {
    permissions: ["ATTENDANCE_FACE_RECOGNITION_CONFIG_READ"],
  },
  "/configurations/attendance-security": {
    permissions: ["ATTENDANCE_SECURITY_CONFIG_READ"],
  },
  "/configurations/attendance-blocking": {
    permissions: ["ATTENDANCE_BLOCKING_CONFIG_READ"],
  },
};

export function AuthGuard({ children }) {
  const pathname = usePathname();
  const requiredPerms = ROUTE_PERMISSIONS[pathname];
  const [isAuthenticated, setIsAuthenticated] = useState(null);

  useEffect(() => {
    if (!authService.isAuthenticated()) {
      notFound();
    } else if (requiredPerms && !canAccess(requiredPerms)) {
      notFound();
    } else {
      setIsAuthenticated(true);
    }
  }, [pathname]);

  if (isAuthenticated === null) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md space-y-4">
          <Skeleton className="h-12 w-3/4 mx-auto" />
          <Skeleton className="h-64 w-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

export const PermissionGate = ({ permission, fallback = null, children }) => {
  return authService.hasAnyPermission(
    Array.isArray(permission) ? permission : [permission],
  )
    ? children
    : fallback;
};

// useCanAccess hook — dùng trong logic JS
export const canAccess = (item) => {
  // 1. Check role trước (nếu có)
  const hasRole = !item.role || authService.hasAnyRole(item.role);

  if (!hasRole) return false;

  // 2. Check permission của chính nó
  const hasPermission =
    !item.permissions || authService.hasAnyPermission(item.permissions);

  if (hasPermission) return true;

  return false;
};
