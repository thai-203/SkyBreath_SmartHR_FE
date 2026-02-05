"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { User, Layers, Users, Building, Info } from "lucide-react";

export default function DepartmentDetailModal({ isOpen, onClose, department }) {
    if (!department) return null;

    const DetailItem = ({ icon: Icon, label, value, subtext }) => (
        <div className="flex items-start gap-4 p-4 rounded-xl hover:bg-slate-50 transition-colors group">
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-500 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                <Icon className="h-5 w-5" />
            </div>
            <div>
                <p className="text-sm font-medium text-slate-500">{label}</p>
                <p className="text-base font-semibold text-slate-900">{value || "Chưa thiết lập"}</p>
                {subtext && <p className="text-xs text-slate-400 mt-0.5">{subtext}</p>}
            </div>
        </div>
    );

    return (
        <Modal isOpen={isOpen} onClose={onClose} title="Chi tiết phòng ban" size="lg">
            <div className="space-y-8 py-4">
                {/* Header Information */}
                <div className="bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl p-6 text-white shadow-lg overflow-hidden relative">
                    <div className="relative z-10">
                        <h2 className="text-2xl font-bold mb-1">{department.departmentName}</h2>
                        <div className="flex items-center gap-2 text-indigo-100/90 text-sm">
                            <Users className="h-4 w-4" />
                            <span>{department.employeeCount || 0} Nhân viên đang hoạt động</span>
                        </div>
                    </div>
                    {/* Decorative background icon */}
                    <div className="absolute top-1/2 right-4 -translate-y-1/2 opacity-10">
                        <Building className="h-32 w-32" />
                    </div>
                </div>

                {/* Information Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <DetailItem
                        icon={User}
                        label="Người quản lý"
                        value={department.manager?.fullName}
                        subtext={department.manager?.companyEmail}
                    />
                    <DetailItem
                        icon={Layers}
                        label="Phòng ban cha"
                        value={department.parentDepartment?.departmentName}
                    />
                    <DetailItem
                        icon={Users}
                        label="Số lượng nhân viên"
                        value={`${department.employeeCount || 0} nhân sự`}
                    />
                    <DetailItem
                        icon={Info}
                        label="Trạng thái"
                        value="Đang hoạt động"
                    />
                </div>

                {/* Child Departments Section */}
                {department.children && department.children.length > 0 && (
                    <div className="space-y-4">
                        <div className="flex items-center gap-2 px-1">
                            <Layers className="h-5 w-5 text-indigo-600" />
                            <h3 className="font-bold text-slate-800 tracking-tight">Cơ cấu trực thuộc</h3>
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {department.children.map((child) => (
                                <div key={child.id} className="flex items-center justify-between p-3.5 rounded-xl border border-slate-100 bg-white shadow-sm hover:border-indigo-100 hover:shadow-md transition-all group">
                                    <div className="flex items-center gap-3">
                                        <div className="h-2 w-2 rounded-full bg-indigo-400 group-hover:scale-125 transition-transform" />
                                        <span className="font-medium text-slate-700">{child.departmentName}</span>
                                    </div>
                                    {child.manager && (
                                        <span className="text-xs text-slate-400 bg-slate-50 px-2 py-1 rounded-md group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors">
                                            QL: {child.manager.fullName}
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>

            <div className="mt-8 flex justify-end pt-6 border-t border-slate-100">
                <Button variant="outline" onClick={onClose} className="px-8 font-medium">
                    Đóng
                </Button>
            </div>
        </Modal>
    );
}
