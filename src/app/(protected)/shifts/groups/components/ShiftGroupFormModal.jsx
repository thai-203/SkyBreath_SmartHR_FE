"use client";

import { useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/common/Input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/common/Toast";

export default function ShiftGroupFormModal({
  open,
  loading,
  data,
  setData,
  onClose,
  onSubmit,
}) {
  const { error } = useToast();

  const validate = () => {
    if (!data.groupName?.trim()) {
      error("Tên nhóm ca không được để trống");
      return false;
    }
    return true;
  };

  const handleFormSubmit = (e) => {
    e?.preventDefault();
    if (validate()) {
      onSubmit();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden border-none bg-white rounded-xl shadow-2xl">
        <DialogHeader className="px-6 pt-6 pb-4 bg-slate-50 border-b">
          <DialogTitle className="text-xl font-semibold text-slate-900">
            {data?.groupName ? "Chỉnh sửa nhóm ca" : "Tạo nhóm ca mới"}
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500">
            Điền thông tin chi tiết để thiết lập nhóm ca làm việc.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleFormSubmit} className="px-6 py-5 space-y-5">
          {/* Tên nhóm ca */}
          <div className="space-y-2">
            <Label htmlFor="groupName" className="text-sm font-medium flex gap-1">
              Tên nhóm ca <span className="text-red-500">*</span>
            </Label>
            <Input
              id="groupName"
              placeholder="VD: Nhóm sản xuất A, Khối văn phòng..."
              value={data.groupName || ""}
              onChange={(e) => setData({ ...data, groupName: e.target.value })}
              className="border-slate-200 focus:ring-blue-500"
            />
          </div>

          {/* Trạng thái hoạt động */}
          <div className="space-y-2">
            <Label className="text-sm font-medium">Trạng thái hoạt động</Label>
            <Select
              value={data.status || "active"}
              onValueChange={(value) => setData({ ...data, status: value })}
            >
              <SelectTrigger className="w-full border-slate-200 focus:ring-blue-500">
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500" />
                    <span>Đang hoạt động</span>
                  </div>
                </SelectItem>
                <SelectItem value="inactive">
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-slate-300" />
                    <span>Tạm ngưng</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Mô tả */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-sm font-medium">
              Mô tả chi tiết
            </Label>
            <Textarea
              id="description"
              placeholder="Nhập ghi chú hoặc quy định riêng của nhóm ca này..."
              rows={3}
              className="resize-none border-slate-200 focus:ring-blue-500"
              value={data.description || ""}
              onChange={(e) => setData({ ...data, description: e.target.value })}
            />
          </div>
        </form>

        <DialogFooter className="px-6 py-4 bg-slate-50 border-t flex flex-row items-center justify-end gap-3">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="border-slate-200 hover:bg-slate-100"
          >
            Hủy bỏ
          </Button>
          <Button
            type="submit"
            onClick={handleFormSubmit}
            loading={loading}
            className="bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
          >
            {data?.groupName ? "Lưu thay đổi" : "Xác nhận tạo"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}