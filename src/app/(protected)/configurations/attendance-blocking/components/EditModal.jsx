"use client";

import { useState, useEffect, useMemo } from "react";
import { Modal } from "@/components/common/Modal";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/common/Checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ERROR_TYPE_LABELS } from "./AttendanceBlockingTable";
import { departmentsService, employeesService } from "@/services";
import { Users, Search, ChevronRight, ChevronDown } from "lucide-react";

function extractArray(res) {
  if (Array.isArray(res)) return res;
  if (Array.isArray(res?.data)) return res.data;
  if (Array.isArray(res?.data?.items)) return res.data.items;
  if (Array.isArray(res?.items)) return res.items;
  return [];
}

export function EditModal({ isOpen, onClose, onSave, editingRule, rulesList }) {
  const isEditing = !!editingRule;

  const [formErrorType, setFormErrorType] = useState("");
  const [formRuleName, setFormRuleName] = useState("");
  const [formMaxRetry, setFormMaxRetry] = useState(3);
  const [formBlockDuration, setFormBlockDuration] = useState(30);
  const [formIsActive, setFormIsActive] = useState(true);
  const [formApplyTo, setFormApplyTo] = useState("ALL");
  const [formTargetIds, setFormTargetIds] = useState([]);
  const [formErrors, setFormErrors] = useState({});

  // Scope data
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepts, setExpandedDepts] = useState({});

  // Load departments & employees when modal opens
  useEffect(() => {
    if (!isOpen) return;
    const load = async () => {
      try {
        setDataLoading(true);
        const [depsRes, empsRes] = await Promise.all([
          departmentsService.getAll(),
          employeesService.getAll({ limit: 1000 }),
        ]);
        setDepartments(extractArray(depsRes));
        setEmployees(extractArray(empsRes));
      } catch (err) {
        console.error("Failed to load departments/employees:", err);
        setDepartments([]);
        setEmployees([]);
      } finally {
        setDataLoading(false);
      }
    };
    load();
  }, [isOpen]);

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormErrorType(editingRule?.errorType || "");
      setFormRuleName(editingRule?.ruleName || "");
      setFormMaxRetry(editingRule?.maxRetryLimit || 3);
      setFormBlockDuration(editingRule?.blockDurationMinutes ?? 30);
      setFormIsActive(editingRule?.isActive ?? true);
      setFormApplyTo(editingRule?.applyTo || "ALL");
      setFormTargetIds((editingRule?.targetIds || []).map(Number));
      setFormErrors({});
      setSearchTerm("");
      setExpandedDepts({});
    }
  }, [isOpen, editingRule]);

  // ── Scope helpers ──────────────────────────────────────────────────────────
  const groupedEmployees = useMemo(() => {
    const groups = {};
    groups[0] = { name: "Chưa phân phòng ban", employees: [] };
    departments.forEach((dep) => {
      groups[dep.id] = { name: dep.departmentName, employees: [] };
    });
    employees.forEach((emp) => {
      const depId = emp.departmentId || 0;
      if (groups[depId]) groups[depId].employees.push(emp);
    });
    return groups;
  }, [departments, employees]);

  const filteredGroups = useMemo(() => {
    const filtered = {};
    Object.keys(groupedEmployees).forEach((deptId) => {
      const dept = groupedEmployees[deptId];
      const matching = dept.employees.filter(
        (emp) =>
          emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          dept.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      if (matching.length > 0) filtered[deptId] = { ...dept, employees: matching };
    });
    return filtered;
  }, [groupedEmployees, searchTerm]);

  const handleTargetToggle = (id) => {
    const idNum = Number(id);
    setFormTargetIds((prev) =>
      prev.includes(idNum) ? prev.filter((t) => t !== idNum) : [...prev, idNum]
    );
  };

  const handleDeptToggle = (deptId) => {
    const deptEmps = employees
      .filter((e) => Number(e.departmentId) === Number(deptId))
      .map((e) => Number(e.id));
    const allSelected = deptEmps.every((id) => formTargetIds.includes(id));
    if (allSelected) {
      setFormTargetIds((prev) => prev.filter((id) => !deptEmps.includes(id)));
    } else {
      setFormTargetIds((prev) => [...prev, ...deptEmps.filter((id) => !prev.includes(id))]);
    }
  };

  const toggleDeptExpand = (deptId) => {
    setExpandedDepts((prev) => ({ ...prev, [deptId]: !prev[deptId] }));
  };

  // ── Validation ─────────────────────────────────────────────────────────────
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
      if (exists) errors.errorType = "Loại vi phạm này đã tồn tại quy tắc.";
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
      applyTo: formApplyTo,
      targetIds: formApplyTo === "EMPLOYEE" ? formTargetIds : [],
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
        {/* Loại vi phạm */}
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
          {formErrors.errorType && (
            <p className="text-xs text-destructive">{formErrors.errorType}</p>
          )}
        </div>

        {/* Tên quy tắc */}
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
          {formErrors.ruleName && (
            <p className="text-xs text-destructive">{formErrors.ruleName}</p>
          )}
        </div>

        {/* Số lần thử */}
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
          <p className="text-xs text-muted-foreground">
            Số lần nhân viên được phép thử sai (1–10)
          </p>
          {formErrors.maxRetry && (
            <p className="text-xs text-destructive">{formErrors.maxRetry}</p>
          )}
        </div>

        {/* Thời gian khóa */}
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
          {formErrors.blockDuration && (
            <p className="text-xs text-destructive">{formErrors.blockDuration}</p>
          )}
        </div>

        {/* Phạm vi áp dụng */}
        <div className="space-y-2">
          <Label>Phạm vi áp dụng</Label>
          <Select
            value={formApplyTo}
            onValueChange={(v) => {
              setFormApplyTo(v);
              setFormTargetIds([]);
            }}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">Tất cả nhân viên</SelectItem>
              <SelectItem value="EMPLOYEE">Nhân viên cụ thể</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Employee selector */}
        {formApplyTo === "EMPLOYEE" && (
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Users className="w-4 h-4 text-slate-400" />
              Chọn nhân viên ({formTargetIds.length})
            </Label>

            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Tìm tên, mã nhân viên hoặc phòng ban..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9 h-9 text-sm"
              />
            </div>

            <div className="border rounded-lg p-2 bg-slate-50/50 max-h-[250px] overflow-y-auto space-y-1">
              {dataLoading ? (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  Đang tải dữ liệu...
                </p>
              ) : Object.keys(filteredGroups).length > 0 ? (
                Object.keys(filteredGroups)
                  .sort((a, b) => b - a)
                  .map((deptId) => {
                    const dept = filteredGroups[deptId];
                    const deptEmpIds = dept.employees.map((e) => Number(e.id));
                    const selectedCount = formTargetIds.filter((id) =>
                      deptEmpIds.includes(id)
                    ).length;
                    const allSelected =
                      deptEmpIds.length > 0 &&
                      selectedCount === deptEmpIds.length;
                    const isExpanded =
                      expandedDepts[deptId] || searchTerm.length > 0;

                    return (
                      <div
                        key={deptId}
                        className="border border-slate-200 rounded-md bg-white overflow-hidden"
                      >
                        <div className="flex items-center p-2 bg-slate-50/80 hover:bg-slate-100 transition-colors">
                          <div className="flex items-center gap-2 flex-1">
                            <button
                              type="button"
                              onClick={() => toggleDeptExpand(deptId)}
                              className="p-1 hover:bg-slate-200 rounded text-slate-500"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                            <Checkbox
                              id={`bc-dept-${deptId}`}
                              checked={allSelected}
                              onCheckedChange={() => handleDeptToggle(deptId)}
                            />
                            <label
                              htmlFor={`bc-dept-${deptId}`}
                              className="text-sm font-semibold cursor-pointer select-none flex-1"
                            >
                              {dept.name}
                              <span className="ml-2 text-xs font-normal text-slate-400">
                                ({selectedCount}/{dept.employees.length})
                              </span>
                            </label>
                          </div>
                        </div>

                        {isExpanded && (
                          <div className="p-1 pl-8 space-y-1 bg-white">
                            {dept.employees.map((emp) => (
                              <div
                                key={emp.id}
                                className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded transition-colors"
                              >
                                <Checkbox
                                  id={`bc-emp-${emp.id}`}
                                  checked={formTargetIds.includes(Number(emp.id))}
                                  onCheckedChange={() =>
                                    handleTargetToggle(emp.id)
                                  }
                                />
                                <label
                                  htmlFor={`bc-emp-${emp.id}`}
                                  className="text-sm font-medium leading-none cursor-pointer flex-1"
                                >
                                  {emp.fullName}{" "}
                                  <span className="text-slate-400 text-xs font-normal">
                                    - {emp.employeeCode}
                                  </span>
                                </label>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })
              ) : (
                <p className="text-xs text-slate-400 text-center py-4 italic">
                  Không tìm thấy nhân viên phù hợp
                </p>
              )}
            </div>
          </div>
        )}

        {/* Kích hoạt */}
        <div className="flex items-center justify-between rounded-lg border border-border/50 bg-background/50 p-3">
          <div>
            <p className="text-sm font-medium text-foreground">Kích hoạt ngay</p>
            <p className="text-xs text-muted-foreground">
              Áp dụng quy tắc này lập tức
            </p>
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