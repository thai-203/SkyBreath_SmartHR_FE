"use client";

import { useState, useMemo, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Check, ChevronDown, ChevronRight } from "lucide-react";

export default function GenerateTimesheetModal({
    isOpen,
    onClose,
    onSubmit,
    departments,
    employees,
    existingTimesheets = [],
    loading,
}) {
    const [selectedEmployees, setSelectedEmployees] = useState(new Set());
    const [expandedDepts, setExpandedDepts] = useState(new Set());
    const [regenerateMode, setRegenerateMode] = useState(false);

    const existingEmployeeIds = useMemo(() => {
        return new Set(existingTimesheets.map(t => t.employeeId || t.employee?.id));
    }, [existingTimesheets]);

    // Reset selection when modal opens
    useEffect(() => {
        if (isOpen) {
            setSelectedEmployees(new Set());
            setRegenerateMode(false);
            setExpandedDepts(new Set(departments.map(d => d.id)));
        }
    }, [isOpen, departments]);

    // Group employees by department
    const groupedData = useMemo(() => {
        const groups = departments.map(dept => ({
            ...dept,
            employees: employees.filter(emp => emp.departmentId === dept.id)
        }));
        // Auto remove empty departments
        return groups.filter(g => g.employees.length > 0);
    }, [departments, employees]);

    const toggleDeptExpand = (deptId) => {
        const newExpanded = new Set(expandedDepts);
        if (newExpanded.has(deptId)) {
            newExpanded.delete(deptId);
        } else {
            newExpanded.add(deptId);
        }
        setExpandedDepts(newExpanded);
    };

    const isDeptFullySelected = (dept) => {
        const available = dept.employees.filter(emp => regenerateMode || !existingEmployeeIds.has(emp.id));
        if (!available.length) return false;
        return available.every(emp => selectedEmployees.has(emp.id));
    };

    const isDeptPartiallySelected = (dept) => {
        const available = dept.employees.filter(emp => regenerateMode || !existingEmployeeIds.has(emp.id));
        if (!available.length) return false;
        const selectedCount = available.filter(emp => selectedEmployees.has(emp.id)).length;
        return selectedCount > 0 && selectedCount < available.length;
    };

    const handleDeptToggle = (dept) => {
        const available = dept.employees.filter(emp => regenerateMode || !existingEmployeeIds.has(emp.id));
        if (!available.length) return;

        const newSelected = new Set(selectedEmployees);
        if (isDeptFullySelected(dept)) {
            available.forEach(emp => newSelected.delete(emp.id));
        } else {
            available.forEach(emp => newSelected.add(emp.id));
        }
        setSelectedEmployees(newSelected);
    };

    const handleEmployeeToggle = (empId) => {
        const isExisting = existingEmployeeIds.has(empId);
        if (isExisting && !regenerateMode) return;
        const newSelected = new Set(selectedEmployees);
        if (newSelected.has(empId)) {
            newSelected.delete(empId);
        } else {
            newSelected.add(empId);
        }
        setSelectedEmployees(newSelected);
    };

    const handleSubmit = () => {
        onSubmit(Array.from(selectedEmployees), regenerateMode);
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Tạo bảng chấm công" size="2xl">
            <div className="mb-4 text-sm text-slate-500">
                Vui lòng chọn các phòng ban hoặc nhân viên cụ thể để tạo bảng chấm công.
            </div>

            {/* Regenerate mode toggle */}
            <div className="mb-4 flex items-center gap-3 p-3 rounded-lg border border-amber-200 bg-amber-50">
                <button
                    type="button"
                    onClick={() => {
                        setRegenerateMode(v => !v);
                        setSelectedEmployees(new Set());
                    }}
                    className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors ${
                        regenerateMode ? 'bg-amber-500' : 'bg-slate-300'
                    }`}
                >
                    <span className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition-transform ${
                        regenerateMode ? 'translate-x-4' : 'translate-x-0'
                    }`} />
                </button>
                <div>
                    <p className="text-sm font-medium text-amber-800">Chế độ tạo lại (Regenerate)</p>
                    <p className="text-xs text-amber-600">{regenerateMode
                        ? 'Đang bật: có thể chọn nhân viên đã có bảng công để ghi đè'
                        : 'Tắt: chỉ tạo mới cho nhân viên chưa có bảng'
                    }</p>
                </div>
            </div>

            <div className="border border-slate-200 rounded-lg max-h-[400px] overflow-y-auto mb-6 bg-slate-50 p-2">
                {groupedData.length === 0 ? (
                    <div className="text-center py-8 text-slate-400">Không có dữ liệu nhân viên</div>
                ) : (
                    groupedData.map(dept => (
                        <div key={dept.id} className="mb-2 last:mb-0 bg-white rounded border border-slate-100 overflow-hidden shadow-sm">
                            <div className="flex items-center p-2 bg-slate-50 hover:bg-slate-100 transition-colors">
                                <button
                                    onClick={() => toggleDeptExpand(dept.id)}
                                    className="p-1 text-slate-400 hover:text-slate-600 focus:outline-none"
                                >
                                    {expandedDepts.has(dept.id) ? (
                                        <ChevronDown className="h-4 w-4" />
                                    ) : (
                                        <ChevronRight className="h-4 w-4" />
                                    )}
                                </button>
                                <div 
                                    className="flex items-center flex-1 cursor-pointer pl-2"
                                    onClick={() => handleDeptToggle(dept)}
                                >
                                    <div className={`w-4 h-4 rounded border flex flex-shrink-0 items-center justify-center mr-3 ${
                                        isDeptFullySelected(dept) 
                                            ? "bg-indigo-600 border-indigo-600" 
                                            : isDeptPartiallySelected(dept)
                                                ? "bg-indigo-100 border-indigo-600"
                                                : "bg-white border-slate-300"
                                    }`}>
                                        {isDeptFullySelected(dept) && <Check className="h-3 w-3 text-white" />}
                                        {isDeptPartiallySelected(dept) && <div className="h-1.5 w-1.5 rounded-sm bg-indigo-600" />}
                                    </div>
                                    <span className="font-medium text-slate-700 text-sm">
                                        {dept.departmentName}
                                    </span>
                                    <span className="ml-2 text-xs text-slate-400">
                                        ({dept.employees.length} nhân viên)
                                    </span>
                                </div>
                            </div>
                            
                            {expandedDepts.has(dept.id) && (
                                <div className="border-t border-slate-100 p-2 grid gap-1 grid-cols-1 sm:grid-cols-2">
                                    {dept.employees.map(emp => {
                                        const isExisting = existingEmployeeIds.has(emp.id);
                                        const isSelectable = !isExisting || regenerateMode;
                                        return (
                                            <div
                                                key={emp.id}
                                                className={`flex items-center p-1.5 rounded ${
                                                    !isSelectable ? 'cursor-not-allowed opacity-60 bg-slate-50' :
                                                    isExisting ? 'hover:bg-amber-50 cursor-pointer' :
                                                    'hover:bg-slate-50 cursor-pointer'
                                                }`}
                                                onClick={() => handleEmployeeToggle(emp.id)}
                                                title={isExisting && !regenerateMode ? 'Đã có bảng công tháng này' : isExisting ? 'Sẽ ghi đè bảng công cũ' : ''}
                                            >
                                                <div className={`w-4 h-4 rounded border flex-shrink-0 flex items-center justify-center mr-3 ${
                                                    isExisting && !regenerateMode ? 'bg-rose-50 border-rose-300' :
                                                    selectedEmployees.has(emp.id) ? 'bg-indigo-600 border-indigo-600' : 'bg-white border-slate-300'
                                                }`}>
                                                    {isSelectable && selectedEmployees.has(emp.id) && <Check className="h-3 w-3 text-white" />}
                                                    {isExisting && !regenerateMode && <div className="h-1.5 w-1.5 rounded-sm bg-rose-400" />}
                                                </div>
                                                <span className={`text-sm truncate flex-1 ${
                                                    isExisting && !regenerateMode ? 'text-rose-600 line-through' :
                                                    isExisting ? 'text-amber-700' : 'text-slate-600'
                                                }`}>
                                                    {emp.employeeCode ? `${emp.employeeCode} - ` : ''}{emp.fullName}
                                                </span>
                                                {isExisting && !regenerateMode && (
                                                    <span className="text-[10px] text-rose-500 bg-rose-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap border border-rose-100 italic">
                                                        Đã có
                                                    </span>
                                                )}
                                                {isExisting && regenerateMode && (
                                                    <span className="text-[10px] text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded ml-2 whitespace-nowrap border border-amber-200 italic">
                                                        Ghi đè
                                                    </span>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))
                )}
            </div>

            <div className="flex items-center justify-between mt-6">
                <div className="text-sm font-medium text-slate-500">
                    Đã chọn <span className="text-indigo-600 font-bold">{selectedEmployees.size}</span> nhân viên
                </div>
                <div className="flex space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleSubmit} 
                        loading={loading}
                        disabled={selectedEmployees.size === 0}
                    >
                        Tạo bảng chấm công
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
