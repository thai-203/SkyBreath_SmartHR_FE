"use client";

import { Modal } from "@/components/common/Modal";
import { Badge } from "@/components/ui/badge";
import { Clock, Monitor, MapPin, AlertCircle, Image as ImageIcon } from "lucide-react";

const ACTION_TYPE_LABELS = {
  check_in: "Check-in",
  check_out: "Check-out",
  join: "Tham gia",
};

const STATUS_COLORS = {
  SUCCESS: "bg-green-50 text-green-700 border-green-200",
  FAILED: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_LABELS = {
  SUCCESS: "Thành công",
  FAILED: "Thất bại",
};

function InfoRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-border/40 last:border-0">
      <div className="flex-shrink-0 mt-0.5 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-100">
        <Icon className="w-4 h-4 text-slate-500" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-muted-foreground font-medium mb-0.5">{label}</p>
        <p className="text-sm font-medium text-foreground break-words">
          {value ?? <span className="text-muted-foreground italic text-xs">Không có</span>}
        </p>
      </div>
    </div>
  );
}

export function LogDetailModal({ isOpen, onClose, log }) {
  if (!log) return null;

  const formatTime = (time) =>
    time
      ? new Date(time).toLocaleString("vi-VN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        })
      : "—";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Chi tiết log điểm danh"
      description={`ID: ${log.id}`}
      size="default"
    >
      <div className="space-y-1 mt-2">
        {/* Nhân viên */}
        <div className="rounded-lg border border-border/40 bg-slate-50/50 p-4 mb-3">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Nhân viên</p>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold text-base">
              {log.empFullName?.[0] ?? "?"}
            </div>
            <div>
              <p className="font-semibold text-foreground">{log.empFullName ?? "Không xác định"}</p>
              <p className="text-xs text-muted-foreground font-mono">{log.empCode ?? "—"}</p>
            </div>
            <div className="ml-auto flex flex-col items-end gap-1">
              <Badge variant="outline" className={STATUS_COLORS[log.status] ?? ""}>
                {STATUS_LABELS[log.status] ?? log.status}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {ACTION_TYPE_LABELS[log.actionType] ?? log.actionType}
              </span>
            </div>
          </div>
        </div>

        {/* Chi tiết */}
        <div className="space-y-0 rounded-lg border border-border/40 p-4">
          <InfoRow icon={Clock} label="Thời gian" value={formatTime(log.time)} />
          <InfoRow icon={Monitor} label="Request IP" value={log.requestIp} />
          {log.status === "FAILED" && (
            <InfoRow icon={AlertCircle} label="Lỗi" value={log.errorMessage} />
          )}
        </div>

        {/* Evidence image */}
        {log.evidenceImageUrl && (
          <div className="rounded-lg border border-border/40 p-4 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
              <ImageIcon className="w-3.5 h-3.5" />
              Ảnh minh chứng
            </div>
            <img
              src={log.evidenceImageUrl}
              alt="Evidence"
              className="w-full max-h-64 object-cover rounded-lg border border-border/40"
              onError={(e) => { e.target.style.display = "none"; }}
            />
          </div>
        )}
      </div>
    </Modal>
  );
}
