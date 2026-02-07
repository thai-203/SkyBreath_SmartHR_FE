"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  User, Briefcase, DollarSign, ShieldCheck, 
  FileText, Clock, Paperclip, AlertCircle, Landmark, Search, PenTool, Layers
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Label } from "@/components/common/Label";

export default function ContractFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  contractList = [],
  employeeList = [], 
  jobGradesList = [],    
  departmentsList = [],
  loading,
  mode = "create",
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [errors, setErrors] = useState({});
  const dropdownRef = useRef(null);

  const contractTypeLabels = {
  permanent: "Hợp đồng vĩnh viễn",
  temporary: "Hợp đồng tạm thời",
  seasonal: "Hợp đồng theo mùa",
  probation: "Hợp đồng thử việc",
};

  useEffect(() => {
    if (!isOpen) {
      setErrors({});
      setSearchTerm("");
    }
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  const existingEmployeeIds = useMemo(() => {
    return new Set(contractList.map((item) => String((item.data || item).employeeId)));
  }, [contractList]);

  const filteredEmployees = useMemo(() => {
    return employeeList.filter((emp) => {
      const isAlreadyContracted = existingEmployeeIds.has(String(emp.value));
      const employeeData = emp.data || {};
      const name = employeeData.fullName || emp.label || "";
      const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase());

      if (mode === "create") {
        return !isAlreadyContracted && matchesSearch;
      }
      return matchesSearch;
    });
  }, [employeeList, existingEmployeeIds, searchTerm, mode]);

  // Logic lọc Job Grades dựa trên phòng ban
  const filteredJobGrades = useMemo(() => {
    if (!formData.departmentId) return [];
    
    return jobGradesList.filter(grade => {
      // Truy cập vào grade.data.departmentId theo cấu trúc bạn gửi
      const deptIdInGrade = grade.data?.departmentId; 
      return String(deptIdInGrade) === String(formData.departmentId);
    });
  }, [jobGradesList, formData.departmentId]);

  useEffect(() => {
    if (isOpen) {
      const emp = employeeList.find(e => String(e.value) === String(formData.employeeId));
      setSearchTerm(emp ? emp.label : "");
      setActiveTab("general");
    }
  }, [isOpen, formData.employeeId, employeeList]);

  const validateForm = () => {
    const newErrors = {};
    if (!formData.employeeId) newErrors.employeeId = "Vui lòng chọn nhân viên";
    if (!formData.contractNumber?.trim()) {
      newErrors.contractNumber = "Mã hợp đồng không được để trống";
    } else {
      const isDuplicate = contractList.some(contract => {
        const cData = contract.data || contract;
        if (mode === "edit" && contract.id === formData.id) return false;
        return cData.contractNumber === formData.contractNumber?.trim();
      });
      if (isDuplicate) newErrors.contractNumber = "Mã hợp đồng này đã tồn tại trên hệ thống";
    }
    if (!formData.effectiveFrom) newErrors.effectiveFrom = "Vui lòng chọn ngày hiệu lực";
    if (!formData.baseSalary || Number(formData.baseSalary) <= 0) {
      newErrors.baseSalary = "Lương cơ bản phải lớn hơn 0";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleHandleSubmit = () => {
    if (validateForm()) {
      onSubmit();
    } else {
      if (errors.baseSalary) setActiveTab("salary");
    }
  };

  const handleInputChange = (field, value) => {
    let newData = { ...formData, [field]: value };
    
    if (field === "departmentId") {
      newData.jobGradeId = null;
    }

    onFormChange(newData);
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: null }));
    }
  };

  const handleSelectEmployee = (emp) => {
    const employeeData = emp.data || {};
    onFormChange({ 
      ...formData, 
      employeeId: emp.value,
      departmentId: employeeData.departmentId || formData.departmentId,
      jobGradeId: employeeData.jobGradeId || formData.jobGradeId,
    });
    setSearchTerm(emp.label);
    setIsDropdownOpen(false);
  };

  const selectedEmployeeData = useMemo(() => {
    const emp = employeeList.find(e => String(e.value) === String(formData.employeeId));
    return emp?.data || {};
  }, [employeeList, formData.employeeId]);

  const ErrorMsg = ({ name }) => errors[name] ? (
    <span className="text-[11px] text-red-500 mt-1 animate-in fade-in slide-in-from-top-1 font-medium italic">
      {errors[name]}
    </span>
  ) : null;

  const renderGeneralInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
      <div className="md:col-span-2 space-y-1.5 relative" ref={dropdownRef}>
        <Label className={errors.employeeId ? "text-red-600" : ""}>Nhân viên ký kết <span className="text-red-500">*</span></Label>
        <div className="relative">
          <User className={`absolute left-3 top-2.5 h-4 w-4 ${errors.employeeId ? "text-red-400" : "text-slate-400"}`} />
          <input
            type="text"
            placeholder={mode === "create" ? "Tìm nhân viên chưa có hợp đồng..." : "Tên nhân viên..."}
            value={searchTerm}
            disabled={mode === "edit"}
            onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
            onFocus={() => setIsDropdownOpen(true)}
            className={`w-full rounded-lg border pl-10 pr-3 py-2 text-sm outline-none transition-all ${
              errors.employeeId ? "border-red-500 bg-red-50 focus:ring-red-200" : "border-slate-200 focus:ring-indigo-500/20"
            } disabled:bg-slate-50`}
          />
          {isDropdownOpen && mode === "create" && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {filteredEmployees.length > 0 ? (
                filteredEmployees.map(emp => (
                  <div key={emp.value} onMouseDown={() => handleSelectEmployee(emp)} className="px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer flex items-center gap-2 border-b border-slate-50 last:border-none">
                    <span className="font-medium">{emp.label}</span>
                  </div>
                ))
              ) : (
                <div className="px-4 py-3 text-sm text-slate-400 italic text-center">Không tìm thấy nhân viên</div>
              )}
            </div>
          )}
        </div>
        <ErrorMsg name="employeeId" />
      </div>

      <div className="space-y-1.5">
        <Label className={errors.contractNumber ? "text-red-600" : ""}>Mã hợp đồng <span className="text-red-500">*</span></Label>
        <Input 
          placeholder="VD: HĐLĐ-2024-001"
          value={formData.contractNumber || ""} 
          onChange={(e) => handleInputChange("contractNumber", e.target.value)} 
          className={errors.contractNumber ? "border-red-500 bg-red-50" : ""}
        />
        <ErrorMsg name="contractNumber" />
      </div>

      <div className="space-y-1.5">
        <Label>Ngày ký kết</Label>
        <Input type="date" value={formData.signedDate || ""} onChange={(e) => handleInputChange("signedDate", e.target.value)} />
      </div>

      <div className="space-y-1.5">
        <Label>Phòng ban</Label>
        <Select 
          value={formData.departmentId || ""} 
          options={departmentsList}
          onChange={(e) => handleInputChange("departmentId", e.target.value)} 
        />
      </div>

      <div className="space-y-1.5">
        <Label>Ngạch lương (Job Grade)</Label>
        <Select 
          value={formData.jobGradeId || ""} 
          disabled={!formData.departmentId}
          options={filteredJobGrades}
          placeholder={formData.departmentId ? "Chọn ngạch lương" : "Chọn phòng ban trước"}
          onChange={(e) => handleInputChange("jobGradeId", e.target.value)} 
        />
      </div>

      <div className="space-y-1.5">
        <Label>Loại hợp đồng</Label>
        <Select
          value={formData.contractType ?? ""}
          options={Object.entries(contractTypeLabels).map(
            ([key, label]) => ({
              value: key,
              label: label,
            })
          )}
          onChange={(e) =>
            handleInputChange("contractType", e.target.value)
          }
        />
      </div>
      <div className="space-y-1.5">
        <Label className={errors.effectiveFrom ? "text-red-600" : ""}>Ngày hiệu lực <span className="text-red-500">*</span></Label>
        <Input 
          type="date" 
          value={formData.effectiveFrom || ""} 
          onChange={(e) => handleInputChange("effectiveFrom", e.target.value)}
          className={errors.effectiveFrom ? "border-red-500 bg-red-50" : ""}
        />
        <ErrorMsg name="effectiveFrom" />
      </div>

      <div className="space-y-1.5">
        <Label>Ngày hết hạn</Label>
        <Input type="date" value={formData.effectiveTo || ""} onChange={(e) => handleInputChange("effectiveTo", e.target.value)} />
      </div>
    </div>
  );

  const renderSalaryDetail = () => (
    <div className="space-y-6 p-1">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-1.5">
          <Label className={errors.baseSalary ? "text-red-600" : ""}>Lương cơ bản <span className="text-red-500">*</span></Label>
          <Input 
            type="number" 
            value={formData.baseSalary || ""} 
            onChange={(e) => handleInputChange("baseSalary", e.target.value)} 
            className={errors.baseSalary ? "border-red-500 bg-red-50" : ""}
          />
          <ErrorMsg name="baseSalary" />
        </div>
        <div className="space-y-1.5">
          <Label>Lương hiệu quả</Label>
          <Input type="number" value={formData.performanceSalary || ""} onChange={(e) => handleInputChange("performanceSalary", e.target.value)} />
        </div>
      </div>

      <div className="bg-slate-50 p-5 rounded-2xl space-y-4 border border-slate-100">
        <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
          <DollarSign size={14}/> Các khoản phụ cấp
        </h4>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5"><Label className="text-xs">Ăn trưa</Label><Input type="number" value={formData.lunchAllowance || ""} onChange={(e) => handleInputChange("lunchAllowance", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Xăng xe</Label><Input type="number" value={formData.fuelAllowance || ""} onChange={(e) => handleInputChange("fuelAllowance", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Điện thoại</Label><Input type="number" value={formData.phoneAllowance || ""} onChange={(e) => handleInputChange("phoneAllowance", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-xs">Khác</Label><Input type="number" value={formData.otherAllowance || ""} onChange={(e) => handleInputChange("otherAllowance", e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Tạo hợp đồng lương" : "Cập nhật thông tin lương"} size="2xl">
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        <div className="w-full md:w-48 shrink-0 flex md:flex-col gap-1 md:border-r border-slate-100 md:pr-4">
          <TabBtn active={activeTab === "general"} onClick={() => setActiveTab("general")} icon={<Briefcase size={17}/>} label="Hợp đồng" hasError={errors.employeeId || errors.contractNumber || errors.effectiveFrom} />
          <TabBtn active={activeTab === "salary"} onClick={() => setActiveTab("salary")} icon={<DollarSign size={17}/>} label="Lương & Phụ cấp" hasError={errors.baseSalary} />
          <TabBtn active={activeTab === "info"} onClick={() => setActiveTab("info")} icon={<Landmark size={17}/>} label="Thông tin thuế" />
        </div>

        <div className="flex-1 min-h-[420px] max-h-[65vh] overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === "general" && renderGeneralInfo()}
          {activeTab === "salary" && renderSalaryDetail()}
          {activeTab === "info" && (
            <div className="grid grid-cols-1 gap-4 opacity-70">
                <div className="space-y-1.5">
                  <Label>Email công ty</Label>
                  <Input value={selectedEmployeeData.companyEmail || "N/A"} readOnly />
                </div>
                <div className="space-y-1.5">
                  <Label>Mã số thuế</Label>
                  <Input value={selectedEmployeeData.taxCode || "N/A"} readOnly />
                </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
        <Button variant="outline" onClick={onClose} disabled={loading}>Hủy bỏ</Button>
        <Button onClick={handleHandleSubmit} loading={loading} className="px-10 bg-indigo-600 hover:bg-indigo-700">
          Lưu dữ liệu
        </Button>
      </div>
    </Modal>
  );
}

function TabBtn({ active, onClick, icon, label, hasError }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all relative ${
        active ? "bg-indigo-600 text-white shadow-md" : "text-slate-500 hover:bg-slate-50"
      }`}
    >
      {icon} 
      <span>{label}</span>
      {hasError && !active && (
        <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
      )}
    </button>
  );
}