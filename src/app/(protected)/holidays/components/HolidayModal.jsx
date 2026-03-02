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
    holidayDate: z.string().min(1, "Ngày lễ là bắt buộc"),
    description: z.string().optional(),
});

export function HolidayModal({ isOpen, onClose, onSubmit, holiday }) {
    const form = useForm({
        resolver: zodResolver(holidaySchema),
        defaultValues: {
            holidayName: "",
            holidayDate: "",
            description: "",
        },
    });

    useEffect(() => {
        if (holiday) {
            form.reset({
                holidayName: holiday.holidayName || "",
                holidayDate: holiday.holidayDate ? holiday.holidayDate.split("T")[0] : "",
                description: holiday.description || "",
            });
        } else {
            form.reset({
                holidayName: "",
                holidayDate: "",
                description: "",
            });
        }
    }, [holiday, form]);

    const onHandleSubmit = async (data) => {
        await onSubmit(data);
        form.reset();
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px] bg-white">
                <DialogHeader>
                    <DialogTitle>
                        {holiday ? "Chỉnh sửa ngày lễ" : "Thêm mới ngày lễ"}
                    </DialogTitle>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onHandleSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="holidayName"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tên ngày lễ</FormLabel>
                                    <FormControl>
                                        <Input placeholder="Nhập tên ngày lễ..." {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="holidayDate"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Ngày</FormLabel>
                                    <FormControl>
                                        <Input type="date" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Mô tả</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập mô tả..."
                                            className="resize-none"
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
