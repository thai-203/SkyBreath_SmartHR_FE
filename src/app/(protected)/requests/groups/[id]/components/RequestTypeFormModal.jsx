"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function RequestTypeFormModal({
    isOpen, onClose, onSubmit, formData, onFormChange, errors, mode, submitting
}) {
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFormChange({ ...formData, [name]: value });
    };

    const handlePolicyChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === 'checkbox' ? checked : value;
        onFormChange({
            ...formData,
            policy: { ...formData.policy, [name]: finalValue }
        });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-xl p-0 overflow-hidden bg-white border-none rounded-xl">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50 relative">
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {mode === "add" ? "Thêm Loại Đơn Mới" : "Cập nhật Loại Đơn"}
                    </DialogTitle>
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                <div className="px-6 py-6 space-y-6 flex-1 overflow-y-auto max-h-[70vh]">
                    {/* Phần 1: Thông tin cơ bản */}
                    <div className="space-y-4">
                        <h3 className="font-semibold text-emerald-800 border-b pb-2">Thông tin danh mục</h3>
                        
                        <div className="space-y-2">
                            <Label>Tên Loại Đơn <span className="text-red-500">*</span></Label>
                            <Input
                                name="name"
                                value={formData.name}
                                onChange={handleChange}
                                placeholder="Nhập tên loại đơn..."
                            />
                            {errors.name && <p className="text-sm font-medium text-red-500">{errors.name}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Trạng thái</Label>
                                <select
                                    name="status"
                                    value={formData.status}
                                    onChange={handleChange}
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                >
                                    <option value="ACTIVE">Hoạt động</option>
                                    <option value="INACTIVE">Tạm ngưng</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Mô tả Loại Đơn</Label>
                            <Textarea
                                name="description"
                                value={formData.description}
                                onChange={handleChange}
                                rows={2}
                                placeholder="Thêm mô tả cho loại đơn này..."
                            />
                        </div>
                    </div>

                    {/* Phần 2: Chính sách Policy */}
                    <div className="space-y-4 pt-4">
                        <h3 className="font-semibold text-emerald-800 border-b pb-2">Cấu hình Chính sách (Policy)</h3>
                        
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label>Chu kỳ theo dõi</Label>
                                <select
                                    name="trackingCycle"
                                    value={formData.policy.trackingCycle}
                                    onChange={handlePolicyChange}
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm"
                                >
                                    <option value="DAY">Theo Ngày</option>
                                    <option value="WEEK">Theo Tuần</option>
                                    <option value="MONTH">Theo Tháng</option>
                                    <option value="YEAR">Theo Năm</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <Label>Đơn vị tính</Label>
                                <select
                                    name="unit"
                                    value={formData.policy.unit}
                                    onChange={handlePolicyChange}
                                    className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm"
                                >
                                    <option value="DAY">Ngày</option>
                                    <option value="HOUR">Giờ</option>
                                    <option value="TIME">Số lần</option>
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Số lượng tối đa ({formData.policy.unit}) {!formData.policy.isUnlimited && <span className="text-red-500">*</span>}</Label>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <input
                                            type="checkbox"
                                            name="isUnlimited"
                                            checked={formData.policy.isUnlimited || false}
                                            onChange={handlePolicyChange}
                                            className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                                        />
                                        <span className="text-xs font-medium text-emerald-700">Không giới hạn</span>
                                    </label>
                                </div>
                                <Input
                                    type="number"
                                    name="maxQuantity"
                                    value={formData.policy.isUnlimited ? "" : formData.policy.maxQuantity}
                                    onChange={handlePolicyChange}
                                    placeholder={formData.policy.isUnlimited ? "Vô hạn" : "0"}
                                    disabled={formData.policy.isUnlimited}
                                />
                                {errors.maxQuantity && !formData.policy.isUnlimited && <p className="text-sm font-medium text-red-500">{errors.maxQuantity}</p>}
                            </div>
                            
                            <div className="space-y-2 flex flex-col justify-center mt-6">
                                <label className="flex items-center space-x-3 cursor-pointer">
                                    <input
                                        type="checkbox"
                                        name="isWorkedTime"
                                        checked={formData.policy.isWorkedTime}
                                        onChange={handlePolicyChange}
                                        className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-600"
                                    />
                                    <span className="font-medium text-slate-700">Được Tính Công</span>
                                </label>
                            </div>
                        </div>
                    </div>

                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex items-center justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Quay lại</Button>
                    <Button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    >
                        {submitting ? "Đang lưu..." : "Lưu Thay Đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
