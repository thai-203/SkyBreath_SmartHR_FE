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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { departmentsService } from "@/services/departments.service";
import { employeesService } from "@/services/employees.service";
import EmployeeTreeSelector from "./EmployeeTreeSelector";
import { zodResolver } from "@hookform/resolvers/zod";
import { X, CheckCircle2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const holidaySchema = z.object({
    holidayName: z.string().min(1, "Tên ngày lễ là bắt buộc"),
    startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
    endDate: z.string().min(1, "Ngày kết thúc là bắt buộc"),
    holidayType: z.string().min(1, "Loại ngày nghỉ là bắt buộc"),
    isPaid: z.boolean().default(true),
    description: z.string().optional(),
    employeeIds: z.array(z.number()).default([]),
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
    const [treeData, setTreeData] = useState([]);
    const [loadingTree, setLoadingTree] = useState(false);
    
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
            employeeIds: [],
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchTreeData();
        }
    }, [isOpen]);

    const fetchTreeData = async () => {
        setLoadingTree(true);
        try {
            const [deptRes, empRes] = await Promise.all([
                departmentsService.getChart(),
                employeesService.getAll({ limit: 1000 })
            ]);

            const departments = deptRes.data || [];
            const employees = empRes.data?.items || empRes.data || [];

            const buildTree = (depts) => {
                return depts.map(dept => {
                    const deptEmployees = employees.filter(emp => emp.departmentId === dept.id);
                    return {
                        ...dept,
                        employees: deptEmployees,
                        children: dept.children ? buildTree(dept.children) : []
                    };
                });
            };

            setTreeData(buildTree(departments));
        } catch (err) {
            console.error("Failed to fetch tree data:", err);
            toastError("Không thể tải danh sách nhân sự");
        } finally {
            setLoadingTree(false);
        }
    };

    const handleNodeSelect = (item, checked) => {
        const isEmployee = !!item.fullName;
        const currentIds = form.getValues("employeeIds") || [];
        
        let idsToToggle = [];
        if (isEmployee) {
            idsToToggle = [item.id];
        } else {
            idsToToggle = item.employees?.map(e => e.id) || [];
        }

        if (idsToToggle.length === 0) return;

        if (checked) {
            form.setValue("employeeIds", Array.from(new Set([...currentIds, ...idsToToggle])), { shouldValidate: true });
        } else {
            form.setValue("employeeIds", currentIds.filter(id => !idsToToggle.includes(id)), { shouldValidate: true });
        }
    };

    const getAllEmployeeIds = (items) => {
        let ids = [];
        items.forEach(item => {
            if (item.employees) {
                ids.push(...item.employees.map(e => e.id));
            }
            if (item.children) {
                ids.push(...getAllEmployeeIds(item.children));
            }
        });
        return Array.from(new Set(ids));
    };

    useEffect(() => {
        if (holiday) {
            form.reset({
                holidayName: holiday.holidayName || "",
                startDate: holiday.startDate ? holiday.startDate.split("T")[0] : "",
                endDate: holiday.endDate ? holiday.endDate.split("T")[0] : "",
                holidayType: holiday.holidayType || "Nghỉ lễ, tết",
                isPaid: holiday.isPaid ?? true,
                description: holiday.description || "",
                employeeIds: holiday.employees?.map(e => e.id) || [],
            });
        } else {
            form.reset({
                holidayName: "",
                startDate: "",
                endDate: "",
                holidayType: "Nghỉ lễ, tết",
                isPaid: true,
                description: "",
                employeeIds: [],
            });
        }
    }, [holiday, form, isOpen]);

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
            <DialogContent hideClose className="w-[95vw] sm:max-w-4xl lg:max-w-5xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col">
                <Form {...form}>
                    <form 
                        onSubmit={form.handleSubmit(onHandleSubmit, onInvalid)}
                        className="flex flex-col h-full max-h-[90vh]"
                    >
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
                        <ScrollArea className="flex-1 overflow-y-auto">
                            <div className="p-4 sm:p-8 space-y-6">
                            {/* Unit Badge */}
                            <div className="flex justify-end mb-2">
                                <div className="bg-[#fff7ed] border border-[#ffedd5] px-3 py-1.5 rounded text-[13px] text-[#9a3412]">
                                    Thuộc đơn vị: DNPW - Dnp water
                                </div>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
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

                                <div className="col-span-1 sm:col-span-1">
                                    <FormField
                                        control={form.control}
                                        name="holidayName"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-medium text-gray-700">
                                                    Tên/Ghi chú ngắn
                                                </FormLabel>
                                                <FormControl>
                                                    <Input
                                                        placeholder="Nhập tên ngày lễ..."
                                                        {...field}
                                                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>

                                <div className="col-span-1 sm:col-span-2 space-y-3">
                                    <div className="flex items-center justify-between">
                                        <FormLabel className="text-[13px] font-bold text-gray-900 uppercase tracking-tight flex items-center gap-2">
                                            <CheckCircle2 className="h-4 w-4 text-blue-600" />
                                            Nhân sự áp dụng
                                        </FormLabel>
                                        <div className="flex gap-4">
                                            <button 
                                                type="button" 
                                                onClick={() => {
                                                    const allIds = getAllEmployeeIds(treeData);
                                                    form.setValue('employeeIds', allIds, { shouldValidate: true });
                                                }}
                                                className="text-[12px] text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                                            >
                                                Chọn tất cả
                                            </button>
                                            <button 
                                                type="button" 
                                                onClick={() => form.setValue('employeeIds', [])}
                                                className="text-[12px] text-gray-400 font-semibold hover:text-gray-600 transition-colors"
                                            >
                                                Bỏ chọn
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <FormField
                                        control={form.control}
                                        name="employeeIds"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormControl>
                                                    <EmployeeTreeSelector 
                                                        treeData={treeData}
                                                        selectedIds={field.value}
                                                        onSelect={handleNodeSelect}
                                                        loading={loadingTree}
                                                        maxHeight="250px"
                                                    />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    
                                    <p className="text-[11px] text-gray-400 italic mt-1">
                                        * Các nhân sự được chọn sẽ áp dụng ngày nghỉ này để tính công và lịch làm việc.
                                    </p>
                                </div>

                                <div className="col-span-1 sm:col-span-2 mt-4">
                                    <FormField
                                        control={form.control}
                                        name="description"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-[13px] font-medium text-gray-700">Mô tả/Ghi chú chi tiết</FormLabel>
                                                <FormControl>
                                                    <Textarea
                                                        placeholder="Nhập mô tả chi tiết..."
                                                        className="resize-none min-h-[100px] border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
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
                    </ScrollArea>
                </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
