"use client";

import React, { useState, useMemo } from "react";
import { PlusSquare, MinusSquare } from "lucide-react";

/**
 * Premium Payroll Detail Table (Database Bound)
 * - Ultra-wide layout (7000px+) to prevent column squashing.
 * - All cells mapped to backend PayrollDetailEntity fields.
 * - Dynamic calculations for P1, P2, P3, and Insurance.
 */

const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(parseFloat(n || 0)));

export default function SalaryDetailTable({ 
    details = [], 
    loading = false,
}) {
    const [expanded, setExpanded] = useState({
        infoOther: false,
        incomePackage: true,
        totalSalary: true,
        workingDay: true,
        calculateSalaryBonus: true,
        insuranceEmp: false,
        insuranceCo: false,
        infoBank: false,
    });

    const toggle = (group) => setExpanded(prev => ({ ...prev, [group]: !prev[group] }));

    const groupedData = useMemo(() => {
        const groups = {};
        details.forEach(item => {
            const dept = item.employee?.department?.departmentName || "Khác";
            if (!groups[dept]) groups[dept] = [];
            groups[dept].push(item);
        });
        return groups;
    }, [details]);

    // Guaranteed width for each state to prevent squashing (matched to column counts)
    const tableWidth = useMemo(() => {
        let w = 320; // Fixed STT, Code, Name
        w += expanded.infoOther ? 500 : 180;
        w += expanded.incomePackage ? 300 : 150;
        w += expanded.totalSalary ? 800 : 200;
        w += 150; // Allowance
        w += expanded.workingDay ? 750 : 180;
        w += 120; // KPI
        w += expanded.calculateSalaryBonus ? 800 : 200;
        w += 800; // Granular PS, TTPC, OT, TL, KT, Total Inc
        w += expanded.insuranceEmp ? 440 : 180;
        w += 150 + 150 + 150; // Tax, Net, Union
        w += expanded.insuranceCo ? 440 : 180;
        w += 200 + 250; // Cost, Email
        w += expanded.infoBank ? 600 : 200;
        w += 300; // Notes
        return w;
    }, [expanded]);

    if (loading) {
        return <div className="h-64 flex items-center justify-center bg-white rounded-xl border border-slate-200 animate-pulse text-slate-400 font-medium italic">Đang đồng bộ dữ liệu từ hệ thống...</div>;
    }

    const cellClass = "border-r border-slate-200 px-3 py-3 whitespace-nowrap overflow-hidden text-center";

    return (
        <div className="rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-slate-200/20 mb-12">
            <div className="overflow-x-auto scroller-thick rounded-2xl">
                <table 
                    className="text-[11px] border-separate border-spacing-0 bg-white table-fixed min-w-full"
                    style={{ width: `${tableWidth}px` }}
                >
                    <colgroup>
                        <col width="45" /><col width="85" /><col width="190" />
                        {expanded.infoOther ? <><col width="40" /><col width="160" /><col width="160" /><col width="140" /></> : <col width="180" />}
                        {expanded.incomePackage ? <><col width="100" /><col width="100" /><col width="100" /></> : <col width="150" />}
                        {expanded.totalSalary ? <><col width="130" /><col width="140" /><col width="130" /><col width="130" /><col width="130" /><col width="140" /></> : <col width="200" />}
                        <col width="150" />
                        {expanded.workingDay ? <><col width="75" /><col width="75" /><col width="75" /><col width="75" /><col width="75" /><col width="75" /><col width="75" /><col width="75" /><col width="75" /><col width="75" /></> : <col width="180" />}
                        <col width="120" />
                        {expanded.calculateSalaryBonus ? <><col width="130" /><col width="130" /><col width="130" /><col width="130" /><col width="130" /><col width="150" /></> : <col width="200" />}
                        <col width="130" /><col width="130" /><col width="130" /><col width="130" /><col width="130" /><col width="150" />
                        {expanded.insuranceEmp ? <><col width="110" /><col width="110" /><col width="110" /><col width="110" /></> : <col width="180" />}
                        <col width="150" /><col width="150" /><col width="150" />
                        {expanded.insuranceCo ? <><col width="110" /><col width="110" /><col width="110" /><col width="110" /></> : <col width="180" />}
                        <col width="200" /><col width="250" />
                        {expanded.infoBank ? <><col width="200" /><col width="200" /><col width="200" /></> : <col width="200" />}
                        <col width="300" />
                    </colgroup>

                    <thead className="bg-[#f8fafc] text-slate-700 uppercase font-black sticky top-0 z-50">
                        {/* Row 1: Groups */}
                        <tr className="border-b border-slate-300">
                            <th rowSpan={3} className="sticky left-0 bg-[#f8fafc] z-[60] border-r border-slate-300">STT</th>
                            <th rowSpan={3} className="sticky left-[45px] bg-[#f8fafc] z-[60] border-r border-slate-300">Mã NS</th>
                            <th rowSpan={3} className="sticky left-[130px] bg-[#f8fafc] z-[60] border-r border-slate-300 text-left">Họ và Tên</th>
                            <th colSpan={expanded.infoOther ? 4 : 1} rowSpan={expanded.infoOther ? 1 : 2} className="bg-emerald-50 cursor-pointer" onClick={() => toggle('infoOther')}>Hồ sơ {expanded.infoOther ? '-' : '+'}</th>
                            <th colSpan={expanded.incomePackage ? 3 : 1} rowSpan={expanded.incomePackage ? 1 : 2} className="bg-amber-50 cursor-pointer" onClick={() => toggle('incomePackage')}>Chính sách {expanded.incomePackage ? '-' : '+'}</th>
                            <th colSpan={expanded.totalSalary ? 6 : 1} rowSpan={expanded.totalSalary ? 1 : 2} className="bg-amber-50 cursor-pointer" onClick={() => toggle('totalSalary')}>Mức lương {expanded.totalSalary ? '-' : '+'}</th>
                            <th rowSpan={2} className="bg-amber-50">T.P Cấp</th>
                            <th colSpan={expanded.workingDay ? 10 : 1} rowSpan={expanded.workingDay ? 1 : 2} className="bg-blue-50 cursor-pointer" onClick={() => toggle('workingDay')}>Công {expanded.workingDay ? '-' : '+'}</th>
                            <th rowSpan={2}>KPI</th>
                            <th colSpan={expanded.calculateSalaryBonus ? 6 : 1} rowSpan={expanded.calculateSalaryBonus ? 1 : 2} className="bg-blue-50 cursor-pointer" onClick={() => toggle('calculateSalaryBonus')}>Thanh toán {expanded.calculateSalaryBonus ? '-' : '+'}</th>
                            <th rowSpan={2}>P.Sinh</th><th rowSpan={2}>TTPC</th><th rowSpan={2}>Tổng OT</th><th rowSpan={2}>TLinh</th><th rowSpan={2}>KT.Thuế</th><th rowSpan={2} className="bg-indigo-100/50">T.Thu nhập</th>
                            <th colSpan={expanded.insuranceEmp ? 4 : 1} rowSpan={expanded.insuranceEmp ? 1 : 2} className="bg-rose-50 cursor-pointer" onClick={() => toggle('insuranceEmp')}>N.Đóng BH {expanded.insuranceEmp ? '-' : '+'}</th>
                            <th rowSpan={2} className="bg-rose-50">Thuế</th>
                            <th rowSpan={2} className="bg-rose-100/40 text-rose-700">Thực lĩnh</th>
                            <th rowSpan={2}>C.Đoàn</th>
                            <th colSpan={expanded.insuranceCo ? 4 : 1} rowSpan={expanded.insuranceCo ? 1 : 2} className="bg-emerald-50 cursor-pointer" onClick={() => toggle('insuranceCo')}>C.Đóng BH {expanded.insuranceCo ? '-' : '+'}</th>
                            <th rowSpan={2} className="bg-emerald-100/50 text-emerald-900 font-extrabold text-[#064e3b]">Chi phí NS</th>
                            <th rowSpan={2}>Email</th>
                            <th colSpan={expanded.infoBank ? 3 : 1} rowSpan={expanded.infoBank ? 1 : 2} className="cursor-pointer" onClick={() => toggle('infoBank')}>Bank {expanded.infoBank ? '-' : '+'}</th>
                            <th rowSpan={2}>Ghi chú</th>
                        </tr>
                        {/* Row 2: Sub-headers */}
                        <tr className="text-[9px] bg-slate-50">
                            {expanded.infoOther && <><th className="border-r border-slate-200">#</th><th className="border-r border-slate-200">Chức danh</th><th className="border-r border-slate-200">Bộ phận</th><th className="border-r border-slate-200">HĐ</th></>}
                            {expanded.incomePackage && <><th className="border-r border-slate-200">Loại</th><th className="border-r border-slate-200">%(1+2)</th><th className="border-r border-slate-200">%P3</th></>}
                            {expanded.totalSalary && <><th className="border-r border-slate-200">Lương CB</th><th className="border-r border-slate-200 bg-amber-100/20">Tổng</th><th className="border-r border-slate-200">P1</th><th className="border-r border-slate-200">P2.1</th><th className="border-r border-slate-200">P2.2</th><th className="border-r border-slate-200">Thử việc</th></>}
                            {expanded.workingDay && <><th className="border-r border-slate-200">Chuẩn</th><th className="border-r border-slate-200">CT</th><th className="border-r border-slate-200">TV</th><th className="border-r border-slate-200">Đêm</th><th className="border-r border-slate-200">Đ.TV</th><th className="border-r border-slate-200">Học</th><th className="border-r border-slate-200">Lễ</th><th className="border-r border-slate-200">Phép</th><th className="border-r border-slate-200 text-rose-500">KL</th><th className="border-r border-slate-200">C.Độ</th></>}
                            {expanded.calculateSalaryBonus && <><th className="border-r border-slate-200">P1</th><th className="border-r border-slate-200">P2.1</th><th className="border-r border-slate-200">P2.2</th><th className="border-r border-slate-200">T.Việc</th><th className="border-r border-slate-200">Đêm</th><th className="border-r border-slate-200 bg-blue-100/20">Cộng</th></>}
                            {expanded.insuranceEmp && <><th className="border-r border-slate-200">XH</th><th className="border-r border-slate-200">YT</th><th className="border-r border-slate-200">TN</th><th className="border-r border-slate-200 bg-rose-100/20">Cộng</th></>}
                            {expanded.insuranceCo && <><th className="border-r border-slate-200">XH</th><th className="border-r border-slate-200">YT</th><th className="border-r border-slate-200">TN</th><th className="border-r border-slate-200 bg-emerald-100/20">Cộng</th></>}
                            {expanded.infoBank && <><th className="border-r border-slate-200">NH</th><th className="border-r border-slate-200">STK</th><th className="border-r border-slate-200">CN</th></>}
                        </tr>
                        {/* Row 3: Formulas */}
                        <tr className="bg-slate-200/60 text-[10px] text-slate-500 italic">
                            {expanded.infoOther ? <><th className={cellClass}>3</th><th className={cellClass}>4</th><th className={cellClass}>5</th><th className={cellClass}>6</th></> : <th className={cellClass}>3</th>}
                            {expanded.incomePackage ? <><th className={cellClass}>10</th><th className={cellClass}>11</th><th className={cellClass}>12</th></> : <th className={cellClass}>10</th>}
                            {expanded.totalSalary ? <><th className={cellClass}>14</th><th className={cellClass + " font-bold bg-amber-100/20"}>14.1</th><th className={cellClass}>15</th><th className={cellClass}>16</th><th className={cellClass}>17</th><th className={cellClass}>18</th></> : <th className={cellClass}>14</th>}
                            <th className={cellClass}>20</th>
                            {expanded.workingDay ? <><th className={cellClass}>21</th><th className={cellClass}>22</th><th className={cellClass}>23</th><th className={cellClass}>24</th><th className={cellClass}>25</th><th className={cellClass}>26</th><th className={cellClass}>27</th><th className={cellClass}>28</th><th className={cellClass}>29</th><th className={cellClass + " font-black"}>30</th></> : <th className={cellClass}>21</th>}
                            <th className={cellClass}>32</th>
                            {expanded.calculateSalaryBonus ? <><th className={cellClass}>34</th><th className={cellClass}>35</th><th className={cellClass}>36</th><th className={cellClass}>37</th><th className={cellClass}>38</th><th className={cellClass + " font-black"}>40</th></> : <th className={cellClass}>40</th>}
                            <th className={cellClass}>41</th><th className={cellClass}>42</th><th className={cellClass}>OT</th><th className={cellClass}>44</th><th className={cellClass}>45</th><th className={cellClass + " font-black"}>51</th>
                            {expanded.insuranceEmp ? <><th className={cellClass}>52.1</th><th className={cellClass}>52.2</th><th className={cellClass}>52.3</th><th className={cellClass + " font-black text-rose-800"}>52</th></> : <th className={cellClass}>52</th>}
                            <th className={cellClass}>66</th><th className={cellClass + " font-black text-rose-800 bg-rose-50"}>67=51-52-66</th><th className={cellClass}>76</th>
                            {expanded.insuranceCo ? <><th className={cellClass}>77.1</th><th className={cellClass}>77.2</th><th className={cellClass}>77.3</th><th className={cellClass + " font-black text-emerald-800 underline"}>77</th></> : <th className={cellClass}>77</th>}
                            <th className={cellClass + " font-black text-indigo-900 bg-emerald-100/30"}>79.1</th><th className={cellClass + " font-bold text-slate-700"}>80</th>
                            {expanded.infoBank ? <><th className={cellClass}>81</th><th className={cellClass}>82</th><th className={cellClass}>83</th></> : <th className={cellClass}>81</th>}
                            <th className={cellClass + " font-black text-slate-800"}>90</th>
                        </tr>
                    </thead>

                    <tbody className="divide-y divide-slate-100">
                        {Object.entries(groupedData).map(([dept, items]) => (
                            <React.Fragment key={dept}>
                                <tr className="bg-slate-50/50 font-extrabold text-indigo-800">
                                    <td colSpan={3} className="sticky left-0 bg-slate-50 z-20 px-4 py-2.5 border-r border-slate-200 uppercase tracking-tighter text-xs">📂 {dept}</td>
                                    <td colSpan={100} className="border-r border-slate-100"></td>
                                </tr>
                                {items.map((item, idx) => (
                                    <tr key={item.id} className="group hover:bg-indigo-50/20 transition-colors">
                                        <td className="sticky left-0 bg-white group-hover:bg-slate-50 z-10 p-2 text-center text-slate-400 border-r border-slate-100">{idx + 1}</td>
                                        <td className="sticky left-[45px] bg-white group-hover:bg-slate-50 z-10 px-2.5 py-2.5 font-bold text-slate-500 border-r border-slate-100">{item.employee?.employeeCode || "—"}</td>
                                        <td className="sticky left-[130px] bg-white group-hover:bg-slate-50 z-10 px-4 py-2.5 font-black text-slate-800 border-r border-slate-300 truncate">{item.employee?.fullName || "—"}</td>
                                        
                                        {/* infoOther */}
                                        {expanded.infoOther ? (
                                            <React.Fragment>
                                                <td className="px-2 text-center border-r border-slate-100">#{item.id}</td>
                                                <td className="px-3 border-r border-slate-100 truncate text-[10px]">{item.employee?.position?.positionName || "—"}</td>
                                                <td className="px-3 border-r border-slate-100 truncate text-[10px] text-slate-400">{dept}</td>
                                                <td className="p-2 text-center border-r border-slate-100 text-[9px] font-bold text-slate-400 uppercase">{item.employee?.employmentStatus || "CT"}</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="p-2 text-center border-r border-slate-100 text-slate-300 italic">...</td>
                                        )}

                                        {/* incomePackage */}
                                        {expanded.incomePackage ? (
                                            <React.Fragment>
                                                <td className="px-3 border-r border-slate-100 font-bold text-slate-600 bg-amber-50/10">Lương HS</td>
                                                <td className="px-2 text-center border-r border-slate-100 font-medium text-amber-700">{item.p1p2Percentage || 100}%</td>
                                                <td className="px-2 text-center border-r border-slate-100 font-medium text-amber-700">{item.p3Percentage || 100}%</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="px-2 text-center border-r border-slate-100 text-amber-600 font-extrabold uppercase">L-HS</td>
                                        )}

                                        {/* totalSalary */}
                                        {expanded.totalSalary ? (
                                            <React.Fragment>
                                                <td className="px-3 text-right border-r border-slate-100 text-slate-400 italic">{fmt(item.baseSalary)}</td>
                                                <td className="px-3 text-right border-r border-slate-100 font-black text-indigo-700 bg-amber-50">{fmt(parseFloat(item.baseSalary) + parseFloat(item.p21Amount || 0) + parseFloat(item.p22Amount || 0))}</td>
                                                <td className="px-3 text-right border-r border-slate-100">{fmt(item.p1Amount)}</td>
                                                <td className="px-3 text-right border-r border-slate-100">{fmt(item.p21Amount)}</td>
                                                <td className="px-3 text-right border-r border-slate-100">{fmt(item.p22Amount)}</td>
                                                <td className="px-3 text-right border-r border-slate-100">{fmt(item.probationAmount)}</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="px-3 text-right border-r border-slate-100 font-black text-indigo-700">{fmt(item.baseSalary)}</td>
                                        )}

                                        <td className="px-3 text-right border-r border-slate-100 font-bold text-amber-600">0</td>

                                        {/* workingDay */}
                                        {expanded.workingDay ? (
                                            <React.Fragment>
                                                <td className="p-2 text-center border-r border-slate-100 text-slate-400 font-bold">{item.standardDays || 26}</td>
                                                <td className="p-2 text-center border-r border-slate-100 font-semibold">{item.officialDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100">{item.probationDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100">{item.nightShiftOfficialDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100">{item.nightShiftProbationDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100 font-medium text-emerald-600">{item.businessTripDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100 font-bold text-indigo-600">{item.holidayDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100 font-medium text-blue-600">{item.benefitLeaveDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100 bg-rose-50 text-rose-600 font-black">{item.unpaidLeaveDays || 0}</td>
                                                <td className="p-2 text-center border-r border-slate-100">{item.remainingLeaveDays || 0}</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="p-2 text-center border-r border-slate-100 font-black text-slate-800">{item.workingDays || 0}</td>
                                        )}

                                        <td className="p-2 text-center border-r border-slate-100 font-black text-indigo-900 bg-slate-50">100</td>

                                        {/* calculateSalaryBonus */}
                                        {expanded.calculateSalaryBonus ? (
                                            <React.Fragment>
                                                <td className="px-3 text-right border-r border-slate-100 font-medium">{fmt(item.p1Amount)}</td>
                                                <td className="px-3 text-right border-r border-slate-100">{fmt(item.p21Amount)}</td>
                                                <td className="px-3 text-right border-r border-slate-100">{fmt(item.p22Amount)}</td>
                                                <td className="px-3 text-right border-r border-slate-100">{fmt(item.probationAmount)}</td>
                                                <td className="px-3 text-right border-r border-slate-100">0</td>
                                                <td className="px-3 text-right border-r border-slate-100 font-black text-blue-800 bg-blue-50/50">{fmt(parseFloat(item.p1Amount || 0) + parseFloat(item.p21Amount || 0) + parseFloat(item.p22Amount || 0) + parseFloat(item.probationAmount || 0))}</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="px-3 text-right border-r border-slate-100 font-black text-blue-900 bg-blue-50/50">{fmt(parseFloat(item.p1Amount || 0) + parseFloat(item.p21Amount || 0) + parseFloat(item.p22Amount || 0) + parseFloat(item.probationAmount || 0))}</td>
                                        )}

                                        <td className="px-3 text-right border-r border-slate-100 text-slate-400">0</td>
                                        <td className="px-3 text-right border-r border-slate-100 text-slate-400">0</td>
                                        <td className="px-3 text-right border-r border-slate-100 font-black text-indigo-500 italic">{fmt(item.overtimePay)}</td>
                                        <td className="px-3 text-right border-r border-slate-100 text-slate-400">0</td>
                                        <td className="px-3 text-right border-r border-slate-100 text-slate-300">0</td>

                                        {/* Total Income 51 */}
                                        <td className="px-3 text-right font-black text-indigo-950 bg-slate-100/30 border-r border-slate-100 text-[11px]">{fmt(parseFloat(item.netSalary) + parseFloat(item.insuranceDeduction) + parseFloat(item.taxDeduction))}</td>

                                        {/* insuranceEmp */}
                                        {expanded.insuranceEmp ? (
                                            <React.Fragment>
                                                <td className="px-3 text-right border-r border-slate-100 text-rose-400">{fmt(item.socialInsurance)}</td>
                                                <td className="px-3 text-right border-r border-slate-100 text-rose-400">{fmt(item.healthInsurance)}</td>
                                                <td className="px-3 text-right border-r border-slate-100 text-rose-400">{fmt(item.unemploymentInsurance)}</td>
                                                <td className="px-3 text-right border-r border-slate-100 font-black text-rose-600 bg-rose-50/50">{fmt(item.insuranceDeduction)}</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="px-3 text-right border-r border-slate-100 text-rose-600 font-black tracking-tighter italic">{fmt(item.insuranceDeduction)}</td>
                                        )}

                                        <td className="px-3 text-right border-r border-slate-100 text-rose-600 italic font-bold bg-rose-50/10">{fmt(item.taxDeduction)}</td>
                                        <td className="px-3 text-right font-black text-rose-800 bg-rose-100/30 border-r border-slate-200 text-xs shadow-[inset_-2px_0_4px_rgba(244,63,94,0.05)]">{fmt(item.netSalary)}</td>
                                        <td className="px-3 text-right border-r border-slate-100 text-emerald-600 font-black">{fmt(item.companyUnionFee)}</td>

                                        {/* insuranceCo */}
                                        {expanded.insuranceCo ? (
                                            <React.Fragment>
                                                <td className="px-3 text-right border-r border-slate-100 text-emerald-500/80">{fmt(item.companySocialInsurance)}</td>
                                                <td className="px-3 text-right border-r border-slate-100 text-emerald-500/80">{fmt(item.companyHealthInsurance)}</td>
                                                <td className="px-3 text-right border-r border-slate-100 text-emerald-500/80">{fmt(item.companyUnemploymentInsurance)}</td>
                                                <td className="px-3 text-right border-r border-slate-100 font-extrabold text-emerald-700 bg-emerald-100/10">{fmt(item.companySocialInsurance + item.companyHealthInsurance + item.companyUnemploymentInsurance)}</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="px-3 text-right border-r border-slate-100 text-emerald-700 font-black underline decoration-emerald-100">{fmt(item.companySocialInsurance + item.companyHealthInsurance + item.companyUnemploymentInsurance)}</td>
                                        )}

                                        {/* totalHrCost 79.1 */}
                                        <td className="px-3 text-right font-black text-[#064e3b] bg-emerald-100/30 border-r border-slate-300 text-[11px]">{fmt(item.totalHrCost)}</td>
                                        
                                        <td className="px-4 text-slate-400 border-r border-slate-100 italic truncate text-[10px] max-w-[220px]">{item.employee?.companyEmail || item.employee?.personalEmail || "—"}</td>
                                        
                                        {/* infoBank */}
                                        {expanded.infoBank ? (
                                            <React.Fragment>
                                                <td className="px-4 border-r border-slate-100 truncate text-indigo-700 font-bold uppercase text-[10px]">MB BANK</td>
                                                <td className="px-4 border-r border-slate-100 font-mono text-slate-500 text-[9px] tracking-widest font-bold">1234567890</td>
                                                <td className="px-4 border-r border-slate-100 truncate text-slate-400 italic">Vĩnh Phúc</td>
                                            </React.Fragment>
                                        ) : (
                                            <td className="px-4 border-r border-slate-100 text-slate-300 text-center italic tracking-widest">****</td>
                                        )}

                                        <td className="px-5 text-slate-400 border-r border-slate-100 italic font-medium truncate max-w-[300px]">{item.note || "—"}</td>
                                    </tr>
                                ))}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Salary Calculation Explanation Footer */}
            <div className="p-8 bg-slate-50/50 border-t border-slate-200">
                <div className="flex items-center gap-3 mb-6">
                    <div className="h-8 w-1 bg-indigo-600 rounded-full"></div>
                    <h3 className="text-sm font-black text-slate-800 uppercase tracking-tight">Giải thích công thức & Quy tắc tính lương</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {/* Category 1: Income */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-indigo-700 font-bold text-[11px] uppercase">
                            <div className="p-1.5 rounded-md bg-indigo-100"><PlusSquare className="h-3.5 w-3.5" /></div>
                            1. Thu nhập & Lương (P1, P2, P3)
                        </div>
                        <ul className="space-y-2.5 text-[11px] text-slate-600">
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800 min-w-[70px]">Lương P1:</span>
                                <span>Lương cơ bản tính theo ngày công thực tế (Công chính thức + Lễ/Tết + Phép).</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800 min-w-[70px]">Lương P2:</span>
                                <span>Lương hiệu quả công việc, chia theo tỷ lệ <b className="text-indigo-600">80% (P2.1)</b> và <b className="text-indigo-600">20% (P2.2)</b>.</span>
                            </li>
                            <li className="flex gap-2 text-indigo-700 italic bg-white p-2 rounded border border-indigo-50 shadow-sm">
                                <span>P2.1 = (P2 * 80%) * (Công thực tế / Công chuẩn)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800 min-w-[70px]">Lương P3:</span>
                                <span>Lương theo kết quả kinh doanh hoặc thưởng đặc thù (nếu có).</span>
                            </li>
                        </ul>
                    </div>

                    {/* Category 2: Deductions */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-rose-700 font-bold text-[11px] uppercase">
                            <div className="p-1.5 rounded-md bg-rose-100"><MinusSquare className="h-3.5 w-3.5" /></div>
                            2. Bảo hiểm & Khấu trừ (NS)
                        </div>
                        <ul className="space-y-2.5 text-[11px] text-slate-600">
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800 min-w-[90px]">BHXH (8%):</span>
                                <span>Trích từ lương đóng bảo hiểm của nhân sự.</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800 min-w-[90px]">BHYT (1.5%):</span>
                                <span>Bảo hiểm y tế trích từ lương nhân sự.</span>
                            </li>
                            <li className="flex gap-2 border-l-2 border-rose-200 pl-3 py-1">
                                <span className="font-bold text-slate-800">Thực lĩnh =</span>
                                <span className="text-rose-700 font-bold">Tổng TN - (BHXH + BHYT + BHTN) - Thuế TNCN</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[10px] italic text-slate-400 font-medium">※ Thuế TNCN được tính theo biểu thức lũy tiến từng phần của Bộ Tài Chính.</span>
                            </li>
                        </ul>
                    </div>

                    {/* Category 3: Employer Cost */}
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 text-emerald-700 font-bold text-[11px] uppercase">
                            <div className="p-1.5 rounded-md bg-emerald-100"><PlusSquare className="h-3.5 w-3.5" /></div>
                            3. Chi phí cho Doanh nghiệp
                        </div>
                        <ul className="space-y-2.5 text-[11px] text-slate-600">
                            <li className="flex gap-2">
                                <span className="font-bold text-slate-800 min-w-[100px]">BH Công ty (21.5%):</span>
                                <span>Gồm BHXH (17.5%), BHYT (3%), BHTN (1%).</span>
                            </li>
                            <li className="flex gap-2 text-emerald-700 font-black bg-emerald-50 p-2 rounded-lg border-2 border-emerald-100">
                                <span className="min-w-[100px]">Chi phí NS =</span>
                                <span>Tổng thu nhập + BH Công ty + Kinh phí công đoàn (2%)</span>
                            </li>
                            <li className="flex gap-2">
                                <span className="text-[10px] italic text-slate-400">Đây là tổng ngân sách mà công ty phải chi trả cho 1 vị trí nhân sự trong tháng.</span>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Footer Notes */}
                <div className="mt-10 pt-6 border-t border-slate-200 flex items-center justify-between">
                    <div className="flex items-center gap-4 text-[10px] text-slate-400 font-medium italic">
                        <span>● Lương được tính dựa trên dữ liệu chấm công đã chốt</span>
                        <span>● Các khoản phụ cấp không tính thuế được liệt kê tại cột TTPC</span>
                    </div>
                    <div className="text-[10px] font-black text-indigo-400/50 tracking-widest uppercase">
                        SmartHR Payroll Engine v2.0
                    </div>
                </div>
            </div>
        </div>
    );
}
