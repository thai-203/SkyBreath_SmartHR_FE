import { useState, useEffect } from "react";
import { Modal } from "@/components/common/Modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ERROR_TYPE_LABELS } from "./AttendanceBlockingTable";

export function EditModal({ isOpen, onClose, onSave, editingRule, rulesList }) {
  const isEditing = !!editingRule;

  const [formErrorType, setFormErrorType] = useState("");
  const [formRuleName, setFormRuleName] = useState("");
  const [formMaxRetry, setFormMaxRetry] = useState(3);
  const [formBlockDuration, setFormBlockDuration] = useState(30);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formErrors, setFormErrors] = useState({});

  // Cập nhật giá trị form khi mở modal
  useEffect(() => {
    if (isOpen) {
      setFormErrorType(editingRule?.errorType || "");
      setFormRuleName(editingRule?.ruleName || "");
      setFormMaxRetry(editingRule?.maxRetryLimit || 3);
      setFormBlockDuration(editingRule?.blockDurationMinutes ?? 30);
      setFormIsActive(editingRule?.isActive ?? true);
      setFormErrors({});
    }
  }, [isOpen, editingRule]);

  const validate = () => {
    const errors = {};
    if (!formErrorType) errors.errorType = "Vui lòng chọn loại vi phạm";
    if (!formRuleName.trim()) errors.ruleName = "Tên quy tắc không được trống";
    if (!formMaxRetry || formMaxRetry < 1 || formMaxRetry > 10)
      errors.maxRetry = "Số lần thử phải từ 1 đến 10";
    if (formBlockDuration < 0)
      errors.blockDuration = "Thời gian khóa phải >= 0";

    if (formErrorType && (!isEditing || editingRule?.errorType !== formErrorType)) {
      const exists = rulesList?.some(
        (r) => r.errorType === formErrorType && r.id !== editingRule?.id
      );
      if (exists) {
        errors.errorType = "Loại vi phạm này đã tồn tại quy tắc.";
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSave = () => {
    if (!validate()) return;
    const payload = {
      ruleName: formRuleName.trim(),
      errorType: formErrorType,
      maxRetryLimit: formMaxRetry,
      blockDurationMinutes: formBlockDuration,
      isActive: formIsActive,
    };
    onSave(payload, editingRule?.id);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditing ? "Chỉnh sửa quy tắc" : "Thêm quy tắc mới"}
      description={
        isEditing
          ? "Cập nhật cấu hình chặn điểm danh."
          : "Thiết lập quy tắc bảo mật tự động chặn."
      }
      size="default"
    >
      <div className="space-y-4 py-2 mt-2">
        <div className="space-y-2">
          <Label>Loại vi phạm</Label>
          <Select
            value={formErrorType}
            onValueChange={(v) => {
              setFormErrorType(v);
              setFormErrors((e) => ({ ...e, errorType: "" }));
            }}
            disabled={isEditing}
          >
            <SelectTrigger>
              <SelectValue placeholder="Chọn loại vi phạm" />
            </SelectTrigger>
            <SelectContent>
              {Object.keys(ERROR_TYPE_LABELS).map((key) => (
                <SelectItem key={key} value={key}>
                  {ERROR_TYPE_LABELS[key]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {formErrors.errorType && <p className="text-xs text-destructive">{formErrors.errorType}</p>}
        </div>

        <div className="space-y-2">
          <Label>Tên quy tắc</Label>
          <Input
            placeholder="VD: Chặn sai khuôn mặt"
            value={formRuleName}
            onChange={(e) => {
              setFormRuleName(e.target.value);
              setFormErrors((err) => ({ ...err, ruleName: "" }));
            }}
          />
          {formErrors.ruleName && <p className="text-xs text-destructive">{formErrors.ruleName}</p>}
        </div>

        <div className="space-y-2">
          <Label>Số lần thử tối đa</Label>
          <Input
            type="number"
            min={1}
            max={10}
            value={formMaxRetry}
            onChange={(e) => {
              setFormMaxRetry(Number(e.target.value));
              setFormErrors((err) => ({ ...err, maxRetry: "" }));
            }}
          />
          <p className="text-xs text-muted-foreground">Số lần nhân viên được phép thử sai (1–10)</p>
          {formErrors.maxRetry && <p className="text-xs text-destructive">{formErrors.maxRetry}</p>}
        </div>

        <div className="space-y-2">
          <Label>Thời gian tạm khóa (phút)</Label>
          <Input
            type="number"
            min={0}
            value={formBlockDuration}
            onChange={(e) => {
              setFormBlockDuration(Number(e.target.value));
              setFormErrors((err) => ({ ...err, blockDuration: "" }));
            }}
          />
          <p className="text-xs text-muted-foreground">Nhập 0 = khóa vĩnh viễn</p>
          {formErrors.blockDuration && <p className="text-xs text-destructive">{formErrors.blockDuration}</p>}
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Kích hoạt ngay</p>
            <p className="text-xs text-muted-foreground">Áp dụng quy tắc này lập tức</p>
          </div>
          <Switch checked={formIsActive} onCheckedChange={setFormIsActive} />
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-6">
        <Button variant="outline" onClick={onClose}>
          Hủy
        </Button>
        <Button onClick={handleSave}>
          {isEditing ? "Cập nhật" : "Thêm quy tắc"}
        </Button>
      </div>
    </Modal>
  );
}