"use client";

import React, { useState } from "react";
import { X, Plus, Trash2, LayoutTemplate, Briefcase, CheckCircle2, Layers } from "lucide-react";
import { onboardingsService } from "@/services";
import { toast } from "sonner";

export default function CreateTemplateModal({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    title: "",
    departmentName: "",
    description: "",
    status: "active"
  });

  const [tasks, setTasks] = useState([
    { id: 1, taskType: "Asset", description: "", responsible: "", isRequired: true }
  ]);

  const [submitting, setSubmitting] = useState(false);

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addNewTask = () => {
    setTasks([...tasks, { id: Date.now(), taskType: "System", description: "", responsible: "", isRequired: false }]);
  };

  const removeTask = (id) => {
    if (tasks.length > 1) setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.title || !formData.departmentName) {
      return toast.error("Vui lòng nhập tên mẫu và phòng ban!");
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        tasks: tasks.map(({ id, ...rest }) => rest)
      };
      await onboardingsService.createPlan(payload); // Giả sử dùng chung hàm tạo hoặc endpoint template
      toast.success("Đã lưu mẫu thành công!");
      onSuccess();
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu mẫu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto animate-in slide-in-from-bottom-4 duration-300">
      {/* Header Bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-8 py-4 flex justify-between items-center z-20 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-lg">
            <LayoutTemplate className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-800">Thiết kế Mẫu Quy Trình</h2>
            <p className="text-slate-500 text-sm">Xây dựng bộ khung nhiệm vụ chuẩn hóa.</p>
          </div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50">Hủy</button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 disabled:opacity-50"
          >
            {submitting ? "Đang lưu..." : "Lưu mẫu quy trình"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8 pb-20">
        {/* Section 1: Thông tin mẫu */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400">Tên mẫu quy trình</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Ví dụ: Onboarding Developer Lvl 1"
              value={formData.title}
              onChange={(e) => setFormData({...formData, title: e.target.value})}
            />
          </div>
          <div className="space-y-2">
            <label className="text-[11px] font-bold uppercase text-slate-400">Phòng ban áp dụng</label>
            <input 
              className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
              placeholder="Ví dụ: Kỹ thuật"
              value={formData.departmentName}
              onChange={(e) => setFormData({...formData, departmentName: e.target.value})}
            />
          </div>
        </div>

        {/* Section 2: Danh sách nhiệm vụ mẫu */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden px-6 py-4">
          <h3 className="text-lg font-bold text-slate-700 mb-6">Nội dung quy trình</h3>
          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                <th className="pl-4 w-40">Loại</th>
                <th className="pl-4">Mô tả nhiệm vụ</th>
                <th className="pl-4 w-52">Bộ phận xử lý</th>
                <th className="text-center w-24">Bắt buộc</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {tasks.map((task) => (
                <tr key={task.id} className="group hover:bg-slate-50/50 transition-all">
                  <td>
                    <select 
                      value={task.taskType} 
                      onChange={(e) => updateTask(task.id, 'taskType', e.target.value)}
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none"
                    >
                      <option value="Asset">Thiết bị</option>
                      <option value="System">Hệ thống</option>
                      <option value="Document">Tài liệu</option>
                      <option value="Training">Đào tạo</option>
                    </select>
                  </td>
                  <td className="pl-4"><input placeholder="Mô tả..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" value={task.description} onChange={(e) => updateTask(task.id, 'description', e.target.value)} /></td>
                  <td className="pl-4"><input placeholder="Ví dụ: IT Support" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" value={task.responsible} onChange={(e) => updateTask(task.id, 'responsible', e.target.value)} /></td>
                  <td className="text-center"><input type="checkbox" checked={task.isRequired} className="w-5 h-5 rounded-lg text-indigo-600" onChange={(e) => updateTask(task.id, 'isRequired', e.target.checked)} /></td>
                  <td className="pl-2">
                    <button onClick={() => removeTask(task.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <button onClick={addNewTask} className="mt-4 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-indigo-600 font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all">
            <Plus className="w-4 h-4" /> Thêm nhiệm vụ mới
          </button>
        </div>

        {/* Section 3: Lưu trữ */}
        <div className="bg-indigo-900 rounded-3xl p-10 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-bold">Xác nhận mẫu quy trình</h3>
            <p className="text-indigo-200 text-sm">Mẫu sẽ được lưu vào kho dữ liệu và sẵn sàng để áp dụng cho nhân sự mới.</p>
          </div>
          <button onClick={handleSubmit} className="px-10 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase hover:bg-indigo-50 transition-all">Lưu & Hoàn tất</button>
        </div>
      </div>
    </div>
  );
}