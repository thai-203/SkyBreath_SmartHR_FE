"use client";

import React, { useState, useMemo } from "react";
import { Search, RotateCcw, Send, Mail, Pencil, Eye, CheckCircle2, Building, Users, Printer } from "lucide-react";
import { Button } from "@/components/common/Button";
import PayslipDetailModal from "./PayslipDetailModal";

/**
 * Premium Payroll Slip Management Table (Phát hành phiếu lương)
 */

const fmt = (n) => new Intl.NumberFormat('vi-VN', { maximumFractionDigits: 0 }).format(Math.round(parseFloat(n || 0)));

export default function PayrollSlipTable({ details = [], onSendEmail, onRecalculate, onUpdateDetail }) {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [searchTerm, setSearchTerm] = useState("");
    
    // Modal State
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [activeIndex, setActiveIndex] = useState(0);

    // --- Grouping Logic ---
    const groupedData = useMemo(() => {
        const groups = {};
        let globalIndex = 1;
        
        details.forEach(detail => {
            const deptName = detail.employee?.department?.departmentName || "Khác";
            if (!groups[deptName]) groups[deptName] = [];
            
            // Add search filtering
            const matchSearch = searchTerm === "" || 
                detail.employee?.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                detail.employee?.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase());
                
            if (matchSearch) {
                groups[deptName].push({ ...detail, stt: globalIndex++ });
            }
        });
        
        return Object.entries(groups).sort((a, b) => b[1].length - a[1].length);
    }, [details, searchTerm]);

    const allMatches = useMemo(() => groupedData.flatMap(([_, items]) => items), [groupedData]);

    // --- Selection Handlers ---
    const toggleSelectAll = () => {
        if (selectedIds.size === allMatches.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(allMatches.map(item => item.id)));
        }
    };

    const toggleSelectOne = (id) => {
        setSelectedIds(prev => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    // --- Modal Navigation ---
    const openDetail = (index) => {
        setActiveIndex(index);
        setIsModalOpen(true);
    };

    const handlePrev = () => setActiveIndex(prev => (prev > 0 ? prev - 1 : allMatches.length - 1));
    const handleNext = () => setActiveIndex(prev => (prev < allMatches.length - 1 ? prev + 1 : 0));

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Header / Actions bar */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200 shadow-sm z-[0]">
                <div className="flex items-center gap-2 text-slate-800 font-bold">
                    <CheckCircle2 className="h-5 w-5 text-indigo-500" />
                    <span>Kết quả tìm kiếm ({allMatches.length})</span>
                </div>
                
                <div className="flex flex-1 max-w-md relative group">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                    <input 
                        type="text" 
                        placeholder="Tìm kiếm nhanh nhân sự..." 
                        className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="flex items-center gap-2">
                    <Button 
                        variant="secondary" 
                        className="gap-2 bg-indigo-50 text-indigo-700 border-indigo-100 font-bold"
                        onClick={() => onRecalculate()}
                    >
                        <RotateCcw className="h-4 w-4" /> Tính lại
                    </Button>
                    <Button 
                        disabled={selectedIds.size === 0}
                        className={`gap-2 shadow-lg font-bold ${selectedIds.size > 0 ? 'bg-indigo-600 shadow-indigo-100 hover:bg-indigo-700' : 'bg-slate-200 text-slate-400'}`}
                        onClick={() => onSendEmail(Array.from(selectedIds))}
                    >
                        <Send className="h-4 w-4" /> Gửi email ({selectedIds.size})
                    </Button>
                </div>
            </div>

            {/* Main Table */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xl overflow-hidden">
                <div className="overflow-x-auto scroller-thick">
                    <table className="w-full text-sm border-collapse min-w-[900px]">
                        <thead>
                            <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                <th className="px-4 py-4 w-12 border-r">
                                    <input 
                                        type="checkbox" 
                                        className="h-4 w-4 rounded border-slate-300"
                                        checked={selectedIds.size === allMatches.length && allMatches.length > 0}
                                        onChange={toggleSelectAll}
                                    />
                                </th>
                                <th className="px-3 py-4 w-[80px] text-center border-r font-black">STT</th>
                                <th className="px-3 py-4 w-[120px] text-center border-r font-black">Mã nhân sự</th>
                                <th className="px-3 py-4 text-left border-r font-black">Tên nhân sự</th>
                                <th className="px-3 py-4 text-left border-r font-black">Chức danh</th>
                                <th className="px-3 py-4 text-left border-r font-black">Email</th>
                                <th className="px-3 py-4 w-[120px] text-center border-r font-black">Trạng thái</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                            {groupedData.map(([deptName, items]) => (
                                <React.Fragment key={deptName}>
                                    <tr className="bg-slate-50 border-y border-slate-100">
                                        <td className="px-4 py-2 border-r text-center text-slate-300 font-black">—</td>
                                        <td colSpan={6} className="px-3 py-2">
                                            <div className="flex items-center gap-2">
                                                <Building className="h-3.5 w-3.5 text-slate-400" />
                                                <span className="font-extrabold text-slate-700 text-[11px] uppercase tracking-wider">{deptName}</span>
                                            </div>
                                        </td>
                                    </tr>
                                    
                                    {items.map((item, localIdx) => (
                                        <tr 
                                            key={item.id} 
                                            className={`group transition-all border-b border-slate-100 cursor-pointer ${selectedIds.has(item.id) ? 'bg-indigo-50/50' : 'hover:bg-slate-50'}`}
                                            onClick={() => openDetail(allMatches.indexOf(item))}
                                        >
                                            <td className="px-4 py-3 text-center border-r" onClick={(e) => e.stopPropagation()}>
                                                <input 
                                                    type="checkbox" 
                                                    className="h-4 w-4 rounded border-slate-300"
                                                    checked={selectedIds.has(item.id)}
                                                    onChange={(e) => {
                                                        e.stopPropagation();
                                                        toggleSelectOne(item.id);
                                                    }}
                                                />
                                            </td>
                                            <td className="px-3 py-3 text-center text-slate-400 border-r">{item.stt}</td>
                                            <td className="px-3 py-3 text-center border-r font-bold text-slate-600">{item.employee?.employeeCode}</td>
                                            <td className="px-3 py-3 text-left border-r font-black text-indigo-900 group-hover:text-indigo-600 transition-colors">{item.employee?.fullName}</td>
                                            <td className="px-3 py-3 text-left border-r text-slate-600 font-medium">{item.employee?.position?.positionName}</td>
                                            <td className="px-3 py-3 text-left border-r text-slate-500 italic lowercase">{item.employee?.companyEmail}</td>
                                            <td className="px-3 py-3 text-center border-r">
                                                {item.payslipSentAt ? (
                                                    <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-black border border-emerald-100 shadow-sm">Đã đánh giá</span>
                                                ) : (
                                                    <span className="text-indigo-600 italic font-black text-[12px] tracking-tight">Chưa gửi</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                    </React.Fragment>
                                ))}
                                {allMatches.length === 0 && (
                                    <tr>
                                        <td colSpan={8} className="px-3 py-20 text-center">
                                            <Mail className="h-12 w-12 text-slate-200 mx-auto mb-4" />
                                            <p className="text-slate-400 italic">Không tìm thấy nhân sự phù hợp.</p>
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                    </table>
                </div>
            </div>

            {/* Payslip Modal */}
            {isModalOpen && (
                <PayslipDetailModal 
                    detail={allMatches[activeIndex]}
                    currentIndex={activeIndex}
                    totalCount={allMatches.length}
                    onClose={() => setIsModalOpen(false)}
                    onPrev={handlePrev}
                    onNext={handleNext}
                    onSaveNote={(id, note) => onUpdateDetail(id, { note })}
                />
            )}
            
            {/* Legend / Info */}
            <div className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-white shadow-sm border border-slate-200 text-indigo-600"><Users className="h-4 w-4" /></div>
                <div>
                    <p className="font-black text-slate-800 text-[11px] uppercase tracking-wide">Hướng dẫn quy trình</p>
                    <p className="text-xs text-slate-500 leading-relaxed mt-1">
                        Chọn các nhân sự cần gửi phiếu lương, sau đó bấm nút <strong className="text-indigo-600">"Gửi email"</strong>. Hệ thống sẽ tự động tạo bảng lương chi tiết đính kèm File PDF gửi tới Email công ty của từng nhân sự.
                    </p>
                </div>
            </div>
        </div>
    );
}
