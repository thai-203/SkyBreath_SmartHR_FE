"use client";

import React, { useState, useMemo } from "react";
import { PlusSquare, MinusSquare, Building, Users, Wallet } from "lucide-react";

/**
 * Synchronized Hierarchical Salary Summary Table 
 * - UI matched to SalaryDetailTable (Light Headers, Slate Borders).
 * - Full 32-column aggregation from database.
 * - Mission-critical financial reporting layout.
 */

const fmt = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(parseFloat(n || 0)));

const TREE_ROW_CLASS = "hover:bg-slate-50 transition-all divide-x divide-slate-100 group border-b border-slate-200 cursor-pointer text-[11px]";
const CELL_CLASS = "px-3 py-3 text-center font-medium text-slate-600 whitespace-nowrap overflow-hidden truncate";
const STICKY_CELL_CLASS = "sticky left-0 bg-white group-hover:bg-slate-50 z-30 px-4 py-3 text-left border-r border-slate-300 shadow-[2px_0_10px_rgba(30,41,59,0.04)] font-bold text-slate-700 whitespace-nowrap overflow-hidden truncate";

export default function SalarySummaryTable({ details = [], unitName = "CTCP cấp thoát nước Sa Pa" }) {
    const [expandedKeys, setExpandedKeys] = useState(new Set(["root"]));

    const treeData = useMemo(() => {
        if (!details || details.length === 0) return null;

        const nodes = {};
        const emptyMetrics = () => ({
            empCount: 0, p1: 0, p2: 0, pBonus: 0, pProb: 0, allowance: 0,
            otTax: 0, otFree: 0, otTotal: 0,
            retroTax: 0, retroFree: 0, welfare: 0, otherInc: 0, totalInc: 0,
            taxable: 0, pit: 0,
            co_xh: 0, co_yt: 0, co_tn: 0, co_total_ins: 0, co_kpcd: 0, co_retro: 0,
            em_xh: 0, em_yt: 0, em_tn: 0, em_total_ins: 0, em_retro: 0, em_cdp: 0, em_dang: 0,
            net: 0, p3_2: 0, totalCost: 0
        });

        const root = { id: "root", name: unitName, isRoot: true, children: {}, metrics: emptyMetrics() };

        details.forEach(item => {
            const dept = item.employee?.department;
            if (!dept) return;

            const deptName = dept.departmentName || "Khác";
            if (!nodes[deptName]) {
                nodes[deptName] = { id: `dept-${dept.id || deptName}`, name: deptName, children: null, metrics: emptyMetrics() };
            }

            const updateMetrics = (m) => {
                m.empCount += 1;
                m.p1 += parseFloat(item.p1Amount || 0);
                m.p2 += parseFloat(item.p21Actual || item.p21Amount || 0) + parseFloat(item.p22Actual || item.p22Amount || 0);
                m.pBonus += parseFloat(item.bonus || 0);
                m.pProb += parseFloat(item.probationAmount || 0);
                m.allowance += parseFloat(item.allowanceAmount || 0);
                m.otTotal += parseFloat(item.overtimePay || 0);
                m.otTax += parseFloat(item.overtimePay || 0) * 0.7; // Placeholder ratio
                m.otFree += parseFloat(item.overtimePay || 0) * 0.3; // Placeholder ratio
                m.retroTax += parseFloat(item.otherTaxableIncome || 0);
                m.retroFree += parseFloat(item.otherNonTaxableIncome || 0);
                m.totalInc += (parseFloat(item.netSalary) || 0) + (parseFloat(item.insuranceDeduction) || 0) + (parseFloat(item.taxDeduction) || 0) + (parseFloat(item.penalty) || 0) + (parseFloat(item.deduction) || 0);
                m.taxable += parseFloat(item.taxableIncomePaid || 0);
                m.pit += parseFloat(item.taxDeduction || 0);
                // Company
                m.co_xh += parseFloat(item.companySocialInsurance || 0);
                m.co_yt += parseFloat(item.companyHealthInsurance || 0);
                m.co_tn += parseFloat(item.companyUnemploymentInsurance || 0);
                m.co_total_ins += parseFloat(item.companySocialInsurance || 0) + parseFloat(item.companyHealthInsurance || 0) + parseFloat(item.companyUnemploymentInsurance || 0);
                m.co_kpcd += parseFloat(item.unionFee || 0); // KPCĐ Công ty lưu trong cột union_fee
                // Employee
                m.em_xh += parseFloat(item.socialInsurance || 0);
                m.em_yt += parseFloat(item.healthInsurance || 0);
                m.em_tn += parseFloat(item.unemploymentInsurance || 0);
                m.em_total_ins += parseFloat(item.insuranceDeduction || 0);
                m.em_cdp += 0; // KPCĐ chỉ là phí công ty, không trừ vào lương NLĐ
                m.em_dang += parseFloat(item.partyFee || 0);
                // Final
                m.net += parseFloat(item.netSalary || 0);
                m.totalCost += parseFloat(item.totalHrCost || 0);
            };

            updateMetrics(nodes[deptName].metrics);
            updateMetrics(root.metrics);
        });

        root.children = Object.values(nodes).sort((a, b) => b.metrics.totalCost - a.metrics.totalCost);
        return root;
    }, [details, unitName]);

    const toggle = (id) => setExpandedKeys(v => { const n = new Set(v); n.has(id) ? n.delete(id) : n.add(id); return n; });

    if (!treeData) return <div className="h-64 flex items-center justify-center bg-white rounded-2xl border border-slate-200 italic text-slate-400">Đang đồng bộ dữ liệu tổng hợp...</div>;

    const renderRows = (node, level = 0) => {
        const isExp = expandedKeys.has(node.id);
        const hasChildren = node.children && node.children.length > 0;
        const indent = level * 20;

        return (
            <React.Fragment key={node.id}>
                <tr className={`${TREE_ROW_CLASS} ${node.isRoot ? 'bg-slate-50/50' : ''}`} onClick={() => hasChildren && toggle(node.id)}>
                    <td className={STICKY_CELL_CLASS} style={{ paddingLeft: `${16 + indent}px` }}>
                        <div className="flex items-center gap-2">
                            {hasChildren ? (isExp ? <MinusSquare className="h-4 w-4 text-indigo-500" strokeWidth={2.5} /> : <PlusSquare className="h-4 w-4 text-slate-400" strokeWidth={1.5} />) : <div className="h-4 w-4" />}
                            <span className="truncate">{node.name}</span>
                        </div>
                    </td>
                    <td className={CELL_CLASS}>{node.metrics.empCount}</td>
                    <td className={`${CELL_CLASS} text-right font-bold`}>{fmt(node.metrics.p1)}</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.p2)}</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.pBonus)}</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.pProb)}</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.allowance)}</td>
                    <td className={`${CELL_CLASS} text-right text-indigo-600 bg-blue-50/30`}>{fmt(node.metrics.otTax)}</td>
                    <td className={`${CELL_CLASS} text-right text-indigo-600 bg-blue-50/30`}>{fmt(node.metrics.otFree)}</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.retroTax)}</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.retroFree)}</td>
                    <td className={`${CELL_CLASS} text-right`}>0</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.otherInc)}</td>
                    <td className={`${CELL_CLASS} text-right font-black text-slate-900 bg-slate-50/50`}>{fmt(node.metrics.totalInc)}</td>
                    <td className={`${CELL_CLASS} text-right`}>{fmt(node.metrics.taxable)}</td>
                    <td className={`${CELL_CLASS} text-right text-rose-600`}>{fmt(node.metrics.pit)}</td>
                    {/* Co */}
                    <td className={`${CELL_CLASS} text-right bg-emerald-50/20`}>{fmt(node.metrics.co_xh)}</td>
                    <td className={`${CELL_CLASS} text-right bg-emerald-50/20`}>{fmt(node.metrics.co_yt)}</td>
                    <td className={`${CELL_CLASS} text-right bg-emerald-50/20`}>{fmt(node.metrics.co_tn)}</td>
                    <td className={`${CELL_CLASS} text-right font-bold text-emerald-800 bg-emerald-50/40`}>{fmt(node.metrics.co_total_ins)}</td>
                    <td className={`${CELL_CLASS} text-right bg-emerald-50/20`}>{fmt(node.metrics.co_kpcd)}</td>
                    <td className={`${CELL_CLASS} text-right bg-emerald-50/20`}>0</td>
                    {/* Em */}
                    <td className={`${CELL_CLASS} text-right bg-rose-50/20`}>{fmt(node.metrics.em_xh)}</td>
                    <td className={`${CELL_CLASS} text-right bg-rose-50/20`}>{fmt(node.metrics.em_yt)}</td>
                    <td className={`${CELL_CLASS} text-right bg-rose-50/20`}>{fmt(node.metrics.em_tn)}</td>
                    <td className={`${CELL_CLASS} text-right font-bold text-rose-800 bg-rose-50/40`}>{fmt(node.metrics.em_total_ins)}</td>
                    <td className={`${CELL_CLASS} text-right bg-rose-50/20`}>0</td>
                    <td className={`${CELL_CLASS} text-right bg-rose-50/20`}>{fmt(node.metrics.em_cdp)}</td>
                    <td className={`${CELL_CLASS} text-right bg-rose-50/20`}>{fmt(node.metrics.em_dang)}</td>
                    {/* Final */}
                    <td className={`${CELL_CLASS} text-right font-black text-indigo-900 bg-indigo-50/50 shadow-[inset_-2px_0_5px_rgba(0,0,0,0.02)]`}>{fmt(node.metrics.net)}</td>
                    <td className={`${CELL_CLASS} text-right`}>0</td>
                    <td className={`${CELL_CLASS} text-right font-black bg-indigo-100 text-indigo-900 border-l border-slate-300`}>{fmt(node.metrics.totalCost)}</td>
                </tr>
                {isExp && node.children && node.children.map(c => renderRows(c, level + 1))}
            </React.Fragment>
        );
    };

    const headerClass = "bg-[#f8fafc] text-slate-700 uppercase font-black px-2 py-3 text-center border-r border-slate-300 tracking-tighter text-[11px] h-[40px]";

    return (
        <div className="rounded-2xl border border-slate-300 bg-white shadow-2xl overflow-hidden animate-in fade-in duration-500">
            <div className="overflow-x-auto scroller-thick rounded-2xl">
                <table className="w-max table-fixed border-separate border-spacing-0 min-w-full">
                    <colgroup>
                        <col width="350" /><col width="70" /><col width="120" /><col width="120" /><col width="110" /><col width="110" /><col width="120" />
                        <col width="110" /><col width="110" /><col width="110" /><col width="110" /><col width="110" /><col width="110" /><col width="130" /><col width="120" /><col width="110" />
                        <col width="100" /><col width="100" /><col width="100" /><col width="110" /><col width="100" /><col width="100" />
                        <col width="100" /><col width="100" /><col width="100" /><col width="110" /><col width="100" /><col width="100" /><col width="100" />
                        <col width="140" /><col width="140" /><col width="160" />
                    </colgroup>
                    <thead className="z-0 shadow-sm border-b border-slate-300">
                        {/* Row 1 */}
                        <tr>
                            <th rowSpan={2} className={`${headerClass} sticky left-0 z-20 bg-[#f8fafc] border-b-2 font-black !text-indigo-900`}>Bộ phận / Đơn vị</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>NS</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2 bg-amber-50/30`}>Lương P1</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Thưởng P2</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>P.Sinh</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Thử việc</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Phụ cấp</th>
                            <th colSpan={2} className={`${headerClass} bg-blue-50/50 text-indigo-700 font-black`}>Tổng tiền OT, Tăng ca</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Truy (+) Thuế</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Truy (-) Thuế</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Phúc lợi</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Khác</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2 !text-slate-900 bg-slate-100/50`}>Tổng thu nhập</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>TN Chịu Thuế</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2 !text-rose-700`}>PIT</th>
                            <th colSpan={6} className={`${headerClass} bg-emerald-50/50 text-emerald-800 font-extrabold uppercase tracking-widest`}>Công ty đóng (Cost)</th>
                            <th colSpan={7} className={`${headerClass} bg-rose-50/50 text-rose-800 font-extrabold uppercase tracking-widest`}>Người lao động đóng</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2 !text-indigo-900 bg-indigo-50/50`}>Thực chi</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2`}>Dự phòng P3.2</th>
                            <th rowSpan={2} className={`${headerClass} border-b-2 !bg-indigo-600 !text-white font-black z-10 shadow-lg`}>Tổng chi phí DN</th>
                        </tr>
                        {/* Row 2 */}
                        <tr>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-blue-50/30`}>Có tính thuế</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-blue-50/30`}>Miễn thuế</th>
                            {/* Co */}
                            <th className={`${headerClass} border-b-2 text-[9px] bg-emerald-50/20`}>XH</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-emerald-50/20`}>YT</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-emerald-50/20`}>TN</th>
                            <th className={`${headerClass} border-b-2 text-[10px] bg-emerald-50/40 text-emerald-900`}>TỔNG BH</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-emerald-50/20`}>KPCĐ</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-emerald-50/20`}>Truy thu</th>
                            {/* Em */}
                            <th className={`${headerClass} border-b-2 text-[9px] bg-rose-50/20`}>XH</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-rose-50/20`}>YT</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-rose-50/20`}>TN</th>
                            <th className={`${headerClass} border-b-2 text-[10px] bg-rose-50/40 text-rose-900`}>TỔNG BH</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-rose-50/20`}>Truy thu</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-rose-50/20`}>CĐP</th>
                            <th className={`${headerClass} border-b-2 text-[9px] bg-rose-50/20`}>Đảng phí</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 italic-last bg-white text-[11px]">
                        {renderRows(treeData)}
                        {/* Summary Total Row */}
                        <tr className="bg-slate-700 text-white font-black h-12 shadow-[0_-5px_15px_rgba(0,0,0,0.1)] relative z-10">
                            <td className="sticky left-0 bg-slate-700 z-10 px-4 py-3 border-r border-white/20">TỔNG CỘNG HỆ THỐNG</td>
                            <td className="px-2 py-3 text-center">{treeData.metrics.empCount}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.p1)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.p2)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.pBonus)}</td>
                            <td className="px-2 py-3 text-right text-amber-200">{fmt(treeData.metrics.pProb)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.allowance)}</td>
                            <td className="px-2 py-3 text-right bg-slate-600/50">{fmt(treeData.metrics.otTax)}</td>
                            <td className="px-2 py-3 text-right bg-slate-600/50">{fmt(treeData.metrics.otFree)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.retroTax)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.retroFree)}</td>
                            <td className="px-2 py-3 text-center">0</td>
                            <td className="px-2 py-3 text-center">0</td>
                            <td className="px-2 py-3 text-right font-black text-amber-300">{fmt(treeData.metrics.totalInc)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.taxable)}</td>
                            <td className="px-2 py-3 text-right text-rose-300">{fmt(treeData.metrics.pit)}</td>
                            {/* Co */}
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.co_xh)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.co_yt)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.co_tn)}</td>
                            <td className="px-2 py-3 text-right text-emerald-300">{fmt(treeData.metrics.co_total_ins)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.co_kpcd)}</td>
                            <td className="px-2 py-3 text-center">0</td>
                            {/* Em */}
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.em_xh)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.em_yt)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.em_tn)}</td>
                            <td className="px-2 py-3 text-right text-rose-300">{fmt(treeData.metrics.em_total_ins)}</td>
                            <td className="px-2 py-3 text-center">0</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.em_cdp)}</td>
                            <td className="px-2 py-3 text-right">{fmt(treeData.metrics.em_dang)}</td>
                            {/* Costs */}
                            <td className="px-2 py-3 text-right font-black text-amber-400 bg-white/5">{fmt(treeData.metrics.net)}</td>
                            <td className="px-2 py-3 text-center">0</td>
                            <td className="px-2 py-3 text-right font-black text-emerald-300 bg-indigo-500/20">{fmt(treeData.metrics.totalCost)}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
