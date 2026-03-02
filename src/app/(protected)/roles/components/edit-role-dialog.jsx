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
    name: z.string().min(1, 'Tên vai trò là bắt buộc').max(50),
    description: z.string().max(255).optional(),
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
        if (role) {
            form.reset({
                name: role.roleName,
                description: role.description || '',
                status: role.status || 'active',
            });
        }
    }, [role, form]);

    const onSubmit = async (values) => {
        try {
            await RoleService.updateRole(role.id, values);
            toast.success('Role updated successfully');
            onSuccess?.();
            onOpenChange(false);
        } catch (error) {
            console.error('Failed to update role:', error);
            if (error.response && error.response.status === 409) {
                form.setError('name', { type: 'manual', message: 'Role name already exists' });
            } else {
                toast.error(error.response?.data?.message || 'Failed to update role');
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
