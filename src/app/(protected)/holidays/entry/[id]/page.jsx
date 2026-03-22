"use client";

import { PageTitle } from "@/components/common/PageTitle";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import { holidayService } from "@/services/holiday.service";
import { Calendar, ChevronLeft, CreditCard, FileText, User } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useEffect, useState } from "react";

export default function HolidayEntryDetailPage() {
    const { id } = useParams();
    const [holiday, setHoliday] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchHoliday = async () => {
            try {
                const response = await holidayService.findById(id);
                setHoliday(response.data);
            } catch (error) {
                console.error("Failed to fetch holiday:", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHoliday();
    }, [id]);

    if (loading) {
        return (
            <div className="container mx-auto py-8 text-center text-muted-foreground">
                Đang tải thông tin ngày lễ...
            </div>
        );
    }

    if (!holiday) {
        return (
            <div className="container mx-auto py-8 text-center text-red-500">
                Không tìm thấy thông tin ngày lễ.
            </div>
        );
    }

    return (
        <div className="container mx-auto py-8 space-y-6 max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
                <Link href={`/holidays/${holiday.holidayGroupId || ""}`}>
                    <Button variant="ghost" size="icon" className="rounded-full hover:bg-white shadow-sm border border-gray-100 bg-white/50">
                        <ChevronLeft className="h-5 w-5 text-gray-600" />
                    </Button>
                </Link>
                <div>
                    <PageTitle title={`${holiday.holidayName} | SmartHR`} />
                    <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                        Chi tiết ngày lễ
                    </h1>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card className="md:col-span-2 border-gray-100 shadow-sm overflow-hidden">
                    <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                        <CardTitle className="flex items-center gap-2 text-blue-700">
                            <Calendar className="h-5 w-5" />
                            Thông tin ngày nghỉ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 space-y-6">
                        <div className="grid grid-cols-2 gap-8">
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Tên ngày lễ</p>
                                <p className="font-semibold text-lg text-gray-900">{holiday.holidayName}</p>
                            </div>
                            <div className="space-y-1">
                                <p className="text-sm text-muted-foreground">Loại ngày</p>
                                <p className="font-medium text-gray-700">{holiday.holidayType || "Nghỉ lễ, tết"}</p>
                            </div>
                            <div className="space-y-1 border-l-2 border-blue-500 pl-4 bg-blue-50/30 py-2 rounded">
                                <p className="text-sm text-blue-600 font-medium">Bắt đầu từ</p>
                                <p className="font-bold text-gray-900">{formatDate(holiday.startDate)}</p>
                            </div>
                            <div className="space-y-1 border-l-2 border-orange-500 pl-4 bg-orange-50/30 py-2 rounded">
                                <p className="text-sm text-orange-600 font-medium">Kết thúc ngày</p>
                                <p className="font-bold text-gray-900">{formatDate(holiday.endDate)}</p>
                            </div>
                        </div>

                        <div className="space-y-2 pt-4 border-t border-gray-50">
                            <p className="text-sm text-muted-foreground flex items-center gap-2">
                                <FileText className="h-4 w-4" /> Mô tả / Ghi chú
                            </p>
                            <div className="bg-gray-50 p-4 rounded-lg min-h-[100px] text-gray-700 whitespace-pre-wrap">
                                {holiday.description || "Không có mô tả chi tiết."}
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="space-y-6">
                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="py-4 border-b border-gray-50 bg-gray-50/30">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                                <User className="h-4 w-4 text-orange-500" />
                                Thông tin hệ thống
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Người cập nhật:</span>
                                <span className="font-medium text-gray-700">{holiday.updatedBy || "System"}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-muted-foreground">Ngày cập nhật:</span>
                                <span className="font-medium text-gray-700">{formatDate(holiday.updatedAt)}</span>
                            </div>
                            <div className="pt-2 flex items-center gap-2">
                                <div className={`h-2 w-2 rounded-full ${holiday.isPaid ? 'bg-green-500' : 'bg-gray-300'}`}></div>
                                <span className="text-sm font-medium">{holiday.isPaid ? 'Được tính lương' : 'Không tính lương'}</span>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-100 shadow-sm">
                        <CardHeader className="py-4 border-b border-gray-50 bg-gray-50/30">
                            <CardTitle className="text-sm font-bold flex items-center gap-2 text-gray-700">
                                <CreditCard className="h-4 w-4 text-blue-500" />
                                Đối tượng áp dụng
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-4">
                             <p className="text-sm text-muted-foreground mb-2">Số lượng nhân viên áp dụng:</p>
                             <div className="text-2xl font-bold text-blue-600">
                                {holiday.employees?.length || 0}
                             </div>
                             <p className="text-[10px] text-slate-400 mt-1 italic">
                                * Danh sách nhân viên được áp dụng ngày nghỉ này dựa trên phạm vi được cấu hình.
                             </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}
