"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import {
  Clock,
  Mail,
  Phone,
  Building2,
  Briefcase,
  UserCircle,
  Trash2,
} from "lucide-react";

// ─── Helpers ─────────────────────────────────────────────────────────────────────
function formatDateTime(dateStr) {
  if (!dateStr) return "-";
  try {
    return new Date(dateStr).toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return String(dateStr);
  }
}

function getInitials(name) {
  return name
    .split(" ")
    .map((w) => w[0])
    .slice(-2)
    .join("")
    .toUpperCase();
}

// ─── Sub-components ───────────────────────────────────────────────────────────────
const InfoItem = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-3 py-2">
    <Icon className="h-4 w-4 text-slate-400 mt-0.5 shrink-0" />
    <div className="flex-1 min-w-0">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-medium text-slate-900 truncate">
        {value || "-"}
      </p>
    </div>
  </div>
);

const Section = ({ title, children }) => (
  <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
    <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
    {children}
  </div>
);
const api_base = "http://localhost:3000";
// ─── Face thumbnail card ──────────────────────────────────────────────────────────
function FaceCard({ face, index }) {
  return (
    <div className="group relative">
      <div className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-50">
        <div className="flex h-full w-full items-center justify-center">
          {face.imageUrl ? (
            <img
              src={api_base + face.imageUrl}
              alt={`Face #${index + 1}`}
              className="h-full w-full object-cover"
            />
          ) : (
            <UserCircle className="h-12 w-12 text-slate-300" strokeWidth={1} />
          )}
        </div>

        {/* Index badge */}
        <span className="absolute top-2 left-2 px-1.5 py-0.5 rounded text-xs font-medium bg-white/80 border border-slate-200 text-slate-600 backdrop-blur-sm">
          #{index + 1}
        </span>
      </div>

      {/* Registered date */}
      <div className="mt-1.5 flex items-center gap-1 text-xs text-slate-400 px-0.5">
        <Clock className="h-3 w-3 shrink-0" />
        {formatDateTime(face.registeredAt)}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────────
export default function FaceDataDetailModal({
  isOpen,
  onClose,
  group,
  onDeleteAll,
}) {
  if (!group) return null;

  const { employee, faces, count } = group;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết dữ liệu khuôn mặt"
      size="xl"
    >
      <div className="max-h-[80vh] overflow-y-auto px-2 space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
          <div className="h-14 w-14 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-semibold text-lg shrink-0">
            {employee.avatar ? (
              <img
                src={api_base +"/"+ employee.avatar}
                alt={employee.fullName}
                className="h-full w-full object-cover rounded-full"
              />
            ) : (
              getInitials(employee.fullName)
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-slate-900">
              {employee.fullName}
            </h2>
            <p className="text-sm font-mono text-indigo-600">
              {employee.employeeCode || "-"}
            </p>
            <p className="text-sm text-slate-500">
              {employee?.positionName || "-"} •{" "}
              {employee?.departmentName || "-"}
            </p>
          </div>
          <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-200 shrink-0">
            {count} mẫu ảnh
          </span>
        </div>

        {/* Employee info */}
        <Section title="Thông tin nhân viên">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <InfoItem
              icon={Mail}
              label="Email công ty"
              value={employee.companyEmail}
            />
            <InfoItem
              icon={Phone}
              label="Số điện thoại"
              value={employee.phoneNumber}
            />
            <InfoItem
              icon={Building2}
              label="Phòng ban"
              value={employee.departmentName}
            />
            <InfoItem
              icon={Briefcase}
              label="Chức vụ"
              value={employee.positionName}
            />
          </div>
        </Section>

        {/* Face grid */}
        <Section title={`Ảnh đã đăng ký (${count})`}>
          {faces.length === 0 ? (
            <div className="flex flex-col items-center gap-2 py-8 text-slate-400">
              <UserCircle
                className="h-10 w-10 text-slate-300"
                strokeWidth={1}
              />
              <p className="text-sm">Chưa có ảnh nào</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-1">
              {faces.map((face, i) => (
                <FaceCard
                  key={face.id}
                  face={face}
                  index={i}
                />
              ))}
            </div>
          )}
        </Section>

        {/* Footer actions */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-200">
          <p className="text-xs text-slate-400">Tổng: {count} mẫu ảnh</p>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onClose}>
              Đóng
            </Button>
            <Button
              variant="destructive"
              className="flex items-center gap-1.5"
              onClick={() => onDeleteAll(employee)}
            >
              <Trash2 className="h-3.5 w-3.5" />
              Xoá toàn bộ
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
