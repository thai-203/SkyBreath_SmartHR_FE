"use client";

import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";

export function HolidayGroupModal({ isOpen, onClose, onSubmit, group }) {
    const [formData, setFormData] = useState({ 
        groupName: "", 
        groupCode: "",
        year: new Date().getFullYear(),
        applicableScope: "GLOBAL",
        status: "ACTIVE",
        description: "" 
    });

    useEffect(() => {
        if (group) {
            setFormData({
                groupName: group.groupName || "",
                groupCode: group.groupCode || "",
                year: group.year || new Date().getFullYear(),
                applicableScope: group.applicableScope || "GLOBAL",
                status: group.status || "ACTIVE",
                description: group.description || ""
            });
        } else {
            setFormData({
                groupName: "",
                groupCode: "",
                year: new Date().getFullYear(),
                applicableScope: "GLOBAL",
                status: "ACTIVE",
                description: ""
            });
        }
    }, [group, isOpen]);

    const handleChange = (field, value) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSave = () => {
        onSubmit(formData);
    };

    return (
        <Modal 
            isOpen={isOpen} 
            onClose={onClose}
            title={group ? "Cập nhật Danh mục Ngày lễ" : "Thêm Danh mục Ngày lễ"}
        >
            <div className="space-y-4 pt-2">
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Mã danh mục</label>
                        <Input 
                            placeholder="VD: VN-2026-GLOBAL"
                            value={formData.groupCode}
                            onChange={(e) => handleChange('groupCode', e.target.value)}
                            disabled={!!group}
                        />
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Năm</label>
                        <Input 
                            type="number"
                            value={formData.year}
                            onChange={(e) => handleChange('year', parseInt(e.target.value))}
                        />
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Tên danh mục</label>
                    <Input 
                        placeholder="Ví dụ: Danh mục Ngày lễ 2026"
                        value={formData.groupName}
                        onChange={(e) => handleChange('groupName', e.target.value)}
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Phạm vi áp dụng</label>
                        <select 
                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={formData.applicableScope}
                            onChange={(e) => handleChange('applicableScope', e.target.value)}
                        >
                            <option value="GLOBAL">Toàn công ty</option>
                            <option value="REGION">Vùng miền</option>
                            <option value="DEPARTMENT">Phòng ban</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium">Trạng thái</label>
                        <select 
                            className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
                            value={formData.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                        >
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Ngừng hoạt động</option>
                        </select>
                    </div>
                </div>
                <div className="space-y-2">
                    <label className="text-sm font-medium">Mô tả</label>
                    <Input 
                        placeholder="Chi tiết về danh mục này"
                        value={formData.description}
                        onChange={(e) => handleChange('description', e.target.value)}
                    />
                </div>
                <div className="flex justify-end gap-2 mt-6">
                    <Button variant="outline" onClick={onClose}>Hủy</Button>
                    <Button onClick={handleSave}>Lưu</Button>
                </div>
            </div>
        </Modal>
    );
}
