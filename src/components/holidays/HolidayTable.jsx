"use client";

import { Button } from "@/components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { formatDate } from "@/lib/utils";
import { Edit, MoreHorizontal, Trash2 } from "lucide-react";

export function HolidayTable({ holidays, onEdit, onDelete }) {
    return (
        <div className="rounded-md border bg-card">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[80px]">STT</TableHead>
                        <TableHead>Tên ngày lễ</TableHead>
                        <TableHead>Ngày</TableHead>
                        <TableHead>Mô tả</TableHead>
                        <TableHead className="w-[100px] text-right">Thao tác</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {holidays.length > 0 ? (
                        holidays.map((holiday, index) => (
                            <TableRow key={holiday.id}>
                                <TableCell className="font-medium">{index + 1}</TableCell>
                                <TableCell>{holiday.holidayName}</TableCell>
                                <TableCell>{formatDate(holiday.holidayDate)}</TableCell>
                                <TableCell className="max-w-[300px] truncate">
                                    {holiday.description || "-"}
                                </TableCell>
                                <TableCell className="text-right">
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" className="h-8 w-8 p-0">
                                                <span className="sr-only">Open menu</span>
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                            <DropdownMenuItem onClick={() => onEdit(holiday)}>
                                                <Edit className="mr-2 h-4 w-4" />
                                                Chỉnh sửa
                                            </DropdownMenuItem>
                                            <DropdownMenuItem
                                                onClick={() => onDelete(holiday.id)}
                                                className="text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="mr-2 h-4 w-4" />
                                                Xóa
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={5} className="h-24 text-center">
                                Không có dữ liệu ngày lễ.
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}
