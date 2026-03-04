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
  employeeId: "",
  departmentId: "",
  shiftId: "",
  effectiveFrom: "",
  effectiveTo: "",
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
  const [departmentOptions, setDepartmentOptions] = useState([]);
  const [shiftOptions, setShiftOptions] = useState([]);

  const fetchOptions = async () => {
    try {
      const [empRes, deptRes, shiftRes] = await Promise.all([
        employeesService.getList(),
        departmentsService.getList(),
        workingShiftsService.getAll({ page: 1, limit: 100 }),
      ]);
      setEmployeeOptions(
        (empRes.data || []).map((e) => ({ value: e.id, label: e.fullName })),
      );
      setDepartmentOptions(
        (deptRes.data || []).map((d) => ({
          value: d.id,
          label: d.departmentName,
        })),
      );
      setShiftOptions(
        (shiftRes.data.items || []).map((s) => ({
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
      setData(res.data.items || []);
      setTotalPages(res.data.totalPages || 1);
    } catch (err) {
      error(err.response?.data?.message || "Lỗi tải danh sách");
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
      employeeId: item.employeeId || "",
      departmentId: item.employee?.departmentId || "",
      shiftId: item.shiftId || "",
      effectiveFrom: item.effectiveFrom || "",
      effectiveTo: item.effectiveTo || "",
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
        departments={departmentOptions}
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
