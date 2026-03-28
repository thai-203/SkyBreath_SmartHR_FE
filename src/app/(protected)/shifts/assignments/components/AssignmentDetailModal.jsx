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
import { Calendar, Users, Clock, RefreshCcw, Landmark, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";

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

  const ListInfoItem = ({ label, items, icon: Icon, colorClass = "bg-blue-50 text-blue-700" }) => (
    <div className="col-span-full flex flex-col gap-2 rounded-xl border border-slate-100 bg-slate-50/30 p-4 transition-all">
      <div className="flex items-center gap-2 text-slate-500 mb-1">
        {Icon && <Icon size={16} className="text-slate-400" />}
        <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
        <span className="ml-auto text-[10px] bg-slate-200 px-2 py-0.5 rounded-full text-slate-600">
          {items?.length || 0} mục
        </span>
      </div>
      <div className="max-h-[120px] overflow-y-auto custom-scrollbar">
        <div className="flex flex-wrap gap-1.5">
          {items && items.length > 0 ? (
            items.map((item, idx) => (
              <Badge 
                key={idx} 
                variant="secondary" 
                className={`font-normal border-none ${colorClass}`}
              >
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-slate-400 italic">Không có dữ liệu</span>
          )}
        </div>
      </div>
    </div>
  );

  const SmallInfoItem = ({ label, value, icon: Icon }) => (
    <div className="flex items-start gap-3 rounded-xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-blue-50">
        {Icon && <Icon size={16} className="text-blue-600" />}
      </div>
      <div>
        <p className="text-[10px] font-bold uppercase tracking-tight text-slate-400">{label}</p>
        <p className="text-sm font-semibold text-slate-700">{value || "-"}</p>
      </div>
    </div>
  );

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl overflow-hidden border-none bg-white p-0 shadow-2xl">
        <DialogHeader className="relative border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white px-6 py-5">
          <div className="absolute left-0 top-0 h-full w-1 bg-blue-600" />
          <DialogTitle className="text-xl font-extrabold text-slate-800 flex items-center gap-2">
            <div className="rounded-md bg-blue-600 p-1 text-white">
               <Clock size={18} />
            </div>
            {data?.assignmentName || "Chi tiết bảng phân ca"}
          </DialogTitle>
        </DialogHeader>

        {/* Content */}
        <ScrollArea className="max-h-[70vh] p-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {/* Thông tin chung */}
            <SmallInfoItem 
              label="Chu kỳ lặp" 
              icon={RefreshCcw}
              value={repeatTypeMap[data?.repeatType] || data?.repeatType} 
            />
            <SmallInfoItem 
              label="Thời gian áp dụng" 
              icon={Calendar}
              value={`${data?.effectiveFrom || "..."} - ${data?.effectiveTo || "..."}`} 
            />
            
            <div className="col-span-full">
               <SmallInfoItem 
                label="Ca làm việc" 
                icon={Clock}
                value={(data?.shiftNames || []).join(", ")} 
              />
            </div>

            <div className="col-span-full mt-2">
               <SmallInfoItem 
                label="Ngày trong tuần" 
                icon={Calendar}
                value={weekdays.join(", ")} 
              />
            </div>

            {/* Phần danh sách dài - Chuyển thành dạng Badge và Full Width */}
            <div className="col-span-full mt-2 space-y-4">
              <ListInfoItem 
                label="Phòng ban áp dụng" 
                items={data?.departmentNames} 
                icon={Landmark}
                colorClass="bg-indigo-50 text-indigo-700"
              />

              <ListInfoItem 
                label="Nhân viên áp dụng" 
                items={data?.employeeNames} 
                icon={Users}
                colorClass="bg-emerald-50 text-emerald-700"
              />
            </div>
          </div>
        </ScrollArea>

        {/* Footer */}
        <DialogFooter className="border-t border-slate-100 bg-slate-50/80 px-6 py-4">
          <Button 
            onClick={onClose}
            variant="outline"
            className="border-slate-200 hover:bg-slate-100"
          >
            Đóng
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}