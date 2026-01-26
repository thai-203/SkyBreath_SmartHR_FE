'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatCurrency, getAuthToken } from '@/lib/utils';
import type { Department, Employee } from '@/types';
import React, { useEffect, useState } from 'react';
import './employees.css';

export default function EmployeesPage() {
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [formData, setFormData] = useState({
        employeeCode: '',
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        dateOfBirth: '',
        gender: 'male' as 'male' | 'female' | 'other',
        address: '',
        departmentId: '',
        position: '',
        salary: '',
        hireDate: '',
    });

    useEffect(() => {
        fetchEmployees();
        fetchDepartments();
    }, []);

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
        } finally {
            setLoading(false);
        }
    };

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
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        const token = getAuthToken();
        if (!token) return;

        const url = editingEmployee
            ? `/api/employees/${editingEmployee.id}`
            : '/api/employees';
        const method = editingEmployee ? 'PUT' : 'POST';

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    ...formData,
                    salary: parseFloat(formData.salary) || 0,
                }),
            });

            const data = await response.json();
            if (data.success) {
                fetchEmployees();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error saving employee:', error);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Bạn có chắc muốn xóa nhân viên này?')) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/employees/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });

            if (response.ok) {
                fetchEmployees();
            }
        } catch (error) {
            console.error('Error deleting employee:', error);
        }
    };

    const handleEdit = (employee: Employee) => {
        setEditingEmployee(employee);
        setFormData({
            employeeCode: employee.employeeCode,
            firstName: employee.firstName,
            lastName: employee.lastName,
            email: employee.email,
            phone: employee.phone,
            dateOfBirth: employee.dateOfBirth,
            gender: employee.gender,
            address: employee.address,
            departmentId: employee.departmentId,
            position: employee.position,
            salary: employee.salary.toString(),
            hireDate: employee.hireDate,
        });
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingEmployee(null);
        setFormData({
            employeeCode: '',
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dateOfBirth: '',
            gender: 'male',
            address: '',
            departmentId: '',
            position: '',
            salary: '',
            hireDate: '',
        });
    };

    const filteredEmployees = employees.filter(emp =>
        emp.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.employeeCode.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="employees-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quản lý Nhân viên</h1>
                    <p className="page-subtitle">Danh sách và thông tin nhân viên</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>+ Thêm nhân viên</Button>
            </div>

            <Card>
                <div className="search-bar">
                    <Input
                        placeholder="Tìm kiếm theo tên, email, mã nhân viên..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        fullWidth
                    />
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Mã NV</th>
                                <th>Họ tên</th>
                                <th>Email</th>
                                <th>Phòng ban</th>
                                <th>Chức vụ</th>
                                <th>Lương</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredEmployees.map((emp) => (
                                <tr key={emp.id}>
                                    <td>{emp.employeeCode}</td>
                                    <td>{`${emp.firstName} ${emp.lastName}`}</td>
                                    <td>{emp.email}</td>
                                    <td>
                                        {departments.find(d => d.id === emp.departmentId)?.name || 'N/A'}
                                    </td>
                                    <td>{emp.position}</td>
                                    <td>{formatCurrency(emp.salary)}</td>
                                    <td>
                                        <span className={`status-badge status-${emp.status}`}>
                                            {emp.status === 'active' ? 'Đang làm' : 'Nghỉ việc'}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="action-buttons">
                                            <button className="btn-action btn-edit" onClick={() => handleEdit(emp)}>
                                                ✏️
                                            </button>
                                            <button className="btn-action btn-delete" onClick={() => handleDelete(emp.id)}>
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Card>

            <Modal
                isOpen={isModalOpen}
                onClose={handleCloseModal}
                title={editingEmployee ? 'Chỉnh sửa nhân viên' : 'Thêm nhân viên mới'}
                size="lg"
            >
                <form onSubmit={handleSubmit} className="employee-form">
                    <div className="form-grid">
                        <Input
                            label="Mã nhân viên"
                            value={formData.employeeCode}
                            onChange={(e) => setFormData({ ...formData, employeeCode: e.target.value })}
                            required
                            fullWidth
                        />
                        <Input
                            label="Họ"
                            value={formData.firstName}
                            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                            required
                            fullWidth
                        />
                        <Input
                            label="Tên"
                            value={formData.lastName}
                            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                            required
                            fullWidth
                        />
                        <Input
                            label="Email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            required
                            fullWidth
                        />
                        <Input
                            label="Số điện thoại"
                            value={formData.phone}
                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                            fullWidth
                        />
                        <Input
                            label="Ngày sinh"
                            type="date"
                            value={formData.dateOfBirth}
                            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                            fullWidth
                        />
                        <div className="input-wrapper input-full">
                            <label className="input-label">Giới tính</label>
                            <select
                                className="input"
                                value={formData.gender}
                                onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                            >
                                <option value="male">Nam</option>
                                <option value="female">Nữ</option>
                                <option value="other">Khác</option>
                            </select>
                        </div>
                        <div className="input-wrapper input-full">
                            <label className="input-label">Phòng ban *</label>
                            <select
                                className="input"
                                value={formData.departmentId}
                                onChange={(e) => setFormData({ ...formData, departmentId: e.target.value })}
                                required
                            >
                                <option value="">Chọn phòng ban</option>
                                {departments.map(dept => (
                                    <option key={dept.id} value={dept.id}>{dept.name}</option>
                                ))}
                            </select>
                        </div>
                        <Input
                            label="Chức vụ"
                            value={formData.position}
                            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                            required
                            fullWidth
                        />
                        <Input
                            label="Lương"
                            type="number"
                            value={formData.salary}
                            onChange={(e) => setFormData({ ...formData, salary: e.target.value })}
                            fullWidth
                        />
                        <Input
                            label="Ngày vào làm"
                            type="date"
                            value={formData.hireDate}
                            onChange={(e) => setFormData({ ...formData, hireDate: e.target.value })}
                            fullWidth
                        />
                        <Input
                            label="Địa chỉ"
                            value={formData.address}
                            onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                            fullWidth
                        />
                    </div>
                    <div className="form-actions">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Hủy
                        </Button>
                        <Button type="submit">
                            {editingEmployee ? 'Cập nhật' : 'Thêm mới'}
                        </Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
