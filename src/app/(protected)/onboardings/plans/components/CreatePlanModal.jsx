"use client";

import React, { useState, useMemo, useRef, useEffect } from "react";
import {
  X,
  Plus,
  Trash2,
  Rocket,
  Briefcase,
  Calendar,
  User,
  Layout,
  Save,
  ChevronDown,
  CheckCircle,
  Search,
  GripVertical,
  Laptop,
  Settings,
  FileText,
  GraduationCap,
  Clock,
} from "lucide-react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { onboardingsService } from "@/services";
import { useToast } from "@/components/common/Toast";

/* ==========================================================
 * CONFIG: Task Types
 * ========================================================== */
const TASK_TYPES = {
  Asset: {
    label: "Thiết bị",
    icon: Laptop,
    color: "text-blue-600",
    bg: "bg-blue-50",
    border: "border-blue-100",
  },
  System: {
    label: "Hệ thống",
    icon: Settings,
    color: "text-purple-600",
    bg: "bg-purple-50",
    border: "border-purple-100",
  },
  Document: {
    label: "Tài liệu",
    icon: FileText,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    border: "border-emerald-100",
  },
  Training: {
    label: "Đào tạo",
    icon: GraduationCap,
    color: "text-orange-600",
    bg: "bg-orange-50",
    border: "border-orange-100",
  },
};

/* ==========================================================
 * COMPONENT: SearchableSelect
 * ========================================================== */
const SearchableSelect = ({
  options = [],
  value,
  onChange,
  placeholder,
  labelKey,
  valueKey,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = useMemo(() => {
    if (!searchTerm.trim()) return options;
    return options.filter((opt) =>
      opt[labelKey]?.toLowerCase().includes(searchTerm.toLowerCase()),
    );
  }, [options, searchTerm, labelKey]);

  const selectedOption = options.find(
    (opt) => String(opt[valueKey]) === String(value),
  );

  return (
    <div className="relative w-full" ref={wrapperRef}>
      <div className="relative">
        <input
          type="text"
          className="w-full p-3 border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 pr-10 cursor-pointer bg-slate-50 font-medium transition-all"
          placeholder={placeholder}
          value={
            isOpen ? searchTerm : selectedOption ? selectedOption[labelKey] : ""
          }
          onChange={(e) => setSearchTerm(e.target.value)}
          onFocus={() => setIsOpen(true)}
          autoComplete="off"
        />
        <div className="absolute right-3 top-3.5 pointer-events-none">
          <ChevronDown
            className={`w-4 h-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
          />
        </div>
      </div>

      {isOpen && (
        <div className="absolute z-[100] w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-xl max-h-[250px] overflow-y-auto animate-in fade-in zoom-in duration-150">
          {filteredOptions.length > 0 ? (
            filteredOptions.map((opt) => (
              <div
                key={opt[valueKey]}
                className={`px-4 py-2.5 text-sm hover:bg-indigo-50 cursor-pointer border-b border-slate-50 last:border-none transition-colors ${String(opt[valueKey]) === String(value) ? "bg-indigo-50 text-indigo-700 font-bold" : "text-slate-600"}`}
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
            <div className="px-4 py-3 text-sm text-slate-400 text-center">
              Không có dữ liệu
            </div>
          )}
        </div>
      )}
    </div>
  );
};

/* ==========================================================
 * COMPONENT: CustomTypeSelect
 * ========================================================== */
const CustomTypeSelect = ({ value, onChange }) => {
  const [isOpen, setIsOpen] = useState(false);
  const wrapperRef = useRef(null);
  const activeType = TASK_TYPES[value] || TASK_TYPES.System;
  const Icon = activeType.icon;

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target))
        setIsOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between p-2.5 rounded-xl border transition-all ${activeType.bg} ${activeType.border} ${activeType.color}`}
      >
        <div className="flex items-center gap-2 font-bold text-[11px]">
          <Icon className="w-3.5 h-3.5" />
          {activeType.label}
        </div>
        <ChevronDown
          className={`w-3 h-3 opacity-50 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-40 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden p-1">
          {Object.entries(TASK_TYPES).map(([key, config]) => (
            <button
              key={key}
              type="button"
              onClick={() => {
                onChange(key);
                setIsOpen(false);
              }}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors hover:bg-slate-50 ${value === key ? "bg-slate-50 font-bold" : "text-slate-600"}`}
            >
              <div className={`p-1.5 rounded-md ${config.bg} ${config.color}`}>
                <config.icon className="w-3.5 h-3.5" />
              </div>
              {config.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* ==========================================================
 * MAIN COMPONENT: CreatePlanModal
 * ========================================================== */
export default function CreatePlanModal({
  onClose,
  onSuccess,
  employees = [],
  departments = [],
  templates = [],
}) {
  const [isBrowser, setIsBrowser] = useState(false);
  const [formData, setFormData] = useState({
    planName: "",
    description: "",
    employeeId: "",
    departmentId: "",
    departmentName: "",
    positionId: "",
    positionName: "",
    startDate: new Date().toISOString().split("T")[0],
  });

  const [tasks, setTasks] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const { success, error } = useToast();

  useEffect(() => {
    setIsBrowser(true);
  }, []);

  // Hàm tiện ích tính ngày
  const addDays = (dateStr, days) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    date.setDate(date.getDate() + (parseInt(days) || 0));
    return date.toISOString().split("T")[0];
  };

  /**
   * Logic Waterfall: Tính toán ngày hoàn thành dựa trên số ngày dự kiến tích lũy
   */
  const calculateAutoDueDates = (taskList, startDate) => {
    if (!startDate) return taskList;
    let accumulatedDays = 0;
    return taskList.map((task, idx) => {
      const days = parseInt(task.estimatedDays) || 1;
      accumulatedDays += days;
      return {
        ...task,
        taskOrder: idx + 1,
        dueDate: addDays(startDate, accumulatedDays),
      };
    });
  };

  // Cập nhật lại toàn bộ ngày khi startDate thay đổi
  useEffect(() => {
    if (formData.startDate) {
      setTasks((prev) => calculateAutoDueDates(prev, formData.startDate));
    }
  }, [formData.startDate]);

  const onDragEnd = (result) => {
    if (!result.destination) return;
    const items = Array.from(tasks);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setTasks(calculateAutoDueDates(items, formData.startDate));
  };

  const handleSelectEmployee = (empId) => {
    const selectedEmp = employees.find(
      (emp) => String(emp.id) === String(empId),
    );
    if (!selectedEmp) return;

    const deptId = selectedEmp?.department?.id;
    const posId = selectedEmp?.position?.id;
    const matchedTemplate = templates.find(
      (tpl) =>
        String(tpl.departmentId) === String(deptId) &&
        String(tpl.positionId) === String(posId),
    );

    setFormData((prev) => ({
      ...prev,
      planName: `Hội nhập - ${selectedEmp.fullName}`,
      employeeId: empId,
      departmentId: deptId || "",
      departmentName: selectedEmp?.department?.departmentName || "---",
      positionId: posId || "",
      positionName: selectedEmp?.position?.positionName || "---",
    }));

    if (matchedTemplate) {
      const initialTasks = matchedTemplate.tasks.map((t, idx) => ({
        id: `task-${Date.now()}-${idx}`,
        category: t.category || "System",
        description: t.description || "",
        responsibleDepartmentId: t.responsibleDepartmentId || "",
        isMandatory: Boolean(t.isMandatory),
        estimatedDays: t.estimatedDays || 1,
      }));
      setTasks(calculateAutoDueDates(initialTasks, formData.startDate));
      success(
        `Đã áp dụng mẫu lộ trình cho ${selectedEmp.position?.positionName}`,
      );
    } else {
      const defaultTask = {
        id: Date.now(),
        category: "Asset",
        description: "",
        responsibleDepartmentId: "",
        isMandatory: true,
        estimatedDays: 1,
      };
      // Always reset tasks when switching to an employee without template
      // to avoid keeping tasks from a previously selected employee.
      setTasks(calculateAutoDueDates([defaultTask], formData.startDate));
    }
  };

  const updateTask = (id, field, value) => {
    setTasks((prev) => {
      let updatedTasks = prev.map((t) => {
        if (t.id === id) {
          if (field === "estimatedDays") {
            const days = parseInt(value);
            const validatedDays = isNaN(days) || days < 1 ? 1 : days;
            return { ...t, [field]: validatedDays };
          }
          return { ...t, [field]: value };
        }
        return t;
      });

      if (field === "estimatedDays") {
        return calculateAutoDueDates(updatedTasks, formData.startDate);
      }
      return updatedTasks;
    });
  };

  const removeTask = (id) => {
    setTasks((prev) =>
      calculateAutoDueDates(
        prev.filter((t) => t.id !== id),
        formData.startDate,
      ),
    );
  };

  const handleSubmit = async () => {
    if (!formData.employeeId) {
      error("Vui lòng chọn nhân viên!");
      return;
    }
    if (!formData.startDate) {
      error("Vui lòng chọn ngày bắt đầu!");
      return;
    }
    if (tasks.length === 0) {
      error("Vui lòng thêm ít nhất một nhiệm vụ!");
      return;
    }
    setSubmitting(true);
    try {
      // compute durationDays from task estimates (sum of estimatedDays)
      const totalEstimated = tasks.reduce(
        (sum, t) => sum + (parseInt(t.estimatedDays) || 0),
        0,
      );
      const payload = {
        ...formData,
        status: "ACTIVE",
        durationDays: totalEstimated,
        tasks: tasks.map(({ id, ...rest }) => rest),
      };
      await onboardingsService.createPlan(payload);
      onSuccess?.();
      onClose();
    } catch (err) {
      error("Lỗi hệ thống khi lưu kế hoạch");
    } finally {
      setSubmitting(false);
    }
  };

  if (!isBrowser) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      {/* Header */}
      <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b px-8 py-4 flex justify-between items-center z-[60] shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-slate-800">
            Thiết Lập Lộ Trình Hội Nhập
          </h2>
          <p className="text-slate-500 text-xs flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" /> Hệ thống tự động tính ngày theo mô
            hình Waterfall.
          </p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-colors"
          >
            Hủy
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold shadow-lg flex items-center gap-2 hover:bg-indigo-700 disabled:opacity-50 transition-all active:scale-95"
          >
            <CheckCircle className="w-4 h-4" />{" "}
            {submitting ? "Đang xử lý..." : "Kích hoạt kế hoạch"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-6">
        {/* Info Card */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 tracking-widest">
              <User className="w-3 h-3" /> Nhân viên
            </label>
            <SearchableSelect
              options={employees}
              value={formData.employeeId}
              onChange={handleSelectEmployee}
              placeholder="Tìm nhân viên..."
              labelKey="fullName"
              valueKey="id"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 tracking-widest">
              <Layout className="w-3 h-3" /> Phòng ban
            </label>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium h-[46px] flex items-center truncate text-sm">
              {formData.departmentName || "---"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-slate-400 flex items-center gap-2 tracking-widest">
              <Briefcase className="w-3 h-3" /> Vị trí
            </label>
            <div className="p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-600 font-medium h-[46px] flex items-center truncate text-sm">
              {formData.positionName || "---"}
            </div>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase text-indigo-600 flex items-center gap-2 tracking-widest">
              <Calendar className="w-3 h-3" /> Ngày bắt đầu
            </label>
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              className="w-full p-3 bg-indigo-50 border border-indigo-100 rounded-xl font-bold text-indigo-700 outline-none focus:ring-2 focus:ring-indigo-500/20 text-sm"
              value={formData.startDate}
              onChange={(e) =>
                setFormData({ ...formData, startDate: e.target.value })
              }
            />
          </div>
        </div>

        {/* Timeline Section */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              Lộ trình thực hiện
              <span className="text-[9px] bg-slate-100 px-2 py-0.5 rounded-full text-slate-500 uppercase tracking-tighter">
                Tuần tự
              </span>
            </h3>
          </div>

          <div className="w-full">
            <div className="grid grid-cols-12 gap-4 px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-50 mb-4">
              <div className="col-span-1">Thứ tự</div>
              <div className="col-span-2">Phân loại</div>
              <div className="col-span-4">Nội dung</div>
              <div className="col-span-2 text-center">Bộ phận phụ trách</div>
              <div className="col-span-1 text-center">Số ngày</div>
              <div className="col-span-2 text-right text-indigo-600">
                Hạn hoàn thành
              </div>
            </div>

            <DragDropContext onDragEnd={onDragEnd}>
              <Droppable droppableId="task-list">
                {(provided) => (
                  <div
                    {...provided.droppableProps}
                    ref={provided.innerRef}
                    className="space-y-3"
                  >
                    {tasks.map((task, index) => (
                      <Draggable
                        key={String(task.id)}
                        draggableId={String(task.id)}
                        index={index}
                      >
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            className={`grid grid-cols-12 gap-4 items-center p-3 rounded-2xl border transition-all ${
                              snapshot.isDragging
                                ? "bg-white shadow-2xl border-indigo-400 scale-[1.02] z-[100]"
                                : "bg-white border-slate-100 hover:border-slate-200"
                            }`}
                          >
                            <div className="col-span-1 flex items-center gap-3">
                              <div
                                {...provided.dragHandleProps}
                                className="text-slate-300 hover:text-indigo-500"
                              >
                                <GripVertical className="w-5 h-5" />
                              </div>
                              <span className="text-sm font-black text-slate-300">
                                {(index + 1).toString().padStart(2, "0")}
                              </span>
                            </div>

                            <div className="col-span-2">
                              <CustomTypeSelect
                                value={task.category}
                                onChange={(val) =>
                                  updateTask(task.id, "category", val)
                                }
                              />
                            </div>

                            <div className="col-span-4">
                              <input
                                value={task.description}
                                onChange={(e) =>
                                  updateTask(
                                    task.id,
                                    "description",
                                    e.target.value,
                                  )
                                }
                                className="w-full p-2.5 bg-slate-50 border border-transparent focus:bg-white focus:border-indigo-200 rounded-xl text-sm outline-none transition-all"
                                placeholder="Tên nhiệm vụ..."
                              />
                            </div>

                            <div className="col-span-2">
                              <SearchableSelect
                                options={departments}
                                value={task.responsibleDepartmentId}
                                onChange={(val) =>
                                  updateTask(
                                    task.id,
                                    "responsibleDepartmentId",
                                    val,
                                  )
                                }
                                placeholder="Chọn..."
                                labelKey="departmentName"
                                valueKey="id"
                              />
                            </div>

                            <div className="col-span-1">
                              <div className="relative group">
                                <input
                                  type="number"
                                  min="1"
                                  value={task.estimatedDays}
                                  onChange={(e) =>
                                    updateTask(
                                      task.id,
                                      "estimatedDays",
                                      e.target.value,
                                    )
                                  }
                                  className="w-full p-2.5 text-center bg-indigo-50/30 border border-indigo-100 rounded-xl text-sm font-bold text-indigo-700 outline-none focus:bg-white"
                                />
                                <div className="absolute -top-8 left-1/2 -translate-x-1/2 hidden group-hover:block bg-slate-800 text-white text-[9px] px-2 py-1 rounded whitespace-nowrap">
                                  Thời gian thực hiện
                                </div>
                              </div>
                            </div>

                            <div className="col-span-2 flex items-center justify-end gap-3">
                              <div className="text-right">
                                <span className="block text-[10px] text-slate-400 font-bold leading-none mb-1">
                                  DỰ KIẾN
                                </span>
                                <span className="text-sm font-bold text-slate-700">
                                  {task.dueDate
                                    ? new Date(task.dueDate).toLocaleDateString(
                                        "vi-VN",
                                      )
                                    : "---"}
                                </span>
                              </div>
                              <div className="flex flex-col gap-2 border-l pl-3 border-slate-100">
                                <input
                                  type="checkbox"
                                  checked={task.isMandatory}
                                  onChange={(e) =>
                                    updateTask(
                                      task.id,
                                      "isMandatory",
                                      e.target.checked,
                                    )
                                  }
                                  className="w-4 h-4 rounded border-slate-300 text-indigo-600"
                                  title="Bắt buộc"
                                />
                                <button
                                  onClick={() => removeTask(task.id)}
                                  className="text-slate-300 hover:text-red-500 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))}
                    {provided.placeholder}
                  </div>
                )}
              </Droppable>
            </DragDropContext>

            <button
              onClick={() => {
                const newTask = {
                  id: Date.now(),
                  category: "System",
                  description: "",
                  responsibleDepartmentId: "",
                  isMandatory: false,
                  estimatedDays: 1,
                };
                setTasks(
                  calculateAutoDueDates(
                    [...tasks, newTask],
                    formData.startDate,
                  ),
                );
              }}
              className="mt-6 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-slate-400 font-bold hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50/30 transition-all flex items-center justify-center gap-2 group"
            >
              <Plus className="w-5 h-5 group-hover:rotate-90 transition-transform" />{" "}
              Thêm nhiệm vụ tiếp theo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
