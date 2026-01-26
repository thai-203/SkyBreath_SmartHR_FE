// User & Authentication Types
export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: 'admin' | 'manager' | 'employee';
    createdAt: string;
}

export interface AuthToken {
    token: string;
    user: Omit<User, 'password'>;
}

// Employee Types
export interface Employee {
    id: string;
    employeeCode: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    gender: 'male' | 'female' | 'other';
    address: string;
    departmentId: string;
    position: string;
    salary: number;
    hireDate: string;
    status: 'active' | 'inactive' | 'terminated';
    createdAt: string;
    updatedAt: string;
}

// Department Types
export interface Department {
    id: string;
    name: string;
    code: string;
    description: string;
    managerId?: string;
    createdAt: string;
    updatedAt: string;
}

// Leave Request Types
export interface LeaveRequest {
    id: string;
    employeeId: string;
    leaveType: 'annual' | 'sick' | 'personal' | 'unpaid';
    startDate: string;
    endDate: string;
    days: number;
    reason: string;
    status: 'pending' | 'approved' | 'rejected';
    approvedBy?: string;
    approvedAt?: string;
    rejectionReason?: string;
    createdAt: string;
    updatedAt: string;
}

// Attendance Types
export interface AttendanceRecord {
    id: string;
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: 'present' | 'absent' | 'late' | 'half-day';
    workHours?: number;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

// API Response Types
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    message?: string;
    error?: string;
}

export interface PaginatedResponse<T> {
    success: boolean;
    data: T[];
    total: number;
    page: number;
    pageSize: number;
}

// Filter Types
export interface EmployeeFilter {
    departmentId?: string;
    status?: Employee['status'];
    search?: string;
}

export interface LeaveFilter {
    employeeId?: string;
    status?: LeaveRequest['status'];
    startDate?: string;
    endDate?: string;
}

export interface AttendanceFilter {
    employeeId?: string;
    startDate?: string;
    endDate?: string;
    status?: AttendanceRecord['status'];
}
