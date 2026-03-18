"use client";

import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import { Label } from "@/components/common/Label";
import { Select } from "@/components/common/Select";
import { Modal } from "@/components/common/Modal";

export default function UserFormModal({
  isOpen,
  onClose,
  onSubmit,
  formData,
  onFormChange,
  roleList = [],
  statusList = [],
  loading,
  errors = {},
  mode = "create",
}) {
  const isEdit = mode === "edit";
  const title = isEdit ? "Chỉnh sửa người dùng" : "Thêm người dùng mới";
  const submitText = isEdit ? "Lưu thay đổi" : "Tạo mới";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Tên đăng nhập *</Label>
          <Input
            value={formData.username || ""}
            onChange={(e) =>
              onFormChange({ ...formData, username: e.target.value })
            }
            placeholder="Nhập tên đăng nhập"
            error={errors.username}
          />
        </div>
        <div className="space-y-2">
          <Label>Email *</Label>
          <Input
            type="email"
            value={formData.email || ""}
            onChange={(e) =>
              onFormChange({ ...formData, email: e.target.value })
            }
            placeholder="Nhập email"
            error={errors.email}
          />
        </div>
        {isEdit ? null : (
          <div className="space-y-2">
            <Label>Mật khẩu *</Label>
            <Input
              type="password"
              value={formData.password || ""}
              onChange={(e) =>
                onFormChange({ ...formData, password: e.target.value })
              }
              placeholder="Nhập mật khẩu"
              error={errors.password}
            />
          </div>
        )}
        <div className="space-y-2">
          <Label>Vai trò *</Label>
          <Select
            value={formData.role || ""}
            onChange={(e) =>
              onFormChange({ ...formData, role: e.target.value })
            }
            options={[
              ...(roleList || [])
                .filter((d) => d.value !== 1) // 🚀 loại ADMIN
                .map((d) => ({
                  value: d.value,
                  label: d.label,
                })),
            ]}
            placeholder="Chọn vai trò"
            error={errors.role}
          />
        </div>
        <div className="space-y-2">
          <Label>Trạng thái *</Label>
          <Select
            value={formData.status || ""}
            onChange={(e) =>
              onFormChange({ ...formData, status: e.target.value })
            }
            options={statusList}
            placeholder="Chọn trạng thái"
            error={errors.status}
          />
        </div>
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={onClose}>
            Hủy
          </Button>
          <Button onClick={onSubmit} loading={loading}>
            {submitText}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
