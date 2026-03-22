"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Modal } from "@/components/common/Modal";
import { X, FileText, Clock, Users } from "lucide-react";

export default function OvertimeFormModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    errors = {},
    mode = "add",
    departments = [],
    overtimeTypes = [],
    submitting = false,
    originalRule = null,
}) {
    const isLockedByRequests = mode === "edit" && originalRule?.hasRequests;
    const isLockedByPayroll = mode === "edit" && originalRule?.hasPayroll;

    const handleChange = (field, value) => {
        onFormChange({ ...formData, [field]: value });
    };

    const handleToggleDepartment = (deptId) => {
        if (isLockedByPayroll) return;
        const currentIds = formData.departmentIds || [];
        const newIds = currentIds.includes(deptId)
            ? currentIds.filter((id) => id !== deptId)
            : [...currentIds, deptId];
        handleChange("departmentIds", newIds);
    };

    const selectedDepartments = departments.filter((d) =>
        formData.departmentIds?.includes(d.id)
    );

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={mode === "add" ? "Thêm quy định OT" : "Chỉnh sửa quy định OT"}
            description={
                mode === "add"
                    ? "Tạo mới một quy định làm thêm giờ cho nhân viên. Vui lòng điền đầy đủ các thông tin bắt buộc."
                    : "Cập nhật thông tin chi tiết của quy định làm thêm giờ."
            }
            size="xl"
        >
            <div className="pt-2 px-1 pb-1 space-y-8">
                {isLockedByPayroll && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm mb-4 border border-red-200">
                        <strong>Cảnh báo:</strong> Quy định này đã được tính lương. Toàn bộ thông tin bị khóa hoàn toàn.
                        Bạn chỉ có thể sửa Ngày kết thúc để ngừng áp dụng.
                    </div>
                )}
                {!isLockedByPayroll && isLockedByRequests && (
                    <div className="bg-amber-50 text-amber-700 p-3 rounded-lg text-sm mb-4 border border-amber-200">
                        <strong>Lưu ý:</strong> Quy định này đang có nhân viên yêu cầu OT. Các thông tin quan trọng như 
                        Loại OT, Hệ số, Ngày bắt đầu và Số giờ tối đa đã bị khóa để tránh sai lệch dữ liệu.
                    </div>
                )}

                {/* 1. THÔNG TIN CHUNG */}
                <section>
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                        <FileText className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            1. Thông tin chung
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                        <div className="md:col-span-2">
                            <Input
                                label="Tên quy định *"
                                placeholder="VD: OT ngày thường 2025"
                                value={formData.name || ""}
                                onChange={(e) => handleChange("name", e.target.value)}
                                error={errors.name}
                                disabled={isLockedByPayroll}
                            />
                        </div>

                        <div className="space-y-1 relative">
                            <label className="block text-sm font-medium text-slate-700">
                                Loại OT <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={formData.overtimeTypeId || ""}
                                onChange={(e) => handleChange("overtimeTypeId", e.target.value ? parseInt(e.target.value) : "")}
                                disabled={isLockedByRequests || isLockedByPayroll}
                                className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 ${errors.overtimeTypeId ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
                            >
                                <option value="">-- Chọn loại OT --</option>
                                {overtimeTypes.map((ot) => (
                                    <option key={ot.id} value={ot.id}>
                                        {ot.name}
                                    </option>
                                ))}
                            </select>
                            {errors.overtimeTypeId && (
                                <p className="text-xs font-medium text-red-500">{errors.overtimeTypeId}</p>
                            )}
                        </div>

                        <div className="space-y-1 relative">
                            <label className="block text-sm font-medium text-slate-700">
                                Trạng thái phiên bản
                            </label>
                            <select
                                value={formData.versionStatus || "DRAFT"}
                                onChange={(e) => handleChange("versionStatus", e.target.value)}
                                disabled={mode === "add" || originalRule?.versionStatus === "DRAFT" || originalRule?.versionStatus === "EXPIRED"}
                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50"
                            >
                                {(mode === "add" || originalRule?.versionStatus === "DRAFT") && (
                                    <option value="DRAFT">Nháp (DRAFT)</option>
                                )}
                                {originalRule?.versionStatus === "ACTIVE" && (
                                    <>
                                        <option value="ACTIVE">Đang áp dụng (ACTIVE)</option>
                                        <option value="EXPIRED">Hết hiệu lực (EXPIRED)</option>
                                    </>
                                )}
                                {originalRule?.versionStatus === "EXPIRED" && (
                                    <option value="EXPIRED">Hết hiệu lực (EXPIRED)</option>
                                )}
                            </select>
                        </div>

                        <div className="md:col-span-2 space-y-1">
                            <label className="block text-sm font-medium text-slate-700">Ghi chú</label>
                            <textarea
                                rows={3}
                                maxLength={500}
                                placeholder="Mô tả thêm (tối đa 500 ký tự)"
                                value={formData.note || ""}
                                onChange={(e) => handleChange("note", e.target.value)}
                                disabled={isLockedByPayroll}
                                className="flex w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50 resize-none"
                            />
                            {errors.note && <p className="text-xs font-medium text-red-500">{errors.note}</p>}
                        </div>
                    </div>
                </section>

                {/* 2. CHI TIẾT HỆ SỐ & THỜI GIAN */}
                <section>
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                        <Clock className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            2. Thời gian & Hệ số
                        </h3>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-5 md:grid-cols-2 mb-5">
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700">
                                Hiệu lực từ ngày <span className="text-red-500">*</span>
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveFrom || ""}
                                onChange={(e) => handleChange("effectiveFrom", e.target.value)}
                                disabled={isLockedByRequests || isLockedByPayroll}
                                className={`flex h-10 w-full rounded-lg border bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-slate-50 ${errors.effectiveFrom ? 'border-red-500 focus-visible:ring-red-500' : 'border-slate-200 focus-visible:ring-indigo-500'}`}
                            />
                            {errors.effectiveFrom && (
                                <p className="text-xs font-medium text-red-500">{errors.effectiveFrom}</p>
                            )}
                        </div>
                        <div className="space-y-1">
                            <label className="block text-sm font-medium text-slate-700 flex items-center gap-1">
                                Hiệu lực đến ngày
                                <span className="text-slate-400 font-normal text-[11px] bg-slate-100 px-1.5 py-0.5 rounded">(tùy chọn)</span>
                            </label>
                            <input
                                type="date"
                                value={formData.effectiveTo || ""}
                                min={formData.effectiveFrom || ""}
                                onChange={(e) => handleChange("effectiveTo", e.target.value || null)}
                                className="flex h-10 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-indigo-500 disabled:opacity-50 disabled:bg-slate-50"
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-3 bg-slate-50/50 p-4 rounded-xl border border-slate-100">
                        <Input
                            label="Hệ số lương *"
                            type="number"
                            step="0.1"
                            min="0"
                            max="99.9"
                            placeholder="VD: 1.5"
                            value={formData.salaryMultiplier || ""}
                            onChange={(e) => handleChange("salaryMultiplier", e.target.value)}
                            error={errors.salaryMultiplier}
                            disabled={isLockedByRequests || isLockedByPayroll}
                        />
                        <Input
                            label="Giờ tối đa/ngày *"
                            type="number"
                            min="1"
                            max="24"
                            placeholder="VD: 4"
                            value={formData.maxHoursPerDay || ""}
                            onChange={(e) => handleChange("maxHoursPerDay", e.target.value)}
                            error={errors.maxHoursPerDay}
                            disabled={isLockedByRequests || isLockedByPayroll}
                        />
                        <Input
                            label="Giờ tối đa/tháng *"
                            type="number"
                            min="1"
                            max="744"
                            placeholder="VD: 40"
                            value={formData.maxHoursPerMonth || ""}
                            onChange={(e) => handleChange("maxHoursPerMonth", e.target.value)}
                            error={errors.maxHoursPerMonth}
                            disabled={isLockedByRequests || isLockedByPayroll}
                        />
                    </div>
                </section>

                {/* 3. PHẠM VI ÁP DỤNG */}
                <section>
                    <div className="flex items-center gap-2 border-b border-slate-200 pb-2 mb-4">
                        <Users className="h-4 w-4 text-slate-500" />
                        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-700">
                            3. Phạm vi áp dụng
                        </h3>
                    </div>

                    <div className="space-y-3">
                        {/* Selected chips area */}
                        <div className="min-h-[36px] px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg flex flex-wrap gap-1.5 items-center">
                            {selectedDepartments.length > 0 ? (
                                selectedDepartments.map((dept) => (
                                    <span
                                        key={dept.id}
                                        className="inline-flex items-center gap-1.5 rounded-md bg-white border border-indigo-100 shadow-sm px-2.5 py-1 text-xs font-semibold text-indigo-700"
                                    >
                                        {dept.departmentName}
                                        {!isLockedByPayroll && (
                                            <button
                                                type="button"
                                                onClick={() => handleToggleDepartment(dept.id)}
                                                className="ml-0.5 rounded-md p-0.5 text-slate-400 hover:text-red-500 hover:bg-slate-100 transition-colors"
                                            >
                                                <X className="h-3 w-3" />
                                            </button>
                                        )}
                                    </span>
                                ))
                            ) : (
                                <span className="text-sm text-slate-400 italic">Chưa chọn phòng ban nào...</span>
                            )}
                            
                            {/* Nút chọn tất cả (optional utility) */}
                            {!isLockedByPayroll && departments.length > 0 && selectedDepartments.length < departments.length && (
                                <button
                                    type="button"
                                    onClick={() => handleChange("departmentIds", departments.map(d => d.id))}
                                    className="ml-auto text-xs font-medium text-indigo-600 hover:text-indigo-700 underline underline-offset-2"
                                >
                                    Chọn tất cả
                                </button>
                            )}
                            {!isLockedByPayroll && selectedDepartments.length > 0 && selectedDepartments.length === departments.length && (
                                <button
                                    type="button"
                                    onClick={() => handleChange("departmentIds", [])}
                                    className="ml-auto text-xs font-medium text-slate-500 hover:text-slate-700 underline underline-offset-2"
                                >
                                    Bỏ chọn tất cả
                                </button>
                            )}
                        </div>
                        {errors.departmentIds && (
                            <p className="text-xs font-medium text-red-500">{errors.departmentIds}</p>
                        )}

                        {/* List selection */}
                        <div className="max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white shadow-sm p-1.5 space-y-0.5">
                            {departments.length > 0 ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-1">
                                    {departments.map((dept) => {
                                        const isSelected = formData.departmentIds?.includes(dept.id);
                                        return (
                                            <label
                                                key={dept.id}
                                                className={`flex flex-row items-center gap-2.5 rounded-md px-2.5 py-2 text-sm cursor-pointer transition-all border ${
                                                    isSelected 
                                                        ? "bg-indigo-50/50 border-indigo-200 text-indigo-900 font-medium" 
                                                        : "bg-transparent border-transparent text-slate-700 hover:bg-slate-50 hover:border-slate-200"
                                                }`}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={isSelected || false}
                                                    onChange={() => handleToggleDepartment(dept.id)}
                                                    disabled={isLockedByPayroll}
                                                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-colors disabled:opacity-50"
                                                />
                                                <span className="truncate">{dept.departmentName}</span>
                                            </label>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="px-4 py-6 text-center text-sm text-slate-400">
                                    Không có dữ liệu phòng ban
                                </div>
                            )}
                        </div>
                    </div>
                </section>

                {/* FOOTER ACTIONS */}
                <div className="flex justify-end gap-3 pt-6 border-t border-slate-100">
                    <Button variant="outline" onClick={onClose} disabled={submitting} className="min-w-[100px]">
                        Hủy
                    </Button>
                    <Button onClick={onSubmit} disabled={submitting} className="min-w-[120px] shadow-sm">
                        {submitting ? "Đang xử lý..." : mode === "add" ? "Tạo quy định" : "Lưu thay đổi"}
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
