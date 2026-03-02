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
import { Textarea } from '@/components/ui/textarea';
import { PermissionService } from '@/services/roles.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
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

export default function PermissionModal({ permission, open, onOpenChange, onSuccess }) {
    const isEdit = !!permission;

    const form = useForm({
        resolver: zodResolver(formSchema),
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
            } else {
                form.reset({
                    permissionCode: '',
                    description: '',
                    module: '',
                });
            }
        }
    }, [permission, form, open]);

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
            const errorData = error.response?.data;
            const status = error.response?.status;
            const backendMessage = errorData?.message || 'Có lỗi xảy ra khi lưu quyền';

            if (status === 409) {
                form.setError('permissionCode', {
                    type: 'manual',
                    message: backendMessage
                });
                toast.error(backendMessage);
            } else if (status === 400 && errorData?.errors) {
                // Map each backend validation error to its specific field
                errorData.errors.forEach((err) => {
                    const field = err.property;
                    const constraints = err.constraints;
                    // Get the most relevant error message for this field
                    const message = constraints ? Object.values(constraints)[0] : 'Dữ liệu không hợp lệ';

                    if (['permissionCode', 'module', 'description'].includes(field)) {
                        form.setError(field, { type: 'manual', message });
                    }
                });
                toast.error('Dữ liệu nhập vào chưa hợp lệ, vui lòng kiểm tra lại');
            } else {
                console.error('Lỗi khi lưu quyền:', error);
                toast.error(backendMessage);
            }
        }
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
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
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
                                    <FormControl>
                                        <Input
                                            placeholder="VD: Users, Roles, Contracts..."
                                            className="border-gray-200 focus:border-blue-500 transition-all"
                                            {...field}
                                        />
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
