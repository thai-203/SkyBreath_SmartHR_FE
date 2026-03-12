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
import { useEffect, useState, useMemo } from "react";
import { shiftAssignmentsService } from "@/services";
import {
  Calendar as CalendarIcon,
  Clock,
  Users,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  CalendarDays,
} from "lucide-react";

// --- Helper nội bộ để format key so sánh ngày ---
const formatDateKey = (date) => {
  if (!date) return "";
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

// --- Component Preview (HIỂN THỊ THEO THÁNG CÓ ĐIỀU HƯỚNG) ---
function PreviewSchedule({ params, shifts }) {
  const [preview, setPreview] = useState([]);
  const [loading, setLoading] = useState(false);

  // State quản lý tháng đang hiển thị trên Preview
  const [viewDate, setViewDate] = useState(new Date());

  // Tự động nhảy lịch đến tháng của startDate khi người dùng chọn ngày ở form trái
  useEffect(() => {
    if (params.startDate) {
      const date = new Date(params.startDate);
      if (!isNaN(date.getTime())) {
        setViewDate(date);
      }
    }
  }, [params.startDate]);

  useEffect(() => {
    if (!params.startDate || !params.endDate || !params.weekdays?.length) {
      setPreview([]);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const res = await shiftAssignmentsService.preview(params);
        setPreview(res.data || []);
      } catch (err) {
        console.error("Error loading preview:", err);
        setPreview([]);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [JSON.stringify(params)]);

  // Hàm chuyển tháng
  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const handleToday = () => {
    setViewDate(new Date());
  };

  // Logic Render Lưới Lịch Tháng (Lưới 7x6 cố định = 42 ô)
  const calendarGrid = useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);

    const previewMap = new Map(
      preview.map((item) => [formatDateKey(item.date), item]),
    );

    const grid = [];

    // 1. Padding ngày tháng trước
    let firstDayIndex = firstDayOfMonth.getDay() - 1;
    if (firstDayIndex === -1) firstDayIndex = 6;

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      grid.push({
        type: "padding",
        date: new Date(year, month - 1, prevMonthLastDay - i),
      });
    }

    // 2. Các ngày trong tháng hiện tại
    for (let d = 1; d <= lastDayOfMonth.getDate(); d++) {
      const curr = new Date(year, month, d);
      const key = formatDateKey(curr);
      grid.push({
        type: "day",
        date: curr,
        data: previewMap.get(key),
        isCurrentMonth: true,
      });
    }

    // 3. Padding ngày tháng sau
    const remainingSlots = 42 - grid.length;
    for (let i = 1; i <= remainingSlots; i++) {
      grid.push({
        type: "padding",
        date: new Date(year, month + 1, i),
      });
    }

    return grid;
  }, [preview, viewDate]);

  if ((!params.weekdays?.length || !preview.length) && !loading)
    return (
      <div className="h-full flex flex-col items-center justify-center text-slate-400 border-2 border-dashed rounded-xl p-8 bg-white/50">
        <CalendarDays className="w-12 h-12 mb-2 opacity-20" />
        <p className="text-sm text-center font-medium leading-relaxed">
          Chọn thời gian và <b>thứ trong tuần</b> <br /> để xem lịch tháng dự
          kiến
        </p>
      </div>
    );

  const weekLabels = ["T2", "T3", "T4", "T5", "T6", "T7", "CN"];

  return (
    <div className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col h-full max-h-full">
      {/* Header Preview với Bộ Điều Hướng */}
      <div className="bg-slate-50 px-4 py-3 border-b flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="flex bg-white border rounded-lg p-0.5 shadow-sm">
            <button
              onClick={handlePrevMonth}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
              title="Tháng trước"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={handleToday}
              className="px-2 text-[10px] font-bold text-slate-500 hover:bg-slate-100 rounded-md uppercase"
            >
              T.Nay
            </button>
            <button
              onClick={handleNextMonth}
              className="p-1 hover:bg-slate-100 rounded-md text-slate-600 transition-colors"
              title="Tháng sau"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <h3 className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
            Tháng {viewDate.getMonth() + 1}/{viewDate.getFullYear()}
          </h3>
        </div>
        <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold uppercase tracking-tighter">
          {preview.length} Ngày công
        </span>
      </div>

      <div className="grid grid-cols-7 border-b bg-slate-50/50">
        {weekLabels.map((day) => (
          <div
            key={day}
            className="py-2 text-[10px] font-bold text-slate-400 text-center uppercase"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-100/10">
        <div className="grid grid-cols-7 gap-px bg-slate-200">
          {loading
            ? Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="aspect-square bg-white animate-pulse" />
              ))
            : calendarGrid.map((cell, idx) => {
                const isToday =
                  new Date().toDateString() === cell.date.toDateString();
                const hasData = !!cell.data;
                const isPadding = cell.type === "padding";

                return (
                  <div
                    key={idx}
                    className={cn(
                      "bg-white min-h-[75px] p-1 flex flex-col gap-1 transition-colors relative",
                      isPadding && "bg-slate-50/50 opacity-25 grayscale",
                      !hasData && !isPadding && "bg-white",
                    )}
                  >
                    <span
                      className={cn(
                        "text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full transition-colors",
                        isToday ? "bg-blue-600 text-white" : "text-slate-400",
                        hasData &&
                          !isToday &&
                          !isPadding &&
                          "text-blue-600 bg-blue-50",
                      )}
                    >
                      {cell.date.getDate()}
                    </span>

                    <div className="flex flex-col gap-0.5 overflow-hidden">
                      {cell.data?.shiftIds?.slice(0, 2).map((id, i) => (
                        <div
                          key={i}
                          className="text-[8px] leading-tight px-1 py-0.5 bg-blue-50 text-blue-700 border border-blue-100 rounded-[2px] truncate font-semibold"
                        >
                          {shifts.find((s) => s.value == id)?.label}
                        </div>
                      ))}
                      {cell.data?.shiftIds?.length > 2 && (
                        <span className="text-[8px] text-slate-400 text-center font-bold mt-0.5">
                          +{cell.data.shiftIds.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
        </div>
      </div>
    </div>
  );
}

// --- Main Form Modal ---
export default function AssignmentFormModal({
  open,
  loading,
  data,
  setData,
  employeeList = [],
  departmentList = [],
  shifts = [],
  onClose,
  onSubmit,
}) {
  const [expandedDept, setExpandedDept] = useState(new Set());
  const allEmployeeIds = useMemo(
    () => employeeList.map((e) => e.id),
    [employeeList],
  );

  const toggleDept = (id) => {
    const s = new Set(expandedDept);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpandedDept(s);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-6xl p-0 overflow-hidden border-none shadow-2xl bg-slate-50 flex flex-col h-[90vh]">
        <div className="bg-white px-8 pt-6 pb-4 border-b flex-shrink-0">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold tracking-tight text-slate-900">
              {data?.id ? "Cập nhật phân ca" : "Thiết lập lịch làm việc"}
            </DialogTitle>
            <p className="text-slate-500 text-sm">
              Tạo lịch làm việc định kỳ cho nhân sự theo chu kỳ lặp lại.
            </p>
          </DialogHeader>
        </div>

        <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
          {/* Cột trái: Form cấu hình */}
          <div className="flex-1 overflow-y-auto p-8 pt-6 space-y-6 custom-scrollbar border-r border-slate-200/60">
            {/* Section 1: Nhân sự */}
            <section className="bg-white p-5 rounded-xl border shadow-sm space-y-4">
              <div className="flex items-center gap-2 font-semibold text-slate-800 border-b pb-3">
                <Users className="w-4 h-4 text-blue-600" /> Đối tượng nhân sự
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors border border-transparent hover:border-slate-200">
                  <input
                    type="checkbox"
                    className="w-4 h-4 rounded border-slate-300 text-blue-600"
                    checked={
                      allEmployeeIds.length > 0 &&
                      data.employeeIds?.length === allEmployeeIds.length
                    }
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setData({
                        ...data,
                        departmentIds: checked
                          ? departmentList.map((d) => d.id)
                          : [],
                        employeeIds: checked ? allEmployeeIds : [],
                      });
                    }}
                  />
                  <span className="text-sm font-bold text-slate-700">
                    Tất cả nhân viên
                  </span>
                </label>

                <div className="space-y-1">
                  {departmentList.map((dept) => (
                    <div key={dept.id} className="ml-2">
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => toggleDept(dept.id)}
                          className="p-1 text-slate-400 hover:text-blue-500"
                        >
                          {expandedDept.has(dept.id) ? (
                            <ChevronDown size={16} />
                          ) : (
                            <ChevronRight size={16} />
                          )}
                        </button>
                        <label className="flex-1 flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                          <input
                            type="checkbox"
                            className="w-4 h-4 rounded border-slate-300 text-blue-600"
                            checked={data.departmentIds?.includes(dept.id)}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              const currentDept = new Set(
                                data.departmentIds || [],
                              );
                              const currentEmp = new Set(
                                data.employeeIds || [],
                              );
                              const dEmps = employeeList
                                .filter((e) => e.departmentId === dept.id)
                                .map((e) => e.id);
                              if (checked) {
                                currentDept.add(dept.id);
                                dEmps.forEach((id) => currentEmp.add(id));
                              } else {
                                currentDept.delete(dept.id);
                                dEmps.forEach((id) => currentEmp.delete(id));
                              }
                              setData({
                                ...data,
                                departmentIds: [...currentDept],
                                employeeIds: [...currentEmp],
                              });
                            }}
                          />
                          <span className="text-sm font-medium text-slate-600">
                            {dept.departmentName}
                          </span>
                        </label>
                      </div>
                      {expandedDept.has(dept.id) && (
                        <div className="ml-9 mt-1 space-y-1 border-l-2 border-slate-100 pl-4 mb-2">
                          {employeeList
                            .filter((e) => e.departmentId === dept.id)
                            .map((emp) => (
                              <label
                                key={emp.id}
                                className="flex items-center gap-3 p-1.5 text-sm text-slate-500 hover:text-blue-600 cursor-pointer"
                              >
                                <input
                                  type="checkbox"
                                  className="w-3.5 h-3.5 rounded-full border-slate-300"
                                  checked={data.employeeIds?.includes(emp.id)}
                                  onChange={(e) => {
                                    const current = new Set(
                                      data.employeeIds || [],
                                    );
                                    e.target.checked
                                      ? current.add(emp.id)
                                      : current.delete(emp.id);
                                    setData({
                                      ...data,
                                      employeeIds: [...current],
                                      departmentIds: [],
                                    });
                                  }}
                                />
                                {emp.fullName}
                              </label>
                            ))}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Section 2: Thời gian & Ca làm */}
            <section className="bg-white p-5 rounded-xl border shadow-sm space-y-5">
              <div className="flex items-center gap-2 font-semibold text-slate-800 border-b pb-3">
                <Clock className="w-4 h-4 text-blue-600" /> Cấu hình thời gian
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Từ ngày
                  </label>
                  <Input
                    type="date"
                    value={data.startDate || ""}
                    onChange={(e) =>
                      setData({ ...data, startDate: e.target.value })
                    }
                    className="h-10 border-slate-200 focus:ring-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Đến ngày
                  </label>
                  <Input
                    type="date"
                    value={data.endDate || ""}
                    onChange={(e) =>
                      setData({ ...data, endDate: e.target.value })
                    }
                    className="h-10 border-slate-200 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ca làm việc
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(data.shiftIds || []).map((id) => (
                    <span
                      key={id}
                      className="inline-flex items-center gap-1.5 bg-slate-900 text-white px-3 py-1 rounded-full text-[11px] font-medium shadow-sm"
                    >
                      {shifts.find((s) => s.value == id)?.label}
                      <button
                        onClick={() =>
                          setData({
                            ...data,
                            shiftIds: data.shiftIds.filter((x) => x !== id),
                          })
                        }
                        className="hover:text-red-400"
                      >
                        <X size={12} />
                      </button>
                    </span>
                  ))}
                </div>
                <select
                  className="w-full h-10 rounded-lg border border-slate-200 bg-slate-50 px-3 text-sm outline-none focus:border-blue-500"
                  value=""
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val && !data.shiftIds?.includes(val))
                      setData({
                        ...data,
                        shiftIds: [...(data.shiftIds || []), val],
                      });
                  }}
                >
                  <option value="">+ Thêm ca làm việc...</option>
                  {shifts
                    .filter((s) => !data.shiftIds?.includes(s.value))
                    .map((s) => (
                      <option key={s.value} value={s.value}>
                        {s.label}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Ngày áp dụng
                </label>
                <div className="grid grid-cols-7 gap-1.5">
                  {[
                    { n: 1, l: "T2" },
                    { n: 2, l: "T3" },
                    { n: 3, l: "T4" },
                    { n: 4, l: "T5" },
                    { n: 5, l: "T6" },
                    { n: 6, l: "T7" },
                    { n: 7, l: "CN" },
                  ].map((d) => {
                    const active = data.weekdays?.includes(d.n);
                    return (
                      <button
                        key={d.n}
                        type="button"
                        onClick={() => {
                          const current = data.weekdays || [];
                          setData({
                            ...data,
                            weekdays: active
                              ? current.filter((x) => x !== d.n)
                              : [...current, d.n],
                          });
                        }}
                        className={cn(
                          "h-10 rounded-lg text-xs font-bold border transition-all",
                          active
                            ? "bg-blue-600 border-blue-600 text-white shadow-md"
                            : "bg-white border-slate-200 text-slate-400 hover:border-blue-300",
                        )}
                      >
                        {d.l}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  Chu kỳ lặp
                </label>
                <div className="flex gap-2">
                  {[
                    { v: "weekly", l: "Hàng tuần" },
                    { v: "2weeks", l: "2 tuần" },
                    { v: "monthly", l: "Hàng tháng" },
                  ].map((item) => (
                    <button
                      key={item.v}
                      type="button"
                      onClick={() => setData({ ...data, repeatType: item.v })}
                      className={cn(
                        "flex-1 py-2 text-[11px] font-bold rounded-md border transition-all",
                        data.repeatType === item.v
                          ? "bg-blue-50 border-blue-200 text-blue-700 ring-1 ring-blue-200"
                          : "bg-white border-slate-200 text-slate-500",
                      )}
                    >
                      {item.l}
                    </button>
                  ))}
                </div>
              </div>
            </section>
          </div>

          {/* Cột phải: Preview */}
          <div className="w-full lg:w-[480px] bg-slate-100/40 p-6 lg:p-8 flex flex-col h-full min-h-0 overflow-hidden">
            <PreviewSchedule
              params={{
                startDate: data.startDate,
                endDate: data.endDate,
                weekdays: data.weekdays,
                repeatType: data.repeatType || "weekly",
                shiftIds: data.shiftIds,
              }}
              shifts={shifts}
            />
          </div>
        </div>

        <DialogFooter className="bg-white px-8 py-4 border-t gap-3 flex-shrink-0">
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Hủy
          </Button>
          <Button
            onClick={onSubmit}
            loading={loading}
            disabled={
              !data.startDate ||
              !data.shiftIds?.length ||
              !data.employeeIds?.length ||
              !data.weekdays?.length
            }
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 rounded-lg h-10 font-bold transition-all active:scale-95"
          >
            Lưu lịch phân ca
          </Button>
        </DialogFooter>
      </DialogContent>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 5px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #cbd5e1;
          border-radius: 10px;
        }
      `}</style>
    </Dialog>
  );
}
