"use client";

import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { AlertCircle, X } from "lucide-react";
import { useEffect, useState } from "react";

export function InheritModal({ isOpen, onClose, previewData, onConfirm }) {
    const { success: toastSuccess, error: toastError } = useToast();
    const [data, setData] = useState(previewData || []);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Sync state when new preview data arrives or modal opens
    useEffect(() => {
        if (isOpen) {
            setData(previewData || []);
        }
    }, [previewData, isOpen]);

    const handleRemove = (index) => {
        setData(data.filter((_, i) => i !== index));
    };

    const handleConfirm = async () => {
        if (data.length === 0) {
            toastError("Không có ngày lễ nào để kế thừa");
            return;
        }

        setIsSubmitting(true);
        try {
            await onConfirm(data);
            toastSuccess("Kế thừa ngày lễ thành công");
            onClose();
        } catch (error) {
            toastError("Kế thừa ngày lễ thất bại");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-5xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b">
                    <div className="flex items-center gap-4">
                        <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5 text-gray-500" />
                        </button>
                        <DialogTitle className="text-lg font-bold text-[#1e293b]">
                            Xác nhận kế thừa ngày nghỉ cho năm sau
                        </DialogTitle>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button type="button" variant="outline" onClick={onClose} className="h-9 px-6 border-gray-300 text-gray-600 hover:bg-gray-50 rounded">
                            Hủy
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={isSubmitting}
                            className="h-9 px-6 bg-[#003399] hover:bg-[#002266] text-white rounded shadow-sm"
                        >
                            {isSubmitting ? "Đang xử lý..." : "Xác nhận & Lưu"}
                        </Button>
                    </div>
                </div>

                {/* Content */}
                <div className="p-6">
                    <div className="mb-4 flex items-center gap-2 text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-100">
                        <AlertCircle className="h-4 w-4" />
                        Dưới đây là danh sách ngày nghỉ được tự động chuyển sang năm sau (+1 năm). Bạn có thể xóa bớt trước khi lưu.
                    </div>

                    <div className="rounded-xl border border-gray-100 bg-white overflow-hidden max-h-[60vh] overflow-y-auto">
                        <Table>
                            <TableHeader className="bg-gray-50/50 sticky top-0 z-10">
                                <TableRow>
                                    <TableHead className="w-[60px]">STT</TableHead>
                                    <TableHead>Tên ngày lễ</TableHead>
                                    <TableHead>Ngày bắt đầu (DL)</TableHead>
                                    <TableHead>Ngày kết thúc (DL)</TableHead>
                                    <TableHead>Loại ngày</TableHead>
                                    <TableHead className="text-center">Hành động</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {data.map((item, index) => (
                                    <TableRow key={index} className="hover:bg-gray-50/50">
                                        <TableCell>{index + 1}</TableCell>
                                        <TableCell className="font-medium">{item.holidayName}</TableCell>
                                        <TableCell>{formatDate(item.startDate)}</TableCell>
                                        <TableCell>{formatDate(item.endDate)}</TableCell>
                                        <TableCell>{item.holidayType}</TableCell>
                                        <TableCell className="text-center">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-red-400 hover:text-red-600 hover:bg-red-50"
                                                onClick={() => handleRemove(index)}
                                            >
                                                <X className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
