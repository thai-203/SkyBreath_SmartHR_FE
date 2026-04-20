"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import {
  User,
  Briefcase,
  DollarSign,
  Landmark,
  X,
  Info,
  FileText,
  Upload,
  Paperclip,
  AlertCircle,
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Label } from "@/components/common/Label";

const SALARY_POLICY = {
  DEFAULT_KPI_RATIO: 0.2,
  MAX_KPI_RATIO: 0.5,
  LIMITS: {
    lunchAllowance: 1000000,
    fuelAllowance: 2000000,
    phoneAllowance: 1000000,
    otherAllowance: 5000000,
  },
};

export default function ContractFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  employeeList = [],
  jobGradesList = [],
  positionsList = [],
  departmentsList = [],
  loading,
  importing = false,
  onImportFile,
  mode = "create",
  selectedContract = null,
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const [importState, setImportState] = useState({
    fileName: "",
    warnings: [],
    employeeName: "",
  });
  const dropdownRef = useRef(null);
  const fileInputRef = useRef(null);
  const importInputRef = useRef(null);

  const contractTypeLabels = {
    probation: "Hợp đồng thử việc",
    internship: "Hợp đồng học việc",
    fixed_term: "Hợp đồng lao động có thời hạn",
    permanent: "Hợp đồng lao động không thời hạn",
  };

  const generalFields = [
    "employeeId",
    "contractNumber",
    "signedDate",
    "departmentId",
    "positionId",
    "jobGradeId",
    "contractType",
    "startDate",
    "endDate",
    "workingHours",
  ];
  const salaryFields = [
    "baseSalary",
    "performanceSalary",
    "lunchAllowance",
    "fuelAllowance",
    "phoneAllowance",
    "otherAllowance",
  ];

  // --- UTILS ---
  const formatCurrency = (val) => {
    if (val === undefined || val === null || val === "") return "";
    const number = Math.floor(Number(String(val).replace(/,/g, "")));
    if (isNaN(number)) return "";
    return number.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const parseCurrency = (val) => String(val).replace(/,/g, "");

  const calculateProbationEndDate = (startDate) => {
    if (!startDate) return "";
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + 2);
    return date.toISOString().split("T")[0];
  };

  const resetFormData = () => {
    onFormChange({
      employeeId: "",
      contractNumber: "",
      signedDate: "",
      departmentId: "",
      positionId: "",
      jobGradeId: "",
      contractType: "",
      startDate: "",
      endDate: "",
      workingHours: "40",
      baseSalary: "",
      performanceSalary: "",
      lunchAllowance: "",
      fuelAllowance: "",
      phoneAllowance: "",
      otherAllowance: "",
      note: "",
      attachments: [],
      employeeDisplayName: "",
      importSource: "",
    });
    setSearchTerm("");
    setErrors({});
  };

  // --- EFFECTS ---
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && selectedContract) {
        setSearchTerm(
          selectedContract.employee?.fullName ||
            selectedContract.employeeName ||
            "",
        );
      } else {
        const currentEmp = employeeList.find(
          (e) => String(e.value) === String(formData.employeeId),
        );
        setSearchTerm(formData.employeeDisplayName || currentEmp?.label || "");
      }

      setActiveTab("general");
    } else {
      setErrors({});
      setSearchTerm("");
      setImportState({ fileName: "", warnings: [], employeeName: "" });
    }
  }, [isOpen, formData.employeeId, employeeList, mode, selectedContract]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen)
      document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // --- MEMOIZED DATA ---
  const filteredEmployees = useMemo(() => {
    return employeeList.filter((emp) =>
      (emp.label || "").toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [employeeList, searchTerm]);

  const filteredJobGrades = useMemo(() => {
    return jobGradesList;
  }, [jobGradesList]);

  const selectedJobGradeData = useMemo(() => {
    const grade = jobGradesList.find(
      (g) => String(g.value) === String(formData.jobGradeId),
    );
    return grade?.data || null;
  }, [jobGradesList, formData.jobGradeId]);

  // --- HANDLERS ---
  const handleInputChange = (field, value) => {
    let newData = { ...formData, [field]: value };

    if (field === "departmentId") {
      newData.positionId = "";
    }

    if (field === "contractType") {
      if (value === "permanent") newData.endDate = "";
      if (value === "probation" && newData.startDate) {
        newData.endDate = calculateProbationEndDate(newData.startDate);
      }
    }

    if (field === "startDate" && newData.contractType === "probation") {
      newData.endDate = calculateProbationEndDate(value);
    }

    // Tự động tính Lương KPI dựa trên Lương cơ bản
    if (field === "baseSalary") {
      const base = Number(value) || 0;
      if (mode === "create" || !formData.performanceSalary) {
        newData.performanceSalary = Math.floor(
          base * SALARY_POLICY.DEFAULT_KPI_RATIO,
        ).toString();
      }
    }

    onFormChange(newData);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: null }));
  };

  const handleSelectEmployee = (emp) => {
    const empData = emp.data || {};

    const departmentId =
      empData.departmentId ||
      empData.department?.id ||
      empData.department?.value ||
      "";
    const positionId =
      empData.positionId ||
      empData.position?.id ||
      empData.position?.value ||
      "";
    const jobGradeId =
      empData.jobGradeId ||
      empData.jobGrade?.id ||
      empData.jobGrade?.value ||
      "";

    onFormChange({
      ...formData,
      employeeId: emp.value,
      employeeDisplayName: emp.label,
      importSource: "",
      departmentId,
      positionId,
      jobGradeId,
    });
    setSearchTerm(emp.label);
    setIsDropdownOpen(false);
    if (errors.employeeId) setErrors((prev) => ({ ...prev, employeeId: null }));
  };

  const handleMoneyInputChange = (field, value) => {
    const rawValue = parseCurrency(value);
    if (!isNaN(rawValue) || rawValue === "") {
      handleInputChange(field, rawValue);
    }
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    const currentFiles = formData.attachments || [];
    onFormChange({ ...formData, attachments: [...currentFiles, ...files] });
  };

  const handleImportChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || typeof onImportFile !== "function") {
      e.target.value = "";
      return;
    }

    try {
      const draft = await onImportFile(file);
      if (!draft) return;

      const toStringValue = (value, fallback = "") =>
        value === undefined || value === null || value === ""
          ? fallback
          : String(value);

      const nextData = {
        ...formData,
        employeeId: toStringValue(draft.employeeId),
        employeeDisplayName:
          draft.employeeName ||
          draft.employeeCode ||
          formData.employeeDisplayName ||
          "",
        importSource: "file",
        contractNumber: toStringValue(draft.contractNumber),
        contractType: draft.contractType || "fixed_term",
        signedDate: toStringValue(draft.signedDate),
        startDate: toStringValue(draft.startDate),
        endDate: toStringValue(draft.endDate),
        workingHours: toStringValue(draft.workingHours, "40"),
        departmentId: toStringValue(draft.departmentId),
        positionId: toStringValue(draft.positionId),
        jobGradeId: toStringValue(draft.jobGradeId),
        baseSalary: toStringValue(draft.baseSalary),
        performanceSalary: toStringValue(draft.performanceSalary),
        lunchAllowance: toStringValue(draft.lunchAllowance),
        fuelAllowance: toStringValue(draft.fuelAllowance),
        phoneAllowance: toStringValue(draft.phoneAllowance),
        otherAllowance: toStringValue(draft.otherAllowance),
        note: draft.note || "",
      };

      if (nextData.contractType === "permanent") {
        nextData.endDate = "";
      }
      if (nextData.contractType === "probation" && nextData.startDate) {
        nextData.endDate = calculateProbationEndDate(nextData.startDate);
      }

      onFormChange(nextData);
      setSearchTerm(draft.employeeName || draft.employeeCode || "");
      setImportState({
        fileName: draft.sourceFileName || file.name,
        warnings: Array.isArray(draft.warnings) ? draft.warnings : [],
        employeeName: draft.employeeName || draft.employeeCode || "",
      });
      setActiveTab("general");
      setErrors({});
    } catch (error) {
      setImportState({
        fileName: file.name,
        warnings: [],
        employeeName: "",
      });
      setErrors((prev) => ({
        ...prev,
        import:
          error.response?.data?.message ||
          error.message ||
          "Không thể import file",
      }));
    } finally {
      e.target.value = "";
    }
  };

  const removeFile = (index) => {
    const updatedFiles = formData.attachments.filter((_, i) => i !== index);
    onFormChange({ ...formData, attachments: updatedFiles });
  };

  // --- VALIDATION ---
  const validateForm = () => {
    const newErrors = {};
    const baseSal = Number(formData.baseSalary) || 0;
    const perfSal = Number(formData.performanceSalary) || 0;

    // General Validation
    if (!formData.employeeId) newErrors.employeeId = "Chọn nhân viên";
    if (!formData.contractNumber?.trim())
      newErrors.contractNumber = "Nhập mã hợp đồng";
    if (!formData.signedDate) newErrors.signedDate = "Chọn ngày ký";
    if (!formData.departmentId) newErrors.departmentId = "Chọn phòng ban";
    if (!formData.positionId) newErrors.positionId = "Chọn vị trí";
    if (!formData.jobGradeId) newErrors.jobGradeId = "Chọn ngạch lương";
    if (!formData.contractType) newErrors.contractType = "Chọn loại hợp đồng";
    if (!formData.startDate) newErrors.startDate = "Chọn ngày bắt đầu";

    if (formData.contractType !== "permanent" && !formData.endDate) {
      newErrors.endDate = "Chọn ngày kết thúc";
    }

    // date order validations
    if (formData.signedDate && formData.startDate) {
      const signed = new Date(formData.signedDate);
      const start = new Date(formData.startDate);
      if (signed > start) {
        newErrors.signedDate = "Ngày ký không thể sau ngày bắt đầu";
      }
    }
    if (formData.endDate && formData.startDate) {
      const end = new Date(formData.endDate);
      const start = new Date(formData.startDate);
      if (end <= start) {
        newErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

    // Working Hours
    const wHours = Number(formData.workingHours);
    if (!formData.workingHours) {
      newErrors.workingHours = "Nhập thời giờ làm việc";
    } else if (wHours <= 0 || wHours > 168) {
      newErrors.workingHours = "Thời giờ không hợp lệ (1-168h)";
    }

    // Salary Logic & KPI Ratio
    if (baseSal <= 0) {
      newErrors.baseSalary = "Lương phải > 0";
    } else if (selectedJobGradeData) {
      const min = Number(selectedJobGradeData.minSalary);
      const max = Number(selectedJobGradeData.maxSalary);
      if (baseSal < min || baseSal > max) {
        newErrors.baseSalary = `Ngoài dải (${formatCurrency(min)} - ${formatCurrency(max)})`;
      }
    }

    if (perfSal > baseSal * SALARY_POLICY.MAX_KPI_RATIO) {
      newErrors.performanceSalary = `KPI không quá 50% lương chính (${formatCurrency(baseSal * 0.5)})`;
    }

    // Allowance Limits Validation
    Object.keys(SALARY_POLICY.LIMITS).forEach((key) => {
      if (Number(formData[key]) > SALARY_POLICY.LIMITS[key]) {
        newErrors[key] =
          `Vượt định mức (${formatCurrency(SALARY_POLICY.LIMITS[key])})`;
      }
    });

    setErrors(newErrors);
    return newErrors;
  };

  const handleHandleSubmit = () => {
    const currentErrors = validateForm();
    if (Object.keys(currentErrors).length === 0) {
      onSubmit();
    } else {
      const hasGeneralErr = generalFields.some((k) => !!currentErrors[k]);
      setActiveTab(hasGeneralErr ? "general" : "salary");
    }
  };

  const ErrorMsg = ({ name }) =>
    errors[name] ? (
      <span className="text-[10px] text-red-500 font-medium italic flex items-center gap-1 mt-1">
        <AlertCircle size={10} /> {errors[name]}
      </span>
    ) : null;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={mode === "create" ? "Tạo hợp đồng mới" : "Cập nhật hợp đồng"}
      size="3xl"
    >
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-56 shrink-0 flex md:flex-col gap-1.5 md:border-r border-slate-100 md:pr-4">
          <TabBtn
            active={activeTab === "general"}
            onClick={() => setActiveTab("general")}
            icon={<Briefcase size={17} />}
            label="Thông tin chung"
            hasError={generalFields.some((k) => errors[k])}
          />
          <TabBtn
            active={activeTab === "salary"}
            onClick={() => setActiveTab("salary")}
            icon={<DollarSign size={17} />}
            label="Lương & Phụ cấp"
            hasError={salaryFields.some((k) => errors[k])}
          />
          <TabBtn
            active={activeTab === "attachment"}
            onClick={() => setActiveTab("attachment")}
            icon={<FileText size={17} />}
            label="Bản cứng đính kèm"
          />
          <TabBtn
            active={activeTab === "info"}
            onClick={() => setActiveTab("info")}
            icon={<Landmark size={17} />}
            label="Ghi chú thêm"
          />
        </div>

        {/* Form Content */}
        <div className="flex-1 min-h-[480px] pr-2">
          {mode === "create" && (
            <div className="mb-4 rounded-2xl border border-indigo-100 bg-indigo-50/60 p-4">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div>
                  <div className="text-sm font-semibold text-indigo-900">
                    Import hợp đồng từ file
                  </div>
                  <div className="text-xs text-indigo-700/80 mt-1">
                    Hỗ trợ ảnh, PDF, .docx và .doc theo cơ chế trích xuất
                    best-effort.
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    ref={importInputRef}
                    type="file"
                    accept=".png,.jpg,.jpeg,.webp,.pdf,.doc,.docx,.txt"
                    className="hidden"
                    onChange={handleImportChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => importInputRef.current?.click()}
                    disabled={importing || loading}
                    loading={importing}
                    className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    Chọn file để import
                  </Button>
                </div>
              </div>

              {(importState.fileName || errors.import) && (
                <div className="mt-3 space-y-2 rounded-xl bg-white/70 border border-indigo-100 p-3 text-xs text-slate-600">
                  {importState.fileName && (
                    <div>
                      File đã xử lý:{" "}
                      <span className="font-semibold">
                        {importState.fileName}
                      </span>
                    </div>
                  )}
                  {importState.employeeName && (
                    <div>
                      Nhân viên gợi ý:{" "}
                      <span className="font-semibold">
                        {importState.employeeName}
                      </span>
                    </div>
                  )}
                  {Array.isArray(importState.warnings) &&
                    importState.warnings.length > 0 && (
                      <ul className="space-y-1 text-amber-700">
                        {importState.warnings.map((warning, index) => (
                          <li key={`${warning}-${index}`}>• {warning}</li>
                        ))}
                      </ul>
                    )}
                  {errors.import && (
                    <div className="text-red-600">{errors.import}</div>
                  )}
                </div>
              )}
            </div>
          )}

          {activeTab === "general" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-1">
              <div
                className="md:col-span-2 space-y-1 relative"
                ref={dropdownRef}
              >
                <Label>
                  Nhân viên ký kết <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Tìm tên nhân viên..."
                    value={searchTerm}
                    disabled={mode === "edit"}
                    onChange={(e) => {
                      setSearchTerm(e.target.value);
                      setIsDropdownOpen(true);
                      if (!e.target.value) {
                        resetFormData();
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className={`w-full rounded-lg border pl-10 pr-10 py-2 text-sm outline-none transition-all ${
                      errors.employeeId
                        ? "border-red-500 bg-red-50"
                        : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                    }`}
                  />
                  {searchTerm && mode === "create" && (
                    <button
                      onClick={resetFormData}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-red-500"
                    >
                      <X size={16} />
                    </button>
                  )}
                  {isDropdownOpen && mode === "create" && (
                    <div className="absolute z-50 w-full mt-1 bg-white border rounded-xl shadow-xl max-h-48 overflow-y-auto border-slate-100">
                      {filteredEmployees.length > 0 ? (
                        filteredEmployees.map((emp) => (
                          <div
                            key={emp.value}
                            onMouseDown={() => handleSelectEmployee(emp)}
                            className="px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-none font-medium text-slate-700"
                          >
                            {emp.label}
                          </div>
                        ))
                      ) : (
                        <div className="px-4 py-3 text-sm text-slate-400 italic text-center">
                          Không có dữ liệu
                        </div>
                      )}
                    </div>
                  )}
                </div>
                <ErrorMsg name="employeeId" />
              </div>

              <div className="space-y-1">
                <Label>
                  Mã hợp đồng <span className="text-red-500">*</span>
                </Label>
                <Input
                  value={formData.contractNumber || ""}
                  onChange={(e) =>
                    handleInputChange("contractNumber", e.target.value)
                  }
                  placeholder="HĐLĐ/2024/001"
                  className={errors.contractNumber ? "border-red-500" : ""}
                  disabled={mode === "edit"}
                />
                <ErrorMsg name="contractNumber" />
              </div>

              <div className="space-y-1">
                <Label>
                  Ngày ký kết <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.signedDate || ""}
                  onChange={(e) =>
                    handleInputChange("signedDate", e.target.value)
                  }
                  className={errors.signedDate ? "border-red-500" : ""}
                />
                <ErrorMsg name="signedDate" />
              </div>

              <div className="space-y-1">
                <Label>
                  Phòng ban <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.departmentId || ""}
                  options={departmentsList}
                  onChange={(e) =>
                    handleInputChange("departmentId", e.target.value)
                  }
                  className={errors.departmentId ? "border-red-500" : ""}
                />
                <ErrorMsg name="departmentId" />
              </div>

              <div className="space-y-1">
                <Label>
                  Vị trí công việc <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.positionId || ""}
                  disabled={!formData.departmentId}
                  options={positionsList}
                  onChange={(e) =>
                    handleInputChange("positionId", e.target.value)
                  }
                  className={errors.positionId ? "border-red-500" : ""}
                />
                <ErrorMsg name="positionId" />
              </div>

              <div className="space-y-1">
                <Label>
                  Ngạch lương <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.jobGradeId || ""}
                  options={filteredJobGrades}
                  onChange={(e) =>
                    handleInputChange("jobGradeId", e.target.value)
                  }
                  className={errors.jobGradeId ? "border-red-500" : ""}
                />
                <ErrorMsg name="jobGradeId" />
              </div>

              <div className="space-y-1">
                <Label>
                  Loại hợp đồng <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.contractType || ""}
                  options={Object.entries(contractTypeLabels).map(([v, l]) => ({
                    value: v,
                    label: l,
                  }))}
                  onChange={(e) =>
                    handleInputChange("contractType", e.target.value)
                  }
                  className={errors.contractType ? "border-red-500" : ""}
                />
                <ErrorMsg name="contractType" />
              </div>

              <div className="space-y-1">
                <Label>
                  Ngày hiệu lực <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) =>
                    handleInputChange("startDate", e.target.value)
                  }
                  className={errors.startDate ? "border-red-500" : ""}
                />
                <ErrorMsg name="startDate" />
              </div>

              <div
                className={`space-y-1 ${formData.contractType === "permanent" ? "opacity-50" : ""}`}
              >
                <Label>
                  Ngày kết thúc{" "}
                  {formData.contractType !== "permanent" && (
                    <span className="text-red-500">*</span>
                  )}
                </Label>
                <Input
                  type="date"
                  value={formData.endDate || ""}
                  disabled={formData.contractType === "permanent"}
                  onChange={(e) => handleInputChange("endDate", e.target.value)}
                  className={errors.endDate ? "border-red-500" : ""}
                />
                <ErrorMsg name="endDate" />
              </div>

              <div className="space-y-1">
                <Label>
                  Thời giờ làm việc (giờ/tuần){" "}
                  <span className="text-red-500">*</span>
                </Label>
                <Input
                  type="number"
                  min="0"
                  max="168"
                  value={formData.workingHours || ""}
                  onChange={(e) =>
                    handleInputChange("workingHours", e.target.value)
                  }
                  placeholder="Ví dụ: 40"
                  className={errors.workingHours ? "border-red-500" : ""}
                />
                <ErrorMsg name="workingHours" />
              </div>
            </div>
          )}

          {activeTab === "salary" && (
            <div className="space-y-6 p-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lương cơ bản */}
                <div className="space-y-1">
                  <Label>
                    Lương cơ bản <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrency(formData.baseSalary)}
                      onChange={(e) =>
                        handleMoneyInputChange("baseSalary", e.target.value)
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none transition-all pr-12 ${
                        errors.baseSalary
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      }`}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-[10px] font-bold">
                      VNĐ
                    </span>
                  </div>
                  {selectedJobGradeData && (
                    <div className="flex items-center gap-1.5 text-[10px] text-indigo-600 font-semibold bg-indigo-50/50 p-2 rounded-lg mt-1 border border-indigo-100">
                      <Info size={12} /> Dải lương:{" "}
                      {formatCurrency(selectedJobGradeData.minSalary)} -{" "}
                      {formatCurrency(selectedJobGradeData.maxSalary)}
                    </div>
                  )}
                  <ErrorMsg name="baseSalary" />
                </div>

                {/* Lương KPI */}
                <div className="space-y-1">
                  <Label>Lương hiệu quả (KPI)</Label>
                  <div className="relative">
                    <input
                      type="text"
                      value={formatCurrency(formData.performanceSalary)}
                      onChange={(e) =>
                        handleMoneyInputChange(
                          "performanceSalary",
                          e.target.value,
                        )
                      }
                      className={`w-full rounded-lg border px-3 py-2 text-sm outline-none pr-12 transition-all ${
                        errors.performanceSalary
                          ? "border-red-500 bg-red-50"
                          : "border-slate-200 focus:ring-2 focus:ring-indigo-500/20"
                      }`}
                      placeholder="0"
                    />
                    <span className="absolute right-3 top-2 text-slate-400 text-[10px] font-bold">
                      VNĐ
                    </span>
                  </div>
                  {Number(formData.baseSalary) > 0 &&
                    !errors.performanceSalary && (
                      <p className="text-[10px] text-slate-400 italic mt-1">
                        Tỷ lệ:{" "}
                        {Math.round(
                          (Number(formData.performanceSalary) /
                            Number(formData.baseSalary)) *
                            100,
                        ) || 0}
                        % lương chính
                      </p>
                    )}
                  <ErrorMsg name="performanceSalary" />
                </div>
              </div>

              {/* Phụ cấp có định mức */}
              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 space-y-4">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
                  <div className="w-1 h-3 bg-indigo-500 rounded-full" /> Các
                  khoản phụ cấp
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { id: "lunchAllowance", label: "Ăn trưa" },
                    { id: "fuelAllowance", label: "Xăng xe" },
                    { id: "phoneAllowance", label: "Điện thoại" },
                    { id: "otherAllowance", label: "Khác" },
                  ].map((item) => (
                    <div key={item.id} className="space-y-1">
                      <Label className="text-xs text-slate-500">
                        {item.label}
                      </Label>
                      <input
                        type="text"
                        value={formatCurrency(formData[item.id])}
                        onChange={(e) =>
                          handleMoneyInputChange(item.id, e.target.value)
                        }
                        className={`w-full rounded-md border px-3 py-1.5 text-sm outline-none transition-colors ${
                          errors[item.id]
                            ? "border-red-500 bg-red-50"
                            : "border-slate-200 focus:bg-white focus:ring-1 focus:ring-indigo-500/20"
                        }`}
                        placeholder={`Max: ${formatCurrency(SALARY_POLICY.LIMITS[item.id])}`}
                      />
                      <ErrorMsg name={item.id} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "attachment" && (
            <div className="space-y-4 p-1">
              <div
                onClick={() => fileInputRef.current.click()}
                className="border-2 border-dashed border-slate-200 rounded-2xl p-10 flex flex-col items-center justify-center hover:border-indigo-400 hover:bg-indigo-50/50 cursor-pointer transition-all group"
              >
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-inner">
                  <Upload size={24} />
                </div>
                <p className="text-sm font-bold text-slate-700">
                  Tải lên bản cứng hợp đồng
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  Kéo thả file hoặc nhấn để chọn (PDF, PNG, JPG)
                </p>
              </div>
              <div className="grid grid-cols-1 gap-2 mt-4">
                {formData.attachments?.map((file, idx) => {
                  const isExistingFile = typeof file === "string";
                  const fileName = isExistingFile
                    ? file.split("/").pop()
                    : file.name;
                  return (
                    <div
                      key={idx}
                      className="flex items-center justify-between p-3 bg-white border border-slate-100 rounded-xl hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`p-2 rounded-lg ${isExistingFile ? "bg-green-50 text-green-600" : "bg-indigo-50 text-indigo-500"}`}
                        >
                          <Paperclip size={16} />
                        </div>
                        <div className="flex flex-col">
                          <span className="text-sm font-medium text-slate-700 truncate max-w-[250px]">
                            {fileName}
                          </span>
                          <span className="text-[10px] text-slate-400">
                            {isExistingFile
                              ? "Đã lưu trên Server"
                              : `${(file.size / 1024).toFixed(1)} KB`}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFile(idx)}
                        className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg"
                      >
                        <X size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {activeTab === "info" && (
            <div className="space-y-4 p-1">
              <div className="space-y-1">
                <Label>Ghi chú hợp đồng</Label>
                <textarea
                  className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[200px] transition-all bg-slate-50/30"
                  value={formData.note || ""}
                  onChange={(e) => handleInputChange("note", e.target.value)}
                  placeholder="Nhập các điều khoản bổ sung..."
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="border-slate-200 text-slate-600"
        >
          Hủy bỏ
        </Button>
        <Button
          onClick={handleHandleSubmit}
          loading={loading}
          className="px-10 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-100"
        >
          {mode === "create" ? "Tạo hợp đồng" : "Lưu thay đổi"}
        </Button>
      </div>
    </Modal>
  );
}

function TabBtn({ active, onClick, icon, label, hasError }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[13px] font-semibold transition-all relative ${
        active
          ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200"
          : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {icon} <span>{label}</span>
      {hasError && !active && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border border-white animate-pulse" />
      )}
    </button>
  );
}
