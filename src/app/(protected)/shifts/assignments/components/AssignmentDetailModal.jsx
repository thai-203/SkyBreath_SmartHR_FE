"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Calendar, Users, Clock, RefreshCcw, Landmark } from "lucide-react";

const weekdayLabelMap = {
  1: "Thứ 2",
  2: "Thứ 3",
  3: "Thứ 4",
  4: "Thứ 5",
  5: "Thứ 6",
  6: "Thứ 7",
  7: "Chủ nhật",
};

const repeatTypeMap = {
  weekly: "Hàng tuần",
  "2weeks": "2 tuần",
  monthly: "Hàng tháng",
};

export default function AssignmentDetailModal({ open, data, onClose }) {
  const weekdays = Array.isArray(data?.weekdays)
    ? data.weekdays.map((d) => weekdayLabelMap[d] || `Thứ ${d}`)
    : [];

  // Component phụ để hiển thị từng ô thông tin
  const InfoItem = ({ label, value, icon: Icon }) => (
    <div className="flex flex-col gap-1 rounded-xl border border-slate-100 bg-white p-4 shadow-sm transition-all hover:border-blue-100">
      <div className="flex items-center gap-2 text-slate-500">
        {Icon && <Icon size={14} className="text-blue-500" />}
        <span className="text-[11px] font-bold uppercase tracking-wider">
          {label}
        </span>
      </div>
      <div className="mt-1 text-sm font-medium text-slate-800 leading-relaxed">
        {value || "-"}
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden border-none bg-white p-0 shadow-2xl">
        {/* Header */}
        <DialogHeader className="border-b border-slate-100 bg-slate-50/50 px-6 py-4">
          <DialogTitle className="text-xl font-bold text-slate-800">
            {data?.assignmentName || "Chi tiết bảng phân ca"}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <div className="grid grid-cols-1 gap-4 p-6 md:grid-cols-2">
          <InfoItem 
            label="Ca làm việc" 
            value={(data?.shiftNames || []).join(", ")} 
            icon={Clock}
          />
          
          <InfoItem 
            label="Thời gian áp dụng" 
            value={`${data?.effectiveFrom || "..."} - ${data?.effectiveTo || "..."}`} 
            icon={Calendar}
          />

          <InfoItem 
            label="Phòng ban áp dụng" 
            value={(data?.departmentNames || []).join(", ")} 
            icon={Landmark}
          />

          <InfoItem 
            label="Đối tượng áp dụng" 
            value={(data?.employeeNames || []).join(", ")} 
            icon={Users}
          />

          <InfoItem 
            label="Ngày trong tuần" 
            value={weekdays.join(", ")} 
            icon={Calendar}
          />

          <InfoItem 
            label="Chu kỳ lặp" 
            icon={RefreshCcw}
            value={repeatTypeMap[data?.repeatType] || data?.repeatType} 
          />
        </div>

        {/* Footer */}
        <DialogFooter className="border-t border-slate-100 bg-slate-50/50 px-6 py-4">
          <Button 
            onClick={onClose}
            className="min-w-[100px] bg-slate-800 text-white hover:bg-slate-700"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}