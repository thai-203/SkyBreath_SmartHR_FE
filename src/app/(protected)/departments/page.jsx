"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { departmentsService, employeesService } from "@/services";
import { Plus, Download } from "lucide-react";
import { validate, required, unique } from "@/lib/validation";

// Local components
import DepartmentTable from "./components/DepartmentTable";
import DepartmentFormModal from "./components/DepartmentFormModal";
import DepartmentDeleteModal from "./components/DepartmentDeleteModal";

const initialFormData = {
    departmentName: "",
    parentDepartmentId: "",
    managerEmployeeId: "",
};

export default function DepartmentsPage() {
    const { success, error } = useToast();

    // Data states
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(1);

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedDepartment, setSelectedDepartment] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    // Dropdown data
    const [departmentList, setDepartmentList] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);

    // ==================== API Calls ====================
    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await departmentsService.getAll({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search,
            });
            setData(response.data || []);
            setTotalPages(response.meta?.totalPages || 1);
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };

    const fetchDropdownData = async () => {
        try {
            const [deptRes, empRes] = await Promise.all([
                departmentsService.getList(),
                employeesService.getList(),
            ]);
            setDepartmentList(
                (deptRes.data || []).map((d) => ({
                    value: d.id,
                    label: d.departmentName,
                }))
            );
            setEmployeeList(
                (empRes.data || []).map((e) => ({
                    value: e.id,
                    label: e.fullName,
                }))
            );
        } catch (err) {
            console.error("Error fetching dropdown data:", err);
        }
    };

    useEffect(() => {
        fetchDepartments();
    }, [pagination.pageIndex, pagination.pageSize, search]);

    useEffect(() => {
        fetchDropdownData();
    }, []);

    // ==================== Handlers ====================
    const handleCreate = () => {
        setFormData(initialFormData);
        setErrors({});
        setIsCreateOpen(true);
    };

    const handleEdit = (department) => {
        setSelectedDepartment(department);
        setFormData({
            departmentName: department.departmentName,
            parentDepartmentId: department.parentDepartmentId || "",
            managerEmployeeId: department.managerEmployeeId || "",
        });
        setErrors({});
        setIsEditOpen(true);
    };

    const handleDeleteClick = (department) => {
        setSelectedDepartment(department);
        setIsDeleteOpen(true);
    };

    const validateForm = () => {
        const validationErrors = validate(formData, {
            departmentName: [
                required("Tên phòng ban là bắt buộc"),
                unique(departmentList, selectedDepartment?.id, "Tên phòng ban đã tồn tại"),
            ],
        });
        if (validationErrors) {
            setErrors(validationErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const handleSubmitCreate = async () => {
        if (!validateForm()) return;

        setFormLoading(true);
        try {
            const response = await departmentsService.create({
                departmentName: formData.departmentName,
                parentDepartmentId: formData.parentDepartmentId ? Number(formData.parentDepartmentId) : undefined,
                managerEmployeeId: formData.managerEmployeeId ? Number(formData.managerEmployeeId) : undefined,
            });
            success(response.message);
            setIsCreateOpen(false);
            fetchDepartments();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitEdit = async () => {
        if (!validateForm()) return;

        setFormLoading(true);
        try {
            const response = await departmentsService.update(selectedDepartment.id, {
                departmentName: formData.departmentName,
                parentDepartmentId: formData.parentDepartmentId ? Number(formData.parentDepartmentId) : undefined,
                managerEmployeeId: formData.managerEmployeeId ? Number(formData.managerEmployeeId) : undefined,
            });
            success(response.message);
            setIsEditOpen(false);
            fetchDepartments();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const response = await departmentsService.delete(selectedDepartment.id);
            success(response.message);
            setIsDeleteOpen(false);
            fetchDepartments();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const blob = await departmentsService.export();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `departments_${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            success("Xuất dữ liệu thành công!");
        } catch (err) {
            error(err.response?.data?.message || "Xuất dữ liệu thất bại");
        } finally {
            setExportLoading(false);
        }
    };

    // ==================== Render ====================
    return (
        <div className="space-y-6">
            <PageTitle title="Phòng ban" />

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý phòng ban</h1>
                    <p className="text-slate-500">Danh sách tất cả phòng ban trong công ty</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport} loading={exportLoading}>
                        <Download className="mr-2 h-4 w-4" />
                        Xuất Excel
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Thêm phòng ban
                    </Button>
                </div>
            </div>

            {/* Table */}
            <DepartmentTable
                data={data}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalPages={totalPages}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            {/* Create Modal */}
            <DepartmentFormModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleSubmitCreate}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                departmentList={departmentList}
                employeeList={employeeList}
                loading={formLoading}
                mode="create"
            />

            {/* Edit Modal */}
            <DepartmentFormModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleSubmitEdit}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                departmentList={departmentList}
                employeeList={employeeList}
                loading={formLoading}
                mode="edit"
                selectedDepartment={selectedDepartment}
            />

            {/* Delete Modal */}
            <DepartmentDeleteModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                department={selectedDepartment}
                loading={formLoading}
            />
        </div>
    );
}
