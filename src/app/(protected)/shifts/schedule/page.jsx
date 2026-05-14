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
  requestsService,
  holidayService,
} from "@/services";
import {
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  RefreshCw,
  Users,
  CalendarDays,
  Clock,
  Info,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

const SHIFT_COLORS = {
  "Ca sáng": "bg-emerald-100 text-emerald-700 border-emerald-200",
  "Ca chiều": "bg-blue-100 text-blue-700 border-blue-200",
  "Ca đêm": "bg-purple-100 text-purple-700 border-purple-200",
  default: "bg-slate-100 text-slate-700 border-slate-200",
};

const OVERTIME_COLOR = "bg-orange-100 text-orange-700 border-orange-200";

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
  const [overtimeData, setOvertimeData] = useState([]);
  const [holidaysData, setHolidaysData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [debugInfo, setDebugInfo] = useState("");
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

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

      const [scheduleRes, overtimeRes, holidayRes] = await Promise.all([
        shiftAssignmentsService.getSchedules(params),
        requestsService.getOvertimeDetailRequests({
          month: sd.getMonth() + 1,
          year: sd.getFullYear(),
          ...(filterDept && { departmentId: filterDept }),
          ...(keyword && { search: keyword }),
          status: "APPROVED",
          viewAll: true, // Allow viewing all employees' overtime for schedule
          page: 1,
          limit: 1000,
        }),
        holidayService.findAll({
          startDate: formatYmd(sd),
          endDate: formatYmd(ed),
          limit: 1000,
        }),
      ]);

      console.log("Schedule Response:", scheduleRes);
      console.log("Overtime Response:", overtimeRes);

      setSchedule(scheduleRes.data || []);
      // Xử lý cấu trúc trả về từ API
      const overtimeItems =
        overtimeRes?.data?.items || overtimeRes?.items || [];
      console.log("Overtime Data Set:", overtimeItems);
      setOvertimeData(overtimeItems);
      setHolidaysData(holidayRes?.data || []);
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

  // Handle day click to show full day details
  const handleDayClick = (date, employeeId, employeeName, employeeCode) => {
    const ymd = formatYmd(date);
    const dayShifts = schedule.filter(
      (s) => s.employee?.id === employeeId && s.date === ymd,
    );
    const dayOvertimes = overtimeData.filter(
      (ot) =>
        (ot?.request?.employeeId ?? ot?.request?.employee?.id) === employeeId &&
        ot.workDate === ymd,
    );
    const dayHolidays = holidaysData.filter(
      (h) => h.startDate <= ymd && h.endDate >= ymd,
    );

    setSelectedDayInfo({
      date,
      employeeName,
      employeeCode,
      employeeId,
      shifts: dayShifts,
      overtimes: dayOvertimes,
      holidays: dayHolidays,
    });
    setIsModalOpen(true);
  };

  const renderTable = () => {
    const sd = parseYmd(startDate);
    if (!sd) return null;
    const days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sd);
      d.setDate(sd.getDate() + i);
      return d;
    });

    // Tổ chức dữ liệu tăng ca theo nhân viên và ngày
    // Dữ liệu sẽ được lọc trực tiếp khi render
    const byEmp = schedule.reduce((acc, a) => {
      const name = a.employee?.fullName || "(không tên)";
      const code = a.employee?.employeeCode || "";
      const empId = a.employee?.id;
      const key = `${code}-${name}`;
      if (!acc[key]) acc[key] = { name, code, employeeId: empId, items: [] };
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

                    // Lấy dữ liệu tăng ca cho ngày này
                    const overtimes = overtimeData.filter(
                      (ot) =>
                        (ot?.request?.employeeId ??
                          ot?.request?.employee?.id) === row.employeeId &&
                        ot.workDate === str,
                    );
                    console.log(
                      `Employee ${row.employeeId} - Date ${str}:`,
                      overtimes.length,
                      "overtime records",
                    );

                    return (
                      <td
                        key={str}
                        className="border-b border-r p-2 text-center align-middle cursor-pointer hover:bg-blue-50 transition-colors"
                        onClick={() =>
                          handleDayClick(
                            date,
                            row.employeeId,
                            row.name,
                            row.code,
                          )
                        }
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
                          {overtimes.map((ot, idx) => (
                            <div
                              key={`ot-${idx}`}
                              className={`px-2 py-1 rounded text-[10px] font-bold border ${OVERTIME_COLOR} hover:shadow-md transition-shadow`}
                            >
                              <div className="truncate">
                                OT {ot.totalHours}h
                              </div>
                            </div>
                          ))}
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
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-slate-400" />
              <CardTitle className="text-sm font-semibold uppercase tracking-wider text-slate-500">
                Bộ lọc nâng cao
              </CardTitle>
            </div>
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

      {debugInfo && (
        <div className="bg-white rounded-xl shadow-md border p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-slate-700">
              Debug Info - API Response
            </h3>
            <button
              onClick={() => setDebugInfo("")}
              className="text-xs px-2 py-1 bg-red-100 text-red-600 rounded hover:bg-red-200"
            >
              ✕ Clear
            </button>
          </div>
          <pre className="bg-slate-100 p-3 rounded text-[10px] overflow-auto max-h-40">
            {debugInfo}
          </pre>
        </div>
      )}

      <div className="text-xs text-slate-500 p-2">
        <p>
          Schedule items: {schedule.length} | Overtime items:{" "}
          {overtimeData.length}
        </p>
      </div>

      {/* MODAL CHI TIẾT NGÀY HÔM ĐÓ */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-lg bg-white rounded-3xl p-0 overflow-hidden border border-slate-200 shadow-2xl">
          <DialogHeader className="p-6 bg-[linear-gradient(140deg,rgba(248,250,252,0.95),rgba(236,253,255,0.6))] border-b border-slate-100">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-cyan-600 text-white rounded-xl shadow-lg shadow-cyan-600/25">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-800 tracking-tight">
                  {selectedDayInfo?.date?.toLocaleDateString("vi-VN", {
                    weekday: "long",
                    day: "numeric",
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <p className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wider">
                  Chi tiết lịch làm việc, tăng ca & Ngày nghỉ
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Nhân viên */}
            {selectedDayInfo && (
              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  Thông tin nhân viên
                </p>
                <p className="text-sm font-bold text-slate-900 mt-2">
                  {selectedDayInfo.employeeName}
                </p>
                <p className="text-xs text-slate-500 font-mono">
                  Mã: {selectedDayInfo.employeeCode}
                </p>
              </div>
            )}

            {/* Holidays */}
            {selectedDayInfo?.holidays &&
              selectedDayInfo.holidays.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <CalendarDays className="w-4 h-4" /> Ngày nghỉ & Làm bù
                  </h4>
                  {selectedDayInfo.holidays.map((h, i) => (
                    <div
                      key={i}
                      className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${
                        h.holidayType === "PAID"
                          ? "bg-indigo-50/35 border-indigo-100 shadow-sm"
                          : "bg-amber-50/35 border-amber-100 shadow-sm"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span
                          className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${
                            h.holidayType === "PAID"
                              ? "bg-indigo-600 text-white"
                              : "bg-amber-600 text-white"
                          }`}
                        >
                          {h.holidayType === "COMPENSATORY" ? (
                            <RefreshCw className="w-3 h-3" />
                          ) : (
                            <CalendarDays className="w-3 h-3" />
                          )}
                          {h.holidayType === "COMPENSATORY"
                            ? "Ngày làm bù"
                            : "Ngày nghỉ lễ"}
                        </span>
                      </div>
                      <h3 className="text-base font-black text-slate-800 leading-tight mt-1">
                        {h.holidayName}
                      </h3>
                      {h.description && (
                        <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                          {h.description}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {/* Shifts */}
            {selectedDayInfo?.shifts && selectedDayInfo.shifts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <Info className="w-4 h-4" /> Ca làm việc được phân
                </h4>
                {selectedDayInfo.shifts.map((shift, idx) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-primary">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {shift.shift?.shiftName || "Ca làm"}
                        </p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                          Mã: {shift.shift?.shiftCode || "—"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Overtimes */}
            {selectedDayInfo?.overtimes &&
              selectedDayInfo.overtimes.length > 0 && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Lịch tăng ca
                  </h4>
                  {selectedDayInfo.overtimes.map((ot, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-3 p-4 bg-amber-50/70 rounded-2xl border border-amber-100 hover:bg-white hover:shadow-md transition-all"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="p-2 bg-white rounded-xl shadow-sm border border-amber-100 text-amber-600">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div className="min-w-0">
                          <p className="text-sm font-black text-slate-800 truncate">
                            Tăng ca {ot.totalHours} giờ
                          </p>
                          <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                            {ot.startTime?.substring(0, 5)} -{" "}
                            {ot.endTime?.substring(0, 5)} · {ot.rateMultiplier}x
                            lương
                          </p>
                        </div>
                      </div>
                      {ot.overtimeAmount && (
                        <div className="text-right flex-shrink-0">
                          <p className="text-xs text-slate-500 font-semibold">
                            Tiền OT
                          </p>
                          <p className="font-black text-green-700">
                            {Number(ot.overtimeAmount).toLocaleString("vi-VN")}
                            <span className="text-xs ml-1">₫</span>
                          </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

            {selectedDayInfo?.shifts?.length === 0 &&
              selectedDayInfo?.overtimes?.length === 0 && (
                <div className="text-center py-8 text-slate-500">
                  <p className="text-sm">Không có dữ liệu cho ngày này</p>
                </div>
              )}
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
            <Button
              onClick={() => setIsModalOpen(false)}
              className="w-full h-11 rounded-2xl font-black uppercase tracking-widest bg-slate-900 hover:bg-slate-800 text-white shadow-lg shadow-slate-900/25"
            >
              Đóng chi tiết
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
