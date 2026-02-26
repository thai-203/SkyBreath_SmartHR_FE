"use client";

import { Modal } from "@/components/common/Modal";
import { User, Building2, Briefcase, Calendar, Mail, Phone, MapPin, FileText, Image } from "lucide-react";

const BACKEND_URL = "http://localhost:3000";

const InfoItem = ({ icon: Icon, label, value }) => (
    <div className="flex items-start gap-3 py-2">
        <Icon className="h-4 w-4 text-slate-400 mt-0.5" />
        <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="text-sm font-medium text-slate-900 truncate">{value || "-"}</p>
        </div>
    </div>
);

const Section = ({ title, children }) => (
    <div className="border-b border-slate-100 pb-4 last:border-0 last:pb-0">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">{title}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            {children}
        </div>
    </div>
);

const ImagePreview = ({ src, label }) => {
    if (!src) return null;
    const fullSrc = src.startsWith('http') ? src : `${BACKEND_URL}/${src}`;
    return (
        <div className="space-y-1">
            <p className="text-xs text-slate-500 flex items-center gap-1">
                <Image className="h-3 w-3" /> {label}
            </p>
            <div className="h-32 rounded-lg border border-slate-200 overflow-hidden bg-slate-50">
                <img src={fullSrc} alt={label} className="h-full w-full object-contain" />
            </div>
        </div>
    );
};

const statusColors = {
    ACTIVE: "bg-emerald-50 text-emerald-700 border-emerald-200",
    PROBATION: "bg-amber-50 text-amber-700 border-amber-200",
    ON_LEAVE: "bg-blue-50 text-blue-700 border-blue-200",
    TERMINATED: "bg-rose-50 text-rose-700 border-rose-200",
};

const statusLabels = {
    ACTIVE: "Đang làm việc",
    PROBATION: "Thử việc",
    ON_LEAVE: "Nghỉ phép",
    TERMINATED: "Đã nghỉ",
};

const genderLabels = { MALE: "Nam", FEMALE: "Nữ", OTHER: "Khác" };
const maritalLabels = { SINGLE: "Độc thân", MARRIED: "Đã kết hôn", DIVORCED: "Đã ly hôn", WIDOWED: "Góa" };

const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    return new Date(dateStr).toLocaleDateString("vi-VN");
};

export default function EmployeeDetailModal({ isOpen, onClose, employee }) {
    if (!employee) return null;

    const status = employee.employmentStatus;

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết nhân viên" size="xl">
            <div className="max-h-[80vh] overflow-y-auto px-2 space-y-6">
                {/* Header Section in modal body for better layout */}
                <div className="flex items-center gap-4 pb-4 border-b border-slate-200">
                    <div className="h-16 w-16 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden border border-slate-200">
                        {employee.avatar ? (
                            <img
                                src={employee.avatar.startsWith('http') ? employee.avatar : `${BACKEND_URL}/${employee.avatar}`}
                                alt={employee.fullName}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <User className="h-8 w-8 text-slate-400" />
                        )}
                    </div>
                    <div className="flex-1">
                        <div className="flex items-center gap-2">
                            <h2 className="text-xl font-bold text-slate-900">{employee.fullName}</h2>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full border ${statusColors[status] || "bg-slate-100"}`}>
                                {statusLabels[status] || status}
                            </span>
                        </div>
                        <p className="text-sm text-indigo-600 font-mono">{employee.employeeCode || "-"}</p>
                        <p className="text-sm text-slate-500">{employee.position?.positionName || "-"} • {employee.department?.departmentName || "-"}</p>
                    </div>
                </div>

                {/* Personal Info */}
                <Section title="Thông tin cá nhân">
                    <InfoItem icon={Calendar} label="Ngày sinh" value={formatDate(employee.dateOfBirth)} />
                    <InfoItem icon={User} label="Giới tính" value={genderLabels[employee.gender]} />
                    <InfoItem icon={User} label="Tình trạng hôn nhân" value={maritalLabels[employee.maritalStatus]} />
                    <InfoItem icon={FileText} label="Quốc tịch" value={employee.nationality} />
                    <InfoItem icon={FileText} label="Số CCCD/CMND" value={employee.nationalId} />
                    <InfoItem icon={Calendar} label="Ngày cấp" value={formatDate(employee.nationalIdIssuedDate)} />
                    <InfoItem icon={MapPin} label="Nơi cấp" value={employee.nationalIdIssuedPlace} />
                    <InfoItem icon={FileText} label="Mã số thuế" value={employee.taxCode} />
                </Section>

                {/* Contact */}
                <Section title="Thông tin liên hệ">
                    <InfoItem icon={Mail} label="Email công ty" value={employee.companyEmail} />
                    <InfoItem icon={Mail} label="Email cá nhân" value={employee.personalEmail} />
                    <InfoItem icon={Phone} label="Số điện thoại" value={employee.phoneNumber} />
                    <InfoItem icon={MapPin} label="Địa chỉ thường trú" value={employee.permanentAddress} />
                    <InfoItem icon={MapPin} label="Địa chỉ tạm trú" value={employee.currentAddress} />
                </Section>

                {/* Employment */}
                <Section title="Thông tin công việc">
                    <InfoItem icon={Building2} label="Phòng ban" value={employee.department?.departmentName} />
                    <InfoItem icon={Briefcase} label="Chức vụ" value={employee.position?.positionName} />
                    <InfoItem icon={Briefcase} label="Cấp bậc" value={employee.jobGrade?.gradeName} />
                    <InfoItem icon={User} label="Quản lý trực tiếp" value={employee.directManager?.fullName} />
                    <InfoItem icon={User} label="HR Mentor" value={employee.hrMentor?.fullName} />
                    <InfoItem icon={Calendar} label="Ngày vào làm" value={formatDate(employee.joinDate)} />
                    <InfoItem icon={Calendar} label="Ngày chính thức" value={formatDate(employee.officialStartDate)} />
                </Section>

                {/* ID Card Images */}
                {(employee.frontIdCardFilePath || employee.backIdCardFilePath) && (
                    <Section title="Ảnh giấy tờ">
                        <ImagePreview src={employee.frontIdCardFilePath} label="CCCD mặt trước" />
                        <ImagePreview src={employee.backIdCardFilePath} label="CCCD mặt sau" />
                    </Section>
                )}
            </div>
        </Modal>
    );
}
