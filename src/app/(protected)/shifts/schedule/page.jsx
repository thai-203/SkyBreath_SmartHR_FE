"use client";

import { useState, useEffect, useCallback } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useToast } from "@/components/common/Toast";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import {
  departmentsService,
  shiftAssignmentsService,
  workingShiftsService,
} from "@/services";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Users,
  CalendarDays,
} from "lucide-react";

const SHIFT_COLORS = {
  "Ca sáng": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Ca chiều": "bg-blue-100 text-blue-700 border-blue-200",
  "Ca đêm": "bg-purple-100 text-purple-700 border-purple-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

const isValidDate = (date) =>
  date instanceof Date && !Number.isNaN(date.getTime());

const formatYmd = (date) => {
  if (!isValidDate(date)) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const parseYmd = (value) => {
  if (!value) return null;
  const date =
    value instanceof Date ? new Date(value) : new Date(`${value}T00:00:00`);
  return isValidDate(date) ? date : null;
};

export default function SchedulePage() {
  const { error } = useToast();

  const getMonday = (date) => {
    const d = parseYmd(date);
    if (!d) return "";
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(d);
    monday.setDate(diff);
    return formatYmd(monday);
  };

  // States
  const [departments, setDepartments] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [filterDept, setFilterDept] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState(() => getMonday(new Date()));
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch options ban đầu
  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [deptRes, shiftRes] = await Promise.all([
          departmentsService.getList(),
          workingShiftsService.getList(),
        ]);
        setDepartments(
          (deptRes.data || []).map((d) => ({
            value: d.id,
            label: d.departmentName,
          })),
        );
        setShiftOptions(
          (shiftRes.data || []).map((s) => ({
            value: s.id,
            label: s.shiftName,
          })),
        );
      } catch (err) {
        console.error("Lỗi fetch options:", err);
      }
    };
    fetchOptions();
  }, []);

  // Fetch dữ liệu lịch
  const fetchSchedule = useCallback(async () => {
    setLoading(true);
    try {
      const sd = parseYmd(startDate);
      if (!sd) {
        throw new Error("Ngày bắt đầu không hợp lệ");
      }
      const ed = new Date(sd);
      ed.setDate(sd.getDate() + 6);

      const params = {
        startDate: formatYmd(sd),
        endDate: formatYmd(ed),
        ...(filterDept && { departmentId: filterDept }),
        ...(filterShift && { shiftId: filterShift }),
        ...(keyword && { keyword }),
      };

      const res = await shiftAssignmentsService.getSchedules(params);
      setSchedule(res.data || []);
    } catch (err) {
      error(err.response?.data?.message || "Lỗi tải lịch");
    } finally {
      setLoading(false);
    }
  }, [startDate, filterDept, filterShift, keyword, error]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

  // Xử lý khi thay đổi ngày ở bộ lọc
  const handleDateChange = (e) => {
    const selectedDate = e.target.value;
    if (selectedDate) {
      setStartDate(getMonday(selectedDate));
    }
  };

  // Xử lý chuyển tuần
  const changeWeek = (offsetDays) => {
    const current = parseYmd(startDate);
    if (!current) return;
    current.setDate(current.getDate() + offsetDays);
    setStartDate(formatYmd(current));
  };

  const renderTable = () => {
    const sd = parseYmd(startDate);
    if (!sd) return null;
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sd);
      d.setDate(sd.getDate() + i);
      return d;
    });

    const byEmp = schedule.reduce((acc, a) => {
      const name = a.employee?.fullName || "(không tên)";
      const code = a.employee?.employeeCode || "";
      const key = `${code}-${name}`;
      if (!acc[key]) acc[key] = { name, code, items: [] };
      acc[key].items.push(a);
      return acc;
    }, {});

    const rows = Object.values(byEmp);

    return (
      <div className="relative overflow-x-auto border rounded-xl shadow-inner bg-slate-50">
        {/* THANH ĐIỀU HƯỚNG TRONG BẢNG */}
        <div className="flex flex-wrap items-center justify-between p-4 bg-white border-b sticky left-0 z-20 gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek(-7)}
              className="h-9 px-3"
            >
              <ChevronLeft className="h-4 w-4 mr-1" /> Tuần trước
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => changeWeek(7)}
              className="h-9 px-3"
            >
              Tuần sau <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setStartDate(getMonday(new Date()))}
              className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
            >
              Về tuần hiện tại
            </Button>
          </div>

          <div className="flex items-center gap-2 px-4 py-1.5 bg-blue-50 border border-blue-100 rounded-full">
            <CalendarDays className="h-4 w-4 text-blue-600" />
            <span className="text-sm font-bold text-blue-700">
              {new Date(days[0]).toLocaleDateString("vi-VN")} -{" "}
              {new Date(days[6]).toLocaleDateString("vi-VN")}
            </span>
          </div>
        </div>

        <table className="w-full border-collapse bg-white">
          <thead>
            <tr className="bg-slate-50/80 backdrop-blur-sm">
              <th className="sticky left-0 z-10 border-b border-r bg-slate-100 p-4 text-left font-bold text-slate-700 min-w-[200px]">
                Nhân viên
              </th>
              {days.map((date) => {
                const isToday =
                  new Date().toDateString() === date.toDateString();
                return (
                  <th
                    key={formatYmd(date)}
                    className={`border-b border-r p-3 text-center min-w-[120px] ${isToday ? "bg-blue-50" : ""}`}
                  >
                    <span className="text-xs uppercase text-slate-500 block">
                      Thứ {date.getDay() === 0 ? "CN" : date.getDay() + 1}
                    </span>
                    <span
                      className={`text-sm font-bold ${isToday ? "text-blue-600" : "text-slate-700"}`}
                    >
                      {`${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`}
                    </span>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {rows.length > 0 ? (
              rows.map((row) => (
                <tr
                  key={row.code + row.name}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="sticky left-0 z-10 border-b border-r bg-white p-4 font-medium shadow-[2px_0_5px_rgba(0,0,0,0.05)]">
                    <div className="flex flex-col">
                      <span className="text-slate-900">{row.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono tracking-tighter uppercase">
                        {row.code}
                      </span>
                    </div>
                  </td>
                  {days.map((date) => {
                    const str = formatYmd(date);
                    const assignments = row.items.filter((a) => a.date === str);
                    return (
                      <td
                        key={str}
                        className="border-b border-r p-2 text-center align-middle"
                      >
                        <div className="flex flex-col gap-1">
                          {assignments.map((a, idx) => {
                            const colorClass =
                              SHIFT_COLORS[a.shift?.shiftName] ||
                              SHIFT_COLORS.default;
                            return (
                              <span
                                key={idx}
                                className={`px-2 py-1 rounded text-[10px] font-bold border ${colorClass} truncate`}
                              >
                                {a.shift?.shiftName}
                              </span>
                            );
                          })}
                        </div>
                      </td>
                    );
                  })}
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan={8}
                  className="p-10 text-center text-slate-400 italic"
                >
                  Không có dữ liệu lịch làm việc
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-3 bg-slate-50/30 min-h-screen">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <PageTitle title="Bảng Lịch Công Tác" />
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="border-b bg-white/50 pb-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-slate-400" />
            <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
              Bộ lọc nâng cao
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Phòng ban
              </label>
              <select
                value={filterDept}
                onChange={(e) => setFilterDept(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Tất cả phòng ban</option>
                {departments.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Ca làm việc
              </label>
              <select
                value={filterShift}
                onChange={(e) => setFilterShift(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm bg-slate-50 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
              >
                <option value="">Tất cả các ca</option>
                {shiftOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Chọn tuần
              </label>
              <Input
                type="date"
                value={startDate}
                onChange={handleDateChange}
                className="bg-slate-50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-500 ml-1">
                Tìm kiếm
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                <Input
                  type="text"
                  placeholder="Tên hoặc mã NV..."
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                  className="pl-9 bg-slate-50"
                />
              </div>
            </div>

            <div className="flex items-end">
              <Button
                onClick={fetchSchedule}
                disabled={loading}
                className="w-full gap-2 shadow-lg shadow-blue-200"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Cập nhật
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-white rounded-xl shadow-md border overflow-hidden">
        <div className="p-4 border-b flex items-center gap-2 bg-slate-50/50">
          <Users className="h-5 w-5 text-blue-500" />
          <h3 className="font-bold text-slate-700 text-sm">
            Chi tiết lịch phân ca
          </h3>
        </div>
        <div className="p-0">{renderTable()}</div>
      </div>
    </div>
  );
}
