"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";

export default function AssignmentDeleteModal({ open, loading, onClose, onConfirm }) {
    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Xác nhận hủy phân ca</DialogTitle>
                </DialogHeader>
                <div className="py-4">
                    <p className="text-slate-600">Bạn có chắc muốn hủy phân ca này? Hành động này không thể hoàn tác.</p>
                </div>
                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
                    <Button variant="destructive" onClick={onConfirm} loading={loading}>Xác nhận</Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
