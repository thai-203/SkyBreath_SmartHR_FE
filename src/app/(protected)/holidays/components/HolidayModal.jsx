"use client";

import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const holidaySchema = z.object({
    holidayName: z.string().min(1, "Tên ngày lễ là bắt buộc"),
    startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
    endDate: z.string().min(1, "Ngày kết thúc là bắt buộc"),
    holidayType: z.string().min(1, "Loại ngày là bắt buộc"),
    isPaid: z.boolean().default(false),
    description: z.string().optional(),
});

export function HolidayModal({ isOpen, onClose, onSubmit, holiday }) {
    const form = useForm({
        resolver: zodResolver(holidaySchema),
        defaultValues: {
            holidayName: "",
            startDate: "",
            endDate: "",
            holidayType: "Nghỉ lễ, tết",
            isPaid: true,
            description: "",
        },
    });

    useEffect(() => {
        if (holiday) {
            form.reset({
                holidayName: holiday.holidayName || "",
                startDate: holiday.startDate ? holiday.startDate.split("T")[0] : "",
                endDate: holiday.endDate ? holiday.endDate.split("T")[0] : "",
                holidayType: holiday.holidayType || "Nghỉ lễ, tết",
                isPaid: holiday.isPaid ?? true,
                description: holiday.description || "",
            });
        } else {
            form.reset({
                holidayName: "",
                startDate: "",
                endDate: "",
                holidayType: "Nghỉ lễ, tết",
                isPaid: true,
                description: "",
            });
        }
    }, [holiday, form, isOpen]); // Added isOpen to reset when modal opens

    const onHandleSubmit = async (data) => {
        await onSubmit(data);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] bg-white">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-blue-700">
                        {holiday ? "Chỉnh sửa ngày lễ" : "Thêm mới ngày lễ"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onHandleSubmit)} className="space-y-4 pt-4">
                        <FormField
                            control={form.control}
                            name="holidayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Tên ngày lễ <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tên ngày lễ (VD: Tết Nguyên Đán...)" {...field} className="border-gray-200" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="startDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Ngày nghỉ từ <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="endDate"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Ngày nghỉ đến <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input type="date" {...field} className="border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-4 items-end">
                            <FormField
                                control={form.control}
                                name="holidayType"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel className="font-semibold text-gray-700">Loại ngày <span className="text-red-500">*</span></FormLabel>
                                        <FormControl>
                                            <Input placeholder="VD: Nghỉ lễ, tết..." {...field} className="border-gray-200" />
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="isPaid"
                                render={({ field }) => (
                                    <FormItem className="flex flex-row items-center space-x-3 space-y-0 pb-2">
                                        <FormControl>
                                            <div className="flex items-center space-x-2">
                                                <input
                                                    type="checkbox"
                                                    checked={field.value}
                                                    onChange={field.onChange}
                                                    className="w-4 h-4 rounded-full border-gray-300 text-blue-600 focus:ring-blue-500"
                                                />
                                                <FormLabel className="font-semibold text-gray-700 cursor-pointer">Tính công</FormLabel>
                                            </div>
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
                        </div>

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Mô tả</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Ghi chú thêm nếu cần..."
                                            className="resize-none min-h-[80px] border-gray-200"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Hủy
                            </Button>
                            <Button type="submit">
                                {holiday ? "Cập nhật" : "Lưu"}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
