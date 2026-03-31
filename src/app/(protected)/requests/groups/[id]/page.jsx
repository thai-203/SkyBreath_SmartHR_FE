"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { ArrowLeft, Box, Plus } from "lucide-react";
import RequestTypesTable from "./components/RequestTypesTable";
import RequestTypeFormModal from "./components/RequestTypeFormModal";
import { requestGroupsService } from "@/services/request-groups.service";
import { requestTypesService } from "@/services/request-types.service";
import { useRouter, useParams } from "next/navigation";

const PAGE_SIZE = 10;

const emptyForm = {
    name: "",
    description: "",
    status: "ACTIVE",
    policy: {
        trackingCycle: "MONTH",
        unit: "DAY",
        maxQuantity: 0,
        isWorkedTime: false,
    }
};

export default function RequestGroupDetailPage() {
    const params = useParams();
    const router = useRouter();
    const groupId = params.id;

    const [group, setGroup] = useState(null);
    const [types, setTypes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const [formModal, setFormModal] = useState({ open: false, mode: "add", data: null });
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
    const [submitting, setSubmitting] = useState(false);

    const { success, error: showError } = useToast();
    const searchTimerRef = useRef(null);

    const fetchGroupDetail = useCallback(async () => {
        try {
            const res = await requestGroupsService.getById(groupId);
            setGroup(res);
        } catch (err) {
            showError("Không lấy được thông tin nhóm đơn");
        }
    }, [groupId, showError]);

    const fetchTypes = useCallback(async (searchValue, page) => {
        try {
            setLoading(true);
            const apiParams = { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE, requestGroupId: groupId };
            if (searchValue?.trim()) apiParams.search = searchValue.trim();

            const res = await requestTypesService.getAll(apiParams);
            setTypes(res.items || []);
            setTotalPages(Math.ceil((res.total || 0) / PAGE_SIZE) || 1);
        } catch (err) {
            showError("Không thể tải danh sách loại đơn");
        } finally {
            setLoading(false);
        }
    }, [groupId, showError]);

    useEffect(() => {
        fetchGroupDetail();
    }, [fetchGroupDetail]);

    useEffect(() => {
        fetchTypes(search, currentPage);
    }, [currentPage, fetchTypes, search]);

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchTypes(value, 1);
        }, 400);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Tên loại đơn là bắt buộc";
        if (formData.policy.maxQuantity < 0) errors.maxQuantity = "Số lượng tối đa không được âm";
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
            policy: {
                trackingCycle: typeItem.policy?.trackingCycle || "MONTH",
                unit: typeItem.policy?.unit || "DAY",
                maxQuantity: typeItem.policy?.maxQuantity || 0,
                isWorkedTime: typeItem.policy?.isWorkedTime || false,
            }
        });
        setFormErrors({});
        setFormModal({ open: true, mode: "edit", data: typeItem });
    };

    const submitForm = async () => {
        const errors = validateForm();
        if (errors) {
            setFormErrors(errors);
            return;
        }

        const payload = { ...formData, requestGroupId: parseInt(groupId, 10), policy: { ...formData.policy, maxQuantity: parseFloat(formData.policy.maxQuantity) } };

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
            fetchTypes(search, currentPage);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDelete = (typeItem) => {
        setDeleteModal({ open: true, data: typeItem });
    };

    const confirmDelete = async () => {
        try {
            await requestTypesService.delete(deleteModal.data.id);
            setDeleteModal({ open: false, data: null });
            success("Xóa loại đơn thành công");
            fetchTypes(search, currentPage);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi khi xóa");
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="icon" onClick={() => router.push("/requests/groups")}>
                        <ArrowLeft className="h-4 w-4 text-slate-600" />
                    </Button>
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500 text-white">
                        <Box className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Nhóm: {group?.name || 'Đang tải...'}</h1>
                        <p className="text-sm text-slate-500">{group?.description || 'Chi tiết các loại đơn từ thuộc nhóm này'}</p>
                    </div>
                    <div className="flex-1" />
                    <Button onClick={handleOpenAdd} className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Plus className="h-4 w-4" /> Thêm loại đơn
                    </Button>
                </div>
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
            />

            <RequestTypeFormModal
                isOpen={formModal.open}
                onClose={() => setFormModal({ open: false, mode: "add", data: null })}
                onSubmit={submitForm}
                formData={formData}
                onFormChange={setFormData}
                errors={formErrors}
                mode={formModal.mode}
                submitting={submitting}
            />

            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, data: null })}
                onConfirm={confirmDelete}
                title="Xóa loại đơn"
                description={`Bạn có chắc muốn xóa loại đơn "${deleteModal.data?.name}"? Hệ thống sẽ giấu dữ liệu nếu đã có phát sinh thực tế.`}
                confirmText="Xóa"
                variant="destructive"
            />
        </div>
    );
}
