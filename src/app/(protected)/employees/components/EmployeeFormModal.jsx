"use client";

import { useEffect } from "react";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import { Modal } from "@/components/common/Modal";
import { Image } from "lucide-react";

const BACKEND_URL = "http://localhost:3000";

const FilePreview = ({ file, existingPath, label }) => {
    if (!file && !existingPath) return null;

    const previewUrl = file
        ? URL.createObjectURL(file)
        : (existingPath?.startsWith('http') ? existingPath : `${BACKEND_URL}/${existingPath}`);

    return (
        <div className="mt-2 relative group">
            <div className="text-xs text-slate-500 mb-1 flex items-center gap-1">
                <Image className="h-3 w-3" /> Xem trước {label}
            </div>
            <div className="h-40 w-full rounded-lg border border-slate-200 overflow-hidden bg-slate-50 flex items-center justify-center">
                <img
                    src={previewUrl}
                    alt={label}
                    className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
                    onLoad={() => {
                        if (file) URL.revokeObjectURL(previewUrl);
                    }}
                />
            </div>
        </div>
    );
};

export default function EmployeeFormModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    metadata = {},
    loading,
    errors = {},
    mode = "create",
}) {
    const isEdit = mode === "edit";
    const title = isEdit ? "Cập nhật hồ sơ nhân viên" : "Thêm nhân viên mới";
    const submitText = isEdit ? "Lưu thay đổi" : "Tạo mới";

    const sections = [
        {
            title: "Thông tin cá nhân",
            fields: [
                { id: "employeeCode", label: "Mã nhân viên *", type: "text", placeholder: "Ví dụ: NV-001", disabled: isEdit },
                { id: "fullName", label: "Họ và tên *", type: "text", placeholder: "Nhập họ và tên" },
                { id: "dateOfBirth", label: "Ngày sinh *", type: "date" },
                { id: "gender", label: "Giới tính *", type: "select", options: metadata.genderOptions },
                { id: "nationality", label: "Quốc tịch *", type: "text", placeholder: "Ví dụ: Việt Nam" },
                { id: "maritalStatus", label: "Tình trạng hôn nhân *", type: "select", options: metadata.maritalStatusOptions },
            ]
        },
        {
            title: "Giấy tờ định danh & Thuế",
            fields: [
                { id: "nationalId", label: "Số CCCD/CMND *", type: "text", placeholder: "Số định danh" },
                { id: "nationalIdIssuedDate", label: "Ngày cấp *", type: "date" },
                { id: "nationalIdIssuedPlace", label: "Nơi cấp *", type: "text", placeholder: "Nơi cấp" },
                { id: "taxCode", label: "Mã số thuế *", type: "text", placeholder: "Mã số thuế cá nhân" },
                { id: "frontIdCard", label: "Ảnh CCCD mặt trước *", type: "file", placeholder: "Chọn ảnh mặt trước" },
                { id: "backIdCard", label: "Ảnh CCCD mặt sau *", type: "file", placeholder: "Chọn ảnh mặt sau" },
            ]
        },
        {
            title: "Liên hệ & Địa chỉ",
            fields: [
                { id: "phoneNumber", label: "Số điện thoại *", type: "text", placeholder: "Số điện thoại liên hệ" },
                { id: "personalEmail", label: "Email cá nhân *", type: "email", placeholder: "example@gmail.com", disabled: isEdit },
                { id: "companyEmail", label: "Email công ty *", type: "email", placeholder: "name@company.com", disabled: isEdit },
                { id: "permanentAddress", label: "Địa chỉ thường trú *", type: "text", placeholder: "Địa chỉ trên hộ khẩu" },
                { id: "currentAddress", label: "Địa chỉ tạm trú *", type: "text", placeholder: "Địa chỉ hiện tại" },
            ]
        },
        {
            title: "Thông tin công việc",
            fields: [
                {
                    id: "departmentId",
                    label: "Phòng ban *",
                    type: "select",
                    options: metadata.departments?.map(d => ({ value: d.id, label: d.departmentName }))
                },
                {
                    id: "positionId",
                    label: "Chức vụ *",
                    type: "select",
                    options: metadata.positions?.map(p => ({ value: p.id, label: p.positionName }))
                },
                {
                    id: "jobGradeId",
                    label: "Cấp bậc *",
                    type: "select",
                    options: metadata.jobGrades?.map(j => ({ value: j.id, label: j.gradeName }))
                },
                { id: "employmentStatus", label: "Trạng thái nhân sự *", type: "select", options: metadata.employmentStatusOptions },
                { id: "educationLevel", label: "Trình độ học vấn *", type: "text", placeholder: "Ví dụ: Đại học" },
                { id: "joinDate", label: "Ngày gia nhập *", type: "date" },
                { id: "officialStartDate", label: "Ngày chính thức *", type: "date" },
                {
                    id: "directManagerId",
                    label: "Quản lý trực tiếp *",
                    type: "select",
                    options: metadata.managers?.map(m => ({ value: m.id, label: m.fullName }))
                },
                {
                    id: "hrMentorId",
                    label: "HR Mentor *",
                    type: "select",
                    options: metadata.hrMentors?.map(m => ({ value: m.id, label: m.fullName }))
                },
            ]
        }
    ];

    const handleChange = (id, value) => {
        onFormChange({ ...formData, [id]: value });
    };

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title} size="xl">
            <div className="max-h-[70vh] overflow-y-auto px-1 pr-3 custom-scrollbar">
                <div className="space-y-8 pb-4">
                    {sections.map((section, idx) => (
                        <div key={idx} className="space-y-4">
                            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider border-b border-indigo-100 pb-1">
                                {section.title}
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {section.fields.map((field) => (
                                    <div key={field.id} className="space-y-1.5">
                                        <Label htmlFor={field.id}>{field.label}</Label>
                                        {field.type === "select" ? (
                                            <Select
                                                id={field.id}
                                                value={formData[field.id] || ""}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                options={field.options || []}
                                                placeholder={`-- Chọn ${field.label.replace(' *', '')} --`}
                                                error={errors[field.id]}
                                            />
                                        ) : field.type === "file" ? (
                                            <div className="space-y-2">
                                                <Input
                                                    id={field.id}
                                                    type="file"
                                                    accept="image/*"
                                                    onChange={(e) => handleChange(field.id, e.target.files[0])}
                                                    error={errors[field.id]}
                                                />
                                                <FilePreview
                                                    file={formData[field.id] instanceof File ? formData[field.id] : null}
                                                    existingPath={typeof formData[field.id] === 'string' ? formData[field.id] : (isEdit ? formData[`${field.id}FilePath`] : null)}
                                                    label={field.label}
                                                />
                                            </div>
                                        ) : (
                                            <Input
                                                id={field.id}
                                                type={field.type}
                                                value={formData[field.id] || ""}
                                                onChange={(e) => handleChange(field.id, e.target.value)}
                                                placeholder={field.placeholder}
                                                error={errors[field.id]}
                                                disabled={field.disabled}
                                            />
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
            <div className="flex justify-end gap-3 pt-6 mt-4 border-t border-slate-100">
                <Button variant="outline" onClick={onClose}>
                    Hủy
                </Button>
                <Button onClick={onSubmit} loading={loading} className="min-w-[100px]">
                    {submitText}
                </Button>
            </div>
        </Modal>
    );
}
