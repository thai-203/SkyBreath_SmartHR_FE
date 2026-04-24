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

    // Indicator 37, 38, 39: Phụ cấp, OT, Thưởng khác
    const phụCấp = parseFloat(detail.allowanceAmount || 0);
    const ot = parseFloat(detail.overtimePay || 0);
    const thưởngP3 = parseFloat(detail.bonus || 0);
    const truyThuTínhThuế = parseFloat(detail.adjustmentTaxable || 0);
    const truyThuKoThuế = parseFloat(detail.adjustmentNonTaxable || 0);
    const khácKoThuế = parseFloat(detail.otherIncomeNonTaxable || 0);

    // Indicator 40: TỔNG THU NHẬP
    const totalActualEarnings = tongLuongChinh + thưởngP3 + phụCấp + ot + truyThuTínhThuế + truyThuKoThuế + khácKoThuế;

    // Deductions (Synchronized with indicators 52-65.1)
    const bhxhNLĐ = parseFloat(detail.socialInsurance || 0);
    const thuếTNCN = parseFloat(detail.taxDeduction || 0);
    const khấuTrừKhác = parseFloat(detail.penalty || 0) + parseFloat(detail.deduction || 0);
    const adjustedInsurance = bhxhNLĐ + parseFloat(detail.insuranceAdjustment || 0) + parseFloat(detail.unionFee || 0) + parseFloat(detail.partyFee || 0);
    const adjustedTax = thuếTNCN + parseFloat(detail.taxAdjustment || 0);

    const totalDeductions = adjustedInsurance + adjustedTax + khấuTrừKhác;
    const netSalary = totalActualEarnings - totalDeductions;

    const totalAgreement = (parseFloat(detail.baseSalary) || 0) + (parseFloat(detail.performanceSalary) || 0);

    const rows = [
        { stt: "1", label: "Thu nhập thỏa thuận", value: totalAgreement, isHeader: true },
        { stt: "1.1", label: "Lương cơ bản (đóng BHXH)", value: detail.baseSalary, formula: "Hợp đồng" },
        { stt: "1.2", label: "Lương vị trí (P1)", value: detail.baseSalary, formula: "Hợp đồng" },
        { stt: "1.3", label: "Thưởng HQCV (P2.1)", value: detail.performanceSalary, formula: "Hợp đồng" },
        { stt: "1.4", label: "Khoán công việc (P2.2)", value: detail.performanceSalary, formula: "Hợp đồng" },
        { stt: "1.5", label: "Lương trong thời gian thử việc", value: detail.probationSalary, formula: "Hợp đồng" },

        { stt: "2", label: "Ngày công", value: ncChínhThức + ncThửViệc + ncKhác, isHeader: true, isDays: true },
        { stt: "2.1", label: "Ngày công chuẩn", value: ncChuẩn, formula: "Hệ thống", isDays: true },
        { stt: "2.2", label: "Ngày công đi làm chính thức", value: ncChínhThức, formula: "Máy chấm công", isDays: true },
        { stt: "2.3", label: "Ngày công đi làm thử việc", value: ncThửViệc, formula: "Máy chấm công", isDays: true },
        { stt: "2.4", label: "Ngày công tính lương khác", value: ncKhác, formula: "Phép/Lễ/Công tác", isDays: true },

        { stt: "I", label: "TỔNG THU NHẬP TRONG THÁNG", value: totalActualEarnings, isSummary: true },

        { stt: "3", label: "Lương, thưởng thực tế hưởng", value: totalActualEarnings, isHeader: true },
        { stt: "3.1", label: "Lương vị trí thực nhận (P1)", value: p1ThựcNhận, formula: "Đã tính" },
        { stt: "3.2", label: "Thưởng HQCV thực nhận (P2.1)", value: p21ThựcNhận, formula: "Đã tính" },
        { stt: "3.3", label: "Khoán công việc thực nhận (P2.2)", value: p22ThựcNhận, formula: "Đã tính" },
        { stt: "3.4", label: "Lương thử việc thực nhận", value: pTVThựcNhận, formula: "Đã tính" },
        { stt: "3.5", label: "Tiền lương làm thêm giờ (OT)", value: ot, formula: "Bảng OT" },
        { stt: "3.6", label: "Phụ cấp & Thưởng khác", value: phụCấp + thưởngP3 + khácKoThuế, formula: "Hợp đồng & Phát sinh" },
        { stt: "3.7", label: "Truy thu / Truy lĩnh", value: truyThuTínhThuế + truyThuKoThuế, formula: "Điều chỉnh" },

        { stt: "4", label: "Các khoản trừ", value: totalDeductions, isHeader: true },
        { stt: "4.1", label: "Bảo hiểm & Phí (Công đoàn/Đảng)", value: adjustedInsurance, formula: "Đã tính" },
        { stt: "4.2", label: "Thuế TNCN & Điều chỉnh thuế", value: adjustedTax, formula: "Biểu thuế" },
        { stt: "4.3", label: "Khấu trừ & Phạt", value: khấuTrừKhác, formula: "Phát sinh" },

        { stt: "NET", label: "THỰC LĨNH (NET)", value: netSalary, isSummary: true, color: "bg-emerald-600 shadow-xl shadow-emerald-100" },
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
                            <p className="text-[12px] text-slate-400 font-bold uppercase">Tháng 01/2026 • Ngày chi trả: 01/02/2026</p>
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
