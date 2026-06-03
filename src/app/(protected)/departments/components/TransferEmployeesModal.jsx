"use client";

import { useEffect, useState, useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Checkbox } from "@/components/common/Checkbox";
import { useToast } from "@/components/common/Toast";
import { Badge } from "@/components/common/Badge";
import { DateInput } from "@/components/common/DateInput";
import { Skeleton } from "@/components/common/Skeleton";
import { employeesService, departmentTransfersService } from "@/services";
import { Search, AlertTriangle, Check, ChevronRight } from "lucide-react";

const REASON_OPTIONS = [
    { value: "Tái cấu trúc tổ chức", label: "Tái cấu trúc tổ chức" },
    { value: "Thăng chức / Thay đổi vị trí", label: "Thăng chức / Thay đổi vị trí" },
    { value: "Yêu cầu cá nhân", label: "Yêu cầu cá nhân" },
    { value: "Phù hợp năng lực", label: "Phù hợp năng lực" },
    { value: "Dự án / Nhiệm vụ mới", label: "Dự án / Nhiệm vụ mới" },
    { value: "Khác", label: "Khác" },
];

export default function TransferEmployeesModal({
    isOpen,
    onClose,
    onSuccess,
    departmentList,
    selectedDepartment,
}) {
    const { success, error } = useToast();

    // Steps: 1 = Select Departments, 2 = Select Employees, 3 = Confirm
    const [step, setStep] = useState(1);
    const [loading, setLoading] = useState(false);
    const [employeesLoading, setEmployeesLoading] = useState(false);

    // Form data
    const [fromDeptId, setFromDeptId] = useState("");
    const [toDeptId, setToDeptId] = useState("");
    const [employees, setEmployees] = useState([]);
    const [selectedEmployeeIds, setSelectedEmployeeIds] = useState([]);
    const [searchQuery, setSearchQuery] = useState("");
    
    // Step 3 data
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");
    const [effectiveDate, setEffectiveDate] = useState(new Date());
    const [note, setNote] = useState("");

    // Reset when opened
    useEffect(() => {
        if (isOpen) {
            setStep(1);
            setFromDeptId(selectedDepartment?.id ? String(selectedDepartment.id) : "");
            setToDeptId("");
            setEmployees([]);
            setSelectedEmployeeIds([]);
            setSearchQuery("");
            setReason("");
            setCustomReason("");
            setEffectiveDate(new Date());
            setNote("");
        }
    }, [isOpen, selectedDepartment]);

    // Fetch employees when step 2 is entered
    useEffect(() => {
        const fetchEmployees = async () => {
            if (step === 2 && fromDeptId) {
                setEmployeesLoading(true);
                try {
                    const response = await employeesService.getAllForPublic({ departmentId: fromDeptId });
                    const arr = response?.data?.data || response?.data?.items || response?.items || response?.data || [];
                    setEmployees(Array.isArray(arr) ? arr : []);
                } catch (err) {
                    error("Lỗi khi tải danh sách nhân viên");
                } finally {
                    setEmployeesLoading(false);
                }
            }
        };
        fetchEmployees();
    }, [step, fromDeptId]);

    // Derived data
    const filteredEmployees = useMemo(() => {
        if (!searchQuery) return employees;
        return employees.filter(e => 
            e.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
            e.employeeCode?.toLowerCase().includes(searchQuery.toLowerCase())
        );
    }, [employees, searchQuery]);

    const eligibleEmployees = useMemo(() => {
        return filteredEmployees.filter(e => e.employmentStatus === "ACTIVE" || e.employmentStatus === "PROBATION");
    }, [filteredEmployees]);

    const selectedEmployeesInfo = useMemo(() => {
        return employees.filter(e => selectedEmployeeIds.includes(e.id));
    }, [employees, selectedEmployeeIds]);

    const hasManagerSelected = useMemo(() => {
        const fromDept = departmentList.find(d => String(d.value) === String(fromDeptId));
        // We'd need managerEmployeeId from the department object, but we only have value/label in departmentList.
        // Assuming we pass the full selectedDepartment object initially.
        if (selectedDepartment && String(selectedDepartment.id) === String(fromDeptId)) {
            return selectedEmployeeIds.includes(selectedDepartment.managerEmployeeId);
        }
        return false;
    }, [departmentList, fromDeptId, selectedEmployeeIds, selectedDepartment]);

    // Handlers
    const handleNext = () => {
        if (step === 1) {
            if (!fromDeptId || !toDeptId) {
                error("Vui lòng chọn đầy đủ phòng ban nguồn và đích");
                return;
            }
            if (fromDeptId === toDeptId) {
                error("Phòng ban đích phải khác phòng ban nguồn");
                return;
            }
            setStep(2);
        } else if (step === 2) {
            if (selectedEmployeeIds.length === 0) {
                error("Vui lòng chọn ít nhất 1 nhân viên");
                return;
            }
            setStep(3);
        }
    };

    const handleBack = () => {
        if (step > 1) setStep(step - 1);
    };

    const handleSelectAll = (checked) => {
        if (checked) {
            setSelectedEmployeeIds(eligibleEmployees.map(e => e.id));
        } else {
            setSelectedEmployeeIds([]);
        }
    };

    const handleSelectEmployee = (id, checked) => {
        if (checked) {
            setSelectedEmployeeIds(prev => [...prev, id]);
        } else {
            setSelectedEmployeeIds(prev => prev.filter(eId => eId !== id));
        }
    };

    const handleSubmit = async () => {
        const finalReason = reason === "Khác" ? customReason : reason;
        
        if (!finalReason) {
            error("Vui lòng nhập lý do chuyển");
            return;
        }
        if (!effectiveDate) {
            error("Vui lòng chọn ngày hiệu lực");
            return;
        }

        setLoading(true);
        try {
            await departmentTransfersService.create({
                fromDepartmentId: Number(fromDeptId),
                toDepartmentId: Number(toDeptId),
                employeeIds: selectedEmployeeIds,
                reason: finalReason,
                effectiveDate: effectiveDate instanceof Date ? 
                    effectiveDate.toLocaleDateString('en-CA') : // Returns YYYY-MM-DD
                    effectiveDate,
                note
            });
            success("Chuyển nhân viên thành công!");
            onSuccess();
            onClose();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra khi chuyển nhân viên");
        } finally {
            setLoading(false);
        }
    };

    const renderStatusBadge = (status) => {
        const statusMap = {
            PROBATION: { label: "Thử việc", color: "warning" },
            ACTIVE: { label: "Đang làm việc", color: "success" },
            ON_LEAVE: { label: "Nghỉ phép", color: "secondary" },
            TERMINATED: { label: "Đã nghỉ việc", color: "danger" },
        };
        const config = statusMap[status] || { label: status, color: "secondary" };
        return <Badge variant={config.color}>{config.label}</Badge>;
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            size="xl"
            title="Chuyển nhân viên giữa các phòng ban"
            description="Thực hiện chuyển hàng loạt nhân viên sang phòng ban mới."
        >
            {/* Step Indicator */}
            <div className="mb-8 mt-4">
                <div className="flex items-center justify-between relative">
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-0.5 bg-slate-200 -z-10"></div>
                    <div 
                        className="absolute left-0 top-1/2 -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-300"
                        style={{ width: step === 1 ? '0%' : step === 2 ? '50%' : '100%' }}
                    ></div>

                    {[1, 2, 3].map((num) => (
                        <div key={num} className="flex flex-col items-center bg-white px-2">
                            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-semibold text-sm transition-colors duration-300 ${
                                step >= num ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-500'
                            }`}>
                                {step > num ? <Check className="w-4 h-4" /> : num}
                            </div>
                            <span className={`text-xs mt-2 font-medium ${
                                step >= num ? 'text-indigo-600' : 'text-slate-500'
                            }`}>
                                {num === 1 ? 'Phòng ban' : num === 2 ? 'Nhân viên' : 'Xác nhận'}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Step 1: Departments */}
            {step === 1 && (
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phòng ban nguồn <span className="text-red-500">*</span></label>
                            <Select
                                value={fromDeptId}
                                onChange={(e) => setFromDeptId(e.target.value)}
                                className="w-full"
                                options={departmentList}
                                placeholder="-- Chọn phòng ban --"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Phòng ban đích <span className="text-red-500">*</span></label>
                            <Select
                                value={toDeptId}
                                onChange={(e) => setToDeptId(e.target.value)}
                                className="w-full"
                                options={departmentList}
                                placeholder="-- Chọn phòng ban --"
                            />
                        </div>
                    </div>
                </div>
            )}

            {/* Step 2: Employees */}
            {step === 2 && (
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                        <div className="font-medium text-slate-700">
                            Đã chọn: <span className="text-indigo-600 font-bold">{selectedEmployeeIds.length}</span> / {eligibleEmployees.length} nhân viên hợp lệ
                        </div>
                        <div className="relative w-full sm:w-64">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Tìm nhân viên..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9"
                            />
                        </div>
                    </div>

                    <div className="border border-slate-200 rounded-lg overflow-hidden max-h-[400px] overflow-y-auto">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-slate-50 text-slate-600 font-medium sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 w-12 text-center">
                                        <Checkbox
                                            checked={selectedEmployeeIds.length === eligibleEmployees.length && eligibleEmployees.length > 0}
                                            onCheckedChange={(checked) => handleSelectAll(checked)}
                                            disabled={eligibleEmployees.length === 0}
                                        />
                                    </th>
                                    <th className="px-4 py-3">Mã NV</th>
                                    <th className="px-4 py-3">Họ tên</th>
                                    <th className="px-4 py-3">Chức vụ</th>
                                    <th className="px-4 py-3">Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-200">
                                {employeesLoading ? (
                                    Array.from({ length: 3 }).map((_, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 py-3"><Skeleton className="w-4 h-4" /></td>
                                            <td className="px-4 py-3"><Skeleton className="w-16 h-4" /></td>
                                            <td className="px-4 py-3"><Skeleton className="w-32 h-4" /></td>
                                            <td className="px-4 py-3"><Skeleton className="w-24 h-4" /></td>
                                            <td className="px-4 py-3"><Skeleton className="w-20 h-6" /></td>
                                        </tr>
                                    ))
                                ) : filteredEmployees.length === 0 ? (
                                    <tr>
                                        <td colSpan="5" className="px-4 py-8 text-center text-slate-500">
                                            Không có dữ liệu nhân viên
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEmployees.map((emp) => {
                                        const isEligible = emp.employmentStatus === "ACTIVE" || emp.employmentStatus === "PROBATION";
                                        const isChecked = selectedEmployeeIds.includes(emp.id);
                                        
                                        return (
                                            <tr key={emp.id} className={`${!isEligible ? 'bg-slate-50 opacity-70' : 'hover:bg-slate-50'} transition-colors`}>
                                                <td className="px-4 py-3 text-center">
                                                    <Checkbox
                                                        checked={isChecked}
                                                        onCheckedChange={(checked) => handleSelectEmployee(emp.id, checked)}
                                                        disabled={!isEligible}
                                                    />
                                                </td>
                                                <td className="px-4 py-3">{emp.employeeCode || '-'}</td>
                                                <td className="px-4 py-3 font-medium text-slate-900">{emp.fullName}</td>
                                                <td className="px-4 py-3">{emp.position?.positionName || '-'}</td>
                                                <td className="px-4 py-3">{renderStatusBadge(emp.employmentStatus)}</td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Step 3: Confirm & Info */}
            {step === 3 && (
                <div className="space-y-6">
                    <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4">
                        <div className="flex items-center justify-between text-indigo-900 mb-2">
                            <span className="font-medium text-sm">Phòng ban nguồn:</span>
                            <span className="font-bold">{departmentList.find(d => String(d.value) === String(fromDeptId))?.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-indigo-900 mb-2">
                            <span className="font-medium text-sm">Phòng ban đích:</span>
                            <span className="font-bold">{departmentList.find(d => String(d.value) === String(toDeptId))?.label}</span>
                        </div>
                        <div className="flex items-center justify-between text-indigo-900">
                            <span className="font-medium text-sm">Số lượng chuyển:</span>
                            <span className="font-bold">{selectedEmployeeIds.length} nhân viên</span>
                        </div>
                    </div>

                    {hasManagerSelected && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-800 p-3 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-semibold mb-1">Lưu ý: Có Trưởng phòng trong danh sách chuyển</p>
                                <p>Phòng ban nguồn sẽ bị trống quản lý sau khi chuyển. Bạn cần vào chỉnh sửa phòng ban nguồn để gán quản lý mới.</p>
                            </div>
                        </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Lý do chuyển <span className="text-red-500">*</span></label>
                            <Select
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                className="w-full"
                                options={REASON_OPTIONS}
                                placeholder="-- Chọn lý do --"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-slate-700">Ngày hiệu lực <span className="text-red-500">*</span></label>
                            <DateInput
                                value={effectiveDate}
                                onChange={(val) => setEffectiveDate(val)}
                                format="YYYY-MM-DD"
                            />
                        </div>
                    </div>

                    {reason === "Khác" && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
                            <label className="text-sm font-medium text-slate-700">Lý do cụ thể <span className="text-red-500">*</span></label>
                            <Input
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                                placeholder="Nhập lý do chuyển..."
                                className="w-full"
                            />
                        </div>
                    )}

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-slate-700">Ghi chú (tùy chọn)</label>
                        <textarea
                            value={note}
                            onChange={(e) => setNote(e.target.value)}
                            className="w-full h-24 rounded-lg border border-slate-200 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            placeholder="Nhập ghi chú thêm..."
                        ></textarea>
                    </div>
                </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-between items-center mt-8 pt-4 border-t border-slate-200">
                <Button variant="outline" onClick={step === 1 ? onClose : handleBack} disabled={loading}>
                    {step === 1 ? "Hủy" : "Quay lại"}
                </Button>
                
                {step < 3 ? (
                    <Button onClick={handleNext} disabled={loading || (step === 1 && (!fromDeptId || !toDeptId || fromDeptId === toDeptId)) || (step === 2 && selectedEmployeeIds.length === 0)}>
                        Tiếp theo
                        <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                ) : (
                    <Button onClick={handleSubmit} loading={loading} disabled={!reason || (reason === "Khác" && !customReason) || !effectiveDate}>
                        Xác nhận chuyển
                    </Button>
                )}
            </div>
        </Modal>
    );
}
