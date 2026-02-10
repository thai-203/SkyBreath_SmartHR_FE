"use client";

import React from "react";

const colorConfig = {
  indigo: "bg-indigo-50 text-indigo-600 border-indigo-100",
  emerald: "bg-emerald-50 text-emerald-600 border-emerald-100",
  amber: "bg-amber-50 text-amber-600 border-amber-100",
  slate: "bg-slate-50 text-slate-600 border-slate-100",
};

export default function TemplateStatsCard({ title, value, icon, color = "indigo" }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-5 transition-all hover:shadow-md">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center border ${colorConfig[color]}`}>
        {icon}
      </div>
      <div>
        <p className="text-sm font-bold text-slate-500 uppercase tracking-wider">{title}</p>
        <h3 className="text-2xl font-black text-slate-900 mt-0.5">{value}</h3>
      </div>
    </div>
  );
}