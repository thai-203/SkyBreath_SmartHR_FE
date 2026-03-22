"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Copy, Calendar, AlertCircle } from "lucide-react";
import { useState } from "react";

export function InheritModal({ isOpen, onClose, onConfirm, group }) {
    const [targetYear, setTargetYear] = useState(group ? group.year + 1 : new Date().getFullYear() + 1);
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        try {
            await onConfirm(targetYear);
            onClose();
        } catch (error) {
            console.error("Inheritance failed:", error);
        } finally {
            setLoading(false);
        }
    };

    if (!group) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-md bg-white border-none shadow-2xl p-0 overflow-hidden">
                <DialogHeader className="px-6 py-4 border-b">
                    <DialogTitle className="flex items-center gap-2 text-blue-700">
                        <Copy className="h-5 w-5" />
                        Kế thừa danh mục ngày lễ
                    </DialogTitle>
                </DialogHeader>
                <div className="p-6 space-y-6">
                    <div className="bg-blue-50/50 p-4 rounded-lg border border-blue-100 flex items-start gap-3">
                        <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                        <div className="text-sm">
                            <p className="font-semibold text-blue-900">Nguồn: {group.groupName}</p>
                            <p className="text-blue-700">Năm hiện tại: <span className="font-bold">{group.year}</span></p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-gray-700">Chọn năm kế thừa:</label>
                            <Input
                                type="number"
                                value={targetYear}
                                onChange={(e) => setTargetYear(parseInt(e.target.value))}
                                min={group.year + 1}
                                className="h-10 border-gray-200 focus:border-blue-500 rounded"
                            />
                        </div>

                        <div className="flex items-center gap-2 text-[12px] text-amber-600 bg-amber-50/50 p-3 rounded border border-amber-100 italic">
                            <AlertCircle className="h-4 w-4 shrink-0" />
                            <span>
                                Hệ thống sẽ sao chép toàn bộ ngày nghỉ và đối tượng áp dụng sang năm {targetYear}. 
                                Các ngày nghỉ sẽ được tự động điều chỉnh ngày tương ứng.
                            </span>
                        </div>
                    </div>
                </div>
                <DialogFooter className="px-6 py-4 bg-gray-50 border-t gap-2">
                    <Button variant="ghost" onClick={onClose} disabled={loading} className="text-gray-500 hover:bg-gray-100">
                        Hủy
                    </Button>
                    <Button 
                        onClick={handleConfirm} 
                        disabled={loading}
                        className="bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-200"
                    >
                        {loading ? "Đang xử lý..." : "Xác nhận kế thừa"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
