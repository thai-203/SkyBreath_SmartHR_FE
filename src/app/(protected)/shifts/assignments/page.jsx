"use client";

import { useState, useEffect } from "react";
import { Plus } from "lucide-react";
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

const initialData = {
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

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [selected, setSelected] = useState(null);
  const [formData, setFormData] = useState(initialData);
  const [formLoading, setFormLoading] = useState(false);

  const [employeeOptions, setEmployeeOptions] = useState([]);
  const [employeeList, setEmployeeList] = useState([]); // full objects for tree
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [departmentList, setDepartmentList] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);

  const fetchOptions = async () => {
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
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await shiftAssignmentsService.list({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
      });
      console.log(res);
      setData(res.items || []);
      setTotalPages(res.totalPages || 1);
    } catch (err) {
      error(err.response?.message || "Lỗi tải danh sách");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    fetchOptions();
  }, [pagination]);

  const handleCreate = () => {
    setSelected(null);
    setFormData(initialData);
    setIsFormOpen(true);
  };
  const handleEdit = (item) => {
    setSelected(item);
    setFormData({
      // prefer original metadata arrays if present
      employeeIds: item.employeeIds
        ? item.employeeIds.split(",").map(Number)
        : item.employeeId
          ? [item.employeeId]
          : [],
      departmentIds: item.departmentIds
        ? item.departmentIds.split(",").map(Number)
        : item.departmentId
          ? [item.departmentId]
          : [],
      shiftIds: item.shiftIds
        ? item.shiftIds.split(",").map(Number)
        : item.shiftId
          ? [item.shiftId]
          : [],
      startDate: item.effectiveFrom || "",
      endDate: item.effectiveTo || "",
      weekdays: item.weekdays ? item.weekdays.split(",").map(Number) : [],
      repeatType: item.repeatType || "weekly",
    });
    setIsFormOpen(true);
  };
  const handleDelete = (item) => {
    setSelected(item);
    setIsDeleteOpen(true);
  };

  const submitForm = async () => {
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
    <div>
      <PageTitle title="Quản lý phân ca" />
      <div className="mb-4 flex justify-end">
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
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <AssignmentFormModal
        open={isFormOpen}
        loading={formLoading}
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
    </div>
  );
}
