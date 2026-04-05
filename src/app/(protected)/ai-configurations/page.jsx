"use client";

import { useState, useEffect } from "react";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/common/Button";
import { useToast } from "@/components/common/Toast";
import { Plus } from "lucide-react";
import { aiConfigurationsService } from "@/services";

import AiConfigurationTable from "./components/AiConfigurationTable";
import AiConfigurationFormModal from "./components/AiConfigurationFormModal";
import AiConfigurationDeleteModal from "./components/AiConfigurationDeleteModal";

const initialFormData = {
    configKey: "GEMINI_API_KEY",
    configValue: "",
    aiModel: "gemini-2.5-flash",
    description: "Cấu hình tự động truy cập AI",
    status: "INACTIVE",
};

export default function AiConfigurationsPage() {
    const { success, error } = useToast();
    const [data, setData] = useState([]);
    const [loading, setLoading] = useState(true);

    // Modal
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [isEditOpen, setIsEditOpen] = useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = useState(false);
    const [selectedConfig, setSelectedConfig] = useState(null);
    const [formLoading, setFormLoading] = useState(false);

    // Form
    const [formData, setFormData] = useState(initialFormData);
    const [errors, setErrors] = useState({});

    const fetchConfigs = async () => {
        setLoading(true);
        try {
            const res = await aiConfigurationsService.getAll();
            setData(res?.data || []);
        } catch (err) {
            error("Không thể tải danh sách cấu hình AI");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchConfigs();
    }, []);

    const handleCreate = () => {
        setFormData({ ...initialFormData });
        setErrors({});
        setIsCreateOpen(true);
    };

    const handleEdit = (item) => {
        setSelectedConfig(item);
        setFormData({
            configKey: item.configKey,
            configValue: item.configValue,
            aiModel: item.aiModel || "gemini-2.5-flash",
            description: item.description || "",
            status: item.status,
        });
        setErrors({});
        setIsEditOpen(true);
    };

    const handleDeleteClick = (item) => {
        setSelectedConfig(item);
        setIsDeleteOpen(true);
    };

    const validateForm = () => {
        const newErrors = {};
        if (!formData.configKey || !formData.configKey.trim()) {
            newErrors.configKey = "Vui lòng nhập Key định danh";
        }
        if (!formData.configValue || !formData.configValue.trim()) {
            newErrors.configValue = "Vui lòng nhập Giá trị (Token)";
        }
        if (!formData.aiModel || !formData.aiModel.trim()) {
            newErrors.aiModel = "Vui lòng nhập Model AI";
        }
        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    const handleSubmitCreate = async () => {
        if (!validateForm()) return;
        setFormLoading(true);
        try {
            const res = await aiConfigurationsService.create(formData);
            success(res.message || "Thêm cấu hình AI thành công");
            setIsCreateOpen(false);
            fetchConfigs();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra khi thêm cấu hình");
        } finally {
            setFormLoading(false);
        }
    };

    const handleSubmitEdit = async () => {
        if (!validateForm()) return;
        setFormLoading(true);
        try {
            const res = await aiConfigurationsService.update(selectedConfig.id, formData);
            success(res.message || "Cập nhật cấu hình AI thành công");
            setIsEditOpen(false);
            fetchConfigs();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra khi cập nhật cấu hình");
        } finally {
            setFormLoading(false);
        }
    };

    const handleDelete = async () => {
        setFormLoading(true);
        try {
            const res = await aiConfigurationsService.delete(selectedConfig.id);
            success(res.message || "Xóa cấu hình thành công");
            setIsDeleteOpen(false);
            fetchConfigs();
        } catch (err) {
            error(err.response?.data?.message || "Có lỗi xảy ra khi xóa cấu hình");
        } finally {
            setFormLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <PageTitle title="Cấu hình AI" />

            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900">Quản lý Cấu hình AI</h1>
                    <p className="text-slate-500">Quản lý các khóa bảo mật và thiết lập AI Chatbot</p>
                </div>
                <Button onClick={handleCreate} className="w-full sm:w-auto">
                    <Plus className="mr-2 h-4 w-4" />
                    Thêm Cấu hình
                </Button>
            </div>

            <AiConfigurationTable
                data={data}
                loading={loading}
                onEdit={handleEdit}
                onDelete={handleDeleteClick}
            />

            <AiConfigurationFormModal
                isOpen={isCreateOpen}
                onClose={() => setIsCreateOpen(false)}
                onSubmit={handleSubmitCreate}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                loading={formLoading}
                mode="create"
            />

            <AiConfigurationFormModal
                isOpen={isEditOpen}
                onClose={() => setIsEditOpen(false)}
                onSubmit={handleSubmitEdit}
                formData={formData}
                onFormChange={setFormData}
                errors={errors}
                loading={formLoading}
                mode="edit"
            />

            <AiConfigurationDeleteModal
                isOpen={isDeleteOpen}
                onClose={() => setIsDeleteOpen(false)}
                onConfirm={handleDelete}
                config={selectedConfig}
                loading={formLoading}
            />
        </div>
    );
}
