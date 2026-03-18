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
import { holidayService, shiftAssignmentsService, userService } from "@/services";
import {
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Info,
  CalendarCheck,
  Building2,
} from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
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
        shiftAssignmentsService.getEmployeeSchedule(employeeId, startYmd, endYmd),
        holidayService.findAll({ startDate: startYmd, endDate: endYmd })
      ]);
      
      setSchedule(Array.isArray(scheduleRes?.data) ? scheduleRes.data : Array.isArray(scheduleRes) ? scheduleRes : []);
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
    holidays.forEach(h => {
      // Holiday range
      if (h.startDate && h.endDate) {
        let cur = new Date(h.startDate);
        const end = new Date(h.endDate);
        while (cur <= end) {
          const key = formatYmd(cur);
          if (!map[key]) map[key] = { items: [] };
          map[key].items.push({ type: 'HOLIDAY', data: h });
          cur.setDate(cur.getDate() + 1);
        }
      }
      // Compensatory days
      h.compensatoryDays?.forEach(cw => {
        if (!cw.date) return;
        const key = formatYmd(new Date(cw.date));
        if (!map[key]) map[key] = { items: [] };
        map[key].items.push({ type: 'COMPENSATORY', data: h, details: cw });
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
            className={`px-1.5 py-0.5 rounded border text-[9px] font-bold truncate flex items-center gap-1
              ${h.type === 'HOLIDAY' ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-amber-50 text-amber-700 border-amber-200'}
            `}
          >
            {h.type === 'HOLIDAY' ? <CalendarDays className="w-2.5 h-2.5" /> : <RefreshCw className="w-2.5 h-2.5" />}
            {h.data.holidayName}
          </div>
        ))}

        {/* Shifts */}
        {shifts.map((item, idx) => (
          <div
            key={`s-${idx}`}
            className={`px-1.5 py-0.5 rounded border text-[9px] font-medium truncate ${SHIFT_COLORS[idx % SHIFT_COLORS.length]}`}
          >
            {item.shift?.shiftName || "Ca làm"}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 p-2 md:p-6 pb-20">
      <PageTitle title="Lịch làm việc cá nhân" />

      {/* Stats Section - Highlight Holiday Info */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="shadow-sm border-none bg-blue-50/10">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Số ca làm</p>
            <p className="text-xl font-black text-slate-900">{schedule.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-emerald-50/10">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Lễ trong kỳ</p>
            <p className="text-xl font-black text-indigo-600">{holidays.length}</p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-indigo-50/10">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Ngày làm bù</p>
            <p className="text-xl font-black text-amber-600">
              {holidays.reduce((acc, h) => acc + (h.compensatoryDays?.length || 0), 0)}
            </p>
          </CardContent>
        </Card>
        <Card className="shadow-sm border-none bg-slate-50/10">
          <CardContent className="p-4">
            <p className="text-[10px] uppercase text-slate-500 font-bold tracking-wider">Chế độ xem</p>
            <p className="text-xl font-black text-blue-600">{viewMode === VIEW_MODE.WEEK ? "Tuần" : "Tháng"}</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-none shadow-xl overflow-hidden bg-white rounded-3xl">
        <CardHeader className="bg-white border-b space-y-4 p-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <CardTitle className="text-xl font-black flex items-center gap-3">
              <div className="p-2 bg-primary/10 rounded-xl text-primary">
                <CalendarDays className="w-6 h-6" />
              </div>
              <span className="uppercase tracking-tight">
                {anchorDate.toLocaleDateString("vi-VN", { month: "long", year: "numeric" })}
              </span>
            </CardTitle>

            <div className="flex bg-slate-100 p-1 rounded-xl">
              {Object.values(VIEW_MODE).map((m) => (
                <Button
                  key={m}
                  variant={viewMode === m ? "default" : "ghost"}
                  size="sm"
                  onClick={() => setViewMode(m)}
                  className={`h-9 capitalize px-6 rounded-lg transition-all ${viewMode === m ? 'shadow-md font-bold' : 'text-slate-500 hover:text-slate-900'}`}
                >
                  {m === "week" ? "Tuần" : "Tháng"}
                </Button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <div className="flex items-center gap-2 bg-slate-50 p-1.5 rounded-xl border border-slate-100 shadow-sm">
              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white hover:shadow-sm" onClick={() => setAnchorDate(prev => {
                const next = new Date(prev);
                viewMode === VIEW_MODE.WEEK ? next.setDate(next.getDate() - 7) : next.setMonth(next.getMonth() - 1);
                return next;
              })}>
                <ChevronLeft className="w-5 h-5 text-slate-600" />
              </Button>
              <Input
                type={viewMode === VIEW_MODE.WEEK ? "date" : "month"}
                className="h-9 border-none bg-transparent w-[140px] focus-visible:ring-0 text-sm font-bold text-slate-700 text-center"
                value={viewMode === VIEW_MODE.WEEK ? formatYmd(anchorDate) : `${anchorDate.getFullYear()}-${String(anchorDate.getMonth() + 1).padStart(2, "0")}`}
                onChange={(e) => setAnchorDate(parseYmd(viewMode === VIEW_MODE.WEEK ? e.target.value : `${e.target.value}-01`) || new Date())}
              />
              <Button variant="ghost" size="icon" className="h-9 w-9 hover:bg-white hover:shadow-sm" onClick={() => setAnchorDate(prev => {
                const next = new Date(prev);
                viewMode === VIEW_MODE.WEEK ? next.setDate(next.getDate() + 7) : next.setMonth(next.getMonth() + 1);
                return next;
              })}>
                <ChevronRight className="w-5 h-5 text-slate-600" />
              </Button>
            </div>
            
            <Button variant="outline" size="sm" className="h-10 px-4 rounded-xl font-bold border-slate-200 hover:bg-slate-50" onClick={() => setAnchorDate(new Date())}>Hôm nay</Button>
            
            <Button size="sm" onClick={fetchData} disabled={loading} className="h-10 px-4 rounded-xl gap-2 font-bold shadow-lg shadow-primary/20">
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Cập nhật dữ liệu
            </Button>
          </div>
        </CardHeader>

        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <div className="min-w-[700px]">
              <div className="grid grid-cols-7 border-b bg-slate-50/50">
                {["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "Chủ Nhật"].map((day) => (
                  <div key={day} className="py-3 text-center text-[11px] font-black text-slate-400 font-mono uppercase tracking-widest">{day}</div>
                ))}
              </div>

              <div className="grid grid-cols-7 bg-slate-200 gap-px">
                {rangeDays.map((date, idx) => {
                  const isToday = formatYmd(date) === formatYmd(new Date());
                  const isCurrentMonth = date.getMonth() === anchorDate.getMonth();
                  const ymd = formatYmd(date);
                  const shifts = groupedData[ymd] || [];
                  const hItems = processedHolidays[ymd]?.items || [];
                  const isHoliday = hItems.some(i => i.type === 'HOLIDAY');
                  const isCompensatory = hItems.some(i => i.type === 'COMPENSATORY');

                  return (
                    <div
                      key={idx}
                      onClick={() => handleDayClick(date)}
                      className={`min-h-[140px] p-3 transition-all cursor-pointer group hover:z-10 hover:shadow-2xl hover:scale-[1.02] border-l-4
                        ${isCurrentMonth ? "bg-white" : "bg-slate-50/50 text-slate-300"}
                        ${isHoliday ? 'border-rose-500 bg-rose-50/30' : isCompensatory ? 'border-amber-500 bg-amber-50/30' : 'border-transparent'}
                      `}
                    >
                      <div className="flex justify-between items-start mb-1.5">
                        <span className={`text-[13px] font-black w-7 h-7 flex items-center justify-center rounded-xl transition-all
                          ${isToday ? "bg-primary text-white shadow-lg shadow-primary/30" : 
                            isHoliday ? "bg-rose-100 text-rose-700" :
                            isCompensatory ? "bg-amber-100 text-amber-700" :
                            "text-slate-700 group-hover:text-primary"}
                        `}>
                          {date.getDate()}
                        </span>
                        {isHoliday && <span className="text-[9px] font-black text-rose-500 uppercase tracking-tighter">Ngày lễ</span>}
                        {isCompensatory && <span className="text-[9px] font-black text-amber-500 uppercase tracking-tighter">Làm bù</span>}
                      </div>

                      {renderBadges(date)}
                      
                      {(!shifts.length && !hItems.length && isCurrentMonth) && (
                        <div className="mt-auto pt-2">
                          <div className="text-[10px] text-slate-400 font-black uppercase tracking-widest bg-slate-100/50 py-1 px-2 rounded-lg inline-block">Nghỉ</div>
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

      {/* Holiday & Shift Detail Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="max-w-md bg-white rounded-3xl p-0 overflow-hidden border-none shadow-2xl">
          <DialogHeader className="p-6 bg-slate-50 border-b border-slate-100">
            <DialogTitle className="flex items-center gap-3">
              <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-lg shadow-indigo-200">
                <CalendarDays className="w-5 h-5" />
              </div>
              <div>
                <span className="text-lg font-black text-slate-800 tracking-tight">
                  {selectedDayInfo?.date?.toLocaleDateString("vi-VN", { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </span>
                <p className="text-xs text-slate-500 font-medium mt-0.5 uppercase tracking-wider">Chi tiết lịch làm việc & Ngày nghỉ</p>
              </div>
            </DialogTitle>
          </DialogHeader>

          <div className="p-6 space-y-6">
            {/* Display Holidays/Compensatory */}
            {selectedDayInfo?.holidays.map((h, i) => (
              <div key={i} className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all ${h.type === 'HOLIDAY' ? 'bg-indigo-50/30 border-indigo-100 shadow-sm' : 'bg-amber-50/30 border-amber-100 shadow-sm'}`}>
                <div className="flex items-center justify-between">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ${h.type === 'HOLIDAY' ? 'bg-indigo-600 text-white' : 'bg-amber-600 text-white'}`}>
                    {h.type === 'HOLIDAY' ? <CalendarDays className="w-3 h-3" /> : <RefreshCw className="w-3 h-3" />}
                    {h.type === 'HOLIDAY' ? 'Ngày nghỉ lễ' : 'Ngày làm làm bù'}
                  </span>
                  {h.data.isPaidHoliday && <span className="text-[10px] font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-md border border-green-100">Có lương</span>}
                </div>
                <h3 className="text-base font-black text-slate-800 leading-tight mt-1">{h.data.holidayName}</h3>
                <p className="text-sm text-slate-600 font-medium italic leading-relaxed">
                  {h.type === 'COMPENSATORY' && h.details?.note ? h.details.note : (h.data.description || "Ngày nghỉ theo quy định của hệ thống.")}
                </p>
                {h.type === 'COMPENSATORY' && h.details?.replacesDate && (
                  <div className="text-xs font-bold text-amber-700 bg-amber-100/50 p-2.5 rounded-xl border border-amber-200 mt-1 flex items-center gap-2">
                    <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse" />
                    <span>Thay thế cho ngày nghỉ: <span className="underline decoration-amber-300 decoration-2 underline-offset-2">{new Date(h.details.replacesDate).toLocaleDateString("vi-VN", { weekday: 'long', day: 'numeric', month: 'long' })}</span></span>
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
                  <div key={i} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 hover:bg-white hover:shadow-md transition-all">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100 text-primary">
                        <Info className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-black text-slate-800">{s.shift?.shiftName || "Ca hành chính"}</p>
                        <p className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Mã: {s.shift?.shiftCode || "STD"}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="p-4 bg-slate-50 border-t border-slate-100">
            <Button onClick={() => setIsModalOpen(false)} className="w-full h-11 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-primary/20">Đóng chi tiết</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
