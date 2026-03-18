"use client";

import { Button } from "@/components/common/Button";
import { Modal } from "@/components/common/Modal";
import {
  Edit2,
  Mail,
  User as UserIcon,
  Shield,
  Clock,
  Key,
  UserX,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

export default function UserDetailModal({
  isOpen,
  onClose,
  user,
  onEdit,
  onRemoveRole,
  onResetPassword,
}) {
  if (!user) return null;

  const statusColors = {
    ACTIVE: { bg: "bg-green-100", text: "text-green-800", label: "Hoạt động" },
    INACTIVE: {
      bg: "bg-gray-100",
      text: "text-gray-800",
      label: "Không hoạt động",
    },
    LOCKED: { bg: "bg-red-100", text: "text-red-800", label: "Bị khóa" },
    PENDING: {
      bg: "bg-yellow-100",
      text: "text-yellow-800",
      label: "Chờ duyệt",
    },
  };

  const roleColors = {
    ADMIN: "bg-red-100 text-red-800",
    MANAGER: "bg-blue-100 text-blue-800",
    HR: "bg-green-100 text-green-800",
    USER: "bg-gray-100 text-gray-800",
  };

  const currentStatus = statusColors[user.status] || statusColors.INACTIVE;

  const infoRows = [
    {
      icon: UserIcon,
      label: "Tên đăng nhập",
      value: user.username,
    },
    {
      icon: Mail,
      label: "Email",
      value: user.email,
    },
    {
      icon: Shield,
      label: "Vai trò",
      value: (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${roleColors[user.role] || "bg-slate-100 text-slate-800"}`}
        >
          {user.userRoles[0]?.role.roleName}
        </span>
      ),
      raw: true,
    },
    {
      icon: Clock,
      label: "Trạng thái",
      value: (
        <span
          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${currentStatus.bg} ${currentStatus.text}`}
        >
          {currentStatus.label}
        </span>
      ),
      raw: true,
    },
  ];

  if (user.createdAt) {
    infoRows.push({
      icon: Clock,
      label: "Ngày tạo",
      value: formatDate(user.createdAt),
    });
  }

  if (user.lastLogin) {
    infoRows.push({
      icon: Clock,
      label: "Lần đăng nhập cuối",
      value: formatDate(user.lastLogin),
    });
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết người dùng"
      size="lg"
    >
      <div className="space-y-6">
        {/* User Header */}
        <div className="flex items-start gap-4 border-b border-slate-200 pb-6">
          <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center">
            <UserIcon className="h-8 w-8 text-slate-400" />
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-semibold text-slate-900">
              {user.username}
            </h2>
            <p className="text-sm text-slate-500">{user.email}</p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          {infoRows.map((row, index) => {
            const IconComponent = row.icon;
            return (
              <div key={index} className="flex gap-3">
                <IconComponent className="h-5 w-5 flex-shrink-0 text-slate-400 mt-0.5" />
                <div className="flex-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                    {row.label}
                  </p>
                  <p className="mt-1 text-sm text-slate-900">
                    {row.raw ? row.value : row.value || "-"}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Additional Info */}
        {(user.department || user.position) && (
          <div className="rounded-lg bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-900 mb-3">
              Thông tin công việc
            </h3>
            <div className="space-y-2 text-sm">
              {user.department && (
                <p>
                  <span className="text-slate-500">Phòng ban:</span>{" "}
                  <span className="text-slate-900">{user.department}</span>
                </p>
              )}
              {user.position && (
                <p>
                  <span className="text-slate-500">Chức vụ:</span>{" "}
                  <span className="text-slate-900">{user.position}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {/* Actions */}
        <div className="flex flex-wrap justify-end gap-3 border-t border-slate-200 pt-4">
          <Button type="button" variant="outline" onClick={onClose}>
            Đóng
          </Button>

          <Button
            type="button"
            variant="outline"
            className="text-orange-600 border-orange-200 hover:bg-orange-50"
            onClick={() => onRemoveRole?.(user)}
            disabled={user.isCurrentUser}
          >
            <UserX className="h-4 w-4" /> Remove Role
          </Button>

          <Button
            type="button"
            variant="outline"
            className="text-blue-600 border-blue-200 hover:bg-blue-50"
            onClick={() => onResetPassword?.(user)}
            disabled={user.isCurrentUser}
          >
            <Key className="h-4 w-4" />
            Reset Password
          </Button>

          <Button type="button" onClick={() => onEdit(user)} disabled={user.isCurrentUser}>
            <Edit2 className="h-4 w-4" />
            Chỉnh sửa
          </Button>
        </div>
      </div>
    </Modal>
  );
}
