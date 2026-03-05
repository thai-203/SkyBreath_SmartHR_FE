"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { Clock, Plus } from "lucide-react";
import OvertimeTable from "./components/OvertimeTable";
import OvertimeFormModal from "./components/OvertimeFormModal";
import { overtimeRulesService } from "@/services";
import { departmentsService } from "@/services";

const PAGE_SIZE = 5;

const emptyForm = {
    name: "",
    salaryMultiplier: "",
    maxHoursPerDay: "",
    maxHoursPerMonth: "",
    departmentIds: [],
    status: "ACTIVE",
};

const emptyFilters = {
    status: "",
    departmentId: "",
    minMultiplier: "",
    maxMultiplier: "",
    minHoursPerDay: "",
    maxHoursPerDay: "",
    minHoursPerMonth: "",
    maxHoursPerMonth: "",
};

export default function OvertimeRulesPage() {
    // ============ STATE ============
    const [rules, setRules] = useState([]);
    const [departments, setDepartments] = useState([]);
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
    const fetchRules = useCallback(async (searchValue, filtersValue, page) => {
        try {
            setLoading(true);
            const params = { page, limit: PAGE_SIZE };

            if (searchValue?.trim()) params.search = searchValue.trim();
            if (filtersValue.status) params.status = filtersValue.status;
            if (filtersValue.departmentId) params.departmentId = filtersValue.departmentId;
            if (filtersValue.minMultiplier) params.minMultiplier = filtersValue.minMultiplier;
            if (filtersValue.maxMultiplier) params.maxMultiplier = filtersValue.maxMultiplier;
            if (filtersValue.minHoursPerDay) params.minHoursPerDay = filtersValue.minHoursPerDay;
            if (filtersValue.maxHoursPerDay) params.maxHoursPerDay = filtersValue.maxHoursPerDay;
            if (filtersValue.minHoursPerMonth) params.minHoursPerMonth = filtersValue.minHoursPerMonth;
            if (filtersValue.maxHoursPerMonth) params.maxHoursPerMonth = filtersValue.maxHoursPerMonth;

            const res = await overtimeRulesService.getAll(params);
            setRules(res.data?.items || []);
            setTotalPages(res.data?.pagination?.totalPages || 1);
            setTotalItems(res.data?.pagination?.total || 0);
        } catch (err) {
            showError("Không thể tải danh sách quy định làm thêm giờ");
        } finally {
            setLoading(false);
        }
    }, []);

    const fetchDepartments = useCallback(async () => {
        try {
            const res = await departmentsService.getList();
            setDepartments(res.data || []);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu phòng ban:", err);
        }
    }, []);

    // Initial load
    useEffect(() => {
        fetchRules(search, filters, currentPage);
        fetchDepartments();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Re-fetch khi filter hoặc page thay đổi
    useEffect(() => {
        fetchRules(search, filters, currentPage);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filters, currentPage]);

    // ============ SEARCH với DEBOUNCE ============
    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchRules(value, filters, 1);
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
        if (!formData.name.trim()) errors.name = "Tên quy định là bắt buộc";

        const multiplier = Number(formData.salaryMultiplier);
        if (!formData.salaryMultiplier || multiplier <= 0)
            errors.salaryMultiplier = "Hệ số lương phải lớn hơn 0";
        else if (multiplier > 99.9)
            errors.salaryMultiplier = "Hệ số lương không được vượt quá 99.9";

        const hoursPerDay = Number(formData.maxHoursPerDay);
        if (!formData.maxHoursPerDay || hoursPerDay <= 0)
            errors.maxHoursPerDay = "Giờ OT tối đa/ngày phải lớn hơn 0";
        else if (hoursPerDay > 24)
            errors.maxHoursPerDay = "Giờ OT tối đa/ngày không được vượt quá 24";

        const hoursPerMonth = Number(formData.maxHoursPerMonth);
        if (!formData.maxHoursPerMonth || hoursPerMonth <= 0)
            errors.maxHoursPerMonth = "Giờ OT tối đa/tháng phải lớn hơn 0";
        else if (hoursPerMonth > 744)
            errors.maxHoursPerMonth = "Giờ OT tối đa/tháng không được vượt quá 744";

        if (!formData.departmentIds || formData.departmentIds.length === 0)
            errors.departmentIds = "Vui lòng chọn ít nhất một phòng ban";
        return Object.keys(errors).length > 0 ? errors : null;
    };

    // ============ CRUD HANDLERS ============
    const handleOpenAdd = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setFormModal({ open: true, mode: "add", data: null });
    };

    const handleOpenEdit = (rule) => {
        setFormData({
            name: rule.name,
            salaryMultiplier: String(rule.salaryMultiplier),
            maxHoursPerDay: String(rule.maxHoursPerDay),
            maxHoursPerMonth: String(rule.maxHoursPerMonth),
            departmentIds: rule.departments?.map((d) => d.id) || [],
            status: rule.status,
        });
        setFormErrors({});
        setFormModal({ open: true, mode: "edit", data: rule });
    };

    const handleSubmitForm = async () => {
        const errors = validateForm();
        if (errors) {
            setFormErrors(errors);
            return;
        }

        const ruleData = {
            name: formData.name.trim(),
            salaryMultiplier: parseFloat(formData.salaryMultiplier),
            maxHoursPerDay: parseInt(formData.maxHoursPerDay),
            maxHoursPerMonth: parseInt(formData.maxHoursPerMonth),
            departmentIds: formData.departmentIds,
            status: formData.status,
        };

        try {
            setSubmitting(true);
            if (formModal.mode === "add") {
                await overtimeRulesService.create(ruleData);
                success("Thêm quy định OT thành công");
            } else {
                await overtimeRulesService.update(formModal.data.id, ruleData);
                success("Cập nhật quy định OT thành công");
            }
            setFormModal({ open: false, mode: "add", data: null });
            fetchRules(search, filters, currentPage);
        } catch (err) {
            const resData = err.response?.data;
            // Nếu BE trả về validation errors, map vào form fields
            if (resData?.errors && Array.isArray(resData.errors)) {
                const beErrors = {};
                resData.errors.forEach((e) => {
                    if (e.property && e.constraints) {
                        // Lấy message đầu tiên từ constraints
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

    const handleOpenDelete = (rule) => {
        setDeleteModal({ open: true, data: rule });
    };

    const handleConfirmDelete = async () => {
        try {
            await overtimeRulesService.delete(deleteModal.data.id);
            setDeleteModal({ open: false, data: null });
            success("Xóa quy định OT thành công");
            // Nếu xóa item cuối cùng trên trang, lùi về trang trước
            if (rules.length <= 1 && currentPage > 1) {
                setCurrentPage(currentPage - 1);
            } else {
                fetchRules(search, filters, currentPage);
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
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500 text-white">
                        <Clock className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">
                            Quy định làm thêm giờ
                        </h1>
                        <p className="text-sm text-slate-500">
                            Quản lý các quy định OT trong công ty
                        </p>
                    </div>
                </div>
                <Button onClick={handleOpenAdd} className="gap-2">
                    <Plus className="h-4 w-4" />
                    Thêm quy định
                </Button>
            </div>

            {/* Table */}
            <OvertimeTable
                data={rules}
                loading={loading}
                search={search}
                onSearchChange={handleSearchChange}
                filters={filters}
                onFilterChange={handleFilterChange}
                departments={departments}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                pageSize={PAGE_SIZE}
                totalItems={totalItems}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
            />

            {/* Add/Edit Modal */}
            <OvertimeFormModal
                isOpen={formModal.open}
                onClose={() => setFormModal({ open: false, mode: "add", data: null })}
                onSubmit={handleSubmitForm}
                formData={formData}
                onFormChange={setFormData}
                errors={formErrors}
                mode={formModal.mode}
                departments={departments}
                submitting={submitting}
            />

            {/* Delete Confirm Modal */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, data: null })}
                onConfirm={handleConfirmDelete}
                title="Xóa quy định OT"
                description={`Bạn có chắc chắn muốn xóa quy định "${deleteModal.data?.name}"? Hành động này không thể hoàn tác.`}
                confirmText="Xóa"
                cancelText="Hủy"
                variant="destructive"
            />
        </div>
    );
}
