"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Modal } from "@/components/common/Modal";

const penaltyTypeOptions = [
    { value: "WARNING", label: "Cảnh cáo" },
    { value: "SALARY_DEDUCTION", label: "Trừ lương" },
    { value: "SUSPENSION", label: "Đình chỉ" },
    { value: "TERMINATION", label: "Sa thải" },
];

const severityOptions = [
    { value: "LOW", label: "Thấp" },
    { value: "MEDIUM", label: "Trung bình" },
    { value: "HIGH", label: "Cao" },
    { value: "CRITICAL", label: "Nghiêm trọng" },
];

const statusOptions = [
    { value: "ACTIVE", label: "Hoạt động" },
    { value: "INACTIVE", label: "Ngừng hoạt động" },
];

export default function PenaltyFormModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    errors = {},
    mode = "add",
    submitting = false,
}) {
    const handleChange = (field, value) => {
        onFormChange({ ...formData, [field]: value });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={
                mode === "add"
                    ? "Thêm quy định hình phạt"
                    : "Chỉnh sửa quy định hình phạt"
            }
            description={
                mode === "add"
                    ? "Điền thông tin để tạo quy định hình phạt mới"
                    : "Cập nhật thông tin quy định hình phạt"
            }
            size="lg"
        >
            <div className="space-y-4">
                <Input
                    label="Tên hình phạt"
                    placeholder="VD: Đi trễ lần 1"
                    value={formData.name}
                    onChange={(e) => handleChange("name", e.target.value)}
                    error={errors.name}
                />

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Select
                        label="Loại hình phạt"
                        value={formData.penaltyType}
                        onChange={(e) =>
                            handleChange("penaltyType", e.target.value)
                        }
                        options={penaltyTypeOptions}
                        placeholder="Chọn loại hình phạt"
                        error={errors.penaltyType}
                    />
                    <Select
                        label="Mức độ"
                        value={formData.severityLevel}
                        onChange={(e) =>
                            handleChange("severityLevel", e.target.value)
                        }
                        options={severityOptions}
                        placeholder="Chọn mức độ"
                        error={errors.severityLevel}
                    />
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <Input
                        label="Số tiền trừ (VNĐ)"
                        type="number"
                        min="0"
                        placeholder="VD: 500000"
                        value={formData.deductionAmount}
                        onChange={(e) =>
                            handleChange("deductionAmount", e.target.value)
                        }
                        error={errors.deductionAmount}
                    />
                    <Input
                        label="Phần trăm trừ lương (%)"
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        placeholder="VD: 10"
                        value={formData.deductionPercentage}
                        onChange={(e) =>
                            handleChange("deductionPercentage", e.target.value)
                        }
                        error={errors.deductionPercentage}
                    />
                </div>

                <div className="space-y-1">
                    <label className="block text-sm font-medium text-slate-700">
                        Mô tả
                    </label>
                    <textarea
                        placeholder="Mô tả chi tiết quy định hình phạt..."
                        value={formData.description}
                        onChange={(e) => handleChange("description", e.target.value)}
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 resize-none"
                    />
                    {errors.description && (
                        <p className="text-xs font-medium text-red-500">{errors.description}</p>
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
