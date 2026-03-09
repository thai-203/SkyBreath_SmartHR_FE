"use client";

// 1,Import thư viện và component
import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { departmentsService, employeesService } from "@/services";
import { Plus, Download } from "lucide-react";
import { validate, required, unique, regex } from "@/lib/validation";
import DepartmentTable from "./components/DepartmentTable";
import DepartmentFormModal from "./components/DepartmentFormModal";
import DepartmentDeleteModal from "./components/DepartmentDeleteModal";
import DepartmentDetailModal from "./components/DepartmentDetailModal";

// 2,Khai báo dữ liệu ban đầu
const initialFormData = {
    departmentName: "",
    parentDepartmentId: "",
    managerEmployeeId: "",
};
// 3.Khai báo state 
export default function DepartmentsPage() {
    const { success, error } = useToast();

    // Data states
    const [data, setData] = useState([]); // Danh sách phòng ban trong table
    const [loading, setLoading] = useState(true);//Loading khi gọi API
    const [search, setSearch] = useState("");// Search phòng ban
    const [filters, setFilters] = useState({ // Filter theo phòng ban cha, quản lý và có nhân viên hay không
        parentDepartmentId: "",
        managerEmployeeId: "",
        hasEmployees: ""
    });
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });// Phân trang
    const [totalPages, setTotalPages] = useState(1);// Tổng số trang trả về từ API

    // Modal states
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [isDetailOpen, setIsDetailOpen] = useState(false);// 4 modal tạo, sửa, xóa và xem chi tiết

    const [selectedDepartment, setSelectedDepartment] = useState(null);// Phòng ban đang chọn
    const [formLoading, setFormLoading] = useState(false);// Loading khi submit
    const [exportLoading, setExportLoading] = useState(false);// Loading khi xuất file

    // Form state
    const [formData, setFormData] = useState(initialFormData);// Dữ liệu form tạo/sửa phòng ban
    const [errors, setErrors] = useState({});// Lỗi validation form

    // Dropdown data
    const [departmentList, setDepartmentList] = useState([]);
    const [employeeList, setEmployeeList] = useState([]);// Danh sách cho select.

    //4,API calls (fetchDepartments để lấy danh sách phòng ban, fetchDropdownData để lấy dữ liệu cho dropdown filter và form )
    const fetchDepartments = async () => {
        setLoading(true);
        try {
            const response = await departmentsService.getAll({
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search,
                parentDepartmentId: filters.parentDepartmentId || undefined,
                managerEmployeeId: filters.managerEmployeeId || undefined,
                hasEmployees: filters.hasEmployees || undefined,
            });
            setData(response.data || []);
            setTotalPages(response.meta?.totalPages || 1);
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setLoading(false);
        }
    };// Lấy danh sách phòng ban với các tham số phân trang, tìm kiếm và lọc. Cập nhật state data và totalPages dựa trên phản hồi từ API. Xử lý lỗi và cập nhật trạng thái loading.

    const fetchDropdownData = async () => {
        try {
            // Fetch independently to prevent one failure from blocking others
            const deptPromise = departmentsService.getList().catch(err => {
                console.error("Error fetching departments list:", err);
                return { data: [] };
            });
            const empPromise = employeesService.getList().catch(err => {
                console.error("Error fetching employees list:", err);
                return { data: [] };
            });

            const [deptRes, empRes] = await Promise.all([deptPromise, empPromise]);

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
    };// Lấy dữ liệu cho dropdown phòng ban và nhân viên. Sử dụng Promise.all để gọi đồng thời hai API và xử lý lỗi riêng biệt cho từng API để đảm bảo một lỗi không ảnh hưởng đến dữ liệu còn lại.

    //5,UseEffect để gọi API khi component mount và khi các tham số thay đổi
    useEffect(() => {
        fetchDepartments();
    }, [pagination.pageIndex, pagination.pageSize, search, filters]);// Load departments khi filter/search/pagination thay đổi 

    useEffect(() => {
        fetchDropdownData();
    }, []); // Load dropdown data khi component mount

    //6,Handlers (Các hàm xử lý sự kiện như mở modal tạo/sửa/xóa, submit form, xuất file Excel)
    const handleCreate = () => {
        setFormData(initialFormData);
        setErrors({});
        setIsCreateOpen(true);
    };//Mở modal tạo phòng ban mới

    const handleEdit = (department) => {
        setSelectedDepartment(department);
        setFormData({
            departmentName: department.departmentName,
            parentDepartmentId: department.parentDepartmentId || "",
            managerEmployeeId: department.managerEmployeeId || "",
        });
        setErrors({});
        setIsEditOpen(true);
    };//Mở modal chỉnh sửa phòng ban

    const handleDeleteClick = (department) => {
        setSelectedDepartment(department);
        setIsDeleteOpen(true);
    };//Mở modal xác nhận xóa phòng ban

    const handleViewDetail = (department) => {
        setSelectedDepartment(department);
        setIsDetailOpen(true);
    };//Mở modal xem chi tiết phòng ban

    const validateForm = () => {
        const validationErrors = validate(formData, {
            departmentName: [
                required("Tên phòng ban là bắt buộc"),
                regex(/^[a-zA-Z0-9À-ỹ\s]+$/, "Tên phòng ban chỉ được chứa chữ cái, số và khoảng trắng"),
                unique(departmentList, selectedDepartment?.id, "Tên phòng ban đã tồn tại"),
            ],
        });
        if (validationErrors) {
            setErrors(validationErrors);
            return false;
        }
        setErrors({});
        return true;
    };// Validate form dữ liệu trước khi submit. 

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
            fetchDropdownData();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };// Xử lý submit form tạo phòng ban mới. 

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
            fetchDropdownData();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };// Xử lý submit form chỉnh sửa phòng ban. 

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const response = await departmentsService.delete(selectedDepartment.id);
            success(response.message);
            setIsDeleteOpen(false);
            fetchDepartments();
            fetchDropdownData();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };// Xử lý xác nhận xóa phòng ban. Gọi API xóa và cập nhật lại danh sách phòng ban sau khi xóa thành công.

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
    };// Xử lý xuất file Excel. Gọi API để lấy file, tạo URL tạm thời và trigger download trên trình duyệt. Xử lý lỗi và cập nhật trạng thái loading.

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
                filters={filters}
                onFilterChange={setFilters}
                departmentList={departmentList}
                employeeList={employeeList}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalPages={totalPages}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onViewDetail={handleViewDetail}
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

            {/* Detail Modal */}
            <DepartmentDetailModal
                isOpen={isDetailOpen}
                onClose={() => setIsDetailOpen(false)}
                department={selectedDepartment}
            />
        </div>
    );
}
