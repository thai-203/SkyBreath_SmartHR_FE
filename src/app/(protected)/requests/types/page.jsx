"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { FileText, Plus } from "lucide-react";
import { PermissionGate } from "@/components/common/AuthGuard";
import RequestTypesTable from "./components/RequestTypesTable";
import RequestTypeFormModal from "./components/RequestTypeFormModal";
import RequestTypePolicyModal from "./components/RequestTypePolicyModal";
import RequestTypeDetailModal from "./components/RequestTypeDetailModal";
import { requestGroupsService } from "@/services/request-groups.service";
import { requestTypesService } from "@/services/request-types.service";
import { TRACKING_CYCLES, POLICY_UNITS } from "@/constants/request.enum";

const PAGE_SIZE = 10;

const emptyForm = {
    name: "",
    description: "",
    status: "ACTIVE",
    requestGroupId: "",
};

const emptyPolicy = {
    trackingCycle: TRACKING_CYCLES.MONTH,
    unit: POLICY_UNITS.DAY,
    maxQuantity: 0,
    isWorkedTime: false,
};

export default function RequestTypesPage() {
    const [types, setTypes] = useState([]);
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [selectedGroupId, setSelectedGroupId] = useState(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    // Modal: Tạo / Sửa basic info
    const [formModal, setFormModal] = useState({ open: false, mode: "add", data: null });
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});

    // Modal: Cấu hình Policy
    const [policyModal, setPolicyModal] = useState({ open: false, data: null });
    const [policyData, setPolicyData] = useState(emptyPolicy);
    const [policyErrors, setPolicyErrors] = useState({});

    // Modal: Xem chi tiết
    const [detailModal, setDetailModal] = useState({ open: false, data: null });

    // Modal: Xóa
    const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
    
    // Modal: Khôi phục
    const [restoreModal, setRestoreModal] = useState({ open: false, data: null });

    const [submitting, setSubmitting] = useState(false);

    const { success, error: showError } = useToast();
    const searchTimerRef = useRef(null);

    const fetchGroups = useCallback(async () => {
        try {
            const res = await requestGroupsService.getAll({ limit: 100 });
            setGroups(res.data?.data || []);
        } catch (err) {
            console.error("Lỗi tải nhóm đơn:", err);
        }
    }, []);

    const fetchTypes = useCallback(async (searchValue, page, groupId) => {
        try {
            setLoading(true);
            const apiParams = { page, limit: PAGE_SIZE };
            if (searchValue?.trim()) apiParams.search = searchValue.trim();
            if (groupId) apiParams.requestGroupId = groupId;

            const res = await requestTypesService.getAll(apiParams);
            
            const items = res.data?.data || [];
            const meta = res.data?.meta || {};
            
            setTypes(items);
            setTotalPages(meta.totalPages || 1);
        } catch (err) {
            showError("Không thể tải danh sách loại đơn");
        } finally {
            setLoading(false);
        }
    }, [showError]);

    useEffect(() => { fetchGroups(); }, [fetchGroups]);
    useEffect(() => { fetchTypes(search, currentPage, selectedGroupId); }, [currentPage, fetchTypes, search, selectedGroupId]);

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchTypes(value, 1, selectedGroupId);
        }, 400);
    };

    const handleGroupFilterChange = (groupId) => {
        setSelectedGroupId(groupId);
        setCurrentPage(1);
    };

    // ─── Form: Tạo / Sửa ────────────────────────────────────────────
    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Tên loại đơn là bắt buộc";
        if (!formData.requestGroupId) errors.requestGroupId = "Nhóm đơn là bắt buộc";
        return Object.keys(errors).length > 0 ? errors : null;
    };

    const handleOpenAdd = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setFormModal({ open: true, mode: "add", data: null });
    };

    const handleOpenEdit = (typeItem) => {
        setFormData({
            name: typeItem.name,
            description: typeItem.description || "",
            status: typeItem.status || "ACTIVE",
            requestGroupId: typeItem.requestGroupId || "",
        });
        setFormErrors({});
        setFormModal({ open: true, mode: "edit", data: typeItem });
    };

    const submitForm = async () => {
        const errors = validateForm();
        if (errors) { setFormErrors(errors); return; }

        const payload = {
            ...formData,
            requestGroupId: parseInt(formData.requestGroupId, 10),
        };

        try {
            setSubmitting(true);
            if (formModal.mode === "add") {
                await requestTypesService.create(payload);
                success("Thêm loại đơn thành công");
            } else {
                await requestTypesService.update(formModal.data.id, payload);
                success("Cập nhật loại đơn thành công");
            }
            setFormModal({ open: false, mode: "add", data: null });
            fetchTypes(search, currentPage, selectedGroupId);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Policy Modal ────────────────────────────────────────────────
    const handleOpenPolicy = (typeItem) => {
        let isUnlim = false;
        if (typeItem.policy && typeItem.policy.maxQuantity !== undefined && typeItem.policy.maxQuantity !== null) {
            isUnlim = parseFloat(typeItem.policy.maxQuantity) === 0;
        }

        setPolicyData({
            trackingCycle: typeItem.policy?.trackingCycle || TRACKING_CYCLES.MONTH,
            unit: typeItem.policy?.unit || POLICY_UNITS.DAY,
            maxQuantity: typeItem.policy?.maxQuantity ?? 0,
            isWorkedTime: typeItem.policy?.isWorkedTime ?? false,
            isUnlimited: isUnlim,
        });
        setPolicyErrors({});
        setPolicyModal({ open: true, data: typeItem });
    };

    const validatePolicy = () => {
        const errors = {};
        if (policyData.maxQuantity < 0) errors.maxQuantity = "Số lượng tối đa không được âm";
        return Object.keys(errors).length > 0 ? errors : null;
    };

    const submitPolicy = async () => {
        const errors = validatePolicy();
        if (errors) { setPolicyErrors(errors); return; }

        const payload = {
            ...policyData,
            maxQuantity: parseFloat(policyData.maxQuantity),
        };

        try {
            setSubmitting(true);
            await requestTypesService.updatePolicy(policyModal.data.id, payload);
            success("Cấu hình policy thành công");
            setPolicyModal({ open: false, data: null });
            fetchTypes(search, currentPage, selectedGroupId);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi khi lưu policy");
        } finally {
            setSubmitting(false);
        }
    };

    // ─── Detail Modal ────────────────────────────────────────────────
    const handleOpenDetail = (typeItem) => {
        setDetailModal({ open: true, data: typeItem });
    };

    // ─── Delete Modal ────────────────────────────────────────────────
    const handleOpenDelete = (typeItem) => {
        setDeleteModal({ open: true, data: typeItem });
    };

    const confirmDelete = async () => {
        try {
            await requestTypesService.delete(deleteModal.data.id);
            setDeleteModal({ open: false, data: null });
            success("Xóa loại đơn thành công");
            fetchTypes(search, currentPage, selectedGroupId);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi khi xóa");
        }
    };

    // ─── Restore Modal ───────────────────────────────────────────────
    const handleOpenRestore = (typeItem) => {
        setRestoreModal({ open: true, data: typeItem });
    };

    const confirmRestore = async () => {
        try {
            await requestTypesService.restore(restoreModal.data.id);
            setRestoreModal({ open: false, data: null });
            success(`Khôi phục loại đơn "${restoreModal.data?.name}" thành công. Trạng thái: Tạm ngưng.`);
            fetchTypes(search, currentPage, selectedGroupId);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi khi khôi phục");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        <FileText className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Quản lý Loại đơn từ</h1>
                        <p className="text-sm text-slate-500">Danh sách tất cả loại đơn từ trong hệ thống</p>
                    </div>
                </div>
                <PermissionGate permission="REQUEST_TYPE_CREATE">
                  <Button onClick={handleOpenAdd} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                      <Plus className="h-4 w-4" /> Thêm loại đơn
                  </Button>
                </PermissionGate>
            </div>

            <RequestTypesTable
                data={types}
                loading={loading}
                search={search}
                onSearchChange={handleSearchChange}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onDetail={handleOpenDetail}
                onPolicy={handleOpenPolicy}
                onRestore={handleOpenRestore}
                groups={groups}
                selectedGroupId={selectedGroupId}
                onGroupFilterChange={handleGroupFilterChange}
            />

            {/* Modal: Tạo / Sửa basic info */}
            <RequestTypeFormModal
                isOpen={formModal.open}
                onClose={() => setFormModal({ open: false, mode: "add", data: null })}
                onSubmit={submitForm}
                formData={formData}
                onFormChange={setFormData}
                errors={formErrors}
                mode={formModal.mode}
                submitting={submitting}
                groups={groups}
            />

            {/* Modal: Cấu hình Policy */}
            <RequestTypePolicyModal
                isOpen={policyModal.open}
                onClose={() => setPolicyModal({ open: false, data: null })}
                onSubmit={submitPolicy}
                policyData={policyData}
                onPolicyChange={setPolicyData}
                errors={policyErrors}
                typeName={policyModal.data?.name}
                submitting={submitting}
            />

            {/* Modal: Xem chi tiết */}
            <RequestTypeDetailModal
                isOpen={detailModal.open}
                onClose={() => setDetailModal({ open: false, data: null })}
                typeItem={detailModal.data}
                onEditPolicy={handleOpenPolicy}
            />

            {/* Modal: Xóa */}
            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, data: null })}
                onConfirm={confirmDelete}
                title="Xóa loại đơn"
                description={`Bạn có chắc muốn xóa loại đơn "${deleteModal.data?.name}"? Hệ thống sẽ giấu dữ liệu nếu đã có phát sinh thực tế.`}
                confirmText="Xóa"
                variant="destructive"
            />

            {/* Modal: Khôi phục */}
            <ConfirmModal
                isOpen={restoreModal.open}
                onClose={() => setRestoreModal({ open: false, data: null })}
                onConfirm={confirmRestore}
                title="Khôi phục loại đơn"
                description={`Khôi phục loại đơn "${restoreModal.data?.name}"? Loại đơn sẽ ở trạng thái Tạm ngưng, bạn cần bật sang Hoạt động để sử dụng.`}
                confirmText="Khôi phục"
                variant="default"
            />
        </div>
    );
}
