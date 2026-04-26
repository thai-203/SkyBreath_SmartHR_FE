"use client";

import { useState, useEffect, useMemo } from "react";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/common/Card";
import { Switch } from "@/components/ui/switch";
import { AllowedIpList } from "./AllowedIpList";
import { motion } from "framer-motion";
import LocationMapPicker from "./LocationMapPicker";
import { Select } from "@/components/common/Select";
import { Checkbox } from "@/components/common/Checkbox";
import { departmentsService, employeesService } from "@/services";
import { Users, Building2, Globe, Search as SearchIcon, ChevronRight, ChevronDown } from "lucide-react";

export default function AttendanceSecurityConfigForm({
  config,
  onConfigChange,
  loading,
  errors = {},
  allowedIps = [],
  onAllowedIpCreate,
  onAllowedIpDelete,
  currentIp,
  allowedIpsLoading = false,
  itemVariants,
}) {
  // Trạng thái lưu trữ lỗi cục bộ để validate real-time
  const [localErrors, setLocalErrors] = useState({});
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedDepartments, setExpandedDepartments] = useState({});

  useEffect(() => {
    const loadData = async () => {
      try {
        setDataLoading(true);
        const [depsRes, empsRes] = await Promise.all([
          departmentsService.getAll(),
          employeesService.getAll({ limit: 1000 }),
        ]);

        // Xử lý dữ liệu trả về linh hoạt (hỗ trợ các cấu trúc: [], {data: []}, {data: {items: []}})
        const extractArray = (res) => {
          if (Array.isArray(res)) return res;
          if (Array.isArray(res?.data)) return res.data;
          if (Array.isArray(res?.data?.items)) return res.data.items;
          if (Array.isArray(res?.items)) return res.items;
          return [];
        };

        setDepartments(extractArray(depsRes));
        setEmployees(extractArray(empsRes));
      } catch (error) {
        console.error("Failed to load departments/employees:", error);
        setDepartments([]);
        setEmployees([]);
      } finally {
        setDataLoading(false);
      }
    };
    loadData();
  }, []);

  // Đồng bộ lỗi từ component cha (nếu có lúc submit)
  useEffect(() => {
    setLocalErrors((prev) => ({ ...prev, ...errors }));
  }, [errors]);

  // Logic validate dữ liệu
  const validateField = (field, value, currentConfig) => {
    let errorMsg = null;
    if (currentConfig.requireLocationCheck) {
      if (field === "officeLatitude") {
        if (value === null || value === "") errorMsg = "Vui lòng nhập vĩ độ";
        else if (value < -90 || value > 90)
          errorMsg = "Vĩ độ phải từ -90 đến 90";
      }
      if (field === "officeLongitude") {
        if (value === null || value === "") errorMsg = "Vui lòng nhập kinh độ";
        else if (value < -180 || value > 180)
          errorMsg = "Kinh độ phải từ -180 đến 180";
      }
      if (field === "locationRadiusMeters") {
        if (value === null || value === "") errorMsg = "Vui lòng nhập bán kính";
        else if (value < 1) errorMsg = "Bán kính phải lớn hơn 0m";
      }
    }
    return errorMsg;
  };

  const handleChange = (field, value) => {
    const nextConfig = { ...config, [field]: value };
    onConfigChange(nextConfig);
    console.log(nextConfig);
    

    // Validate field hiện tại
    const errorMsg = validateField(field, value, nextConfig);

    // Nếu thay đổi trạng thái bật/tắt vị trí, cần validate/xóa lỗi các trường liên quan
    if (field === "requireLocationCheck") {
      setLocalErrors({
        ...localErrors,
        [field]: errorMsg,
        officeLatitude: validateField(
          "officeLatitude",
          nextConfig.officeLatitude,
          nextConfig,
        ),
        officeLongitude: validateField(
          "officeLongitude",
          nextConfig.officeLongitude,
          nextConfig,
        ),
        locationRadiusMeters: validateField(
          "locationRadiusMeters",
          nextConfig.locationRadiusMeters,
          nextConfig,
        ),
      });
    } else {
      setLocalErrors((prev) => ({ ...prev, [field]: errorMsg }));
    }
  };

  const handleNumberChange = (field, value) => {
    const numValue = value === "" ? null : parseFloat(value);
    handleChange(field, numValue);
  };

  const handleTargetToggle = (id) => {
    const currentTargets = (config.targetIds || []).map(Number);
    const idNum = Number(id);
    let nextTargets;
    if (currentTargets.includes(idNum)) {
      nextTargets = currentTargets.filter((t) => t !== idNum);
    } else {
      nextTargets = [...currentTargets, idNum];
    }
    handleChange("targetIds", nextTargets);
  };

  const handleDepartmentToggle = (departmentId) => {
    const deptEmployees = employees.filter(emp => Number(emp.departmentId) === Number(departmentId));
    const deptEmpIds = deptEmployees.map(emp => Number(emp.id));
    const currentTargets = (config.targetIds || []).map(Number);
    
    // Check if all employees in this dept are already selected
    const allSelected = deptEmpIds.every(id => currentTargets.includes(id));
    
    let nextTargets;
    if (allSelected) {
      // Remove all employees of this department
      nextTargets = currentTargets.filter(id => !deptEmpIds.includes(id));
    } else {
      // Add all missing employees of this department
      const newIds = deptEmpIds.filter(id => !currentTargets.includes(id));
      nextTargets = [...currentTargets, ...newIds];
    }
    handleChange("targetIds", nextTargets);
  };

  const toggleDeptExpand = (deptId) => {
    setExpandedDepartments(prev => ({
      ...prev,
      [deptId]: !prev[deptId]
    }));
  };

  const groupedEmployees = useMemo(() => {
    const groups = {};
    // Add "No Department" group
    groups[0] = { name: "Chưa phân phòng ban", employees: [] };
    
    departments.forEach(dep => {
      groups[dep.id] = { name: dep.departmentName, employees: [] };
    });

    employees.forEach(emp => {
      const depId = emp.departmentId || 0;
      if (groups[depId]) {
        groups[depId].employees.push(emp);
      }
    });

    return groups;
  }, [departments, employees]);

  const filteredGroups = useMemo(() => {
    const filtered = {};
    Object.keys(groupedEmployees).forEach(deptId => {
      const dept = groupedEmployees[deptId];
      const matchingEmps = dept.employees.filter(emp => 
        emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        dept.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      
      if (matchingEmps.length > 0) {
        filtered[deptId] = { ...dept, employees: matchingEmps };
      }
    });
    return filtered;
  }, [groupedEmployees, searchTerm]);

  const filteredDepartments = (departments || []).filter((dep) =>
    dep.departmentName?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredEmployees = (employees || []).filter((emp) =>
    emp.fullName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employeeCode?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLocationSelect = (location) => {
    const nextConfig = {
      ...config,
      officeLatitude: location?.latitude ?? null,
      officeLongitude: location?.longitude ?? null,
    };
    onConfigChange(nextConfig);
    console.log(nextConfig);

    setLocalErrors((prev) => ({
      ...prev,
      officeLatitude: validateField(
        "officeLatitude",
        nextConfig.officeLatitude,
        nextConfig,
      ),
      officeLongitude: validateField(
        "officeLongitude",
        nextConfig.officeLongitude,
        nextConfig,
      ),
    }));
  };

  const sections = [
    {
      title: "Bảo mật định vị",
      description: "Xác minh vị trí điểm danh dựa trên tọa độ văn phòng",
      fields: [
        {
          id: "requireLocationCheck",
          label: "Yêu cầu kiểm tra vị trí",
          type: "switch",
          hint: "Bật để kiểm tra vị trí GPS khi điểm danh",
        },
        {
          id: "locationRadiusMeters",
          label: "Bán kính cho phép (m)",
          type: "number",
          placeholder: "Ví dụ: 100",
          hint: "Khoảng cách tối đa cho phép tính bằng mét",
          dependentOn: "requireLocationCheck",
        },
      ],
    },
    {
      title: "Bảo mật thiết bị",
      description: "Một số thiết lập mở rộng để ngăn chặn gian lận điểm danh",
      fields: [
        {
          id: "blockVpn",
          label: "Chặn VPN",
          type: "switch",
          hint: "Bật để chặn điểm danh khi phát hiện kết nối VPN",
        },
      ],
    },
  ];

  return (
    <motion.div variants={itemVariants} className="w-full space-y-6">
      {/* ── PHẠM VI ÁP DỤNG ── */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="w-5 h-5 text-indigo-500" />
            Phạm vi áp dụng
          </CardTitle>
          <CardDescription>
            Chọn đối tượng nhân viên sẽ áp dụng cấu hình bảo mật này
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Select
                label="Áp dụng cho"
                value={config.applyTo || "ALL"}
                options={[
                  { value: "ALL", label: "Tất cả nhân viên" },
                  { value: "EMPLOYEE", label: "Nhân viên cụ thể" },
                ]}
                onChange={(e) => handleChange("applyTo", e.target.value)}
              />
              <p className="text-xs text-slate-500 italic">
                {config.applyTo === "ALL" && "Cấu hình này sẽ được áp dụng cho toàn bộ nhân viên trong công ty."}
                {config.applyTo === "EMPLOYEE" && "Chọn danh sách nhân viên sẽ áp dụng cấu hình này."}
              </p>
            </div>

            {config.applyTo === "EMPLOYEE" && (
              <div className="space-y-3">
                <Label className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400" />
                  Chọn nhân viên ({config.targetIds?.length || 0})
                </Label>
                
                {/* Search Box */}
                <div className="relative">
                  <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <Input
                    placeholder="Tìm tên, mã nhân viên hoặc phòng ban..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>

                <div className="border rounded-lg p-2 bg-slate-50/50 max-h-[350px] overflow-y-auto space-y-1 custom-scrollbar">
                  {dataLoading ? (
                    <p className="text-xs text-slate-400 text-center py-4 italic">Đang tải dữ liệu...</p>
                  ) : Object.keys(filteredGroups).length > 0 ? (
                    Object.keys(filteredGroups).sort((a, b) => b - a).map(deptId => {
                      const dept = filteredGroups[deptId];
                      const deptEmpIds = dept.employees.map(e => Number(e.id));
                      const selectedCount = (config.targetIds || []).filter(id => deptEmpIds.includes(Number(id))).length;
                      const allSelected = deptEmpIds.length > 0 && selectedCount === deptEmpIds.length;
                      const isExpanded = expandedDepartments[deptId] || searchTerm.length > 0;

                      return (
                        <div key={deptId} className="border border-slate-200 rounded-md bg-white overflow-hidden">
                          <div className="flex items-center justify-between p-2 bg-slate-50/80 hover:bg-slate-100 transition-colors">
                            <div className="flex items-center gap-2 flex-1">
                              <button 
                                onClick={() => toggleDeptExpand(deptId)}
                                className="p-1 hover:bg-slate-200 rounded text-slate-500"
                              >
                                {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                              </button>
                              <Checkbox 
                                id={`dept-check-${deptId}`}
                                checked={allSelected}
                                onCheckedChange={() => handleDepartmentToggle(deptId)}
                              />
                              <label 
                                htmlFor={`dept-check-${deptId}`}
                                className="text-sm font-semibold cursor-pointer select-none flex-1"
                              >
                                {dept.name} 
                                <span className="ml-2 text-xs font-normal text-slate-400">({selectedCount}/{dept.employees.length})</span>
                              </label>
                            </div>
                          </div>
                          
                          {isExpanded && (
                            <div className="p-1 pl-8 space-y-1 bg-white">
                              {dept.employees.map((emp) => (
                                <div key={emp.id} className="flex items-center space-x-2 p-1.5 hover:bg-slate-50 rounded transition-colors group">
                                  <Checkbox
                                    id={`emp-${emp.id}`}
                                    checked={(config.targetIds || []).map(Number).includes(Number(emp.id))}
                                    onCheckedChange={() => handleTargetToggle(emp.id)}
                                  />
                                  <label
                                    htmlFor={`emp-${emp.id}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer flex-1"
                                  >
                                    {emp.fullName} <span className="text-slate-400 text-xs font-normal">- {emp.employeeCode}</span>
                                  </label>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <p className="text-xs text-slate-400 text-center py-4 italic">Không tìm thấy nhân viên phù hợp</p>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
      {/* ── BẢO MẬT IP ── */}
      <Card>
        <CardHeader>
          <CardTitle>Bảo mật IP</CardTitle>
          <CardDescription>
            Chặn hoặc cho phép các dải IP cụ thể khi điểm danh
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
            <div className="space-y-0.5">
              <Label
                htmlFor="requireIpCheck"
                className="text-sm font-medium text-slate-900 cursor-pointer"
              >
                Yêu cầu kiểm tra IP
              </Label>
              <p className="text-xs text-slate-500">
                Bật để chỉ cho phép các IP trong danh sách truy cập
              </p>
            </div>
            <Switch
              id="requireIpCheck"
              checked={config.requireIpCheck || false}
              onCheckedChange={(v) => handleChange("requireIpCheck", v)}
            />
          </div>

          <AllowedIpList
            allowedIps={allowedIps}
            onCreate={onAllowedIpCreate}
            onDelete={onAllowedIpDelete}
            currentIp={currentIp}
            disabled={loading || allowedIpsLoading}
            loading={allowedIpsLoading}
          />
        </CardContent>
      </Card>

      {/* ── CÁC SECTIONS KHÁC (VỊ TRÍ & THIẾT BỊ) ── */}
      {sections.map((section, idx) => (
        <div key={idx}>
          {section.title === "Bảo mật định vị" && config.requireLocationCheck && (
            <>
              <LocationMapPicker
                latitude={config.officeLatitude}
                longitude={config.officeLongitude}
                onLocationSelect={handleLocationSelect}
                disabled={!config.requireLocationCheck}
              />
              <div className="mt-6" />
            </>
          )}

          <Card>
            <CardHeader>
              <CardTitle>{section.title}</CardTitle>
              <CardDescription>{section.description}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {section.fields.map((field) => {
                // Khóa các ô input nếu chưa bật Switch
                const isDisabled =
                  field.dependentOn && !config[field.dependentOn];

                return (
                  <div key={field.id} className="space-y-2">
                    {field.type === "switch" ? (
                      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg border border-slate-200">
                        <div className="space-y-0.5">
                          <Label
                            htmlFor={field.id}
                            className="text-sm font-medium text-slate-900 cursor-pointer"
                          >
                            {field.label}
                          </Label>
                          {field.hint && (
                            <p className="text-xs text-slate-500">
                              {field.hint}
                            </p>
                          )}
                        </div>
                        <Switch
                          id={field.id}
                          checked={config[field.id] || false}
                          onCheckedChange={(v) =>
                            handleChange(field.id, v)
                          }
                        />
                      </div>
                    ) : (
                      <div
                        className={`space-y-1.5 ${
                          isDisabled ? "opacity-60" : ""
                        }`}
                      >
                        <Label htmlFor={field.id}>{field.label}</Label>

                        <Input
                          id={field.id}
                          type={field.type}
                          placeholder={field.placeholder}
                          value={config[field.id] ?? ""}
                          onChange={(e) =>
                            handleNumberChange(field.id, e.target.value)
                          }
                          disabled={isDisabled}
                          error={localErrors[field.id]}
                          className={
                            localErrors[field.id]
                              ? "border-red-500 focus-visible:ring-red-500"
                              : ""
                          }
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      ))}
    </motion.div>
  );
}
