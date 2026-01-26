'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Modal from '@/components/ui/Modal';
import { formatDate, getAuthToken } from '@/lib/utils';
import type { Employee, LeaveRequest } from '@/types';
import React, { useEffect, useState } from 'react';
import '../employees/employees.css';
import './leaves.css';

export default function LeavesPage() {
    const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [formData, setFormData] = useState({
        employeeId: '',
        leaveType: 'annual' as LeaveRequest['leaveType'],
        startDate: '',
        endDate: '',
        reason: '',
    });

    useEffect(() => {
        fetchLeaves();
        fetchEmployees();
    }, []);

    const fetchLeaves = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch('/api/leaves', {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setLeaves(data.data);
            }
        } catch (error) {
            console.error('Error fetching leaves:', error);
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

        try {
            const response = await fetch('/api/leaves', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();
            if (data.success) {
                fetchLeaves();
                handleCloseModal();
            }
        } catch (error) {
            console.error('Error creating leave:', error);
        }
    };

    const handleApprove = async (id: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/leaves/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'approved' }),
            });

            if (response.ok) {
                fetchLeaves();
            }
        } catch (error) {
            console.error('Error approving leave:', error);
        }
    };

    const handleReject = async (id: string) => {
        const reason = prompt('Lý do từ chối:');
        if (!reason) return;

        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/leaves/${id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({ status: 'rejected', rejectionReason: reason }),
            });

            if (response.ok) {
                fetchLeaves();
            }
        } catch (error) {
            console.error('Error rejecting leave:', error);
        }
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setFormData({
            employeeId: '',
            leaveType: 'annual',
            startDate: '',
            endDate: '',
            reason: '',
        });
    };

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : 'N/A';
    };

    const filteredLeaves = filterStatus === 'all'
        ? leaves
        : leaves.filter(leave => leave.status === filterStatus);

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="employees-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Quản lý Nghỉ phép</h1>
                    <p className="page-subtitle">Danh sách đơn xin nghỉ phép</p>
                </div>
                <Button onClick={() => setIsModalOpen(true)}>+ Tạo đơn nghỉ phép</Button>
            </div>

            <Card>
                <div className="filter-bar">
                    <div className="filter-buttons">
                        <button
                            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('all')}
                        >
                            Tất cả ({leaves.length})
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('pending')}
                        >
                            Chờ duyệt ({leaves.filter(l => l.status === 'pending').length})
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'approved' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('approved')}
                        >
                            Đã duyệt ({leaves.filter(l => l.status === 'approved').length})
                        </button>
                        <button
                            className={`filter-btn ${filterStatus === 'rejected' ? 'active' : ''}`}
                            onClick={() => setFilterStatus('rejected')}
                        >
                            Từ chối ({leaves.filter(l => l.status === 'rejected').length})
                        </button>
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Loại nghỉ</th>
                                <th>Từ ngày</th>
                                <th>Đến ngày</th>
                                <th>Số ngày</th>
                                <th>Lý do</th>
                                <th>Trạng thái</th>
                                <th>Thao tác</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredLeaves.map((leave) => (
                                <tr key={leave.id}>
                                    <td>{getEmployeeName(leave.employeeId)}</td>
                                    <td>
                                        <span className={`leave-type leave-type-${leave.leaveType}`}>
                                            {leave.leaveType === 'annual' && 'Nghỉ phép'}
                                            {leave.leaveType === 'sick' && 'Nghỉ ốm'}
                                            {leave.leaveType === 'personal' && 'Nghỉ cá nhân'}
                                            {leave.leaveType === 'unpaid' && 'Không lương'}
                                        </span>
                                    </td>
                                    <td>{formatDate(leave.startDate)}</td>
                                    <td>{formatDate(leave.endDate)}</td>
                                    <td>{leave.days} ngày</td>
                                    <td className="reason-cell">{leave.reason}</td>
                                    <td>
                                        <span className={`status-badge status-${leave.status}`}>
                                            {leave.status === 'pending' && 'Chờ duyệt'}
                                            {leave.status === 'approved' && 'Đã duyệt'}
                                            {leave.status === 'rejected' && 'Từ chối'}
                                        </span>
                                    </td>
                                    <td>
                                        {leave.status === 'pending' && (
                                            <div className="action-buttons">
                                                <button
                                                    className="btn-action btn-approve"
                                                    onClick={() => handleApprove(leave.id)}
                                                    title="Duyệt"
                                                >
                                                    ✓
                                                </button>
                                                <button
                                                    className="btn-action btn-reject"
                                                    onClick={() => handleReject(leave.id)}
                                                    title="Từ chối"
                                                >
                                                    ✕
                                                </button>
                                            </div>
                                        )}
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
                title="Tạo đơn nghỉ phép mới"
            >
                <form onSubmit={handleSubmit}>
                    <div className="input-wrapper input-full">
                        <label className="input-label">Nhân viên *</label>
                        <select
                            className="input"
                            value={formData.employeeId}
                            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                            required
                        >
                            <option value="">Chọn nhân viên</option>
                            {employees.map(emp => (
                                <option key={emp.id} value={emp.id}>
                                    {`${emp.firstName} ${emp.lastName}`}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="input-wrapper input-full">
                        <label className="input-label">Loại nghỉ *</label>
                        <select
                            className="input"
                            value={formData.leaveType}
                            onChange={(e) => setFormData({ ...formData, leaveType: e.target.value as any })}
                            required
                        >
                            <option value="annual">Nghỉ phép</option>
                            <option value="sick">Nghỉ ốm</option>
                            <option value="personal">Nghỉ cá nhân</option>
                            <option value="unpaid">Không lương</option>
                        </select>
                    </div>
                    <Input
                        label="Từ ngày"
                        type="date"
                        value={formData.startDate}
                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                        required
                        fullWidth
                    />
                    <Input
                        label="Đến ngày"
                        type="date"
                        value={formData.endDate}
                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                        required
                        fullWidth
                    />
                    <Input
                        label="Lý do"
                        value={formData.reason}
                        onChange={(e) => setFormData({ ...formData, reason: e.target.value })}
                        required
                        fullWidth
                    />
                    <div className="form-actions">
                        <Button type="button" variant="outline" onClick={handleCloseModal}>
                            Hủy
                        </Button>
                        <Button type="submit">Tạo đơn</Button>
                    </div>
                </form>
            </Modal>
        </div>
    );
}
