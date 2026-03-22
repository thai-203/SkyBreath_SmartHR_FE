"use client";

import { holidayService, holidayConfigService } from "@/services";
import { Calendar, ChevronLeft, CreditCard, FileText, User, Plus, Search, ShieldCheck, Download } from "lucide-react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import { HolidayTable } from "../components/HolidayTable";
import { HolidayModal } from "../components/HolidayModal";
import { useToast } from "@/components/common/Toast";
import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";

export default function HolidayGroupDetailPage() {
    const { id } = useParams();
    const router = useRouter();
    const { success: toastSuccess, error: toastError } = useToast();
    
    const [group, setGroup] = useState(null);
    const [holidays, setHolidays] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingHolidays, setLoadingHolidays] = useState(false);
    
    const [isHolidayModalOpen, setIsHolidayModalOpen] = useState(false);
    const [selectedHoliday, setSelectedHoliday] = useState(null);

    // Filter state
    const [filters, setFilters] = useState({
        search: "",
        holidayType: "",
        startDate: "",
        endDate: ""
    });

    const fetchData = useCallback(async () => {
        setLoadingHolidays(true);
        try {
            const [groupRes, holidaysRes] = await Promise.all([
                holidayConfigService.getGroup(id),
                holidayService.findAll({ 
                    holidayGroupId: id,
                    ...filters
                })
            ]);
            if (groupRes.success) setGroup(groupRes.data);
            if (holidaysRes.success) setHolidays(holidaysRes.data || []);
        } catch (error) {
            console.error("Failed to fetch data:", error);
            toastError("Không thể tải thông tin danh mục");
        } finally {
            setLoading(false);
            setLoadingHolidays(false);
        }
    }, [id, filters]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleCreateHoliday = () => {
        setSelectedHoliday(null);
        setIsHolidayModalOpen(true);
    };

    const handleEditHoliday = (holiday) => {
        setSelectedHoliday(holiday);
        setIsHolidayModalOpen(true);
    };

    const handleDeleteHoliday = async (holidayId) => {
        if (confirm("Bạn có chắc chắn muốn xóa ngày nghỉ này?")) {
            try {
                await holidayService.delete(holidayId);
                toastSuccess("Xóa ngày nghỉ thành công");
                fetchData();
            } catch (error) {
                toastError("Xóa ngày nghỉ thất bại");
            }
        }
    };

    const handleHolidaySubmit = async (data) => {
        try {
            const payload = { ...data, holidayGroupId: parseInt(id) };
            if (selectedHoliday) {
                await holidayService.update(selectedHoliday.id, payload);
                toastSuccess("Cập nhật ngày nghỉ thành công");
            } else {
                await holidayService.create(payload);
                toastSuccess("Thêm mới ngày nghỉ thành công");
            }
            setIsHolidayModalOpen(false);
            fetchData();
        } catch (error) {
            toastError(error.response?.data?.message || "Thao tác thất bại");
        }
    };

    const handleExport = async () => {
        try {
            const blob = await holidayService.export({ 
                holidayGroupId: id,
                ...filters
            });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `danh-sach-ngay-le-${group.groupCode}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            toastSuccess("Xuất dữ liệu thành công");
        } catch (error) {
            toastError("Xuất dữ liệu thất bại");
        }
    };

    if (loading) {
        return (
            <div className="container mx-auto py-8 text-center text-muted-foreground">
                Đang tải thông tin...
            </div>
        );
    }

    if (!group) {
        return (
            <div className="container mx-auto py-8 text-center text-red-500">
                Không tìm thấy thông tin danh mục ngày lễ.
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6 max-w-4xl">
            <div className="flex items-center gap-4">
                <Link href="/holidays">
                    <Button variant="ghost" size="icon" className="rounded-full">
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <PageTitle title={`${group.groupName} | SmartHR`} />
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        {group.groupName} ({group.year})
                    </h1>
                    <p className="text-sm text-slate-500">Mã: {group.groupCode} | Phạm vi: {group.applicableScope}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <Calendar className="h-5 w-5" />
                            Thông tin chung
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Tên danh mục</p>
                                <p className="font-semibold text-lg text-gray-900">{group.groupName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Năm áp dụng</p>
                                <p className="font-bold text-blue-600 text-lg">{group.year}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Phạm vi</p>
                                <p className="font-medium text-gray-700">{group.applicableScope}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Trạng thái</p>
                                <span className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${group.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                    {group.status === 'ACTIVE' ? "ĐANG HOẠT ĐỘNG" : "NGỪNG HOẠT ĐỘNG"}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-50">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Mô tả
                            </p>
                            <div className="text-gray-700">
                                {group.description || "Không có mô tả."}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-gray-100 shadow-sm">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-gray-500">
                            Trạng thái & Hệ thống
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="flex items-center justify-between py-2 border-b border-gray-50">
                            <div className="flex items-center gap-3">
                                <ShieldCheck className="h-5 w-5 text-gray-400" />
                                <span className="text-sm font-medium">Trạng thái</span>
                            </div>
                            <span className={`px-3 py-1 rounded-md text-xs font-bold whitespace-nowrap ${group.status === 'ACTIVE' ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                                {group.status === 'ACTIVE' ? "ĐANG HOẠT ĐỘNG" : "NGỪNG HOẠT ĐỘNG"}
                            </span>
                        </div>
                        <div className="space-y-4 pt-2">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-50 rounded-lg">
                                    <User className="h-4 w-4 text-blue-600" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted-foreground uppercase">Người tạo/cập nhật</p>
                                    <p className="text-sm font-bold">{group.updatedBy || "Hệ thống"}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-gray-50 rounded-lg">
                                    <Calendar className="h-4 w-4 text-gray-500" />
                                </div>
                                <div className="space-y-0.5">
                                    <p className="text-xs text-muted-foreground uppercase">Ngày cập nhật</p>
                                    <p className="text-sm font-bold">{formatDate(group.updatedAt)}</p>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <div className="pt-6 border-t border-gray-100">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                    <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Calendar className="h-5 w-5 text-blue-500" />
                        Danh sách ngày nghỉ ({holidays.length})
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={handleExport} className="border-gray-200 text-gray-600 hover:bg-gray-50">
                            <Download className="h-4 w-4 mr-2" /> Xuất Excel
                        </Button>
                        <Button size="sm" onClick={handleCreateHoliday} className="bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:scale-[1.02]">
                            <Plus className="h-4 w-4 mr-2" /> Thêm ngày nghỉ
                        </Button>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 bg-white p-4 rounded-xl border border-gray-100 mb-4 shadow-sm">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Tìm kiếm tên..."
                            className="bg-gray-50/50 border-gray-100 text-sm h-10 w-full pl-9 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={filters.search}
                            onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                        />
                    </div>
                    <div>
                        <select
                            className="bg-gray-50/50 border-gray-100 text-sm h-10 w-full px-3 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={filters.holidayType}
                            onChange={(e) => setFilters(prev => ({ ...prev, holidayType: e.target.value }))}
                        >
                            <option value="">-- Loại ngày nghỉ --</option>
                            <option value="Nghỉ lễ, tết">Nghỉ lễ, tết</option>
                            <option value="Nghỉ bù lễ">Nghỉ bù lễ</option>
                            <option value="Nghỉ bất thường">Nghỉ bất thường</option>
                            <option value="Nghỉ đi du lịch/teambuilding">Nghỉ đi du lịch/teambuilding</option>
                        </select>
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            className="bg-gray-50/50 border-gray-100 text-[12px] h-10 w-full px-2 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
                        />
                        <span className="text-gray-400">-</span>
                        <input
                            type="date"
                            className="bg-gray-50/50 border-gray-100 text-[12px] h-10 w-full px-2 rounded-lg focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
                        />
                    </div>
                    <Button 
                        variant="ghost" 
                        size="sm"
                        className="h-10 text-gray-500 hover:text-blue-600"
                        onClick={() => setFilters({ search: "", holidayType: "", startDate: "", endDate: "" })}
                    >
                        Xóa lọc
                    </Button>
                </div>
                
                {loadingHolidays ? (
                    <div className="h-32 flex items-center justify-center text-muted-foreground animate-pulse bg-gray-50 rounded-lg">
                        Đang lọc dữ liệu...
                    </div>
                ) : (
                    <HolidayTable 
                        holidays={holidays}
                        onEdit={handleEditHoliday}
                        onDelete={handleDeleteHoliday}
                        onView={(h) => router.push(`/holidays/entry/${h.id}`)}
                    />
                )}
            </div>

            <HolidayModal 
                isOpen={isHolidayModalOpen}
                onClose={() => setIsHolidayModalOpen(false)}
                onSubmit={handleHolidaySubmit}
                holiday={selectedHoliday}
            />
        </div>
    );
}
