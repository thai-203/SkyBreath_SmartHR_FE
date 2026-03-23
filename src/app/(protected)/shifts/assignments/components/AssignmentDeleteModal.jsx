"use client";

import { 
    Dialog, 
    DialogContent, 
    DialogHeader, 
    DialogTitle, 
    DialogFooter,
    DialogPortal,
    DialogOverlay
} from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { cn } from "@/lib/utils"; // Giả định bạn có hàm cn chuẩn của Shadcn

export default function AssignmentDeleteModal({ open, loading, onClose, onConfirm }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogPortal>
                {/* Lớp nền mờ */}
                <DialogOverlay className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm" />
                
                {/* Nội dung Modal */}
                <DialogContent className="fixed left-[50%] top-[50%] z-[51] w-full max-w-md translate-x-[-50%] translate-y-[-50%] rounded-lg bg-white p-6 shadow-lg duration-200 focus:outline-none">
                    
                    <DialogHeader className="mb-4">
                        <DialogTitle className="text-xl font-semibold text-slate-900">
                            Xác nhận hủy phân ca
                        </DialogTitle>
                    </DialogHeader>

                    <div className="py-2">
                        <p className="text-sm text-slate-600 leading-relaxed">
                            Bạn có chắc muốn hủy phân ca này? 
                            <span className="block font-medium text-red-500 mt-1">
                                Hành động này không thể hoàn tác.
                            </span>
                        </p>
                    </div>

                    <DialogFooter className="mt-6 flex justify-end gap-3">
                        <Button 
                            variant="outline" 
                            onClick={onClose} 
                            disabled={loading}
                            className="border-slate-200 text-slate-700 hover:bg-slate-50"
                        >
                            Hủy
                        </Button>
                        <Button 
                            variant="destructive" 
                            onClick={onConfirm} 
                            loading={loading}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Xác nhận
                        </Button>
                    </DialogFooter>
                    
                </DialogContent>
            </DialogPortal>
        </Dialog>
    );
}