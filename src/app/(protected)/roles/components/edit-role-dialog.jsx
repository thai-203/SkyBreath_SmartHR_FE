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
import { RoleService } from '@/services/roles.service';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2 } from 'lucide-react';
import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
    name: z
        .string()
        .min(2, 'Tên vai trò phải có ít nhất 2 ký tự')
        .max(50, 'Tên vai trò tối đa 50 ký tự')
        .transform(val => val.trim()),
    description: z
        .string()
        .max(255, 'Mô tả tối đa 255 ký tự')
        .optional()
        .transform(val => val?.trim() || ''),
    status: z.enum(['active', 'inactive']),
});

export default function EditRoleDialog({ role, open, onOpenChange, onSuccess }) {
    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            status: 'active',
        },
    });

    useEffect(() => {
        if (open && role) {
            form.reset({
                name: role.roleName,
                description: role.description || '',
                status: role.status || 'active',
            });
        }
    }, [role, form, open]);

    const onSubmit = async (values) => {
        try {
            await RoleService.updateRole(role.id, values);
            toast.success('Cập nhật vai trò thành công');
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            const errorData = error.response?.data;
            const status = error.response?.status;
            const backendMessage = errorData?.message || 'Không thể cập nhật vai trò';

            if (status === 409) {
                form.setError('name', {
                    type: 'manual',
                    message: backendMessage
                });
                toast.error(backendMessage);
            } else if (status === 400 && errorData?.errors) {
                errorData.errors.forEach((err) => {
                    const field = err.property;
                    const message = Object.values(err.constraints)[0];
                    if (['name', 'description', 'status'].includes(field)) {
                        form.setError(field, { type: 'manual', message });
                    }
                });
                toast.error('Dữ liệu không hợp lệ');
            } else {
                console.error('Failed to update role:', error);
                toast.error(backendMessage);
            }
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] border-none shadow-2xl bg-white">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-600 to-indigo-600" />
                <DialogHeader className="pt-4">
                    <DialogTitle className="text-xl font-bold text-gray-900">Cập nhật vai trò</DialogTitle>
                    <DialogDescription className="text-gray-500">
                        Chỉnh sửa thông tin cơ bản của vai trò này trong hệ thống.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Tên vai trò</FormLabel>
                                    <FormControl>
                                        <Input {...field} disabled={role?.isSystem} className="border-gray-200 focus:border-blue-500 transition-all" />
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
                                    <FormLabel className="font-semibold text-gray-700">Mô tả</FormLabel>
                                    <FormControl>
                                        <Textarea className="resize-none min-h-[100px] border-gray-200 focus:border-blue-500 transition-all" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Trạng thái</FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value} value={field.value}>
                                        <FormControl>
                                            <SelectTrigger className="border-gray-200">
                                                <SelectValue placeholder="Chọn trạng thái" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="active">Hoạt động</SelectItem>
                                            <SelectItem value="inactive">Ngừng hoạt động</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <DialogFooter className="gap-2 pt-4">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="border-gray-200 text-gray-600">
                                Hủy
                            </Button>
                            <Button type="submit" disabled={form.formState.isSubmitting} className="bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200">
                                {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Lưu thay đổi
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
