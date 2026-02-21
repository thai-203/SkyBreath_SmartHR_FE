"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";

export default function TimesheetEditModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    loading,
}) {
    if (!formData) return null;

    const handleChange = (field, value) => {
        onFormChange({ ...formData, [field]: value });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chỉnh sửa bảng chấm công" size="default">
            <div className="space-y-4">
                {/* Employee Info (read-only) */}
                <div className="p-3 bg-slate-50 rounded-lg">
                    <p className="text-sm text-slate-600">
                        <span className="font-medium">Nhân viên:</span>{" "}
                        {formData.employee?.fullName} ({formData.employee?.employeeCode})
                    </p>
                    <p className="text-sm text-slate-600">
                        <span className="font-medium">Kỳ:</span>{" "}
                        Tháng {formData.month}/{formData.year}
                    </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <Input
                        label="Ngày công"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.totalWorkingDays ?? ""}
                        onChange={(e) => handleChange("totalWorkingDays", parseFloat(e.target.value) || 0)}
                    />
                    <Input
                        label="Giờ công"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.totalWorkingHours ?? ""}
                        onChange={(e) => handleChange("totalWorkingHours", parseFloat(e.target.value) || 0)}
                    />
                    <Input
                        label="Giờ OT"
                        type="number"
                        step="0.5"
                        min="0"
                        value={formData.overtimeHours ?? ""}
                        onChange={(e) => handleChange("overtimeHours", parseFloat(e.target.value) || 0)}
                    />
                </div>
            </div>

            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
                <Button variant="outline" onClick={onClose}>
                    Hủy
                </Button>
                <Button onClick={onSubmit} loading={loading} className="min-w-[100px]">
                    Lưu thay đổi
                </Button>
            </div>
        </Modal>
    );
}
