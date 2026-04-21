"use client";

import React, { useMemo } from "react";
import { PlusSquare, MinusSquare, Calculator, ShieldCheck, Wallet } from "lucide-react";

/**
 * Premium Payroll Detail Table (36-Indicator Standard)
 * - Structured according to the provided 36-step formula list.
 * - All calculations derived from payroll details (Data sourced from Timesheet/Input).
 */

const fmt = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(parseFloat(n || 0)));

export default function SalaryDetailTable({ 
    details = [], 
    loading = false,
    canEdit,
    onUpdateDetail
}) {
    const groupedData = useMemo(() => {
        const groups = {};
        details.forEach(item => {
            const dept = item.employee?.department?.departmentName || "Khác";
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(item);
        });
        return groups;
    }, [details]);

    // Wide table to accommodate all indicators
    const tableWidth = 4500;

    if (loading) {
        return <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 animate-pulse text-slate-400 font-medium italic">Đang đồng bộ dữ liệu tính toán từ hệ thống...</div>;
    }

    const headerCellClass = "border-r border-slate-300 py-3 px-2 text-center align-middle font-black text-[10px]";
    const subHeaderCellClass = "border-r border-slate-200 py-1 px-1 text-center align-middle font-bold text-[9px] bg-slate-50 text-slate-400";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-200/20 mb-12 overflow-hidden">
            <div className="overflow-x-auto scroller-thick">
                <table 
                    className="text-[11px] border-separate border-spacing-0 bg-white table-fixed"
                    style={{ width: `${tableWidth}px` }}
                >
                    <thead className="bg-[#f8fafc] text-slate-700 uppercase z-0 border-b border-slate-200">
                        {/* Group Headers */}
                        <tr className="border-b border-slate-300 bg-slate-100/50">
                            <th colSpan={3} className="sticky left-0 bg-slate-100 z-[60] border-r border-slate-300 py-4 shadow-sm">Thông tin nhân sự</th>
                            <th colSpan={5} className="bg-amber-50 border-r border-slate-300">I. Định mức Hợp đồng & Công (1-5)</th>
                            <th colSpan={4} className="bg-slate-50 border-r border-slate-300">II. Dữ liệu công chốt (6-9)</th>
                            <th colSpan={6} className="bg-blue-50 border-r border-slate-300">III. Thu nhập thực nhận (10-15)</th>
                            <th colSpan={6} className="bg-indigo-50 border-r border-slate-300">IV. Thu nhập khác & Phụ cấp (16-21)</th>
                            <th colSpan={2} className="bg-emerald-600 text-white border-r border-white">Tổng thu nhập (22)</th>
                            <th colSpan={10} className="bg-rose-50 border-r border-slate-300 text-rose-700">V. Khấu trừ & Thuế (23-32)</th>
                            <th className="bg-amber-600 text-white border-r border-white">Thực lĩnh (33)</th>
                            <th colSpan={3} className="bg-slate-800 text-slate-200 border-r border-slate-700">VI. Chi phí Doanh nghiệp (34-36)</th>
                            <th className="bg-slate-50">Ghi chú</th>
                        </tr>
                        
                        {/* Column Names (36 Indicators) */}
                        <tr className="bg-white text-slate-600 divide-x divide-slate-200 shadow-sm">
                            <th className="sticky left-0 bg-white z-[60] w-[45px] text-center border-r border-slate-100">STT</th>
                            <th className="sticky left-[45px] bg-white z-[60] w-[100px] text-center border-r border-slate-100">Mã NV</th>
                            <th className="sticky left-[145px] bg-white z-[60] w-[200px] text-left px-4 border-r border-slate-200 shadow-[2px_0_10px_rgba(0,0,0,0.02)]">Họ tên</th>
                            
                            {/* Group I */}
                            <th className="w-[150px] bg-amber-50/30">Lương đóng BHXH (1.1)</th>
                            <th className="w-[150px] bg-amber-50/30">Lương vị trí (11)</th>
                            <th className="w-[150px] bg-amber-50/30">Thưởng HQCV (12)</th>
                            <th className="w-[150px] bg-amber-50/30">Khoán CV (13)</th>
                            <th className="w-[150px] bg-amber-50/30">Lương thử việc (14)</th>

                            {/* Group II */}
                            <th className="w-[100px]">Công chuẩn</th>
                            <th className="w-[100px]">Công chính thức (22)</th>
                            <th className="w-[100px]">Công thử việc (23)</th>
                            <th className="w-[150px]">Công khác (phép,lễ..) (26+)</th>

                            {/* Group III */}
                            <th className="w-[100px] bg-blue-50/30">% KPI (10)</th>
                            <th className="w-[150px] bg-blue-50/30">Lương P1 thực nhận (31)</th>
                            <th className="w-[150px] bg-blue-50/30">Thưởng P2.1 thực (32)</th>
                            <th className="w-[150px] bg-blue-50/30">Khoán P2.2 thực (33)</th>
                            <th className="w-[150px] bg-blue-50/30">Thử việc thực (34)</th>
                            <th className="w-[180px] bg-blue-100/50 font-black">Tổng lương chính (36)</th>

                            {/* Group IV */}
                            <th className="w-[150px] bg-indigo-50/30">Thưởng P3 (36.1)</th>
                            <th className="w-[150px] bg-indigo-50/30">Phụ cấp (43)</th>
                            <th className="w-[150px] bg-indigo-50/30">Tăng ca OT (45)</th>
                            <th className="w-[150px] bg-indigo-50/30">Truy thu tính thuế (46)</th>
                            <th className="w-[150px] bg-indigo-50/30">Truy thu ko thuế (47)</th>
                            <th className="w-[150px] bg-indigo-50/30">Khác ko thuế (50.1)</th>

                            {/* Group V - Total */}
                            <th className="w-[200px] bg-emerald-500 text-white font-black text-xs italic">TỔNG THU NHẬP (51)</th>
                            <th className="w-[100px] bg-emerald-400/20">Mã (51)</th>

                            {/* Group VI - Deductions */}
                            <th className="w-[150px] bg-rose-50/50">BHXH NLĐ (52)</th>
                            <th className="w-[120px] bg-rose-50/50">Truy thu BH (53)</th>
                            <th className="w-[120px] bg-rose-50/50">CĐ phí NLĐ (54)</th>
                            <th className="w-[120px] bg-rose-50/50">Đảng phí (55)</th>
                            <th className="w-[180px] bg-rose-50/50">Giảm trừ gia cảnh (12.2)</th>
                            <th className="w-[180px] bg-rose-50/50">TN tính thuế (12.3)</th>
                            <th className="w-[150px] bg-rose-50/50">Thuế TNCN (63)</th>
                            <th className="w-[120px] bg-rose-50/50">Truy thu thuế (64)</th>
                            <th className="w-[120px] bg-rose-50/50">Trừ khác (65)</th>
                            <th className="w-[180px] bg-rose-600 text-white font-black">Tổng khấu trừ (65.1)</th>

                            {/* Group VII - Net */}
                            <th className="w-[220px] bg-amber-600 text-white font-black text-sm">LƯƠNG THỰC NHẬN (66)</th>

                            {/* Group VIII - Cost */}
                            <th className="w-[150px] bg-slate-800 text-slate-300">KPCĐ Cty (71)</th>
                            <th className="w-[150px] bg-slate-800 text-slate-300">BHXH Cty (75)</th>
                            <th className="w-[200px] bg-slate-950 text-white font-black">TỔNG CHI PHÍ NS (79.1)</th>

                            <th className="w-[250px] bg-white">Ghi chú</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {Object.entries(groupedData).map(([dept, items]) => (
                            <React.Fragment key={dept}>
                                <tr className="bg-slate-50/80 font-extrabold text-indigo-900 border-b border-slate-200">
                                    <td colSpan={3} className="sticky left-0 bg-slate-50 z-20 px-4 py-3 uppercase tracking-wider text-[10px] shadow-sm flex items-center gap-2">
                                        🏢 {dept} <span className="text-slate-400 font-medium ml-2">({items.length} nhân sự)</span>
                                    </td>
                                    <td colSpan={36} className="bg-slate-50/40"></td>
                                </tr>
                                {items.map((item, idx) => {
                                    // ── CALCULATIONS BASED ON THE 36-INDICATOR FORMULA ──
                                    const ncChuẩn = parseFloat(item.standardDays || 26);
                                    const ncChínhThức = parseFloat(item.officialDays || 0);
                                    const ncThửViệc = parseFloat(item.probationDays || 0);
                                    const ncKhác = parseFloat(item.benefitLeaveDays || 0) + parseFloat(item.holidayDays || 0) + parseFloat(item.businessTripDays || 0) + parseFloat(item.annualLeaveDays || 0);
                                    const kpi = parseFloat(item.kpiPercentage || 0) / 100;

                                    // (31) = (11 / NC chuẩn) * (22 + 26 + 26.1 + 27 + 28)
                                    const p1ThựcNhận = (parseFloat(item.p1Salary || item.baseSalary || 0) / ncChuẩn) * (ncChínhThức + ncKhác);
                                    
                                    // (32) = (12 / NC chuẩn) * (22 + 26 + 26.1 + 27 + 28) * % KPI
                                    const p21ThựcNhận = (parseFloat(item.p21Salary || 0) / ncChuẩn) * (ncChínhThức + ncKhác) * kpi;
                                    
                                    // (33) = (13 * % KPI)
                                    const p22ThựcNhận = parseFloat(item.p22Salary || 0) * kpi;
                                    
                                    // (34) = (14 / NC chuẩn) * (23)
                                    const probationThựcNhận = (parseFloat(item.probationSalary || 0) / ncChuẩn) * ncThửViệc;

                                    // (36) = (31) + (32) + (33) + (34)
                                    const tổngLươngChính = p1ThựcNhận + p21ThựcNhận + p22ThựcNhận + probationThựcNhận;

                                    // (51) = (36) + (36.1) + SUM(43 -> 50.1)
                                    // Note: Using fields mapped from item or provided in formulas
                                    const phụCấp = parseFloat(item.allowanceAmount || 0);
                                    const ot = parseFloat(item.overtimePay || 0);
                                    const thưởngP3 = parseFloat(item.bonus || 0);
                                    const truyThuTínhThuế = parseFloat(item.adjustmentTaxable || 0);
                                    const truyThuKoThuế = parseFloat(item.adjustmentNonTaxable || 0);
                                    const khácKoThuế = parseFloat(item.otherIncomeNonTaxable || 0);

                                    const tổngThuNhập = tổngLươngChính + thưởngP3 + phụCấp + ot + truyThuTínhThuế + truyThuKoThuế + khácKoThuế;

                                    // (52) = 10.5% * (1.1)
                                    const bhxhNLĐ = 0.105 * parseFloat(item.baseSalary || 0);
                                    
                                    // Total Deductions (65.1)
                                    const thuếTNCN = parseFloat(item.taxDeduction || 0);
                                    const khấuTrừKhác = parseFloat(item.penalty || 0) + parseFloat(item.deduction || 0);
                                    const tổngKhấuTrừ = bhxhNLĐ + parseFloat(item.insuranceAdjustment || 0) + parseFloat(item.unionFee || 0) + parseFloat(item.partyFee || 0) + thuếTNCN + parseFloat(item.taxAdjustment || 0) + khấuTrừKhác;

                                    // (66) = (51) - (65.1)
                                    const thựcLĩnh = tổngThuNhập - tổngKhấuTrừ;

                                    // Costs
                                    const kpcđCty = parseFloat(item.companyUnionFee || 0);
                                    const bhxhCty = parseFloat(item.companyInsurance || 0);
                                    const tổngChiPhíNS = tổngThuNhập + kpcđCty + bhxhCty;

                                    return (
                                        <tr key={item.id} className="group hover:bg-indigo-50/30 transition-colors divide-x divide-slate-100">
                                            <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 p-2 text-center text-slate-400 italic font-medium">{idx + 1}</td>
                                            <td className="sticky left-[45px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-3 font-bold text-slate-500">{item.employee?.employeeCode || "—"}</td>
                                            <td className="sticky left-[145px] bg-white group-hover:bg-slate-50 z-10 px-4 py-3 font-black text-slate-800 truncate">{item.employee?.fullName || "—"}</td>
                                            
                                            {/* Group I */}
                                            <td className="px-3 text-right text-slate-600 bg-amber-50/10 italic">{fmt(item.baseSalary)}</td>
                                            <td className="px-3 text-right text-slate-600 font-medium">{fmt(item.p1Salary || item.baseSalary)}</td>
                                            <td className="px-3 text-right text-slate-600">{fmt(item.p21Salary)}</td>
                                            <td className="px-3 text-right text-slate-600">{fmt(item.p22Salary)}</td>
                                            <td className="px-3 text-right text-slate-600">{fmt(item.probationSalary)}</td>

                                            {/* Group II */}
                                            <td className="px-3 text-center font-bold text-slate-500">{ncChuẩn}</td>
                                            <td className="px-3 text-center text-indigo-600 font-bold">{ncChínhThức}</td>
                                            <td className="px-3 text-center text-indigo-600">{ncThửViệc}</td>
                                            <td className="px-3 text-center text-indigo-400 italic">{ncKhác}</td>

                                            {/* Group III */}
                                            <td className="px-3 text-center font-black text-blue-600">{item.kpiPercentage || 100}%</td>
                                            <td className="px-3 text-right font-bold text-blue-800">{fmt(p1ThựcNhận)}</td>
                                            <td className="px-3 text-right font-bold text-blue-800">{fmt(p21ThựcNhận)}</td>
                                            <td className="px-3 text-right font-bold text-blue-800">{fmt(p22ThựcNhận)}</td>
                                            <td className="px-3 text-right font-bold text-blue-800">{fmt(probationThựcNhận)}</td>
                                            <td className="px-3 text-right font-black text-indigo-900 bg-indigo-50/50">{fmt(tổngLươngChính)}</td>

                                            {/* Group IV */}
                                            <td className="px-3 text-right text-slate-700">{fmt(thưởngP3)}</td>
                                            <td className="px-3 text-right text-slate-700">{fmt(phụCấp)}</td>
                                            <td className="px-3 text-right text-indigo-600 font-bold">{fmt(ot)}</td>
                                            <td className="px-3 text-right text-emerald-600">{fmt(truyThuTínhThuế)}</td>
                                            <td className="px-3 text-right text-emerald-600">{fmt(truyThuKoThuế)}</td>
                                            <td className="px-3 text-right text-slate-500 italic">{fmt(khácKoThuế)}</td>

                                            {/* Group V - Total */}
                                            <td className="px-3 text-right font-black text-white bg-emerald-600 text-xs shadow-inner">{fmt(tổngThuNhập)}</td>
                                            <td className="px-3 text-center text-[10px] text-slate-400">#51</td>

                                            {/* Group VI - Deductions */}
                                            <td className="px-3 text-right text-rose-600 font-medium">{fmt(bhxhNLĐ)}</td>
                                            <td className="px-3 text-right text-rose-400">{fmt(item.insuranceAdjustment)}</td>
                                            <td className="px-3 text-right text-rose-400">{fmt(item.unionFee)}</td>
                                            <td className="px-3 text-right text-rose-400">{fmt(item.partyFee)}</td>
                                            <td className="px-3 text-right text-slate-400 italic text-[10px]">{fmt(item.familyDeduction)}</td>
                                            <td className="px-3 text-right text-slate-500 font-medium">{fmt(item.taxableIncome)}</td>
                                            <td className="px-3 text-right text-rose-700 font-bold">{fmt(thuếTNCN)}</td>
                                            <td className="px-3 text-right text-rose-500">{fmt(item.taxAdjustment)}</td>
                                            <td className="px-3 text-right text-rose-500">{fmt( khấuTrừKhác )}</td>
                                            <td className="px-3 text-right font-black text-white bg-rose-600 text-xs">{fmt(tổngKhấuTrừ)}</td>

                                            {/* Group VII - Net */}
                                            <td className="px-3 text-right font-black text-white bg-amber-600 text-[13px] shadow-lg">{fmt(thựcLĩnh)}</td>

                                            {/* Group VIII - Cost */}
                                            <td className="px-3 text-right text-slate-400">{fmt(kpcđCty)}</td>
                                            <td className="px-3 text-right text-slate-400">{fmt(bhxhCty)}</td>
                                            <td className="px-3 text-right font-bold text-slate-200 bg-slate-900">{fmt(tổngChiPhíNS)}</td>

                                            <td className="px-5 text-slate-400 italic font-medium truncate max-w-[250px]">{item.note || "—"}</td>
                                        </tr>
                                    );
                                })}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Premium Calculation Methodology Legend */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-8">
                    <Calculator className="h-6 w-6 text-indigo-600" />
                    <div>
                        <h3 className="text-base font-black text-slate-800 uppercase tracking-tight">Quy chuẩn tính toán bảng lương chi tiết</h3>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">Dựa trên hệ thống 36 chỉ tiêu và 3P framework</p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    <CalculationRule 
                        icon={Calculator} 
                        color="blue" 
                        title="1. Lương thực nhận P1 & P2.1"
                        rule="= (Lương / NC chuẩn) × (Ngày công chính thức + Nghỉ phép/Lễ) [× % KPI đối với P2.1]"
                    />
                    <CalculationRule 
                        icon={ShieldCheck} 
                        color="rose" 
                        title="2. Khấu trừ Bảo hiểm"
                        rule="= 10.5% × Lương đóng BHXH (indicator 1.1)"
                    />
                    <CalculationRule 
                        icon={Wallet} 
                        color="emerald" 
                        title="3. Tổng thu nhập (51)"
                        rule="= Lương chính (36) + Thưởng P3 + Phụ cấp + OT + Truy thu"
                    />
                    <CalculationRule 
                        icon={Calculator} 
                        color="amber" 
                        title="4. Thực lĩnh NET (66)"
                        rule="= Tổng thu nhập (51) - Tổng các khoản khấu trừ (65.1)"
                    />
                </div>
                {/* Footer Notes */}
                <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium italic">
                        <span>● Lương được tính dựa trên dữ liệu chấm công đã chốt</span>
                        <span>● Công thức áp dụng chuẩn 3P cho khối vận hành và gián tiếp</span>
                    </div>
                    <div className="text-[10px] font-black text-indigo-400/50 tracking-widest uppercase">
                        SmartHR Payroll Engine v3.0
                    </div>
                </div>
            </div>
        </div>
    );
}

const CalculationRule = ({ icon: Icon, color, title, rule }) => {
    const colors = {
        blue: "text-blue-600 bg-blue-50 border-blue-100",
        rose: "text-rose-600 bg-rose-50 border-rose-100",
        emerald: "text-emerald-600 bg-emerald-50 border-emerald-100",
        amber: "text-amber-600 bg-amber-50 border-amber-100"
    };

    return (
        <div className="space-y-3 p-4 rounded-xl border bg-white shadow-sm hover:shadow-md transition-shadow">
            <div className={`flex items-center gap-2 font-bold text-[11px] uppercase ${colors[color].split(' ')[0]}`}>
                <div className={`p-1.5 rounded-lg border ${colors[color]}`}><Icon className="h-4 w-4" /></div>
                {title}
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed font-medium p-3 bg-slate-50/50 rounded-lg italic">
                {rule}
            </p>
        </div>
    );
};
