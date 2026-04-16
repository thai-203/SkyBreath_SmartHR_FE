"use client";

import { Button } from "@/components/common/Button";
import { authService } from "@/services/auth.service";
import { payrollService } from "@/services/payroll.service";
import { timesheetsService } from "@/services/timesheets.service";
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
    User
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

const OvertimeMatrixTable = ({ timesheets = [], payrollDetails = [], loading = false }) => {
    const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Number(Math.round(n) || 0));

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
                            return (
                                <tr key={ts.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="px-2 py-3 text-center text-slate-400 border-r border-slate-50 sticky left-0 bg-white group-hover:bg-slate-50/50 z-[5]">{idx + 1}</td>
                                    <td className="px-3 py-3 border-r border-slate-50 text-slate-600 font-medium sticky left-[40px] bg-white group-hover:bg-slate-50/50 z-[5]">{ts.employeeCode}</td>
                                    <td className="px-4 py-3 border-r border-slate-200 font-bold text-slate-800 sticky left-[120px] bg-white group-hover:bg-slate-50/50 z-[5]">{ts.fullName}</td>
                                    <td className="px-3 py-3 border-r border-slate-50 text-slate-500 whitespace-nowrap overflow-hidden text-ellipsis max-w-[150px]">{ts.positionName || "—"}</td>
                                    <td className="px-4 py-3 border-r border-slate-100 text-slate-500 whitespace-nowrap font-medium">{ts.departmentName || "—"}</td>

                                    <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">{ts.otWeekday || 0}</td>
                                    <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">1.5</td>

                                    <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">{ts.otWeekdayNight || 0}</td>
                                    <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">2.1</td>

                                    <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">{ts.otWeekend || 0}</td>
                                    <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">2.0</td>

                                    <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">{ts.otWeekendNight || 0}</td>
                                    <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">2.7</td>

                                    <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">{ts.otHoliday || 0}</td>
                                    <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">3.0</td>

                                    <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600 bg-indigo-50/10">{ts.otHolidayNight || 0}</td>
                                    <td className="px-2 py-3 text-center border-r border-slate-50 text-slate-300">3.9</td>

                                    <td className="px-2 py-3 text-right border-r border-slate-50 text-slate-500 font-medium">{fmt(hourlyRate)}</td>
                                    <td className="px-2 py-3 text-center border-r border-slate-50 font-bold text-indigo-600">{ts.totalOtHours || 0}</td>
                                    <td className="px-3 py-3 text-right font-bold text-emerald-600 bg-emerald-50/30 whitespace-nowrap">{fmt(detail?.overtimePay || 0)}</td>
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

    const handleRefreshSection = (sectionId) => {
        setIsRefreshing(true);
        if (sectionId === "timesheet") {
            setTimesheetData(null);
        }
        setTimeout(() => setIsRefreshing(false), 800);
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
        XLSX.writeFile(wb, `Bang_Cham_Cong_${payroll?.payrollMonth || 'M'}_${payroll?.payrollYear || 'Y'}.xlsx`);
        toast.success("Đã xuất file Excel thành công");
    };

    const handleAddInputRow = () => {
        const newRow = {
            id: Date.now(),
            employeeCode: "",
            fullName: "",
            item: "Thưởng KPI",
            amount: 0,
            note: ""
        };
        setInputRows(prev => [...prev, newRow]);
    };

    const handleTimesheetChange = (id, field, value) => {
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
                    return {
                        id: detail.id,
                        standardDays: item.standardDays,
                        workingDays: item.workingDays,
                        officialDays: item.officialDays,
                        probationDays: item.probationDays,
                        businessTripDays: item.businessTripDays,
                        holidayDays: item.holidayDays,
                        benefitLeaveDays: item.benefitLeaveDays,
                    };
                }).filter(Boolean);

                if (updates.length > 0) {
                    // Update server records via service calls
                    await Promise.all(updates.map(u => payrollService.updateDetail(u.id, u)));
                    toast.success("Đã cập nhật thay đổi thành công.");
                    
                    // After saving, we trigger a calculation if it's draft, so net salaries are refreshed.
                    if (onCalculate && payroll?.payrollStatus === "DRAFT") {
                        onCalculate(payroll);
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
    const filteredTimesheetData = useMemo(() => {
        if (!timesheetData) return [];
        if (!tsSearch.trim()) return timesheetData;

        const term = tsSearch.toLowerCase();
        return timesheetData.filter(item =>
            item.fullName?.toLowerCase().includes(term) ||
            item.employeeCode?.toLowerCase().includes(term) ||
            item.departmentName?.toLowerCase().includes(term)
        );
    }, [timesheetData, tsSearch]);

    const filteredOvertimeData = useMemo(() => {
        if (!timesheetData) return [];
        if (!otSearch.trim()) return timesheetData;

        const term = otSearch.toLowerCase();
        return timesheetData.filter(item =>
            item.fullName?.toLowerCase().includes(term) ||
            item.employeeCode?.toLowerCase().includes(term)
        );
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
        if (activeTab === "data" && openSections.timesheet && !timesheetData && payroll) {
            const fetchTs = async () => {
                setTimesheetLoading(true);
                try {
                    const res = await timesheetsService.getSummaryMatrix({
                        month: payroll.payrollMonth,
                        year: payroll.payrollYear,
                        limit: 1000
                    });
                    setTimesheetData(res?.data?.items || res?.items || []);
                } catch (err) {
                    console.error("Error fetching timesheet data:", err);
                } finally {
                    setTimesheetLoading(false);
                }
            };
            fetchTs();
        }
    }, [activeTab, openSections.timesheet, payroll?.payrollMonth, payroll?.payrollYear]);

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
        : `05/${String((payroll?.payrollMonth || 0) % 12 + 1).padStart(2, '0')}/${(payroll?.payrollMonth === 12 ? (payroll?.payrollYear + 1) : payroll?.payrollYear) || ""}`;

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
            <div className="fixed bottom-24 right-6 z-40 group">
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
                                        <>
                                            <Button
                                                variant="outline"
                                                onClick={() => onApproval(payroll, "approve")}
                                                className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50"
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt cấp 1
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={() => onApproval(payroll, "approve")}
                                                className="gap-2 text-emerald-600 border-emerald-200 hover:bg-emerald-50 disabled:opacity-50"
                                                disabled
                                            >
                                                <CheckCircle2 className="h-3.5 w-3.5" /> Duyệt cấp 2
                                            </Button>
                                        </>
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
                            value={`Bảng lương ${isEditingHeader ? formData.unitName : displayUnit} tháng ${isEditingHeader ? formData.payrollMonth : (payroll?.payrollMonth)}/${payroll?.payrollYear}`}
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
                            {/* ── Section Toolbar ── */}
                            {/* ── Consolidated Header Block ── */}
                            <div className="sticky top-0 bg-white/95 backdrop-blur-md z-[30] border-b border-slate-200 shadow-sm transition-all duration-300 px-4 pt-3 pb-2 space-y-3 -mx-4 -mt-4 mb-4 rounded-t-xl">
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
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
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
                                            onClick={() => onCalculate(payroll)}
                                            disabled={actionLoading}
                                        >
                                            <RefreshCw className={`h-3 w-3 ${actionLoading ? 'animate-spin' : ''}`} /> Cập nhật lại & Tính lương
                                        </button>
                                    )}
                                    <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors cursor-pointer">
                                        <Upload className="h-3 w-3" /> Import
                                        <input type="file" className="hidden" accept=".xlsx, .xls" onChange={(e) => toast.info("Tính năng Import đang được phát triển")} />
                                    </label>
                                    <button
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-800 text-white hover:bg-slate-700 transition-colors"
                                        onClick={handleExportExcel}
                                    >
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
                                            <thead className="sticky top-0 z-30 shadow-sm">
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
                                                                                    className="w-16 px-1 py-0.5 border border-indigo-300 rounded text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                                    value={item.standardDays || 26}
                                                                                    onChange={(e) => handleTimesheetChange(item.id, 'standardDays', e.target.value)}
                                                                                />
                                                                            ) : (
                                                                                Number(detail?.standardDays || item.standardDays || 26)
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
                                                                                    className="w-16 px-1 py-0.5 border border-emerald-300 rounded text-center focus:ring-1 focus:ring-emerald-500 outline-none"
                                                                                    value={item.officialDays || 0}
                                                                                    onChange={(e) => handleTimesheetChange(item.id, 'officialDays', e.target.value)}
                                                                                />
                                                                            ) : (
                                                                                Number(detail?.officialDays || item.officialDays || 0)
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600">
                                                                            {isEditingData ? (
                                                                                <input
                                                                                    type="number"
                                                                                    className="w-16 px-1 py-0.5 border border-slate-300 rounded text-center focus:ring-1 focus:ring-indigo-500 outline-none"
                                                                                    value={item.probationDays || 0}
                                                                                    onChange={(e) => handleTimesheetChange(item.id, 'probationDays', e.target.value)}
                                                                                />
                                                                            ) : (
                                                                                Number(detail?.probationDays || item.probationDays || 0)
                                                                            )}
                                                                        </td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 text-xs">{Number(detail?.businessTripDays || item.businessTripDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 font-medium">{Number(detail?.holidayDays || item.holidayDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 italic">{Number(detail?.benefitLeaveDays || item.benefitLeaveDays || item.paidLeaveDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-600 italic">{Number(detail?.annualLeaveDays || item.annualLeaveDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-red-500 font-bold">-{Number(detail?.unpaidLeaveDays || item.unpaidLeaveDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-400 italic">{Number(detail?.waitingDays || item.waitingDays || 0)}</td>
                                                                        <td className="px-3 py-2.5 text-center text-slate-800 font-bold bg-slate-50/50">{detail?.mealCount || item.mealCount || 0}</td>
                                                                        <td className="px-3 py-2.5 text-center text-indigo-600">{detail?.usedLeaveDays || item.usedLeaveDays || 0}</td>
                                                                        <td className="px-3 py-2.5 text-center text-indigo-600 font-extrabold">{detail?.remainingLeaveDays || item.remainingLeaveDays || 0}</td>
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
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                                        <Pencil className="h-3 w-3" /> Chỉnh sửa
                                    </button>
                                    <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
                                        <Upload className="h-3 w-3" /> Import
                                    </button>
                                    {payroll?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                        <button
                                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-amber-200 bg-amber-50 text-amber-700 hover:bg-amber-100 transition-colors shadow-sm"
                                            onClick={() => onCalculate(payroll)}
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
                            />
                        </Section>
                        <Section
                            id="input"
                            title="Thông tin nhập liệu"
                            icon={FileText}
                            isOpen={openSections.input}
                            onToggle={toggleSection}
                        >
                            {/* ── Section Toolbar ── */}
                            <div className="flex flex-wrap items-center gap-2 mb-4 pb-3 border-b border-slate-100">
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-indigo-200 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors">
                                    <Pencil className="h-3 w-3" /> Chỉnh sửa
                                </button>
                                <button
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors"
                                    onClick={handleAddInputRow}
                                >
                                    <Plus className="h-3 w-3" /> Thêm dòng
                                </button>
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition-colors">
                                    <Upload className="h-3 w-3" /> Import
                                </button>
                                <button className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 bg-slate-800 text-white hover:bg-slate-700 transition-colors">
                                    <Download className="h-3 w-3" /> Xuất Excel
                                </button>
                                <div className="ml-auto flex items-center gap-1">
                                    <button
                                        className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                                        title="Làm mới"
                                        onClick={() => handleRefreshSection("input")}
                                    >
                                        <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                                    </button>
                                    <button className="p-1.5 rounded-md text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors" title="Cài đặt">
                                        <Settings className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            </div>

                            {/* ── Search & Summary ── */}
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                <div className="text-[14px] font-semibold text-indigo-600">
                                    Tổng cộng: {inputRows.length} dòng nhập liệu
                                </div>
                                <div className="relative w-full sm:w-[300px]">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                    <input
                                        type="text"
                                        placeholder="Tìm kiếm nội dung nhập liệu..."
                                        className="w-full pl-9 pr-4 py-2 text-sm rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all shadow-sm shadow-slate-100"
                                        value={inputSearch}
                                        onChange={(e) => setInputSearch(e.target.value)}
                                    />
                                </div>
                            </div>

                            <div className={`overflow-hidden rounded-xl border border-slate-200 bg-white ${isRefreshing ? 'opacity-50' : ''} transition-opacity`}>
                                <table className="w-full text-[12px] border-collapse">
                                    <thead>
                                        <tr className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                                            <th className="px-3 py-3 text-center w-[50px]">STT</th>
                                            <th className="px-3 py-3 text-left w-[120px]">Mã nhân sự</th>
                                            <th className="px-3 py-3 text-left">Họ tên nhân sự</th>
                                            <th className="px-3 py-3 text-left">Khoản mục</th>
                                            <th className="px-3 py-3 text-right">Số tiền</th>
                                            <th className="px-3 py-3 text-left">Ghi chú</th>
                                            <th className="px-3 py-3 text-center w-[100px]">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {inputRows.length > 0 ? inputRows.filter(r =>
                                            r.employeeCode.includes(inputSearch) ||
                                            r.fullName.toLowerCase().includes(inputSearch.toLowerCase()) ||
                                            r.item.toLowerCase().includes(inputSearch.toLowerCase())
                                        ).map((row, idx) => (
                                            <tr key={row.id} className="hover:bg-slate-50/50 transition-colors animate-in fade-in slide-in-from-left-2 duration-300">
                                                <td className="px-3 py-2 text-center text-slate-400">{idx + 1}</td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none p-1 font-bold text-slate-700"
                                                        placeholder="Mã NV"
                                                        value={row.employeeCode}
                                                        onChange={(e) => {
                                                            const newRows = [...inputRows];
                                                            newRows[idx].employeeCode = e.target.value;
                                                            setInputRows(newRows);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none p-1"
                                                        placeholder="Họ tên"
                                                        value={row.fullName}
                                                        onChange={(e) => {
                                                            const newRows = [...inputRows];
                                                            newRows[idx].fullName = e.target.value;
                                                            setInputRows(newRows);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2">
                                                    <select
                                                        className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none p-1"
                                                        value={row.item}
                                                        onChange={(e) => {
                                                            const newRows = [...inputRows];
                                                            newRows[idx].item = e.target.value;
                                                            setInputRows(newRows);
                                                        }}
                                                    >
                                                        <option>Thưởng KPI</option>
                                                        <option>Phụ cấp điện thoại</option>
                                                        <option>Phạt vi phạm</option>
                                                        <option>Truy thu thuế</option>
                                                        <option>Khác</option>
                                                    </select>
                                                </td>
                                                <td className="px-3 py-2">
                                                    <input
                                                        type="number"
                                                        className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none p-1 text-right text-emerald-600 font-bold"
                                                        placeholder="0"
                                                        value={row.amount}
                                                        onChange={(e) => {
                                                            const newRows = [...inputRows];
                                                            newRows[idx].amount = e.target.value;
                                                            setInputRows(newRows);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-slate-500">
                                                    <input
                                                        className="w-full bg-transparent border-b border-transparent focus:border-indigo-300 outline-none p-1"
                                                        placeholder="Ghi chú..."
                                                        value={row.note}
                                                        onChange={(e) => {
                                                            const newRows = [...inputRows];
                                                            newRows[idx].note = e.target.value;
                                                            setInputRows(newRows);
                                                        }}
                                                    />
                                                </td>
                                                <td className="px-3 py-2 text-center">
                                                    <button
                                                        className="p-1 px-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        onClick={() => setInputRows(prev => prev.filter(r => r.id !== row.id))}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </td>
                                            </tr>
                                        )) : (
                                            <tr className="hover:bg-slate-50/30 transition-colors">
                                                <td colSpan={7} className="px-4 py-12 text-center text-slate-400 italic">
                                                    <div className="flex flex-col items-center gap-2">
                                                        <Pencil className="h-6 w-6 opacity-20" />
                                                        Chưa có dữ liệu nhập liệu. Nhấn "Thêm dòng" để bắt đầu.
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
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
                        {/* Sticky Header Box */}
                        <div className="sticky top-[-1px] bg-white/95 backdrop-blur-md z-[30] border-b border-slate-200 shadow-sm transition-all duration-300 px-6 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 -mx-6 -mt-6 mb-6 rounded-t-2xl">
                            <div>
                                <h2 className="text-xl font-black text-indigo-950 tracking-tight">Bảng lương chi tiết nhân sự</h2>
                                <p className="text-[11px] text-slate-400 font-medium uppercase tracking-widest mt-0.5 italic">Dữ liệu tính toán dựa trên 3P framework</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                {payroll?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                    <Button
                                        onClick={() => onCalculate(payroll)}
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
                                    <button className="p-2 rounded-md hover:bg-white hover:shadow-sm text-slate-400 hover:text-indigo-600 transition-all">
                                        <RefreshCw className="h-4 w-4" />
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
                                details={payroll?.details || []}
                                loading={detailLoading}
                                canEdit={canEdit && authService.hasPermission("PAYROLL_UPDATE")}
                                onUpdateDetail={onEditDetail}
                            />
                        </div>
                    </div>
                )}

                {activeTab === "summary" && (
                    <SalarySummaryTable
                        details={payroll?.details || []}
                        unitName={payroll?.unitName || "Testing"}
                    />
                )}

                {activeTab === "slips" && (
                    <PayrollSlipTable
                        details={payroll?.details || []}
                        onSendEmail={(ids) => toast.success(`Đã xếp lịch gửi ${ids.length} phiếu lương vào hàng đợi!`)}
                        onRecalculate={() => onCalculate(payroll)}
                        onUpdateDetail={onEditDetail}
                    />
                )}
            </div>
        </div>
    );
});

export default PayrollDetailView;
