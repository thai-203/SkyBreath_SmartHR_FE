"use client";

import React from "react";

export const Table = ({ children, className = "" }) => (
  <div className="w-full overflow-x-auto">
    <table className={`w-full border-collapse ${className}`}>
      {children}
    </table>
  </div>
);

export const THead = ({ children, className = "" }) => (
  <thead className={`bg-slate-50 border-b border-slate-200 ${className}`}>
    {children}
  </thead>
);

export const TBody = ({ children, className = "" }) => (
  <tbody className={`divide-y divide-slate-200 ${className}`}>
    {children}
  </tbody>
);

export const TR = ({ children, className = "" }) => (
  <tr className={`transition-colors hover:bg-slate-50/50 ${className}`}>
    {children}
  </tr>
);

export const TH = ({ children, className = "" }) => (
  <th className={`px-4 py-3 text-left text-sm font-semibold text-slate-700 ${className}`}>
    {children}
  </th>
);

export const TD = ({ children, className = "" }) => (
  <td className={`px-4 py-3 text-sm text-slate-600 ${className}`}>
    {children}
  </td>
);
