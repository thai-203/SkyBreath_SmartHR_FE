"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/common/Button";
import { ConfirmModal } from "@/components/common/Modal";
import { useToast } from "@/components/common/Toast";
import { FolderGit2, Plus } from "lucide-react";
import RequestGroupsTable from "./components/RequestGroupsTable";
import RequestGroupFormModal from "./components/RequestGroupFormModal";
import WorkflowConfigModal from "./components/WorkflowConfigModal";
import { requestGroupsService } from "@/services/request-groups.service";
import { RoleService } from "@/services/roles.service";
import { useRouter } from "next/navigation";

const PAGE_SIZE = 10;

const emptyForm = {
    name: "",
    code: "",
    description: "",
    status: "ACTIVE",
};

export default function RequestGroupsPage() {
    const [groups, setGroups] = useState([]);
    const [roles, setRoles] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalItems, setTotalItems] = useState(0);

    // Modal state
    const [formModal, setFormModal] = useState({ open: false, mode: "add", data: null });
    const [workflowModal, setWorkflowModal] = useState({ open: false, data: null });
    const [formData, setFormData] = useState(emptyForm);
    const [formErrors, setFormErrors] = useState({});
    const [deleteModal, setDeleteModal] = useState({ open: false, data: null });
    const [submitting, setSubmitting] = useState(false);

    const { success, error: showError } = useToast();
    const router = useRouter();

    const searchTimerRef = useRef(null);

    const fetchGroups = useCallback(async (searchValue, page) => {
        try {
            setLoading(true);
            const params = { skip: (page - 1) * PAGE_SIZE, take: PAGE_SIZE };
            if (searchValue?.trim()) params.search = searchValue.trim();

            const res = await requestGroupsService.getAll(params);
            setGroups(res.items || []);
            setTotalItems(res.total || 0);
            setTotalPages(Math.ceil((res.total || 0) / PAGE_SIZE) || 1);
        } catch (err) {
            showError("Không thể tải danh sách Nhóm đơn từ");
        } finally {
            setLoading(false);
        }
    }, [showError]);

    const fetchRoles = useCallback(async () => {
        try {
            const res = await RoleService.getRoles();
            setRoles(res.data || []);
        } catch (err) {
            console.error("Lỗi khi tải dữ liệu vai trò:", err);
        }
    }, []);

    useEffect(() => {
        fetchGroups(search, currentPage);
        fetchRoles();
    }, [currentPage, fetchGroups, fetchRoles, search]);

    const handleSearchChange = (value) => {
        setSearch(value);
        if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
        searchTimerRef.current = setTimeout(() => {
            setCurrentPage(1);
            fetchGroups(value, 1);
        }, 400);
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = "Tên nhóm đơn là bắt buộc";
        if (!formData.code.trim()) errors.code = "Mã nhóm đơn là bắt buộc";
        return Object.keys(errors).length > 0 ? errors : null;
    };

    const handleOpenAdd = () => {
        setFormData(emptyForm);
        setFormErrors({});
        setFormModal({ open: true, mode: "add", data: null });
    };

    const handleOpenEdit = (group) => {
        setFormData({
            name: group.name,
            code: group.code || "",
            description: group.description || "",
            status: group.status || "ACTIVE",
        });
        setFormErrors({});
        setFormModal({ open: true, mode: "edit", data: group });
    };

    const handleOpenWorkflow = (group) => {
        setWorkflowModal({ open: true, data: group });
    };

    const submitForm = async () => {
        const errors = validateForm();
        if (errors) {
            setFormErrors(errors);
            return;
        }

        try {
            setSubmitting(true);
            if (formModal.mode === "add") {
                await requestGroupsService.create(formData);
                success("Thêm nhóm đơn thành công");
            } else {
                await requestGroupsService.update(formModal.data.id, formData);
                success("Cập nhật nhóm đơn thành công");
            }
            setFormModal({ open: false, mode: "add", data: null });
            fetchGroups(search, currentPage);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi");
        } finally {
            setSubmitting(false);
        }
    };

    const submitWorkflow = async (workflows) => {
        try {
            setSubmitting(true);
            await requestGroupsService.update(workflowModal.data.id, { workflows });
            success("Cấu hình luồng duyệt thành công");
            setWorkflowModal({ open: false, data: null });
            fetchGroups(search, currentPage);
        } catch (err) {
            showError(err.response?.data?.message || "Đã xảy ra lỗi");
        } finally {
            setSubmitting(false);
        }
    };

    const handleOpenDelete = (group) => {
        setDeleteModal({ open: true, data: group });
    };

    const confirmDelete = async () => {
        try {
            await requestGroupsService.delete(deleteModal.data.id);
            setDeleteModal({ open: false, data: null });
            success("Xóa nhóm đơn thành công");
            fetchGroups(search, currentPage);
        } catch (err) {
            showError(err.response?.data?.message || "Nhóm đơn đang chứa loại đơn, không thể xoá!");
        }
    };

    const handleViewDetail = (group) => {
        router.push(`/requests/groups/${group.id}`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between p-4 bg-white rounded-lg shadow-sm border border-slate-200">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-500 text-white">
                        <FolderGit2 className="h-5 w-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-slate-900">Quản lý Nhóm đơn từ</h1>
                        <p className="text-sm text-slate-500">Thiết lập danh mục và luồng duyệt đơn</p>
                    </div>
                </div>
                <Button onClick={handleOpenAdd} className="gap-2 bg-indigo-600 hover:bg-indigo-700">
                    <Plus className="h-4 w-4" /> Thêm nhóm đơn
                </Button>
            </div>

            <RequestGroupsTable
                data={groups}
                loading={loading}
                search={search}
                onSearchChange={handleSearchChange}
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onEdit={handleOpenEdit}
                onDelete={handleOpenDelete}
                onConfig={handleOpenWorkflow}
                onView={handleViewDetail}
            />

            <RequestGroupFormModal
                isOpen={formModal.open}
                onClose={() => setFormModal({ open: false, mode: "add", data: null })}
                onSubmit={submitForm}
                formData={formData}
                onFormChange={setFormData}
                errors={formErrors}
                mode={formModal.mode}
                submitting={submitting}
            />

            <WorkflowConfigModal
                isOpen={workflowModal.open}
                onClose={() => setWorkflowModal({ open: false, data: null })}
                groupData={workflowModal.data}
                roles={roles}
                onSubmit={submitWorkflow}
                submitting={submitting}
            />

            <ConfirmModal
                isOpen={deleteModal.open}
                onClose={() => setDeleteModal({ open: false, data: null })}
                onConfirm={confirmDelete}
                title="Xóa nhóm đơn"
                description={`Bạn có chắc muốn xóa nhóm đơn "${deleteModal.data?.name}"?`}
                confirmText="Xóa"
                variant="destructive"
            />
        </div>
    );
}
