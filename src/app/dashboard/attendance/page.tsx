'use client';

import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';
import { formatDate, getAuthToken, getStoredUser } from '@/lib/utils';
import type { AttendanceRecord, Employee } from '@/types';
import { useEffect, useState } from 'react';
import '../employees/employees.css';
import './attendance.css';

export default function AttendancePage() {
    const [records, setRecords] = useState<AttendanceRecord[]>([]);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const user = getStoredUser();

    useEffect(() => {
        fetchRecords();
        fetchEmployees();
    }, [selectedDate]);

    const fetchRecords = async () => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch(`/api/attendance?startDate=${selectedDate}&endDate=${selectedDate}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            const data = await response.json();
            if (data.success) {
                setRecords(data.data);
            }
        } catch (error) {
            console.error('Error fetching attendance:', error);
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

    const handleCheckIn = async (employeeId: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employeeId,
                    type: 'check-in',
                }),
            });

            const data = await response.json();
            if (data.success) {
                fetchRecords();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error checking in:', error);
        }
    };

    const handleCheckOut = async (employeeId: string) => {
        const token = getAuthToken();
        if (!token) return;

        try {
            const response = await fetch('/api/attendance', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    employeeId,
                    type: 'check-out',
                }),
            });

            const data = await response.json();
            if (data.success) {
                fetchRecords();
            } else {
                alert(data.error);
            }
        } catch (error) {
            console.error('Error checking out:', error);
        }
    };

    const getEmployeeName = (employeeId: string) => {
        const employee = employees.find(emp => emp.id === employeeId);
        return employee ? `${employee.firstName} ${employee.lastName}` : 'N/A';
    };

    const formatTime = (dateTime?: string) => {
        if (!dateTime) return '-';
        const date = new Date(dateTime);
        return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    };

    const getTodayRecord = (employeeId: string) => {
        return records.find(r => r.employeeId === employeeId && r.date === selectedDate);
    };

    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    if (loading) return <div className="loading">Đang tải...</div>;

    return (
        <div className="employees-page">
            <div className="page-header">
                <div>
                    <h1 className="page-title">Chấm công</h1>
                    <p className="page-subtitle">Theo dõi giờ vào ra của nhân viên</p>
                </div>
            </div>

            <div className="attendance-controls">
                <Card className="date-selector">
                    <label className="input-label">Chọn ngày:</label>
                    <input
                        type="date"
                        className="input"
                        value={selectedDate}
                        onChange={(e) => setSelectedDate(e.target.value)}
                        max={new Date().toISOString().split('T')[0]}
                    />
                </Card>

                {isToday && (
                    <Card className="quick-actions">
                        <h3 className="card-title">Chấm công nhanh</h3>
                        <div className="quick-action-buttons">
                            <Button
                                variant="success"
                                onClick={() => {
                                    const empId = prompt('Nhập ID nhân viên:');
                                    if (empId) handleCheckIn(empId);
                                }}
                            >
                                ⏰ Check In
                            </Button>
                            <Button
                                variant="secondary"
                                onClick={() => {
                                    const empId = prompt('Nhập ID nhân viên:');
                                    if (empId) handleCheckOut(empId);
                                }}
                            >
                                🏁 Check Out
                            </Button>
                        </div>
                    </Card>
                )}
            </div>

            <Card title={`Bảng chấm công - ${formatDate(selectedDate)}`}>
                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th>Nhân viên</th>
                                <th>Giờ vào</th>
                                <th>Giờ ra</th>
                                <th>Số giờ làm</th>
                                <th>Trạng thái</th>
                                {isToday && <th>Thao tác</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {employees.map((emp) => {
                                const record = getTodayRecord(emp.id);
                                return (
                                    <tr key={emp.id}>
                                        <td>{`${emp.firstName} ${emp.lastName}`}</td>
                                        <td>
                                            <span className="time-badge">
                                                {formatTime(record?.checkIn)}
                                            </span>
                                        </td>
                                        <td>
                                            <span className="time-badge">
                                                {formatTime(record?.checkOut)}
                                            </span>
                                        </td>
                                        <td>
                                            {record?.workHours ? `${record.workHours.toFixed(1)}h` : '-'}
                                        </td>
                                        <td>
                                            {record ? (
                                                <span className={`status-badge status-${record.status}`}>
                                                    {record.status === 'present' && 'Có mặt'}
                                                    {record.status === 'absent' && 'Vắng'}
                                                    {record.status === 'late' && 'Muộn'}
                                                    {record.status === 'half-day' && 'Nửa ngày'}
                                                </span>
                                            ) : (
                                                <span className="status-badge status-absent">Chưa chấm</span>
                                            )}
                                        </td>
                                        {isToday && (
                                            <td>
                                                <div className="action-buttons">
                                                    {!record && (
                                                        <Button
                                                            size="sm"
                                                            variant="success"
                                                            onClick={() => handleCheckIn(emp.id)}
                                                        >
                                                            Check In
                                                        </Button>
                                                    )}
                                                    {record && !record.checkOut && (
                                                        <Button
                                                            size="sm"
                                                            variant="secondary"
                                                            onClick={() => handleCheckOut(emp.id)}
                                                        >
                                                            Check Out
                                                        </Button>
                                                    )}
                                                    {record && record.checkOut && (
                                                        <span className="text-success">✓ Hoàn thành</span>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </div>
    );
}
