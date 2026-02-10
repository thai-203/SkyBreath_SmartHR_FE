import React from "react";

export default function OnboardingPlansTable({ plans, loading }) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-20 space-y-4">
        <div className="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="text-slate-500 font-medium">Đang tải dữ liệu...</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left">
        <thead className="bg-slate-50 border-b border-slate-100">
          <tr>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nhân sự</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Vị trí</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Ngày bắt đầu</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Trạng thái</th>
            <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tiến độ</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {plans.map((plan) => (
            <tr key={plan.id} className="hover:bg-slate-50 transition-colors">
              <td className="px-6 py-4">
                <div className="font-bold text-slate-900">{plan.employeeName}</div>
                <div className="text-xs text-slate-500">{plan.email}</div>
              </td>
              <td className="px-6 py-4 text-sm font-medium text-slate-600">{plan.position}</td>
              <td className="px-6 py-4 text-sm text-slate-500">{plan.startDate}</td>
              <td className="px-6 py-4">
                <StatusBadge status={plan.status} />
              </td>
              <td className="px-6 py-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500" style={{ width: `${plan.progress}%` }}></div>
                  </div>
                  <span className="text-xs font-bold text-slate-700">{plan.progress}%</span>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function StatusBadge({ status }) {
  const configs = {
    completed: { label: "Hoàn thành", class: "bg-emerald-50 text-emerald-700 border-emerald-100" },
    in_progress: { label: "Đang thực hiện", class: "bg-indigo-50 text-indigo-700 border-indigo-100" },
    not_started: { label: "Chưa bắt đầu", class: "bg-slate-100 text-slate-600 border-slate-200" },
  };
  const config = configs[status] || configs.not_started;
  return (
    <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold border ${config.class}`}>
      {config.label}
    </span>
  );
}