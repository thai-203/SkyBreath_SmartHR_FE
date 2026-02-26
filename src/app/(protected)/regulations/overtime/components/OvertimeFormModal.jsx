"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Modal } from "@/components/common/Modal";
import { X } from "lucide-react";

const statusOptions = [
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Ngừng hoạt động" },
];

export default function OvertimeFormModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    errors = {},
    mode = "add",
    departments = [],
    submitting = false,
}) {
    const handleChange = (field, value) => {
        onFormChange({ ...formData, [field]: value });
    };

    const handleToggleDepartment = (deptId) => {
        const currentIds = formData.departmentIds || [];
        const newIds = currentIds.includes(deptId)
            ? currentIds.filter((id) => id !== deptId)
            : [...currentIds, deptId];
        handleChange("departmentIds", newIds);
    };

    const selectedDepartments = departments.filter((d) =>
        formData.departmentIds?.includes(d.id)
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                mode === "add"
                    ? "Thêm quy định OT"
                    : "Chỉnh sửa quy định OT"
            }
            description={
                mode === "add"
                    ? "Điền thông tin để tạo quy định làm thêm giờ mới"
                    : "Cập nhật thông tin quy định làm thêm giờ"
            }
            size="lg"
        >
            <div className="space-y-4">
                <Input
                    label="Tên quy định"
                    placeholder="VD: OT ngày thường"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={errors.name}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                    <Input
                        label="Hệ số lương"
                        type="number"
                        step="0.1"
                        min="0"
                        max="99.9"
                        placeholder="VD: 1.5"
                        value={formData.salaryMultiplier}
                        onChange={(e) =>
                            handleChange("salaryMultiplier", e.target.value)
                        }
                        error={errors.salaryMultiplier}
                    />
                    <Input
                        label="Giờ OT tối đa/ngày"
                        type="number"
                        min="1"
                        max="24"
                        placeholder="VD: 4"
                        value={formData.maxHoursPerDay}
                        onChange={(e) =>
                            handleChange("maxHoursPerDay", e.target.value)
                        }
                        error={errors.maxHoursPerDay}
                    />
                    <Input
                        label="Giờ OT tối đa/tháng"
                        type="number"
                        min="1"
                        max="744"
                        placeholder="VD: 40"
                        value={formData.maxHoursPerMonth}
                        onChange={(e) =>
                            handleChange("maxHoursPerMonth", e.target.value)
                        }
                        error={errors.maxHoursPerMonth}
                    />
                </div>

                {/* Multi-select phòng ban */}
                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">
                        Áp dụng cho phòng ban
                    </label>

                    {/* Selected department chips */}
                    {selectedDepartments.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mb-2">
                            {selectedDepartments.map((dept) => (
                                <span
                                    key={dept.id}
                                    className="inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-medium text-indigo-700"
                                >
                                    {dept.departmentName}
                                    <button
                                        type="button"
                                        onClick={() => handleToggleDepartment(dept.id)}
                                        className="ml-0.5 rounded-full p-0.5 hover:bg-indigo-100 transition-colors"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                </span>
                            ))}
                        </div>
                    )}

                    {/* Department checkboxes */}
                    <div className="max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-white p-2 space-y-1">
                        {departments.length > 0 ? (
                            departments.map((dept) => (
                                <label
                                    key={dept.id}
                                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm text-slate-700 cursor-pointer hover:bg-slate-50 transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={formData.departmentIds?.includes(dept.id) || false}
                                        onChange={() => handleToggleDepartment(dept.id)}
                                        className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                                    />
                                    {dept.departmentName}
                                </label>
                            ))
                        ) : (
                            <p className="px-2 py-1.5 text-sm text-slate-400">
                                Không có phòng ban nào
                            </p>
                        )}
                    </div>

                    {errors.departmentIds && (
                        <p className="text-xs font-medium text-red-500">{errors.departmentIds}</p>
                    )}
                </div>

                <Select
                    label="Trạng thái"
                    value={formData.status}
                    onChange={(e) =>
                        handleChange("status", e.target.value)
                    }
                    options={statusOptions}
                />

                <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>
                        Hủy
                    </Button>
                    <Button onClick={onSubmit} disabled={submitting}>
                        {submitting
                            ? "Đang xử lý..."
                            : mode === "add"
                            ? "Thêm"
                            : "Cập nhật"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
