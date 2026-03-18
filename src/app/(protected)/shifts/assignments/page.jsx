"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Search, Filter } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import {
  shiftAssignmentsService,
  employeesService,
  departmentsService,
  workingShiftsService,
} from "@/services";

import AssignmentTable from "./components/AssignmentTable";
import AssignmentFormModal from "./components/AssignmentFormModal";
import AssignmentDeleteModal from "./components/AssignmentDeleteModal";
import AssignmentDetailModal from "./components/AssignmentDetailModal";

const initialData = {
  assignmentName: "",
  employeeIds: [],
  departmentIds: [],
  shiftIds: [],
  startDate: "",
  endDate: "",
  weekdays: [],
  repeatType: "weekly",
};

export default function AssignmentsPage() {
  const { success, error } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("");
  const [shiftFilter, setShiftFilter] = useState("");

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [formLoading, setFormLoading] = useState(false);

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeList, setEmployeeList] = useState([]); // full objects for tree
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);

  const fetchOptions = useCallback(async () => {
    try {
      // need full employee objects (including departmentId) to show tree
      const [empAllRes, deptRes, shiftRes] = await Promise.all([
        employeesService.getAll({ page: 1, limit: 1000 }),
        departmentsService.getList(),
        workingShiftsService.getList(),
      ]);
      const emps = empAllRes.data?.items || [];
      const deps = deptRes.data || [];
      setEmployeeList(emps);
      setDepartmentList(deps);
      setEmployeeOptions(emps.map((e) => ({ value: e.id, label: e.fullName })));
      setDepartmentOptions(
        deps.map((d) => ({
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
  }, []);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await shiftAssignmentsService.list({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: search || undefined,
        departmentId: departmentFilter || undefined,
        shiftId: shiftFilter || undefined,
      });
      setData(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      error(err.response?.data?.message || "Lỗi tải danh sách");
    } finally {
      setLoading(false);
    }
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    search,
    departmentFilter,
    shiftFilter,
    error,
  ]);

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [fetchData, fetchOptions]);

  useEffect(() => {
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  }, [search, departmentFilter, shiftFilter]);

  const handleCreate = () => {
    setSelected(null);
    setFormData(initialData);
    setIsFormOpen(true);
  };
  const handleEdit = (item) => {
    setSelected(item);
    setFormData({
      assignmentName: item.assignmentName || "",
      employeeIds: Array.isArray(item.employeeIds) ? item.employeeIds : [],
      departmentIds: Array.isArray(item.departmentIds)
        ? item.departmentIds
        : [],
      shiftIds: Array.isArray(item.shiftIds) ? item.shiftIds : [],
      startDate: item.effectiveFrom || "",
      endDate: item.effectiveTo || "",
      weekdays: Array.isArray(item.weekdays) ? item.weekdays : [],
      repeatType: item.repeatType || "weekly",
    });
    setIsFormOpen(true);
  };
  const handleDelete = (item) => {
    setSelected(item);
    setIsDeleteOpen(true);
  };

  const handleView = (item) => {
    setSelected(item);
    setIsDetailOpen(true);
  };

  const submitForm = async () => {
    if (!formData.assignmentName || !formData.assignmentName.trim()) {
      return error("Vui lòng nhập tên bản phân ca");
    }

    // client-side sanity checks before hitting the API
    if (
      (!formData.shiftIds || formData.shiftIds.length === 0) &&
      !formData.shiftId
    ) {
      return error("Vui lòng chọn ít nhất một ca làm việc");
    }
    if (
      formData.startDate &&
      formData.endDate &&
      new Date(formData.startDate) > new Date(formData.endDate)
    ) {
      return error("Ngày bắt đầu phải trước hoặc bằng ngày kết thúc");
    }
    if (
      (formData.repeatType === "weekly" || formData.repeatType === "2weeks") &&
      (!formData.weekdays || formData.weekdays.length === 0)
    ) {
      return error("Khi chọn lặp hàng tuần/2 tuần phải chọn ít nhất một thứ");
    }
    if (
      (!formData.employeeIds || formData.employeeIds.length === 0) &&
      (!formData.departmentIds || formData.departmentIds.length === 0)
    ) {
      return error("Phải chọn nhân viên hoặc phòng ban");
    }

    setFormLoading(true);
    try {
      if (selected) {
        await shiftAssignmentsService.update(selected.id, formData);
        success("Cập nhật phân ca thành công");
      } else {
        // send payload to create route -- service will handle employees or departments arrays
        await shiftAssignmentsService.assignToEmployee(formData);
        success("Phân ca thành công");
      }
      setIsFormOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Lỗi");
    } finally {
      setFormLoading(false);
    }
  };

  const confirmDelete = async () => {
    setFormLoading(true);
    try {
      await shiftAssignmentsService.cancel(selected.id);
      success("Hủy phân ca thành công");
      setIsDeleteOpen(false);
      fetchData();
    } catch (err) {
      error(err.response?.data?.message || "Lỗi");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <PageTitle title="Quản lý phân ca" />
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="relative w-full md:max-w-md">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm tên bảng, ca làm, phòng ban, đối tượng"
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pl-10 pr-3 text-sm outline-none ring-0 transition focus:border-blue-500"
            />
          </div>
          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="flex items-center gap-2 rounded-lg border border-slate-200 px-3">
              <Filter size={16} className="text-slate-400" />
              <select
                value={departmentFilter}
                onChange={(e) => setDepartmentFilter(e.target.value)}
                className="h-10 bg-transparent text-sm outline-none"
              >
                <option value="">Tất cả phòng ban</option>
                {departmentOptions.map((dept) => (
                  <option key={dept.value} value={dept.value}>
                    {dept.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="rounded-lg border border-slate-200 px-3">
              <select
                value={shiftFilter}
                onChange={(e) => setShiftFilter(e.target.value)}
                className="h-10 bg-transparent text-sm outline-none"
              >
                <option value="">Tất cả ca làm</option>
                {shiftOptions.map((shift) => (
                  <option key={shift.value} value={shift.value}>
                    {shift.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-end">
        <Button onClick={handleCreate} icon={<Plus />}>
          Phân ca
        </Button>
      </div>
      <AssignmentTable
        data={data}
        loading={loading}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalPages={totalPages}
        onView={handleView}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <AssignmentFormModal
        open={isFormOpen}
        loading={formLoading}
        isEditing={!!selected}
        data={formData}
        setData={setFormData}
        employees={employeeOptions}
        employeeList={employeeList}
        departments={departmentOptions}
        departmentList={departmentList}
        shifts={shiftOptions}
        onClose={() => setIsFormOpen(false)}
        onSubmit={submitForm}
      />
      <AssignmentDeleteModal
        open={isDeleteOpen}
        loading={formLoading}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={confirmDelete}
      />
      <AssignmentDetailModal
        open={isDetailOpen}
        data={selected}
        onClose={() => setIsDetailOpen(false)}
      />
    </div>
  );
}
