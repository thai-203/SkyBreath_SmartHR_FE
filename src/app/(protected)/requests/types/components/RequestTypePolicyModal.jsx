"use client";

import { X, Settings2 } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/common/Button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TRACKING_CYCLE_LABELS, POLICY_UNIT_LABELS } from "@/constants/request.enum";

export default function RequestTypePolicyModal({
    isOpen, onClose, onSubmit, policyData, onPolicyChange, errors, typeName, submitting
}) {
    if (!isOpen) return null;

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        const finalValue = type === "checkbox" ? checked : value;
        onPolicyChange({ ...policyData, [name]: finalValue });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-md p-0 overflow-hidden bg-white border-none rounded-xl">
                <DialogHeader className="px-6 py-4 border-b bg-emerald-50 relative">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-500 text-white">
                            <Settings2 className="h-5 w-5" />
                        </div>
                        <div>
                            <DialogTitle className="text-lg font-bold text-slate-800">
                                Cấu hình Policy
                            </DialogTitle>
                            {typeName && (
                                <p className="text-xs text-slate-500 mt-0.5">{typeName}</p>
                            )}
                        </div>
                    </div>
                    <button onClick={onClose} className="absolute right-4 top-4 rounded-full p-1.5 hover:bg-emerald-100 text-slate-500 transition-colors">
                        <X className="h-5 w-5" />
                    </button>
                </DialogHeader>

                <div className="px-6 py-6 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label>Chu kỳ theo dõi</Label>
                            <select
                                name="trackingCycle"
                                value={policyData.trackingCycle}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            >
                                {Object.entries(TRACKING_CYCLE_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>

                        <div className="space-y-2">
                            <Label>Đơn vị tính</Label>
                            <select
                                name="unit"
                                value={policyData.unit}
                                onChange={handleChange}
                                className="flex h-10 w-full rounded-md border border-slate-300 bg-transparent px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
                            >
                                {Object.entries(POLICY_UNIT_LABELS).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label>
                            Số lượng tối đa ({POLICY_UNIT_LABELS[policyData.unit] || policyData.unit})
                            <span className="text-red-500 ml-1">*</span>
                        </Label>
                        <Input
                            type="number"
                            name="maxQuantity"
                            value={policyData.maxQuantity}
                            onChange={handleChange}
                            min={0}
                            placeholder="0"
                        />
                        {errors?.maxQuantity && (
                            <p className="text-sm font-medium text-red-500">{errors.maxQuantity}</p>
                        )}
                    </div>

                    <div className="bg-slate-50 rounded-lg p-3 border border-slate-200">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input
                                type="checkbox"
                                name="isWorkedTime"
                                checked={policyData.isWorkedTime}
                                onChange={handleChange}
                                className="h-5 w-5 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
                            />
                            <div>
                                <span className="font-medium text-slate-700 text-sm">Được Tính Công</span>
                                <p className="text-xs text-slate-500 mt-0.5">Thời gian nghỉ sẽ được tính vào công làm việc</p>
                            </div>
                        </label>
                    </div>
                </div>

                <DialogFooter className="px-6 py-4 border-t bg-slate-50 flex items-center justify-end space-x-3">
                    <Button variant="outline" onClick={onClose} disabled={submitting}>Hủy</Button>
                    <Button
                        onClick={onSubmit}
                        disabled={submitting}
                        className="bg-emerald-600 hover:bg-emerald-700 font-semibold"
                    >
                        {submitting ? "Đang lưu..." : "Lưu cấu hình"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
