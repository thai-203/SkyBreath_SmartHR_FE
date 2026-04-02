"use client";

import { useState, useCallback, useEffect } from "react";
import { FormProvider, useForm, Controller } from "react-hook-form";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { Select } from "@/components/common/Select";
import { Pagination } from "@/components/common/Pagination";
import { timesheetsService } from "@/services/timesheets.service";
import { departmentsService } from "@/services/departments.service";
import { employeesService } from "@/services/employees.service";
import GenerateTimesheetModal from "../components/GenerateTimesheetModal";
import Link from "next/link";
import { Plus, History, Calendar, FilterX, Users, Lock, ChevronRight } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

const currentDate = new Date();

export default function GenerationPage() {
    const [periods, setPeriods] = useState([]);
    const [loading, setLoading] = useState(false);
    const [generating, setGenerating] = useState(false);
    const [departments, setDepartments] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);
    const [generateModalOpen, setGenerateModalOpen] = useState(false);
    
    const searchParams = useSearchParams();
    const [filters, setFilters] = useState({
        month: searchParams.get("month") || "",
        year: parseInt(searchParams.get("year") || currentDate.getFullYear()),
    });

    const router = useRouter();
    const { success, error: toastError } = useToast();

    useEffect(() => {
        const fetchDeps = async () => {
            try {
                const [deptRes, empRes] = await Promise.all([
                    departmentsService.getAll(),
                    employeesService.getAll({ limit: 1000 })
                ]);
                setDepartments(deptRes?.data || []);
                setEmployeeList(empRes?.data?.items || []);
            } catch (err) {
                console.error(err);
            }
        };
        fetchDeps();
    }, []);

    const fetchPeriods = useCallback(async () => {
        setLoading(true);
        try {
            const res = await timesheetsService.getPeriods({
                month: filters.month ? parseInt(filters.month) : undefined,
                year: filters.year,
            });
            setPeriods(res?.data || res || []);
        } catch (err) {
            toastError("Lỗi khi tải danh sách kỳ lương");
        } finally {
            setLoading(false);
        }
    }, [filters, toastError]);

    useEffect(() => {
        fetchPeriods();
    }, [fetchPeriods]);

    const handleGenerateSubmit = async (employeeIds, regenerateMode = false, modalMonth, modalYear) => {
        setGenerating(true);
        try {
            const res = await timesheetsService.generate({
                month: modalMonth,
                year: modalYear,
                employeeIds,
                regenerate: regenerateMode,
            });
            const { generated = 0, updated = 0, failed = 0 } = res?.data || {};
            success(`Tạo mới: ${generated} | Ghi đè: ${updated} | Thất bại: ${failed}`);
            fetchPeriods();
            setGenerateModalOpen(false);
        } catch (err) {
            toastError("Lỗi khi tạo bảng công");
        } finally {
            setGenerating(false);
        }
    };

    const syncURL = useCallback((f) => {
        const params = new URLSearchParams();
        if (f.month) params.set("month", f.month);
        if (f.year) params.set("year", f.year);
        const qs = params.toString();
        router.replace(`/timesheets/generation${qs ? `?${qs}` : ''}`, { scroll: false });
    }, [router]);

    const handleFilterChange = (key, value) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        syncURL(newFilters);
    };

    const handleClearFilters = () => {
        const defaultF = { month: "", year: currentDate.getFullYear() };
        setFilters(defaultF);
        syncURL(defaultF);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
                        <Plus className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Khởi tạo bảng công</h1>
                        <p className="text-sm text-slate-500">Quản lý và khởi tạo bảng công theo từng kỳ lương</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={() => router.push('/timesheets/history')} className="gap-2">
                        <History className="h-4 w-4" /> Lịch sử
                    </Button>
                    <Button onClick={() => setGenerateModalOpen(true)} loading={generating} className="gap-2">
                        <Plus className="h-4 w-4" /> Tạo bảng công
                    </Button>
                </div>
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-wrap gap-4 items-center">
                <div className="w-40">
                    <Select
                        hidePlaceholder
                        value={filters.month}
                        onChange={(e) => handleFilterChange('month', e.target.value)}
                        options={[
                            { value: "", label: "Tất cả các tháng" },
                            ...Array.from({ length: 12 }, (_, i) => ({ value: (i + 1).toString(), label: `Tháng ${i + 1}` }))
                        ]}
                    />
                </div>
                <div className="w-32">
                    <Select
                        hidePlaceholder
                        value={filters.year}
                        onChange={(e) => handleFilterChange('year', parseInt(e.target.value))}
                        options={Array.from({ length: 5 }, (_, i) => ({ value: currentDate.getFullYear() - 2 + i, label: `Năm ${currentDate.getFullYear() - 2 + i}` }))}
                    />
                </div>
                <button onClick={handleClearFilters} className="text-slate-400 hover:text-rose-500 p-2" title="Xóa bộ lọc">
                    <FilterX className="h-5 w-5" />
                </button>
            </div>

            <div className="bg-white rounded-xl shadow border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-1/4">Kỳ lương</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-1/4 text-center">Tổng nhân viên</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-1/4 text-center">Đã chốt (khóa)</th>
                                <th className="px-6 py-4 font-semibold text-slate-700 w-1/4 text-right">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">Đang tải danh sách kỳ lương...</td>
                                </tr>
                            ) : periods.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="p-8 text-center text-slate-500">Không có dữ liệu kỳ lương nào</td>
                                </tr>
                            ) : (
                                periods.map((period, idx) => (
                                    <tr key={`${period.year}-${period.month}`} className="border-b last:border-0 hover:bg-slate-50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="bg-indigo-50 p-2 rounded-lg text-indigo-600">
                                                    <Calendar className="h-5 w-5" />
                                                </div>
                                                <span className="font-medium text-slate-900 text-base">Tháng {period.month}/{period.year}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1 bg-slate-100 px-3 py-1 rounded-full">
                                                <Users className="h-4 w-4 text-slate-500" />
                                                <span className="font-medium text-slate-700">{period.totalEmployees}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center gap-1 bg-emerald-50 px-3 py-1 rounded-full">
                                                <Lock className="h-4 w-4 text-emerald-600" />
                                                <span className="font-medium text-emerald-700">{period.lockedEmployees} / {period.totalEmployees}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <Link href={`/timesheets/data?month=${period.month}&year=${period.year}`}>
                                                <Button variant="ghost" className="text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 gap-1">
                                                    Xem chi tiết <ChevronRight className="h-4 w-4" />
                                                </Button>
                                            </Link>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <GenerateTimesheetModal
                isOpen={generateModalOpen}
                onClose={() => setGenerateModalOpen(false)}
                onSubmit={handleGenerateSubmit}
                departments={departments}
                employees={employeeList}
                loading={generating}
            />
        </div>
    );
}
