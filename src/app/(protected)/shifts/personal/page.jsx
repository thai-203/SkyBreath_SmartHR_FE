"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import { useToast } from "@/components/common/Toast";
import {
  holidayService,
  shiftAssignmentsService,
  userService,
} from "@/services";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  CalendarCheck,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

// --- Constants & Config ---
const VIEW_MODE = { WEEK: "week", MONTH: "month" };

const SHIFT_COLORS = [
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
];

const WEEKDAY_LABELS = [
  "Thứ 2",
  "Thứ 3",
  "Thứ 4",
  "Thứ 5",
  "Thứ 6",
  "Thứ 7",
  "Chủ Nhật",
];

// --- Utilities ---
const isValidDate = (d) => d instanceof Date && !isNaN(d.getTime());

const formatYmd = (date) => {
  if (!isValidDate(date)) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
};

const parseYmd = (ymd) => {
  if (!ymd) return null;
  const d = new Date(`${ymd}T00:00:00`);
  return isValidDate(d) ? d : null;
};

const getScheduleDateKey = (item) => {
  const candidate = item?.workDate ?? item?.date;
  if (!candidate) return "";

  if (typeof candidate === "string") {
    const match = candidate.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  return formatYmd(new Date(candidate));
};

// Tính toán dải ngày để lấp đầy lưới 7 cột
const getCalendarRange = (anchor, mode) => {
  const date = isValidDate(anchor) ? new Date(anchor) : new Date();
  if (mode === VIEW_MODE.WEEK) {
    const day = date.getDay();
    const diff = (day + 6) % 7;
    const start = new Date(date);
    start.setDate(date.getDate() - diff);
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return { start, end };
  } else {
    // Lấy ngày đầu tháng
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    // Lùi về Thứ 2 của tuần chứa ngày đầu tháng
    const startDiff = (firstOfMonth.getDay() + 6) % 7;
    const start = new Date(firstOfMonth);
    start.setDate(firstOfMonth.getDate() - startDiff);
    // Lấy ngày cuối tháng
    const lastOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
    // Tiến đến Chủ nhật của tuần chứa ngày cuối tháng
    const endDiff = lastOfMonth.getDay() === 0 ? 0 : 7 - lastOfMonth.getDay();
    const end = new Date(lastOfMonth);
    end.setDate(lastOfMonth.getDate() + endDiff);
    return { start, end };
  }
};

export default function PersonalSchedulePage() {
  const { error: toastError } = useToast();

  const [employeeId, setEmployeeId] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODE.MONTH);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [schedule, setSchedule] = useState([]);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

  // Detail Modal State
  const [selectedDayInfo, setSelectedDayInfo] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const range = useMemo(
    () => getCalendarRange(anchorDate, viewMode),
    [anchorDate, viewMode],
  );

  const rangeDays = useMemo(() => {
    const days = [];
    let cur = new Date(range.start);
    while (cur <= range.end) {
      days.push(new Date(cur));
      cur.setDate(cur.getDate() + 1);
    }
    return days;
  }, [range]);

  useEffect(() => {
    const initProfile = async () => {
      try {
        const res = await userService.getProfile();
        const data = res?.data || res;
        let id = Number(data?.employeeId || data?.employee?.id || 0);
        if (id > 0) setEmployeeId(id);
        else toastError("Tài khoản chưa liên kết hồ sơ nhân viên");
      } catch {
        toastError("Không thể xác thực thông tin nhân viên");
      } finally {
        setIsReady(true);
      }
    };
    initProfile();
  }, [toastError]);

  const fetchData = useCallback(async () => {
    if (!employeeId || !isReady) return;
    const startYmd = formatYmd(range.start);
    const endYmd = formatYmd(range.end);
    setLoading(true);
    try {
      const [scheduleRes, holidayRes] = await Promise.all([
        shiftAssignmentsService.getEmployeeSchedule(
          employeeId,
          startYmd,
          endYmd,
        ),
        holidayService.findAll({ startDate: startYmd, endDate: endYmd }),
      ]);

      setSchedule(
        Array.isArray(scheduleRes?.data)
          ? scheduleRes.data
          : Array.isArray(scheduleRes)
            ? scheduleRes
            : [],
      );
      setHolidays(holidayRes?.data || []);
    } catch {
      toastError("Lỗi khi tải dữ liệu lịch");
    } finally {
      setLoading(false);
    }
  }, [employeeId, range, isReady, toastError]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Process holidays and compensatory days
  const processedHolidays = useMemo(() => {
    const map = {};
    holidays.forEach((h) => {
      // Holiday range
      if (h.startDate && h.endDate) {
        let cur = new Date(h.startDate);
        const end = new Date(h.endDate);
        while (cur <= end) {
          const key = formatYmd(cur);
          if (!map[key]) map[key] = { items: [] };
          map[key].items.push({ type: "HOLIDAY", data: h });
          cur.setDate(cur.getDate() + 1);
        }
      }
      // Compensatory days
      h.compensatoryDays?.forEach((cw) => {
        if (!cw.date) return;
        const key = formatYmd(new Date(cw.date));
        if (!map[key]) map[key] = { items: [] };
        map[key].items.push({ type: "COMPENSATORY", data: h, details: cw });
      });
    });
    return map;
  }, [holidays]);

  const groupedData = useMemo(() => {
    return schedule.reduce((acc, item) => {
      const key = getScheduleDateKey(item);
      if (key) {
        if (!acc[key]) acc[key] = [];
        acc[key].push(item);
      }
      return acc;
    }, {});
  }, [schedule]);

  const handleDayClick = (date) => {
    const ymd = formatYmd(date);
    const dayHolidays = processedHolidays[ymd]?.items || [];
    const dayShifts = groupedData[ymd] || [];

    if (dayHolidays.length > 0 || dayShifts.length > 0) {
      setSelectedDayInfo({ date, holidays: dayHolidays, shifts: dayShifts });
      setIsModalOpen(true);
    }
  };

  const renderBadges = (date) => {
    const ymd = formatYmd(date);
    const shifts = groupedData[ymd] || [];
    const hInfo = processedHolidays[ymd]?.items || [];

    return (
      <div className="flex flex-col gap-1 mt-1">
        {/* Holidays */}
        {hInfo.map((h, i) => (
          <div
            key={`h-${i}`}
            className={`px-2 py-1 rounded-lg border text-[10px] font-bold truncate flex items-center gap-1
              ${h.type === "HOLIDAY" ? "bg-indigo-50 text-indigo-700 border-indigo-200" : "bg-amber-50 text-amber-700 border-amber-200"}
            `}
          >
            {h.type === "HOLIDAY" ? (
              <CalendarDays className="w-2.5 h-2.5" />
            ) : (
              <RefreshCw className="w-2.5 h-2.5" />
            )}
            {h.data.holidayName}
          </div>
        ))}

        {/* Shifts */}
        {shifts.map((item, idx) => (
          <div
            key={`s-${idx}`}
            className={`px-2 py-1 rounded-lg border text-[10px] font-medium truncate ${SHIFT_COLORS[idx % SHIFT_COLORS.length]}`}
          >
            {item.shift?.shiftName || "Ca làm"}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="relative isolate overflow-hidden">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[520px] bg-[radial-gradient(circle_at_0%_0%,rgba(14,116,144,0.18),transparent_55%),radial-gradient(circle_at_100%_20%,rgba(2,132,199,0.12),transparent_45%),linear-gradient(180deg,#f7fbff_0%,#f4f8ff_35%,#ffffff_100%)]" />

      <div className="max-w-7xl mx-auto space-y-6 px-3 py-4 md:px-6 md:py-8 pb-20">
        <PageTitle title="Lịch làm việc cá nhân" />

        <section className="rounded-3xl border border-cyan-100/80 bg-white/90 backdrop-blur p-5 md:p-7 shadow-[0_18px_45px_-28px_rgba(14,116,144,0.6)]">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="space-y-2">
              <p className="text-xs font-black uppercase tracking-[0.26em] text-cyan-600">
                SmartHR Calendar
              </p>
              <h2 className="text-2xl md:text-3xl font-black text-slate-900 leading-tight">
                {anchorDate.toLocaleDateString("vi-VN", {
                  month: "long",
                  year: "numeric",
                })}
              </h2>
              <p className="text-sm md:text-base text-slate-600 max-w-2xl">
                Theo dõi nhanh các ca làm, ngày lễ và lịch làm bù của bạn trong
                cùng một giao diện trực quan.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 w-full lg:w-auto">
              <Card className="border-cyan-100 bg-cyan-50/70 shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
                    Số ca làm
                  </p>
                  <p className="text-2xl font-black text-cyan-700 leading-none mt-2">
                    {schedule.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-indigo-100 bg-indigo-50/70 shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
                    Lễ trong kỳ
                  </p>
                  <p className="text-2xl font-black text-indigo-700 leading-none mt-2">
                    {holidays.length}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-amber-100 bg-amber-50/70 shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
                    Ngày làm bù
                  </p>
                  <p className="text-2xl font-black text-amber-700 leading-none mt-2">
                    {holidays.reduce(
                      (acc, h) => acc + (h.compensatoryDays?.length || 0),
                      0,
                    )}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-slate-200 bg-slate-50/70 shadow-none">
                <CardContent className="p-4">
                  <p className="text-[10px] uppercase text-slate-500 font-black tracking-widest">
                    Chế độ xem
                  </p>
                  <p className="text-2xl font-black text-slate-800 leading-none mt-2">
                    {viewMode === VIEW_MODE.WEEK ? "Tuần" : "Tháng"}
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <Card className="border border-slate-200/80 shadow-[0_26px_60px_-32px_rgba(15,23,42,0.45)] overflow-hidden bg-white rounded-3xl">
          <CardHeader className="space-y-4 p-5 md:p-6 border-b bg-[linear-gradient(110deg,rgba(248,250,252,0.96),rgba(255,255,255,1),rgba(236,253,255,0.45))]">
            <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4">
              <CardTitle className="text-lg md:text-xl font-black flex items-center gap-3 text-slate-900">
                <div className="p-2.5 bg-cyan-600 rounded-xl text-white shadow-lg shadow-cyan-600/25">
                  <CalendarDays className="w-5 h-5" />
                </div>
                <div>
                  <span className="block uppercase tracking-tight">
                    {anchorDate.toLocaleDateString("vi-VN", {
                      month: "long",
                      year: "numeric",
                    })}
                  </span>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-[0.22em]">
                    Lịch trực quan cá nhân
                  </span>
                </div>
              </CardTitle>

              <div className="flex bg-slate-100/90 p-1 rounded-xl border border-slate-200/70">
                {Object.values(VIEW_MODE).map((m) => (
                  <Button
                    key={m}
                    variant={viewMode === m ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setViewMode(m)}
                    className={`h-9 capitalize px-6 rounded-lg transition-all ${viewMode === m ? "bg-slate-900 text-white shadow-md font-bold" : "text-slate-500 hover:text-slate-900"}`}
                  >
                    {m === "week" ? "Tuần" : "Tháng"}
                  </Button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-sm">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-slate-100"
                  onClick={() =>
                    setAnchorDate((prev) => {
                      const next = new Date(prev);
                      if (viewMode === VIEW_MODE.WEEK) {
                        next.setDate(next.getDate() - 7);
                      } else {
                        next.setMonth(next.getMonth() - 1);
                      }
                      return next;
                    })
                  }
                >
                  <ChevronLeft className="w-5 h-5 text-slate-600" />
                </Button>
                <Input
                  type={viewMode === VIEW_MODE.WEEK ? "date" : "month"}
                  className="h-9 border-none bg-transparent w-[180px] min-w-[180px] focus-visible:ring-0 text-sm font-bold text-slate-700 text-center cursor-pointer appearance-none"
                  value={
                    viewMode === VIEW_MODE.WEEK
                      ? formatYmd(anchorDate)
                      : `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, "0")}`
                  }
                  onChange={(e) => {
                    const val = e.target.value;
                    if (!val) return;
                    setAnchorDate(
                      parseYmd(
                        viewMode === VIEW_MODE.WEEK ? val : `${val}-01`,
                      ) || new Date(),
                    );
                  }}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-9 w-9 hover:bg-slate-100"
                  onClick={() =>
                    setAnchorDate((prev) => {
                      const next = new Date(prev);
                      if (viewMode === VIEW_MODE.WEEK) {
                        next.setDate(next.getDate() + 7);
                      } else {
                        next.setMonth(next.getMonth() + 1);
                      }
                      return next;
                    })
                  }
                >
                  <ChevronRight className="w-5 h-5 text-slate-600" />
                </Button>
              </div>

              <Button
                variant="outline"
                size="sm"
                className="h-10 px-4 rounded-xl font-bold border-slate-300 bg-white hover:bg-slate-50"
                onClick={() => setAnchorDate(new Date())}
              >
                Hôm nay
              </Button>

              <Button
                size="sm"
                onClick={fetchData}
                disabled={loading}
                className="h-10 px-4 rounded-xl gap-2 font-bold bg-cyan-600 hover:bg-cyan-700 text-white shadow-lg shadow-cyan-600/25"
              >
                <RefreshCw
                  className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                />
                Cập nhật dữ liệu
              </Button>

              <div className="ml-auto hidden md:flex items-center gap-4 text-xs font-semibold text-slate-500">
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" /> Ngày
                  lễ
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500" /> Làm
                  bù
                </span>
                <span className="inline-flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-500" /> Hôm
                  nay
                </span>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <div className="min-w-[780px]">
                <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/90">
                  {WEEKDAY_LABELS.map((day) => (
                    <div
                      key={day}
                      className="py-3 text-center text-[11px] font-black text-slate-500 uppercase tracking-[0.18em]"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                <div className="grid grid-cols-7 bg-slate-200 gap-px">
                  {rangeDays.map((date, idx) => {
                    const isToday = formatYmd(date) === formatYmd(new Date());
                    const isCurrentMonth =
                      date.getMonth() === anchorDate.getMonth();
                    const ymd = formatYmd(date);
                    const shifts = groupedData[ymd] || [];
                    const hItems = processedHolidays[ymd]?.items || [];
                    const isHoliday = hItems.some((i) => i.type === "HOLIDAY");
                    const isCompensatory = hItems.some(
                      (i) => i.type === "COMPENSATORY",
                    );

                    return (
                      <div
                        key={idx}
                        onClick={() => handleDayClick(date)}
                        className={`min-h-[148px] p-3 transition-all cursor-pointer group relative
                          ${isCurrentMonth ? "bg-white" : "bg-slate-50/70 text-slate-300"}
                          ${isHoliday ? "ring-1 ring-inset ring-rose-200 bg-rose-50/35" : ""}
                          ${isCompensatory ? "ring-1 ring-inset ring-amber-200 bg-amber-50/35" : ""}
                          hover:z-10 hover:shadow-xl hover:bg-white
                        `}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <span
                            className={`text-[13px] font-black w-8 h-8 flex items-center justify-center rounded-xl transition-all
                              ${isToday ? "bg-cyan-600 text-white shadow-md shadow-cyan-600/30" : ""}
                              ${!isToday && isHoliday ? "bg-rose-100 text-rose-700" : ""}
                              ${!isToday && !isHoliday && isCompensatory ? "bg-amber-100 text-amber-700" : ""}
                              ${!isToday && !isHoliday && !isCompensatory ? "bg-slate-100 text-slate-700 group-hover:bg-cyan-50 group-hover:text-cyan-700" : ""}
                            `}
                          >
                            {date.getDate()}
                          </span>

                          <div className="flex flex-col items-end gap-1">
                            {isHoliday && (
                              <span className="text-[9px] font-black text-rose-600 uppercase tracking-wider bg-rose-100 px-1.5 py-0.5 rounded-md">
                                Ngày lễ
                              </span>
                            )}
                            {isCompensatory && (
                              <span className="text-[9px] font-black text-amber-700 uppercase tracking-wider bg-amber-100 px-1.5 py-0.5 rounded-md">
                                Làm bù
                              </span>
                            )}
                          </div>
                        </div>

                        {renderBadges(date)}

                        {!shifts.length && !hItems.length && isCurrentMonth && (
                          <div className="mt-3">
                            <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100 py-1 px-2 rounded-lg inline-block">
                              Nghỉ
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Holiday & Shift Detail Modal */}
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
                  Chi tiết lịch làm việc & Ngày nghỉ
                </p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {/* Display Holidays/Compensatory */}
            {selectedDayInfo?.holidays.map((h, i) => (
              <div
                key={i}
                className={`p-4 rounded-2xl border flex flex-col gap-2 transition-all ${h.type === "HOLIDAY" ? "bg-indigo-50/35 border-indigo-100 shadow-sm" : "bg-amber-50/35 border-amber-100 shadow-sm"}`}
              >
                <div className="flex items-center justify-between">
                  <span
                    className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${h.type === "HOLIDAY" ? "bg-indigo-600 text-white" : "bg-amber-600 text-white"}`}
                  >
                    {h.type === "HOLIDAY" ? (
                      <CalendarDays className="w-3 h-3" />
                    ) : (
                      <RefreshCw className="w-3 h-3" />
                    )}
                    {h.type === "HOLIDAY" ? "Ngày nghỉ lễ" : "Ngày làm làm bù"}
                  </span>
                  {h.data.isPaidHoliday && (
                    <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">
                      Có lương
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black text-slate-800 leading-tight mt-1">
                  {h.data.holidayName}
                </h3>
                <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                  {h.type === "COMPENSATORY" && h.details?.note
                    ? h.details.note
                    : h.data.description ||
                      "Ngày nghỉ theo quy định của hệ thống."}
                </p>
                {h.type === "COMPENSATORY" && h.details?.replacesDate && (
                  <div className="text-xs font-bold text-amber-700 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200 mt-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>
                      Thay thế cho ngày nghỉ:{" "}
                      <span className="underline decoration-amber-300 decoration-2 underline-offset-2">
                        {new Date(h.details.replacesDate).toLocaleDateString(
                          "vi-VN",
                          { weekday: "long", day: "numeric", month: "long" },
                        )}
                      </span>
                    </span>
                  </div>
                )}
              </div>
            ))}

            {/* Display Shifts */}
            {selectedDayInfo?.shifts.length > 0 && (
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <CalendarCheck className="w-4 h-4" /> Ca làm việc được phân
                </h4>
                {selectedDayInfo.shifts.map((s, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between p-4 bg-slate-50/80 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-primary">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">
                          {s.shift?.shiftName || "Ca hành chính"}
                        </p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">
                          Mã: {s.shift?.shiftCode || "STD"}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
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
