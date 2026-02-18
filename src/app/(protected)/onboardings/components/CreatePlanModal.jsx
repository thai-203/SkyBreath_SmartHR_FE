"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X, Plus, Trash2, Rocket, Briefcase, Calendar, User, Layout, Save, ChevronDown, CheckCircle, Search
} from "lucide-react";
import { onboardingsService } from "@/services";
import { toast } from "sonner";

/* ==========================================================
 * COMPONENT: SearchableSelect (Dùng chung cho Nhân viên & Bộ phận)
 * ========================================================== */
const SearchableSelect = ({ options, value, onChange, placeholder, labelKey, valueKey }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [options, searchTerm, labelKey]);

  const selectedOption = options.find((opt) => String(opt[valueKey]) === String(value));

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <input
          type="text"
          className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 pr-10 cursor-pointer bg-slate-50"
          placeholder={placeholder}
          value={isOpen ? searchTerm : selectedOption ? selectedOption[labelKey] : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            if (!isOpen) setIsOpen(true);
          }}
        />
        <ChevronDown className={`absolute right-3 top-3.5 w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto overflow-x-hidden animate-in fade-in zoom-in duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt[valueKey]}
                className="px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-none transition-colors"
                onClick={() => {
                  onChange(opt[valueKey]);
                  setSearchTerm("");
                  setIsOpen(false);
                }}
              >
                {opt[labelKey]}
              </div>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-400 text-center">Không tìm thấy kết quả</div>
          )}
        </div>
      )}
    </div>
  );
};

/* ==========================================================
 * MAIN COMPONENT: CreatePlanModal
 * ========================================================== */
export default function CreatePlanModal({
  onClose, onSuccess, employees = [], departments = [], templates = []
}) {
  const [formData, setFormData] = useState({
    planName: "",
    description: "",
    employeeId: "",
    departmentId: "",
    departmentName: "",
    positionId: "",
    positionName: "",
    startDate: "",
  });

  const [tasks, setTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  // Hàm cộng ngày tiện ích
  const addDays = (dateStr, days) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    date.setDate(date.getDate() + (parseInt(days) || 0));
    return date.toISOString().split("T")[0];
  };

  /**
   * Logic Waterfall: Tự động tính chuỗi ngày hạn
   */
  const calculateAutoDueDates = (taskList, startDate) => {
    if (!startDate || taskList.length === 0) return taskList;
    
    let currentReferenceDate = startDate;
    return taskList.map(task => {
      const estDays = task.estimatedDays || 1;
      const newDueDate = addDays(currentReferenceDate, estDays);
      currentReferenceDate = newDueDate; // Task sau dựa trên hạn task trước
      return { ...task, dueDate: newDueDate, estimatedDays: estDays };
    });
  };

  // Tự động tính lại khi Ngày bắt đầu thay đổi
  useEffect(() => {
    if (formData.startDate && tasks.length > 0) {
      setTasks(prev => calculateAutoDueDates(prev, formData.startDate));
    }
  }, [formData.startDate]);

  // Xử lý khi chọn nhân viên qua Searchable Select
  const handleSelectEmployee = (empId) => {
    const selectedEmp = employees.find((emp) => String(emp.id) === String(empId));
    if (!selectedEmp) return;

    const deptId = selectedEmp?.department?.id;
    const posId = selectedEmp?.position?.id;

    const matchedTemplate = templates.find(
      (tpl) => String(tpl.departmentId) === String(deptId) && String(tpl.positionId) === String(posId)
    );

    setFormData(prev => ({
      ...prev,
      planName: matchedTemplate ? `Kế hoạch hội nhập cho ${selectedEmp.fullName}` : "",
      description: matchedTemplate ? `Quy trình cho vị trí ${selectedEmp.position?.positionName} tại ${selectedEmp.department?.departmentName}` : "",
      employeeId: empId,
      departmentId: deptId || "",
      departmentName: selectedEmp?.department?.departmentName || "Chưa xác định",
      positionId: posId || "",
      positionName: selectedEmp?.position?.positionName || "Chưa xác định",
    }));

    if (matchedTemplate) {
      const initialTasks = matchedTemplate.tasks.map((t) => ({
        id: Math.random(),
        taskType: t.category || "System",
        description: t.taskTitle || "",
        responsibleDeptId: t.responsibleDepartmentId || "",
        isRequired: Boolean(t.isMandatory),
        estimatedDays: t.estimatedDays || 1,
        dueDate: "",
      }));
      setTasks(calculateAutoDueDates(initialTasks, formData.startDate));
      toast.success(`Đã áp dụng mẫu quy trình: ${matchedTemplate.planName}`);
    } else {
      const defaultTask = { id: Date.now(), taskType: "Asset", description: "", responsibleDeptId: "", isRequired: true, dueDate: "", estimatedDays: 1 };
      setTasks(calculateAutoDueDates([defaultTask], formData.startDate));
    }
  };

  const updateTask = (id, field, value) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addNewTask = () => {
    const newTask = { id: Date.now(), taskType: "System", description: "", responsibleDeptId: "", isRequired: false, dueDate: "", estimatedDays: 1 };
    setTasks(prev => calculateAutoDueDates([...prev, newTask], formData.startDate));
  };

  const removeTask = (id) => {
    setTasks(prev => calculateAutoDueDates(prev.filter(t => t.id !== id), formData.startDate));
  };

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.startDate) {
      return toast.error("Vui lòng chọn nhân viên và ngày bắt đầu!");
    }

    setSubmitting(true);
    try {
      // Tính durationDays tổng quát
      const start = new Date(formData.startDate);
      const lastDueDate = tasks.length > 0 ? tasks[tasks.length - 1].dueDate : formData.startDate;
      const totalDays = Math.ceil((new Date(lastDueDate) - start) / (1000 * 60 * 60 * 24));

      const payload = {
        ...formData,
        durationDays: totalDays,
        status: "ACTIVE",
        tasks: tasks.map(({ id, ...rest }) => rest),
      };

      await onboardingsService.createPlan(payload);
      toast.success("Kích hoạt kế hoạch hội nhập thành công!");
      onSuccess?.();
      onClose();
    } catch (err) {
      toast.error("Lỗi hệ thống khi lưu kế hoạch");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b px-8 py-4 flex justify-between items-center z-[60] shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tạo Kế Hoạch Hội Nhập</h2>
          <p className="text-slate-500 text-sm">Hệ thống tự động đồng bộ hóa thời gian các nhiệm vụ.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors">Hủy</button>
          <button onClick={handleSubmit} disabled={submitting} className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50">
            <CheckCircle className="w-4 h-4" /> {submitting ? "Đang xử lý..." : "Kích hoạt kế hoạch"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Profile Card Section */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2">
              <User className="w-3 h-3"/> Chọn nhân viên *
            </label>
            <SearchableSelect 
              options={employees}
              value={formData.employeeId}
              onChange={handleSelectEmployee}
              placeholder="Tìm tên nhân viên..."
              labelKey="fullName"
              valueKey="id"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2">
              <Layout className="w-3 h-3"/> Phòng ban
            </label>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium h-[46px] flex items-center">
              {formData.departmentName || "---"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2">
              <Briefcase className="w-3 h-3"/> Vị trí
            </label>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium h-[46px] flex items-center">
              {formData.positionName || "---"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-indigo-600 flex items-center gap-2">
              <Calendar className="w-3 h-3"/> Ngày bắt đầu *
            </label>
            <input 
              type="date" 
              className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20" 
              value={formData.startDate} 
              onChange={(e) => setFormData({...formData, startDate: e.target.value})} 
            />
          </div>
        </div>

        {/* Tasks Table Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center gap-2">
            Lộ trình chi tiết
            <span className="text-[10px] font-normal bg-slate-100 px-2 py-0.5 rounded text-slate-500 uppercase">Auto-calculated</span>
          </h3>
          <table className="w-full border-separate border-spacing-y-4">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase text-left tracking-widest">
                <th className="w-36 pl-4">Phân loại</th>
                <th className="pl-4">Nội dung nhiệm vụ</th>
                <th className="w-72 pl-4">Bộ phận phụ trách</th>
                <th className="w-52 pl-4 text-indigo-600">Hạn hoàn thành</th>
                <th className="w-20 text-center">Yêu cầu</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="group hover:bg-slate-50 transition-colors">
                  <td className="align-top pt-1">
                    <select 
                      value={task.taskType} 
                      onChange={(e) => updateTask(task.id, "taskType", e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="Asset">Thiết bị</option>
                      <option value="System">Hệ thống</option>
                      <option value="Document">Tài liệu</option>
                      <option value="Training">Đào tạo</option>
                    </select>
                  </td>
                  <td className="pl-4 align-top">
                    <input 
                      value={task.description} 
                      onChange={(e) => updateTask(task.id, "description", e.target.value)}
                      className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400" 
                      placeholder="Nhập mô tả nhiệm vụ..." 
                    />
                  </td>
                  <td className="pl-4 align-top">
                    <SearchableSelect 
                      options={departments}
                      value={task.responsibleDeptId}
                      onChange={(val) => updateTask(task.id, "responsibleDeptId", val)}
                      placeholder="Chọn bộ phận..."
                      labelKey="departmentName"
                      valueKey="id"
                    />
                  </td>
                  <td className="pl-4 align-top">
                    <div className="relative">
                      <input 
                        type="date" 
                        value={task.dueDate} 
                        min={formData.startDate}
                        onChange={(e) => updateTask(task.id, "dueDate", e.target.value)}
                        className="w-full p-2.5 border border-indigo-100 bg-indigo-50/30 rounded-xl text-sm font-bold text-indigo-700 outline-none" 
                      />
                      {!formData.startDate && (
                        <div className="absolute -bottom-5 left-0 text-[9px] text-red-400 font-medium">Chưa có ngày bắt đầu</div>
                      )}
                    </div>
                  </td>
                  <td className="text-center align-top pt-3">
                    <input 
                      type="checkbox" 
                      checked={task.isRequired} 
                      onChange={(e) => updateTask(task.id, "isRequired", e.target.checked)}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500" 
                    />
                  </td>
                  <td className="align-top pt-2">
                    <button 
                      onClick={() => removeTask(task.id)} 
                      className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            onClick={addNewTask} 
            className="mt-6 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-indigo-600 font-bold hover:bg-indigo-50 transition-all flex items-center justify-center gap-2 hover:border-indigo-200"
          >
            <Plus className="w-4 h-4" /> Thêm bước mới vào quy trình
          </button>
        </div>
      </div>
    </div>
  );
}