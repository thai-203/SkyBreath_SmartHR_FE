import { requireAuth } from '@/lib/auth';
import { employeesDb } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { ApiResponse, Employee } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET - List all employees with optional filters
export async function GET(request: NextRequest) {
    const authResult = requireAuth(request.headers.get('authorization'));
    if (!authResult.authenticated) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: authResult.error },
            { status: 401 }
        );
    }

    try {
        const { searchParams } = new URL(request.url);
        const departmentId = searchParams.get('departmentId');
        const status = searchParams.get('status');
        const search = searchParams.get('search');

        let employees = employeesDb.findAll();

        // Apply filters
        if (departmentId) {
            employees = employees.filter(e => e.departmentId === departmentId);
        }
        if (status) {
            employees = employees.filter(e => e.status === status);
        }
        if (search) {
            const searchLower = search.toLowerCase();
            employees = employees.filter(e =>
                e.firstName.toLowerCase().includes(searchLower) ||
                e.lastName.toLowerCase().includes(searchLower) ||
                e.email.toLowerCase().includes(searchLower) ||
                e.employeeCode.toLowerCase().includes(searchLower)
            );
        }

        return NextResponse.json<ApiResponse<Employee[]>>(
            { success: true, data: employees },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get employees error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new employee
export async function POST(request: NextRequest) {
    const authResult = requireAuth(request.headers.get('authorization'));
    if (!authResult.authenticated) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: authResult.error },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const {
            employeeCode,
            firstName,
            lastName,
            email,
            phone,
            dateOfBirth,
            gender,
            address,
            departmentId,
            position,
            salary,
            hireDate,
        } = body;

        // Validation
        if (!employeeCode || !firstName || !lastName || !email || !departmentId || !position) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Check if employee code already exists
        const existingEmployee = employeesDb.findOne(e => e.employeeCode === employeeCode);
        if (existingEmployee) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Employee code already exists' },
                { status: 409 }
            );
        }

        const newEmployee: Employee = {
            id: generateId(),
            employeeCode,
            firstName,
            lastName,
            email,
            phone: phone || '',
            dateOfBirth: dateOfBirth || '',
            gender: gender || 'other',
            address: address || '',
            departmentId,
            position,
            salary: salary || 0,
            hireDate: hireDate || new Date().toISOString(),
            status: 'active',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        employeesDb.create(newEmployee);

        return NextResponse.json<ApiResponse<Employee>>(
            { success: true, data: newEmployee, message: 'Employee created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create employee error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
