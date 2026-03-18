"use client";

import { useState, useEffect, useCallback } from "react";
import { Calendar as CalendarIcon, Filter } from "lucide-react";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { requestsService, employeesService, authService, holidayService } from "@/services";
import { Select } from "@/components/common/Select";
import LeaveCalendar from "./components/LeaveCalendar";

export default function LeaveCalendarPage() {
    const { error: toastError } = useToast();
    const isManagement = authService.hasAnyRole(['ADMIN', 'HR', 'MANAGER']);

    // State
    const [leaves, setLeaves] = useState([]);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [month, setMonth] = useState(new Date().getMonth() + 1);
    const [year, setYear] = useState(new Date().getFullYear());
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeId, setSelectedEmployeeId] = useState("");

    const fetchEmployees = async () => {
        try {
            const res = await employeesService.getList();
            setEmployees(res.data || []);
        } catch (error) {
            console.error("Failed to fetch employees", error);
        }
    };

    const fetchHolidays = useCallback(async () => {
        try {
            // Fetch for the current year to be safe, or just the month
            // The calendar displays one month at a time
            const startDate = `${year}-${String(month).padStart(2, '0')}-01`;
            const endDate = `${year}-${String(month).padStart(2, '0')}-31`; // API handles this
            const res = await holidayService.findAll({ startDate, endDate, limit: 100 });
            setHolidays(res.data || []);
        } catch (error) {
            console.error("Failed to fetch holidays", error);
        }
    }, [month, year]);

    const fetchLeaves = useCallback(async () => {
        setLoading(true);
        try {
            const res = await requestsService.getLeaveCalendar({
                month,
                year,
                employeeId: selectedEmployeeId || undefined
            });
            setLeaves(res.data || []);
        } catch (error) {
            toastError("Không thể tải lịch nghỉ");
        } finally {
            setLoading(false);
        }
    }, [month, year, selectedEmployeeId, toastError]);

    useEffect(() => {
        if (isManagement) {
            fetchEmployees();
        }
    }, [isManagement]);

    useEffect(() => {
        fetchLeaves();
        fetchHolidays();
    }, [fetchLeaves, fetchHolidays]);

    const handleMonthChange = (newMonth, newYear) => {
        setMonth(newMonth);
        setYear(newYear);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                        <CalendarIcon className="h-5 w-5" />
                    </div>
                    <div>
                        <PageTitle title={isManagement ? "Lịch nghỉ Nhân viên" : "Lịch nghỉ của tôi"} />
                        <p className="text-sm text-slate-500">
                            {isManagement ? "Xem lịch nghỉ phép của toàn thể nhân viên" : "Xem lịch nghỉ phép cá nhân"}
                        </p>
                    </div>
                </div>
            </div>

            {/* Filters */}
            {isManagement && (
                <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-slate-200 shadow-sm">
                    <div className="flex items-center gap-2 text-slate-600 mr-2">
                        <Filter className="h-4 w-4" />
                        <span className="text-sm font-medium">Bộ lọc:</span>
                    </div>
                    <div className="w-64">
                        <Select
                            placeholder="-- Tất cả nhân viên --"
                            value={selectedEmployeeId}
                            onChange={(e) => setSelectedEmployeeId(e.target.value)}
                            options={
                                employees.map(emp => ({ value: emp.id, label: emp.fullName }))
                            }
                        />
                    </div>
                </div>
            )}

            {/* Calendar */}
            <div className={loading ? "opacity-50 pointer-events-none transition-opacity" : "transition-opacity"}>
                <LeaveCalendar 
                    data={leaves}
                    holidays={holidays}
                    month={month}
                    year={year}
                    onMonthChange={handleMonthChange}
                    isPersonal={!isManagement}
                />
            </div>

            {loading && (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
                </div>
            )}
        </div>
    );
}
