"use client";

import React, { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

const emptyForm = {
    violationType: "",
    effectiveFrom: "",
    effectiveTo: "",
    fromMinute: "",
    toMinute: "",
    convertedHours: "",
    note: "",
    status: "ACTIVE",
};

export default function PenaltyFormModal({
    isOpen,
    onClose,
    onSubmit,
    penalty = null,
    loading = false,
}) {
    const [form, setForm] = useState(emptyForm);
    const [errors, setErrors] = useState({});

    const isEdit = !!penalty;

    useEffect(() => {
        if (isOpen) {
            if (penalty) {
                setForm({
                    violationType: penalty.violationType || "",
                    effectiveFrom: penalty.effectiveFrom
                        ? new Date(penalty.effectiveFrom).toISOString().split("T")[0]
                        : "",
                    effectiveTo: penalty.effectiveTo
                        ? new Date(penalty.effectiveTo).toISOString().split("T")[0]
                        : "",
                    fromMinute: penalty.fromMinute ?? "",
                    toMinute: penalty.toMinute ?? "",
                    convertedHours: penalty.convertedHours ?? "",
                    note: penalty.note || "",
                    status: penalty.status || "ACTIVE",
                });
            } else {
                setForm({ ...emptyForm });
            }
            setErrors({});
        }
    }, [isOpen, penalty]);

    const handleChange = (field, value) => {
        setForm((prev) => ({ ...prev, [field]: value }));
        if (errors[field]) {
            setErrors((prev) => { const next = { ...prev }; delete next[field]; return next; });
        }
    };

    const validate = () => {
        const errs = {};
        if (!form.violationType) errs.violationType = "Vui lòng chọn trường hợp vi phạm";
        if (!form.effectiveFrom) errs.effectiveFrom = "Vui lòng chọn ngày hiệu lực";
        if (form.effectiveFrom && form.effectiveTo && new Date(form.effectiveTo) <= new Date(form.effectiveFrom)) {
            errs.effectiveTo = "Ngày hết hiệu lực phải sau ngày hiệu lực";
        }
        if (form.fromMinute === "" || form.fromMinute === null) errs.fromMinute = "Bắt buộc";
        if (form.toMinute === "" || form.toMinute === null) errs.toMinute = "Bắt buộc";
        if (form.convertedHours === "" || form.convertedHours === null) errs.convertedHours = "Bắt buộc";
        if (form.fromMinute !== "" && form.toMinute !== "" && Number(form.fromMinute) >= Number(form.toMinute)) {
            errs.toMinute = "Phải lớn hơn thời gian từ";
        }
        setErrors(errs);
        return Object.keys(errs).length === 0;
    };

    const handleSubmit = () => {
        if (!validate()) return;
        onSubmit({
            violationType: form.violationType,
            effectiveFrom: form.effectiveFrom,
            effectiveTo: form.effectiveTo || null,
            fromMinute: Number(form.fromMinute),
            toMinute: Number(form.toMinute),
            convertedHours: Number(form.convertedHours),
            note: form.note || null,
            status: form.status,
        });
    };

    const inputClass = (field) =>
        `h-10 w-full rounded-lg border px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 ${
            errors[field] ? "border-red-300 bg-red-50" : "border-slate-200 bg-white"
        }`;

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Chỉnh sửa quy định vi phạm" : "Thêm mới quy định vi phạm"}
            size="xl"
        >
            <div className="space-y-5 p-0.5">
                {/* Trường hợp */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">
                        <span className="text-red-500">*</span> Trường hợp
                    </label>
                    <select value={form.violationType} onChange={(e) => handleChange("violationType", e.target.value)} className={inputClass("violationType")}>
                        <option value="">Chọn trường hợp</option>
                        <option value="LATE">Đi muộn</option>
                        <option value="EARLY">Về sớm</option>
                    </select>
                    {errors.violationType && <p className="text-xs text-red-500">{errors.violationType}</p>}
                </div>

                {/* Ngày hiệu lực */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            <span className="text-red-500">*</span> Ngày hiệu lực
                        </label>
                        <input type="date" value={form.effectiveFrom} onChange={(e) => handleChange("effectiveFrom", e.target.value)} className={inputClass("effectiveFrom")} />
                        {errors.effectiveFrom && <p className="text-xs text-red-500">{errors.effectiveFrom}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Ngày hết hiệu lực</label>
                        <input type="date" value={form.effectiveTo} onChange={(e) => handleChange("effectiveTo", e.target.value)} className={inputClass("effectiveTo")} />
                        {errors.effectiveTo && <p className="text-xs text-red-500">{errors.effectiveTo}</p>}
                    </div>
                </div>

                {/* Khoảng phút + Giờ quy đổi */}
                <div className="grid grid-cols-3 gap-4">
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            <span className="text-red-500">*</span> Thời gian đi muộn, về sớm từ (phút)
                        </label>
                        <input type="number" min="0" placeholder="VD: 30" value={form.fromMinute} onChange={(e) => handleChange("fromMinute", e.target.value)} className={inputClass("fromMinute")} />
                        {errors.fromMinute && <p className="text-xs text-red-500">{errors.fromMinute}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            <span className="text-red-500">*</span> Thời gian đi muộn, về sớm đến (phút)
                        </label>
                        <input type="number" min="1" placeholder="VD: 60" value={form.toMinute} onChange={(e) => handleChange("toMinute", e.target.value)} className={inputClass("toMinute")} />
                        {errors.toMinute && <p className="text-xs text-red-500">{errors.toMinute}</p>}
                    </div>
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">
                            <span className="text-red-500">*</span> Số giờ quy đổi
                        </label>
                        <input type="number" min="0" step="0.5" placeholder="VD: 1" value={form.convertedHours} onChange={(e) => handleChange("convertedHours", e.target.value)} className={inputClass("convertedHours")} />
                        {errors.convertedHours && <p className="text-xs text-red-500">{errors.convertedHours}</p>}
                    </div>
                </div>

                {/* Ghi chú */}
                <div className="space-y-1.5">
                    <label className="text-sm font-medium text-slate-700">Ghi chú</label>
                    <textarea
                        value={form.note}
                        onChange={(e) => handleChange("note", e.target.value)}
                        placeholder="Nhập ghi chú"
                        rows={3}
                        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 resize-none"
                    />
                </div>

                {/* Trạng thái (edit only) */}
                {isEdit && (
                    <div className="space-y-1.5">
                        <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                        <select value={form.status} onChange={(e) => handleChange("status", e.target.value)} className="h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500">
                            <option value="ACTIVE">Hoạt động</option>
                            <option value="INACTIVE">Ngừng hoạt động</option>
                        </select>
                    </div>
                )}

                {/* Actions */}
                <div className="flex justify-end gap-3 pt-2 border-t border-slate-100">
                    <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
                    <Button onClick={handleSubmit} loading={loading}>{isEdit ? "Cập nhật" : "Lưu"}</Button>
                </div>
            </div>
        </Modal>
    );
}
