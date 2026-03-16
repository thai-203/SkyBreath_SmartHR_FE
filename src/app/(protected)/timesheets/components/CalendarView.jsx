"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export default function CalendarView({ data, month, year, onMonthChange }) {
    const { dailyDetails = [] } = data || {};

    const calendarDays = useMemo(() => {
        if (!month || !year) return [];

        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);
        
        // Get the day of week for the first day (0=Sun, 1=Mon, ..., 6=Sat)
        // Convert to (0=Mon, ..., 6=Sun)
        let firstDayDayOfWeek = firstDayOfMonth.getDay();
        firstDayDayOfWeek = firstDayDayOfWeek === 0 ? 6 : firstDayDayOfWeek - 1;

        const days = [];

        // Add padding for previous month
        const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
        for (let i = firstDayDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                dateKey: `${year}-${String(month - 1).padStart(2, '0')}-${String(prevMonthLastDay - i).padStart(2, '0')}`
            });
        }

        // Add current month days
        const daysInMonth = lastDayOfMonth.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            const detail = dailyDetails.find(d => {
                const [dDay, dMonth, dYear] = d.date.split('/');
                return parseInt(dDay) === i && parseInt(dMonth) === month && parseInt(dYear) === year;
            });

            days.push({
                day: i,
                isCurrentMonth: true,
                dateKey,
                detail
            });
        }

        // Add padding for next month
        const totalSlots = 42; // 6 rows * 7 days
        const nextMonthPadding = totalSlots - days.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }

        return days;
    }, [month, year, dailyDetails]);

    const handlePrevMonth = () => {
        if (month === 1) {
            onMonthChange(12, year - 1);
        } else {
            onMonthChange(month - 1, year);
        }
    };

    const handleNextMonth = () => {
        if (month === 12) {
            onMonthChange(1, year + 1);
        } else {
            onMonthChange(month + 1, year);
        }
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            {/* Calendar Header */}
            <div className="flex items-center justify-between p-4 border-b border-slate-100">
                <h2 className="text-lg font-semibold text-slate-800">
                    Tháng {month}/{year}
                </h2>
                <div className="flex items-center gap-2">
                    <button 
                        onClick={handlePrevMonth}
                        className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                    >
                        <ChevronLeft className="h-4 w-4 text-slate-600" />
                    </button>
                    <button 
                        onClick={handleNextMonth}
                        className="p-2 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                    >
                        <ChevronRight className="h-4 w-4 text-slate-600" />
                    </button>
                </div>
            </div>

            {/* Day Names */}
            <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-100 text-center">
                {dayNames.map(day => (
                    <div key={day} className="py-3 text-sm font-medium text-slate-500 uppercase tracking-wider">
                        {day}
                    </div>
                ))}
            </div>

            {/* Calendar Grid */}
            <div className="grid grid-cols-7 border-l border-t border-slate-100">
                {calendarDays.map((dayObj, index) => {
                    const { day, isCurrentMonth, detail } = dayObj;
                    const isToday = isCurrentMonth && day === new Date().getDate() && month === (new Date().getMonth() + 1) && year === new Date().getFullYear();
                    
                    return (
                        <div 
                            key={index} 
                            className={`min-h-[120px] p-2 border-r border-b border-slate-100 transition-colors ${
                                !isCurrentMonth ? 'bg-slate-50/50' : isToday ? 'bg-blue-50/30' : 'hover:bg-slate-50/30'
                            }`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-medium ${
                                    !isCurrentMonth ? 'text-slate-300' : isToday ? 'text-blue-600' : 'text-slate-600'
                                }`}>
                                    {String(day).padStart(2, '0')}
                                </span>
                                {detail?.overtimeHours > 0 && (
                                    <Star className="h-3 w-3 text-amber-400 fill-amber-400" />
                                )}
                            </div>

                            {detail && (
                                <div className="space-y-1">
                                    {detail.status === 'PRESENT' && (
                                        <>
                                            <div className="text-center">
                                                <span className="text-lg font-bold text-emerald-600">1</span>
                                            </div>
                                            <div className="text-[10px] text-center text-slate-500 font-medium">
                                                {detail.checkIn} - {detail.checkOut || '--:--'}
                                            </div>
                                            <div className="text-[10px] text-center text-slate-400 bg-slate-50 rounded py-0.5 border border-slate-100">
                                                {detail.shiftName || 'CA_HC'}
                                            </div>
                                        </>
                                    )}

                                    {detail.status === 'HOLIDAY' && (
                                        <div className="text-center py-2">
                                            <div className="text-lg font-bold text-blue-600">1</div>
                                            <div className="text-[10px] font-bold text-rose-500 mt-1 uppercase tracking-tighter">Nghỉ lễ</div>
                                        </div>
                                    )}

                                    {detail.status === 'LEAVE' && (
                                        <div className="text-center py-2">
                                            <div className="text-lg font-bold text-amber-600">1 <span className="text-[10px] align-top text-amber-500">N</span></div>
                                            <div className="text-[10px] font-bold text-emerald-500 mt-1 uppercase tracking-tighter">Xin nghỉ</div>
                                        </div>
                                    )}

                                    {detail.status === 'ABSENT' && !detail.checkIn && (
                                        <div className="text-center py-2 text-slate-300">
                                            <div className="text-lg font-bold">0</div>
                                        </div>
                                    )}
                                    
                                    {detail.overtimeHours > 0 && (
                                        <div className="flex items-center justify-center gap-1 mt-1">
                                            <span className="text-[11px] font-bold text-emerald-600">{detail.overtimeHours}</span>
                                            <span className="text-[9px] font-bold text-amber-500 px-1 bg-amber-50 rounded">TC</span>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
