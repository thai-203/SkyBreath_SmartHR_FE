"use client";

import { useState, useEffect } from "react";
import { X, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/ui/input";
import { userService } from "@/services/user.service";
import { useToast } from "@/components/common/Toast";

import { APPROVER_TYPES, APPROVER_TYPE_LABELS } from "@/constants/request.enum";

export default function WorkflowConfigModal({
    isOpen, onClose, onSubmit, groupData, submitting, roles
}) {
    const { error: toastError } = useToast();
    const [workflows, setWorkflows] = useState([]);
    const [usersByRole, setUsersByRole] = useState({}); // { roleId: [...] }

    // Build role options from DB directly
    const roleOptions = (roles || [])
        .filter(r => r.roleName === 'HR' || r.roleName === 'ADMIN')
        .map(r => ({ value: r.id.toString(), label: r.roleName }));

    // Map groupData's existing workflows when modal opens
    useEffect(() => {
        if (isOpen && groupData) {
            if (groupData.workflows && groupData.workflows.length > 0) {
                // sort theo levelOrder
                const sorted = [...groupData.workflows].sort((a,b) => a.levelOrder - b.levelOrder);
                const mapped = sorted.map((wf) => ({
                    levelOrder: wf.levelOrder,
                    levelName: wf.levelName,
                    approverType: wf.approverType || APPROVER_TYPES.DIRECT_MANAGER,
                    approverRoleId: wf.approverRoleId ? wf.approverRoleId.toString() : "",
                    approverUserId: wf.approverUserId || "",
                    notifyApprover: wf.notifyApprover,
                    _selectedRoleId: wf.approverRoleId ? wf.approverRoleId.toString() : "",
                }));
                setWorkflows(mapped);

                // Fetch users for already-selected roles
                const roleIds = [...new Set(mapped.filter(w => w._selectedRoleId).map(w => w._selectedRoleId))];
                roleIds.forEach(rid => fetchUsersForRole(rid));
            } else {
                setWorkflows([]);
            }
        }
    }, [isOpen, groupData]);

    const fetchUsersForRole = async (roleId) => {
        if (usersByRole[roleId]) return; // Already loaded
        try {
            // Gửi roles là string (không phải array) để tránh Axios serialize thành roles[0]=...
            // BE SearchUserDto có @Transform sẽ tự wrap thành [roleId]
            const res = await userService.getAll({ roles: roleId, limit: 100 });
            // res structure: { success, message, data: { data: [...users], total, ... } }
            const users = res?.data?.data || res?.data || [];
            setUsersByRole(prev => ({
                ...prev,
                [roleId]: Array.isArray(users) ? users : []
            }));
        } catch (err) {
            console.error("Lỗi tải danh sách user:", err);
            setUsersByRole(prev => ({
                ...prev,
                [roleId]: []
            }));
        }
    };

    if (!isOpen) return null;

    const handleAddLevel = () => {
        const isFirst = workflows.length === 0;
        setWorkflows([
            ...workflows,
            {
                levelOrder: workflows.length + 1,
                levelName: isFirst ? "Quản lý trực tiếp" : `Cấp duyệt ${workflows.length + 1}`,
                approverType: isFirst ? APPROVER_TYPES.DIRECT_MANAGER : APPROVER_TYPES.ROLE,
                approverRoleId: "",
                approverUserId: "",
                notifyApprover: true,
                _selectedRoleId: "",
            }
        ]);
    };

    const handleUpdateLevel = (index, field, value) => {
        const updated = [...workflows];
        updated[index][field] = value;

        // If changing approverType, reset role/user
        if (field === 'approverType') {
            if (value === APPROVER_TYPES.DIRECT_MANAGER) {
                updated[index].approverRoleId = "";
                updated[index].approverUserId = "";
                updated[index]._selectedRoleId = "";
            }
        }

        // If selecting a role, fetch users for that role and reset user selection
        if (field === '_selectedRoleId') {
            updated[index].approverUserId = "";
            updated[index].approverRoleId = value; // Keep ID around
            if (value) {
                fetchUsersForRole(value);
            }
        }

        setWorkflows(updated);
    };

    const handleRemoveLevel = (index) => {
        const updated = workflows.filter((_, i) => i !== index);
        // Resync level orders
        const syncedOrder = updated.map((item, i) => ({ ...item, levelOrder: i + 1 }));
        setWorkflows(syncedOrder);
    };

    const handleFormSubmit = () => {
        // Validate duplication directly on frontend
        const dmCount = workflows.filter(wf => wf.approverType === APPROVER_TYPES.DIRECT_MANAGER).length;
        if (dmCount > 1) {
            toastError("Chỉ được thiết lập tối đa 1 cấp Duyệt bởi Quản lý trực tiếp.");
            return;
        }

        const userIds = workflows
            .filter(wf => wf.approverType === APPROVER_TYPES.ROLE && wf.approverUserId)
            .map(wf => wf.approverUserId);
        
        const uniqueUserIds = new Set(userIds);
        if (userIds.length !== uniqueUserIds.size) {
            toastError("Không được chọn trùng lặp người duyệt cho nhiều cấp khác nhau để tránh vòng lặp duyệt.");
            return;
        }

        // Prepare correct types
        const payload = workflows.map(wf => {
            const roleId = wf.approverType === APPROVER_TYPES.ROLE
                ? (parseInt(wf._selectedRoleId, 10) || null)
                : null;
            return {
                levelOrder: wf.levelOrder,
                levelName: wf.levelName,
                approverType: wf.approverType,
                approverRoleId: roleId,
                approverUserId: wf.approverType === APPROVER_TYPES.ROLE ? parseInt(wf.approverUserId, 10) : null,
                notifyApprover: wf.notifyApprover === true || wf.notifyApprover === "true"
            };
        });
        onSubmit(payload);
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-4xl p-0 overflow-hidden bg-white text-slate-900 border-none rounded-xl">
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
                            <div key={idx} className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 space-y-3">
                                <div className="flex gap-4 items-end">
                                    <div className="space-y-1 w-16">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">TT</label>
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
                                    <div className="space-y-1 w-48">
                                        <label className="text-xs font-semibold text-slate-500 uppercase">Loại người duyệt</label>
                                        <select
                                            value={wf.approverType}
                                            onChange={(e) => handleUpdateLevel(idx, 'approverType', e.target.value)}
                                            className="flex h-10 w-full rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-slate-400"
                                        >
                                            {Object.entries(APPROVER_TYPE_LABELS).map(([val, label]) => {
                                                const isDMUsed = val === APPROVER_TYPES.DIRECT_MANAGER && 
                                                                 workflows.some((w, i) => i !== idx && w.approverType === APPROVER_TYPES.DIRECT_MANAGER);
                                                return (
                                                    <option key={val} value={val} disabled={isDMUsed}>
                                                        {label} {isDMUsed && "(Đã sử dụng)"}
                                                    </option>
                                                );
                                            })}
                                        </select>
                                    </div>
                                    <div className="space-y-1 text-center items-center flex flex-col justify-center">
                                        <label className="text-xs font-semibold text-slate-500 uppercase pb-2">TB</label>
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

                                {/* Row 2: Role + User selection (only when type = ROLE) */}
                                {wf.approverType === APPROVER_TYPES.ROLE && (
                                    <div className="flex gap-4 items-end pl-20 border-t pt-3 border-dashed border-slate-200">
                                        <div className="space-y-1 flex-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Chọn vai trò</label>
                                            <select
                                                value={wf._selectedRoleId}
                                                onChange={(e) => handleUpdateLevel(idx, '_selectedRoleId', e.target.value)}
                                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400"
                                            >
                                                <option value="">-- Chọn vai trò --</option>
                                                {roleOptions.map(r => (
                                                    <option key={r.value} value={r.value}>{r.label}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="space-y-1 flex-1">
                                            <label className="text-xs font-semibold text-slate-500 uppercase">Chọn người duyệt</label>
                                            <select
                                                value={wf.approverUserId}
                                                onChange={(e) => handleUpdateLevel(idx, 'approverUserId', e.target.value)}
                                                disabled={!wf._selectedRoleId}
                                                className="flex h-10 w-full rounded-md border border-slate-300 bg-white text-slate-900 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-amber-400 disabled:bg-slate-100 disabled:cursor-not-allowed"
                                            >
                                                <option value="">-- Chọn người duyệt --</option>
                                                {(Array.isArray(usersByRole[wf._selectedRoleId]) ? usersByRole[wf._selectedRoleId] : []).map(u => {
                                                    const isUserUsed = workflows.some((w, i) => i !== idx && w.approverType === APPROVER_TYPES.ROLE && w.approverUserId && parseInt(w.approverUserId, 10) === u.id);
                                                    return (
                                                        <option key={u.id} value={u.id} disabled={isUserUsed}>
                                                            {u.fullName || u.username} ({u.email || u.username}) {isUserUsed && "- Đã chọn ở cấp khác"}
                                                        </option>
                                                    );
                                                })}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                {wf.approverType === APPROVER_TYPES.DIRECT_MANAGER && (
                                    <div className="pl-20 pt-2">
                                        <p className="text-sm text-emerald-600 font-medium italic">
                                            ✓ Hệ thống tự động lấy Quản lý trực tiếp của nhân viên gửi đơn
                                        </p>
                                    </div>
                                )}
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
