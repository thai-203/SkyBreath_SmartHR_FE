
"use client";

import { useEffect, useState } from "react";
import { departmentsService } from "@/services/departments.service";
import { employeesService } from "@/services/employees.service";
import { Building2, Users, UserCheck, Search } from "lucide-react";

const SCOPE_OPTIONS = [
    { value: "ALL", label: "Tất cả nhân viên", icon: Users, desc: "Gửi đến tất cả user đang hoạt động trong hệ thống" },
    { value: "DEPARTMENT", label: "Theo phòng ban", icon: Building2, desc: "Chọn một hoặc nhiều phòng ban" },
    { value: "USERS", label: "Chọn người nhận", icon: UserCheck, desc: "Chọn từng người dùng cụ thể" },
];

export function RecipientSelector({ value, onChange }) {
    const { scope, scopeIds = [] } = value || { scope: "ALL", scopeIds: [] };

    const [departments, setDepartments] = useState([]);
    const [users, setUsers] = useState([]);
    const [searchUser, setSearchUser] = useState("");
    const [searchDept, setSearchDept] = useState("");
    const [loadingDept, setLoadingDept] = useState(false);
    const [loadingUsers, setLoadingUsers] = useState(false);

    useEffect(() => {
        if (scope === "DEPARTMENT") {
            setLoadingDept(true);
            departmentsService.getList()
                .then(res => setDepartments(res.data || []))
                .catch(() => setDepartments([]))
                .finally(() => setLoadingDept(false));
        }
        if (scope === "USERS") {
            setLoadingUsers(true);
            employeesService.getAll({ limit: 1000 })
                .then(res => {
                    // Filter to only employees that have an account (userId) and a valid email
                    const validUsers = (res.data?.items || res.data || []).filter(e => e.userId && e.companyEmail);
                    setUsers(validUsers);
                })
                .catch(() => setUsers([]))
                .finally(() => setLoadingUsers(false));
        }
    }, [scope]);

    const handleScopeChange = (newScope) => {
        onChange({ scope: newScope, scopeIds: [] });
    };

    const toggleId = (id) => {
        const next = scopeIds.includes(id)
            ? scopeIds.filter(x => x !== id)
            : [...scopeIds, id];
        onChange({ scope, scopeIds: next });
    };

    const filteredUsers = users.filter(u =>
        !searchUser ||
        u.fullName?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.companyEmail?.toLowerCase().includes(searchUser.toLowerCase()) ||
        u.employeeCode?.toLowerCase().includes(searchUser.toLowerCase())
    );

    const filteredDepartments = departments.filter(d => 
        !searchDept || 
        d.departmentName?.toLowerCase().includes(searchDept.toLowerCase())
    );

    return (
        <div className="space-y-3">
            {/* Scope selector */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {SCOPE_OPTIONS.map(opt => (
                    <button
                        key={opt.value}
                        type="button"
                        onClick={() => handleScopeChange(opt.value)}
                        className={`flex flex-col items-start gap-1 rounded-xl border-2 p-3 text-left transition-all ${
                            scope === opt.value
                                ? "border-indigo-500 bg-indigo-50 shadow-sm"
                                : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                        }`}
                    >
                        <div className="flex items-center gap-2">
                            <opt.icon className={`h-4 w-4 ${scope === opt.value ? "text-indigo-600" : "text-slate-500"}`} />
                            <span className={`text-sm font-medium ${scope === opt.value ? "text-indigo-700" : "text-slate-700"}`}>
                                {opt.label}
                            </span>
                        </div>
                        <p className="text-xs text-slate-500">{opt.desc}</p>
                    </button>
                ))}
            </div>

            {/* Department picker */}
            {scope === "DEPARTMENT" && (
                <div className="rounded-xl border shadow-sm border-slate-200 p-4">
                    <p className="mb-3 text-sm font-semibold text-slate-700">Chọn phòng ban</p>
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm phòng ban..."
                            value={searchDept}
                            onChange={e => setSearchDept(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    {loadingDept ? (
                        <p className="text-xs text-slate-400">Đang tải...</p>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-60 overflow-y-auto p-1">
                            {filteredDepartments.map(dept => {
                                const isChecked = scopeIds.includes(dept.id);
                                return (
                                    <label 
                                        key={dept.id} 
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                                            isChecked 
                                                ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                                                : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 text-indigo-600 accent-indigo-600"
                                            checked={isChecked}
                                            onChange={() => toggleId(dept.id)}
                                        />
                                        <span className={`text-sm font-medium ${isChecked ? "text-indigo-700" : "text-slate-700"}`}>
                                            {dept.departmentName}
                                        </span>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    {scopeIds.length > 0 && (
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                            <p className="text-xs font-semibold text-indigo-600">✓ Đã chọn {scopeIds.length} phòng ban</p>
                            <button onClick={() => onChange({ scope, scopeIds: [] })} className="text-xs text-slate-500 hover:text-slate-700">Bỏ chọn tất cả</button>
                        </div>
                    )}
                </div>
            )}

            {/* User picker */}
            {scope === "USERS" && (
                <div className="rounded-xl border shadow-sm border-slate-200 p-4">
                    <div className="relative mb-3">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                        <input
                            type="text"
                            placeholder="Tìm theo tên, mã NV hoặc email..."
                            value={searchUser}
                            onChange={e => setSearchUser(e.target.value)}
                            className="w-full rounded-xl border border-slate-200 pl-9 pr-3 py-2.5 text-sm outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                        />
                    </div>
                    {loadingUsers ? (
                        <p className="text-xs text-slate-400">Đang tải...</p>
                    ) : (
                        <div className="max-h-60 overflow-y-auto space-y-2 p-1">
                            {filteredUsers.map(u => {
                                const isChecked = scopeIds.includes(u.userId);
                                return (
                                    <label 
                                        key={u.id} 
                                        className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition-all ${
                                            isChecked 
                                                ? "border-indigo-500 bg-indigo-50 shadow-sm" 
                                                : "border-slate-200 hover:border-indigo-200 hover:bg-slate-50"
                                        }`}
                                    >
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 rounded border-slate-300 accent-indigo-600"
                                            checked={isChecked}
                                            onChange={() => toggleId(u.userId)}
                                        />
                                        <div className={`flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold shrink-0 ${
                                            isChecked ? "bg-indigo-200 text-indigo-800" : "bg-slate-100 text-slate-600"
                                        }`}>
                                            {u.avatar ? (
                                                <img src={u.avatar} alt="avatar" className="h-full w-full rounded-full object-cover" />
                                            ) : (
                                                u.fullName?.[0]?.toUpperCase() || "U"
                                            )}
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <p className={`text-sm font-medium truncate ${isChecked ? "text-indigo-800" : "text-slate-700"}`}>
                                                {u.fullName} {u.employeeCode && <span className="text-xs font-normal text-slate-500 ml-1">({u.employeeCode})</span>}
                                            </p>
                                            <p className={`text-xs truncate ${isChecked ? "text-indigo-600/80" : "text-slate-500"}`}>
                                                {u.position?.positionName || u.companyEmail}
                                            </p>
                                        </div>
                                    </label>
                                );
                            })}
                        </div>
                    )}
                    {scopeIds.length > 0 && (
                        <div className="mt-3 flex items-center justify-between border-t border-slate-100 pt-2">
                            <p className="text-xs font-semibold text-indigo-600">✓ Đã chọn {scopeIds.length} người nhận</p>
                            <button onClick={() => onChange({ scope, scopeIds: [] })} className="text-xs text-slate-500 hover:text-slate-700">Bỏ chọn tất cả</button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
