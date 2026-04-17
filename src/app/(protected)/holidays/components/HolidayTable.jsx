"use client";

import { Button } from "@/components/ui/button";
import { PermissionGate } from "@/components/common/AuthGuard";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Edit, Eye, Trash2, Bell, CalendarCheck } from "lucide-react";

export function HolidayTable({ holidays, onEdit, onDelete, onView, onOpenNotification }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent border-gray-100">
                        <TableHead className="w-[50px] font-bold text-gray-700 whitespace-nowrap">STT</TableHead>
                        <TableHead className="min-w-[140px] font-bold text-gray-700 whitespace-nowrap">Ngày nghỉ từ (DL)</TableHead>
                        <TableHead className="min-w-[140px] font-bold text-gray-700 whitespace-nowrap">Ngày nghỉ đến (DL)</TableHead>
                        <TableHead className="min-w-[110px] font-bold text-gray-700 whitespace-nowrap">Loại ngày</TableHead>
                        <TableHead className="min-w-[90px] text-center font-bold text-gray-700 whitespace-nowrap">Tính công</TableHead>
                        <TableHead className="min-w-[160px] font-bold text-gray-700 whitespace-nowrap">Ngày làm bù</TableHead>
                        <TableHead className="min-w-[120px] font-bold text-gray-700 whitespace-nowrap">Người cập nhật</TableHead>
                        <TableHead className="min-w-[130px] font-bold text-gray-700 whitespace-nowrap">Ngày cập nhật</TableHead>
                        <TableHead className="min-w-[120px] text-right font-bold text-gray-700 whitespace-nowrap">Hành động</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {holidays.length > 0 ? (
                        holidays.map((holiday, index) => (
                            <TableRow key={holiday.id} className="hover:bg-blue-50/30 transition-colors border-gray-50">
                                <TableCell className="text-gray-500 font-medium">{index + 1}</TableCell>
                                <TableCell className="font-medium text-gray-900">
                                    {formatDate(holiday.startDate)}
                                </TableCell>
                                <TableCell className="font-medium text-gray-900">
                                    {formatDate(holiday.endDate)}
                                </TableCell>
                                <TableCell>
                                    <span className="text-gray-600 italic">
                                        {holiday.holidayType || "Nghỉ lễ, tết"}
                                    </span>
                                </TableCell>
                                <TableCell className="text-center">
                                    <div className="flex justify-center">
                                        <input
                                            type="checkbox"
                                            checked={holiday.isPaid}
                                            readOnly
                                            className="w-4 h-4 rounded-full border-gray-300 text-blue-600"
                                        />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    {Array.isArray(holiday.compensatoryDays) && holiday.compensatoryDays.length > 0 ? (
                                        <div className="flex flex-col gap-1">
                                            {holiday.compensatoryDays.map((cd, i) => (
                                                <div
                                                    key={i}
                                                    className="flex items-center gap-1.5 group"
                                                    title={cd.note || "Ngày làm bù"}
                                                >
                                                    <CalendarCheck className="h-3.5 w-3.5 text-indigo-500 flex-shrink-0" />
                                                    <span className="text-[12px] font-semibold text-indigo-700">
                                                        {cd.date
                                                            ? new Date(cd.date).toLocaleDateString("vi-VN")
                                                            : "—"}
                                                    </span>
                                                    {cd.note && (
                                                        <span className="text-[11px] text-gray-400 truncate max-w-[120px] hidden group-hover:inline">
                                                            — {cd.note}
                                                        </span>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <span className="text-[12px] text-gray-300 italic">—</span>
                                    )}
                                </TableCell>
                                <TableCell className="text-gray-600">
                                    {holiday.updatedBy || "System"}
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {formatDate(holiday.updatedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <PermissionGate permission="HOLIDAY_NOTIFICATION_SEND">
                                            <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full"
                                            onClick={() => onOpenNotification?.(holiday)}
                                            title="Gửi thông báo"
                                        >
                                            <Bell className="h-4 w-4" />
                                        </Button>
                                        </PermissionGate>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                            onClick={() => onView?.(holiday)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <PermissionGate permission="HOLIDAY_UPDATE">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                                onClick={() => onEdit(holiday)}
                                            >
                                                <Edit className="h-4 w-4" />
                                            </Button>
                                        </PermissionGate>
                                        <PermissionGate permission="HOLIDAY_DELETE">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                                onClick={() => onDelete(holiday.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </PermissionGate>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={9} className="h-32 text-center text-gray-400">
                                Không có dữ liệu ngày lễ.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
            </div>
        </div>
    );
}
