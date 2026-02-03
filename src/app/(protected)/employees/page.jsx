"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus, Download } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { employeesService } from "@/services";
import { validate, required, email, uniqueField } from "@/lib/validation";

// Local components
import EmployeeTable from "./components/EmployeeTable";
import EmployeeFormModal from "./components/EmployeeFormModal";
import EmployeeDeleteModal from "./components/EmployeeDeleteModal";

export default function EmployeesPage() {
    const { success, error: toastError } = useToast();

    // Data state
    const [employees, setEmployees] = useState([]);
    const [metadata, setMetadata] = useState({});
    const [validationData, setValidationData] = useState([]);
    const [loading, setLoading] = useState(true);
    const [exportLoading, setExportLoading] = useState(false);
    const [totalPages, setTotalPages] = useState(0);

    // UI state
    const [search, setSearch] = useState("");
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [isFormOpen, setIsFormOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [modalMode, setModalMode] = useState("create");
    const [submitting, setSubmitting] = useState(false);

    // Form state
    const [selectedEmployee, setSelectedEmployee] = useState(null);
    const [formData, setFormData] = useState({});
    const [errors, setErrors] = useState({});

    const fetchMetadata = async () => {
        try {
            const [metaRes, validRes] = await Promise.all([
                employeesService.getMetadata(),
                employeesService.getValidationData()
            ]);
            setMetadata(metaRes.data || {});
            setValidationData(validRes.data || []);
        } catch (error) {
            toastError("Không thể tải dữ liệu cấu hình");
        }
    };

    const fetchEmployees = useCallback(async () => {
        setLoading(true);
        try {
            const result = await employeesService.getAll({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: search,
            });
            const data = result.data || {};
            setEmployees(data.items || []);
            setTotalPages(data.totalPages || 0);
        } catch (error) {
            toastError("Không thể tải danh sách nhân viên");
        } finally {
            setLoading(false);
        }
    }, [pagination, search, toastError]);

    useEffect(() => {
        fetchMetadata();
    }, []);

    useEffect(() => {
        fetchEmployees();
    }, [pagination.pageIndex, pagination.pageSize, search]);

    const handleCreate = () => {
        setSelectedEmployee(null);
        setFormData({
            employmentStatus: "PROBATION",
            gender: "MALE",
            maritalStatus: "SINGLE",
        });
        setModalMode("create");
        setErrors({});
        setIsFormOpen(true);
    };

    const handleEdit = async (employee) => {
        setLoading(true);
        try {
            const result = await employeesService.getById(employee.id);
            const fullData = result.data || {};
            setSelectedEmployee(fullData);
            setFormData(fullData);
            setModalMode("edit");
            setErrors({});
            setIsFormOpen(true);
        } catch (error) {
            toastError("Không thể lấy thông tin chi tiết nhân viên");
        } finally {
            setLoading(false);
        }
    };

    const handleDelete = (employee) => {
        setSelectedEmployee(employee);
        setIsDeleteOpen(true);
    };

    const validateForm = () => {
        const rules = {
            fullName: [required("Họ tên là bắt buộc")],
            companyEmail: [
                required("Email công ty là bắt buộc"),
                email("Email không hợp lệ"),
                uniqueField(validationData, "companyEmail", selectedEmployee?.id, "Email công ty đã tồn tại"),
            ],
            personalEmail: [
                email("Email không hợp lệ"),
                uniqueField(validationData, "personalEmail", selectedEmployee?.id, "Email cá nhân đã tồn tại"),
            ],
            phoneNumber: [
                uniqueField(validationData, "phoneNumber", selectedEmployee?.id, "Số điện thoại đã tồn tại"),
            ],
            nationalId: [
                uniqueField(validationData, "nationalId", selectedEmployee?.id, "Số CCCD đã tồn tại"),
            ],
            departmentId: [required("Phòng ban là bắt buộc")],
            positionId: [required("Vị trí là bắt buộc")],
            jobGradeId: [required("Cấp bậc là bắt buộc")],
        };

        const validationErrors = validate(formData, rules);
        if (validationErrors) {
            setErrors(validationErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const handleFormSubmit = async () => {
        if (!validateForm()) {
            toastError("Vui lòng kiểm tra lại các trường thông tin bắt buộc");
            return;
        }
        setSubmitting(true);
        try {
            const data = new FormData();
            const excludeKeys = ['id', 'createdAt', 'updatedAt', 'deletedAt', 'isDeleted', 'user', 'department', 'position', 'jobGrade', 'directManager', 'hrMentor'];

            Object.keys(formData).forEach((key) => {
                if (excludeKeys.includes(key)) return;

                if (formData[key] !== undefined && formData[key] !== null) {
                    data.append(key, formData[key]);
                }
            });

            if (modalMode === "create") {
                await employeesService.create(data);
                success("Đã tạo nhân viên mới và gửi mail thông tin tài khoản");
            } else {
                await employeesService.update(selectedEmployee.id, data);
                success("Đã cập nhật thông tin nhân viên");
            }
            setIsFormOpen(false);
            fetchEmployees();
        } catch (error) {
            toastError(error.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setSubmitting(false);
        }
    };

    const confirmDelete = async () => {
        setSubmitting(true);
        try {
            await employeesService.delete(selectedEmployee.id);
            success("Đã xóa nhân viên");
            setIsDeleteOpen(false);
            fetchEmployees();
        } catch (error) {
            toastError("Không thể xóa nhân viên");
        } finally {
            setSubmitting(false);
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const blob = await employeesService.exportExcel();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `employees_${new Date().toISOString().split("T")[0]}.xlsx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            success("Xuất dữ liệu thành công!");
        } catch (err) {
            toastError("Xuất dữ liệu thất bại");
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <PageTitle
                    title="Quản lý Nhân viên"
                    subtitle="Xem và quản lý hồ sơ nhân sự trong hệ thống"
                />
                <div className="flex items-center gap-2">
                    <Button variant="outline" className="hidden sm:flex items-center gap-2" onClick={handleExport} loading={exportLoading}>
                        <Download className="h-4 w-4" /> Xuất Excel
                    </Button>
                    <Button onClick={handleCreate} className="flex items-center gap-2">
                        <Plus className="h-4 w-4" /> Thêm nhân viên
                    </Button>
                </div>
            </div>

            <EmployeeTable
                data={employees}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalPages={totalPages}
                onEdit={handleEdit}
                onDelete={handleDelete}
            />

            <EmployeeFormModal
                isOpen={isFormOpen}
                onClose={() => setIsFormOpen(false)}
                onSubmit={handleFormSubmit}
                formData={formData}
                onFormChange={setFormData}
                metadata={metadata}
                loading={submitting}
                errors={errors}
                mode={modalMode}
            />

            <EmployeeDeleteModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={confirmDelete}
                employee={selectedEmployee}
                loading={submitting}
            />
        </div>
    );
}
