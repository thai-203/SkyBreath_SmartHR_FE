"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";

const currentDate = new Date();

const monthOptions = Array.from({ length: 12 }, (_, i) => ({
    value: i + 1,
    label: `Tháng ${i + 1}`,
}));

const yearOptions = Array.from({ length: 5 }, (_, i) => {
    const y = currentDate.getFullYear() - 2 + i;
    return { value: y, label: `${y}` };
});

export default function CreatePayrollModal({ isOpen, onClose, onSubmit, loading }) {
    const [form, setForm] = useState({
        payrollMonth: currentDate.getMonth() + 1,
        payrollYear: currentDate.getFullYear(),
    });

    if (!isOpen) return null;

    const handleSubmit = (e) => {
        e.preventDefault();
        onSubmit(form);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
                    <div>
                        <h2 className="text-lg font-bold text-slate-900">Tạo bảng lương mới</h2>
                        <p className="text-xs text-slate-500 mt-0.5">Chọn kỳ lương để tạo</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition-colors">
                        <X className="h-4 w-4" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <Select
                            label="Tháng"
                            value={form.payrollMonth}
                            onChange={(e) => setForm({ ...form, payrollMonth: parseInt(e.target.value) })}
                            options={monthOptions}
                        />
                        <Select
                            label="Năm"
                            value={form.payrollYear}
                            onChange={(e) => setForm({ ...form, payrollYear: parseInt(e.target.value) })}
                            options={yearOptions}
                        />
                    </div>

                    <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                        <p className="text-xs text-amber-700">
                            💡 Sau khi tạo, bấm <strong>"Tính toán tự động"</strong> để hệ thống tính lương từ bảng chấm công và cơ cấu lương.
                        </p>
                    </div>

                    <div className="flex gap-3 pt-2">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
                            Hủy
                        </Button>
                        <Button type="submit" loading={loading} className="flex-1">
                            Tạo bảng lương
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
