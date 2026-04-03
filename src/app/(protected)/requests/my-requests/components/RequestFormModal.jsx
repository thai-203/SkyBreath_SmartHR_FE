"use client";

import { useState, useEffect, useCallback } from "react";
import { X, Upload, Trash2, Loader2, FileText, CheckCircle, Clock, XCircle, RotateCcw } from "lucide-react";
import { requestsService } from "@/services/requests.service";
import { requestTypesService } from "@/services/request-types.service";
import { requestGroupsService } from "@/services/request-groups.service";
import { employeesService } from "@/services/employees.service";
import { authService } from "@/services/auth.service";
import { useToast } from "@/components/common/Toast";

const APPROVAL_TYPE_LABEL = {
    DIRECT_MANAGER: "Quản lý trực tiếp",
    ROLE: "Theo vai trò",
};

export default function RequestFormModal({ isOpen, onClose, employeeId, requestId, onSuccess }) {
    const { success, error: toastError } = useToast();
    const [requestTypes, setRequestTypes] = useState([]);
    const [requestGroups, setRequestGroups] = useState([]);
    const [employees, setEmployees] = useState([]);
    const [workflowPreview, setWorkflowPreview] = useState([]);
    const [attachments, setAttachments] = useState([]);
    
    // States
    const [uploading, setUploading] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [savedRequestId, setSavedRequestId] = useState(requestId || null);
    const [currentUserEmployeeId, setCurrentUserEmployeeId] = useState(null);

    const [form, setForm] = useState({
        employeeId: employeeId || "",
        requestGroupId: "",
        requestTypeId: "",
        startDate: new Date().toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        startTime: "",
        endTime: "",
        description: "",
        isWorkedTime: false,
        unit: "",
    });

    const [policy, setPolicy] = useState(null);
    const [errors, setErrors] = useState({});

    // Init data
    useEffect(() => {
        if (!isOpen) return;
        
        requestGroupsService.getAll({ status: "ACTIVE", limit: 100 }).then((res) => {
            const arr = res?.data?.data || res?.items || res?.data?.items || [];
            setRequestGroups(arr.filter(Item => !Item.isDeleted && Item.status === 'ACTIVE'));
        });

        requestTypesService.getAll({ status: "ACTIVE", limit: 200 }).then((res) => {
            const arr = res?.data?.data || res?.data?.items || res?.items || [];
            setRequestTypes(arr.filter(Item => !Item.isDeleted && Item.status === 'ACTIVE'));
        });
        
        employeesService.getAll({ limit: 500 }).then((res) => {
            const arr = res?.data?.data || res?.data?.items || res?.items || [];
            setEmployees(arr.filter(Item => !Item.isDeleted));
        });

        // Set default employeeId
        authService.getCurrentEmployeeByUserId().then(emp => {
            if (emp?.id) {
                setCurrentUserEmployeeId(emp.id);
                if (!employeeId && !form.employeeId && !requestId) {
                    setForm(prev => ({ ...prev, employeeId: emp.id }));
                }
            }
        }).catch(err => console.error("Lỗi lấy thông tin NV hiện tại", err));

        // Load existing request data if editing
        if (requestId) {
            requestsService.getById(requestId).then((res) => {
                const data = res?.data;
                if (data) {
                    setForm(prev => ({
                        ...prev,
                        employeeId: data.employeeId || data.employee?.id || prev.employeeId,
                        requestGroupId: data.requestGroupId || data.requestGroup?.id || data.requestType?.requestGroupId || "",
                        requestTypeId: data.requestTypeId || data.requestType?.id || "",
                        startDate: data.startDate || new Date().toISOString().slice(0, 10),
                        endDate: data.endDate || new Date().toISOString().slice(0, 10),
                        startTime: data.startTime || "",
                        endTime: data.endTime || "",
                        description: data.description || "",
                        isWorkedTime: !!data.isWorkedTime,
                        unit: data.unit || "",
                    }));
                    setSavedRequestId(data.id);
                    setAttachments(data.attachments || []);
                }
            }).catch(console.error);
        }
    }, [isOpen]);

    // Load workflow preview khi chọn loại đơn hoặc người được tạo đơn
    const loadWorkflowPreview = useCallback(async (typeId, empId) => {
        if (!typeId || !empId) return;
        try {
            const res = await requestsService.getWorkflowPreview(typeId, empId);
            setWorkflowPreview(res?.data || []);
        } catch {
            setWorkflowPreview([]);
        }
    }, []);

    useEffect(() => {
        if (form.requestTypeId && form.employeeId) {
            // Lấy policy của loại đơn
            const type = requestTypes.find((t) => t.id === parseInt(form.requestTypeId));
            if (type?.policy) {
                setPolicy(type.policy);
                setForm((prev) => ({
                    ...prev,
                    isWorkedTime: type.policy.isWorkedTime ?? false,
                    unit: type.policy.unit ?? "",
                }));
            }
            loadWorkflowPreview(form.requestTypeId, form.employeeId);
        }
    }, [form.requestTypeId, form.employeeId, requestTypes, loadWorkflowPreview]);

    const validate = () => {
        const e = {};
        if (!form.employeeId) e.employeeId = "Vui lòng chọn người được tạo đơn";
        if (!form.requestTypeId) e.requestTypeId = "Vui lòng chọn lý do";
        if (!form.startDate) e.startDate = "Vui lòng chọn từ ngày";
        if (!form.endDate) e.endDate = "Vui lòng chọn đến ngày";
        if (form.startDate && form.endDate && form.startDate > form.endDate) {
            e.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSaveDraft = async () => {
        if (!form.requestTypeId) {
            toastError("Vui lòng chọn lý do đơn trước khi lưu nháp");
            return;
        }
        setSubmitting(true);
        try {
            const res = await requestsService.saveDraft({ ...form, requestId: savedRequestId });
            const newId = res?.data?.id;
            setSavedRequestId(newId);
            success("Lưu nháp thành công");
            onSuccess?.();
        } catch (err) {
            toastError(err?.response?.data?.message || "Lưu nháp thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleSubmit = async () => {
        if (!validate()) return;
        setSubmitting(true);
        try {
            // 1. Lưu nháp trước nếu chưa có requestId
            let currentId = savedRequestId;
            if (!currentId) {
                const draftRes = await requestsService.saveDraft({ ...form });
                currentId = draftRes?.data?.id;
                setSavedRequestId(currentId);
            } else {
                await requestsService.saveDraft({ ...form, requestId: currentId });
            }

            // 2. Upload đính kèm nếu có
            if (attachments.length > 0) {
                await requestsService.uploadAttachments(currentId, attachments);
            }

            // 3. Gửi duyệt
            await requestsService.submit(currentId);
            success("Gửi duyệt thành công!");
            onSuccess?.();
            onClose();
        } catch (err) {
            toastError(err?.response?.data?.message || "Gửi duyệt thất bại");
        } finally {
            setSubmitting(false);
        }
    };

    const handleFileChange = (e) => {
        const files = Array.from(e.target.files || []);
        setAttachments((prev) => [...prev, ...files]);
        e.target.value = "";
    };

    const removeAttachment = (idx) => {
        setAttachments((prev) => prev.filter((_, i) => i !== idx));
    };

    if (!isOpen) return null;

    const selectedType = requestTypes.find((t) => t.id === parseInt(form.requestTypeId));

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-5xl mx-4 max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b bg-gradient-to-r from-slate-50 to-blue-50">
                    <h2 className="text-lg font-bold text-slate-800">TẠO MỚI ĐƠN TỪ</h2>
                    <div className="flex items-center gap-3">
                        {selectedType && (
                            <span className="text-xs text-orange-500 font-medium bg-orange-50 px-3 py-1 rounded-full border border-orange-200">
                                {selectedType.requestGroup?.name || selectedType.name}
                            </span>
                        )}
                        <button
                            onClick={handleSaveDraft}
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100 transition-colors disabled:opacity-50"
                        >
                            Lưu nháp
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="px-4 py-2 text-sm font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {submitting && <Loader2 className="w-4 h-4 animate-spin" />}
                            Gửi duyệt
                        </button>
                        <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-200 text-slate-500 transition-colors">
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                    {/* ── Thông tin chung ─────────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-700 mb-4 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
                            Thông tin chung
                        </h3>

                        <div className="space-y-4">
                            {/* Tạo đơn cho */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Tạo đơn cho <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={form.employeeId}
                                    onChange={(e) => setForm((p) => ({ ...p, employeeId: e.target.value }))}
                                    disabled
                                    className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-slate-50 text-slate-500 cursor-not-allowed"
                                >
                                    <option value="">-- Chọn nhân viên --</option>
                                    {employees.map((emp) => (
                                        <option key={emp.id} value={emp.id}>
                                            {emp.fullName}
                                        </option>
                                    ))}
                                </select>
                                {errors.employeeId && <p className="text-xs text-red-500 mt-1">{errors.employeeId}</p>}
                            </div>

                            {/* Nhóm đơn & Lý do + Tính công */}
                            <div className="flex gap-4">
                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Nhóm đơn <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.requestGroupId}
                                        onChange={(e) => setForm((p) => ({ ...p, requestGroupId: e.target.value, requestTypeId: "" }))}
                                        className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white"
                                    >
                                        <option value="">-- Chọn nhóm đơn --</option>
                                        {requestGroups.map((group) => (
                                            <option key={group.id} value={group.id}>
                                                {group.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                <div className="flex-1">
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Lý do (Loại đơn) <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={form.requestTypeId}
                                        onChange={(e) => setForm((p) => ({ ...p, requestTypeId: e.target.value }))}
                                        disabled={!form.requestGroupId}
                                        className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 bg-white disabled:bg-slate-50 disabled:text-slate-400"
                                    >
                                        <option value="">Chọn lý do</option>
                                        {requestTypes
                                            .filter(t => form.requestGroupId ? t.requestGroupId === parseInt(form.requestGroupId) : true)
                                            .map((type) => (
                                            <option key={type.id} value={type.id}>
                                                {type.name}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.requestTypeId && <p className="text-xs text-red-500 mt-1">{errors.requestTypeId}</p>}
                                </div>

                                {/* Tính công — readonly từ policy */}
                                <div className="flex items-end pb-1 gap-2 w-auto min-w-[100px]">
                                    <input
                                        type="checkbox"
                                        id="isWorkedTime"
                                        checked={form.isWorkedTime}
                                        readOnly
                                        className="w-4 h-4 accent-blue-600 cursor-not-allowed"
                                    />
                                    <label htmlFor="isWorkedTime" className="text-sm text-slate-600 select-none cursor-not-allowed">
                                        Tính công
                                    </label>
                                </div>
                            </div>

                            {/* Thời gian: Từ giờ, Từ ngày, Đến giờ, Đến ngày */}
                            <div className="grid grid-cols-4 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Từ giờ</label>
                                    <input
                                        type="time"
                                        value={form.startTime}
                                        onChange={(e) => setForm((p) => ({ ...p, startTime: e.target.value }))}
                                        className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Từ ngày <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={form.startDate}
                                        onChange={(e) => setForm((p) => ({ ...p, startDate: e.target.value }))}
                                        className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    {errors.startDate && <p className="text-xs text-red-500 mt-1">{errors.startDate}</p>}
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">Đến giờ</label>
                                    <input
                                        type="time"
                                        value={form.endTime}
                                        onChange={(e) => setForm((p) => ({ ...p, endTime: e.target.value }))}
                                        className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-slate-600 mb-1">
                                        Đến ngày <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="date"
                                        value={form.endDate}
                                        onChange={(e) => setForm((p) => ({ ...p, endDate: e.target.value }))}
                                        className="w-full h-10 px-3 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                                    />
                                    {errors.endDate && <p className="text-xs text-red-500 mt-1">{errors.endDate}</p>}
                                </div>
                            </div>

                            {/* Mô tả */}
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                                <textarea
                                    value={form.description}
                                    onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                                    placeholder="Nhập mô tả..."
                                    rows={3}
                                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 resize-none"
                                />
                            </div>
                        </div>
                    </section>

                    {/* ── Tài liệu đính kèm ───────────────────────────── */}
                    <section>
                        <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                            <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
                            Tài liệu đính kèm
                        </h3>

                        <div className="space-y-2">
                            {attachments.map((file, idx) => (
                                <div key={idx} className="flex items-center gap-3 px-3 py-2 bg-slate-50 rounded-lg border border-slate-200">
                                    <FileText className="w-4 h-4 text-blue-500 shrink-0" />
                                    <span className="text-sm text-slate-700 flex-1 truncate">{file.name}</span>
                                    <span className="text-xs text-slate-400">{(file.size / 1024).toFixed(0)} KB</span>
                                    <button onClick={() => removeAttachment(idx)} className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded">
                                        <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                </div>
                            ))}

                            <label className="flex items-center gap-2 text-sm text-blue-600 cursor-pointer hover:text-blue-700 w-fit">
                                <Upload className="w-4 h-4" />
                                <span className="underline underline-offset-2">Thêm file</span>
                                <input type="file" multiple hidden onChange={handleFileChange} />
                            </label>
                        </div>
                    </section>

                    {/* ── Thông tin cấp duyệt ─────────────────────────── */}
                    {workflowPreview.length > 0 && (
                        <section>
                            <h3 className="text-sm font-bold text-slate-700 mb-3 flex items-center gap-2">
                                <span className="w-1 h-5 bg-blue-500 rounded-full inline-block" />
                                Thông tin cấp duyệt
                            </h3>

                            <div className="rounded-xl border border-slate-200 overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="bg-slate-50 text-slate-600">
                                        <tr>
                                            <th className="px-4 py-2.5 text-left font-semibold">Cấp duyệt</th>
                                            <th className="px-4 py-2.5 text-left font-semibold">Phân quyền</th>
                                            <th className="px-4 py-2.5 text-left font-semibold">Người duyệt</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {workflowPreview.map((level) => (
                                            <tr key={level.levelOrder} className="hover:bg-slate-50/50">
                                                <td className="px-4 py-3 font-medium text-slate-700">
                                                    Cấp {level.levelOrder}: {level.levelName}
                                                </td>
                                                <td className="px-4 py-3 text-slate-500">
                                                    {APPROVAL_TYPE_LABEL[level.approverType] || level.approverType}
                                                </td>
                                                <td className="px-4 py-3">
                                                    {level.resolved ? (
                                                        <span className="font-medium text-slate-700">{level.approverEmployee?.fullName}</span>
                                                    ) : (
                                                        <span className="text-red-500 text-xs">⚠ Chưa xác định được người duyệt</span>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </section>
                    )}
                </div>
            </div>
        </div>
    );
}
