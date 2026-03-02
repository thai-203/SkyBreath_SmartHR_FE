"use client";

import { PageTitle } from "@/components/common/PageTitle";
import { HolidayModal } from "@/app/(protected)/holidays/components/HolidayModal";
import { HolidayTable } from "@/app/(protected)/holidays/components/HolidayTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { holidayService } from "@/services/holiday.service";
import { Calendar, Download, Plus, Search } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

export default function HolidaysPage() {
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);

    const fetchHolidays = useCallback(async () => {
        setLoading(true);
        try {
            const response = await holidayService.findAll({ search });
            setHolidays(response.data || []);
        } catch (error) {
            toast.error("Không thể tải danh sách ngày lễ");
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
                toast.success("Xóa ngày lễ thành công");
                fetchHolidays();
            } catch (error) {
                toast.error("Xóa ngày lễ thất bại");
            }
        }
    };

    const handleSubmit = async (data) => {
        try {
            if (selectedHoliday) {
                await holidayService.update(selectedHoliday.id, data);
                toast.success("Cập nhật ngày lễ thành công");
            } else {
                await holidayService.create(data);
                toast.success("Thêm mới ngày lễ thành công");
            }
            setIsModalOpen(false);
            fetchHolidays();
        } catch (error) {
            toast.error(error.response?.data?.message || "Thao tác thất bại");
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
            toast.error("Xuất dữ liệu thất bại");
        }
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

            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <p className="text-muted-foreground">Đang tải dữ liệu...</p>
                </div>
            ) : (
                <HolidayTable
                    holidays={holidays}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                />
            )}

            <HolidayModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSubmit={handleSubmit}
                holiday={selectedHoliday}
            />
        </div>
    );
}
