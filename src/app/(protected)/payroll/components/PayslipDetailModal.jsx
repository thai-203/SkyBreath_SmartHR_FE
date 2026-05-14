"use client";

import React, { useState, useEffect } from "react";
import { X, ChevronLeft, ChevronRight, Save, Mail, Loader2, Printer, Smartphone } from "lucide-react";
import { Button } from "@/components/common/Button";
import { toast } from "sonner";

/**
 * Premium Payslip Detail Modal (Phiếu chi tiết lương)
 * - Line-by-line breakdown of earnings and working days.
 * - Previous/Next navigation through the employee list.
 * - Editable notes (Ghi chú) field.
 */

const fmt = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(parseFloat(n || 0)));

export default function PayslipDetailModal({
    detail,
    currentIndex,
    totalCount,
    onOpen,
    onClose,
    onPrev,
    onNext,
    onSaveNote,
    onSendEmail,
}) {
    const [note, setNote] = useState(detail?.note || "");
    const [isSaving, setIsSaving] = useState(false);
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    useEffect(() => { setNote(detail?.note || ""); }, [detail]);

    if (!detail) return null;

    const handleSave = async () => {
        setIsSaving(true);
        await onSaveNote(detail.id, note);
        setIsSaving(false);
    };

    const handleSendEmail = async () => {
        if (!onSendEmail) return;
        const email = detail.employee?.companyEmail || detail.employee?.user?.email;
        if (!email) {
            toast.error(`Nhân viên ${detail.employee?.fullName || ''} chưa có email công ty.`);
            return;
        }
        setIsSendingEmail(true);
        try {
            await onSendEmail([detail.id]);
        } finally {
            setIsSendingEmail(false);
        }
    };

    const employee = detail.employee || {};
    const deptName = employee.department?.departmentName || "CTCP CẤP THOÁT NƯỚC SA PA";

    // --- Dynamic Sub-totals ---
    // --- Synchronized 36-Indicator Calculation Logic ---
    const ncChuẩn = parseFloat(detail.standardDays || 26);
    const ncChínhThức = parseFloat(detail.officialDays || 0);
    const ncThửViệc = parseFloat(detail.probationDays || 0);
    const ncKhác = (parseFloat(detail.benefitLeaveDays) || 0) + (parseFloat(detail.annualLeaveDays) || 0) + (parseFloat(detail.holidayDays) || 0) + (parseFloat(detail.businessTripDays) || 0);

    // ── LẤY GIÁ TRỊ TỪ DATABASE ──
    // p1Amount, p21Amount, p22Amount, probationAmount đã được tính sẵn trong backend
    const p1ThựcNhận = parseFloat(detail.p1Amount || 0);
    const p21ThựcNhận = parseFloat(detail.p21Amount || 0);
    const p22ThựcNhận = parseFloat(detail.p22Amount || 0);
    const pTVThựcNhận = parseFloat(detail.probationAmount || 0);

    // Indicator 36: Tổng lương chính
    const tongLuongChinh = p1ThựcNhận + p21ThựcNhận + p22ThựcNhận + pTVThựcNhận;

    // (36.1) Thưởng P3, (43) Phụ cấp, (45) OT, (46)(47)(50.1) Truy thu
    const phụCấp = parseFloat(detail.allowanceAmount || 0);
    const ot = parseFloat(detail.overtimePay || 0);
    const thưởngP3 = parseFloat(detail.bonus || 0);
    const truyThuTínhThuế = parseFloat(detail.adjustmentTaxable || 0);
    const truyThuKoThuế = parseFloat(detail.adjustmentNonTaxable || 0);
    const khácKoThuế = parseFloat(detail.otherNonTaxable || 0); // (50.1) — field name khớp backend

    // (51) TỔNG THU NHẬP — ưu tiên dùng totalGrossIncome đã lưu từ backend
    const totalActualEarnings = parseFloat(detail.totalGrossIncome) > 0
        ? parseFloat(detail.totalGrossIncome)
        : tongLuongChinh + thưởngP3 + phụCấp + ot + truyThuTínhThuế + truyThuKoThuế + khácKoThuế;

    // (52) BH NLĐ = BHXH+BHYT+BHTN = 10.5% — dùng insuranceDeduction đã lưu
    const bhxhNLĐ = parseFloat(detail.insuranceDeduction) > 0
        ? parseFloat(detail.insuranceDeduction)
        : parseFloat(detail.baseSalary || 0) * 0.105; // fallback 10.5%
    // Tỷ lệ chỉ dùng để hiển thị
    const siRate = parseFloat(detail.socialInsurancePercentage || 8);
    const hiRate = parseFloat(detail.healthInsurancePercentage || 1.5);
    const uiRate = parseFloat(detail.unemploymentInsurancePercentage || 1);
    const thuếTNCN = parseFloat(detail.taxDeduction || 0);          // (63)
    const insuranceAdjustment = parseFloat(detail.insuranceAdjustment || 0); // (53)
    const employeeUnionFee = parseFloat(detail.employeeUnionFee || 0);       // (54) CĐ phí NLĐ
    const taxAdjustment = parseFloat(detail.taxAdjustment || 0);             // (64)
    const partyFee = parseFloat(detail.partyFee || 0);                       // (55)
    const otherDeduction = parseFloat(detail.otherDeduction || 0);           // (65) Trừ khác

    // (65.1) Tổng khấu trừ = (52)+(53)+(54)+(55)+(63)+(64)+(65) — ưu tiên totalDeduction đã lưu
    const totalDeductions = parseFloat(detail.totalDeduction) > 0
        ? parseFloat(detail.totalDeduction)
        : bhxhNLĐ + insuranceAdjustment + employeeUnionFee + partyFee + thuếTNCN + taxAdjustment + otherDeduction;

    // (66) netSalary đọc từ DB
    const netSalary = parseFloat(detail.netSalary || 0);

    // Định mức hợp đồng (Section 1): hiển thị giá trị gốc, không phải earned
    const totalAgreement = (parseFloat(detail.baseSalary) || 0) + (parseFloat(detail.performanceSalary) || 0);
    // (14) Lương TV định mức: ưu tiên probationBaseSalary, fallback probationAmount
    const probationContractSalary = parseFloat(detail.probationBaseSalary) || parseFloat(detail.probationAmount) || 0;

    const rows = [
        { stt: "1", label: "Định mức Hợp đồng", value: totalAgreement, isHeader: true },
        { stt: "1.1", label: "Lương cơ bản đóng BHXH", value: detail.baseSalary, formula: "Hợp đồng" },
        { stt: "11",  label: "Lương vị trí (P1)", value: detail.positionSalary || detail.baseSalary, formula: "Hợp đồng" },
        { stt: "12",  label: "Thưởng HQCV (P2.1)", value: detail.performanceBonusSalary || detail.p21Amount, formula: "Nhập tay" },
        { stt: "13",  label: "Khoán công việc (P2.2)", value: detail.taskContractSalary || detail.p22Amount, formula: "Nhập tay" },
        { stt: "14",  label: "Lương thử việc", value: probationContractSalary, formula: "Nhập tay" },

        { stt: "2", label: "Ngày công", value: ncChínhThức + ncThửViệc + ncKhác, isHeader: true, isDays: true },
        { stt: "21", label: "Công chuẩn tháng", value: ncChuẩn, formula: "Hệ thống", isDays: true },
        { stt: "22", label: "Công chính thức", value: ncChínhThức, formula: "Máy chấm công", isDays: true },
        { stt: "23", label: "Công thử việc", value: ncThửViệc, formula: "Máy chấm công", isDays: true },
        { stt: "26+",label: "Công khác (phép/lễ/công tác)", value: ncKhác, formula: "Phép/Lễ/Công tác", isDays: true },

        { stt: "51", label: "TỔNG THU NHẬP", value: totalActualEarnings, isSummary: true },

        { stt: "3", label: "Thu nhập thực nhận", value: totalActualEarnings, isHeader: true },
        { stt: "31", label: "Lương P1 thực nhận", value: p1ThựcNhận, formula: `(11/NC_chuẩn)×ngày công` },
        { stt: "32", label: "Thưởng P2.1 thực nhận", value: p21ThựcNhận, formula: `(12/NC_chuẩn)×ngày công×%KPI` },
        { stt: "33", label: "Khoán P2.2 thực nhận", value: p22ThựcNhận, formula: `13×%KPI` },
        { stt: "34", label: "Lương thử việc thực nhận", value: pTVThựcNhận, formula: `(14/NC_chuẩn)×công TV` },
        { stt: "36.1",label: "Thưởng phát sinh P3", value: thưởngP3, formula: "Phát sinh" },
        { stt: "43", label: "Phụ cấp thực nhận", value: phụCấp, formula: "Hợp đồng" },
        { stt: "45", label: "Tăng ca OT", value: ot, formula: "Bảng OT" },
        { stt: "46", label: "Truy thu tính thuế", value: truyThuTínhThuế, formula: "Điều chỉnh" },
        { stt: "47", label: "Truy thu không thuế", value: truyThuKoThuế, formula: "Điều chỉnh" },
        { stt: "50.1",label: "Thu nhập khác không thuế", value: khácKoThuế, formula: "Phát sinh" },

        { stt: "4", label: "Các khoản khấu trừ", value: totalDeductions, isHeader: true },
        { stt: "52", label: `BH NLĐ (BHXH${siRate}%+BHYT${hiRate}%+BHTN${uiRate}%)`, value: bhxhNLĐ, formula: `10.5% × lương đóng BH` },
        { stt: "53", label: "Truy thu BH", value: insuranceAdjustment, formula: "Điều chỉnh" },
        { stt: "54", label: "Công đoàn phí NLĐ", value: employeeUnionFee, formula: "Điều chỉnh" },
        { stt: "55", label: "Đảng phí", value: partyFee, formula: "Điều chỉnh" },
        { stt: "63", label: "Thuế TNCN", value: thuếTNCN, formula: "Biểu thuế lũy tiến" },
        { stt: "64", label: "Truy thu thuế", value: taxAdjustment, formula: "Điều chỉnh" },
        { stt: "65", label: "Trừ khác", value: otherDeduction, formula: "Phát sinh" },

        { stt: "NET", label: "THỰC LĨNH (NET 66)", value: netSalary, isSummary: true, color: "bg-emerald-600 shadow-xl shadow-emerald-100" },
    ];

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white w-full max-w-5xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-500">

                {/* Header Section */}
                <div className="p-6 border-b border-slate-100 flex items-start justify-between bg-gradient-to-r from-white to-slate-50/50">
                    <div className="space-y-1">
                        <h2 className="text-xl font-black text-indigo-900 uppercase tracking-tight">{deptName}</h2>
                        <div className="grid grid-cols-2 gap-x-8 gap-y-1 text-sm text-slate-500 mt-2">
                            <p>Họ tên (Full name): <span className="font-bold text-slate-800">{employee.fullName}</span></p>
                            <p>Phòng ban (Department): <span className="font-bold text-slate-800">{employee.department?.departmentName}</span></p>
                            <p>Chức danh (Title): <span className="font-bold text-slate-800">{employee.position?.positionName}</span></p>
                            <p>STK: <span className="font-bold text-slate-800">Bank • Chuyển khoản</span></p>
                        </div>
                    </div>

                    <div className="flex flex-col items-end gap-4">
                        <div className="flex items-center gap-4">
                            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200 shadow-inner">
                                <button onClick={onPrev} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600">
                                    <ChevronLeft className="h-4 w-4" />
                                </button>
                                <span className="text-[12px] font-black px-2 text-slate-600 tracking-widest">{currentIndex + 1}/{totalCount}</span>
                                <button onClick={onNext} className="p-1.5 hover:bg-white hover:shadow-sm rounded-lg transition-all text-slate-400 hover:text-indigo-600">
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                            <button onClick={onClose} className="p-2 hover:bg-rose-50 hover:text-rose-600 rounded-full transition-all text-slate-400">
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        <div className="text-right">
                            <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest">Phiếu chi tiết lương</h3>
                            <p className="text-[12px] text-slate-400 font-bold uppercase">
                                Tháng {detail.payroll?.payrollMonth || (detail.payrollId ? '' : '')}/{detail.payroll?.payrollYear || ''}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form Actions */}
                <div className="px-6 py-3 bg-white border-b border-slate-50 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5">
                        {detail.payslipSentAt ? (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-700 text-[11px] font-bold border border-emerald-100">
                                <Mail className="h-3 w-3" />
                                Đã gửi {new Date(detail.payslipSentAt).toLocaleDateString('vi-VN')}
                            </span>
                        ) : (
                            <span className="text-[11px] text-slate-400 italic">Chưa gửi email</span>
                        )}
                    </div>
                    {onSendEmail && (
                        <Button
                            size="sm"
                            onClick={handleSendEmail}
                            disabled={isSendingEmail}
                            className="h-9 gap-2 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100 text-white font-bold"
                        >
                            {isSendingEmail
                                ? <Loader2 className="h-4 w-4 animate-spin" />
                                : <Mail className="h-4 w-4" />
                            }
                            {isSendingEmail ? 'Đang gửi...' : 'Gửi phiếu lương'}
                        </Button>
                    )}
                </div>

                {/* Main Content (Table) */}
                <div className="flex-1 overflow-y-auto p-6 scroller-thick">
                    <div className="rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                        <table className="w-full text-sm border-collapse">
                            <thead>
                                <tr className="bg-[#1e40af] text-white text-[10px] font-black uppercase tracking-widest">
                                    <th className="px-4 py-3 w-16 text-center border-r border-white/20">STT</th>
                                    <th className="px-4 py-3 text-left border-r border-white/20">Chi tiêu</th>
                                    <th className="px-4 py-3 text-center border-r border-white/20">Cách tính</th>
                                    <th className="px-4 py-3 w-[150px] text-right border-r border-white/20">Số tiền</th>
                                    <th className="px-4 py-3 w-[250px] text-left">Ghi chú</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => (
                                    <tr
                                        key={row.stt}
                                        className={`transition-colors text-[12px] ${row.isHeader ? 'bg-slate-50' :
                                            row.isSummary ? (row.color || 'bg-blue-500') + ' text-white' :
                                                'hover:bg-slate-50/50'
                                            }`}
                                    >
                                        <td className={`px-4 py-2.5 text-center font-bold border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'}`}>{row.stt}</td>
                                        <td className={`px-4 py-2.5 ${row.isHeader || row.isSummary ? 'font-black' : 'text-slate-700'} border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'}`}>{row.label}</td>
                                        <td className={`px-4 py-2.5 text-center italic border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'} ${row.isSummary ? 'text-white/70' : 'text-slate-400'}`}>
                                            {row.formula || ""}
                                        </td>
                                        <td className={`px-4 py-2.5 text-right font-black border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'}`}>
                                            {row.isDays ? row.value : fmt(row.value)}
                                        </td>
                                        <td className="px-3 py-2">
                                            {!row.isHeader && !row.isSummary ? (
                                                <div className="flex group">
                                                    <textarea
                                                        className="w-full bg-transparent border-none text-[11px] p-1.5 focus:ring-1 focus:ring-indigo-100 focus:bg-white rounded transition-all resize-none italic outline-none group-hover:bg-slate-50"
                                                        placeholder="Nhập mô tả..."
                                                        defaultValue={row.stt === "1.1" ? note : ""} // Just for POC on primary row
                                                        onChange={(e) => row.stt === "1.1" && setNote(e.target.value)}
                                                        rows={1}
                                                    />
                                                </div>
                                            ) : null}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="mt-8 flex justify-between items-end border-t border-slate-100 pt-8 italic text-slate-400 text-xs">
                        <div className="space-y-1">
                            <p>Người tạo: <span className="font-bold">Hệ thống SmartHR</span></p>
                            <p>Ngày in: <span className="font-bold">{new Date().toLocaleDateString('vi-VN')}</span></p>
                        </div>
                        <div className="flex gap-3">
                            <Button variant="ghost" className="gap-2 text-[11px] h-8 text-slate-400 hover:text-slate-600" onClick={() => window.print()}>
                                <Printer className="h-3.5 w-3.5" /> In phiếu
                            </Button>
                            {onSendEmail && (
                                <Button
                                    variant="ghost"
                                    className="gap-2 text-[11px] h-8 text-indigo-600 hover:text-indigo-800 hover:bg-indigo-50 font-bold"
                                    onClick={handleSendEmail}
                                    disabled={isSendingEmail}
                                >
                                    {isSendingEmail
                                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                        : <Mail className="h-3.5 w-3.5" />
                                    }
                                    {isSendingEmail ? 'Đang gửi...' : 'Gửi Email'}
                                </Button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
