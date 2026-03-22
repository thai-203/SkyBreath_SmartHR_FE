"use client";

import { useState, useMemo } from "react";
import { Search, UserPlus, X } from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

export default function AddEmployeeTimesheetModal({
    isOpen,
    onClose,
    onSubmit,
    employees = [],
    loading,
    month,
    year,
}) {
    const [searchTerm, setSearchTerm] = useState("");
    const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);

    const filteredEmployees = useMemo(() => {
        return employees.filter(
            (emp) =>
                emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()),
        );
    }, [employees, searchTerm]);

    const handleSubmit = () => {
        if (!selectedEmployeeId) return;
        onSubmit({ employeeId: parseInt(selectedEmployeeId), month, year });
    };

    const selectedEmployee = employees.find((e) => e.id === selectedEmployeeId);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={`Thêm nhân sự chấm công T${month}/${year}`}>
            <div className="space-y-4">
                <div className="relative">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Tìm kiếm theo Tên hoặc Mã NV..."
                        className="w-full rounded-lg border border-slate-200 pl-9 pr-4 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>

                <div className="max-h-60 overflow-y-auto border border-slate-200 rounded-lg custom-scrollbar bg-slate-50 p-2">
                    {filteredEmployees.length > 0 ? (
                        <div className="grid grid-cols-1 gap-2">
                            {filteredEmployees.map((emp) => (
                                <div
                                    key={emp.id}
                                    onClick={() => setSelectedEmployeeId(emp.id)}
                                    className={`flex items-center justify-between p-3 rounded-md cursor-pointer transition-all border ${selectedEmployeeId === emp.id
                                            ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                            : "border-transparent hover:bg-white hover:border-slate-200"
                                        }`}
                                >
                                    <div>
                                        <div className="font-medium text-slate-800 text-sm">{emp.fullName}</div>
                                        <div className="text-xs text-slate-500 mt-0.5">{emp.employeeCode} - {emp.department?.departmentName || "N/A"}</div>
                                    </div>
                                    <div className={`h-4 w-4 rounded-full border flex items-center justify-center ${selectedEmployeeId === emp.id ? "border-indigo-600 bg-indigo-600" : "border-slate-300"
                                        }`}>
                                        {selectedEmployeeId === emp.id && <div className="h-1.5 w-1.5 rounded-full bg-white" />}
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center text-sm text-slate-500 py-6">
                            Không tìm thấy nhân viên nào
                        </div>
                    )}
                </div>

                {selectedEmployee && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 flex items-center justify-between">
                        <div className="text-sm">
                            <span className="text-slate-500">Đã chọn:</span>{" "}
                            <span className="font-semibold text-indigo-700">{selectedEmployee.fullName}</span>
                        </div>
                        <button
                            onClick={() => setSelectedEmployeeId(null)}
                            className="text-indigo-400 hover:text-indigo-600"
                        >
                            <X className="h-4 w-4" />
                        </button>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        loading={loading}
                        disabled={!selectedEmployeeId}
                        className="bg-indigo-600 hover:bg-indigo-700"
                    >
                        <UserPlus className="h-4 w-4 mr-2" /> Thêm nhân viên
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
