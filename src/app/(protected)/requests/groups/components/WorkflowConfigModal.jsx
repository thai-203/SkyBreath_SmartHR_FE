"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/ui/input";

export default function WorkflowConfigModal({
    isOpen, onClose, onSubmit, groupData, roles, submitting
}) {
    const [workflows, setWorkflows] = useState([]);

    // Map groupData's existing workflows when modal opens
    useEffect(() => {
        if (isOpen && groupData) {
            if (groupData.workflows && groupData.workflows.length > 0) {
                // sort theo levelOrder
                const sorted = [...groupData.workflows].sort((a,b) => a.levelOrder - b.levelOrder);
                setWorkflows(sorted.map((wf) => ({
                    levelOrder: wf.levelOrder,
                    levelName: wf.levelName,
                    approverRoleId: wf.approverRoleId,
                    notifyApprover: wf.notifyApprover,
                })));
            } else {
                setWorkflows([]);
            }
        }
    }, [isOpen, groupData]);

    if (!isOpen) return null;

    const handleAddLevel = () => {
        setWorkflows([
            ...workflows,
            {
                levelOrder: workflows.length + 1,
                levelName: `Cấp duyệt ${workflows.length + 1}`,
                approverRoleId: "",
                notifyApprover: true,
            }
        ]);
    };

    const handleUpdateLevel = (index, field, value) => {
        const updated = [...workflows];
        updated[index][field] = value;
        setWorkflows(updated);
    };

    const handleRemoveLevel = (index) => {
        const updated = workflows.filter((_, i) => i !== index);
        // Resync level orders
        const syncedOrder = updated.map((item, i) => ({ ...item, levelOrder: i + 1 }));
        setWorkflows(syncedOrder);
    };

    const handleFormSubmit = () => {
        // Prepare correct types
        const payload = workflows.map(wf => ({
            ...wf,
            approverRoleId: parseInt(wf.approverRoleId, 10),
            notifyApprover: wf.notifyApprover === true || wf.notifyApprover === "true"
        }));
        onSubmit(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-3xl p-0 overflow-hidden bg-white border-none rounded-xl">
                <DialogHeader className="px-6 py-4 border-b bg-amber-50 relative">
                    <DialogTitle className="text-xl font-bold text-amber-900">
                        Cấu hình luồng duyệt: {groupData?.name}
                    </DialogTitle>
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-slate-200 text-slate-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                    <p className="text-sm text-amber-700 mt-2">Thêm lần lượt các cấp duyệt tương ứng. Thứ tự 1 là người duyệt đầu tiên.</p>
                </DialogHeader>

                <div className="px-6 py-6 space-y-4 max-h-[60vh] overflow-y-auto bg-slate-50">
                    {workflows.length === 0 ? (
                        <div className="text-center text-slate-500 py-10">
                            Chưa có cấp duyệt nào. Vui lòng bấm thêm mới!
                        </div>
                    ) : (
                        workflows.map((wf, idx) => (
                            <div key={idx} className="flex gap-4 items-end bg-white p-4 rounded-lg shadow-sm border border-slate-200">
                                <div className="space-y-1 w-20">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Thứ tự</label>
                                    <Input value={wf.levelOrder} disabled className="bg-slate-100 text-center font-bold" />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Tên Cấp Duyệt</label>
                                    <Input
                                        value={wf.levelName}
                                        onChange={(e) => handleUpdateLevel(idx, 'levelName', e.target.value)}
                                        placeholder="VD: Quản lý trực tiếp"
                                    />
                                </div>
                                <div className="space-y-1 flex-1">
                                    <label className="text-xs font-semibold text-slate-500 uppercase">Vai trò (Role) duyệt</label>
                                    <select
                                        value={wf.approverRoleId}
                                        onChange={(e) => handleUpdateLevel(idx, 'approverRoleId', e.target.value)}
                                        className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                    >
                                        <option value="">-- Chọn vai trò --</option>
                                        {roles.map(r => (
                                            <option key={r.id} value={r.id}>{r.roleName}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="space-y-1 text-center items-center flex flex-col justify-center">
                                    <label className="text-xs font-semibold text-slate-500 uppercase pb-2">Gửi TB</label>
                                    <input
                                        type="checkbox"
                                        checked={wf.notifyApprover}
                                        onChange={(e) => handleUpdateLevel(idx, 'notifyApprover', e.target.checked)}
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600"
                                    />
                                </div>
                                <Button variant="ghost" className="text-red-500 hover:text-red-700 hover:bg-red-50 p-2" onClick={() => handleRemoveLevel(idx)}>
                                    <Trash2 className="h-5 w-5" />
                                </Button>
                            </div>
                        ))
                    )}

                    <Button variant="outline" onClick={handleAddLevel} className="w-full border-dashed border-2 py-6 text-slate-500 hover:bg-slate-100 hover:text-slate-800">
                        <Plus className="mr-2 h-5 w-5" /> Thêm cấp duyệt
                    </Button>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-white flex items-center justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy bỏ</Button>
                    <Button
                        onClick={handleFormSubmit}
                        disabled={submitting}
                        className="bg-amber-600 hover:bg-amber-700 font-semibold"
                    >
                        {submitting ? "Đang lưu..." : "Lưu Cấu Hình"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
