"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { ShieldAlert, Plus } from "lucide-react";
import PenaltyTable from "./components/PenaltyTable";
import PenaltyFormModal from "./components/PenaltyFormModal";
import { penaltiesService } from "@/services";

const PAGE_SIZE = 10;

const emptyForm = {
    name: "",
    penaltyType: "",
    severityLevel: "",
    deductionAmount: "",
    deductionPercentage: "",
    description: "",
    status: "ACTIVE",
};

const emptyFilters = {
    penaltyType: "",
    severityLevel: "",
    status: "",
    minDeductionAmount: "",
    maxDeductionAmount: "",
};

export default function PenaltiesPage() {
    // ============ STATE ============
    const [penalties, setPenalties] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [filters, setFilters] = useState(emptyFilters);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal state
    const [formModal, setFormModal] = useState({ open: false, mode: "add", data: null });
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
    const [submitting, setSubmitting] = useState(false);

    const { success, error: showError } = useToast();

    // Debounce timer ref for search
    const searchTimerRef = useRef(null);

    // ============ FETCH DATA ============
    const fetchPenalties = useCallback(async (searchValue, filtersValue, page) => {
        try {
            setLoading(true);
            const params = { page, limit: PAGE_SIZE };

            if (searchValue?.trim()) params.search = searchValue.trim();
            if (filtersValue.penaltyType) params.penaltyType = filtersValue.penaltyType;
            if (filtersValue.severityLevel) params.severityLevel = filtersValue.severityLevel;
            if (filtersValue.status) params.status = filtersValue.status;
            if (filtersValue.minDeductionAmount) params.minDeductionAmount = filtersValue.minDeductionAmount;
            if (filtersValue.maxDeductionAmount) params.maxDeductionAmount = filtersValue.maxDeductionAmount;

            const res = await penaltiesService.getAll(params);
            setPenalties(res.data?.items || []);
            setTotalPages(res.data?.pagination?.totalPages || 1);
            setTotalItems(res.data?.pagination?.total || 0);
        } catch (err) {
            showError("Không thể tải danh sách quy định hình phạt");
        } finally {
            setLoading(false);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchPenalties(search, filters, currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch khi filter hoặc page thay đổi
    useEffect(() => {
        fetchPenalties(search, filters, currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, currentPage]);

    // ============ SEARCH với DEBOUNCE ============
    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchPenalties(value, filters, 1);
        }, 400);
    };

    // ============ FILTER CHANGE ============
    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    // ============ FORM VALIDATION ============
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Tên hình phạt là bắt buộc";
        if (!formData.penaltyType) errors.penaltyType = "Loại hình phạt là bắt buộc";
        if (!formData.severityLevel) errors.severityLevel = "Mức độ là bắt buộc";

        if (formData.deductionAmount) {
            const amount = Number(formData.deductionAmount);
            if (isNaN(amount) || amount < 0)
                errors.deductionAmount = "Số tiền trừ phải lớn hơn hoặc bằng 0";
        }

        if (formData.deductionPercentage) {
            const percentage = Number(formData.deductionPercentage);
            if (isNaN(percentage) || percentage < 0)
                errors.deductionPercentage = "Phần trăm trừ phải lớn hơn hoặc bằng 0";
            else if (percentage > 100)
                errors.deductionPercentage = "Phần trăm trừ không được vượt quá 100";
        }

        return Object.keys(errors).length > 0 ? errors : null;
    };

    // ============ CRUD HANDLERS ============
    const handleOpenAdd = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setFormModal({ open: true, mode: "add", data: null });
    };

    const handleOpenEdit = (penalty) => {
        setFormData({
            name: penalty.name,
            penaltyType: penalty.penaltyType,
            severityLevel: penalty.severityLevel,
            deductionAmount: penalty.deductionAmount != null ? String(penalty.deductionAmount) : "",
            deductionPercentage: penalty.deductionPercentage != null ? String(penalty.deductionPercentage) : "",
            description: penalty.description || "",
            status: penalty.status,
        });
        setFormErrors({});
        setFormModal({ open: true, mode: "edit", data: penalty });
    };

    const handleSubmitForm = async () => {
        const errors = validateForm();
        if (errors) {
            setFormErrors(errors);
            return;
        }

        const penaltyData = {
            name: formData.name.trim(),
            penaltyType: formData.penaltyType,
            severityLevel: formData.severityLevel,
            deductionAmount: formData.deductionAmount ? parseFloat(formData.deductionAmount) : null,
            deductionPercentage: formData.deductionPercentage ? parseFloat(formData.deductionPercentage) : null,
            description: formData.description.trim() || null,
            status: formData.status,
        };

        try {
            setSubmitting(true);
            if (formModal.mode === "add") {
                await penaltiesService.create(penaltyData);
                success("Thêm quy định hình phạt thành công");
            } else {
                await penaltiesService.update(formModal.data.id, penaltyData);
                success("Cập nhật quy định hình phạt thành công");
            }
            setFormModal({ open: false, mode: "add", data: null });
            fetchPenalties(search, filters, currentPage);
        } catch (err) {
            const resData = err.response?.data;
            if (resData?.errors && Array.isArray(resData.errors)) {
                const beErrors = {};
                resData.errors.forEach((e) => {
                    if (e.property && e.constraints) {
                        beErrors[e.property] = Object.values(e.constraints)[0];
                    }
                });
                if (Object.keys(beErrors).length > 0) {
                    setFormErrors(beErrors);
                    return;
                }
            }
            showError(resData?.message || "Đã xảy ra lỗi");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDelete = (penalty) => {
        setDeleteModal({ open: true, data: penalty });
    };

    const handleConfirmDelete = async () => {
        try {
            await penaltiesService.delete(deleteModal.data.id);
            setDeleteModal({ open: false, data: null });
            success("Xóa quy định hình phạt thành công");
            // Nếu xóa item cuối cùng trên trang, lùi về trang trước
            if (penalties.length <= 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchPenalties(search, filters, currentPage);
            }
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi khi xóa");
        }
    };

    // ============ RENDER ============
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-red-500 text-white">
                        <ShieldAlert className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Quy định hình phạt
                        </h1>
                        <p className="text-sm text-slate-500">
                            Quản lý các quy định hình phạt trong công ty
                        </p>
                    </div>
                </div>
                <Button onClick={handleOpenAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm quy định
                </Button>
            </div>

            {/* Table */}
            <PenaltyTable
                data={penalties}
                loading={loading}
                search={search}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterChange={handleFilterChange}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={totalItems}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
            />

            {/* Add/Edit Modal */}
            <PenaltyFormModal
                isOpen={formModal.open}
                onClose={() => setFormModal({ open: false, mode: "add", data: null })}
                onSubmit={handleSubmitForm}
                formData={formData}
                onFormChange={setFormData}
                errors={formErrors}
                mode={formModal.mode}
                submitting={submitting}
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, data: null })}
                onConfirm={handleConfirmDelete}
                title="Xóa quy định hình phạt"
                description={`Bạn có chắc chắn muốn xóa quy định "${deleteModal.data?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="destructive"
            />
        </div>
    );
}
