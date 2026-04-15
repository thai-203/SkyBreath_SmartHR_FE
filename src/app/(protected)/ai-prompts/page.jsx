"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { Plus, Edit, Trash2, ShieldAlert } from "lucide-react";
import { aiPromptsService } from "@/services";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Modal, ConfirmModal } from "@/components/common/Modal";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";

const initialFormData = {
  promptKey: "",
  promptContent: "",
  description: "",
  status: "ACTIVE",
};

export default function AiPromptsPage() {
  const { success, error } = useToast();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [mode, setMode] = useState("create");
  const [selectedPrompt, setSelectedPrompt] = useState(null);
  const [formLoading, setFormLoading] = useState(false);

  const [formData, setFormData] = useState(initialFormData);
  const [errors, setErrors] = useState({});

  const fetchPrompts = async () => {
    setLoading(true);
    try {
      const res = await aiPromptsService.getAll();
      setData(res?.data || []);
    } catch (err) {
      error("Không thể tải danh sách AI Prompts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleCreate = () => {
    setFormData({ ...initialFormData });
    setErrors({});
    setMode("create");
    setIsFormOpen(true);
  };

  const handleEdit = (item) => {
    setSelectedPrompt(item);
    setFormData({
      promptKey: item.promptKey,
      promptContent: item.promptContent,
      description: item.description || "",
      status: item.status,
    });
    setErrors({});
    setMode("edit");
    setIsFormOpen(true);
  };

  const handleDeleteClick = (item) => {
    setSelectedPrompt(item);
    setIsDeleteOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.promptKey || !formData.promptKey.trim()) {
      newErrors.promptKey = "Vui lòng nhập Key định danh";
    }
    if (!formData.promptContent || !formData.promptContent.trim()) {
      newErrors.promptContent = "Vui lòng nhập Nội dung Prompt";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;
    setFormLoading(true);
    try {
      if (mode === "create") {
        const res = await aiPromptsService.create(formData);
        success(res.message || "Thêm Prompt thành công");
      } else {
        const res = await aiPromptsService.update(selectedPrompt.id, formData);
        success(res.message || "Cập nhật Prompt thành công");
      }
      setIsFormOpen(false);
      fetchPrompts();
    } catch (err) {
      error(err.response?.data?.message || `Có lỗi xảy ra khi ${mode === "create" ? "thêm" : "cập nhật"} Prompt`);
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async () => {
    setFormLoading(true);
    try {
      const res = await aiPromptsService.delete(selectedPrompt.id);
      success(res.message || "Xóa Prompt thành công");
      setIsDeleteOpen(false);
      fetchPrompts();
    } catch (err) {
      error(err.response?.data?.message || "Có lỗi xảy ra khi xóa Prompt");
    } finally {
      setFormLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageTitle title="Quản lý AI Prompts" />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Quản lý AI Prompts</h1>
          <p className="text-slate-500">Cấu hình các chỉ thị và quy tắc mẫu dành cho Bot AI</p>
        </div>
        <Button onClick={handleCreate} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Thêm Prompt
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Mã Key</TableHead>
                  <TableHead>Mô tả</TableHead>
                  <TableHead>Trạng thái</TableHead>
                  <TableHead className="text-right">Thao tác</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">Đang tải dữ liệu...</TableCell>
                  </TableRow>
                ) : data.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center py-4">Chưa có dữ liệu nào</TableCell>
                  </TableRow>
                ) : (
                  data.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium text-slate-900">{item.promptKey}</TableCell>
                      <TableCell className="text-slate-500">{item.description}</TableCell>
                      <TableCell>
                        <Badge variant={item.status === "ACTIVE" ? "success" : "secondary"}>
                          {item.status === "ACTIVE" ? "Hoạt động" : "Tạm ngưng"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleEdit(item)} title="Chỉnh sửa">
                            <Edit className="h-4 w-4 text-blue-500" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDeleteClick(item)} title="Xóa">
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Form Modal */}
      <Modal
        isOpen={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        title={mode === "create" ? "Thêm AI Prompt mới" : "Chỉnh sửa AI Prompt"}
        size="lg"
      >
        <div className="grid gap-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="promptKey">Mã Key (Ví dụ: SQL_RULES, SQL_JOIN_TEMPLATES)</Label>
            <Input
              id="promptKey"
              placeholder="Nhập Key định danh"
              value={formData.promptKey}
              onChange={(e) => setFormData({ ...formData, promptKey: e.target.value })}
              className={errors.promptKey ? "border-red-500" : ""}
              disabled={mode === "edit"}
            />
            {errors.promptKey && <p className="text-sm text-red-500">{errors.promptKey}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="promptContent">Nội dung Prompt</Label>
            <Textarea
              id="promptContent"
              placeholder="Nhập các quy tắc, mẫu SQL..."
              value={formData.promptContent}
              onChange={(e) => setFormData({ ...formData, promptContent: e.target.value })}
              rows={8}
              className={errors.promptContent ? "border-red-500 font-mono text-sm" : "font-mono text-sm"}
            />
            {errors.promptContent && <p className="text-sm text-red-500">{errors.promptContent}</p>}
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Mô tả thêm</Label>
            <Input
              id="description"
              placeholder="Mô tả mục đích của prompt này"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">Trạng thái</Label>
            <Select value={formData.status} onValueChange={(val) => setFormData({ ...formData, status: val })}>
              <SelectTrigger>
                <SelectValue placeholder="Chọn trạng thái" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ACTIVE">Hoạt động</SelectItem>
                <SelectItem value="INACTIVE">Tạm ngưng</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setIsFormOpen(false)} disabled={formLoading}>
            Hủy
          </Button>
          <Button onClick={handleSubmit} loading={formLoading}>
            {mode === "create" ? "Thêm mới" : "Lưu thay đổi"}
          </Button>
        </div>
      </Modal>

      {/* Delete Modal */}
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={handleDelete}
        title={(
          <div className="flex items-center gap-2 text-red-600">
            <ShieldAlert className="h-5 w-5" />
            Xác nhận Xóa
          </div>
        )}
        description={
          <span>Bạn có chắc chắn muốn xóa Prompt có key <b>{selectedPrompt?.promptKey}</b> không? Hành động này không thể hoàn tác.</span>
        }
        confirmText="Xóa ngay"
        cancelText="Hủy"
        variant="destructive"
        loading={formLoading}
      />
    </div>
  );
}
