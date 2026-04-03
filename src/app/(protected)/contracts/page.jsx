"use client";

import { useMemo } from "react";
import { useState, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import {
  contractsService,
  employeesService,
  jobGradesService,
  departmentsService,
  positionsService,
  employeeSalariesService,
} from "@/services";
import { Plus, Download } from "lucide-react";
import { validate, required } from "@/lib/validation";

// Local components
import ContractTable from "./components/ContractTable";
import ContractFormModal from "./components/ContractFormModal";
import ViewContractModal from "./components/ViewContractModal";
import TerminateContractModal from "./components/TerminateContractModal";
import DeleteContractModal from "./components/DeleteContractModal";

const initialFormData = {
  // Thông tin chung
  employeeId: "",
  contractNumber: "",
  contractType: "permanent",
  signedDate: "",
  startDate: "",
  endDate: "",
  workingHours: "",

  departmentId: "",
  positionId: "",
  jobGradeId: "",

  // Lương & Phụ cấp
  baseSalary: "",
  performanceSalary: "",
  lunchAllowance: "",
  fuelAllowance: "",
  phoneAllowance: "",
  otherAllowance: "",

  // Thông tin khác
  note: "",
  attachments: [],
};

const initialTerminationData = {
  terminationDate: "",
  terminationReason: "",
  terminationCompensation: "",
  terminationNote: "",
};

export default function ContractsPage() {
  const { success, error } = useToast();

  // Data states
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterType, setFilterType] = useState("");
  const [filterStatus, setFilterStatus] = useState("");
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
  const [terminationData, setTerminationData] = useState(
    initialTerminationData,
  );
  const [terminationErrors, setTerminationErrors] = useState({});

  // Dropdown data
  const [employeeList, setEmployeeList] = useState([]);
  // removed contractList state - not needed after backend filter
  const [jobGradesList, setJobGradesList] = useState([]);
  const [positionsList, setPositionsList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);

  // ==================== API Calls ====================
  const fetchContracts = async () => {
    setLoading(true);
    try {
      const response = await contractsService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search: search || undefined,
        contractType: filterType || undefined,
        contractStatus: filterStatus || undefined,
      });

      setData(response.data || []);
      setTotalPages(response.meta?.totalPages || 1);
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  };

  // previous function to load all contracts removed; employee list now filtered server-side

  const fetchJobGradesList = async () => {
    try {
      const response = await jobGradesService.getAll();
      const items = Array.isArray(response.data) ? response.data : [];
      setJobGradesList(
        items.map((e) => ({
          value: e.id,
          label: e.gradeName,
          data: e,
        })),
      );
    } catch (err) {
      console.error("Error fetching job grades:", err);
    }
  };

  const fetchPositionsList = async () => {
    try {
      const response = await positionsService.getAll();
      const items = Array.isArray(response.data) ? response.data : [];
      setPositionsList(
        items.map((e) => ({
          value: e.id,
          label: e.positionName,
          data: e,
        })),
      );
    } catch (err) {
      console.error("Error fetching positions:", err);
    }
  };

  const fetchSalaryByEmployeeId = async (empId) => {
    if (!empId) return;
    try {
      const response = await employeeSalariesService.getByEmployeeId(empId);
      const salaryData = response.data || response;

      if (salaryData) {
        setFormData((prev) => ({
          ...prev,
          baseSalary: salaryData.baseSalary || 0,
          performanceSalary: salaryData.performanceSalary || 0,
          lunchAllowance: salaryData.lunchAllowance || 0,
          fuelAllowance: salaryData.fuelAllowance || 0,
          phoneAllowance: salaryData.phoneAllowance || 0,
          otherAllowance: salaryData.otherAllowance || 0,
          jobGradeId: salaryData.jobGradeId || prev.jobGradeId,
          positionId: salaryData.employee?.positionId || prev.positionId,
          departmentId: salaryData.employee?.departmentId || prev.departmentId,
        }));
      }
    } catch (err) {
      console.error("Không tìm thấy thông tin lương cho nhân viên này:", err);
    }
  };

  const fetchEmployeeDetailById = async (empId) => {
    if (!empId) return;
    try {
      const response = await employeesService.getById(empId);
      const employee = response.data || response;

      if (employee) {
        setFormData((prev) => ({
          ...prev,
          departmentId:
            employee.departmentId ||
            employee.department?.id ||
            prev.departmentId,
          positionId:
            employee.positionId || employee.position?.id || prev.positionId,
          jobGradeId:
            employee.jobGradeId || employee.jobGrade?.id || prev.jobGradeId,
        }));
      }
    } catch (err) {
      console.error("Không thể lấy chi tiết nhân viên:", err);
    }
  };

  const fetchDepartmentList = async () => {
    try {
      const response = await departmentsService.getAll();
      const departments = Array.isArray(response.data) ? response.data : [];
      const mappedData = departments.map((dept) => ({
        value: dept.id,
        label: dept.departmentName || dept.name || "Unnamed Department",
        data: dept,
      }));
      setDepartmentsList(mappedData);
    } catch (err) {
      console.error("Error fetching departments:", err);
    }
  };

  const fetchEmployeeList = async () => {
    try {
      // request only employees without an active contract
      const response = await employeesService.getList({ noContract: true });
      const items = Array.isArray(response.data) ? response.data : [];
      setEmployeeList(
        items.map((e) => ({
          value: e.id,
          label: e.fullName,
          data: e,
        })),
      );
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  useEffect(() => {
    fetchContracts();
  }, [
    pagination.pageIndex,
    pagination.pageSize,
    search,
    filterType,
    filterStatus,
  ]);

  useEffect(() => {
    fetchEmployeeList();
    fetchJobGradesList();
    fetchPositionsList();
    fetchDepartmentList();
  }, []);

  useEffect(() => {
    if (isCreateOpen || isEditOpen) {
      if (formData.employeeId) {
        fetchEmployeeDetailById(formData.employeeId);
        fetchSalaryByEmployeeId(formData.employeeId);
      }
    }

    if (isViewOpen && selectedContract?.employeeId) {
      fetchSalaryByEmployeeId(selectedContract.employeeId);
    }
  }, [
    isCreateOpen,
    isEditOpen,
    isViewOpen,
    formData.employeeId,
    selectedContract?.employeeId,
  ]);

  // ==================== Handlers ====================
  const handleCreate = () => {
    setSelectedContract(null);
    setFormData({ ...initialFormData });
    setErrors({});
    setIsCreateOpen(true);
  };

  const handleView = (contract) => {
    const dept = departmentsList.find(
      (d) => d.value === contract.employee.departmentId,
    );
    const pos = positionsList.find(
      (p) => p.value === contract.employee.positionId,
    );
    const grade = jobGradesList.find(
      (g) => g.value === contract.employee.jobGradeId,
    );
    const emp = employeeList.find((e) => e.value === contract.employeeId);
    const enrichedContract = {
      ...contract,
      // Ánh xạ tên hiển thị
      employeeName: emp?.label || contract.employee?.fullName || "N/A",
      departmentName:
        dept?.label || contract.department?.departmentName || "---",
      positionName: pos?.label || contract.position?.positionName || "---",
      jobGradeName: grade?.label || "---",

      // Đảm bảo định dạng ngày tháng giống Edit (Y-m-d) để hiển thị đồng nhất
      startDate: contract.startDate ? contract.startDate.split("T")[0] : "",
      endDate: contract.endDate ? contract.endDate.split("T")[0] : "",
      signedDate: contract.signedDate ? contract.signedDate.split("T")[0] : "",

      // Ép kiểu số cho lương và phụ cấp để tránh lỗi hiển thị .00 hoặc NaN
      baseSalary: Number(contract.baseSalary || 0),
      performanceSalary: Number(contract.performanceSalary || 0),
      lunchAllowance: Number(contract.lunchAllowance || 0),
      fuelAllowance: Number(contract.fuelAllowance || 0),
      phoneAllowance: Number(contract.phoneAllowance || 0),
      otherAllowance: Number(contract.otherAllowance || 0),

      workingHours: contract.workingHours || 40,
      note: contract.note || "",
      attachments: contract.attachments || [],
    };

    setSelectedContract(enrichedContract);
    setIsViewOpen(true);
  };

  const handleEdit = (contract) => {
    setSelectedContract(contract);
    setFormData({
      ...initialFormData,
      employeeId: contract.employeeId?.toString(),
      contractNumber: contract.contractNumber,
      contractType: contract.contractType,
      departmentId: contract.departmentId,
      positionId: contract.positionId,
      jobGradeId: contract.jobGradeId,
      startDate: contract.startDate ? contract.startDate.split("T")[0] : "",
      endDate: contract.endDate ? contract.endDate.split("T")[0] : "",
      signedDate: contract.signedDate ? contract.signedDate.split("T")[0] : "",
      workingHours: contract.workingHours || "40",
      baseSalary: contract.baseSalary,
      performanceSalary: contract.performanceSalary,
      lunchAllowance: contract.lunchAllowance,
      fuelAllowance: contract.fuelAllowance,
      phoneAllowance: contract.phoneAllowance,
      otherAllowance: contract.otherAllowance,
      attachments: contract.attachments,
      note: contract.note || "",
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
      contractNumber: [required("Mã hợp đồng là bắt buộc")],
      contractType: [required("Loại hợp đồng là bắt buộc")],
      signedDate: [required("Ngày ký là bắt buộc")],
      startDate: [required("Ngày bắt đầu là bắt buộc")],
      baseSalary: [required("Lương là bắt buộc")],
      positionId: [required("Vị trí công việc là bắt buộc")],
      departmentId: [required("Phòng ban là bắt buộc")],
    });

    if (formData.signedDate && formData.startDate) {
      const signed = new Date(formData.signedDate);
      const start = new Date(formData.startDate);
      if (signed > start) {
        validationErrors.signedDate = "Ngày ký không thể sau ngày bắt đầu";
      }
    }
    if (formData.endDate && formData.startDate) {
      const end = new Date(formData.endDate);
      const start = new Date(formData.startDate);
      if (end <= start) {
        validationErrors.endDate = "Ngày kết thúc phải sau ngày bắt đầu";
      }
    }

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
      terminationReason: [required("Lý do chấm dứt là bắt buộc")],
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
      const formDataToSubmit = new FormData();

      formDataToSubmit.append("employeeId", formData.employeeId);
      formDataToSubmit.append(
        "contractNumber",
        formData.contractNumber?.trim() || "",
      );
      formDataToSubmit.append("departmentId", formData.departmentId);
      formDataToSubmit.append("positionId", formData.positionId);
      formDataToSubmit.append("jobGradeId", formData.jobGradeId);
      formDataToSubmit.append("contractType", formData.contractType);
      formDataToSubmit.append("signedDate", formData.signedDate);
      formDataToSubmit.append("startDate", formData.startDate);

      if (formData.contractType !== "permanent" && formData.endDate) {
        formDataToSubmit.append("endDate", formData.endDate);
      }

      formDataToSubmit.append("workingHours", formData.workingHours || "0");
      formDataToSubmit.append("baseSalary", formData.baseSalary || "0");
      formDataToSubmit.append(
        "performanceSalary",
        formData.performanceSalary || "0",
      );
      formDataToSubmit.append("lunchAllowance", formData.lunchAllowance || "0");
      formDataToSubmit.append("fuelAllowance", formData.fuelAllowance || "0");
      formDataToSubmit.append("phoneAllowance", formData.phoneAllowance || "0");
      formDataToSubmit.append("otherAllowance", formData.otherAllowance || "0");
      formDataToSubmit.append("note", formData.note || "");

      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          formDataToSubmit.append("attachments", file);
        });
      }

      const response = await contractsService.create(formDataToSubmit);

      success(response.message || "Tạo hợp đồng thành công!");
      setIsCreateOpen(false);
      fetchContracts();
      // reload employees so the newly contracted person is excluded
      fetchEmployeeList();
    } catch (err) {
      error(err.response?.data?.message || "Không thể tạo hợp đồng.");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!validateForm()) return;

    setFormLoading(true);
    try {
      const formDataToSubmit = new FormData();

      // 1. Append các field text/number thông thường
      formDataToSubmit.append("employeeId", formData.employeeId);
      formDataToSubmit.append(
        "contractNumber",
        formData.contractNumber?.trim() || "",
      );
      formDataToSubmit.append("departmentId", formData.departmentId);
      formDataToSubmit.append("positionId", formData.positionId);
      formDataToSubmit.append("jobGradeId", formData.jobGradeId);
      formDataToSubmit.append("contractType", formData.contractType);
      formDataToSubmit.append("signedDate", formData.signedDate);
      formDataToSubmit.append("startDate", formData.startDate);

      if (formData.contractType !== "permanent" && formData.endDate) {
        formDataToSubmit.append("endDate", formData.endDate);
      } else {
        formDataToSubmit.append("endDate", "");
      }

      formDataToSubmit.append(
        "workingHours",
        String(formData.workingHours || 0),
      );
      formDataToSubmit.append("baseSalary", String(formData.baseSalary || 0));
      formDataToSubmit.append(
        "performanceSalary",
        String(formData.performanceSalary || 0),
      );
      formDataToSubmit.append(
        "lunchAllowance",
        String(formData.lunchAllowance || 0),
      );
      formDataToSubmit.append(
        "fuelAllowance",
        String(formData.fuelAllowance || 0),
      );
      formDataToSubmit.append(
        "phoneAllowance",
        String(formData.phoneAllowance || 0),
      );
      formDataToSubmit.append(
        "otherAllowance",
        String(formData.otherAllowance || 0),
      );
      formDataToSubmit.append("note", formData.note || "");

      if (formData.attachments && formData.attachments.length > 0) {
        formData.attachments.forEach((file) => {
          if (file instanceof File) {
            formDataToSubmit.append("attachments", file);
          }
        });
      }

      formDataToSubmit.append(
        "oldAttachments",
        JSON.stringify(formData.attachments),
      );

      const response = await contractsService.update(
        selectedContract.id,
        formDataToSubmit,
      );

      success(response.message || "Cập nhật hợp đồng thành công!");
      setIsEditOpen(false);
      fetchContracts();
      // in case editing changed anything that affects available employees (unlikely)
      fetchEmployeeList();
    } catch (err) {
      const errorMsg =
        err.response?.data?.message || "Không thể cập nhật hợp đồng.";
      error(errorMsg);
      console.error("Update Contract Error:", err);
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
        terminationReason: terminationData.terminationReason,
        terminationCompensation: terminationData.terminationCompensation
          ? Number(terminationData.terminationCompensation)
          : 0,
        terminationNote: terminationData.terminationNote,
      });
      success(response.message);
      setIsTerminateOpen(false);
      fetchContracts();
      fetchEmployeeList();
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
      fetchEmployeeList();
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

  const handleSearchChange = (value) => {
    setSearch(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleTypeChange = (value) => {
    setFilterType(value);
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleStatusChange = (status) => {
    setFilterStatus((prev) => (prev === status ? "" : status));
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  const handleReset = () => {
    setSearch("");
    setFilterType("");
    setFilterStatus("");
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      <PageTitle title="Hợp đồng lao động" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý hợp đồng lao động
          </h1>
          <p className="text-slate-500">
            Danh sách tất cả hợp đồng lao động trong công ty
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={handleExport}
            loading={exportLoading}
          >
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
        search={search}
        onSearchChange={handleSearchChange}
        filterType={filterType}
        onTypeChange={handleTypeChange}
        filterStatus={filterStatus}
        onStatusChange={handleStatusChange}
        onReset={handleReset}
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
        employeeList={employeeList}
        jobGradesList={jobGradesList}
        positionsList={positionsList}
        departmentsList={departmentsList}
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
        jobGradesList={jobGradesList}
        positionsList={positionsList}
        departmentsList={departmentsList}
      />

      {/* View Modal */}
      <ViewContractModal
        isOpen={isViewOpen}
        onClose={() => {
          setIsViewOpen(false);
          setSelectedContract(null);
        }}
        formData={formData}
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
