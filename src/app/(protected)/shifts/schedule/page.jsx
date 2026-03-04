"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useToast } from "@/components/common/Toast";
import { employeesService, departmentsService, shiftAssignmentsService } from "@/services";

export default function SchedulePage() {
    const { error } = useToast();
    const [mode, setMode] = useState("employee"); // 'employee' or 'department'
    const [employees, setEmployees] = useState([]);
    const [departments, setDepartments] = useState([]);
    const [selectedEmployee, setSelectedEmployee] = useState("");
    const [selectedDepartment, setSelectedDepartment] = useState("");
    const [monthYear, setMonthYear] = useState("");
    const [schedule, setSchedule] = useState([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        const fetchOptions = async () => {
            try {
                const [empRes, deptRes] = await Promise.all([
                    employeesService.getList(),
                    departmentsService.getList(),
                ]);
                setEmployees((empRes.data || []).map(e => ({ value: e.id, label: e.fullName })));
                setDepartments((deptRes.data || []).map(d => ({ value: d.id, label: d.departmentName })));
            } catch (err) {
                console.error(err);
            }
        };
        fetchOptions();
    }, []);

    const fetchSchedule = async () => {
        if (!monthYear) return;
        const [year, month] = monthYear.split("-").map(Number);
        setLoading(true);
        try {
            let res;
            if (mode === "employee") {
                if (!selectedEmployee) return;
                res = await shiftAssignmentsService.getEmployeeSchedule(selectedEmployee, month, year);
            } else {
                if (!selectedDepartment) return;
                res = await shiftAssignmentsService.getDepartmentSchedule(selectedDepartment, month, year);
            }
            setSchedule(res.data || []);
        } catch (err) {
            error(err.response?.data?.message || "Lỗi tải lịch");
        } finally {
            setLoading(false);
        }
    };

    const renderTable = () => {
        if (!schedule.length) {
            return <p className="text-center text-slate-500">Không có lịch nào</p>;
        }

        const [year, month] = monthYear.split("-").map(Number);
        const days = new Date(year, month, 0).getDate();
        const rows = [];
        for (let d = 1; d <= days; d++) {
            const date = new Date(year, month - 1, d);
            const assignment = schedule.find(a => {
                const from = a.effectiveFrom ? new Date(a.effectiveFrom) : null;
                const to = a.effectiveTo ? new Date(a.effectiveTo) : null;
                if (from && date < from) return false;
                if (to && date > to) return false;
                return true;
            });
            rows.push({ day: d, shift: assignment ? assignment.shift?.shiftName || "" : "" });
        }

        return (
            <table className="w-full border-collapse">
                <thead>
                    <tr>
                        <th className="border p-2">Ngày</th>
                        <th className="border p-2">Ca</th>
                    </tr>
                </thead>
                <tbody>
                    {rows.map(r => (
                        <tr key={r.day} className="hover:bg-slate-50">
                            <td className="border p-2 text-center">{r.day}</td>
                            <td className="border p-2">{r.shift}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    };

    return (
        <div>
            <PageTitle title="Xem lịch ca" />
            <div className="grid gap-4 mb-4">
                <div className="flex items-center gap-4">
                    <label>Lọc theo</label>
                    <select value={mode} onChange={(e) => setMode(e.target.value)} className="border rounded px-2 py-1">
                        <option value="employee">Nhân viên</option>
                        <option value="department">Phòng ban</option>
                    </select>
                </div>
                {mode === "employee" ? (
                    <div className="flex items-center gap-2">
                        <label>Nhân viên</label>
                        <select
                            value={selectedEmployee}
                            onChange={(e) => setSelectedEmployee(e.target.value)}
                            className="border rounded px-2 py-1"
                        >
                            <option value="">--Chọn--</option>
                            {employees.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                    </div>
                ) : (
                    <div className="flex items-center gap-2">
                        <label>Phòng ban</label>
                        <select
                            value={selectedDepartment}
                            onChange={(e) => setSelectedDepartment(e.target.value)}
                            className="border rounded px-2 py-1"
                        >
                            <option value="">--Chọn--</option>
                            {departments.map(o => (<option key={o.value} value={o.value}>{o.label}</option>))}
                        </select>
                    </div>
                )}
                <div className="flex items-center gap-2">
                    <label>Tháng</label>
                    <Input type="month" value={monthYear} onChange={(e) => setMonthYear(e.target.value)} />
                </div>
                <Button onClick={fetchSchedule} disabled={loading || !monthYear || (mode === "employee" ? !selectedEmployee : !selectedDepartment)}>
                    {loading ? "Đang tải..." : "Xem lịch"}
                </Button>
            </div>
            <div>{renderTable()}</div>
        </div>
    );
}
