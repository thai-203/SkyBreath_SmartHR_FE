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
import { cn } from "@/lib/utils";

export default function AssignmentFormModal({
  open,
  loading,
  data,
  setData,
  employees,
  departments,
  shifts,
  onClose,
  onSubmit,
}) {
  const selectClass =
    "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      {/* Thêm bg-white để sửa lỗi nền đen, sm:max-w để form rộng rãi hơn */}
      <DialogContent className="bg-white sm:max-w-[500px] p-0 overflow-hidden border-none shadow-2xl">
        <DialogHeader className="px-6 pt-6">
          <DialogTitle className="text-xl font-bold text-gray-800">
            {data?.id ? "Cập nhật phân ca" : "Phân ca mới"}
          </DialogTitle>
        </DialogHeader>

        <div className="grid gap-5 py-6 px-6">
          {/* Hàng 1: Áp dụng cho */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Áp dụng cho
            </label>
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="assignType"
                  value="employee"
                  checked={!!data.employeeId}
                  onChange={() =>
                    setData({ ...data, employeeId: "", departmentId: "" })
                  }
                  className="mr-1"
                />
                Nhân viên
              </label>
              <label className="inline-flex items-center">
                <input
                  type="radio"
                  name="assignType"
                  value="department"
                  checked={!!data.departmentId}
                  onChange={() =>
                    setData({ ...data, employeeId: "", departmentId: "" })
                  }
                  className="mr-1"
                />
                Phòng ban
              </label>
            </div>
          </div>

          {/* Hàng 2: Nhân viên (hiển thị khi chọn nhân viên) */}
          {data.departmentId === "" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Nhân viên
              </label>
              <select
                value={data.employeeId || ""}
                onChange={(e) =>
                  setData({ ...data, employeeId: e.target.value })
                }
                className={selectClass}
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hàng 3: Phòng ban (hiển thị khi chọn phòng ban) */}
          {data.employeeId === "" && (
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Phòng ban
              </label>
              <select
                value={data.departmentId || ""}
                onChange={(e) =>
                  setData({ ...data, departmentId: e.target.value })
                }
                className={selectClass}
              >
                <option value="">-- Chọn --</option>
                {departments.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Hàng 4: Ca (always shown) */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-medium text-gray-700">
              Ca làm việc
            </label>
            <select
              value={data.shiftId || ""}
              onChange={(e) => setData({ ...data, shiftId: e.target.value })}
              className={selectClass}
            >
              <option value="">-- Chọn --</option>
              {shifts.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>

          {/* Hàng 5: Thời gian (Chia đôi) */}

          {/* Hàng 3: Thời gian (Chia đôi) */}
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Từ ngày
              </label>
              <Input
                type="date"
                className="focus:ring-2"
                value={data.effectiveFrom || ""}
                onChange={(e) =>
                  setData({ ...data, effectiveFrom: e.target.value })
                }
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-gray-700">
                Đến ngày
              </label>
              <Input
                type="date"
                className="focus:ring-2"
                value={data.effectiveTo || ""}
                onChange={(e) =>
                  setData({ ...data, effectiveTo: e.target.value })
                }
              />
            </div>
          </div>
        </div>

        <DialogFooter className="bg-gray-50 px-6 py-4 flex gap-3">
          <Button
            variant="outline"
            onClick={onClose}
            disabled={loading}
            className="rounded-md border-gray-300"
          >
            Hủy bỏ
          </Button>
          <Button
            onClick={onSubmit}
            loading={loading}
            className="rounded-md bg-blue-600 hover:bg-blue-700 text-white min-w-[100px]"
          >
            {data?.id ? "Cập nhật" : "Tạo phân ca"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
