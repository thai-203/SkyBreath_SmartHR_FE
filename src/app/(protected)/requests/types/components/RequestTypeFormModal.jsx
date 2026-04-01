"use client";

import { X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function RequestTypeFormModal({
    isOpen, onClose, onSubmit, formData, onFormChange, errors, mode, submitting, groups
}) {
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFormChange({ ...formData, [name]: value });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-lg p-0 overflow-hidden bg-white border-none rounded-xl">
                <DialogHeader className="px-6 py-4 border-b bg-slate-50 relative">
                    <DialogTitle className="text-xl font-bold text-slate-800">
                        {mode === "add" ? "Thêm Loại Đơn Mới" : "Cập nhật Loại Đơn"}
                    </DialogTitle>
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                <div className="px-6 py-6 space-y-4">
                    <div className="space-y-2">
                        <Label>Nhóm Đơn <span className="text-red-500">*</span></Label>
                        <select
                            name="requestGroupId"
                            value={formData.requestGroupId || ""}
                            onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                        >
                            <option value="">-- Chọn nhóm đơn --</option>
                            {(groups || []).map(g => (
                                <option key={g.id} value={g.id}>{g.name}</option>
                            ))}
                        </select>
                        {errors.requestGroupId && <p className="text-sm font-medium text-red-500">{errors.requestGroupId}</p>}
                    </div>

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

                    <div className="space-y-2">
                        <Label>Mô tả</Label>
                        <Textarea
                            name="description"
                            value={formData.description}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Thêm mô tả cho loại đơn này..."
                        />
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex items-center justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Quay lại</Button>
                    <Button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    >
                        {submitting ? "Đang lưu..." : mode === "add" ? "Tạo Loại Đơn" : "Lưu Thay Đổi"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
