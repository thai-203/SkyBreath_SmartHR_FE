'use client';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import * as z from 'zod';

const formSchema = z.object({
    name: z.string().min(1, 'Tên vai trò là bắt buộc').max(50, 'Tên vai trò quá dài'),
    description: z.string().max(255, 'Mô tả quá dài').optional(),
    status: z.enum(['active', 'inactive']).default('active'),
});

export default function CreateRoleForm() {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);

    const form = useForm({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: '',
            description: '',
            status: 'active',
        },
    });

    const onSubmit = async (values) => {
        setIsLoading(true);
        try {
            await RoleService.createRole(values);
            toast.success('Role created successfully');
            router.push('/roles');
            router.refresh(); // Refresh the list
        } catch (error) {
            console.error('Failed to create role:', error);
            if (error.response && error.response.status === 409) {
                form.setError('name', { type: 'manual', message: 'Role name already exists' });
                toast.error('Role name already exists');
            } else {
                toast.error(error.response?.data?.message || 'Failed to create role');
            }
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Card className="w-full max-w-2xl mx-auto shadow-xl border-none overflow-hidden mt-8">
            <div className="h-2 bg-gradient-to-r from-blue-600 to-indigo-600" />
            <CardHeader className="pb-2">
                <CardTitle className="text-2xl font-bold text-gray-900">Tạo vai trò mới</CardTitle>
                <p className="text-gray-500 text-sm">Điền thông tin chi tiết để thiết lập một vai trò mới trong hệ thống.</p>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 pt-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel className="font-semibold text-gray-700">Tên vai trò <span className="text-red-500">*</span></FormLabel>
                                    <FormControl>
                                        <Input placeholder="VD: Quản lý nhân sự, Kế toán..." className="border-gray-200 focus:border-blue-500 transition-all" {...field} />
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
                                        <Textarea
                                            placeholder="Nhập mô tả nhiệm vụ của vai trò này..."
                                            className="resize-none min-h-[120px] border-gray-200 focus:border-blue-500 transition-all"
                                            {...field}
                                        />
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
                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
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

                        <div className="flex justify-end gap-3 pt-6 border-t border-gray-50">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isLoading}
                                className="border-gray-200 text-gray-600 px-6"
                            >
                                Hủy
                            </Button>
                            <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 px-8 shadow-lg shadow-blue-200">
                                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Tạo vai trò
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    );
}
