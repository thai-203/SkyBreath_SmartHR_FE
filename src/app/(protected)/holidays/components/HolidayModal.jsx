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
import { X, CheckCircle2, CalendarDays, Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { holidayConfigService } from "@/services/holiday-configs.service";

const holidaySchema = z.object({
    holidayName: z.string().min(1, "Tên ngày lễ là bắt buộc"),
    startDate: z.string().min(1, "Ngày bắt đầu là bắt buộc"),
    endDate: z.string().min(1, "Ngày kết thúc là bắt buộc"),
    holidayType: z.string().min(1, "Loại ngày nghỉ là bắt buộc"),
    isPaid: z.boolean().default(true),
    description: z.string().optional(),
    holidayGroupId: z.number().min(1, "Danh mục ngày lễ là bắt buộc"),
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
    const [groups, setGroups] = useState([]);
    const [loadingGroups, setLoadingGroups] = useState(false);

    // Compensatory days feature
    const [compensatoryEnabled, setCompensatoryEnabled] = useState(false);
    const [compensatoryDays, setCompensatoryDays] = useState([]);
    
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
            holidayGroupId: undefined,
            employeeIds: [],
        },
    });

    useEffect(() => {
        if (isOpen) {
            fetchTreeData();
            fetchGroups();
            fetchConfig();
        }
    }, [isOpen]);

    const fetchConfig = async () => {
        try {
            const res = await holidayConfigService.getConfig();
            if (res.success) {
                setCompensatoryEnabled(res.data?.compensatoryWorkingDaysEnabled ?? false);
            }
        } catch (err) {
            console.error("Failed to fetch config:", err);
        }
    };

    const fetchGroups = async () => {
        setLoadingGroups(true);
        try {
            const res = await holidayConfigService.getGroups();
            if (res.success) {
                setGroups(res.data || []);
            }
        } catch (err) {
            console.error("Failed to fetch groups:", err);
        } finally {
            setLoadingGroups(false);
        }
    };

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
                holidayGroupId: holiday.holidayGroupId || undefined,
                employeeIds: holiday.employees?.map(e => e.id) || [],
            });
            // Restore compensatory days when editing an existing holiday
            setCompensatoryDays(
                Array.isArray(holiday.compensatoryDays) ? holiday.compensatoryDays : []
            );
        } else {
            form.reset({
                holidayName: "",
                startDate: "",
                endDate: "",
                holidayType: "Nghỉ lễ, tết",
                isPaid: true,
                description: "",
                holidayGroupId: undefined,
                employeeIds: [],
            });
            setCompensatoryDays([]);
        }
    }, [holiday, form, isOpen]);

    // ── Compensatory days helpers ──────────────────────────────────────────
    const addCompensatoryDay = () => {
        const holidayName = form.getValues("holidayName");
        setCompensatoryDays(prev => [
            ...prev,
            {
                date: "",
                replacesDate: "",
                note: holidayName ? `Làm bù ngày nghỉ ${holidayName}` : ""
            }
        ]);
    };

    const removeCompensatoryDay = (index) => {
        setCompensatoryDays(prev => prev.filter((_, i) => i !== index));
    };

    const updateCompensatoryDay = (index, field, value) => {
        setCompensatoryDays(prev =>
            prev.map((item, i) => i === index ? { ...item, [field]: value } : item)
        );
    };
    // ──────────────────────────────────────────────────────────────────────

    const onHandleSubmit = async (data) => {
        try {
            if (compensatoryEnabled) {
                const start = new Date(data.startDate + "T00:00:00");
                const end = new Date(data.endDate + "T00:00:00");
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                
                for (let i = 0; i < compensatoryDays.length; i++) {
                    const cd = compensatoryDays[i];
                    if (!cd.date) {
                        toastError(`Vui lòng chọn ngày làm bù cho dòng thứ ${i + 1}`);
                        return;
                    }

                    const compDate = new Date(cd.date + "T00:00:00");
                    if (isNaN(compDate.getTime()) || compDate < today) {
                        toastError(`Tại ngày làm bù thứ ${i + 1}: Ngày làm bù không được chọn trong quá khứ hoặc không hợp lệ.`);
                        return;
                    }

                    const dayOfWeek = compDate.getDay();
                    if (dayOfWeek !== 0 && dayOfWeek !== 6) {
                        toastError(`Tại ngày làm bù thứ ${i + 1}: Ngày làm bù phải là ngày không có phân ca (Thứ 7 hoặc Chủ Nhật).`);
                        return;
                    }

                    if (!cd.replacesDate) {
                        toastError(`Vui lòng chọn ngày cần bù cho dòng thứ ${i + 1}`);
                        return;
                    }
                    
                    const rDate = new Date(cd.replacesDate + "T00:00:00");
                    if (rDate < start || rDate > end) {
                        toastError(`Tại ngày làm bù thứ ${i + 1}: Ngày được chọn làm bù không còn nằm trong danh sách ngày nghỉ (Từ ${data.startDate} đến ${data.endDate}). Vui lòng chọn lại.`);
                        return;
                    }
                }
            }

            const payload = {
                ...data,
                compensatoryDays: compensatoryEnabled ? compensatoryDays : []
            };
            await onSubmit(payload);
            form.reset();
            setCompensatoryDays([]);
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
            <DialogContent 
                hideClose 
                onPointerDownOutside={(e) => e.preventDefault()}
                onEscapeKeyDown={(e) => e.preventDefault()}
                className="w-[95vw] sm:max-w-4xl lg:max-w-5xl bg-white p-0 gap-0 overflow-hidden border-none shadow-2xl max-h-[90vh] flex flex-col"
            >
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

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-6">
                                <FormField
                                    control={form.control}
                                    name="holidayGroupId"
                                    render={({ field }) => (
                                        <FormItem className="col-span-1 sm:col-span-2">
                                            <FormLabel className="text-[13px] font-medium text-gray-700">
                                                <span className="text-red-500 mr-1">*</span>Danh mục Ngày lễ (Năm)
                                            </FormLabel>
                                            <FormControl>
                                                <Select
                                                        options={groups.map(g => ({ value: g.id, label: `${g.groupName} (${g.year})` }))}
                                                        placeholder={loadingGroups ? "Đang tải danh mục..." : "Chọn danh mục ngày lễ"}
                                                        className="h-10 border-gray-200 focus:border-blue-500 focus:ring-0 rounded text-[14px]"
                                                        {...field}
                                                        onChange={(e) => field.onChange(parseInt(e.target.value))}
                                                        disabled={loadingGroups}
                                                    />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />

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

                                {/* ── Compensatory Days Section ─────────────────────────────── */}
                                {compensatoryEnabled && (
                                    <div className="col-span-1 sm:col-span-2 mt-2">
                                        <div className="rounded-xl border border-indigo-100 bg-indigo-50/40 p-5 space-y-4">
                                            {/* Section header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-2">
                                                    <CalendarDays className="h-4 w-4 text-indigo-600" />
                                                    <span className="text-[13px] font-bold text-indigo-800 uppercase tracking-tight">
                                                        Ngày làm bù
                                                    </span>
                                                    {compensatoryDays.length > 0 && (
                                                        <span className="ml-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-semibold">
                                                            {compensatoryDays.length} ngày
                                                        </span>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={addCompensatoryDay}
                                                    className="flex items-center gap-1.5 text-[12px] text-indigo-600 font-semibold hover:text-indigo-800 transition-colors px-3 py-1.5 rounded-lg hover:bg-indigo-100"
                                                >
                                                    <Plus className="h-3.5 w-3.5" />
                                                    Thêm ngày làm bù
                                                </button>
                                            </div>

                                            {/* Empty state */}
                                            {compensatoryDays.length === 0 && (
                                                <div className="text-center py-6 text-[13px] text-indigo-400 italic border-2 border-dashed border-indigo-200 rounded-lg">
                                                    Chưa có ngày làm bù nào. Nhấn &quot;Thêm ngày làm bù&quot; để bắt đầu.
                                                </div>
                                            )}

                                            {/* Rows */}
                                            <div className="space-y-3">
                                                {compensatoryDays.map((item, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-start gap-3 bg-white border border-indigo-100 rounded-lg px-4 py-3 shadow-sm"
                                                    >
                                                        {/* Index badge */}
                                                        <div className="flex-shrink-0 w-6 h-6 mt-6 rounded-full bg-indigo-100 text-indigo-700 text-[11px] font-bold flex items-center justify-center">
                                                            {index + 1}
                                                        </div>

                                                        {/* Step 1: which holiday date needs compensating */}
                                                        <div className="flex-shrink-0 space-y-1">
                                                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase">
                                                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-orange-100 text-orange-600 text-[9px] font-bold">1</span>
                                                                <span className="text-orange-600">Ngày cần bù</span>
                                                            </label>
                                                            {(() => {
                                                                const start = form.getValues("startDate");
                                                                const end   = form.getValues("endDate");
                                                                if (start && end) {
                                                                    // Build list of dates in the holiday range
                                                                    const dates = [];
                                                                    const s = new Date(start);
                                                                    const e = new Date(end);
                                                                    for (let d = new Date(s); d <= e; d.setDate(d.getDate() + 1)) {
                                                                        dates.push(d.toISOString().split("T")[0]);
                                                                    }
                                                                    return (
                                                                        <select
                                                                            value={item.replacesDate || ""}
                                                                            onChange={(e) => updateCompensatoryDay(index, "replacesDate", e.target.value)}
                                                                            className="h-9 px-2 border border-gray-200 rounded text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 bg-white"
                                                                        >
                                                                            <option value="">-- Chọn ngày --</option>
                                                                            {dates.map(dt => {
                                                                                const d = new Date(dt);
                                                                                const label = d.toLocaleDateString("vi-VN", { weekday: "short", day: "2-digit", month: "2-digit", year: "numeric" });
                                                                                return <option key={dt} value={dt}>{label}</option>;
                                                                            })}
                                                                        </select>
                                                                    );
                                                                }
                                                                return (
                                                                    <input
                                                                        type="date"
                                                                        value={item.replacesDate || ""}
                                                                        onChange={(e) => updateCompensatoryDay(index, "replacesDate", e.target.value)}
                                                                        className="h-9 px-3 border border-gray-200 rounded text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 bg-white"
                                                                    />
                                                                );
                                                            })()}
                                                        </div>

                                                        {/* Step 2: the actual make-up workday */}
                                                        <div className="flex-shrink-0 space-y-1">
                                                            <label className="flex items-center gap-1 text-[11px] font-semibold uppercase">
                                                                <span className="inline-flex items-center justify-center w-4 h-4 rounded-full bg-indigo-100 text-indigo-600 text-[9px] font-bold">2</span>
                                                                <span className="text-indigo-600">Ngày làm bù</span>
                                                            </label>
                                                            <input
                                                                type="date"
                                                                min={new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                                                                value={item.date}
                                                                onChange={(e) => updateCompensatoryDay(index, "date", e.target.value)}
                                                                className="h-9 px-3 border border-gray-200 rounded text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 bg-white"
                                                            />
                                                        </div>

                                                        {/* Note */}
                                                        <div className="flex-1 space-y-1">
                                                            <label className="text-[11px] text-gray-500 font-medium uppercase">
                                                                Ghi chú
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={item.note}
                                                                onChange={(e) => updateCompensatoryDay(index, "note", e.target.value)}
                                                                placeholder={`Ví dụ: Làm bù ngày nghỉ ${form.getValues("holidayName") || "..."}`}
                                                                className="w-full h-9 px-3 border border-gray-200 rounded text-[13px] focus:outline-none focus:border-indigo-400 focus:ring-1 focus:ring-indigo-300 bg-white"
                                                            />
                                                        </div>

                                                        {/* Delete */}
                                                        <button
                                                            type="button"
                                                            onClick={() => removeCompensatoryDay(index)}
                                                            className="flex-shrink-0 mt-6 p-1.5 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                            title="Xóa dòng"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>

                                            <p className="text-[11px] text-indigo-400 italic">
                                                * Ghi chú rõ ngày làm bù này dành cho kỳ nghỉ lễ nào để tiện tra cứu và tính công.
                                            </p>
                                        </div>
                                    </div>
                                )}
                                {/* ─────────────────────────────────────────────────────────── */}
                            </div>
                        </div>
                    </ScrollArea>
                </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
