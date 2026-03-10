"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { useToast } from "@/components/common/Toast";
import { shiftAssignmentsService, userService } from "@/services";

export default function PersonalSchedulePage() {
  const { error } = useToast();
  const [monthYear, setMonthYear] = useState("");
  const [schedule, setSchedule] = useState([]);
  const [loading, setLoading] = useState(false);
  const [employeeId, setEmployeeId] = useState(null);

  useEffect(() => {
    // load current user profile to obtain employeeId
    const loadProfile = async () => {
      try {
        const data = await userService.getProfile();
        if (data.employeeId) setEmployeeId(data.employeeId);
      } catch (err) {
        console.error(err);
      }
    };
    loadProfile();
  }, []);

  const fetchSchedule = async () => {
    if (!monthYear || !employeeId) return;
    const [year, month] = monthYear.split("-").map(Number);
    setLoading(true);
    try {
      const res = await shiftAssignmentsService.getEmployeeSchedule(
        employeeId,
        month,
        year,
      );
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

    const row = {
      name: schedule[0]?.employee?.fullName || "",
      items: schedule,
    };

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
          {assignment ? assignment.shift?.shiftName : null}
        </td>,
      );
    }

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="border p-2">Nhân viên</th>
              {headerCells}
            </tr>
          </thead>
          <tbody>
            <tr className="hover:bg-slate-50">
              <td className="border p-2 font-medium">{row.name}</td>
              {cells}
            </tr>
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div>
      <PageTitle title="Lịch làm việc của tôi" />
      <div className="mb-4 flex items-center gap-4">
        <label>Tháng</label>
        <Input
          type="month"
          value={monthYear}
          onChange={(e) => setMonthYear(e.target.value)}
        />
        <Button
          onClick={fetchSchedule}
          disabled={loading || !monthYear || !employeeId}
        >
          {loading ? "Đang tải..." : "Xem lịch"}
        </Button>
      </div>
      <div>{renderTable()}</div>
    </div>
  );
}
