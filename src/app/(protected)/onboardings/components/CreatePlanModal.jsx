import React, { useState } from "react";
import { X, Plus, Trash2, Rocket, Briefcase, Calendar, User } from "lucide-react";
import { onboardingsService } from "@/services";
import { toast } from "sonner";

export default function CreatePlanModal({ onClose, onSuccess, employees }) {
  const [formData, setFormData] = useState({
    employeeId: "",
    jobRole: "",
    startDate: ""
  });

  const [tasks, setTasks] = useState([
    { id: 1, taskType: "Asset", description: "Cấp phát Laptop MacBook Pro", responsible: "IT Support", dueDate: "", isRequired: true }
  ]);

  const [submitting, setSubmitting] = useState(false);

  const handleEmployeeChange = (e) => {
    const empId = Number(e.target.value);

    const selectedEmp = employees.find(emp => emp.id === empId);

    setFormData(prev => ({
      ...prev,
      employeeId: empId,
      jobRole:
        selectedEmp?.position?.positionName ||
        selectedEmp?.department?.departmentName ||
        "Chưa xác định"
    }));
  };

  const updateTask = (id, field, value) => {
    setTasks(tasks.map(t => t.id === id ? { ...t, [field]: value } : t));
  };

  const addNewTask = () => {
    setTasks([...tasks, { id: Date.now(), taskType: "System", description: "", responsible: "", dueDate: "", isRequired: false }]);
  };

  const removeTask = (id) => {
    if (tasks.length > 1) setTasks(tasks.filter(t => t.id !== id));
  };

  const handleSubmit = async () => {
    if (!formData.employeeId || !formData.startDate) {
      return toast.error("Vui lòng nhập đầy đủ thông tin nhân sự!");
    }

    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        tasks: tasks.map(({ id, ...rest }) => rest)
      };
      await onboardingsService.createPlan(payload);
      toast.success("Đã kích hoạt kế hoạch thành công!");
      onSuccess();
    } catch (err) {
      toast.error("Có lỗi xảy ra khi lưu dữ liệu");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-50 overflow-y-auto animate-in fade-in duration-300">
      {/* Top Header Bar */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border-b px-8 py-4 flex justify-between items-center z-20 shadow-sm">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">Tạo Kế Hoạch Hội Nhập</h2>
          <p className="text-slate-500 text-sm">Thiết lập lộ trình chi tiết cho nhân sự mới.</p>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="px-6 py-2 border rounded-xl font-bold text-slate-600 hover:bg-slate-50 transition-all">Hủy bỏ</button>
          <button 
            onClick={handleSubmit} 
            disabled={submitting}
            className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 transition-all"
          >
            {submitting ? "Đang xử lý..." : "Lưu kế hoạch"}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-8 space-y-8 pb-20">
        
        {/* Section 1: Employee Details */}
        <div className="bg-white rounded-2xl p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row items-center gap-8">
          <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 w-full">
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2"><User className="w-3 h-3"/> Chọn nhân viên</label>
              <select 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500/20 outline-none"
                value={formData.employeeId}
                onChange={handleEmployeeChange}
              >
                <option value="">-- Chọn nhân viên --</option>
                {employees.map(emp => <option key={emp.id} value={emp.id}>{emp.fullName}</option>)}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2"><Briefcase className="w-3 h-3"/> Vị trí công việc</label>
              <input readOnly value={formData.jobRole} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl text-slate-500 outline-none cursor-not-allowed" />
            </div>
            <div className="space-y-2">
              <label className="text-[11px] font-bold uppercase text-slate-400 flex items-center gap-2"><Calendar className="w-3 h-3"/> Ngày bắt đầu</label>
              <input 
                type="date" 
                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20"
                onChange={e => setFormData({...formData, startDate: e.target.value})}
              />
            </div>
          </div>
          <div className="w-32 h-32 bg-indigo-50 rounded-2xl flex flex-col items-center justify-center border border-indigo-100 shrink-0">
             <div className="text-indigo-600 text-[10px] font-black tracking-tighter mb-1">ONBOARDING</div>
             <div className="flex -space-x-2">
                <div className="w-10 h-10 rounded-full bg-indigo-200 border-2 border-white shadow-sm"></div>
                <div className="w-10 h-10 rounded-full bg-indigo-400 border-2 border-white shadow-sm flex items-center justify-center text-white text-xs">+</div>
             </div>
          </div>
        </div>

        {/* Section 2: Onboarding Tasks */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden px-6 py-4">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-slate-700">Danh sách nhiệm vụ</h3>
            <span className="text-[11px] font-bold px-3 py-1 bg-indigo-50 text-indigo-600 rounded-full">Đã thêm {tasks.length}</span>
          </div>

          <table className="w-full border-separate border-spacing-y-3">
            <thead>
              <tr className="text-[10px] font-bold text-slate-400 uppercase tracking-widest text-left">
                <th className="pl-4 w-40">Loại</th>
                <th className="pl-4">Mô tả</th>
                <th className="pl-4 w-52">Chịu trách nhiệm</th>
                <th className="pl-4 w-44">Thời hạn</th>
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
                      className="w-full p-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-indigo-500/10"
                    >
                      <option value="Asset">Thiết bị</option>
                      <option value="System">Hệ thống</option>
                      <option value="Document">Tài liệu</option>
                      <option value="Training">Đào tạo</option>
                    </select>
                  </td>
                  <td className="pl-4"><input placeholder="Ví dụ: Ký NDA..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" onChange={(e) => updateTask(task.id, 'description', e.target.value)} /></td>
                  <td className="pl-4"><input placeholder="Tên bộ phận..." className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" onChange={(e) => updateTask(task.id, 'responsible', e.target.value)} /></td>
                  <td className="pl-4"><input type="date" className="w-full p-2.5 border border-slate-200 rounded-xl text-sm outline-none" onChange={(e) => updateTask(task.id, 'dueDate', e.target.value)} /></td>
                  <td className="text-center"><input type="checkbox" checked={task.isRequired} className="w-5 h-5 rounded-lg border-slate-300 text-indigo-600 focus:ring-indigo-500" onChange={(e) => updateTask(task.id, 'isRequired', e.target.checked)} /></td>
                  <td className="pl-2">
                    <button onClick={() => removeTask(task.id)} className="p-2 text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <button 
            onClick={addNewTask}
            className="mt-4 w-full py-4 border-2 border-dashed border-slate-200 rounded-2xl text-indigo-600 font-bold flex items-center justify-center gap-2 hover:bg-indigo-50 hover:border-indigo-200 transition-all"
          >
            <Plus className="w-4 h-4" /> Thêm dòng nhiệm vụ mới
          </button>
        </div>

        {/* Section 3: Final Launch */}
        <div className="bg-indigo-900 rounded-3xl p-12 text-center text-white space-y-6 shadow-2xl shadow-indigo-200 relative overflow-hidden">
          <div className="relative z-10">
            <div className="w-20 h-20 bg-indigo-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner ring-8 ring-white/10">
              <Rocket className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-2xl font-bold">Kích hoạt lộ trình?</h3>
            <p className="text-indigo-200 max-w-md mx-auto text-sm">Thông báo sẽ được gửi tự động tới các bộ phận chịu trách nhiệm ngay sau khi bạn xác nhận.</p>
            <button 
              onClick={handleSubmit} 
              disabled={submitting}
              className="mt-8 px-12 py-4 bg-white text-indigo-900 rounded-2xl font-black uppercase tracking-wider hover:bg-indigo-50 transition-all disabled:opacity-50"
            >
              Xác nhận và Hoàn tất
            </button>
          </div>
          {/* Abstract background effect */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-800 rounded-full -mr-20 -mt-20 opacity-50 blur-3xl"></div>
        </div>
      </div>
    </div>
  );
}