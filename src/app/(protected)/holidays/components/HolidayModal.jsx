"use client";

import { Select } from "@/components/common/Select";
import { useToast } from "@/components/common/Toast";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Dialog,
    DialogContent,
    DialogTitle
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
import { X } from "lucide-react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const holidaySchema = z.object({
    holidayName: z.string().min(1, "Tên ngày lễ là bắt buộc"),
    startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
    endDate: z.string().min(1, "Ngày kết thúc là bắt buộc"),
    holidayType: z.string().min(1, "Loại ngày nghỉ là bắt buộc"),
    isPaid: z.boolean().default(true),
    description: z.string().optional(),
}).refine((data) => {
    const start = new Date(data.startDate);
    const end = new Date(data.endDate);
    return end >= start;
}, {
    message: "Ngày kết thúc không được trước ngày bắt đầu",
    path: ["endDate"],
});

export function HolidayModal({ isOpen, onClose, onSubmit, holiday }) {
    const { error: toastError } = useToast();
    const form = useForm({
        resolver: zodResolver(holidaySchema),
        mode: "onChange",
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
        try {
            await onSubmit(data);
            form.reset();
        } catch (error) {
            console.error("Holiday submission failed:", error);
            // Form is NOT reset here so the user can fix the data
        }
    };

    const onInvalid = (errors) => {
        const errorMessages = Object.values(errors)
            .map(err => err.message)
            .filter(Boolean);
        if (errorMessages.length > 0) {
            toastError(errorMessages[0]);
        }
    };

    const startDateValue = form.watch("startDate");

    const holidayTypeOptions = [
        { value: "Nghỉ lễ, tết", label: "Nghỉ lễ, tết" },
        { value: "Nghỉ bù lễ", label: "Nghỉ bù lễ" },
        { value: "Nghỉ bất thường", label: "Nghỉ bất thường" },
        { value: "Nghỉ đi du lịch/teambuilding", label: "Nghỉ đi du lịch/teambuilding" },
    ];

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent hideClose className="max-w-6xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onHandleSubmit, onInvalid)}>
                        {/* Custom Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div className="flex items-center gap-4">
                                <button type="button" onClick={onClose} className="p-1 hover:bg-gray-100 rounded-full transition-colors">
                                    <X className="h-5 w-5 text-gray-500" />
                                </button>
                                <DialogTitle className="text-lg font-bold text-[#1e293b]">
                                    {holiday ? "Cập nhật ngày nghỉ" : "Thêm mới ngày nghỉ"}
                                </DialogTitle>
                            </div>
                            <div className="flex items-center gap-3">
                                <Button type="button" variant="outline" onClick={onClose} className="h-9 px-6 border-gray-300 text-gray-600 hover:bg-gray-50 rounded">
                                    Hủy
                                </Button>
                                <Button type="submit" className="h-9 px-6 bg-[#003399] hover:bg-[#002266] text-white rounded shadow-sm">
                                    Lưu
                                </Button>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-8 space-y-6">
                            {/* Unit Badge */}
                            <div className="flex justify-end mb-2">
                                <div className="bg-[#fff7ed] border border-[#ffedd5] px-3 py-1.5 rounded text-[13px] text-[#9a3412]">
                                    Thuộc đơn vị: DNPW - Dnp water
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-x-12 gap-y-6">
                                <FormField
                                    control={form.control}
                                    name="startDate"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-medium text-gray-700">
                                                <span className="text-red-500 mr-1">*</span>Ngày nghỉ từ (DL)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    placeholder="Chọn ngày bắt đầu"
                                                    {...field}
                                                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
                                                />
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
                                            <FormLabel className="text-[13px] font-medium text-gray-700">
                                                <span className="text-red-500 mr-1">*</span>Ngày nghỉ đến (DL)
                                            </FormLabel>
                                            <FormControl>
                                                <Input
                                                    type="date"
                                                    min={startDateValue}
                                                    {...field}
                                                    placeholder="Chọn ngày kết thúc"
                                                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="holidayType"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-[13px] font-medium text-gray-700">
                                                <span className="text-red-500 mr-1">*</span>Loại ngày nghỉ
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                    options={holidayTypeOptions}
                                                    placeholder="Chọn loại ngày nghỉ"
                                                    className="h-10 border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
                                                    {...field}
                                                />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

                                <FormField
                                    control={form.control}
                                    name="isPaid"
                                    render={({ field }) => (
                                        <FormItem className="flex flex-row items-center space-x-3 space-y-0 pt-8">
                                            <FormControl>
                                                <Checkbox
                                                    checked={field.value}
                                                    onCheckedChange={field.onChange}
                                                    className="border-blue-600 data-[state=checked]:bg-blue-600"
                                                />
                                            </FormControl>
                                            <FormLabel className="text-[14px] font-medium text-gray-700 cursor-pointer">
                                                Tính công
                                            </FormLabel>
                                        </FormItem>
                                    )}
                                />

                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="holidayName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nhập ghi chú"
                                                        {...field}
                                                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Nhập ghi chú"
                                                        className="resize-none min-h-[120px] border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
                                                        {...field}
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>
                        </div>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
