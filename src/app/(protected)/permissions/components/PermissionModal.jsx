'use client';

import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { PermissionService } from '@/services/roles.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, RefreshCw } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
    permissionCode: z
        .string()
        .min(3, 'Mã quyền phải có ít nhất 3 ký tự')
        .max(100, 'Mã quyền tối đa 100 ký tự')
        .regex(/^[A-Z0-9_]+$/, 'Mã quyền chỉ được chứa chữ hoa, số và dấu gạch dưới')
        .transform(val => val.trim().toUpperCase()),
    module: z
        .string()
        .min(2, 'Phân hệ phải có ít nhất 2 ký tự')
        .max(50, 'Phân hệ tối đa 50 ký tự')
        .transform(val => val.trim()),
    description: z
        .string()
        .max(255, 'Mô tả tối đa 255 ký tự')
        .optional()
        .transform(val => val?.trim() || ''),
});

export default function PermissionModal({ permission, open, onOpenChange, onSuccess, modules = [] }) {
    const isEdit = !!permission;
    const [showCustomModule, setShowCustomModule] = useState(false);
    const form = useForm({
        resolver: zodResolver(formSchema),
        mode: 'onChange',
        defaultValues: {
            permissionCode: '',
            description: '',
            module: '',
        },
    });

    useEffect(() => {
        if (open) {
            if (permission) {
                form.reset({
                    permissionCode: permission.permissionCode || '',
                    description: permission.description || '',
                    module: permission.module || '',
                });
                // If the permission has a module not in the list, show custom input
                setShowCustomModule(!modules.includes(permission.module) && !!permission.module);
            } else {
                form.reset({
                    permissionCode: '',
                    description: '',
                    module: '',
                });
                setShowCustomModule(false);
            }
        }
    }, [permission, form, open, modules]);

    const onSubmit = async (values) => {
        try {
            if (isEdit) {
                await PermissionService.updatePermission(permission.id, values);
                toast.success('Cập nhật quyền thành công');
            } else {
                await PermissionService.createPermission(values);
                toast.success('Tạo quyền mới thành công');
            }
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            // Extract error information safely
            const response = error.response;
            const status = response?.status;
            const errorData = response?.data;
            
            // Priority: backend message > errorCode > generic message
            const backendMessage = errorData?.message || errorData?.errorCode || 'Có lỗi xảy ra khi lưu quyền';

            if (status === 409) {
                // Conflict: usually duplicate permission code
                form.setError('permissionCode', {
                    type: 'manual',
                    message: backendMessage
                });
                toast.error(backendMessage);
            } else if (status === 400 && errorData?.errors) {
                // Validation error from backend (nested errors array)
                errorData.errors.forEach((err) => {
                    const field = err.property;
                    const constraints = err.constraints;
                    const message = constraints ? Object.values(constraints)[0] : 'Dữ liệu không hợp lệ';

                    if (['permissionCode', 'module', 'description'].includes(field)) {
                        form.setError(field, { type: 'manual', message });
                    }
                });
                toast.error('Dữ liệu nhập vào chưa hợp lệ, vui lòng kiểm tra lại');
            } else {
                // Log unhandled errors to console but avoid triggering overlay if possible (or just log message)
                console.error('PermissionModal - Unhandled submission error:', backendMessage);
                toast.error(backendMessage);
            }
        }
    };

    const onInvalid = (errors) => {
        toast.error('Vui lòng kiểm tra lại các thông tin bắt buộc');
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] overflow-hidden border-none shadow-2xl bg-white">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <DialogHeader className="pt-4">
                    <DialogTitle className="text-xl font-bold text-gray-900">
                        {isEdit ? 'Chỉnh sửa quyền' : 'Thêm quyền mới'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-500">
                        {isEdit
                            ? 'Cập nhật lại thông tin định nghĩa quyền trong hệ thống.'
                            : 'Tạo một mã quyền mới để sử dụng trong phân quyền vai trò.'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-5 py-4">
                        <FormField
                            control={form.control}
                            name="permissionCode"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Mã quyền (Code) <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input
                                            placeholder="VD: USER_CREATE, REPORT_VIEW..."
                                            className="border-gray-200 focus:border-blue-500 transition-all uppercase"
                                            {...field}
                                            onChange={(e) => {
                                                const value = e.target.value.toUpperCase().replace(/\s/g, '_');
                                                field.onChange(value);
                                            }}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="module"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Phân hệ / Module <span className="text-red-500">*</span></FormLabel>
                                    {!showCustomModule ? (
                                        <div className="flex gap-2">
                                            <FormControl>
                                                <Select
                                                    onValueChange={(val) => {
                                                        if (val === '__NEW__') {
                                                            setShowCustomModule(true);
                                                            field.onChange('');
                                                        } else {
                                                            field.onChange(val);
                                                        }
                                                    }}
                                                    value={field.value}
                                                >
                                                    <SelectTrigger className="border-gray-200 focus:border-blue-500 transition-all">
                                                        <SelectValue placeholder="Chọn phân hệ..." />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {modules.map((m) => (
                                                            <SelectItem key={m} value={m}>{m}</SelectItem>
                                                        ))}
                                                        <SelectItem value="__NEW__" className="text-blue-600 font-medium">+ Thêm phân hệ mới...</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </FormControl>
                                        </div>
                                    ) : (
                                        <div className="flex gap-2 items-center">
                                            <FormControl>
                                                <Input
                                                    placeholder="Nhập tên phân hệ mới..."
                                                    className="border-gray-200 focus:border-blue-500 transition-all h-10"
                                                    {...field}
                                                    autoFocus
                                                />
                                            </FormControl>
                                            <Button
                                                type="button"
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => {
                                                    setShowCustomModule(false);
                                                    field.onChange('');
                                                }}
                                                className="text-gray-400 hover:text-gray-600 px-2 h-10 w-10 flex items-center justify-center"
                                                title="Quay lại danh sách"
                                            >
                                                <RefreshCw className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    )}
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Mô tả (Tiếng Việt)</FormLabel>
                                    <FormControl>
                                        <Textarea
                                            placeholder="Nhập mô tả chi tiết quyền này làm gì..."
                                            className="resize-none min-h-[100px] border-gray-200 focus:border-blue-500 transition-all"
                                            {...field}
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        <DialogFooter className="gap-2 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                className="border-gray-200 text-gray-600 hover:bg-gray-50"
                            >
                                Hủy
                            </Button>
                            <Button
                                type="submit"
                                disabled={form.formState.isSubmitting}
                                className="bg-blue-600 hover:bg-blue-700 shadow-md"
                            >
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isEdit ? 'Cập nhật' : 'Tạo mới'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
