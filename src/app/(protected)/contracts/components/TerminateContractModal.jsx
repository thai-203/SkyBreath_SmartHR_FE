"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";

const terminationReasons = [
    { value: "resignation", label: "Từ chức" },
    { value: "termination", label: "Chấm dứt từ phía công ty" },
    { value: "mutual_agreement", label: "Thỏa thuận chung" },
    { value: "retirement", label: "Về hưu" },
    { value: "death", label: "Tử vong" },
    { value: "contract_end", label: "Hết hạn hợp đồng" },
];

export default function TerminateContractModal({
    isOpen,
    onClose,
    onSubmit,
    contract,
    formData,
    onFormChange,
    errors,
    loading,
}) {
    const handleInputChange = (field, value) => {
        onFormChange({
            ...formData,
            [field]: value,
        });
    };

    return (
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Chấm dứt hợp đồng"
            description={`Chấm dứt hợp đồng của nhân viên ${contract?.employee?.fullName || ""}`}
            size="lg"
        >
            <div className="space-y-4 mt-6">
                {/* Termination Date */}
                <div className="space-y-2">
                    <Label>Ngày chấm dứt *</Label>
                    <Input
                        type="date"
                        value={formData.terminationDate}
                        onChange={(e) => handleInputChange("terminationDate", e.target.value)}
                        error={errors.terminationDate}
                    />
                </div>

                {/* Reason */}
                <div className="space-y-2">
                    <Label>Lý do chấm dứt *</Label>
                    <Select
                        value={formData.reason}
                        onChange={(e) => handleInputChange("reason", e.target.value)}
                        options={terminationReasons}
                        error={errors.reason}
                    />
                </div>

                {/* Severance Pay */}
                <div className="space-y-2">
                    <Label>Tiền bồi thường</Label>
                    <Input
                        type="number"
                        placeholder="Nhập số tiền bồi thường"
                        value={formData.severancePay}
                        onChange={(e) => handleInputChange("severancePay", e.target.value)}
                        error={errors.severancePay}
                    />
                </div>

                {/* Notes */}
                <div className="space-y-2">
                    <Label>Ghi chú</Label>
                    <textarea
                        placeholder="Nhập ghi chú về chấm dứt hợp đồng"
                        value={formData.notes}
                        onChange={(e) => handleInputChange("notes", e.target.value)}
                        className="flex min-h-24 w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm transition-colors placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                    />
                </div>

                {/* Warning */}
                <div className="p-3 rounded-lg bg-yellow-50 border border-yellow-200">
                    <p className="text-sm text-yellow-800">
                        <strong>Cảnh báo:</strong> Hành động này sẽ đánh dấu hợp đồng là chấm dứt. Vui lòng kiểm tra lại thông tin trước khi xác nhận.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-slate-200">
                    <Button variant="outline" onClick={onClose} disabled={loading}>
                        Hủy
                    </Button>
                    <Button variant="destructive" onClick={onSubmit} loading={loading}>
                        Chấm dứt hợp đồng
                    </Button>
                </div>
            </div>
        </Modal>
    );
}
