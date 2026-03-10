"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useToast } from "@/components/common/Toast";
import {
  employeesService,
  departmentsService,
  shiftAssignmentsService,
} from "@/services";

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
        setEmployees(
          (empRes.data || []).map((e) => ({ value: e.id, label: e.fullName })),
        );
        setDepartments(
          (deptRes.data || []).map((d) => ({
            value: d.id,
            label: d.departmentName,
          })),
        );
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
        res = await shiftAssignmentsService.getEmployeeSchedule(
          selectedEmployee,
          month,
          year,
        );
      } else {
        if (!selectedDepartment) return;
        res = await shiftAssignmentsService.getDepartmentSchedule(
          selectedDepartment,
          month,
          year,
        );
      }
      setSchedule(res.data || []);
    } catch (err) {
      error(err.response?.data?.message || "Lỗi tải lịch");
    } finally {
      setLoading(false);
    }
  };

  const renderTable = () => {
    if (!schedule.length || !monthYear) {
      return <p className="text-center text-slate-500">Không có lịch nào</p>;
    }

    const [year, month] = monthYear.split("-").map(Number);
    const days = new Date(year, month, 0).getDate();

    // create header days array with week day names
    const headerCells = [];
    for (let d = 1; d <= days; d++) {
      const date = new Date(year, month - 1, d);
      headerCells.push(
        <th key={d} className="border p-2 text-center text-xs">
          {`Thứ ${date.getDay() === 0 ? 7 : date.getDay()}`}
          <br />
          {`${String(d).padStart(2, "0")}/${String(month).padStart(2, "0")}`}
        </th>,
      );
    }

    // group schedule items by employee (if department) or single row for employee
    const rows = [];
    if (mode === "department") {
      const byEmp = {};
      schedule.forEach((a) => {
        const name = a.employee?.fullName || "(không tên)";
        if (!byEmp[name]) byEmp[name] = [];
        byEmp[name].push(a);
      });
      Object.keys(byEmp).forEach((name) => {
        rows.push({ name, items: byEmp[name] });
      });
    } else {
      rows.push({
        name: schedule[0]?.employee?.fullName || "",
        items: schedule,
      });
    }

    const renderRow = (row) => {
      const cells = [];
      for (let d = 1; d <= days; d++) {
        const date = new Date(year, month - 1, d);
        const assignment = row.items.find((a) => {
          const from = a.effectiveFrom ? new Date(a.effectiveFrom) : null;
          const to = a.effectiveTo ? new Date(a.effectiveTo) : null;
          if (from && date < from) return false;
          if (to && date > to) return false;
          return true;
        });
        cells.push(
          <td key={d} className="border p-2 text-center text-sm">
            {assignment ? (
              <span>{assignment.shift?.shiftName || ""}</span>
            ) : null}
          </td>,
        );
      }
      return (
        <tr key={row.name} className="hover:bg-slate-50">
          <td className="border p-2 font-medium">{row.name}</td>
          {cells}
        </tr>
      );
    };

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Nhân viên</th>
              {headerCells}
            </tr>
          </thead>
          <tbody>{rows.map(renderRow)}</tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <PageTitle title="Xem lịch ca" />
      <div className="grid gap-4 mb-4">
        <div className="flex items-center gap-4">
          <label>Lọc theo</label>
          <select
            value={mode}
            onChange={(e) => setMode(e.target.value)}
            className="border rounded px-2 py-1"
          >
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
              {employees.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
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
              {departments.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <label>Tháng</label>
          <Input
            type="month"
            value={monthYear}
            onChange={(e) => setMonthYear(e.target.value)}
          />
        </div>
        <Button
          onClick={fetchSchedule}
          disabled={
            loading ||
            !monthYear ||
            (mode === "employee" ? !selectedEmployee : !selectedDepartment)
          }
        >
          {loading ? "Đang tải..." : "Xem lịch"}
        </Button>
      </div>
      <div>{renderTable()}</div>
    </div>
  );
}
