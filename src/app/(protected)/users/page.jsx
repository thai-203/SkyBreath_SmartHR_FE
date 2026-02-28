"use client";

import { useState, useEffect, useCallback } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/common/Button";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { userService } from "@/services";
import { validate, required, email, regex } from "@/lib/validation";

// Local components
import UserTable from "./components/UserTable";
import UserFormModal from "./components/UserFormModal";
import UserDeleteModal from "./components/UserDeleteModal";
import UserDetailModal from "./components/UserDetailModal";
import UserLockModal from "./components/UserLockModal";
import { Select } from "@/components/common/Select";
import UserRemoveRoleModal from "./components/UserRemoveRoleModal";
import { userRoleService } from "@/services/user-role.service";
import UserResetPasswordModal from "./components/UserResetPasswordModal";

const initialFormData = {
  username: "",
  email: "",
  password: "",
  role: "",
  status: "ACTIVE",
};

export default function UsersPage() {
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
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isLockOpen, setIsLockOpen] = useState(false);
  const [isRemoveConfirmOpen, setIsRemoveConfirmOpen] = useState(false);
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [lockAction, setLockAction] = useState("lock"); // "lock" or "unlock"
  const [selectedUser, setSelectedUser] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  // Dropdown data
  const [roleList, setRoleList] = useState([]);
  const [statusList, setStatusList] = useState([]);

  const [filters, setFilters] = useState({
    roleId: "",
    userStatus: "",
  });

  // ==================== API Calls ====================
  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await userService.getAll({
        page: pagination.pageIndex + 1,
        limit: pagination.pageSize,
        search,
        roles: filters.roleId || undefined,
        statuses: filters.userStatus || undefined,
      });

      const data = response.data || {};
      setData(data.data || []);
      setTotalPages(data.meta?.totalPages || 1);
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setLoading(false);
    }
  }, [pagination.pageIndex, pagination.pageSize, search, error, filters]);

  const fetchDropdownData = async () => {
    try {
      const metaRes = await userService.getMetadata();
      console.log(metaRes);

      setRoleList(
        (metaRes.data?.roles || []).map((r) => ({
          value: r.id,
          label: r.roleName,
        })),
      );
      setStatusList(
        (metaRes.data?.statusOptions || []).map((s) => ({
          value: s.value,
          label: s.label,
        })),
      );
    } catch (err) {
      console.error("Error fetching dropdown data:", err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [pagination.pageIndex, pagination.pageSize, search, fetchUsers, filters]);

  useEffect(() => {
    fetchDropdownData();
  }, []);

  // ==================== Handlers ====================
  const handleCreate = () => {
    setFormData(initialFormData);
    setErrors({});
    setIsCreateOpen(true);
  };

  const handleEdit = (user) => {
    setSelectedUser(user);
    setFormData({
      username: user.username,
      email: user.email,
      password: user.password || "",
      role: user.userRoles[0]?.role.id || "",
      status: user.status,
    });
    setErrors({});
    if (isDetailOpen) {
      setIsDetailOpen(false);
    }
    setIsEditOpen(true);
  };

  const handleDeleteClick = (user) => {
    setSelectedUser(user);
    setIsDeleteOpen(true);
  };

  const handleViewDetail = (user) => {
    setSelectedUser(user);
    setIsDetailOpen(true);
  };

  const handleRemoveRoleClick = (user) => {
    setSelectedUser(user);
    setIsRemoveConfirmOpen(true);
  };

  const handleResetModalClick = (user) => {
    setSelectedUser(user);
    setIsResetModalOpen(true);
  };

  const validateForm = (mode = "create") => {
    const rules = {
      role: [required("Vai trò là bắt buộc")],
      status: [required("Trạng thái là bắt buộc")],
    };

    // Chỉ validate username + email khi CREATE
    if (mode === "create") {
      rules.username = [
        required("Tên đăng nhập là bắt buộc"),
        regex(
          /^[a-zA-Z0-9_.-]+$/,
          "Tên đăng nhập chỉ được chứa chữ, số, dấu gạch ngang, dấu chấm và gạch dưới",
        ),
      ];

      rules.email = [
        required("Email là bắt buộc"),
        email("Email không hợp lệ"),
      ];

      rules.password = [
        required("Mật khẩu là bắt buộc"),
        regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
        ),
      ];
    }

    // Edit: chỉ validate password nếu có nhập
    if (mode === "edit" && formData.password) {
      rules.password = [
        regex(
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
          "Mật khẩu phải có ít nhất 8 ký tự, gồm chữ hoa, chữ thường, số và ký tự đặc biệt",
        ),
      ];
    }

    const validationErrors = validate(formData, rules);

    if (validationErrors) {
      setErrors(validationErrors);
      return false;
    }

    setErrors({});
    return true;
  };

  const handleSubmitCreate = async () => {
    if (!validateForm("create")) return;

    setFormLoading(true);
    try {
      const response = await userService.create({
        username: formData.username,
        email: formData.email,
        password: formData.password,
        roleIds: [formData.role],
        status: formData.status,
      });
      success(response.message || "Tạo mới người dùng thành công");
      setIsCreateOpen(false);
      fetchUsers();
      fetchDropdownData();
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitEdit = async () => {
    if (!validateForm("edit")) return;

    setFormLoading(true);
    try {
      const response = await userService.update(selectedUser.id, {
        email: formData.email,
        username: formData.username,
        password: formData.password || undefined, // Nếu không nhập password mới thì không gửi trường này để giữ nguyên mật khẩu cũ
        roleIds: [formData.role],
        status: formData.status,
      });
      success(response.message || "Cập nhật người dùng thành công");
      setIsEditOpen(false);
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      const response = await userService.delete(selectedUser.id);
      success(response.message || "Xóa người dùng thành công");
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleLockClick = (user) => {
    setSelectedUser(user);
    setLockAction("lock");
    setIsLockOpen(true);
  };

  const handleUnlockClick = (user) => {
    setSelectedUser(user);
    setLockAction("unlock");
    setIsLockOpen(true);
  };

  const handleConfirmLock = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const response =
        lockAction === "lock"
          ? await userService.lockAccount(selectedUser.id)
          : await userService.unlockAccount(selectedUser.id);

      const actionText = lockAction === "lock" ? "Khóa" : "Mở khóa";
      success(response.message || `${actionText} tài khoản thành công`);
      setIsLockOpen(false);
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleConfirmRemoveRole = async () => {
    if (!selectedUser) return;
    setFormLoading(true);
    try {
      const response = await userRoleService.delete(selectedUser.id);
      success(response.message || "Xóa người dùng thành công");
      setIsRemoveConfirmOpen(false);
      setSelectedUser({ ...selectedUser, userRoles: [] });
      fetchUsers(); // Cập nhật lại user đã xóa role để không hiển thị role đó ở modal detail
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  const handleSubmitResetPassword = async () => {
    if (!selectedUser) return;

    setFormLoading(true);
    try {
      const response = await userService.resetPassword(selectedUser.id);
      success(response.message || "Đặt lại mật khẩu thành công");
      setIsResetModalOpen(false);
      fetchUsers();
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra");
    } finally {
      setFormLoading(false);
    }
  };

  // ==================== Render ====================
  return (
    <div className="space-y-6">
      <PageTitle title="Quản lý người dùng" />

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            Quản lý người dùng
          </h1>
          <p className="text-slate-500">
            Danh sách tất cả người dùng trong hệ thống
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 p-4 bg-white rounded-lg border border-slate-200">
        <div className="w-48">
          <Select
            label="Vai trò"
            value={filters.roleId}
            onChange={(e) => setFilters({ ...filters, roleId: e.target.value })}
            options={[
              { value: "", label: "Tất cả" },
              ...(roleList || []).map((d) => ({
                value: d.value,
                label: d.label,
              })),
            ]}
          />
        </div>
        <div className="w-48">
          <Select
            label="Trạng thái"
            value={filters.userStatus}
            onChange={(e) =>
              setFilters({ ...filters, userStatus: e.target.value })
            }
            options={[
              { value: "", label: "Tất cả" },
              ...(statusList || []).map((p) => ({
                value: p.value,
                label: p.label,
              })),
            ]}
          />
        </div>
      </div>

      {/* Table */}
      <UserTable
        data={data}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        pagination={pagination}
        onPaginationChange={setPagination}
        totalPages={totalPages}
        onEdit={handleEdit}
        onDelete={handleDeleteClick}
        onViewDetail={handleViewDetail}
        onLock={handleLockClick}
        onUnlock={handleUnlockClick}
      />

      {/* Create Modal */}
      <UserFormModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSubmit={handleSubmitCreate}
        formData={formData}
        onFormChange={setFormData}
        errors={errors}
        roleList={roleList}
        statusList={statusList}
        loading={formLoading}
        mode="create"
      />

      {/* Edit Modal */}
      <UserFormModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSubmit={handleSubmitEdit}
        formData={formData}
        onFormChange={setFormData}
        errors={errors}
        roleList={roleList}
        statusList={statusList}
        loading={formLoading}
        mode="edit"
      />

      {/* Delete Modal */}
      <UserDeleteModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        user={selectedUser}
        loading={formLoading}
      />

      {/* Detail Modal */}
      <UserDetailModal
        isOpen={isDetailOpen}
        onClose={() => setIsDetailOpen(false)}
        user={selectedUser}
        onEdit={handleEdit}
        onRemoveRole={handleRemoveRoleClick}
        onResetPassword={handleResetModalClick}
      />

      {/* Lock/Unlock Modal */}
      <UserLockModal
        isOpen={isLockOpen}
        onClose={() => setIsLockOpen(false)}
        onConfirm={handleConfirmLock}
        user={selectedUser}
        loading={formLoading}
        action={lockAction}
      />

      {/* Remove Role Modal */}
      <UserRemoveRoleModal
        isOpen={isRemoveConfirmOpen}
        onClose={() => setIsRemoveConfirmOpen(false)}
        onConfirm={handleConfirmRemoveRole}
        user={selectedUser}
        loading={formLoading}
      />

      <UserResetPasswordModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleSubmitResetPassword}
        user={selectedUser}
        loading={formLoading}
      />
    </div>
  );
}
