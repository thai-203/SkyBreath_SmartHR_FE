'use client';

import Card from '@/components/ui/Card';
import { getAuthToken } from '@/lib/utils';
import { useEffect, useState } from 'react';
import './dashboard-page.css';

export default function DashboardPage() {
    const [stats, setStats] = useState({
        totalEmployees: 0,
        totalDepartments: 0,
        pendingLeaves: 0,
        todayAttendance: 0,
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const [employeesRes, departmentsRes, leavesRes, attendanceRes] = await Promise.all([
                fetch('/api/employees', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/departments', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/leaves?status=pending', { headers: { Authorization: `Bearer ${token}` } }),
                fetch('/api/attendance', { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            const employees = await employeesRes.json();
            const departments = await departmentsRes.json();
            const leaves = await leavesRes.json();
            const attendance = await attendanceRes.json();

            const today = new Date().toISOString().split('T')[0];
            const todayRecords = attendance.data?.filter((a: any) => a.date === today) || [];

            setStats({
                totalEmployees: employees.data?.length || 0,
                totalDepartments: departments.data?.length || 0,
                pendingLeaves: leaves.data?.length || 0,
                todayAttendance: todayRecords.length,
            });
        } catch (error) {
            console.error('Error fetching stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return <div className="loading">Đang tải...</div>;
    }

    return (
        <div className="dashboard-page">
            <h1 className="page-title">Dashboard</h1>
            <p className="page-subtitle">Tổng quan hệ thống quản lý nhân sự</p>

            <div className="stats-grid">
                <Card className="stat-card stat-card-primary">
                    <div className="stat-icon">👥</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats.totalEmployees}</h3>
                        <p className="stat-label">Tổng nhân viên</p>
                    </div>
                </Card>

                <Card className="stat-card stat-card-secondary">
                    <div className="stat-icon">🏢</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats.totalDepartments}</h3>
                        <p className="stat-label">Phòng ban</p>
                    </div>
                </Card>

                <Card className="stat-card stat-card-warning">
                    <div className="stat-icon">📅</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats.pendingLeaves}</h3>
                        <p className="stat-label">Đơn chờ duyệt</p>
                    </div>
                </Card>

                <Card className="stat-card stat-card-success">
                    <div className="stat-icon">⏰</div>
                    <div className="stat-content">
                        <h3 className="stat-value">{stats.todayAttendance}</h3>
                        <p className="stat-label">Chấm công hôm nay</p>
                    </div>
                </Card>
            </div>

            <div className="dashboard-info">
                <Card title="Chào mừng đến với HRM System">
                    <p>Hệ thống quản lý nhân sự toàn diện giúp bạn:</p>
                    <ul className="feature-list">
                        <li>✅ Quản lý thông tin nhân viên và phòng ban</li>
                        <li>✅ Theo dõi đơn xin nghỉ phép</li>
                        <li>✅ Chấm công và tính toán giờ làm việc</li>
                        <li>✅ Báo cáo và thống kê chi tiết</li>
                    </ul>
                </Card>
            </div>
        </div>
    );
}
