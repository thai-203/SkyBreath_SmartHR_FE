"use client";

import { HolidayModal } from "@/app/(protected)/holidays/components/HolidayModal";
import { HolidayTable } from "@/app/(protected)/holidays/components/HolidayTable";
import { InheritModal } from "@/app/(protected)/holidays/components/InheritModal";
import { PageTitle } from "@/components/common/PageTitle";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { holidayService } from "@/services/holiday.service";
import { Calendar, Download, History, Plus, Search, Bell } from "lucide-react";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

export default function HolidaysPage() {
    const router = useRouter();
    const { success: toastSuccess, error: toastError } = useToast();
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);

    // Inheritance state
    const [isInheritModalOpen, setIsInheritModalOpen] = useState(false);
    const [inheritPreviewData, setInheritPreviewData] = useState([]);
    const [isInheritLoading, setIsInheritLoading] = useState(false);

    const handleOpenNotification = (holiday = null) => {
        if (holiday) {
            router.push(`/holidays/notifications?holidayId=${holiday.id}`);
        } else {
            router.push('/holidays/notifications');
        }
    };

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const response = await holidayService.findAll({ search });
            setHolidays(response.data || []);
        } catch (error) {
            toastError("Không thể tải danh sách ngày lễ");
            console.error(error);
        } finally {
            setLoading(false);
        }
    }, [search]);

    useEffect(() => {
        fetchHolidays();
    }, [fetchHolidays]);

    const handleCreate = () => {
        setSelectedHoliday(null);
        setIsModalOpen(true);
    };

    const handleEdit = (holiday) => {
        setSelectedHoliday(holiday);
        setIsModalOpen(true);
    };

    const handleDelete = async (id) => {
        if (confirm("Bạn có chắc chắn muốn xóa ngày lễ này?")) {
            try {
                await holidayService.delete(id);
                toastSuccess("Xóa ngày lễ thành công");
                fetchHolidays();
            } catch (error) {
                toastError("Xóa ngày lễ thất bại");
            }
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (selectedHoliday) {
                await holidayService.update(selectedHoliday.id, data);
                toastSuccess("Cập nhật ngày lễ thành công");
            } else {
                await holidayService.create(data);
                toastSuccess("Thêm mới ngày lễ thành công");
            }
            setIsModalOpen(false);
            fetchHolidays();
        } catch (error) {
            toastError(error.response?.data?.message || "Thao tác thất bại");
            throw error; // Re-throw to prevent form reset in modal
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

    const handleInherit = async () => {
        const currentYear = new Date().getFullYear();
        setIsInheritLoading(true);
        try {
            const response = await holidayService.getInheritPreview(currentYear);
            if (response.data.length === 0) {
                toastError(`Không tìm thấy ngày lễ nào trong năm ${currentYear} để kế thừa`);
                return;
            }
            setInheritPreviewData(response.data);
            setIsInheritModalOpen(true);
        } catch (error) {
            toastError("Không thể lấy dữ liệu kế thừa");
        } finally {
            setIsInheritLoading(false);
        }
    };

    const handleInheritConfirm = async (data) => {
        await holidayService.bulkCreate(data);
        fetchHolidays();
    };

    return (
        <div className="container mx-auto py-8 space-y-6 max-w-7xl">
            <div className="flex justify-between items-center bg-gray-50/50 p-4 rounded-xl border border-gray-100 shadow-sm">
                <div>
                    <PageTitle title="Holiday List | SmartHR" />
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900 flex items-center gap-2">
                        <Calendar className="h-6 w-6 text-blue-600" />
                        Holiday List
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                        Quản lý các ngày nghỉ lễ chính thức trong năm.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="ghost"
                        onClick={() => handleOpenNotification()}
                        className="text-orange-600 border-orange-100 hover:bg-orange-50 hover:text-orange-700 transition-all font-semibold"
                    >
                        <Bell className="mr-2 h-4 w-4" />
                        Gửi thông báo
                    </Button>
                    <Button
                        variant="ghost"
                        onClick={handleInherit}
                        disabled={isInheritLoading}
                        className="text-blue-600 border-blue-100 hover:bg-blue-50"
                    >
                        <History className="mr-2 h-4 w-4" />
                        {isInheritLoading ? "Đang tải..." : "Kế thừa cho năm sau"}
                    </Button>
                    <Button variant="outline" onClick={handleExport} className="border-gray-200 hover:bg-gray-100">
                        <Download className="mr-2 h-4 w-4" /> Xuất Excel
                    </Button>
                    <Button onClick={handleCreate} className="bg-blue-600 hover:bg-blue-700 shadow-md transition-all hover:scale-[1.02]">
                        <Plus className="mr-2 h-4 w-4" /> Thêm mới
                    </Button>
                </div>
            </div>

            <div className="flex items-center gap-2 max-w-sm">
                <div className="relative w-full">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Tìm kiếm ngày lễ..."
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
                    <HolidayTable
                        holidays={holidays}
                        onEdit={handleEdit}
                        onDelete={handleDelete}
                        onView={handleView}
                        onOpenNotification={handleOpenNotification}
                    />
                )
            }

            <HolidayModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                holiday={selectedHoliday}
            />

            <InheritModal
                isOpen={isInheritModalOpen}
                onClose={() => setIsInheritModalOpen(false)}
                previewData={inheritPreviewData}
                onConfirm={handleInheritConfirm}
            />
        </div >
    );
}
