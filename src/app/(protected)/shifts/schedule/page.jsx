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
  workingShiftsService,
} from "@/services";

export default function SchedulePage() {
  const { error } = useToast();
  // controls
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);
  const [filterDept, setFilterDept] = useState("");
  const [filterShift, setFilterShift] = useState("");
  const [keyword, setKeyword] = useState("");
  const [startDate, setStartDate] = useState(() => {
    const now = new Date();
    const day = now.getDay();
    // compute Monday of current week (1)
    const diff = (day + 6) % 7; // days since Monday
    const monday = new Date(now);
    monday.setDate(now.getDate() - diff);
    return monday.toISOString().slice(0, 10);
  });
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [empRes, deptRes, shiftRes] = await Promise.all([
          employeesService.getList(),
          departmentsService.getList(),
          workingShiftsService.getList(),
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
        setShiftOptions(
          (shiftRes.data || []).map((s) => ({
            value: s.id,
            label: s.shiftName,
          })),
        );
      } catch (err) {
        console.error(err);
      }
    };
    fetchOptions();
  }, []);

  // reload schedule whenever week or filters change
  useEffect(() => {
    fetchSchedule();
  }, [startDate, filterDept, filterShift, keyword]);

  const fetchSchedule = async () => {
    setLoading(true);
    try {
      const sd = new Date(startDate);
      const ed = new Date(sd);
      ed.setDate(sd.getDate() + 6);
      const params = {
        startDate: sd.toISOString().slice(0, 10),
        endDate: ed.toISOString().slice(0, 10),
      };
      if (filterDept) params.departmentId = filterDept;
      if (filterShift) params.shiftId = filterShift;
      if (keyword) params.keyword = keyword;
      const res = await shiftAssignmentsService.getSchedules(params);
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

    const sd = new Date(startDate);
    const ed = new Date(sd);
    ed.setDate(sd.getDate() + 6);

    const days = [];
    for (let d = new Date(sd); d <= ed; d.setDate(d.getDate() + 1)) {
      days.push(new Date(d));
    }

    // group schedule items by employee name
    const byEmp = {};
    schedule.forEach((a) => {
      const name = a.employee?.fullName || "(không tên)";
      if (!byEmp[name]) byEmp[name] = [];
      byEmp[name].push(a);
    });
    const rows = Object.keys(byEmp).map((name) => ({
      name,
      items: byEmp[name],
    }));

    const renderRow = (row) => {
      const cells = days.map((date) => {
        const str = date.toISOString().slice(0, 10);
        const assignmentsForDate = row.items.filter((a) => a.date === str);
        const label = assignmentsForDate
          .map((a) => a.shift?.shiftName)
          .filter(Boolean)
          .join(", ");
        return (
          <td key={str} className="border p-2 text-center text-sm">
            {label || null}
          </td>
        );
      });
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
              {days.map((date) => (
                <th
                  key={date.toISOString()}
                  className="border p-2 text-center text-xs"
                >
                  {`Thứ ${date.getDay() === 0 ? 7 : date.getDay()}`}
                  <br />
                  {`${String(date.getDate()).padStart(2, "0")}/${String(
                    date.getMonth() + 1,
                  ).padStart(2, "0")}`}
                </th>
              ))}
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
        <div className="flex flex-wrap items-center gap-4">
          <label>Phòng ban</label>
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">--Tất cả--</option>
            {departments.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label>Ca</label>
          <select
            value={filterShift}
            onChange={(e) => setFilterShift(e.target.value)}
            className="border rounded px-2 py-1"
          >
            <option value="">--Tất cả--</option>
            {shiftOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <label>Từ ngày</label>
          <Input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="border rounded"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const sd = new Date(startDate);
              sd.setDate(sd.getDate() - 7);
              setStartDate(sd.toISOString().slice(0, 10));
            }}
          >
            &lt;
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const sd = new Date(startDate);
              sd.setDate(sd.getDate() + 7);
              setStartDate(sd.toISOString().slice(0, 10));
            }}
          >
            &gt;
          </Button>

          <label>Tìm kiếm</label>
          <Input
            type="text"
            placeholder="Nhân viên hoặc mã"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
          />

          <Button onClick={fetchSchedule} disabled={loading || !startDate}>
            {loading ? "Đang tải..." : "Xem"}
          </Button>
        </div>
      </div>
      <div>{renderTable()}</div>
    </div>
  );
}
