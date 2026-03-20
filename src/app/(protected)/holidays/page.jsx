"use client";

import { holidayService, holidayConfigService } from "@/services";
import { Calendar, Download, History, Plus, Search, Bell, Settings } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { HolidayGroupTable } from "./components/HolidayGroupTable";
import { HolidayGroupModal } from "./components/HolidayGroupModal";
import { InheritModal } from "./components/InheritModal";
import Link from "next/link";
import { useToast } from "@/components/common/Toast";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function HolidaysPage() {
    const router = useRouter();
    const { success: toastSuccess, error: toastError } = useToast();
    const [groups, setGroups] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isGroupModalOpen, setIsGroupModalOpen] = useState(false);
    const [isInheritModalOpen, setIsInheritModalOpen] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);


    const handleOpenNotification = (holiday = null) => {
        if (holiday) {
            router.push(`/holidays/notifications?holidayId=${holiday.id}`);
        } else {
            router.push('/holidays/notifications');
        }
    };

    const fetchGroups = useCallback(async () => {
        setLoading(true);
        try {
            const response = await holidayConfigService.getGroups({ search });
            setGroups(response.data || []);
        } catch (error) {
            toastError("Không thể tải danh sách danh mục ngày lễ");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchGroups();
    }, [fetchGroups]);

    const handleCreateGroup = () => {
        setSelectedGroup(null);
        setIsGroupModalOpen(true);
    };

    const handleEditGroup = (group) => {
        setSelectedGroup(group);
        setIsGroupModalOpen(true);
    };

    const handleDeleteGroup = async (id) => {
        if (confirm("Bạn có chắc chắn muốn xóa danh mục này?")) {
            try {
                await holidayConfigService.deleteGroup(id);
                toastSuccess("Xóa danh mục thành công");
                fetchGroups();
            } catch (error) {
                toastError(error.response?.data?.message || "Xóa danh mục thất bại");
            }
        }
    };

    const handleInheritGroup = (group) => {
        setSelectedGroup(group);
        setIsInheritModalOpen(true);
    };

    const handleInheritConfirm = async (targetYear) => {
        try {
            await holidayConfigService.inheritGroup(selectedGroup.id, targetYear);
            toastSuccess("Kế thừa danh mục thành công");
            fetchGroups();
        } catch (error) {
            toastError(error.response?.data?.message || "Kế thừa danh mục thất bại");
            throw error;
        }
    };

    const handleGroupSubmit = async (data) => {
        try {
            if (selectedGroup) {
                await holidayConfigService.updateGroup(selectedGroup.id, data);
                toastSuccess("Cập nhật danh mục thành công");
            } else {
                await holidayConfigService.createGroup(data);
                toastSuccess("Thêm mới danh mục thành công");
            }
            setIsGroupModalOpen(false);
            fetchGroups();
        } catch (error) {
            toastError(error.response?.data?.message || "Thao tác thất bại");
        }
    };

    const handleExport = async () => {
        try {
            const blob = await holidayService.export({ search });
            const url = window.URL.createObjectURL(new Blob([blob]));
            const link = document.createElement("a");
            link.href = url;
            link.setAttribute("download", "danh-sach-ngay-le.xlsx");
            document.body.appendChild(link);
            link.click();
            link.remove();
        } catch (error) {
            toastError("Xuất dữ liệu thất bại");
        }
    };

    const handleView = (holiday) => {
        router.push(`/holidays/${holiday.id}`);
    };


    return (
        <div className="container mx-auto py-8 space-y-6 max-w-7xl">
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <PageTitle title="Holiday Management | SmartHR" />
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        Holiday Management
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý các danh mục ngày nghỉ lễ chính thức theo năm.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Link href="/holidays/configuration">
                        <Button
                            variant="ghost"
                            className="text-slate-600 border-slate-100 hover:bg-slate-50 font-semibold"
                        >
                            <Settings className="mr-2 h-4 w-4" />
                            Cấu hình
                        </Button>
                    </Link>
                    <Button
                        variant="ghost"
                        onClick={() => handleOpenNotification()}
                        className="text-orange-600 border-orange-100 hover:bg-orange-50 hover:text-orange-700 transition-all font-semibold"
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        Gửi thông báo
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="border-gray-200 hover:bg-gray-100">
                        <Download className="mr-2 h-4 w-4" /> Xuất Excel
                    </Button>
                    <Button onClick={handleCreateGroup} className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-[1.02]">
                        <Plus className="mr-2 h-4 w-4" /> Thêm danh mục
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm danh mục..."
                        className="pl-8"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                    />
                </div>
            </div>

            {
                loading ? (
                    <div className="flex justify-center items-center h-64">
                        <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                    </div>
                ) : (
                    <HolidayGroupTable
                        groups={groups}
                        onEdit={handleEditGroup}
                        onDelete={handleDeleteGroup}
                        onInherit={handleInheritGroup}
                    />
                )
            }

            <HolidayGroupModal
                isOpen={isGroupModalOpen}
                onClose={() => setIsGroupModalOpen(false)}
                onSubmit={handleGroupSubmit}
                group={selectedGroup}
            />

            <InheritModal
                isOpen={isInheritModalOpen}
                onClose={() => setIsInheritModalOpen(false)}
                onConfirm={handleInheritConfirm}
                group={selectedGroup}
            />
        </div >
    );
}
