"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";

export default function ShiftGroupDetailModal({ open, group, onClose }) {
  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose && onClose()}>
      <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none bg-white rounded-xl shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50 border-b">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            Thông tin nhóm ca
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            {group?.groupName || ""}
          </DialogDescription>
          {group && (
            <div className="mt-2">
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                  group.status === "active"
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-50 text-slate-400"
                }`}
              >
                {group.status === "active" ? "Đang hoạt động" : "Tạm ngưng"}
              </span>
            </div>
          )}
        </DialogHeader>

        <div className="px-6 py-5">
          {group?.shifts && group.shifts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm border-separate border-spacing-0">
                <thead>
                  <tr>
                    <th className="px-4 py-2 text-left">STT</th>
                    <th className="px-4 py-2 text-left">Tên ca</th>
                    <th className="px-4 py-2 text-left">Khung giờ</th>
                    <th className="px-4 py-2 text-left">Nghỉ giữa ca</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {group.shifts.map((shift, idx) => (
                    <tr key={shift.id || idx}>
                      <td className="px-4 py-2">{idx + 1}</td>
                      <td className="px-4 py-2 font-medium text-slate-700">
                        {shift.shiftName || "-"}
                      </td>
                      <td className="px-4 py-2">
                        {shift.startTime && shift.endTime
                          ? `${shift.startTime} - ${shift.endTime}`
                          : "-"}
                      </td>
                      <td className="px-4 py-2">
                        {shift.breakStartTime && shift.breakEndTime
                          ? `${shift.breakStartTime} - ${shift.breakEndTime}`
                          : "-"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-slate-500 italic">
              Nhóm này chưa có ca làm việc nào.
            </p>
          )}
        </div>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex justify-end">
          <Button onClick={onClose}>Đóng</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
