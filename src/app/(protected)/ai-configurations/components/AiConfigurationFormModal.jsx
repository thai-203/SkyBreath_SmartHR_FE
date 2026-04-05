"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";

export default function AiConfigurationFormModal({
    isOpen,
    onClose,
    onSubmit,
    formData,
    onFormChange,
    errors,
    loading,
    mode = "create",
}) {
    const isEdit = mode === "edit";

    const handleChange = (e) => {
        const { name, value } = e.target;
        onFormChange({ ...formData, [name]: value });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title={isEdit ? "Chỉnh sửa Cấu hình AI" : "Thêm mới Cấu hình AI"}
            size="md"
        >
            <div className="space-y-4">
                {/* Config Key */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Key định danh <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="configKey"
                        value={formData.configKey}
                        onChange={handleChange}
                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors 
                        ${errors.configKey ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-indigo-500"}`}
                        placeholder="Ví dụ: GEMINI_API_KEY"
                        disabled={isEdit}
                    />
                    {errors.configKey && (
                        <p className="text-xs text-red-500">{errors.configKey}</p>
                    )}
                </div>

                {/* AI Model */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Model AI <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        name="aiModel"
                        value={formData.aiModel || ""}
                        onChange={handleChange}
                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors 
                        ${errors.aiModel ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-indigo-500"}`}
                        placeholder="Ví dụ: gemini-2.5-flash"
                    />
                    {errors.aiModel && (
                        <p className="text-xs text-red-500">{errors.aiModel}</p>
                    )}
                </div>

                {/* Config Value */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">
                        Giá trị (Token) <span className="text-red-500">*</span>
                    </label>
                    <input
                        type={isEdit ? "password" : "text"}
                        name="configValue"
                        value={formData.configValue}
                        onChange={handleChange}
                        className={`w-full rounded-md border px-3 py-2 text-sm outline-none transition-colors 
                        ${errors.configValue ? "border-red-500 focus:border-red-500" : "border-slate-300 focus:border-indigo-500"}`}
                        placeholder="Nhập secret key hoặc token"
                    />
                    {errors.configValue && (
                        <p className="text-xs text-red-500">{errors.configValue}</p>
                    )}
                </div>

                {/* Description */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Mô tả</label>
                    <textarea
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={3}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors"
                        placeholder="Mô tả công dụng của key này..."
                    />
                </div>

                {/* Status */}
                <div className="space-y-1">
                    <label className="text-sm font-medium text-slate-700">Trạng thái</label>
                    <select
                        name="status"
                        value={formData.status}
                        onChange={handleChange}
                        className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm outline-none focus:border-indigo-500 transition-colors bg-white"
                    >
                        <option value="ACTIVE">Hoạt động (ACTIVE)</option>
                        <option value="INACTIVE">Khóa (INACTIVE)</option>
                    </select>
                </div>
            </div>

            <div className="mt-6 flex items-center justify-end gap-3 pt-4 border-t">
                <Button variant="outline" onClick={onClose} disabled={loading}>
                    Hủy
                </Button>
                <Button onClick={onSubmit} loading={loading}>
                    {isEdit ? "Lưu thay đổi" : "Tạo mới"}
                </Button>
            </div>
        </Modal>
    );
}
