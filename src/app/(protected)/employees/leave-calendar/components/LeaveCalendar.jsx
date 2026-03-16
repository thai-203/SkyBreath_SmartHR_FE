"use client";

import { useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const dayNames = ["Thứ 2", "Thứ 3", "Thứ 4", "Thứ 5", "Thứ 6", "Thứ 7", "CN"];

export default function LeaveCalendar({ data = [], holidays = [], month, year, onMonthChange, isPersonal = false }) {
    const calendarDays = useMemo(() => {
        if (!month || !year) return [];

        const firstDayOfMonth = new Date(year, month - 1, 1);
        const lastDayOfMonth = new Date(year, month, 0);
        
        let firstDayDayOfWeek = firstDayOfMonth.getDay();
        firstDayDayOfWeek = firstDayDayOfWeek === 0 ? 6 : firstDayDayOfWeek - 1;

        const days = [];

        // Padding for previous month
        const prevMonthLastDay = new Date(year, month - 1, 0).getDate();
        for (let i = firstDayDayOfWeek - 1; i >= 0; i--) {
            days.push({
                day: prevMonthLastDay - i,
                isCurrentMonth: false,
                dateKey: `${year}-${String(month - 1).padStart(2, '0')}-${String(prevMonthLastDay - i).padStart(2, '0')}`
            });
        }

        // Current month days
        const daysInMonth = lastDayOfMonth.getDate();
        for (let i = 1; i <= daysInMonth; i++) {
            const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
            
            // Find leaves for this day
            const dayLeaves = data.filter(l => {
                const startStr = new Date(l.startDate).toISOString().split('T')[0];
                const endStr = new Date(l.endDate).toISOString().split('T')[0];
                return dateKey >= startStr && dateKey <= endStr;
            });

            // Find holidays for this day
            const dayHolidays = holidays.filter(h => {
                const startStr = new Date(h.startDate).toISOString().split('T')[0];
                const endStr = new Date(h.endDate).toISOString().split('T')[0];
                return dateKey >= startStr && dateKey <= endStr;
            });

            days.push({
                day: i,
                isCurrentMonth: true,
                dateKey,
                leaves: dayLeaves,
                holidays: dayHolidays,
                hasLeave: dayLeaves.length > 0,
                hasHoliday: dayHolidays.length > 0
            });
        }

        // Padding for next month
        const totalSlots = 42; 
        const nextMonthPadding = totalSlots - days.length;
        for (let i = 1; i <= nextMonthPadding; i++) {
            days.push({
                day: i,
                isCurrentMonth: false,
                dateKey: `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`
            });
        }

        return days;
    }, [month, year, data]);

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
            {/* Header */}
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

            {/* Grid */}
            <div className="grid grid-cols-7 border-l border-t border-slate-100">
                {calendarDays.map((dayObj, index) => {
                    const { day, isCurrentMonth, leaves = [], hasLeave } = dayObj;
                    const isToday = isCurrentMonth && day === new Date().getDate() && month === (new Date().getMonth() + 1) && year === new Date().getFullYear();
                    
                    const hasApprovedLeave = isPersonal && isCurrentMonth && leaves.some(l => l.status === 'APPROVED');
                    const hasPendingLeave = isPersonal && isCurrentMonth && leaves.some(l => l.status === 'PENDING');
                    
                    let cellBg = isCurrentMonth ? 'bg-white' : 'bg-slate-50/50';
                    if (isToday) cellBg = 'bg-blue-50/30';
                    if (hasApprovedLeave) cellBg = 'bg-red-50/50';
                    else if (hasPendingLeave) cellBg = 'bg-amber-50/30';
                    else if (dayObj.hasHoliday) cellBg = 'bg-emerald-50/30';

                    return (
                        <div 
                            key={index} 
                            className={`min-h-[120px] p-2 border-r border-b border-slate-100 transition-colors hover:bg-slate-50/30 ${cellBg}`}
                        >
                            <div className="flex justify-between items-start mb-2">
                                <span className={`text-sm font-medium ${
                                    !isCurrentMonth ? 'text-slate-300' : isToday ? 'text-blue-600' : 'text-slate-600'
                                }`}>
                                    {String(day).padStart(2, '0')}
                                </span>
                            </div>

                            <div className="space-y-1 overflow-y-auto max-h-[80px]">
                                {dayObj.holidays?.map((holiday) => (
                                    <div 
                                        key={holiday.id}
                                        title={`${holiday.holidayName}\nTừ ${new Date(holiday.startDate).toLocaleDateString('vi-VN')} đến ${new Date(holiday.endDate).toLocaleDateString('vi-VN')}${holiday.description ? '\n' + holiday.description : ''}`}
                                        className="px-2 py-1 text-[10px] font-bold rounded border truncate cursor-default bg-emerald-100 text-emerald-700 border-emerald-200"
                                    >
                                        LỄ: {holiday.holidayName}
                                    </div>
                                ))}
                                {leaves.map((leave, lIdx) => {
                                    const isApproved = leave.status === 'APPROVED';
                                    const statusLabel = isApproved ? 'NGHỈ' : 'CHỜ DUYỆT';
                                    
                                    return (
                                        <div 
                                            key={leave.id}
                                            title={`${leave.employeeName} (${leave.employeeCode})\n${leave.leaveType}\n${new Date(leave.startDate).toLocaleDateString('vi-VN')} - ${new Date(leave.endDate).toLocaleDateString('vi-VN')}${leave.content ? '\nLý do: ' + leave.content : ''}\nTrạng thái: ${leave.status}`}
                                            className={`px-2 py-1 text-[10px] font-bold rounded border truncate cursor-default ${
                                                isPersonal 
                                                ? (isApproved ? 'bg-red-100 text-red-700 border-red-200' : 'bg-amber-50 text-amber-600 border-amber-100')
                                                : 'bg-amber-100 text-amber-700 border-amber-200'
                                            }`}
                                        >
                                            {isPersonal && <span className="mr-1">{statusLabel}:</span>}
                                            {!isPersonal && <span>{leave.employeeName || 'NV'}:</span>} {leave.leaveType}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
