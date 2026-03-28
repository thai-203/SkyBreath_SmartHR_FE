"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { ShieldAlert, Plus } from "lucide-react";
import PenaltyTable from "./components/PenaltyTable";
import PenaltyFormModal from "./components/PenaltyFormModal";
import { penaltiesService } from "@/services";
import { authService } from "@/services";

const PAGE_SIZE = 10;

const emptyFilters = {
    violationType: "",
    status: "",
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
    const [formModalOpen, setFormModalOpen] = useState(false);
    const [editingPenalty, setEditingPenalty] = useState(null);
    const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
    const [submitting, setSubmitting] = useState(false);

    const { success, error: showError } = useToast();
    const searchTimerRef = useRef(null);

    // ============ FETCH DATA ============
    const fetchPenalties = useCallback(async (searchValue, filtersValue, page) => {
        try {
            setLoading(true);
            const params = { page, limit: PAGE_SIZE };

            if (searchValue?.trim()) params.search = searchValue.trim();
            if (filtersValue.violationType) params.violationType = filtersValue.violationType;
            if (filtersValue.status) params.status = filtersValue.status;

            const res = await penaltiesService.getAll(params);
            setPenalties(res.data?.items || []);
            setTotalPages(res.data?.pagination?.totalPages || 1);
            setTotalItems(res.data?.pagination?.total || 0);
        } catch (err) {
            showError("Không thể tải danh sách quy định vi phạm");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchPenalties(search, filters, currentPage);
    }, []);

    useEffect(() => {
        fetchPenalties(search, filters, currentPage);
    }, [filters, currentPage]);

    // ============ SEARCH ============
    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchPenalties(value, filters, 1);
        }, 400);
    };

    const handleFilterChange = (newFilters) => {
        setFilters(newFilters);
        setCurrentPage(1);
    };

    // ============ CRUD ============
    const handleOpenAdd = () => {
        setEditingPenalty(null);
        setFormModalOpen(true);
    };

    const handleOpenEdit = (penalty) => {
        setEditingPenalty(penalty);
        setFormModalOpen(true);
    };

    const handleFormSubmit = async (formData) => {
        try {
            setSubmitting(true);
            if (editingPenalty) {
                await penaltiesService.update(editingPenalty.id, formData);
                success("Cập nhật quy định vi phạm thành công");
            } else {
                await penaltiesService.create(formData);
                success("Tạo quy định vi phạm thành công");
            }
            setFormModalOpen(false);
            setEditingPenalty(null);
            fetchPenalties(search, filters, currentPage);
        } catch (err) {
            const msg = err.response?.data?.message || "Có lỗi xảy ra";
            showError(msg);
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
            success("Xóa quy định vi phạm thành công");
            if (penalties.length <= 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchPenalties(search, filters, currentPage);
            }
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi khi xóa");
        }
    };

    const violationLabel = deleteModal.data?.violationType === "LATE" ? "Đi muộn" : "Về sớm";

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
                            Quy định vi phạm
                        </h1>
                        <p className="text-sm text-slate-500">
                            Quản lý các quy định xử phạt đi muộn, về sớm
                        </p>
                    </div>
                </div>
                {authService.hasPermission("PENALTY_CREATE") && (
                    <Button onClick={handleOpenAdd} className="gap-2">
                        <Plus className="h-4 w-4" />
                        Thêm quy định
                    </Button>
                )}
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
                isOpen={formModalOpen}
                onClose={() => { setFormModalOpen(false); setEditingPenalty(null); }}
                onSubmit={handleFormSubmit}
                penalty={editingPenalty}
                loading={submitting}
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, data: null })}
                onConfirm={handleConfirmDelete}
                title="Xóa quy định vi phạm"
                description={`Bạn có chắc chắn muốn xóa quy định "${violationLabel}" [${deleteModal.data?.fromMinute}-${deleteModal.data?.toMinute} phút]? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="destructive"
            />
        </div>
    );
}
