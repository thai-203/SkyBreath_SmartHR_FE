import React from "react";
import { TrendingUp, TrendingDown } from "lucide-react"; // Bạn có thể thêm icon nếu muốn

export default function OnboardingStatsCard({ title, value, icon, color, trend }) {
  const variants = {
    indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
    amber: "bg-amber-50 text-amber-600 border-amber-100",
    emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  };

  // Logic xử lý hiển thị tăng trưởng
  const isPositive = trend > 0;
  const isNegative = trend < 0;
  const trendColor = isPositive ? "text-emerald-500" : isNegative ? "text-rose-500" : "text-slate-400";

  return (
    <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`p-3 rounded-xl border-2 ${variants[color]}`}>
        {icon}
      </div>
      <div className="flex-1">
        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest leading-tight mb-1">
          {title}
        </p>
        <div className="flex items-baseline gap-2">
          <h3 className="text-2xl font-bold text-slate-900 tracking-tight">{value}</h3>
          
          {/* Hiển thị Tăng trưởng */}
          {trend !== undefined && (
            <div className={`flex items-center text-[11px] font-bold ${trendColor}`}>
              {isPositive && "+"}
              {trend}%
              {isPositive ? (
                <TrendingUp className="w-3 h-3 ml-0.5" />
              ) : isNegative ? (
                <TrendingDown className="w-3 h-3 ml-0.5" />
              ) : null}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}