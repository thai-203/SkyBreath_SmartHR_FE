"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/common/Input";
import { Button } from "@/components/common/Button";

export default function WorkingShiftFormModal({
  open,
  loading,
  data,
  setData,
  groups,
  onClose,
  onSubmit,
}) {
  const selectClass = "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Cố định bg-white để tránh lỗi nền đen như ảnh trước */}
      <DialogContent className="bg-white sm:max-w-[550px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl font-bold text-gray-800">
            {data?.shiftName ? "Chỉnh sửa ca làm việc" : "Thêm ca làm việc mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-4 py-6 px-6">
          {/* Hàng 1: Tên ca & Nhóm ca */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Tên ca</label>
              <Input
                placeholder="VD: Ca sáng"
                value={data.shiftName || ""}
                onChange={(e) => setData({ ...data, shiftName: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">Nhóm ca</label>
              <select
                value={data.groupId || ""}
                onChange={(e) => setData({ ...data, groupId: e.target.value })}
                className={selectClass}
              >
                <option value="">-- Chọn nhóm --</option>
                {groups.map((g) => (
                  <option key={g.value} value={g.value}>{g.label}</option>
                ))}
              </select>
            </div>
          </div>

          <hr className="my-2 border-gray-100" />

          {/* Hàng 2: Giờ làm việc chính */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-blue-600">Giờ bắt đầu</label>
              <Input
                type="time"
                value={data.startTime || ""}
                onChange={(e) => setData({ ...data, startTime: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-blue-600">Giờ kết thúc</label>
              <Input
                type="time"
                value={data.endTime || ""}
                onChange={(e) => setData({ ...data, endTime: e.target.value })}
              />
            </div>
          </div>

          {/* Hàng 3: Giờ nghỉ trưa */}
          <div className="grid grid-cols-2 gap-4 p-4 bg-orange-50/50 rounded-lg border border-orange-100">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-orange-700">Giờ nghỉ bắt đầu</label>
              <Input
                type="time"
                className="bg-white"
                value={data.breakStartTime || ""}
                onChange={(e) => setData({ ...data, breakStartTime: e.target.value })}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-orange-700">Giờ nghỉ kết thúc</label>
              <Input
                type="time"
                className="bg-white"
                value={data.breakEndTime || ""}
                onChange={(e) => setData({ ...data, breakEndTime: e.target.value })}
              />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-3">
          <Button 
            variant="outline" 
            onClick={onClose} 
            disabled={loading}
            className="rounded-md"
          >
            Hủy
          </Button>
          <Button 
            onClick={onSubmit} 
            loading={loading}
            className="rounded-md bg-indigo-600 hover:bg-indigo-700 text-white min-w-[120px]"
          >
            {data?.shiftName ? "Lưu thay đổi" : "Tạo ca"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}