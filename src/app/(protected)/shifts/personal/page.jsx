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
import { Skeleton } from "@/components/common/Skeleton";
import { useToast } from "@/components/common/Toast";
import { shiftAssignmentsService, userService } from "@/services";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
} from "lucide-react";

// --- Constants & Config ---
const VIEW_MODE = { WEEK: "week", MONTH: "month" };

const SHIFT_COLORS = [
  "bg-emerald-50 text-emerald-700 border-emerald-200",
  "bg-sky-50 text-sky-700 border-sky-200",
  "bg-amber-50 text-amber-700 border-amber-200",
  "bg-rose-50 text-rose-700 border-rose-200",
  "bg-indigo-50 text-indigo-700 border-indigo-200",
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
  const { error } = useToast();

  const [employeeId, setEmployeeId] = useState(null);
  const [viewMode, setViewMode] = useState(VIEW_MODE.MONTH);
  const [anchorDate, setAnchorDate] = useState(() => new Date());
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [isReady, setIsReady] = useState(false);

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
        else error("Tài khoản chưa liên kết hồ sơ nhân viên");
      } catch {
        error("Không thể xác thực thông tin nhân viên");
      } finally {
        setIsReady(true);
      }
    };
    initProfile();
  }, [error]);

  const fetchSchedule = useCallback(async () => {
    if (!employeeId || !isReady) return;
    const startYmd = formatYmd(range.start);
    const endYmd = formatYmd(range.end);
    setLoading(true);
    try {
      const res = await shiftAssignmentsService.getEmployeeSchedule(
        employeeId,
        startYmd,
        endYmd,
      );
      setSchedule(
        Array.isArray(res?.data) ? res.data : Array.isArray(res) ? res : [],
      );
    } catch {
      error("Lỗi khi tải lịch làm việc");
    } finally {
      setLoading(false);
    }
  }, [employeeId, range, isReady, error]);

  useEffect(() => {
    fetchSchedule();
  }, [fetchSchedule]);

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

  const visibleDateKeys = useMemo(() => {
    const keys = rangeDays
      .filter((d) =>
        viewMode === VIEW_MODE.WEEK
          ? true
          : d.getMonth() === anchorDate.getMonth() &&
            d.getFullYear() === anchorDate.getFullYear(),
      )
      .map((d) => formatYmd(d));

    return new Set(keys);
  }, [rangeDays, viewMode, anchorDate]);

  const scheduleInView = useMemo(
    () =>
      schedule.filter((item) => visibleDateKeys.has(getScheduleDateKey(item))),
    [schedule, visibleDateKeys],
  );

  const workingDaysInView = useMemo(() => {
    const keys = new Set(
      scheduleInView.map((item) => getScheduleDateKey(item)).filter(Boolean),
    );
    return keys.size;
  }, [scheduleInView]);

  const restDaysInView = Math.max(0, visibleDateKeys.size - workingDaysInView);

  const stats = [
    { label: "Số ca làm", val: scheduleInView.length, color: "text-slate-900" },
    { label: "Ngày làm", val: workingDaysInView, color: "text-emerald-600" },
    { label: "Ngày nghỉ", val: restDaysInView, color: "text-amber-600" },
    {
      label: "Chế độ",
      val: viewMode === VIEW_MODE.WEEK ? "Tuần" : "Tháng",
      color: "text-blue-600",
    },
  ];

  const handleMove = (step) => {
    setAnchorDate((prev) => {
      const next = new Date(prev);
      if (viewMode === VIEW_MODE.WEEK) {
        next.setDate(next.getDate() + step * 7);
      } else {
        next.setMonth(next.getMonth() + step);
      }
      return next;
    });
  };

  const renderBadges = (date) => {
    const items = groupedData[formatYmd(date)];
    if (!items?.length) return null;
    return (
      <div className="flex flex-col gap-1 mt-1">
        {items.map((item, idx) => (
          <div
            key={idx}
            className={`px-1.5 py-0.5 rounded border text-[9px] font-medium truncate ${SHIFT_COLORS[idx % SHIFT_COLORS.length]}`}
          >
            {item.shift?.shiftName || "Ca làm"}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2 md:p-6">
      <PageTitle title="Lịch làm việc cá nhân" />

      {/* Stats Section - Giữ nguyên */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="shadow-sm border-none">
            <CardContent className="p-4">
              <p className="text-[10px] uppercase text-slate-500 font-bold">
                {s.label}
              </p>
              <p className={`text-xl font-bold ${s.color}`}>{s.val}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-none shadow-md overflow-hidden bg-white">
        <CardHeader className="bg-white border-b space-y-4">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-lg font-bold flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-primary" />
              {anchorDate.toLocaleDateString("vi-VN", {
                month: "long",
                year: "numeric",
              })}
            </CardTitle>

            <div className="flex bg-slate-100 p-1 rounded-lg">
              {Object.values(VIEW_MODE).map((m) => (
                <Button
                  key={m}
                  variant={viewMode === m ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(m)}
                  className="h-8 capitalize px-4"
                >
                  {m === "week" ? "Tuần" : "Tháng"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-md border">
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMove(-1)}
              >
                <ChevronLeft className="w-4 h-4" />
              </Button>
              <Input
                type={viewMode === VIEW_MODE.WEEK ? "date" : "month"}
                className="h-8 border-none bg-transparent w-[140px] focus-visible:ring-0 text-sm font-medium"
                value={
                  viewMode === VIEW_MODE.WEEK
                    ? formatYmd(anchorDate)
                    : `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, "0")}`
                }
                onChange={(e) =>
                  setAnchorDate(
                    parseYmd(
                      viewMode === VIEW_MODE.WEEK
                        ? e.target.value
                        : `${e.target.value}-01`,
                    ) || new Date(),
                  )
                }
              />
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => handleMove(1)}
              >
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setAnchorDate(new Date())}
            >
              Hôm nay
            </Button>
            <Button
              size="sm"
              onClick={fetchSchedule}
              disabled={loading}
              className="gap-2"
            >
              <RefreshCw
                className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
              />
              Làm mới
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 grid grid-cols-7 gap-px bg-slate-200">
              {[...Array(28)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full bg-white" />
              ))}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <div className="min-w-[700px]">
                {/* Header Thứ */}
                <div className="grid grid-cols-7 border-b bg-slate-50">
                  {["T2", "T3", "T4", "T5", "T6", "T7", "CN"].map((day) => (
                    <div
                      key={day}
                      className="py-2 text-center text-[10px] font-bold text-slate-500 uppercase"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Grid Ngày */}
                <div className="grid grid-cols-7 bg-slate-200 gap-px border-b">
                  {rangeDays.map((date, idx) => {
                    const isToday = formatYmd(date) === formatYmd(new Date());
                    const isCurrentMonth =
                      date.getMonth() === anchorDate.getMonth();

                    return (
                      <div
                        key={idx}
                        className={`min-h-[110px] p-2 transition-colors
                          ${isCurrentMonth ? "bg-white" : "bg-slate-50 text-slate-400"}
                        `}
                      >
                        <div className="flex justify-between">
                          <span
                            className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full
                            ${isToday ? "bg-primary text-white" : ""}
                          `}
                          >
                            {date.getDate()}
                          </span>
                        </div>
                        {renderBadges(date)}
                        {(!groupedData[formatYmd(date)] ||
                          groupedData[formatYmd(date)].length === 0) &&
                          isCurrentMonth && (
                            <div className="text-[9px] text-slate-300 mt-1 italic">
                              Nghỉ
                            </div>
                          )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {!loading && schedule.length === 0 && (
                <div className="p-10 text-center flex flex-col items-center gap-2 bg-white">
                  <CalendarDays className="w-10 h-10 text-slate-200" />
                  <p className="text-slate-400 text-sm italic">
                    Không có lịch làm việc trong giai đoạn này
                  </p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
