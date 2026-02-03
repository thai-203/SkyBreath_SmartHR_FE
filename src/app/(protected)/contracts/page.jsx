"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { contractsService, employeesService } from "@/services";
import { Plus, Download } from "lucide-react";
import { validate, required } from "@/lib/validation";

// Local components
import ContractTable from "./components/ContractTable";
import ContractFormModal from "./components/ContractFormModal";
import ViewContractModal from "./components/ViewContractModal";
import TerminateContractModal from "./components/TerminateContractModal";
import DeleteContractModal from "./components/DeleteContractModal";

const initialFormData = {
    employeeId: "",
    contractType: "",
    startDate: "",
    endDate: "",
    salary: "",
    position: "",
    department: "",
    description: "",
};

const initialTerminationData = {
    terminationDate: "",
    reason: "",
    severancePay: "",
    notes: "",
};

export default function ContractsPage() {
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
    const [isViewOpen, setIsViewOpen] = useState(false);
    const [isTerminateOpen, setIsTerminateOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedContract, setSelectedContract] = useState(null);
    const [formLoading, setFormLoading] = useState(false);
    const [exportLoading, setExportLoading] = useState(false);

    // Form state
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    // Termination form state
    const [terminationData, setTerminationData] = useState(initialTerminationData);
    const [terminationErrors, setTerminationErrors] = useState({});

    // Dropdown data
    const [employeeList, setEmployeeList] = useState([]);
    const [contractList, setContractList] = useState([]);

    // ==================== API Calls ====================
    const fetchContracts = async () => {
        setLoading(true);
        try {
            const response = await contractsService.getAll({
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

    const fetchContractList = async () => {
        try {
            const response = await contractsService.getAll();
            setContractList(
                (response.data || []).map((e) => ({
                    data: e,
                }))
            );
        } catch (err) {
            console.error("Error fetching contracts:", err);
        }
    };

    const fetchEmployeeList = async () => {
        try {
            const response = await employeesService.getAll();
            setEmployeeList(
                (response.data || []).map((e) => ({
                    value: e.id,
                    label: e.fullName,
                    data: e,
                }))
            );
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    useEffect(() => {
        fetchContracts();
    }, [pagination.pageIndex, pagination.pageSize, search]);

    useEffect(() => {
        fetchContractList();
        fetchEmployeeList();
    }, []);

    // ==================== Handlers ====================
    const handleCreate = () => {
    setSelectedContract(null);
    setFormData({ ...initialFormData });
    setErrors({});
    setIsCreateOpen(true);
};

    const handleView = (contract) => {
        setSelectedContract(contract);
        setIsViewOpen(true);
    };

    const handleEdit = (contract) => {
        setSelectedContract(contract);
        setFormData({
            employeeId: contract.employeeId,
            contractType: contract.contractType,
            contractNumber: contract.contractNumber,
            contractStatus: contract.contractStatus,
            startDate: contract.startDate ? contract.startDate.split("T")[0] : "",
            endDate: contract.endDate ? contract.endDate.split("T")[0] : "",
            signedDate: contract.signedDate ? contract.signedDate.split("T")[0] : "",
            workingHours: Math.trunc(contract.workingHours),
            salary: contract.salary,
            position: contract.position,
            department: contract.department,
            description: contract.description || "",
        });
        setErrors({});
        setIsEditOpen(true);
    };

    const handleTerminateClick = (contract) => {
        setSelectedContract(contract);
        setTerminationData(initialTerminationData);
        setTerminationErrors({});
        setIsTerminateOpen(true);
    };

    const handleDeleteClick = (contract) => {
        setSelectedContract(contract);
        setIsDeleteOpen(true);
    };

    const validateForm = () => {
        const validationErrors = validate(formData, {
            employeeId: [required("Nhân viên là bắt buộc")],
            contractType: [required("Loại hợp đồng là bắt buộc")],
            startDate: [required("Ngày bắt đầu là bắt buộc")],
            salary: [required("Lương là bắt buộc")],
            position: [required("Vị trí công việc là bắt buộc")],
            department: [required("Phòng ban là bắt buộc")],
        });
        if (validationErrors) {
            setErrors(validationErrors);
            return false;
        }
        setErrors({});
        return true;
    };

    const validateTerminationForm = () => {
        const validationErrors = validate(terminationData, {
            terminationDate: [required("Ngày chấm dứt là bắt buộc")],
            reason: [required("Lý do chấm dứt là bắt buộc")],
        });
        if (validationErrors) {
            setTerminationErrors(validationErrors);
            return false;
        }
        setTerminationErrors({});
        return true;
    };

    const handleSubmitCreate = async () => {
        if (!validateForm()) return;

        setFormLoading(true);
        try {
            const response = await contractsService.create({
                employeeId: Number(formData.employeeId),
                contractType: formData.contractType,
                startDate: formData.startDate,
                endDate: formData.endDate || null,
                salary: Number(formData.salary),
                position: formData.position,
                department: formData.department,
                description: formData.description,
            });
            success(response.message);
            setIsCreateOpen(false);
            fetchContracts();
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
            const response = await contractsService.update(selectedContract.id, {
                contractType: formData.contractType,
                startDate: formData.startDate,
                endDate: formData.endDate || null,
                salary: Number(formData.salary),
                position: formData.position,
                department: formData.department,
                description: formData.description,
            });
            success(response.message);
            setIsEditOpen(false);
            fetchContracts();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };

    const handleTerminate = async () => {
        if (!validateTerminationForm()) return;

        setFormLoading(true);
        try {
            const response = await contractsService.terminate(selectedContract.id, {
                terminationDate: terminationData.terminationDate,
                reason: terminationData.reason,
                severancePay: terminationData.severancePay ? Number(terminationData.severancePay) : 0,
                notes: terminationData.notes,
            });
            success(response.message);
            setIsTerminateOpen(false);
            fetchContracts();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const response = await contractsService.delete(selectedContract.id);
            success(response.message);
            setIsDeleteOpen(false);
            fetchContracts();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra");
        } finally {
            setFormLoading(false);
        }
    };

    const handleExport = async () => {
        setExportLoading(true);
        try {
            const blob = await contractsService.export();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `contracts_${new Date().toISOString().split("T")[0]}.xlsx`;
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
            <PageTitle title="Hợp đồng lao động" />

            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý hợp đồng lao động</h1>
                    <p className="text-slate-500">Danh sách tất cả hợp đồng lao động trong công ty</p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleExport} loading={exportLoading}>
                        <Download className="mr-2 h-4 w-4" />
                        Xuất Excel
                    </Button>
                    <Button onClick={handleCreate}>
                        <Plus className="mr-2 h-4 w-4" />
                        Tạo hợp đồng
                    </Button>
                </div>
            </div>

            {/* Table */}
            <ContractTable
                data={data}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalPages={totalPages}
                onView={handleView}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
                onTerminate={handleTerminateClick}
            />

            {/* Create Modal */}
            <ContractFormModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleSubmitCreate}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                contractList={contractList}
                employeeList={employeeList}
                loading={formLoading}
                mode="create"
            />

            {/* Edit Modal */}
            <ContractFormModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleSubmitEdit}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                employeeList={employeeList}
                loading={formLoading}
                mode="edit"
                selectedContract={selectedContract}
            />

            {/* View Modal */}
            <ViewContractModal
                isOpen={isViewOpen}
                onClose={() => setIsViewOpen(false)}
                contract={selectedContract}
                loading={loading}
            />

            {/* Terminate Modal */}
            <TerminateContractModal
                isOpen={isTerminateOpen}
                onClose={() => setIsTerminateOpen(false)}
                onSubmit={handleTerminate}
                contract={selectedContract}
                formData={terminationData}
                onFormChange={setTerminationData}
                errors={terminationErrors}
                loading={formLoading}
            />

            {/* Delete Modal */}
            <DeleteContractModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                contract={selectedContract}
                loading={formLoading}
            />
        </div>
    );
}
