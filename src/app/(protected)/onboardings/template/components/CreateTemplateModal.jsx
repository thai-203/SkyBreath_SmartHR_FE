"use client";

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Plus,
  Trash2,
  LayoutTemplate,
  Save,
  X,
  Clock,
  Briefcase,
  Layers,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  AlertCircle,
} from "lucide-react";
import { onboardingsService } from "@/services";
import { useToast } from "@/components/common/Toast";

export default function CreateTemplateModal({
  onClose,
  onSuccess,
  initialData = null,
  departmentsList = [],
  positionsList = [],
}) {
  const { success, error } = useToast();
  const isEdit = !!initialData?.id;
  const ITEMS_PER_PAGE = 5;

  const [formData, setFormData] = useState({
    planName: "",
    departmentId: "",
    positionId: "",
    description: "",
    durationDays: 30,
    status: "ACTIVE",
    isTemplate: 1,
  });

  const [tasks, setTasks] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState({ dept: "", pos: "" });
  const [dropdowns, setDropdowns] = useState({ dept: false, pos: false });
  const [openTaskDropdownId, setOpenTaskDropdownId] = useState(null);

  const deptRef = useRef(null);
  const posRef = useRef(null);
  const taskDropdownRef = useRef(null);

  const totalEstimatedDays = useMemo(() => {
    return tasks.reduce(
      (sum, task) => sum + (Number(task.estimatedDays) || 0),
      0,
    );
  }, [tasks]);

  const isDurationValid = formData.durationDays >= totalEstimatedDays;

  useEffect(() => {
    if (!initialData) {
      setTasks([
        {
          tempId: Date.now(),
          category: "Asset",
          description: "",
          isMandatory: 1,
          estimatedDays: 1,
          responsibleDepartmentId: "",
          responsibleDepartmentLabel: "",
        },
      ]);
      return;
    }

    setFormData({
      planName: initialData.planName || initialData.plan_name || "",
      departmentId: initialData.departmentId || initialData.department_id || "",
      positionId: initialData.positionId || initialData.position_id || "",
      description: initialData.description || "",
      durationDays: initialData.durationDays || initialData.duration_days || 30,
      status: initialData.status || "ACTIVE",
      isTemplate: 1,
    });

    const currentDept = departmentsList.find(
      (d) =>
        String(d.value) ===
        String(initialData.departmentId || initialData.department_id),
    );
    const currentPos = positionsList.find(
      (p) =>
        String(p.value) ===
        String(initialData.positionId || initialData.position_id),
    );

    setSearch({
      dept: currentDept?.label || "",
      pos: currentPos?.label || "",
    });

    if (initialData.tasks?.length) {
      setTasks(
        initialData.tasks.map((t) => ({
          id: t.id,
          tempId: t.id,
          category: t.category || "Asset",
          description: t.description || "",
          isMandatory: t.isMandatory ?? t.is_mandatory ?? 1,
          estimatedDays: t.estimatedDays || t.estimated_days || 1,
          responsibleDepartmentId:
            t.responsibleDepartmentId || t.responsible_department_id || "",
          responsibleDepartmentLabel:
            departmentsList.find(
              (d) =>
                String(d.value) ===
                String(
                  t.responsibleDepartmentId || t.responsible_department_id,
                ),
            )?.label || "",
        })),
      );
    }
  }, [initialData, departmentsList, positionsList]);

  useEffect(() => {
    const handler = (e) => {
      if (deptRef.current && !deptRef.current.contains(e.target))
        setDropdowns((p) => ({ ...p, dept: false }));
      if (posRef.current && !posRef.current.contains(e.target))
        setDropdowns((p) => ({ ...p, pos: false }));
      if (
        taskDropdownRef.current &&
        !taskDropdownRef.current.contains(e.target)
      )
        setOpenTaskDropdownId(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const totalPages = Math.ceil(tasks.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const currentTasks = useMemo(() => {
    return tasks.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [tasks, currentPage]);

  useEffect(() => {
    if (currentPage > 1 && currentTasks.length === 0) {
      setCurrentPage(currentPage - 1);
    }
  }, [currentTasks, currentPage]);

  const updateTask = (tempId, field, value) => {
    let finalValue = value;
    if (field === "estimatedDays") {
      finalValue = Math.max(0, parseInt(value) || 0);
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.tempId === tempId ? { ...t, [field]: finalValue } : t,
      ),
    );
  };

  const addNewTask = () => {
    const newId = Date.now();
    setTasks((prev) => [
      ...prev,
      {
        tempId: newId,
        category: "System",
        description: "",
        isMandatory: 0,
        estimatedDays: 1,
        responsibleDepartmentId: "",
        responsibleDepartmentLabel: "",
      },
    ]);
    setCurrentPage(Math.ceil((tasks.length + 1) / ITEMS_PER_PAGE));
  };

  const removeTask = (tempId) => {
    setTasks((prev) => prev.filter((t) => t.tempId !== tempId));
  };

  const handleSubmit = async (isDraft = false) => {
    if (!isDraft) {
      if (
        !formData.planName ||
        !formData.departmentId ||
        !formData.positionId
      ) {
        error("Vui lòng nhập đầy đủ các thông tin bắt buộc!");
        return;
      }
      if (!isDurationValid) {
        error(
          `Thời gian quy trình (${formData.durationDays} ngày) không được nhỏ hơn tổng thời gian nhiệm vụ (${totalEstimatedDays} ngày)!`,
        );
        return;
      }
    } else if (!formData.planName) {
      error("Vui lòng nhập tên quy trình để lưu nháp!");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        status: isDraft ? "DRAFT" : "ACTIVE",
        tasks: tasks.map((t, index) => ({
          id: t.id,
          description: t.description,
          category: t.category,
          estimatedDays: t.estimatedDays,
          isMandatory: Number(t.isMandatory),
          responsibleDepartmentId: t.responsibleDepartmentId || null,
          taskOrder: index + 1,
        })),
      };

      if (isEdit) {
        await onboardingsService.updatePlan(initialData.id, payload);
        success("Cập nhật quy trình thành công!");
      } else {
        await onboardingsService.createPlan(payload);
        success(isDraft ? "Đã lưu bản nháp!" : "Tạo quy trình thành công!");
      }

      onSuccess?.();
      onClose?.();
    } catch (e) {
      error(e?.response?.data?.message || "Thao tác thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto">
      <div className="sticky top-0 bg-white border-b px-8 py-4 flex justify-between items-center z-50 shadow-sm">
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${isEdit ? "bg-amber-500" : "bg-indigo-600"}`}
          >
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">
              {isEdit ? "Cập nhật Mẫu Quy Trình" : "Tạo Mẫu Quy Trình Mới"}
            </h2>
            {formData.status === "DRAFT" && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                Bản nháp
              </span>
            )}
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="px-6 py-2 border rounded-xl hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4 inline mr-1" /> Hủy
          </button>

          {!isEdit && (
            <button
              onClick={() => handleSubmit(true)}
              disabled={submitting}
              className="px-6 py-2 bg-slate-100 text-slate-700 rounded-xl hover:bg-slate-200 transition-colors font-medium border border-slate-200"
            >
              <Clock className="w-4 h-4 inline mr-1" /> Lưu bản nháp
            </button>
          )}

          <button
            onClick={() => handleSubmit(false)}
            disabled={submitting}
            className={`px-6 py-2 text-white rounded-xl shadow-lg transition-all active:scale-95 ${
              isEdit
                ? "bg-amber-500 hover:bg-amber-600 shadow-amber-200"
                : "bg-indigo-600 hover:bg-indigo-700 shadow-indigo-200"
            }`}
          >
            <Save className="w-4 h-4 inline mr-1" />
            {submitting
              ? "Đang lưu..."
              : isEdit
                ? "Cập nhật ngay"
                : "Kích hoạt mẫu"}
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto p-8 space-y-6 pb-20">
        {/* SECTION 1: Gỡ bỏ overflow-hidden và thêm z-20 */}
        <div className="bg-white rounded-3xl p-8 border border-slate-200 shadow-sm relative z-20">
          <div
            className={`absolute top-0 left-0 w-full h-1 ${isEdit ? "bg-amber-500" : "bg-indigo-600"}`}
          />
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="md:col-span-2 space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-400">
                Tên mẫu quy trình *
              </label>
              <input
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 font-semibold"
                placeholder="Ví dụ: Onboarding Senior Frontend Developer"
                value={formData.planName}
                onChange={(e) =>
                  setFormData({ ...formData, planName: e.target.value })
                }
              />
            </div>

            {/* Ô Phòng ban: thêm z-30 để cao hơn ô Vị trí */}
            <div className="space-y-2 relative z-30" ref={deptRef}>
              <label className="text-[11px] font-bold uppercase text-slate-400">
                Phòng ban *
              </label>
              <div className="relative">
                <Layers className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  className="w-full p-3 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Chọn phòng ban..."
                  value={search.dept}
                  onFocus={() => setDropdowns({ ...dropdowns, dept: true })}
                  onChange={(e) => {
                    setSearch({ ...search, dept: e.target.value });
                    setDropdowns({ ...dropdowns, dept: true });
                  }}
                />
                <ChevronDown
                  className={`absolute right-3 top-3.5 w-4 h-4 text-slate-400 transition-transform ${dropdowns.dept ? "rotate-180" : ""}`}
                />
              </div>
              {dropdowns.dept && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {departmentsList
                    .filter((d) =>
                      d.label.toLowerCase().includes(search.dept.toLowerCase()),
                    )
                    .map((dept) => (
                      <button
                        key={dept.value}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 text-sm font-medium border-b last:border-0"
                        onClick={() => {
                          setFormData({
                            ...formData,
                            departmentId: dept.value,
                          });
                          setSearch({ ...search, dept: dept.label });
                          setDropdowns({ ...dropdowns, dept: false });
                        }}
                      >
                        {dept.label}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Ô Vị trí: z-index mặc định (20 của cha) */}
            <div className="space-y-2 relative z-20" ref={posRef}>
              <label className="text-[11px] font-bold uppercase text-slate-400">
                Vị trí *
              </label>
              <div className="relative">
                <Briefcase className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" />
                <input
                  className="w-full p-3 pl-10 pr-10 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Chọn vị trí..."
                  value={search.pos}
                  onFocus={() => setDropdowns({ ...dropdowns, pos: true })}
                  onChange={(e) => {
                    setSearch({ ...search, pos: e.target.value });
                    setDropdowns({ ...dropdowns, pos: true });
                  }}
                />
                <ChevronDown
                  className={`absolute right-3 top-3.5 w-4 h-4 text-slate-400 transition-transform ${dropdowns.pos ? "rotate-180" : ""}`}
                />
              </div>
              {dropdowns.pos && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-60 overflow-y-auto">
                  {positionsList
                    .filter((p) =>
                      p.label.toLowerCase().includes(search.pos.toLowerCase()),
                    )
                    .map((pos) => (
                      <button
                        key={pos.value}
                        type="button"
                        className="w-full text-left px-4 py-3 hover:bg-amber-50 text-sm font-medium border-b last:border-0"
                        onClick={() => {
                          setFormData({ ...formData, positionId: pos.value });
                          setSearch({ ...search, pos: pos.label });
                          setDropdowns({ ...dropdowns, pos: false });
                        }}
                      >
                        {pos.label}
                      </button>
                    ))}
                </div>
              )}
            </div>

            <div className="md:col-span-3 space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-400">
                Mô tả mục tiêu
              </label>
              <input
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none"
                placeholder="Mô tả ngắn gọn về quy trình này..."
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
              />
            </div>

            <div className="space-y-2">
              <label
                className={`text-[11px] font-bold uppercase flex items-center gap-1 ${!isDurationValid ? "text-red-500" : "text-slate-400"}`}
              >
                Thời gian quy trình (Ngày)
                {!isDurationValid && <AlertCircle className="w-3 h-3" />}
              </label>
              <div className="relative">
                <Clock
                  className={`absolute left-3 top-3.5 w-4 h-4 ${!isDurationValid ? "text-red-500" : "text-slate-400"}`}
                />
                <input
                  type="number"
                  min="0"
                  className={`w-full p-3 pl-10 border rounded-xl outline-none transition-all ${
                    !isDurationValid
                      ? "bg-red-50 border-red-200 text-red-600 focus:ring-red-500/20"
                      : "bg-slate-50 border-slate-200 focus:ring-indigo-500/20"
                  }`}
                  value={formData.durationDays}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      durationDays: Math.max(0, parseInt(e.target.value) || 0),
                    })
                  }
                />
              </div>
              {!isDurationValid && (
                <p className="text-[10px] text-red-500 font-medium italic">
                  * Phải ≥ tổng ngày hoàn thành các task ({totalEstimatedDays}{" "}
                  ngày)
                </p>
              )}
            </div>
          </div>
        </div>

        {/* SECTION 2: Gỡ bỏ overflow-hidden và thêm z-10 */}
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm px-8 py-6 relative z-10">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-800">
              Danh sách nhiệm vụ đào tạo
            </h3>

            {totalPages > 1 && (
              <div className="flex items-center gap-3 bg-slate-50 border rounded-xl p-1">
                <button
                  type="button"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  <span className="text-sm font-bold text-indigo-600 px-2">
                    Trang {currentPage}
                  </span>
                  <span className="text-sm text-slate-400">/ {totalPages}</span>
                </div>
                <button
                  type="button"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="p-2 hover:bg-white rounded-lg disabled:opacity-30 transition-all shadow-sm"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <table className="w-full border-separate border-spacing-y-2">
            <thead>
              <tr className="text-[10px] font-black text-slate-400 uppercase tracking-widest text-left">
                <th className="w-40 px-2">Phân loại</th>
                <th className="px-2">Tiêu đề nhiệm vụ</th>
                <th className="w-64 px-2">Chịu trách nhiệm</th>
                <th className="w-24 px-2 text-center">Ngày HT</th>
                <th className="w-20 px-2 text-center">Bắt buộc</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.map((task) => (
                <tr
                  key={task.tempId}
                  className="group hover:bg-slate-50 transition-all"
                >
                  <td className="px-1 py-2">
                    <select
                      value={task.category}
                      onChange={(e) =>
                        updateTask(task.tempId, "category", e.target.value)
                      }
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm"
                    >
                      <option value="Asset">Thiết bị/TS</option>
                      <option value="System">Tài khoản/Hệ thống</option>
                      <option value="Document">Tài liệu/Quy định</option>
                      <option value="Training">Đào tạo/Chuyên môn</option>
                    </select>
                  </td>
                  <td className="px-1 py-2">
                    <input
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm font-medium focus:border-indigo-500 outline-none"
                      placeholder="VD: Cấp laptop..."
                      value={task.description}
                      onChange={(e) =>
                        updateTask(task.tempId, "description", e.target.value)
                      }
                    />
                  </td>

                  {/* Cột chịu trách nhiệm: Thêm z-index động để hàng đang mở dropdown sẽ nổi lên */}
                  <td
                    className={`px-1 py-2 relative ${openTaskDropdownId === task.tempId ? "z-50" : "z-0"}`}
                    ref={
                      openTaskDropdownId === task.tempId
                        ? taskDropdownRef
                        : null
                    }
                  >
                    <div className="relative">
                      <input
                        className="w-full p-2 pr-8 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-500"
                        placeholder="Chọn phòng ban..."
                        value={task.responsibleDepartmentLabel}
                        onFocus={() => setOpenTaskDropdownId(task.tempId)}
                        onChange={(e) => {
                          updateTask(
                            task.tempId,
                            "responsibleDepartmentLabel",
                            e.target.value,
                          );
                          setOpenTaskDropdownId(task.tempId);
                        }}
                      />
                      <ChevronDown
                        className={`absolute right-2 top-2.5 w-4 h-4 text-slate-300 transition-transform ${openTaskDropdownId === task.tempId ? "rotate-180" : ""}`}
                      />
                    </div>

                    {openTaskDropdownId === task.tempId && (
                      <div className="absolute z-50 left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-2xl max-h-52 overflow-y-auto">
                        {departmentsList
                          .filter((d) =>
                            d.label
                              .toLowerCase()
                              .includes(
                                task.responsibleDepartmentLabel.toLowerCase(),
                              ),
                          )
                          .map((dept) => (
                            <button
                              key={dept.value}
                              type="button"
                              className="w-full text-left px-4 py-2.5 hover:bg-indigo-50 text-sm border-b last:border-0 border-slate-50 transition-colors"
                              onClick={() => {
                                updateTask(
                                  task.tempId,
                                  "responsibleDepartmentId",
                                  dept.value,
                                );
                                updateTask(
                                  task.tempId,
                                  "responsibleDepartmentLabel",
                                  dept.label,
                                );
                                setOpenTaskDropdownId(null);
                              }}
                            >
                              {dept.label}
                            </button>
                          ))}
                      </div>
                    )}
                  </td>

                  <td className="px-1 py-2">
                    <input
                      type="number"
                      min="0"
                      className="w-full p-2 bg-white border border-slate-200 rounded-xl text-sm text-center focus:border-indigo-500 outline-none"
                      value={task.estimatedDays}
                      onChange={(e) =>
                        updateTask(task.tempId, "estimatedDays", e.target.value)
                      }
                    />
                  </td>
                  <td className="text-center px-1 py-2">
                    <input
                      type="checkbox"
                      checked={!!task.isMandatory}
                      onChange={(e) =>
                        updateTask(
                          task.tempId,
                          "isMandatory",
                          e.target.checked ? 1 : 0,
                        )
                      }
                      className="w-5 h-5 accent-indigo-600 cursor-pointer"
                    />
                  </td>
                  <td className="px-1 py-2 text-right">
                    <button
                      type="button"
                      onClick={() => removeTask(task.tempId)}
                      className="p-2 text-slate-300 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button
            type="button"
            onClick={addNewTask}
            className="mt-6 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-indigo-600 font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 transition-all group"
          >
            <Plus className="w-5 h-5 group-hover:scale-110 transition-transform" />
            Thêm nhiệm vụ mới vào quy trình
          </button>
        </div>
      </div>
    </div>
  );
}
