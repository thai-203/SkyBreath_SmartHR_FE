"use client";

import { Button } from "@/components/ui/button";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Edit, Eye, Trash2, Bell } from "lucide-react";

export function HolidayTable({ holidays, onEdit, onDelete, onView, onOpenNotification }) {
    return (
        <div className="rounded-xl border border-gray-100 bg-white shadow-sm overflow-hidden">
            <Table>
                <TableHeader className="bg-gray-50/50">
                    <TableRow className="hover:bg-transparent border-gray-100">
                        <TableHead className="w-[60px] font-bold text-gray-700">STT</TableHead>
                        <TableHead className="font-bold text-gray-700">Ngày nghỉ từ (DL)</TableHead>
                        <TableHead className="font-bold text-gray-700">Ngày nghỉ đến (DL)</TableHead>
                        <TableHead className="font-bold text-gray-700">Loại ngày</TableHead>
                        <TableHead className="w-[100px] text-center font-bold text-gray-700">Tính công</TableHead>
                        <TableHead className="font-bold text-gray-700">Người cập nhật</TableHead>
                        <TableHead className="font-bold text-gray-700">Ngày cập nhật</TableHead>
                        <TableHead className="w-[120px] text-right font-bold text-gray-700">Hành động</TableHead>
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
                                <TableCell className="text-gray-600">
                                    {holiday.updatedBy || "System"}
                                </TableCell>
                                <TableCell className="text-gray-500 text-sm">
                                    {formatDate(holiday.updatedAt)}
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex justify-end gap-1">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-orange-600 hover:bg-orange-50 rounded-full"
                                            onClick={() => onOpenNotification?.(holiday)}
                                            title="Gửi thông báo"
                                        >
                                            <Bell className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                            onClick={() => onView?.(holiday)}
                                        >
                                            <Eye className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                            onClick={() => onEdit(holiday)}
                                        >
                                            <Edit className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full"
                                            onClick={() => onDelete(holiday.id)}
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={8} className="h-32 text-center text-gray-400">
                                Không có dữ liệu ngày lễ.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
