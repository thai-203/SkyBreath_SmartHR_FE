"use client";

import { useState, useCallback, useEffect } from "react";
import { Button } from "@/components/common/Button";
import { Select } from "@/components/common/Select";
import { useToast } from "@/components/common/Toast";
import { payrollService } from "@/services/payroll.service";
import { departmentsService } from "@/services/departments.service";
import { authService } from "@/services/auth.service";
import { DollarSign, Plus, Download, Mail, Lock, FileSpreadsheet } from "lucide-react";
import PayrollTable from "./components/PayrollTable";
import CreatePayrollModal from "./components/CreatePayrollModal";
import ApprovalModal from "./components/ApprovalModal";
import PayrollDetailView from "./components/PayrollDetailView";
import PayrollDetailEditModal from "./components/PayrollDetailEditModal";

const STATUS_OPTIONS = [
    { value: "", label: "-- Tất cả trạng thái --" },
    { value: "DRAFT", label: "Nháp" },
    { value: "PENDING_APPROVAL", label: "Chờ duyệt" },
    { value: "APPROVED", label: "Đã duyệt" },
    { value: "LOCKED", label: "Đã khóa" },
];

const STATUS_LABEL = {
    DRAFT: { label: "Nháp", color: "bg-slate-100 text-slate-600" },
    PENDING_APPROVAL: { label: "Chờ duyệt", color: "bg-amber-100 text-amber-700" },
    APPROVED: { label: "Đã duyệt", color: "bg-blue-100 text-blue-700" },
    LOCKED: { label: "Đã khóa", color: "bg-emerald-100 text-emerald-700" },
};

const currentDate = new Date();

export default function PayrollPage() {
    // ─── State ───
    const [payrolls, setPayrolls] = useState([]);
    const [loading, setLoading] = useState(false);
    const [actionLoading, setActionLoading] = useState(false);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState({
        month: "",
        year: currentDate.getFullYear(),
        status: "",
    });
    const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 10 });
    const [totalPages, setTotalPages] = useState(0);

    // Selected payroll detail view
    const [selectedPayroll, setSelectedPayroll] = useState(null);
    const [detailData, setDetailData] = useState(null);
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailEditModal, setDetailEditModal] = useState({ open: false, data: null });
    const [editLoading, setEditLoading] = useState(false);

    // Modals
    const [createModal, setCreateModal] = useState(false);
    const [createLoading, setCreateLoading] = useState(false);
    const [approvalModal, setApprovalModal] = useState({ open: false, payroll: null, action: null });

    const { success, error: toastError } = useToast();

    // ─── Fetch payrolls ───
    const fetchPayrolls = useCallback(async () => {
        setLoading(true);
        try {
            const params = {
                page: pagination.pageIndex + 1,
                limit: pagination.pageSize,
                search: search || undefined,
                month: filters.month || undefined,
                year: filters.year || undefined,
                status: filters.status || undefined,
            };
            const res = await payrollService.getAll(params);
            const data = res?.data || {};
            setPayrolls(data.items || []);
            setTotalPages(data.totalPages || 0);
        } catch (err) {
            console.error("Error fetching payrolls:", err);
            toastError("Lỗi khi tải danh sách bảng lương");
        } finally {
            setLoading(false);
        }
    }, [pagination, search, filters]);

    useEffect(() => { fetchPayrolls(); }, [fetchPayrolls]);

    // ─── View Detail ───
    const handleViewDetail = useCallback(async (payroll) => {
        setSelectedPayroll(payroll);
        setDetailLoading(true);
        try {
            const res = await payrollService.getById(payroll.id);
            setDetailData(res?.data);
        } catch (err) {
            toastError("Lỗi khi tải chi tiết bảng lương");
        } finally {
            setDetailLoading(false);
        }
    }, [toastError]);

    // ─── Create ───
    const handleCreate = useCallback(async (form) => {
        setCreateLoading(true);
        try {
            const res = await payrollService.create(form);
            success("Tạo bảng lương thành công");
            setCreateModal(false);
            fetchPayrolls();
            if (res?.data) handleViewDetail(res.data);
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi tạo bảng lương");
        } finally {
            setCreateLoading(false);
        }
    }, [fetchPayrolls, handleViewDetail, success, toastError]);

    // ─── Calculate ───
    const handleCalculate = useCallback(async (payroll) => {
        setActionLoading(true);
        try {
            await payrollService.calculate(payroll.id);
            success(`Đã tính lương tự động cho ${payroll.payrollMonth}/${payroll.payrollYear}`);
            fetchPayrolls();
            if (selectedPayroll?.id === payroll.id) handleViewDetail(payroll);
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi tính lương");
        } finally {
            setActionLoading(false);
        }
    }, [selectedPayroll, fetchPayrolls, handleViewDetail, success, toastError]);

    // ─── Edit detail ───
    const handleEditDetail = useCallback(async (detailId, form) => {
        setEditLoading(true);
        try {
            await payrollService.updateDetail(detailId, form);
            success("Cập nhật thành công");
            setDetailEditModal({ open: false, data: null });
            if (selectedPayroll) handleViewDetail(selectedPayroll);
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi cập nhật");
        } finally {
            setEditLoading(false);
        }
    }, [selectedPayroll, handleViewDetail, success, toastError]);

    // ─── Approval Actions ───
    const openApprovalModal = useCallback((payroll, action) => {
        setApprovalModal({ open: true, payroll, action });
    }, []);

    const handleApprovalAction = async (reason) => {
        const { payroll, action } = approvalModal;
        setActionLoading(true);
        try {
            if (action === "submit") {
                await payrollService.submit(payroll.id);
                success("Đã gửi bảng lương để phê duyệt");
            } else if (action === "approve") {
                await payrollService.approve(payroll.id);
                success("Bảng lương đã được phê duyệt");
            } else if (action === "reject") {
                await payrollService.reject(payroll.id, reason);
                success("Đã từ chối bảng lương");
            } else if (action === "lock") {
                await payrollService.lock(payroll.id);
                success("Bảng lương đã được khóa");
            } else if (action === "unlock") {
                await payrollService.unlock(payroll.id);
                success("Bảng lương đã được mở khóa");
            } else if (action === "sendPayslips") {
                const res = await payrollService.sendPayslips(payroll.id);
                success(`Đã gửi ${res?.data?.sent || 0}/${res?.data?.total || 0} phiếu lương`);
            }
            setApprovalModal({ open: false, payroll: null, action: null });
            fetchPayrolls();
            if (selectedPayroll?.id === payroll.id) handleViewDetail(payroll);
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi thực hiện thao tác");
        } finally {
            setActionLoading(false);
        }
    };

    // ─── Export ───
    const downloadBlob = (blob, filename) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
    };

    const handleUpdateHeader = useCallback(async (id, data) => {
        setActionLoading(true);
        try {
            await payrollService.update(id, data);
            const res = await payrollService.getById(id);
            setDetailData(res?.data);
            success("Cập nhật thông tin chung thành công");
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi cập nhật");
        } finally {
            setActionLoading(false);
        }
    }, [success, toastError]);

    const handleExportSummary = useCallback(async (payroll) => {
        try {
            const blob = await payrollService.exportSummary(payroll.id);
            downloadBlob(blob, `bang_luong_T${payroll.payrollMonth}_${payroll.payrollYear}.xlsx`);
            success("Xuất file tổng hợp thành công");
        } catch (err) { toastError("Lỗi khi xuất file"); }
    }, [success, toastError]);

    const handleExportPayslips = useCallback(async (payroll) => {
        try {
            const blob = await payrollService.exportPayslips(payroll.id);
            downloadBlob(blob, `phieu_luong_T${payroll.payrollMonth}_${payroll.payrollYear}.xlsx`);
            success("Xuất phiếu lương thành công");
        } catch (err) { toastError("Lỗi khi xuất phiếu lương"); }
    }, [success, toastError]);

    // ─── Filters ───
    const monthOptions = [
        { value: "", label: "-- Tất cả tháng --" },
        ...Array.from({ length: 12 }, (_, i) => ({ value: i + 1, label: `Tháng ${i + 1}` })),
    ];
    const yearOptions = Array.from({ length: 5 }, (_, i) => {
        const y = currentDate.getFullYear() - 2 + i;
        return { value: y, label: `${y}` };
    });

    const detailStatus = detailData ? STATUS_LABEL[detailData.payrollStatus] : null;
    const canEdit = detailData && ["DRAFT", "PENDING_APPROVAL"].includes(detailData.payrollStatus);

    const handleBack = useCallback(() => {
        setSelectedPayroll(null);
        setDetailData(null);
    }, []);

    const handleCalculateCallback = useCallback((p) => handleCalculate(p), [handleCalculate]);
    const openApprovalCallback = useCallback((p, type) => openApprovalModal(p, type), [openApprovalModal]);
    const handleEditDetailCallback = useCallback((d) => setDetailEditModal({ open: true, data: d }), []);

    // ─────────────────────────────────────────────────────────
    // DETAIL VIEW — early return avoids ternary in JSX
    // (fixes Turbopack "Expected static flag was missing" bug)
    // ─────────────────────────────────────────────────────────
    if (selectedPayroll) {
        return (
            <div className="space-y-6">
                <PayrollDetailView
                    payroll={detailData}
                    status={detailStatus}
                    onBack={handleBack}
                    onCalculate={handleCalculateCallback}
                    onApproval={openApprovalCallback}
                    onExportSummary={handleExportSummary}
                    onExportPayslips={handleExportPayslips}
                    onEditDetail={handleEditDetailCallback}
                    onUpdateHeader={handleUpdateHeader}
                    actionLoading={actionLoading}
                    detailLoading={detailLoading}
                    canEdit={canEdit}
                />

                <PayrollDetailEditModal
                    isOpen={detailEditModal.open}
                    onClose={() => setDetailEditModal({ open: false, data: null })}
                    onSubmit={handleEditDetail}
                    loading={editLoading}
                    detail={detailEditModal.data}
                />

                {/* ApprovalModal must be here too — detail view early-returns before the list view's modal */}
                <ApprovalModal
                    isOpen={approvalModal.open}
                    onClose={() => setApprovalModal({ open: false, payroll: null, action: null })}
                    onConfirm={handleApprovalAction}
                    loading={actionLoading}
                    action={approvalModal.action}
                    payroll={approvalModal.payroll}
                />
            </div>
        );
    }

    // ─────────────────────────────────────────────────────────
    // LIST VIEW
    // ─────────────────────────────────────────────────────────
    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Bảng lương</h1>
                        <p className="text-sm text-slate-500">Quản lý bảng lương hàng tháng</p>
                    </div>
                </div>
                {authService.hasPermission("PAYROLL_CREATE") && (
                    <Button onClick={() => setCreateModal(true)} className="gap-2">
                        <Plus className="h-4 w-4" /> Tạo bảng lương
                    </Button>
                )}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-slate-200">
                <div className="w-36">
                    <Select
                        label="Tháng"
                        value={filters.month}
                        onChange={(e) => setFilters({ ...filters, month: e.target.value })}
                        options={monthOptions}
                    />
                </div>
                <div className="w-32">
                    <Select
                        label="Năm"
                        value={filters.year}
                        onChange={(e) => setFilters({ ...filters, year: e.target.value })}
                        options={yearOptions}
                    />
                </div>
                <div className="w-44">
                    <Select
                        label="Trạng thái"
                        value={filters.status}
                        onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                        options={STATUS_OPTIONS}
                    />
                </div>
            </div>

            {/* Table */}
            <PayrollTable
                data={payrolls}
                loading={loading}
                search={search}
                onSearchChange={setSearch}
                pagination={pagination}
                onPaginationChange={setPagination}
                totalPages={totalPages}
                onViewDetail={handleViewDetail}
                onCalculate={handleCalculate}
                onSubmit={(p) => openApprovalModal(p, "submit")}
                onApprove={(p) => openApprovalModal(p, "approve")}
                onReject={(p) => openApprovalModal(p, "reject")}
                onLock={(p) => openApprovalModal(p, "lock")}
                onUnlock={(p) => openApprovalModal(p, "unlock")}
                onSendPayslips={(p) => openApprovalModal(p, "sendPayslips")}
                onExportSummary={handleExportSummary}
                onExportPayslips={handleExportPayslips}
            />

            {/* Modals */}
            <CreatePayrollModal
                isOpen={createModal}
                onClose={() => setCreateModal(false)}
                onSubmit={handleCreate}
                loading={createLoading}
            />

            <ApprovalModal
                isOpen={approvalModal.open}
                onClose={() => setApprovalModal({ open: false, payroll: null, action: null })}
                onConfirm={handleApprovalAction}
                loading={actionLoading}
                action={approvalModal.action}
                payroll={approvalModal.payroll}
            />
        </div>
    );
}
