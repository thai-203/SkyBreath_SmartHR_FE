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
import PayrollDetailTable from "./components/PayrollDetailTable";
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
    const handleViewDetail = async (payroll) => {
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
    };

    // ─── Create ───
    const handleCreate = async (form) => {
        setCreateLoading(true);
        try {
            const res = await payrollService.create(form);
            success("Tạo bảng lương thành công");
            setCreateModal(false);
            fetchPayrolls();
            // Auto-open the new payroll detail
            if (res?.data) handleViewDetail(res.data);
        } catch (err) {
            toastError(err?.response?.data?.message || "Lỗi khi tạo bảng lương");
        } finally {
            setCreateLoading(false);
        }
    };

    // ─── Calculate ───
    const handleCalculate = async (payroll) => {
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
    };

    // ─── Edit detail ───
    const handleEditDetail = async (detailId, form) => {
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
    };

    // ─── Approval Actions ───
    const openApprovalModal = (payroll, action) => {
        setApprovalModal({ open: true, payroll, action });
    };

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

    const handleExportSummary = async (payroll) => {
        try {
            const blob = await payrollService.exportSummary(payroll.id);
            downloadBlob(blob, `bang_luong_T${payroll.payrollMonth}_${payroll.payrollYear}.xlsx`);
            success("Xuất file tổng hợp thành công");
        } catch (err) { toastError("Lỗi khi xuất file"); }
    };

    const handleExportPayslips = async (payroll) => {
        try {
            const blob = await payrollService.exportPayslips(payroll.id);
            downloadBlob(blob, `phieu_luong_T${payroll.payrollMonth}_${payroll.payrollYear}.xlsx`);
            success("Xuất phiếu lương thành công");
        } catch (err) { toastError("Lỗi khi xuất phiếu lương"); }
    };

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

    return (
        <div className="space-y-6">
            {/* ── Detail / List toggle ── */}
            {selectedPayroll ? (
                /* ──────── DETAIL VIEW ──────── */
                <div className="space-y-6 animate-in fade-in duration-300">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <button
                                onClick={() => { setSelectedPayroll(null); setDetailData(null); }}
                                className="text-slate-400 hover:text-slate-600 text-sm font-medium transition-colors"
                            >
                                ← Quay lại
                            </button>
                            <div className="h-4 w-px bg-slate-300" />
                            <div>
                                <h1 className="text-2xl font-bold text-slate-900">
                                    Bảng lương Tháng {detailData?.payrollMonth}/{detailData?.payrollYear}
                                </h1>
                                {detailStatus && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${detailStatus.color}`}>
                                        {detailStatus.label}
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Action buttons based on status */}
                        <div className="flex flex-wrap gap-2">
                            {detailData?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_UPDATE") && (
                                <Button
                                    onClick={() => handleCalculate(detailData)}
                                    loading={actionLoading}
                                    className="gap-2 bg-amber-600 hover:bg-amber-700"
                                >
                                    ⚡ Tính toán tự động
                                </Button>
                            )}
                            {detailData?.payrollStatus === "DRAFT" && authService.hasPermission("PAYROLL_APPROVE") && (
                                <Button onClick={() => openApprovalModal(detailData, "submit")} className="gap-2 bg-blue-600 hover:bg-blue-700">
                                    📤 Gửi phê duyệt
                                </Button>
                            )}
                            {detailData?.payrollStatus === "PENDING_APPROVAL" && authService.hasPermission("PAYROLL_APPROVE") && (
                                <>
                                    <Button onClick={() => openApprovalModal(detailData, "approve")} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                                        ✅ Phê duyệt
                                    </Button>
                                    <Button onClick={() => openApprovalModal(detailData, "reject")} className="gap-2 bg-red-600 hover:bg-red-700">
                                        ❌ Từ chối
                                    </Button>
                                </>
                            )}
                            {detailData?.payrollStatus === "APPROVED" && authService.hasPermission("PAYROLL_LOCK") && (
                                <Button onClick={() => openApprovalModal(detailData, "lock")} className="gap-2 bg-slate-800 hover:bg-slate-900">
                                    <Lock className="h-4 w-4" /> Khóa bảng lương
                                </Button>
                            )}
                            {detailData?.payrollStatus === "LOCKED" && authService.hasPermission("PAYROLL_LOCK") && (
                                <Button onClick={() => openApprovalModal(detailData, "sendPayslips")} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                                    <Mail className="h-4 w-4" /> Gửi phiếu lương
                                </Button>
                            )}
                            {authService.hasPermission("PAYROLL_EXPORT") && (
                                <>
                                    <Button variant="outline" onClick={() => handleExportSummary(detailData)} className="gap-2">
                                        <FileSpreadsheet className="h-4 w-4" /> Xuất tổng hợp
                                    </Button>
                                    {detailData?.payrollStatus === "LOCKED" && (
                                        <Button variant="outline" onClick={() => handleExportPayslips(detailData)} className="gap-2">
                                            <Download className="h-4 w-4" /> Xuất phiếu lương
                                        </Button>
                                    )}
                                </>
                            )}
                        </div>
                    </div>

                    {/* Stats cards */}
                    {detailData && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "Số nhân viên", value: detailData.employeeCount || 0, unit: "NV", color: "bg-indigo-50 text-indigo-700" },
                                { label: "Tổng thực nhận", value: new Intl.NumberFormat("vi-VN", { notation: "compact" }).format(detailData.totalNetSalary || 0), unit: "₫", color: "bg-emerald-50 text-emerald-700" },
                                { label: "Tháng lương", value: `${detailData.payrollMonth}/${detailData.payrollYear}`, unit: "", color: "bg-blue-50 text-blue-700" },
                                { label: "Đã gửi phiếu", value: (detailData.details || []).filter(d => d.payslipSentAt).length, unit: "NV", color: "bg-amber-50 text-amber-700" },
                            ].map(({ label, value, unit, color }) => (
                                <div key={label} className={`rounded-xl p-4 ${color} border border-current/10`}>
                                    <p className="text-xs font-medium opacity-70">{label}</p>
                                    <p className="text-2xl font-bold mt-1">{value} <span className="text-sm font-normal opacity-70">{unit}</span></p>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Rejection note */}
                    {detailData?.rejectedReason && (
                        <div className="bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-700">
                            <strong>Lý do từ chối:</strong> {detailData.rejectedReason}
                        </div>
                    )}

                    {/* Detail table */}
                    <PayrollDetailTable
                        details={detailData?.details || []}
                        loading={detailLoading}
                        canEdit={canEdit && authService.hasPermission("PAYROLL_UPDATE")}
                        onEdit={(d) => setDetailEditModal({ open: true, data: d })}
                    />
                </div>
            ) : (
                /* ──────── LIST VIEW ──────── */
                <div className="space-y-6 animate-in fade-in duration-300">
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
                        onSendPayslips={(p) => openApprovalModal(p, "sendPayslips")}
                        onExportSummary={handleExportSummary}
                        onExportPayslips={handleExportPayslips}
                    />
                </div>
            )}

            {/* ── Modals ── */}
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

            <PayrollDetailEditModal
                isOpen={detailEditModal.open}
                onClose={() => setDetailEditModal({ open: false, data: null })}
                onSubmit={handleEditDetail}
                loading={editLoading}
                detail={detailEditModal.data}
            />
        </div>
    );
}
