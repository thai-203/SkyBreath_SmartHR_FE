"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { 
  User, Calendar, Briefcase, DollarSign, ShieldCheck, 
  FileText, Clock, Settings, Paperclip, Search, AlertCircle
} from "lucide-react";
import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Select } from "@/components/common/Select";
import { Label } from "@/components/common/Label";

// --- Constants ---
const CONTRACT_TYPES = [
  { value: "probation", label: "Thử việc" },
  { value: "fixed_6m", label: "Xác định thời hạn (6 tháng)" },
  { value: "fixed_12m", label: "Xác định thời hạn (12 tháng)" },
  { value: "fixed_24m", label: "Xác định thời hạn (24 tháng)" },
  { value: "permanent", label: "Hợp đồng vĩnh viễn" },
  { value: "seasonal", label: "Thời vụ / Cộng tác viên" },
];

const STATUS_OPTIONS = [
  { value: "active", label: "Đang hiệu lực" },
  { value: "expiring", label: "Sắp hết hạn" },
  { value: "expired", label: "Hết hạn" },
  { value: "terminated", label: "Đã chấm dứt" },
];

const WORK_MODELS = [
  { value: "fulltime", label: "Toàn thời gian" },
  { value: "parttime", label: "Bán thời gian" },
  { value: "remote", label: "Remote" },
  { value: "hybrid", label: "Hybrid" },
];

const PAYMENT_METHODS = [
  { value: "transfer", label: "Chuyển khoản" },
  { value: "cash", label: "Tiền mặt" },
];

export default function ContractFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  contractList = [],
  employeeList = [],
  loading,
  mode = "create",
}) {
  const [activeTab, setActiveTab] = useState("general");
  const [searchTerm, setSearchTerm] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [localErrors, setLocalErrors] = useState({});
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    if (isDropdownOpen) document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isDropdownOpen]);

  // --- Logic Xử lý Nhân viên ---
  const existingEmployeeIds = useMemo(() => {
    return new Set(contractList.map((item) => String((item.data || item).employeeId)));
  }, [contractList]);

  const filteredEmployees = useMemo(() => {
    return employeeList.filter((emp) => {
      const isAlreadyContracted = existingEmployeeIds.has(String(emp.value));
      const matchesSearch = emp.label.toLowerCase().includes(searchTerm.toLowerCase());
      if (mode === "create") return !isAlreadyContracted && matchesSearch;
      return matchesSearch;
    });
  }, [employeeList, existingEmployeeIds, searchTerm, mode]);

  // --- Handlers ---
  const handleInputChange = (field, value) => {
    onFormChange({ ...formData, [field]: value });
    if (localErrors[field]) {
      const newErrors = { ...localErrors };
      delete newErrors[field];
      setLocalErrors(newErrors);
    }
  };

  const handleSelectEmployee = (emp) => {
    handleInputChange("employeeId", emp.value);
    setSearchTerm(emp.label);
    setIsDropdownOpen(false);
  };

  // --- Validation ---
  const validateForm = () => {
    const errors = {};
    if (!formData.employeeId) errors.employeeId = "Bắt buộc chọn nhân viên";
    if (!formData.contractNumber) errors.contractNumber = "Mã hợp đồng bắt buộc";
    if (!formData.startDate) errors.startDate = "Ngày bắt đầu bắt buộc";
    if (!formData.baseSalary) errors.baseSalary = "Mức lương bắt buộc";

    // Check trùng mã hợp đồng
    const isDuplicate = contractList.some(item => {
        const c = item.data || item;
        if (mode === "edit" && String(c.id) === String(formData.id)) return false;
        return String(c.contractNumber).toLowerCase() === String(formData.contractNumber).toLowerCase();
    });
    if (isDuplicate) errors.contractNumber = "Mã hợp đồng này đã tồn tại";

    setLocalErrors(errors);
    if (Object.keys(errors).length > 0) {
        setActiveTab("general"); // Quay về tab đầu để hiện lỗi
        return false;
    }
    return true;
  };

  // --- Effects ---
  useEffect(() => {
    if (isOpen) {
      const emp = employeeList.find(e => String(e.value) === String(formData.employeeId));
      setSearchTerm(emp ? emp.label : "");
      setLocalErrors({});
      setActiveTab("general");
    }
    console.log("Form Data on Open:", formData);
  }, [isOpen, formData.employeeId, employeeList]);

  // --- Render Sections ---
  const renderGeneralInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
      <div className="space-y-1.5 relative" ref={dropdownRef}>
        <Label>Nhân viên <span className="text-red-500">*</span></Label>
        <div className="relative">
          <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm theo tên hoặc mã..."
            value={searchTerm}
            disabled={mode === "edit"}
            onChange={(e) => { setSearchTerm(e.target.value); setIsDropdownOpen(true); }}
            onFocus={() => setIsDropdownOpen(true)}
            className={`w-full rounded-lg border pl-10 pr-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 ${localErrors.employeeId ? 'border-red-500 bg-red-50/50' : 'border-slate-200'}`}
          />
          {isDropdownOpen && mode === "create" && (
            <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-48 overflow-y-auto">
              {filteredEmployees.length > 0 ? filteredEmployees.map(emp => (
                <div key={emp.value} onMouseDown={() => handleSelectEmployee(emp)} className="px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer flex items-center gap-2 border-b border-slate-50 last:border-none">
                  <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold">{emp.label.charAt(0)}</div>
                  <span>{emp.label}</span>
                </div>
              )) : <div className="px-4 py-3 text-sm text-slate-400 italic">Không tìm thấy nhân viên</div>}
            </div>
          )}
        </div>
        {localErrors.employeeId && <p className="text-[11px] text-red-500">{localErrors.employeeId}</p>}
      </div>

      <div className="space-y-1.5">
        <Label>Mã hợp đồng <span className="text-red-500">*</span></Label>
        <Input value={formData.contractNumber || ""} onChange={(e) => handleInputChange("contractNumber", e.target.value)} error={localErrors.contractNumber} />
      </div>

      <div className="space-y-1.5"><Label>Loại hợp đồng</Label><Select value={formData.contractType || "probation"} options={CONTRACT_TYPES} onChange={(e) => handleInputChange("contractType", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Trạng thái</Label><Select value={formData.contractStatus || "active"} options={STATUS_OPTIONS} onChange={(e) => handleInputChange("contractStatus", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Ngày ký</Label><Input type="date" value={formData.signedDate || ""} onChange={(e) => handleInputChange("signDate", e.target.value)} /></div>
      
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label>Ngày bắt đầu <span className="text-red-500">*</span></Label>
          <Input type="date" value={formData.startDate || ""} onChange={(e) => handleInputChange("startDate", e.target.value)} error={localErrors.startDate} />
        </div>
        <div className="space-y-1.5">
          <Label>Ngày kết thúc</Label>
          <Input type="date" value={formData.endDate || ""} onChange={(e) => handleInputChange("endDate", e.target.value)} />
        </div>
      </div>
    </div>
  );

  const renderWorkContent = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
      <div className="space-y-1.5"><Label>Vị trí / Chức danh</Label><Input value={formData.jobTitle || ""} onChange={(e) => handleInputChange("jobTitle", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Hình thức làm việc</Label><Select value={formData.workModel || "fulltime"} options={WORK_MODELS} onChange={(e) => handleInputChange("workModel", e.target.value)} /></div>
      <div className="space-y-1.5"><Label>Địa điểm / Chi nhánh</Label><Input value={formData.location || ""} onChange={(e) => handleInputChange("location", e.target.value)} /></div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5"><Label>Giờ làm/ngày</Label><Input type="number" value={formData.hoursPerDay || ""} onChange={(e) => handleInputChange("hoursPerDay", e.target.value)} /></div>
        <div className="space-y-1.5"><Label>Giờ làm/tuần</Label><Input type="number" value={formData.hoursPerWeek || ""} onChange={(e) => handleInputChange("hoursPerWeek", e.target.value)} /></div>
      </div>
      <div className="md:col-span-2 space-y-1.5">
        <Label>Mô tả công việc chính</Label>
        <textarea rows={4} value={formData.jobDescription || ""} onChange={(e) => handleInputChange("jobDescription", e.target.value)} className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" />
      </div>
    </div>
  );

  const renderSalaryInfo = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
      <div className="space-y-1.5">
        <Label>Lương cơ bản <span className="text-red-500">*</span></Label>
        <div className="relative">
          <Input type="number" value={formData.baseSalary || ""} onChange={(e) => handleInputChange("baseSalary", e.target.value)} error={localErrors.baseSalary} />
          <span className="absolute right-3 top-2.5 text-xs text-slate-400">VNĐ</span>
        </div>
      </div>
      <div className="space-y-1.5"><Label>Hình thức trả lương</Label><Select value={formData.paymentMethod || "transfer"} options={PAYMENT_METHODS} onChange={(e) => handleInputChange("paymentMethod", e.target.value)} /></div>
      
      <div className="md:col-span-2 bg-slate-50 p-4 rounded-xl space-y-4">
        <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-2"><DollarSign size={14}/> Các khoản phụ cấp & Thưởng</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="space-y-1.5"><Label className="text-[11px]">Ăn trưa</Label><Input type="number" value={formData.allowanceLunch || ""} onChange={(e) => handleInputChange("allowanceLunch", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[11px]">Xăng xe</Label><Input type="number" value={formData.allowanceTravel || ""} onChange={(e) => handleInputChange("allowanceTravel", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[11px]">Trách nhiệm</Label><Input type="number" value={formData.allowanceResponsibility || ""} onChange={(e) => handleInputChange("allowanceResponsibility", e.target.value)} /></div>
          <div className="space-y-1.5"><Label className="text-[11px]">Thưởng KPI</Label><Input type="number" value={formData.bonusKpi || ""} onChange={(e) => handleInputChange("bonusKpi", e.target.value)} /></div>
        </div>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "create" ? "Tạo hợp đồng lao động" : "Cập nhật hợp đồng"} size="2xl">
      <div className="flex flex-col md:flex-row gap-6 mt-4">
        {/* Sidebar Tabs */}
        <div className="w-full md:w-52 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:border-r border-slate-100 md:pr-4 pb-2 md:pb-0 scrollbar-hide">
          <TabBtn active={activeTab === "general"} onClick={() => setActiveTab("general")} icon={<FileText size={17}/>} label="Thông tin chung" />
          <TabBtn active={activeTab === "work"} onClick={() => setActiveTab("work")} icon={<Briefcase size={17}/>} label="Công việc" />
          <TabBtn active={activeTab === "salary"} onClick={() => setActiveTab("salary")} icon={<DollarSign size={17}/>} label="Lương & Phụ cấp" />
          <TabBtn active={activeTab === "insurance"} onClick={() => setActiveTab("insurance")} icon={<ShieldCheck size={17}/>} label="Bảo hiểm & Thuế" />
          <TabBtn active={activeTab === "terms"} onClick={() => setActiveTab("terms")} icon={<Clock size={17}/>} label="Điều khoản" />
          <TabBtn active={activeTab === "files"} onClick={() => setActiveTab("files")} icon={<Paperclip size={17}/>} label="Tệp đính kèm" />
        </div>

        {/* Content Area */}
        <div className="flex-1 min-h-[400px] max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {activeTab === "general" && renderGeneralInfo()}
          {activeTab === "work" && renderWorkContent()}
          {activeTab === "salary" && renderSalaryInfo()}
          
          {activeTab === "insurance" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 p-1">
              <div className="space-y-1.5"><Label>Mức đóng BHXH</Label><Input type="number" value={formData.insuranceAmount || ""} onChange={(e) => handleInputChange("insuranceAmount", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Mã số thuế TNCN</Label><Input value={formData.taxCode || ""} onChange={(e) => handleInputChange("taxCode", e.target.value)} /></div>
              <div className="space-y-1.5"><Label>Ngày bắt đầu đóng BH</Label><Input type="date" value={formData.insuranceStartDate || ""} onChange={(e) => handleInputChange("insuranceStartDate", e.target.value)} /></div>
            </div>
          )}

          {activeTab === "terms" && (
            <div className="space-y-5 p-1">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5"><Label>Thời gian thử việc</Label><Input placeholder="VD: 2 tháng" value={formData.probationPeriod || ""} onChange={(e) => handleInputChange("probationPeriod", e.target.value)} /></div>
                <div className="space-y-1.5"><Label>Thời hạn thông báo nghỉ</Label><Input placeholder="VD: 30 ngày" value={formData.noticePeriod || ""} onChange={(e) => handleInputChange("noticePeriod", e.target.value)} /></div>
              </div>
              <div className="space-y-1.5"><Label>Điều khoản bảo mật & Cam kết</Label><textarea rows={5} value={formData.termsAndConditions || ""} onChange={(e) => handleInputChange("termsAndConditions", e.target.value)} className="w-full rounded-lg border border-slate-200 p-3 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20" /></div>
            </div>
          )}

          {activeTab === "files" && (
            <div className="p-1 space-y-4">
               <div className="border-2 border-dashed border-slate-200 rounded-2xl p-10 text-center hover:bg-slate-50 transition-all cursor-pointer group">
                  <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                    <Paperclip className="text-slate-400 group-hover:text-indigo-600" />
                  </div>
                  <p className="text-sm font-semibold text-slate-700">Tải lên file hợp đồng hoặc phụ lục</p>
                  <p className="text-xs text-slate-400 mt-1">Chấp nhận PDF, Word hoặc Ảnh (Tối đa 10MB)</p>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-3 mt-8 pt-5 border-t border-slate-100">
        <Button variant="outline" onClick={onClose} disabled={loading}>Hủy</Button>
        <Button onClick={() => { if(validateForm()) onSubmit(); }} loading={loading} className="px-10 bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-200">
          {mode === "create" ? "Tạo hợp đồng" : "Cập nhật dữ liệu"}
        </Button>
      </div>
    </Modal>
  );
}

// Sub-component cho Tab Button
function TabBtn({ active, onClick, icon, label }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-[13px] font-semibold transition-all shrink-0 ${
        active 
        ? "bg-indigo-600 text-white shadow-md shadow-indigo-100" 
        : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
      }`}
    >
      {icon}
      <span className="whitespace-nowrap">{label}</span>
    </button>
  );
}