"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import { Modal } from "@/components/common/Modal";

export default function DepartmentFormModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    departmentList,
    employeeList,
    loading,
    errors = {},
    mode = "create", // "create" | "edit"
    selectedDepartment,
}) {
    const isEdit = mode === "edit";
    const title = isEdit ? "Chỉnh sửa phòng ban" : "Thêm phòng ban mới";
    const submitText = isEdit ? "Lưu thay đổi" : "Tạo mới";

    // Filter out current department from parent options when editing
    const parentOptions = isEdit
        ? departmentList.filter((d) => d.value !== selectedDepartment?.id)
        : departmentList;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                <div className="space-y-2">
                    <Label>Tên phòng ban *</Label>
                    <Input
                        value={formData.departmentName}
                        onChange={(e) =>
                            onFormChange({ ...formData, departmentName: e.target.value })
                        }
                        placeholder="Nhập tên phòng ban"
                        error={errors.departmentName}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Phòng ban cha</Label>
                    <Select
                        value={formData.parentDepartmentId}
                        onChange={(e) =>
                            onFormChange({ ...formData, parentDepartmentId: e.target.value })
                        }
                        options={parentOptions}
                        placeholder="Chọn phòng ban cha"
                        error={errors.parentDepartmentId}
                    />
                </div>
                <div className="space-y-2">
                    <Label>Quản lý</Label>
                    <Select
                        value={formData.managerEmployeeId}
                        onChange={(e) =>
                            onFormChange({ ...formData, managerEmployeeId: e.target.value })
                        }
                        options={employeeList}
                        placeholder="Chọn quản lý"
                        error={errors.managerEmployeeId}
                    />
                </div>
                <div className="flex justify-end gap-3 pt-4">
                    <Button variant="outline" onClick={onClose}>
                        Hủy
                    </Button>
                    <Button onClick={onSubmit} loading={loading}>
                        {submitText}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
