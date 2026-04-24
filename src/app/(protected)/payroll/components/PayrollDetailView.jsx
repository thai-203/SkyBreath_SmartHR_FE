"use client";

import { Button } from "@/components/common/Button";
import { authService } from "@/services/auth.service";
import { payrollService } from "@/services/payroll.service";
import { timesheetsService } from "@/services/timesheets.service";
import { employeesService } from "@/services/employees.service";
import { employeeSalariesService } from "@/services/employee-salaries.service";
import { performanceReviewsService } from "@/services/performance-reviews.service";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Building,
    Calendar,
    CheckCircle2,
    ChevronDown,
    ChevronLeft,
    ChevronRight,
    Clock,
    Download,
    FileSpreadsheet,
    FileText,
    History,
    Lock,
    Mail,
    Maximize2,
    Paperclip,
    Pencil,
    Phone,
    Plus,
    RefreshCw,
    Search,
    Send,
    Settings,
    Trash2,
    Unlock,
    Upload,
    User,
    XCircle
} from "lucide-react";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import PayrollSlipTable from "./PayrollSlipTable";
import SalaryDetailTable from "./SalaryDetailTable";
import SalarySummaryTable from "./SalarySummaryTable";


const SummaryField = ({ label, value, icon: Icon, editable, isEditingHeader, type = "text", name, onChange }) => (
    <div className="space-y-1.5">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider pl-1">{label}</label>
        <div className="relative group">
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-hover:text-indigo-500 transition-colors z-10">
                {Icon && <Icon className="h-3.5 w-3.5" />}
            </div>
            {editable && isEditingHeader ? (
                type === "select" ? (
                    <select
                        name={name}
                        value={value || ""}
                        onChange={onChange}
                        className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 font-medium outline-none transition-all ring-offset-2 focus:ring-2 ring-indigo-50"
                    >
                        <option value="">-- Chọn --</option>
                        {name === "payrollMonth" ? (
                            Array.from({ length: 12 }, (_, i) => (
                                <option key={i + 1} value={i + 1}>Tháng {i + 1}</option>
                            ))
                        ) : (
                            Array.from({ length: 5 }, (_, i) => {
                                const y = new Date().getFullYear() - 2 + i;
                                return <option key={y} value={y}>{y}</option>;
                            })
                        )}
                    </select>
                ) : (
                    <input
                        type={type}
                        name={name}
                        value={value || ""}
                        onChange={onChange}
                        className="w-full bg-white border-2 border-indigo-100 focus:border-indigo-500 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 font-medium outline-none transition-all ring-offset-2 focus:ring-2 ring-indigo-50"
                    />
                )
            ) : (
                <div className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-700 font-medium whitespace-nowrap overflow-hidden text-ellipsis shadow-sm">
                    {value || "—"}
                </div>
            )}
        </div>
    </div>
);

const OvertimeMatrixTable = ({ timesheets = [], payrollDetails = [], loading = false, isEditing = false, onChange }) => {
    const fmt = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(Number(n || 0)));

    if (loading) {
        return (
            <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} className="h-10 bg-slate-100 rounded-xl animate-pulse" />
                ))}
            </div>
        );
    }

    return (
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto max-h-[600px]">
                <table className="w-full text-[11px] border-collapse min-w-[2000px]">
                    <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-tighter">
                        <tr>
                            <th rowSpan={3} className="px-2 py-3 text-center border-r border-slate-200 sticky left-0 bg-slate-50 z-[15]">STT</th>
                            <th rowSpan={3} className="px-3 py-3 text-left border-r border-slate-200 sticky left-[40px] bg-slate-50 z-[15]">Mã NV</th>
                            <th rowSpan={3} className="px-4 py-3 text-left border-r border-slate-200 sticky left-[120px] bg-slate-50 z-[15] min-w-[150px]">Tên nhân sự</th>
                            <th rowSpan={3} className="px-3 py-3 text-left border-r border-slate-200 min-w-[120px]">Chức danh</th>
                            <th rowSpan={3} className="px-4 py-3 text-left border-r border-slate-200 min-w-[140px]">Phòng ban</th>
                            <th colSpan={12} className="px-2 py-2 text-center border-r border-slate-200">Chi tiết tăng ca</th>
                            <th colSpan={3} className="px-2 py-2 text-center">Tổng</th>
                        </tr>
                        <tr className="border-t border-slate-200">
                            <th colSpan={2} className="px-1 py-1.5 text-center border-r border-slate-100">Ngày thường</th>
                            <th colSpan={2} className="px-1 py-1.5 text-center border-r border-slate-100">Đêm ngày thường</th>
                            <th colSpan={2} className="px-1 py-1.5 text-center border-r border-slate-100">Cuối tuần</th>
                            <th colSpan={2} className="px-1 py-1.5 text-center border-r border-slate-100">Đêm cuối tuần</th>
                            <th colSpan={2} className="px-1 py-1.5 text-center border-r border-slate-100">Ngày lễ tết</th>
                            <th colSpan={2} className="px-1 py-1.5 text-center border-r border-slate-100">Đêm lễ tết</th>
                            <th className="px-1 py-1.5 text-center border-r border-slate-100">Giá giờ</th>
                            <th className="px-1 py-1.5 text-center border-r border-slate-100">Giờ OT</th>
                            <th className="px-1 py-1.5 text-center">Lương OT</th>
                        </tr>
                        <tr className="border-t border-slate-200 text-[9px] text-slate-400">
                            <th className="px-1 py-1 text-center border-r border-slate-100">Giờ</th><th className="px-1 py-1 text-center border-r border-slate-100">Tỉ lệ</th>
                            <th className="px-1 py-1 text-center border-r border-slate-100">Giờ</th><th className="px-1 py-1 text-center border-r border-slate-100">Tỉ lệ</th>
                            <th className="px-1 py-1 text-center border-r border-slate-100">Giờ</th><th className="px-1 py-1 text-center border-r border-slate-100">Tỉ lệ</th>
                            <th className="px-1 py-1 text-center border-r border-slate-100">Giờ</th><th className="px-1 py-1 text-center border-r border-slate-100">Tỉ lệ</th>
                            <th className="px-1 py-1 text-center border-r border-slate-100">Giờ</th><th className="px-1 py-1 text-center border-r border-slate-100">Tỉ lệ</th>
                            <th className="px-1 py-1 text-center border-r border-slate-100">Giờ</th><th className="px-1 py-1 text-center border-r border-slate-100">Tỉ lệ</th>
                            <th className="px-1 py-1 text-center border-r border-slate-100">VND/h</th>
                            <th className="px-1 py-1 text-center border-r border-slate-100">Tổng h</th>
                            <th className="px-1 py-1 text-center">Tổng tiền</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                        {timesheets.length === 0 ? (
                            <tr>
                                <td colSpan={20} className="px-4 py-12 text-center text-slate-400 italic bg-slate-50/20">Chưa tìm thấy dữ liệu tăng ca.</td>
                            </tr>
                        ) : (
                            timesheets.map((ts, idx) => {
                                const detail = payrollDetails.find(d => d.employeeId === ts.id);
                                const hourlyRate = (detail?.baseSalary || 0) / (ts.standardDays || 26) / 8;

                                // Calculate OT values for immediate feedback
                                const currentTotalHours =
                                    Number(ts.otWeekday || 0) +
                                    Number(ts.otWeekdayNight || 0) +
                                    Number(ts.otWeekend || 0) +
                                    Number(ts.otWeekendNight || 0) +
                                    Number(ts.otHoliday || 0) +
                                    Number(ts.otHolidayNight || 0);

                                const currentOtPay = (
                                    (Number(ts.otWeekday || 0) * 1.5) +
                                    (Number(ts.otWeekdayNight || 0) * 2.1) +
                                    (Number(ts.otWeekend || 0) * 2.0) +
                                    (Number(ts.otWeekendNight || 0) * 2.7) +
                                    (Number(ts.otHoliday || 0) * 3.0) +
                                    (Number(ts.otHolidayNight || 0) * 3.9)
                                ) * hourlyRate;

                                return (
                                    <tr key={ts.id} className="hover:bg-slate-50/50 transition-colors group">
                                        <td className="px-2 py-3 text-center text-slate-400 border-r border-slate-50 sticky left-0 bg-white group-hover:bg-slate-50/50 z-[5]">{idx + 1}</td>
                                        <td className="px-3 py-3 border-r border-slate-50 text-slate-600 font-medium sticky left-[40px] bg-white group-hover:bg-slate-50/50 z-[5]">{ts.employeeCode}</td>
                                        <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-800 sticky left-[120px] bg-white group-hover:bg-slate-50/50 z-[5]">{ts.fullName}</td>
                                        <td className="px-3 py-3 border-r border-slate-50 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{ts.positionName || "—"}</td>
                                        <td className="px-4 py-3 border-r border-slate-100 text-slate-500 whitespace-nowrap font-medium">{ts.departmentName || "—"}</td>

                                        <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-12 bg-white border border-indigo-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={ts.otWeekday || 0}
                                                    onChange={(e) => onChange(ts.id, 'otWeekday', e.target.value)}
                                                />
                                            ) : (ts.otWeekday || 0)}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">1.5</td>

                                        <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-12 bg-white border border-indigo-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={ts.otWeekdayNight || 0}
                                                    onChange={(e) => onChange(ts.id, 'otWeekdayNight', e.target.value)}
                                                />
                                            ) : (ts.otWeekdayNight || 0)}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">2.1</td>

                                        <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-12 bg-white border border-indigo-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={ts.otWeekend || 0}
                                                    onChange={(e) => onChange(ts.id, 'otWeekend', e.target.value)}
                                                />
                                            ) : (ts.otWeekend || 0)}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">2.0</td>

                                        <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-12 bg-white border border-indigo-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={ts.otWeekendNight || 0}
                                                    onChange={(e) => onChange(ts.id, 'otWeekendNight', e.target.value)}
                                                />
                                            ) : (ts.otWeekendNight || 0)}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">2.7</td>

                                        <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-12 bg-white border border-indigo-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={ts.otHoliday || 0}
                                                    onChange={(e) => onChange(ts.id, 'otHoliday', e.target.value)}
                                                />
                                            ) : (ts.otHoliday || 0)}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">3.0</td>

                                        <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">
                                            {isEditing ? (
                                                <input
                                                    type="number"
                                                    min={0}
                                                    className="w-12 bg-white border border-indigo-200 rounded text-center outline-none focus:ring-1 focus:ring-indigo-500"
                                                    value={ts.otHolidayNight || 0}
                                                    onChange={(e) => onChange(ts.id, 'otHolidayNight', e.target.value)}
                                                />
                                            ) : (ts.otHolidayNight || 0)}
                                        </td>
                                        <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">3.9</td>

                                        <td className="px-2 py-3 text-right border-r border-slate-50 text-slate-500 font-medium">{fmt(hourlyRate)}</td>
                                        <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600">{currentTotalHours || 0}</td>
                                        <td className="px-3 py-3 text-right font-bold text-emerald-600 bg-emerald-50/30 whitespace-nowrap">{fmt(currentOtPay || 0)}</td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

const Section = ({ id, title, icon: Icon, isOpen, onToggle, children }) => (
    <div className="border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm transition-all">
        <button
            onClick={() => onToggle(id)}
            className="w-full flex items-center justify-between px-5 py-4 hover:bg-slate-50/80 transition-colors group"
        >
            <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg bg-slate-100 text-slate-600 group-hover:bg-white transition-colors shadow-sm`}>
                    <Icon className="h-4 w-4" />
                </div>
                <span className="font-bold text-slate-700 tracking-tight">{title}</span>
            </div>
            {isOpen ? <ChevronDown className="h-4 w-4 text-slate-400" /> : <ChevronRight className="h-4 w-4 text-slate-400" />}
        </button>
        {isOpen && (
            <div className="px-5 py-6 border-t border-slate-100 bg-white animate-in slide-in-from-top-1 duration-200">
                {children}
            </div>
        )}
    </div>
);

const PayrollDetailView = React.memo(({
    payroll,
    status,
    onBack,
    onCalculate,
    onApproval,
    onExportSummary,
    onExportPayslips,
    onEditDetail,
    onUpdateHeader,
    actionLoading,
    detailLoading,
    canEdit
}) => {
    // ─── ALL HOOKS MUST BE BEFORE ANY CONDITIONAL RETURN ───
    const [activeTab, setActiveTab] = useState("data");
    const [isEditingHeader, setIsEditingHeader] = useState(false);
    const [formData, setFormData] = useState({});
    const [timesheetData, setTimesheetData] = useState(null);
    const [timesheetLoading, setTimesheetLoading] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [tsSearch, setTsSearch] = useState("");
    const [otSearch, setOtSearch] = useState("");
    const [inputSearch, setInputSearch] = useState("");
    const [inputRows, setInputRows] = useState([]);
    const [openSections, setOpenSections] = useState({
        timesheet: true,
        overtime: false,
        input: false,
        files: false,
        history: false
    });
    const [isEditingData, setIsEditingData] = useState(false);
    const [isSaving, setIsSaving] = useState(false);

    // Add Personnel Modal State
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [availableEmployees, setAvailableEmployees] = useState([]);
    const [isFetchingEmployees, setIsFetchingEmployees] = useState(false);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [empSearch, setEmpSearch] = useState("");
    const [salaryData, setSalaryData] = useState(null);
    const [performanceData, setPerformanceData] = useState([]);

    // Derived active period (from payroll or from edit form)
    const activeMonth = isEditingHeader ? (formData.payrollMonth || payroll?.payrollMonth) : payroll?.payrollMonth;
    const activeYear = isEditingHeader ? (formData.payrollYear || payroll?.payrollYear) : payroll?.payrollYear;

    // Fetch performance reviews when payroll loads
    useEffect(() => {
        if (payroll?.payrollMonth && payroll?.payrollYear) {
            performanceReviewsService.getByPeriod(payroll.payrollMonth, payroll.payrollYear)
                .then(res => {
                    const reviews = res?.data?.data || res?.data || [];
                    setPerformanceData(reviews);
                })
                .catch(err => {
                    console.error("Error fetching performance reviews:", err);
                    setPerformanceData([]);
                });
        }
    }, [payroll?.payrollMonth, payroll?.payrollYear]);

    const handleRefreshSection = async (sectionId) => {
        setIsRefreshing(true);
        if (sectionId === "timesheet") {
            setTimesheetData(null);
        } else if (sectionId === "input") {
            try {
                setInputRows([]);
                setTimesheetData(null);
                // Fetch fresh salary data to get actual KPI salary
                const res = await employeeSalariesService.getAll();
                const salaries = res?.data || res || [];
                setSalaryData(salaries);
                toast.success("Đã đồng bộ lại dữ liệu từ hệ thống lương");
            } catch (err) {
                console.error("Error refreshing salary data:", err);
                toast.error("Không thể lấy dữ liệu lương");
            }
        } else if (sectionId === "payroll") {
            window.location.reload();
        }
        setTimeout(() => setIsRefreshing(false), 800);
    };

    // Matrix-based input rows for all employees
    useEffect(() => {
        if (timesheetData && timesheetData.length > 0 && payroll?.details && salaryData && (inputRows.length === 0)) {
            const rows = timesheetData.map(ts => {
                const detail = payroll.details.find(d => d.employeeId === ts.id);

                // Lấy performance review để tính % KPI
                const perf = performanceData.find(p => p.employeeId === ts.id);

                // Lấy performanceSalary từ employee_salaries (đây là Lương P2 gốc)
                const salary = salaryData?.find(s =>
                    Number(s.employeeId) === Number(ts.id) ||
                    s.employee?.id === ts.id ||
                    s.employee?.employeeCode === ts.employeeCode
                );
                const performanceSalary = parseFloat(salary?.performanceSalary || 0);

                // Tính % KPI từ performance_reviews
                // Cấu trúc điểm: 1.1-1.5 (max 5.0) + 2.1 (max 5.0) = Total max 10.0
                // ── KPI % CHỈ CHIẾM 50% MỖI PHẦN ──
                // P2.1: sum(1.1-1.5) / max(5) * 50%
                // P2.2: scoreResult / max(5) * 50%
                // Total KPI = P2.1% + P2.2% (max = 100%)
                let p21Percent = 0;
                let p22Percent = 0;
                let totalKpiPercent = 0;

                if (perf) {
                    const sumScore11to15 =
                        (parseFloat(perf.scoreCompliance || 0) +
                            parseFloat(perf.scoreAttitude || 0) +
                            parseFloat(perf.scoreLearning || 0) +
                            parseFloat(perf.scoreTeamwork || 0) +
                            parseFloat(perf.scoreSkills || 0));

                    p21Percent = sumScore11to15 / 5 * 50;  // P2.1 chiếm 50%
                    p22Percent = parseFloat(perf.scoreResult || 0) / 5 * 50;  // P2.2 chiếm 50%
                    totalKpiPercent = p21Percent + p22Percent;  // Tổng KPI (max = 100%)
                }

                // Tính P2.1 thực và P2.2 thực
                // P2.1 thực = performanceSalary × %P2.1 / 100 × hệ số ngày công
                // P2.2 thực = performanceSalary × %P2.2 / 100 × hệ số ngày công
                const standardDays = parseFloat(ts.standardDays) || 22;
                const workingDays = (parseFloat(ts.officialDays || 0) + parseFloat(ts.probationDays || 0) +
                    parseFloat(ts.businessTripDays || 0) + parseFloat(ts.holidayDays || 0) + parseFloat(ts.benefitLeaveDays || 0));
                const dayFactor = standardDays > 0 ? workingDays / standardDays : 0;

                const p21Actual = performanceSalary * (p21Percent / 100) * dayFactor;
                const p22Actual = performanceSalary * (p22Percent / 100) * dayFactor;

                return {
                    id: ts.id,
                    employeeId: ts.id,
                    employeeCode: ts.employeeCode,
                    fullName: ts.fullName,
                    departmentName: ts.departmentName,
                    positionName: ts.positionName,
                    // Attendance reference
                    standardDays: ts.standardDays || 26,
                    officialDays: ts.officialDays || 0,
                    probationDays: ts.probationDays || 0,
                    // P2 từ employee_salaries (performanceSalary)
                    performanceSalary: performanceSalary,
                    // % KPI từ performance_reviews (P2.1 + P2.2 = 100%)
                    kpiPercent: totalKpiPercent,
                    p1p2Percentage: p21Percent,
                    p3Percentage: p22Percent,
                    // P2.1 thực và P2.2 thực (đã tính)
                    p21Actual: p21Actual,
                    p22Actual: p22Actual,
                    bonus: 0,
                    allowanceAmount: detail?.allowanceAmount ?? 0,
                    penalty: detail?.penalty ?? 0,
                    deduction: detail?.deduction ?? 0,
                    // Insurance rates cố định
                    socialInsurancePercentage: 8,
                    healthInsurancePercentage: 1.5,
                    unemploymentInsurancePercentage: 1,
                    unionFeePercentage: 0,
                    taxDeduction: detail?.taxDeduction ?? 0,
                    note: detail?.note || ""
                };
            });
            setInputRows(rows);
        }
    }, [timesheetData, payroll?.details, salaryData, performanceData, inputRows.length]);

    const handleInputRowChange = (id, field, value) => {
        // Validation: Prevent negative values for numeric fields
        const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
        if (isNumeric && parseFloat(value) < 0) {
            toast.error("Vui lòng nhập giá trị dương (>= 0)");
            return;
        }

        setInputRows(prev => prev.map(row => {
            if (row.id === id) {
                return { ...row, [field]: value };
            }
            return row;
        }));
    };

    const handleExportExcel = () => {
        if (!timesheetData) {
            toast.error("Không có dữ liệu để xuất");
            return;
        }

        const data = timesheetData.map((item, idx) => ({
            "STT": idx + 1,
            "Mã nhân sự": item.employeeCode,
            "Tên nhân sự": item.fullName,
            "Lương cơ bản (Hợp đồng)": item.baseSalary || 0,
            "Số ngày công chuẩn": item.standardDays || 26,
            "Tổng công trong tháng": item.totalMonthlyDays || 0,
            "Ngày công chính thức": item.officialDays || 0,
            "Ngày công thử việc": item.probationDays || 0,
            "Công tác": item.businessTripDays || 0,
            "Nghỉ lễ": item.holidayDays || 0,
            "Nghỉ chế độ": item.benefitLeaveDays || item.paidLeaveDays || 0,
            "Nghỉ phép": item.annualLeaveDays || 0,
            "Nghỉ không lương": item.unpaidLeaveDays || 0,
            "Nghỉ chờ việc": item.waitingDays || 0,
            "Tổng cộng ăn": item.mealCount || 0,
            "Ngày phép đã dùng": item.usedLeaveDays || 0,
            "Phép tồn": item.remainingLeaveDays || 0
        }));

        const ws = XLSX.utils.json_to_sheet(data);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Bang Cham Cong");
        XLSX.writeFile(wb, `Bang_Cham_Cong_${activeMonth || 'M'}_${activeYear || 'Y'}.xlsx`);
        toast.success("Đã xuất file Excel thành công");
    };

    const handleAddInputRow = () => {
        const newRow = {
            id: Date.now(),
            employeeCode: "",
            fullName: "",
            item: "Thưởng KPI",
            dummyPercent: 100,
            maxKpiSalary: 0,
            amount: 0,
            note: ""
        };
        setInputRows(prev => [...prev, newRow]);
    };

    const fetchEmployeesForAdd = async () => {
        setIsFetchingEmployees(true);
        try {
            const res = await employeesService.getAll({ limit: 2000, status: 'ACTIVE' });
            const allEmp = res?.data?.items || res?.items || [];

            // Filter out employees already in the timesheet
            const currentIds = new Set(timesheetData?.map(ts => ts.id) || []);
            const filtered = allEmp.filter(emp => !currentIds.has(emp.id));

            setAvailableEmployees(filtered);
        } catch (err) {
            console.error("Error fetching employees:", err);
            toast.error("Không thể tải danh sách nhân viên");
        } finally {
            setIsFetchingEmployees(false);
        }
    };

    const handleOpenAddModal = () => {
        fetchEmployeesForAdd();
        setIsAddModalOpen(true);
        setSelectedEmployeeIds([]);
    };

    const handleConfirmAddPersonnel = async () => {
        if (selectedEmployeeIds.length === 0) {
            toast.error("Vui lòng chọn ít nhất một nhân sự");
            return;
        }

        const month = parseInt(activeMonth);
        const year = parseInt(activeYear);

        if (isNaN(month) || isNaN(year)) {
            toast.error("Không xác định được kỳ lương (tháng/năm)");
            return;
        }

        setIsSaving(true);
        try {
            // Add employees to timesheet period
            const results = await Promise.allSettled(selectedEmployeeIds.map(empId =>
                timesheetsService.addEmployee({
                    employeeId: parseInt(empId),
                    month: month,
                    year: year
                })
            ));

            const failed = results.filter(r => r.status === 'rejected');
            if (failed.length > 0) {
                console.error("Some employees failed to add:", failed);
                if (failed.length === selectedEmployeeIds.length) {
                    throw new Error(failed[0].reason?.message || "Tất cả nhân sự đều lỗi khi thêm");
                }
                toast.warning(`Đã thêm thành công ${results.length - failed.length} nhân sự, ${failed.length} nhân sự bị lỗi.`);
            } else {
                toast.success(`Đã thêm ${selectedEmployeeIds.length} nhân sự thành công`);
            }

            setIsAddModalOpen(false);

            // Refresh timesheet data
            handleRefreshSection("timesheet");
        } catch (err) {
            console.error("Error adding employees:", err);
            toast.error("Lỗi khi thêm nhân sự: " + (err.response?.data?.message || err.message || "Unknown error"));
        } finally {
            setIsSaving(false);
        }
    };

    const handleTimesheetChange = (id, field, value) => {
        // Validation: Prevent negative values for numeric fields
        const isNumeric = !isNaN(parseFloat(value)) && isFinite(value);
        if (isNumeric && parseFloat(value) < 0) {
            toast.error("Vui lòng nhập giá trị dương (>= 0)");
            return;
        }

        setTimesheetData(prev => prev.map(item =>
            item.id === id ? { ...item, [field]: value } : item
        ));
    };

    const handleToggleEditData = async () => {
        if (isEditingData) {
            // When switching FROM editing TO saving
            try {
                setIsSaving(true);
                // We need to save the edited timesheetData. 
                // Since there's no bulk update endpoint for timesheet matrix specifically yet,
                // we'll update the payroll details that are already linked.
                const updates = timesheetData.map(item => {
                    const detail = payroll?.details?.find(d => d.employeeId === item.id);
                    if (!detail) return null;

                    // Merge with data from inputRows
                    const inputRow = inputRows.find(ir => ir.id === item.id);

                    return {
                        id: detail.id,
                        // Attendance fields
                        standardDays: item.standardDays,
                        workingDays: item.workingDays,
                        officialDays: item.officialDays,
                        probationDays: item.probationDays,
                        businessTripDays: item.businessTripDays,
                        holidayDays: item.holidayDays,
                        benefitLeaveDays: item.benefitLeaveDays,
                        // Overtime fields
                        otWeekday: item.otWeekday,
                        otWeekdayNight: item.otWeekdayNight,
                        otWeekend: item.otWeekend,
                        otWeekendNight: item.otWeekendNight,
                        otHoliday: item.otHoliday,
                        otHolidayNight: item.otHolidayNight,
                        // Financial fields from inputRow
                        performanceSalary: inputRow?.p21Salary, // Matrix P2 total
                        p1p2Percentage: inputRow?.p1p2Percentage,
                        p3Percentage: inputRow?.p3Percentage,
                        bonus: inputRow?.bonus, // Matrix P3
                        allowanceAmount: inputRow?.allowanceAmount,
                        penalty: inputRow?.penalty,
                        deduction: inputRow?.deduction,
                        socialInsurancePercentage: inputRow?.socialInsurancePercentage,
                        healthInsurancePercentage: inputRow?.healthInsurancePercentage,
                        unemploymentInsurancePercentage: inputRow?.unemploymentInsurancePercentage,
                        unionFeePercentage: inputRow?.unionFeePercentage,
                        taxDeduction: inputRow?.taxDeduction,
                        note: inputRow?.note
                    };
                }).filter(Boolean);

                if (updates.length > 0) {
                    // Update server records via service calls
                    await Promise.all(updates.map(u => payrollService.updateDetail(u.id, u)));
                    toast.success("Đã cập nhật thay đổi thành công.");

                    // After saving, we trigger a calculation if it's draft, so net salaries are refreshed.
                    if (onCalculate && payroll?.payrollStatus === "DRAFT") {
                        onCalculate({ ...payroll, payrollMonth: activeMonth, payrollYear: activeYear });
                    }
                }
            } catch (err) {
                console.error(err);
                toast.error("Lỗi khi lưu dữ liệu: " + (err.message || "Unknown error"));
            } finally {
                setIsSaving(false);
            }
        }
        setIsEditingData(!isEditingData);
    };

    // ── Filtered Data ──
    // Constructed full details list to ensure all personnel from timesheet appear in Salary/Slip tabs
    const fullPayrollDetails = useMemo(() => {
        if (!timesheetData || !payroll?.details) return payroll?.details || [];

        return timesheetData.map(tsItem => {
            const existingDetail = payroll.details.find(d => d.employeeId === tsItem.id);
            const inputRow = inputRows.find(ir => ir.id === tsItem.id);

            // ── LẤY PERFORMANCE REVIEW ĐỂ TÍNH % KPI ──
            // Cấu trúc điểm: 1.1-1.5 (max 5.0) + 2.1 (max 5.0) = Total max 10.0
            const perf = performanceData.find(p => p.employeeId === tsItem.id);

            // ── KPI % CHỈ CHIẾM 50% MỖI PHẦN ──
            // P2.1: sum(1.1-1.5) / max(5) * 50%
            // P2.2: scoreResult / max(5) * 50%
            let p21Percent = 0;
            let p22Percent = 0;

            if (perf) {
                const sumScore11to15 =
                    (parseFloat(perf.scoreCompliance || 0) +
                        parseFloat(perf.scoreAttitude || 0) +
                        parseFloat(perf.scoreLearning || 0) +
                        parseFloat(perf.scoreTeamwork || 0) +
                        parseFloat(perf.scoreSkills || 0));

                p21Percent = sumScore11to15 / 5 * 50;  // P2.1 chiếm 50%
                p22Percent = parseFloat(perf.scoreResult || 0) / 5 * 50;  // P2.2 chiếm 50%
            }

            // ── TÍNH LƯƠNG THỰC NHẬN ──
            const performanceSalary = parseFloat(existingDetail?.performanceSalary || tsItem.performanceSalary || 0);
            const standardDays = parseFloat(tsItem.standardDays || 26);
            const officialDays = parseFloat(tsItem.officialDays || 0);
            const probationDays = parseFloat(tsItem.probationDays || 0);
            const businessTripDays = parseFloat(tsItem.businessTripDays || 0);
            const holidayDays = parseFloat(tsItem.holidayDays || 0);
            const benefitLeaveDays = parseFloat(tsItem.benefitLeaveDays || 0);

            const fullPayDays = officialDays + businessTripDays + holidayDays + benefitLeaveDays;
            const dayFactor = standardDays > 0 ? fullPayDays / standardDays : 0;

            // P2.1 thực = performanceSalary × %P2.1 / 100 × hệ số ngày công
            const p21Amount = performanceSalary * (p21Percent / 100) * dayFactor;
            // P2.2 thực = performanceSalary × %P2.2 / 100 × hệ số ngày công
            const p22Amount = performanceSalary * (p22Percent / 100) * dayFactor;
            // P1 thực = baseSalary × hệ số ngày công
            const p1Amount = parseFloat(existingDetail?.baseSalary || tsItem.baseSalary || 0) * dayFactor;
            // Lương TV thực = baseSalary × ngày công TV / standardDays × 0.85
            const probationAmount = standardDays > 0 ?
                (parseFloat(existingDetail?.baseSalary || tsItem.baseSalary || 0) / standardDays) * probationDays * 0.85 : 0;

            // Calculate OT Pay for the table view based on current hours in timesheet matrix
            const p1Base = parseFloat(existingDetail?.baseSalary || tsItem.baseSalary || 0);
            const hourlyRate = standardDays > 0 ? p1Base / standardDays / 8 : 0;
            const currentOtPay = (
                (Number(tsItem.otWeekday || 0) * 1.5) +
                (Number(tsItem.otWeekdayNight || 0) * 2.1) +
                (Number(tsItem.otWeekend || 0) * 2.0) +
                (Number(tsItem.otWeekendNight || 0) * 2.7) +
                (Number(tsItem.otHoliday || 0) * 3.0) +
                (Number(tsItem.otHolidayNight || 0) * 3.9)
            ) * hourlyRate;

            return {
                ...(existingDetail || {}),
                id: existingDetail?.id || `temp-${tsItem.id}`,
                employeeId: tsItem.id,
                employee: existingDetail?.employee || {
                    id: tsItem.id,
                    fullName: tsItem.fullName,
                    employeeCode: tsItem.employeeCode,
                    department: { departmentName: tsItem.departmentName },
                    position: { positionName: tsItem.positionName }
                },
                // Fresh attendance from timesheetData
                standardDays: tsItem.standardDays,
                officialDays: tsItem.officialDays,
                probationDays: tsItem.probationDays,
                benefitLeaveDays: tsItem.benefitLeaveDays,
                holidayDays: tsItem.holidayDays,
                businessTripDays: tsItem.businessTripDays,
                annualLeaveDays: tsItem.annualLeaveDays,
                otWeekday: tsItem.otWeekday,
                otWeekdayNight: tsItem.otWeekdayNight,
                otWeekend: tsItem.otWeekend,
                otWeekendNight: tsItem.otWeekendNight,
                otHoliday: tsItem.otHoliday,
                otHolidayNight: tsItem.otHolidayNight,
                overtimePay: currentOtPay,
                // Lương P2 từ employee_salaries
                performanceSalary: performanceSalary,
                // % KPI từ performance_reviews (P2.1 = 1.1-1.5, P2.2 = scoreResult)
                p1p2Percentage: p21Percent,
                p3Percentage: p22Percent,
                // Lương thực nhận đã tính lại từ performance
                p1Amount: p1Amount,
                p21Amount: p21Amount,
                p22Amount: p22Amount,
                probationAmount: probationAmount,
                // Bonus, penalty, deduction từ inputRows hoặc existingDetail
                bonus: inputRow?.bonus !== undefined ? inputRow.bonus : (existingDetail?.bonus || 0),
                penalty: inputRow?.penalty !== undefined ? inputRow.penalty : (existingDetail?.penalty || 0),
                deduction: inputRow?.deduction !== undefined ? inputRow.deduction : (existingDetail?.deduction || 0),
                allowanceAmount: inputRow?.allowanceAmount ?? existingDetail?.allowanceAmount ?? 0,
                socialInsurancePercentage: inputRow?.socialInsurancePercentage ?? existingDetail?.socialInsurancePercentage ?? 0,
                healthInsurancePercentage: inputRow?.healthInsurancePercentage ?? existingDetail?.healthInsurancePercentage ?? 0,
                unemploymentInsurancePercentage: inputRow?.unemploymentInsurancePercentage ?? existingDetail?.unemploymentInsurancePercentage ?? 0,
                unionFeePercentage: inputRow?.unionFeePercentage ?? existingDetail?.unionFeePercentage ?? 0,
                taxDeduction: inputRow?.taxDeduction ?? existingDetail?.taxDeduction ?? 0,
                note: inputRow?.note ?? (existingDetail?.note || "")
            };
        });
    }, [timesheetData, payroll?.details, inputRows, performanceData]);

    const filteredTimesheetData = useMemo(() => {
        if (!timesheetData) return [];

        let data = [...timesheetData];

        // User wants to show all personnel, so we comment out the filter
        /*
        data = data.filter(item => {
            const hasActivity = 
                (Number(item.totalMonthlyDays) > 0) || 
                (Number(item.officialDays) > 0) || 
                (Number(item.probationDays) > 0) ||
                (Number(item.holidayDays) > 0) ||
                (Number(item.paidLeaveDays || item.benefitLeaveDays) > 0) ||
                (Number(item.annualLeaveDays) > 0) ||
                (Number(item.unpaidLeaveDays) > 0) ||
                (Number(item.businessTripDays) > 0) ||
                (Number(item.waitingDays) > 0);

            const isInPayroll = payroll?.details?.some(d => d.employeeId === item.id);

            return hasActivity || isInPayroll;
        });
        */

        if (tsSearch.trim()) {
            const term = tsSearch.toLowerCase();
            data = data.filter(item =>
                item.fullName?.toLowerCase().includes(term) ||
                item.employeeCode?.toLowerCase().includes(term) ||
                item.departmentName?.toLowerCase().includes(term)
            );
        }
        return data;
    }, [timesheetData, tsSearch, payroll?.details]);

    const filteredOvertimeData = useMemo(() => {
        if (!timesheetData) return [];

        let data = [...timesheetData];

        if (otSearch.trim()) {
            const term = otSearch.toLowerCase();
            data = data.filter(item =>
                item.fullName?.toLowerCase().includes(term) ||
                item.employeeCode?.toLowerCase().includes(term)
            );
        }
        return data;
    }, [timesheetData, otSearch]);

    const groupedTimesheetData = useMemo(() => {
        if (!filteredTimesheetData) return [];

        const groups = {};
        filteredTimesheetData.forEach(item => {
            const deptName = item.departmentName || "Khác";
            if (!groups[deptName]) {
                groups[deptName] = [];
            }
            groups[deptName].push(item);
        });

        return Object.keys(groups).map(dept => ({
            departmentName: dept,
            items: groups[dept]
        }));
    }, [filteredTimesheetData]);

    const [collapsedGroups, setCollapsedGroups] = useState(new Set());

    const toggleGroup = (deptName) => {
        setCollapsedGroups(prev => {
            const next = new Set(prev);
            if (next.has(deptName)) next.delete(deptName);
            else next.add(deptName);
            return next;
        });
    };

    useEffect(() => {
        // Clear timesheet data when switching to a different payroll record or period
        setTimesheetData(null);
    }, [payroll?.id, activeMonth, activeYear]);

    useEffect(() => {
        if (payroll && activeMonth && activeYear) {
            // Only fetch if data is missing
            if (timesheetData) return;

            const fetchData = async () => {
                setTimesheetLoading(true);
                try {
                    const [tsRes, salaryRes] = await Promise.all([
                        timesheetsService.getSummaryMatrix({
                            month: activeMonth,
                            year: activeYear,
                            limit: 1000
                        }),
                        employeeSalariesService.getAll()
                    ]);
                    setTimesheetData(tsRes?.data?.items || tsRes?.items || []);
                    setSalaryData(salaryRes?.data || salaryRes || []);
                } catch (err) {
                    console.error("Error fetching initial data:", err);
                } finally {
                    setTimesheetLoading(false);
                }
            };
            fetchData();
        }
    }, [payroll?.id, activeMonth, activeYear, timesheetData]);

    // ─── Guard: show skeleton if payroll data not yet loaded ───
    if (!payroll) {
        return (
            <div className="flex flex-col items-center justify-center p-12 bg-white border border-slate-100 rounded-3xl animate-pulse">
                <div className="h-12 w-12 bg-slate-100 rounded-full mb-4" />
                <div className="h-4 w-48 bg-slate-100 rounded-lg mb-2" />
                <div className="h-3 w-32 bg-slate-50 rounded-lg" />
            </div>
        );
    }

    // 4. Handlers
    const handleSaveInputRows = async () => {
        if (!inputRows.length) {
            toast.error("Không có dữ liệu để lưu");
            return;
        }

        try {
            setIsSaving(true);
            const updates = inputRows.map(row => {
                const detail = payroll?.details?.find(d => d.employeeId === row.employeeId);
                if (!detail) return null;

                return {
                    id: detail.id,
                    p21Salary: parseFloat(row.p21Salary) || 0,
                    performanceSalary: parseFloat(row.p21Salary) || 0,
                    p1p2Percentage: parseFloat(row.p1p2Percentage) || 0,
                    p3Percentage: parseFloat(row.p3Percentage) || 0,
                    bonus: parseFloat(row.bonus) || 0,
                    allowanceAmount: parseFloat(row.allowanceAmount) || 0,
                    penalty: parseFloat(row.penalty) || 0,
                    deduction: parseFloat(row.deduction) || 0,
                    socialInsurancePercentage: parseFloat(row.socialInsurancePercentage) || 0,
                    healthInsurancePercentage: parseFloat(row.healthInsurancePercentage) || 0,
                    unemploymentInsurancePercentage: parseFloat(row.unemploymentInsurancePercentage) || 0,
                    unionFeePercentage: parseFloat(row.unionFeePercentage) || 0,
                    taxDeduction: parseFloat(row.taxDeduction) || 0,
                    note: row.note || ""
                };
            }).filter(Boolean);

            if (updates.length > 0) {
                // Update in batches or parallel
                await Promise.all(updates.map(u => payrollService.updateDetail(u.id, u)));
                toast.success(`Đã lưu dữ liệu nhập liệu cho ${updates.length} nhân sự thành công!`);

                // Recalculate to reflect changes
                if (onCalculate && payroll?.payrollStatus === "DRAFT") {
                    await onCalculate({ ...payroll, payrollMonth: activeMonth, payrollYear: activeYear });
                }
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi khi lưu dữ liệu: " + (err.message || "Unknown error"));
        } finally {
            setIsSaving(false);
        }
    };

    const startEditing = () => {
        setFormData({
            unitName: payroll?.unitName,
            payrollMonth: payroll?.payrollMonth,
            payrollYear: payroll?.payrollYear,
            contactName: payroll?.contactName || payroll?.submitter?.fullName || "",
            contactPhone: payroll?.contactPhone || payroll?.submitter?.phoneNumber || "",
            contactEmail: payroll?.contactEmail || payroll?.submitter?.companyEmail || "",
            paymentDate: payroll?.paymentDate ? new Date(payroll.paymentDate).toISOString().split('T')[0] : "",
        });
        setIsEditingHeader(true);
    };

    const handleSave = async () => {
        if (onUpdateHeader) {
            await onUpdateHeader(payroll.id, formData);
        }
        setIsEditingHeader(false);
    };

    const toggleSection = (section) => {
        setOpenSections(prev => ({ ...prev, [section]: !prev[section] }));
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let finalValue = value;
        if (name === "payrollMonth" || name === "payrollYear") {
            finalValue = parseInt(value, 10) || 0;
        }
        setFormData(prev => ({ ...prev, [name]: finalValue }));
    };

    const handleImportExcel = async (e) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const formData = new FormData();
        formData.append("file", file);

        // Assume ActionLoading or similar is available or managed locally
        try {
            const res = await payrollService.importDetails(payroll.id, formData);
            if (res.success) {
                toast.success("Import dữ liệu thành công!");
                // Trigger refresh by back-and-forth or simple state change
                window.location.reload();
            } else {
                toast.error(res.message || "Lỗi khi import file");
            }
        } catch (err) {
            console.error(err);
            toast.error("Lỗi kết nối máy chủ");
        }
    };

    // 5. Constants / Derived data
    const tabs = [
        { id: "data", label: "Dữ liệu tính lương" },
        { id: "table", label: "Bảng lương nhân sự" },
        { id: "summary", label: "Tổng hợp lương" },
        { id: "slips", label: "Phiếu lương" },
    ];

    const displayUnit = payroll?.unitName || "CTCP cấp thoát nước Sa Pa";
    const displayContactName = payroll?.contactName || payroll?.submitter?.fullName || "—";
    const displayContactPhone = payroll?.contactPhone || payroll?.submitter?.phoneNumber || "—";
    const displayContactEmail = payroll?.contactEmail || payroll?.submitter?.companyEmail || "—";
    const displayPaymentDate = payroll?.paymentDate
        ? new Date(payroll.paymentDate).toLocaleDateString('vi-VN')
        : `05/${String((activeMonth || 0) % 12 + 1).padStart(2, '0')}/${(activeMonth === 12 ? (activeYear + 1) : activeYear) || ""}`;

    return (
        <div className="space-y-6 animate-in fade-in duration-500 relative pb-20">
            {/* Hidden Input for Import */}
            <input
                type="file"
                id="excel-import-input"
                hidden
                accept=".xlsx, .xls"
                onChange={handleImportExcel}
            />

            {/* Floating Import Button (Near Chat) */}
            <div className="fixed bottom-24 right-6 z-50 group">
                <div className="absolute -top-10 right-0 opacity-0 group-hover:opacity-100 transition-all pointer-events-none whitespace-nowrap bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg">
                    Nhập dữ liệu Excel nhanh
                </div>
                <Button
                    onClick={() => document.getElementById("excel-import-input").click()}
                    variant="outline"
                    size="icon"
                    className="h-12 w-12 rounded-full border-2 border-indigo-200 bg-white hover:bg-indigo-50 shadow-xl shadow-indigo-100 flex items-center justify-center transition-all hover:-translate-y-1 active:scale-95"
                >
                    <FileSpreadsheet className="h-6 w-6 text-indigo-600" />
                </Button>
            </div>

            {/* Header / Summary Card */}
            <div className="bg-white border border-slate-200 rounded-2xl shadow-sm p-6 overflow-hidden">
                <div className="flex flex-col gap-6">
                    {/* Top Row: Back & Actions */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <button
                                onClick={onBack}
                                className="flex items-center gap-2 px-3 py-1.5 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all text-sm font-bold group"
                            >
                                <ChevronLeft className="h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
                                Quay lại
                            </button>
                            <div className="h-4 w-px bg-slate-200 hidden sm:block" />
                            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">
                                CHI TIẾT BẢNG LƯƠNG HÀNG THÁNG THEO NHÂN SỰ
                            </h1>
                        </div>

                        <div className="flex flex-wrap items-center gap-2">
                            {isEditingHeader ? (
                                <>
                                    <Button
                                        onClick={handleSave}
                                        loading={actionLoading}
                                        className="gap-2 bg-indigo-600 hover:bg-indigo-700 px-6"
                                    >
                                        Lưu thay đổi
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={() => setIsEditingHeader(false)}
                                        className="border-slate-300"
                                    >
                                        Hủy
                                    </Button>
                                </>
                            ) : (
                                payroll?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                    <Button
                                        variant="outline"
                                        className="gap-2 border-slate-300 hover:bg-slate-50 px-4"
                                        onClick={startEditing}
                                    >
                                        <Pencil className="h-3.5 w-3.5" /> Chỉnh sửa
                                    </Button>
                                )
                            )}

                            {!isEditingHeader && (
                                <>
                                    {payroll?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                        <Button
                                            onClick={() => onApproval(payroll, "submit")}
                                            className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm shadow-blue-100"
                                        >
                                            <Send className="h-3.5 w-3.5" /> Gửi phê duyệt
                                        </Button>
                                    )}

                                    {payroll?.payrollStatus === "APPROVED" && authService.hasPermission("PAYROLL_LOCK") && (
                                        <Button
                                            onClick={() => onApproval(payroll, "lock")}
                                            className="gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-sm shadow-indigo-200"
                                        >
                                            <Lock className="h-3.5 w-3.5" /> Chốt bảng lương
                                        </Button>
                                    )}

                                    {payroll?.payrollStatus === "LOCKED" && authService.hasPermission("PAYROLL_LOCK") && (
                                        <Button
                                            onClick={() => onApproval(payroll, "unlock")}
                                            variant="outline"
                                            className="gap-2 text-amber-600 border-amber-200 hover:bg-amber-50"
                                        >
                                            <Unlock className="h-3.5 w-3.5" /> Mở khóa bảng lương
                                        </Button>
                                    )}

                                    {payroll?.payrollStatus === "PENDING_APPROVAL" && authService.hasPermission("PAYROLL_APPROVE") && (
                                        <div className="flex flex-wrap items-center gap-2 border-l-2 border-slate-100 pl-2">
                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onApproval(payroll, "approve")}
                                                    className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 font-bold"
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt cấp 1
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onApproval(payroll, "reject")}
                                                    className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 font-bold"
                                                >
                                                    <XCircle className="h-3.5 w-3.5" /> Từ chối
                                                </Button>
                                            </div>

                                            <div className="h-6 w-[1px] bg-slate-200 mx-1" />

                                            <div className="flex items-center gap-1.5">
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onApproval(payroll, "approve")}
                                                    className="gap-2 text-indigo-600 border-indigo-200 hover:bg-indigo-50 font-bold disabled:opacity-50"
                                                    disabled
                                                >
                                                    <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt cấp 2
                                                </Button>
                                                <Button
                                                    variant="outline"
                                                    onClick={() => onApproval(payroll, "reject")}
                                                    className="gap-2 text-rose-600 border-rose-200 hover:bg-rose-50 font-bold disabled:opacity-50"
                                                    disabled
                                                >
                                                    <XCircle className="h-3.5 w-3.5" /> Từ chối cấp 2
                                                </Button>
                                            </div>
                                        </div>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Metadata Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-6">
                        <SummaryField
                            label="Đơn vị"
                            name="unitName"
                            value={isEditingHeader ? formData.unitName : displayUnit}
                            icon={Building}
                            editable
                            isEditingHeader={isEditingHeader}
                            onChange={handleChange}
                        />
                        <SummaryField
                            label="Kỳ lương"
                            name="payrollMonth"
                            value={isEditingHeader ? formData.payrollMonth : `${payroll?.payrollMonth}/${payroll?.payrollYear}`}
                            icon={Calendar}
                            editable
                            isEditingHeader={isEditingHeader}
                            type="select"
                            onChange={handleChange}
                        />
                        <SummaryField label="Trạng thái" value={status?.label || "Nháp"} icon={Clock} />
                        <SummaryField
                            label="Tên bảng lương"
                            value={`Bảng lương ${isEditingHeader ? formData.unitName : displayUnit} tháng ${activeMonth}/${activeYear}`}
                        />

                        <SummaryField
                            label="Tên người liên hệ"
                            name="contactName"
                            value={isEditingHeader ? formData.contactName : displayContactName}
                            icon={User}
                            editable
                            isEditingHeader={isEditingHeader}
                            onChange={handleChange}
                        />
                        <SummaryField
                            label="SĐT liên hệ"
                            name="contactPhone"
                            value={isEditingHeader ? formData.contactPhone : displayContactPhone}
                            icon={Phone}
                            editable
                            isEditingHeader={isEditingHeader}
                            onChange={handleChange}
                        />
                        <SummaryField
                            label="Email liên hệ"
                            name="contactEmail"
                            value={isEditingHeader ? formData.contactEmail : displayContactEmail}
                            icon={Mail}
                            editable
                            isEditingHeader={isEditingHeader}
                            onChange={handleChange}
                        />
                        <SummaryField
                            label="Ngày chi trả"
                            name="paymentDate"
                            value={isEditingHeader ? formData.paymentDate : displayPaymentDate}
                            icon={Calendar}
                            type="date"
                            editable
                            isEditingHeader={isEditingHeader}
                            onChange={handleChange}
                        />
                    </div>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-slate-200 flex items-center gap-1 overflow-x-auto scroller-hidden">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`px-6 py-4 text-sm font-bold transition-all relative whitespace-nowrap ${activeTab === tab.id
                            ? "text-indigo-600 border-b-4 border-indigo-600"
                            : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                            }`}
                    >
                        {tab.label}
                        {activeTab === tab.id && (
                            <span className="absolute bottom-0 left-0 right-0 h-1 bg-indigo-600 rounded-t-full" />
                        )}
                    </button>
                ))}
            </div>

            {/* Tab Panels */}
            <div className="min-h-[400px]">
                {activeTab === "data" && (
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-400">
                        <Section
                            id="timesheet"
                            title="Thông tin bảng chấm công"
                            icon={Clock}
                            isOpen={openSections.timesheet}
                            onToggle={toggleSection}
                        >
                            {/* ── Static Header Block ── */}
                            <div className="bg-white z-[0] border-b border-slate-200 shadow-sm px-4 pt-3 pb-2 space-y-3 -mx-4 -mt-4 mb-4 rounded-t-xl">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${isEditingData ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                        onClick={handleToggleEditData}
                                        disabled={isSaving}
                                    >
                                        {isSaving ? (
                                            <RefreshCw className="h-3 w-3 animate-spin" />
                                        ) : (
                                            <Pencil className="h-3 w-3" />
                                        )}
                                        {isEditingData ? (isSaving ? 'Đang lưu...' : 'Lưu thay đổi') : 'Chỉnh sửa'}
                                    </button>
                                    <button
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                                        onClick={handleOpenAddModal}
                                    >
                                        <Plus className="h-3 w-3" /> Thêm nhân sự
                                    </button>
                                    <button
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100 transition-colors"
                                        onClick={() => handleRefreshSection("timesheet")}
                                    >
                                        <RefreshCw className={`h-3 w-3 ${isRefreshing ? 'animate-spin' : ''}`} /> Làm mới bảng
                                    </button>
                                    {payroll?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                        <button
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                                            onClick={() => onCalculate({ ...payroll, payrollMonth: activeMonth, payrollYear: activeYear })}
                                            disabled={actionLoading}
                                        >
                                            <RefreshCw className={`h-3 w-3 ${actionLoading ? 'animate-spin' : ''}`} /> Cập nhật lại & Tính lương
                                        </button>
                                    )}
                                    <label
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer"
                                        onClick={() => document.getElementById("excel-import-input").click()}
                                    >
                                        <Upload className="h-3 w-3" /> Import
                                    </label>
                                    <button
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                                        onClick={handleExportExcel}
                                    >
                                        <Download className="h-3 w-3" /> Xuất Excel
                                    </button>
                                    <div className="ml-auto flex items-center gap-1">
                                        <button
                                            className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                            title="Làm mới"
                                            onClick={() => handleRefreshSection("timesheet")}
                                        >
                                            <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                        </button>
                                        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Toàn màn hình">
                                            <Maximize2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Cài đặt">
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="text-[13px] font-bold text-slate-500 uppercase tracking-tight">
                                        📊 <span className="text-indigo-600">Tổng cộng: {filteredTimesheetData?.length || 0} nhân sự</span>
                                    </div>
                                    <div className="relative w-full sm:w-[320px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm nhanh tên, mã nhân sự..."
                                            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all bg-slate-50/50"
                                            value={tsSearch}
                                            onChange={(e) => setTsSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* ── Timesheet Table ── */}
                            {timesheetLoading ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-3">
                                    <div className="animate-spin h-6 w-6 border-2 border-indigo-500 border-t-transparent rounded-full" />
                                    <p className="text-xs text-slate-400 font-medium italic">Đang đồng bộ dữ liệu từ bảng chấm công...</p>
                                </div>
                            ) : (
                                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
                                    <div className={`overflow-x-auto max-h-[600px] ${isRefreshing ? 'opacity-50 pointer-events-none' : ''} transition-opacity duration-300`}>
                                        <table className="w-full text-[12px] border-collapse min-w-[2000px]">
                                            <colgroup>
                                                <col style={{ width: "40px" }} />
                                                <col style={{ width: "80px" }} />
                                                <col style={{ width: "180px" }} />
                                                <col style={{ width: "120px" }} />
                                                <col style={{ width: "100px" }} />
                                                <col style={{ width: "140px" }} />
                                                <col style={{ width: "120px" }} />
                                                <col style={{ width: "120px" }} />
                                                <col style={{ width: "120px" }} />
                                                <col style={{ width: "100px" }} />
                                                <col style={{ width: "180px" }} />
                                                <col style={{ width: "100px" }} />
                                                <col style={{ width: "220px" }} />
                                                <col style={{ width: "120px" }} />
                                                <col style={{ width: "120px" }} />
                                                <col style={{ width: "120px" }} />
                                                <col style={{ width: "140px" }} />
                                                <col style={{ width: "100px" }} />
                                                <col style={{ width: "50px" }} />
                                            </colgroup>
                                            <thead className="z-0 border-b border-slate-200 shadow-sm">
                                                <tr className="bg-slate-50 text-slate-600 font-bold divide-x divide-slate-200 border-b border-slate-200 uppercase text-[10px]">
                                                    <th rowSpan={2} className="sticky left-0 bg-slate-50 z-40 px-2 py-3 text-center border-r border-slate-200">STT</th>
                                                    <th rowSpan={2} className="sticky left-[40px] bg-slate-50 z-40 px-3 py-3 border-r border-slate-200">Mã nhân sự</th>
                                                    <th rowSpan={2} className="sticky left-[120px] bg-slate-50 z-40 px-3 py-3 border-r border-slate-200">Tên nhân sự</th>
                                                    <th rowSpan={2} className="px-3 py-3 text-right bg-amber-50/50 text-amber-700 min-w-[130px] font-bold border-r border-slate-200 uppercase text-[9px] tracking-tight">Lương cơ bản (Hợp đồng)</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[100px]">Số ngày công chuẩn</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[150px]">Tổng công trong tháng</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[100px]">Ngày công chính thức</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[100px]">Ngày công thử việc</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[120px]">Công tác hoặc đi học</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[80px]">Nghỉ lễ</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[150px]">Nghỉ chế độ hưởng nguyên lương</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[100px]">Nghỉ phép</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[150px] text-[11px]">Nghỉ không lương/ nghỉ hưởng BHXH</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[100px]">Nghỉ chờ việc</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[100px]">Tổng cộng ăn</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[120px]">Ngày phép đã dùng</th>
                                                    <th className="px-3 py-3 text-center bg-slate-50 min-w-[80px]">Phép tồn</th>
                                                    <th rowSpan={2} className="sticky right-0 bg-slate-50 z-40 px-2 py-3 border-l border-slate-200"></th>
                                                </tr>
                                                <tr className="bg-slate-50/90 text-[10px] text-slate-400 font-medium divide-x divide-slate-200 border-b border-slate-200">
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-red-500">1</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 italic text-[9px] border-r text-blue-600">=(3+4+5+6+7+8)</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">3</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">4</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">5</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">6</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">7</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">8</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">9</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-slate-600">10</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-slate-900">11</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold border-r text-blue-500">12</th>
                                                    <th className="px-2 py-1 text-center bg-slate-50/90 font-bold text-blue-500">13</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-200">
                                                {groupedTimesheetData.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={21} className="py-20 text-center bg-slate-50/5">
                                                            <div className="flex flex-col items-center justify-center text-slate-400">
                                                                <FileText className="h-8 w-8 text-slate-200 mb-2" />
                                                                <p className="text-sm italic font-medium text-slate-400">Không tìm thấy dữ liệu chấm công cho kỳ lương này.</p>
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : groupedTimesheetData.map((group, gIdx) => {
                                                    const isCollapsed = collapsedGroups.has(group.departmentName);
                                                    return (
                                                        <React.Fragment key={group.departmentName}>
                                                            {/* Department Header Row */}
                                                            <tr
                                                                className="bg-slate-50/80 font-bold text-indigo-700 cursor-pointer hover:bg-slate-100 transition-colors"
                                                                onClick={() => toggleGroup(group.departmentName)}
                                                            >
                                                                <td colSpan={4} className="sticky left-0 bg-slate-50 z-20 px-4 py-2 border-r border-slate-200">
                                                                    <div className="flex items-center gap-2">
                                                                        {isCollapsed ? (
                                                                            <ChevronRight className="h-4 w-4 text-slate-400" />
                                                                        ) : (
                                                                            <ChevronDown className="h-4 w-4 text-slate-400" />
                                                                        )}
                                                                        <div className="h-1.5 w-1.5 rounded-full bg-indigo-500"></div>
                                                                        {group.departmentName}
                                                                        <span className="ml-2 text-[10px] text-slate-400 font-normal">({group.items.length})</span>
                                                                    </div>
                                                                </td>
                                                                <td colSpan={14} className="bg-slate-50/80"></td>
                                                            </tr>

                                                            {/* Employee Rows */}
                                                            {!isCollapsed && group.items.map((item, idx) => {
                                                                const detail = payroll?.details?.find(d => d.employeeId === item.id);
                                                                return (
                                                                    <tr key={item.id} className="hover:bg-slate-50/50 transition-colors divide-x divide-slate-100 group">
                                                                        <td className="sticky left-0 bg-white group-hover:bg-slate-100 z-10 px-2 py-2.5 text-center text-slate-400 border-r border-slate-100 italic">{idx + 1}</td>
                                                                        <td className="sticky left-[40px] bg-white group-hover:bg-slate-100 z-10 px-3 py-2.5 font-bold text-slate-700 border-r border-slate-100">{item.employeeCode || "—"}</td>
                                                                        <td className="sticky left-[120px] bg-white group-hover:bg-slate-100 z-10 px-3 py-2.5 font-medium text-slate-900 border-r border-slate-100">{item.fullName || "—"}</td>
                                                                        <td className="px-3 py-2.5 text-right font-black text-amber-600 bg-amber-50/20 border-r border-slate-100 italic transition-colors">
                                                                            {new Intl.NumberFormat('vi-VN').format(item.baseSalary || 0)}
                                                                        </td>

                                                                        <td className="px-3 py-2.5 text-center font-semibold text-slate-600">
                                                                            {isEditingData ? (
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    className="w-16 px-1 py-0.5 border border-indigo-300 rounded text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                                    value={item.standardDays || 26}
                                                                                    onChange={(e) => handleTimesheetChange(item.id, 'standardDays', e.target.value)}
                                                                                />
                                                                            ) : (
                                                                                Number(item.standardDays || detail?.standardDays || 26)
                                                                            )}
                                                                        </td>

                                                                        <td className="px-3 py-2.5 text-center">
                                                                            <span className="bg-indigo-50 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                                                                                {Number(item.totalMonthlyDays || 0)}
                                                                            </span>
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center font-semibold text-emerald-600">
                                                                            {isEditingData ? (
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    className="w-16 px-1 py-0.5 border border-emerald-300 rounded text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                                    value={item.officialDays || 0}
                                                                                    onChange={(e) => handleTimesheetChange(item.id, 'officialDays', e.target.value)}
                                                                                />
                                                                            ) : (
                                                                                Number(item.officialDays || detail?.officialDays || 0)
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600">
                                                                            {isEditingData ? (
                                                                                <input
                                                                                    type="number"
                                                                                    min={0}
                                                                                    className="w-16 px-1 py-0.5 border border-slate-300 rounded text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                                    value={item.probationDays || 0}
                                                                                    onChange={(e) => handleTimesheetChange(item.id, 'probationDays', e.target.value)}
                                                                                />
                                                                            ) : (
                                                                                Number(item.probationDays || detail?.probationDays || 0)
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 text-xs">{Number(item.businessTripDays || detail?.businessTripDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 font-medium">{Number(item.holidayDays || detail?.holidayDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 italic">{Number(item.benefitLeaveDays || item.paidLeaveDays || detail?.benefitLeaveDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 italic">{Number(item.annualLeaveDays || detail?.annualLeaveDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-red-500 font-bold">-{Number(item.unpaidLeaveDays || detail?.unpaidLeaveDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-400 italic">{Number(item.waitingDays || detail?.waitingDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-800 font-bold bg-slate-50/50">{item.mealCount || detail?.mealCount || 0}</td>
                                                                        <td className="px-3 py-2.5 text-center text-indigo-600">{item.usedLeaveDays || detail?.usedLeaveDays || 0}</td>
                                                                        <td className="px-3 py-2.5 text-center text-indigo-600 font-extrabold">{item.remainingLeaveDays || detail?.remainingLeaveDays || 0}</td>
                                                                        <td className="sticky right-0 bg-white group-hover:bg-slate-100 z-10 px-2 py-2.5 border-l border-slate-100 text-center">
                                                                            <button className="p-1.5 text-red-100 hover:text-red-500 transition-colors">
                                                                                <Trash2 className="h-4 w-4" />
                                                                            </button>
                                                                        </td>
                                                                    </tr>
                                                                );
                                                            })}
                                                        </React.Fragment>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </Section>
                        <Section
                            id="overtime"
                            title="Thông tin tăng ca"
                            icon={Clock}
                            isOpen={openSections.overtime}
                            onToggle={toggleSection}
                        >
                            {/* ── Consolidated Header Block ── */}
                            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[30] border-b border-slate-200 shadow-sm transition-all duration-300 px-4 pt-3 pb-2 space-y-3 -mx-4 -mt-4 mb-4 rounded-t-xl">
                                <div className="flex flex-wrap items-center gap-2">
                                    <button
                                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors ${isEditingData ? 'border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100' : 'border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100'}`}
                                        onClick={handleToggleEditData}
                                        disabled={isSaving}
                                    >
                                        <Pencil className="h-3 w-3" />
                                        {isEditingData ? (isSaving ? 'Đang lưu...' : 'Lưu thay đổi') : 'Chỉnh sửa'}
                                    </button>
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Upload className="h-3 w-3" /> Import
                                    </button>
                                    {payroll?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                        <button
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                                            onClick={() => onCalculate({ ...payroll, payrollMonth: activeMonth, payrollYear: activeYear })}
                                            disabled={actionLoading}
                                        >
                                            <RefreshCw className={`h-3 w-3 ${actionLoading ? 'animate-spin' : ''}`} /> Cập nhật lại & Tính lương
                                        </button>
                                    )}
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                                        <Download className="h-3 w-3" /> Xuất Excel
                                    </button>
                                    <div className="ml-auto flex items-center gap-1">
                                        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Làm mới">
                                            <RefreshCw className="h-3.5 w-3.5" />
                                        </button>
                                        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Toàn màn hình">
                                            <Maximize2 className="h-3.5 w-3.5" />
                                        </button>
                                        <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Cài đặt">
                                            <Settings className="h-3.5 w-3.5" />
                                        </button>
                                    </div>
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="text-[13px] font-bold text-slate-500 uppercase tracking-tight">
                                        📊 <span className="text-indigo-600">Tổng cộng: {filteredOvertimeData?.length || 0} nhân sự</span>
                                    </div>
                                    <div className="relative w-full sm:w-[320px]">
                                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            placeholder="Tìm kiếm nhanh nhân sự tăng ca..."
                                            className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all bg-slate-50/50"
                                            value={otSearch}
                                            onChange={(e) => setOtSearch(e.target.value)}
                                        />
                                    </div>
                                </div>
                            </div>

                            <OvertimeMatrixTable
                                timesheets={filteredOvertimeData}
                                payrollDetails={payroll?.details || []}
                                loading={timesheetLoading}
                                isEditing={isEditingData}
                                onChange={handleTimesheetChange}
                            />
                        </Section>
                        <Section
                            id="input"
                            title="Thông tin nhập liệu"
                            icon={FileText}
                            isOpen={openSections.input}
                            onToggle={toggleSection}
                        >
                            <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                {/* <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                                    <Pencil className="h-3 w-3" /> Chỉnh sửa hàng loạt
                                </button> */}
                                {/* <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
                                    <Upload className="h-3 w-3" /> Import Excel
                                </button> */}
                                {canEdit && payroll?.payrollStatus === "DRAFT" && (
                                    <button
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors shadow-sm"
                                        onClick={handleSaveInputRows}
                                        disabled={isSaving}
                                    >
                                        <CheckCircle2 className={`h-3 w-3 ${isSaving ? 'animate-spin' : ''}`} /> Lưu tất cả thay đổi
                                    </button>
                                )}
                                <div className="ml-auto flex items-center gap-1">
                                    <button
                                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                        title="Làm mới"
                                        onClick={() => handleRefreshSection("input")}
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                </div>
                            </div>

                            {/* ── Search & Summary ── */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="text-[13px] font-bold text-slate-500 uppercase tracking-tight">
                                    📊 <span className="text-indigo-600">Tổng cộng: {inputRows.length} nhân sự trong danh sách nhập liệu</span>
                                </div>
                                <div className="relative w-full sm:w-[320px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm nhanh nhân sự..."
                                        className="w-full pl-9 pr-4 py-1.5 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all bg-slate-50/50"
                                        value={inputSearch}
                                        onChange={(e) => setInputSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${isRefreshing ? 'opacity-50' : ''} transition-opacity`}>
                                <div className="overflow-x-auto scroller-thick">
                                    <table className="w-full text-[12px] border-collapse min-w-[2200px]">
                                        <thead>
                                            <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200 uppercase text-[10px]">
                                                <th className="px-3 py-3 text-center w-[50px] sticky left-0 bg-slate-50 z-20">STT</th>
                                                <th className="px-3 py-3 text-left w-[100px] sticky left-[50px] bg-slate-50 z-20">Mã NV</th>
                                                <th className="px-3 py-3 text-left w-[200px] sticky left-[150px] bg-slate-50 z-20 border-r border-slate-200">Họ tên nhân sự</th>

                                                {/* Attendance Group */}
                                                <th colSpan={3} className="px-3 py-3 text-center bg-blue-50/50 text-blue-700 border-r border-slate-200 italic">Dữ liệu công (Tham chiếu)</th>

                                                {/* P2 từ employee_salaries & performance_reviews */}
                                                <th className="px-3 py-3 text-right w-[130px] bg-amber-50 text-amber-800">Lương P2</th>
                                                <th className="px-3 py-3 text-center w-[90px] bg-amber-50 text-amber-800">% KPI</th>
                                                <th className="px-3 py-3 text-center w-[90px] bg-indigo-50 text-indigo-700">% P2.1</th>
                                                <th className="px-3 py-3 text-center w-[90px] bg-indigo-50 text-indigo-700">% P2.2</th>
                                                <th className="px-3 py-3 text-right w-[130px] bg-indigo-50 text-indigo-700">Thưởng P2.1</th>
                                                <th className="px-3 py-3 text-right w-[130px] bg-indigo-50 text-indigo-700">Khoán P2.2</th>
                                                <th className="px-3 py-3 text-right w-[130px] bg-emerald-50 text-emerald-700">Thưởng P3</th>
                                                <th className="px-3 py-3 text-right w-[130px] bg-emerald-50 text-emerald-700">Phụ cấp</th>
                                                <th className="px-3 py-3 text-right w-[130px] bg-rose-50 text-rose-700">Phạt</th>
                                                <th className="px-3 py-3 text-right w-[130px] bg-rose-50 text-rose-700">K.Trừ khác</th>
                                                {/* Insurance rates cố định */}
                                                <th className="px-3 py-3 text-right w-[100px] bg-rose-100/50 text-rose-900">% BHXH</th>
                                                <th className="px-3 py-3 text-right w-[100px] bg-rose-100/50 text-rose-900">% BHYT</th>
                                                <th className="px-3 py-3 text-right w-[100px] bg-rose-100/50 text-rose-900">% BHTN</th>
                                                <th className="px-3 py-3 text-right w-[100px] bg-rose-100/50 text-rose-900">% KPCĐ</th>
                                                <th className="px-3 py-3 text-right w-[130px] bg-rose-200/50 text-rose-950 font-black">Thuế TNCN</th>
                                                <th className="px-3 py-3 text-left">Ghi chú</th>
                                            </tr>
                                            <tr className="bg-slate-50/50 text-[9px] text-slate-400 divide-x divide-slate-100 border-b border-slate-200">
                                                <th colSpan={3} className="sticky left-0 bg-slate-50/50 z-20 border-r border-slate-200"></th>
                                                <th className="px-2 py-1 text-center bg-blue-50/20">Công chuẩn</th>
                                                <th className="px-2 py-1 text-center bg-blue-50/20">Chính thức</th>
                                                <th className="px-2 py-1 text-center bg-blue-50/20 border-r border-slate-200">Thử việc</th>
                                                <th className="px-2 py-1 text-center italic bg-amber-50/20">(VND)</th>
                                                <th className="px-2 py-1 text-center italic bg-amber-50/20">(kpiScore/10)</th>
                                                <th className="px-2 py-1 text-center italic bg-indigo-50/20">(1.1-1.5)</th>
                                                <th className="px-2 py-1 text-center italic bg-indigo-50/20">(2.1)</th>
                                                <th className="px-2 py-1 text-center italic bg-indigo-50/20">(P2×%÷100)</th>
                                                <th className="px-2 py-1 text-center italic bg-indigo-50/20">(P2×%÷100)</th>
                                                <th className="px-2 py-1 text-center italic bg-emerald-50/20">(36.1)</th>
                                                <th className="px-2 py-1 text-center italic bg-emerald-50/20">(43)</th>
                                                <th className="px-2 py-1 text-center italic bg-rose-50/20">(65)</th>
                                                <th className="px-2 py-1 text-center italic bg-rose-50/20">(K.Trừ)</th>
                                                <th className="px-2 py-1 text-center italic bg-rose-100/30">(BHXH)</th>
                                                <th className="px-2 py-1 text-center italic bg-rose-100/30">(BHYT)</th>
                                                <th className="px-2 py-1 text-center italic bg-rose-100/30">(BHTN)</th>
                                                <th className="px-2 py-1 text-center italic bg-rose-100/30">(KPCĐ)</th>
                                                <th className="px-2 py-1 text-center italic bg-rose-200/30">(Thuế)</th>
                                                <th className=""></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-slate-100">
                                            {inputRows.length > 0 ? inputRows.filter(r =>
                                                r.employeeCode?.toLowerCase().includes(inputSearch.toLowerCase()) ||
                                                r.fullName?.toLowerCase().includes(inputSearch.toLowerCase()) ||
                                                r.departmentName?.toLowerCase().includes(inputSearch.toLowerCase())
                                            ).map((row, idx) => (
                                                <tr key={row.id} className="hover:bg-slate-50/50 transition-colors group">
                                                    <td className="px-3 py-2 text-center text-slate-400 sticky left-0 bg-white group-hover:bg-slate-50 z-10">{idx + 1}</td>
                                                    <td className="px-3 py-2 font-bold text-slate-700 sticky left-[50px] bg-white group-hover:bg-slate-50 z-10">{row.employeeCode}</td>
                                                    <td className="px-3 py-2 font-medium text-slate-900 sticky left-[150px] bg-white group-hover:bg-slate-50 z-10 border-r border-slate-100">{row.fullName}</td>

                                                    {/* Attendance Reference */}
                                                    <td className="px-3 py-2 text-center text-slate-500 bg-blue-50/10">{row.standardDays}</td>
                                                    <td className="px-3 py-2 text-center font-bold text-blue-600 bg-blue-50/10">{row.officialDays}</td>
                                                    <td className="px-3 py-2 text-center text-slate-400 bg-blue-50/10 border-r border-slate-100">{row.probationDays}</td>

                                                    {/* Lương P2 (từ employee_salaries.performanceSalary) */}
                                                    <td className="px-3 py-2 bg-amber-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-amber-50 border border-amber-200 rounded text-right py-1 px-2 font-bold text-amber-700 outline-none cursor-not-allowed"
                                                            value={row.performanceSalary ?? 0}
                                                        />
                                                    </td>
                                                    {/* % KPI (từ performance_reviews.kpiScore / 10 * 100) */}
                                                    <td className="px-3 py-2 bg-amber-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-amber-50 border border-amber-200 rounded text-center py-1 font-bold text-amber-700 outline-none cursor-not-allowed"
                                                            value={row.kpiPercent ?? 0}
                                                        />
                                                    </td>
                                                    {/* % P2.1 (từ performance_reviews, đã tính %) */}
                                                    <td className="px-3 py-2 bg-indigo-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-indigo-50 border border-indigo-200 rounded text-center py-1 font-black text-indigo-600 outline-none cursor-not-allowed"
                                                            value={row.p1p2Percentage ?? 0}
                                                        />
                                                    </td>
                                                    {/* % P2.2 (từ performance_reviews, đã tính %) */}
                                                    <td className="px-3 py-2 bg-indigo-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-indigo-50 border border-indigo-200 rounded text-center py-1 font-black text-indigo-600 outline-none cursor-not-allowed"
                                                            value={row.p3Percentage ?? 0}
                                                        />
                                                    </td>
                                                    {/* Thưởng P2.1 thực = performanceSalary × %P2.1 / 100 × hệ số ngày công */}
                                                    <td className="px-3 py-2 bg-indigo-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-indigo-50 border border-indigo-200 rounded text-right py-1 px-2 font-bold text-indigo-700 outline-none cursor-not-allowed"
                                                            value={(row.p21Actual ?? 0).toFixed(2)}
                                                        />
                                                    </td>
                                                    {/* Khoán P2.2 thực = performanceSalary × %P2.2 / 100 × hệ số ngày công */}
                                                    <td className="px-3 py-2 bg-indigo-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-indigo-50 border border-indigo-200 rounded text-right py-1 px-2 font-bold text-indigo-700 outline-none cursor-not-allowed"
                                                            value={(row.p22Actual ?? 0).toFixed(2)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 bg-slate-50/50">
                                                        <input
                                                            type="number"
                                                            disabled
                                                            className="w-full bg-slate-100/50 border border-slate-200 rounded text-right py-1 px-2 font-bold text-slate-400 outline-none cursor-not-allowed"
                                                            value={row.bonus ?? 0}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 bg-emerald-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            className="w-full bg-white border border-emerald-200 rounded text-right py-1 px-2 font-bold text-emerald-700 focus:ring-2 focus:ring-emerald-500 outline-none"
                                                            value={row.allowanceAmount ?? 0}
                                                            onChange={(e) => handleInputRowChange(row.id, 'allowanceAmount', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 bg-rose-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            className="w-full bg-white border border-rose-200 rounded text-right py-1 px-2 font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 outline-none"
                                                            value={row.penalty ?? 0}
                                                            onChange={(e) => handleInputRowChange(row.id, 'penalty', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 bg-rose-50/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            className="w-full bg-white border border-rose-200 rounded text-right py-1 px-2 font-bold text-rose-600 focus:ring-2 focus:ring-rose-500 outline-none"
                                                            value={row.deduction ?? 0}
                                                            onChange={(e) => handleInputRowChange(row.id, 'deduction', e.target.value)}
                                                        />
                                                    </td>
                                                    {/* % BHXH (cố định - không chỉnh sửa) */}
                                                    <td className="px-3 py-2 bg-rose-100/10">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-rose-50 border border-rose-200 rounded text-center py-1 font-bold text-rose-800 outline-none cursor-not-allowed"
                                                            value={row.socialInsurancePercentage ?? 8}
                                                        />
                                                    </td>
                                                    {/* % BHYT (cố định - không chỉnh sửa) */}
                                                    <td className="px-3 py-2 bg-rose-100/10">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-rose-50 border border-rose-200 rounded text-center py-1 font-bold text-rose-800 outline-none cursor-not-allowed"
                                                            value={row.healthInsurancePercentage ?? 1.5}
                                                        />
                                                    </td>
                                                    {/* % BHTN (cố định - không chỉnh sửa) */}
                                                    <td className="px-3 py-2 bg-rose-100/10">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-rose-50 border border-rose-200 rounded text-center py-1 font-bold text-rose-800 outline-none cursor-not-allowed"
                                                            value={row.unemploymentInsurancePercentage ?? 1}
                                                        />
                                                    </td>
                                                    {/* % KPCĐ (cố định - không chỉnh sửa) */}
                                                    <td className="px-3 py-2 bg-rose-100/10">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            disabled
                                                            className="w-full bg-rose-50 border border-rose-200 rounded text-center py-1 font-bold text-rose-800 outline-none cursor-not-allowed"
                                                            value={row.unionFeePercentage ?? 0}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2 bg-rose-200/20">
                                                        <input
                                                            type="number"
                                                            step="0.01"
                                                            min={0}
                                                            className="w-full bg-white border border-rose-300 rounded text-right py-1 px-2 font-black text-rose-950 focus:ring-2 focus:ring-rose-500 outline-none"
                                                            value={row.taxDeduction ?? 0}
                                                            onChange={(e) => handleInputRowChange(row.id, 'taxDeduction', e.target.value)}
                                                        />
                                                    </td>
                                                    <td className="px-3 py-2">
                                                        <input
                                                            className="w-full bg-transparent border-b border-transparent focus:border-slate-300 outline-none p-1 text-slate-500 italic text-[11px]"
                                                            placeholder="Ghi chú..."
                                                            value={row.note || ""}
                                                            onChange={(e) => handleInputRowChange(row.id, 'note', e.target.value)}
                                                        />
                                                    </td>
                                                </tr>
                                            )) : (
                                                <tr className="hover:bg-slate-50/30 transition-colors">
                                                    <td colSpan={10} className="px-4 py-12 text-center text-slate-400 italic">
                                                        <div className="flex flex-col items-center gap-2">
                                                            <Pencil className="h-6 w-6 opacity-20" />
                                                            Đang tải dữ liệu nhập liệu matrix...
                                                        </div>
                                                    </td>
                                                </tr>
                                            )}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        </Section>
                        <Section
                            id="files"
                            title="File đính kèm"
                            icon={Paperclip}
                            isOpen={openSections.files}
                            onToggle={toggleSection}
                        >
                            <div className="flex flex-col items-center justify-center py-12 border-2 border-dashed border-slate-100 rounded-2xl bg-slate-50/30">
                                <Paperclip className="h-8 w-8 text-slate-300 mb-3" />
                                <p className="text-slate-400 text-sm font-medium italic">Kéo thả file vào đây (PDF, XLSX, DOCX)</p>
                            </div>
                        </Section>
                        <Section
                            id="history"
                            title="Lịch sử chỉnh sửa"
                            icon={History}
                            isOpen={openSections.history}
                            onToggle={toggleSection}
                        >
                            <div className="space-y-4">
                                <div className="flex gap-4 p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                                    <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 text-xs font-bold ring-4 ring-white shadow-sm">A</div>
                                    <div>
                                        <p className="text-sm font-bold text-slate-800">Admin đã khởi tạo bảng lương</p>
                                        <p className="text-xs text-slate-400 mt-0.5">Hôm nay lúc 14:30</p>
                                    </div>
                                </div>
                            </div>
                        </Section>
                    </div>
                )}

                {activeTab === "table" && (
                    <div className="animate-in fade-in slide-in-from-right-4 duration-400 space-y-0 relative">
                        {/* Static Header Box */}
                        <div className="bg-white z-[0] border-b border-slate-200 shadow-sm px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mx-6 -mt-6 mb-6 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-black text-indigo-950 tracking-tight">Bảng lương chi tiết nhân sự</h2>
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-0.5 italic">Dữ liệu tính toán dựa trên 3P framework</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {payroll?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                    <Button
                                        onClick={() => onCalculate({ ...payroll, payrollMonth: activeMonth, payrollYear: activeYear })}
                                        loading={actionLoading}
                                        className="gap-2 bg-amber-600 hover:bg-amber-700 shadow-lg shadow-amber-200/50 border-none px-6 font-bold"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
                                        Tính toán lại toàn bộ
                                    </Button>
                                )}
                                <Button
                                    variant="outline"
                                    className="gap-2 border-slate-200 text-slate-600 hover:bg-slate-50 transition-all font-bold px-6"
                                    onClick={handleExportExcel}
                                >
                                    <Download className="h-4 w-4" />
                                    Xuất Excel
                                </Button>
                                <div className="h-8 w-[1px] bg-slate-100 mx-1 hidden sm:block" />
                                <div className="flex items-center gap-1.5 p-1 bg-slate-50 rounded-lg border border-slate-100">
                                    <button
                                        onClick={() => handleRefreshSection("payroll")}
                                        className="p-2 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all"
                                    >
                                        <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button className="p-2 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                                        <Settings className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Table Container */}
                        <div className="bg-white rounded-2xl border border-slate-200 shadow-xl shadow-slate-200/40 overflow-hidden">
                            <SalaryDetailTable
                                details={fullPayrollDetails}
                                loading={detailLoading}
                                canEdit={canEdit && authService.hasPermission("PAYROLL_UPDATE")}
                                onUpdateDetail={onEditDetail}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "summary" && (
                    <SalarySummaryTable
                        details={fullPayrollDetails}
                        unitName={payroll?.unitName || "Testing"}
                    />
                )}

                {activeTab === "slips" && (() => {
                    const handleSendEmail = async (selectedDetailIds) => {
                        if (!selectedDetailIds || selectedDetailIds.length === 0) {
                            toast.error("Vui lòng chọn ít nhất một nhân sự để gửi phiếu lương.");
                            return;
                        }
                        const toastId = toast.loading(`Đang gửi ${selectedDetailIds.length} phiếu lương...`);
                        try {
                            const res = await payrollService.sendPayslipsSelected(payroll.id, selectedDetailIds);
                            const data = res?.data || res || {};
                            const sent = data.sent ?? 0;
                            const total = data.total ?? selectedDetailIds.length;
                            const failed = data.failed || [];

                            toast.dismiss(toastId);
                            if (sent === total) {
                                toast.success(`Đã gửi thành công ${sent}/${total} phiếu lương qua email!`);
                            } else if (sent > 0) {
                                toast.warning(
                                    `Đã gửi ${sent}/${total} phiếu lương. ${failed.length} nhân sự không có email hoặc gửi lỗi.`
                                );
                            } else {
                                toast.error(
                                    `Không gửi được phiếu lương. ${failed.map(f => f.name || f.email).join(', ')} — kiểm tra lại email nhân viên.`
                                );
                            }
                        } catch (err) {
                            toast.dismiss(toastId);
                            toast.error(err?.response?.data?.message || "Lỗi khi gửi phiếu lương. Vui lòng thử lại.");
                            console.error("[PayrollDetailView] sendPayslipsSelected error:", err);
                        }
                    };

                    return (
                        <PayrollSlipTable
                            details={fullPayrollDetails}
                            onSendEmail={handleSendEmail}
                            onRecalculate={() => onCalculate({ ...payroll, payrollMonth: activeMonth, payrollYear: activeYear })}
                            onUpdateDetail={onEditDetail}
                        />
                    );
                })()}

            </div>

            {/* Add Personnel Modal */}
            <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
                <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col p-0 overflow-hidden bg-white">
                    <DialogHeader className="px-6 py-4 border-b">
                        <DialogTitle className="text-xl font-bold text-slate-800">Thêm nhân sự vào bảng chấm công</DialogTitle>
                    </DialogHeader>

                    <div className="p-6 space-y-4 flex-1 overflow-hidden flex flex-col">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Tìm kiếm tên, mã nhân sự hoặc phòng ban..."
                                className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
                                value={empSearch}
                                onChange={(e) => setEmpSearch(e.target.value)}
                            />
                        </div>

                        <div className="flex-1 overflow-y-auto border rounded-xl divide-y divide-slate-100 min-h-[300px]">
                            {isFetchingEmployees ? (
                                <div className="flex flex-col items-center justify-center py-12 gap-3">
                                    <RefreshCw className="h-6 w-6 animate-spin text-indigo-500" />
                                    <p className="text-sm text-slate-400">Đang tải danh sách nhân sự...</p>
                                </div>
                            ) : availableEmployees.filter(emp =>
                                emp.fullName?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                emp.employeeCode?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                emp.departmentName?.toLowerCase().includes(empSearch.toLowerCase())
                            ).length === 0 ? (
                                <div className="py-12 text-center text-slate-400 italic">
                                    Không tìm thấy nhân sự phù hợp
                                </div>
                            ) : (
                                availableEmployees.filter(emp =>
                                    emp.fullName?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                    emp.employeeCode?.toLowerCase().includes(empSearch.toLowerCase()) ||
                                    emp.departmentName?.toLowerCase().includes(empSearch.toLowerCase())
                                ).map((emp) => (
                                    <div
                                        key={emp.id}
                                        className={`flex items-center gap-4 px-4 py-3 hover:bg-slate-50 transition-colors cursor-pointer ${selectedEmployeeIds.includes(emp.id) ? 'bg-indigo-50/50' : ''}`}
                                        onClick={() => {
                                            setSelectedEmployeeIds(prev =>
                                                prev.includes(emp.id)
                                                    ? prev.filter(id => id !== emp.id)
                                                    : [...prev, emp.id]
                                            );
                                        }}
                                    >
                                        <Checkbox
                                            checked={selectedEmployeeIds.includes(emp.id)}
                                            onCheckedChange={() => { }} // Handled by div onClick
                                        />
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-bold text-slate-700 truncate">{emp.fullName}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded">{emp.employeeCode}</span>
                                                <span className="text-[10px] text-slate-400 truncate">{emp.departmentName} — {emp.positionName}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        <div className="flex items-center justify-between text-xs text-slate-400 font-medium px-1">
                            <span>Đã chọn: <span className="text-indigo-600 font-bold">{selectedEmployeeIds.length}</span> nhân sự</span>
                            <button
                                className="text-indigo-600 hover:underline"
                                onClick={() => setSelectedEmployeeIds(availableEmployees.map(e => e.id))}
                            >
                                Chọn tất cả
                            </button>
                        </div>
                    </div>

                    <DialogFooter className="px-6 py-4 border-t bg-slate-50">
                        <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>Hủy</Button>
                        <Button
                            className="bg-indigo-600 hover:bg-indigo-700 font-bold"
                            onClick={handleConfirmAddPersonnel}
                            disabled={isSaving || selectedEmployeeIds.length === 0}
                        >
                            {isSaving ? <RefreshCw className="h-4 w-4 animate-spin mr-2" /> : <Plus className="h-4 w-4 mr-2" />}
                            Thêm vào danh sách
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
});

export default PayrollDetailView;
