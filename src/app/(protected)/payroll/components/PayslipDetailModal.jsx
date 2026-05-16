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

    // --- LẤY DỮ LIỆU TỪ DATABASE ---
    
    // Ngày công
    const ncChuẩn = parseFloat(detail.standardDays || 26);
    const ncChínhThức = parseFloat(detail.officialDays || 0);
    const ncThửViệc = parseFloat(detail.probationDays || 0);
    const ncKhác = (parseFloat(detail.benefitLeaveDays) || 0) + (parseFloat(detail.annualLeaveDays) || 0) + (parseFloat(detail.holidayDays) || 0) + (parseFloat(detail.businessTripDays) || 0);

    // Lương định mức (từ hợp đồng)
    const baseSalary = parseFloat(detail.baseSalary || 0);           // (1.1) Lương đóng BHXH
    const positionSalary = parseFloat(detail.positionSalary || detail.baseSalary || 0); // (11) Lương vị trí P1
    const performanceSalary = parseFloat(detail.performanceSalary || 0); // Lương hiệu năng P2
    const probationContractSalary = parseFloat(detail.probationBaseSalary || 0); // (14) Lương TV định mức
    
    // Tổng định mức HĐ
    const totalAgreement = baseSalary + performanceSalary;

    // Lương thực nhận (đã tính sẵn từ backend)
    const p1ThựcNhận = parseFloat(detail.p1Amount || 0);
    const p21ThựcNhận = parseFloat(detail.p21Actual || detail.p21Amount || 0);
    const p22ThựcNhận = parseFloat(detail.p22Actual || detail.p22Amount || 0);
    const pTVThựcNhận = parseFloat(detail.probationAmount || 0);

    // (36) Tổng lương chính
    const tongLuongChinh = p1ThựcNhận + p21ThựcNhận + p22ThựcNhận + pTVThựcNhận;

    // Thu nhập khác
    const thưởngP3 = parseFloat(detail.bonus || 0);              // (36.1)
    const phuCap = parseFloat(detail.allowanceAmount || 0);       // (43)
    const ot = parseFloat(detail.overtimePay || 0);               // (45)
    const truyThuTínhThuế = parseFloat(detail.adjustmentTaxable || 0);   // (46)
    const truyThuKoThuế = parseFloat(detail.adjustmentNonTaxable || 0);  // (47)
    const khácKoThuế = parseFloat(detail.otherNonTaxable || 0);   // (50.1)

    // (51) Tổng thu nhập
    const totalActualEarnings = parseFloat(detail.totalGrossIncome) > 0
        ? parseFloat(detail.totalGrossIncome)
        : tongLuongChinh + thưởngP3 + phuCap + ot + truyThuTínhThuế + truyThuKoThuế + khácKoThuế;

    // ── BẢO HIỂM NLĐ (52) ── Tính theo Lương P1 thực nhận (21)
    const siRate = parseFloat(detail.socialInsurancePercentage || 8) / 100;      // 8%
    const hiRate = parseFloat(detail.healthInsurancePercentage || 1.5) / 100;    // 1.5%
    const uiRate = parseFloat(detail.unemploymentInsurancePercentage || 1) / 100; // 1%
    
    const bhxhNLĐ = p1ThựcNhận * siRate;     // BHXH 8%
    const bhytNLĐ = p1ThựcNhận * hiRate;     // BHYT 1.5%
    const bhtnNLĐ = p1ThựcNhận * uiRate;     // BHTN 1%
    const tongBHNLD = bhxhNLĐ + bhytNLĐ + bhtnNLĐ; // Tổng 10.5%

    // Các khoản khấu trừ khác
    const insuranceAdjustment = parseFloat(detail.insuranceAdjustment || 0); // (53) Truy thu BH
    const employeeUnionFee = parseFloat(detail.employeeUnionFee || 0);     // (54) CĐ phí NLĐ
    const partyFee = parseFloat(detail.partyFee || 0);                   // (55) Đảng phí
    const familyDeduction = parseFloat(detail.familyDeduction || 0);     // (12.2) Giảm trừ gia cảnh
    const thuếTNCN = parseFloat(detail.taxDeduction || 0);               // (63) Thuế TNCN
    const taxAdjustment = parseFloat(detail.taxAdjustment || 0);           // (64) Truy thu thuế
    const otherDeduction = parseFloat(detail.otherDeduction || 0);        // (65) Trừ khác

    // (65.1) Tổng khấu trừ
    const totalDeductions = parseFloat(detail.totalDeduction) > 0
        ? parseFloat(detail.totalDeduction)
        : tongBHNLD + insuranceAdjustment + employeeUnionFee + partyFee + thuếTNCN + taxAdjustment + otherDeduction;

    // (66) Thực lĩnh
    const netSalary = parseFloat(detail.netSalary) > 0
        ? parseFloat(detail.netSalary)
        : totalActualEarnings - totalDeductions;

    const rows = [
        // ── Section 1: Ngày công ──
        { stt: "1", label: "Ngày công", value: ncChínhThức + ncThửViệc + ncKhác, isHeader: true, isDays: true },
        { stt: "1.1", label: "Công chuẩn tháng", value: ncChuẩn, formula: "Hệ thống", isDays: true },
        { stt: "1.2", label: "Công chính thức", value: ncChínhThức, formula: "Máy chấm công", isDays: true },
        { stt: "1.3", label: "Công thử việc", value: ncThửViệc, formula: "Máy chấm công", isDays: true },
        { stt: "1.4", label: "Công khác (phép/lễ/công tác)", value: ncKhác, formula: "Phép/Lễ/Công tác", isDays: true },

        // ── Section 2: Thu nhập thực nhận ──
        { stt: "2", label: "Thu nhập thực nhận", value: totalActualEarnings, isHeader: true },
        { stt: "2.1", label: "Lương P1 thực nhận", value: p1ThựcNhận, formula: `(Lương vị trí/NC_chuẩn)×ngày công` },
        { stt: "2.2", label: "Thưởng P2.1 thực nhận", value: p21ThựcNhận, formula: `(Lương HQCV/NC_chuẩn)×ngày công×%KPI` },
        { stt: "2.3", label: "Khoán P2.2 thực nhận", value: p22ThựcNhận, formula: `Lương khoán×%KPI` },
        { stt: "2.4", label: "Lương thử việc thực nhận", value: pTVThựcNhận, formula: `(Lương TV/NC_chuẩn)×công TV` },
        { stt: "2.5", label: "Tổng lương chính", value: tongLuongChinh, formula: "(2.1+2.2+2.3+2.4)", isBold: true },
        { stt: "2.6", label: "Thưởng phát sinh P3", value: thưởngP3, formula: "Phát sinh" },
        { stt: "2.7", label: "Phụ cấp thực nhận", value: phuCap, formula: "Hợp đồng" },
        { stt: "2.8", label: "Tăng ca OT", value: ot, formula: "Bảng OT" },
        { stt: "2.9", label: "Truy thu tính thuế", value: truyThuTínhThuế, formula: "Điều chỉnh" },
        { stt: "2.10", label: "Truy thu không thuế", value: truyThuKoThuế, formula: "Điều chỉnh" },
        { stt: "2.11", label: "Thu nhập khác không thuế", value: khácKoThuế, formula: "Phát sinh" },

        // ── Section 3: Tổng thu nhập ──
        { stt: "3", label: "TỔNG THU NHẬP", value: totalActualEarnings, isSummary: true, color: "bg-emerald-600 shadow-xl shadow-emerald-100" },

        // ── Section 4: Các khoản khấu trừ ──
        { stt: "4", label: "Các khoản khấu trừ", value: totalDeductions, isHeader: true },
        { stt: "4.1", label: `BHXH NLĐ ${(siRate*100).toFixed(1)}%`, value: bhxhNLĐ, formula: `${(siRate*100).toFixed(1)}% × lương P1` },
        { stt: "4.2", label: `BHYT NLĐ ${(hiRate*100).toFixed(1)}%`, value: bhytNLĐ, formula: `${(hiRate*100).toFixed(1)}% × lương P1` },
        { stt: "4.3", label: `BHTN NLĐ ${(uiRate*100).toFixed(1)}%`, value: bhtnNLĐ, formula: `${(uiRate*100).toFixed(1)}% × lương P1` },
        { stt: "4.4", label: "Truy thu BH", value: insuranceAdjustment, formula: "Điều chỉnh" },
        { stt: "4.5", label: "Công đoàn phí NLĐ", value: employeeUnionFee, formula: "Điều chỉnh" },
        { stt: "4.6", label: "Đảng phí", value: partyFee, formula: "Điều chỉnh" },
        { stt: "4.7", label: "Thuế TNCN", value: thuếTNCN, formula: "Biểu thuế lũy tiến" },
        { stt: "4.8", label: "Truy thu thuế", value: taxAdjustment, formula: "Điều chỉnh" },
        { stt: "4.9", label: "Trừ khác", value: otherDeduction, formula: "Phát sinh" },

        // ── Section 5: Thực lĩnh ──
        { stt: "5", label: "THỰC LĨNH (NET)", value: netSalary, isSummary: true, color: "bg-amber-600 shadow-xl shadow-amber-100" },
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
                            <p>Mã NV: <span className="font-bold text-slate-800">{employee.employeeCode}</span></p>
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
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {rows.map((row) => (
                                    <tr
                                        key={row.stt}
                                        className={`transition-colors text-[12px] ${row.isHeader ? 'bg-slate-100' :
                                            row.isSummary ? (row.color || 'bg-blue-500') + ' text-white' :
                                                'hover:bg-slate-50/50'
                                            }`}
                                    >
                                        <td className={`px-4 py-2.5 text-center font-bold border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'}`}>{row.stt}</td>
                                        <td className={`px-4 py-2.5 ${row.isHeader || row.isSummary ? 'font-black' : row.isBold ? 'font-bold text-indigo-700' : 'text-slate-700'} border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'}`}>{row.label}</td>
                                        <td className={`px-4 py-2.5 text-center italic border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'} ${row.isSummary ? 'text-white/70' : 'text-slate-400'}`}>
                                            {row.formula || ""}
                                        </td>
                                        <td className={`px-4 py-2.5 text-right font-black border-r ${row.isSummary ? 'border-white/10' : 'border-slate-100'}`}>
                                            {row.isDays ? row.value : fmt(row.value)}
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
