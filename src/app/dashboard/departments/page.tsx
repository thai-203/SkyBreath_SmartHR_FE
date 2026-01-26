'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { getAuthToken } from '@/lib/utils';
import type { Department, Employee } from '@/types';
import React, { useEffect, useState } from 'react';
import '../employees/employees.css';

export default function DepartmentsPage() {
    const [departments, setDepartments] = useState<Department[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingDept, setEditingDept] = useState<Department | null>(null);
    const [formData, setFormData] = useState({
        name: '',
        code: '',
        description: '',
        managerId: '',
    });

    useEffect(() => {
        fetchDepartments();
        fetchEmployees();
    }, []);

    const fetchDepartments = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch('/api/departments', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setDepartments(data.data);
            }
        } catch (error) {
            console.error('Error fetching departments:', error);
        } finally {
            setLoading(false);
        }
    };

    const fetchEmployees = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch('/api/employees', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setEmployees(data.data);
            }
        } catch (error) {
            console.error('Error fetching employees:', error);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) return;

        const url = editingDept
            ? `/api/departments/${editingDept.id}`
            : '/api/departments';
        const method = editingDept ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                fetchDepartments();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving department:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa phòng ban này?')) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/departments/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                fetchDepartments();
            }
        } catch (error) {
            console.error('Error deleting department:', error);
        }
    };

    const handleEdit = (dept: Department) => {
        setEditingDept(dept);
        setFormData({
            name: dept.name,
            code: dept.code,
            description: dept.description,
            managerId: dept.managerId || '',
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingDept(null);
        setFormData({
            name: '',
            code: '',
            description: '',
            managerId: '',
        });
    };

    const getEmployeeCount = (deptId: string) => {
        return employees.filter(emp => emp.departmentId === deptId).length;
    };

    const getManagerName = (managerId?: string) => {
        if (!managerId) return 'Chưa có';
        const manager = employees.find(emp => emp.id === managerId);
        return manager ? `${manager.firstName} ${manager.lastName}` : 'N/A';
    };

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="employees-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quản lý Phòng ban</h1>
                    <p className="page-subtitle">Danh sách và thông tin phòng ban</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>+ Thêm phòng ban</Button>
            </div>

            <div className="departments-grid">
                {departments.map((dept) => (
                    <Card key={dept.id} className="department-card">
                        <div className="dept-header">
                            <div>
                                <h3 className="dept-name">{dept.name}</h3>
                                <span className="dept-code">{dept.code}</span>
                            </div>
                            <div className="action-buttons">
                                <button className="btn-action btn-edit" onClick={() => handleEdit(dept)}>
                                    ✏️
                                </button>
                                <button className="btn-action btn-delete" onClick={() => handleDelete(dept.id)}>
                                    🗑️
                                </button>
                            </div>
                        </div>

                        <p className="dept-description">{dept.description || 'Không có mô tả'}</p>

                        <div className="dept-info">
                            <div className="info-item">
                                <span className="info-label">Trưởng phòng:</span>
                                <span className="info-value">{getManagerName(dept.managerId)}</span>
                            </div>
                            <div className="info-item">
                                <span className="info-label">Số nhân viên:</span>
                                <span className="info-value">{getEmployeeCount(dept.id)}</span>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingDept ? 'Chỉnh sửa phòng ban' : 'Thêm phòng ban mới'}
            >
                <form onSubmit={handleSubmit}>
                    <Input
                        label="Tên phòng ban"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />
                    <Input
                        label="Mã phòng ban"
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                        required
                        fullWidth
                    />
                    <Input
                        label="Mô tả"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        fullWidth
                    />
                    <div className="input-wrapper input-full">
                        <label className="input-label">Trưởng phòng</label>
                        <select
                            className="input"
                            value={formData.managerId}
                            onChange={(e) => setFormData({ ...formData, managerId: e.target.value })}
                        >
                            <option value="">Chọn trưởng phòng</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {`${emp.firstName} ${emp.lastName}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Hủy
                        </Button>
                        <Button type="submit">
                            {editingDept ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
