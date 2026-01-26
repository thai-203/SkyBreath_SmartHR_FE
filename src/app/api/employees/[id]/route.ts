import { requireAuth } from '@/lib/auth';
import { employeesDb } from '@/lib/db';
import type { ApiResponse, Employee } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get employee by ID
export async function GET(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = requireAuth(request.headers.get('authorization'));
    if (!authResult.authenticated) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: authResult.error },
            { status: 401 }
        );
    }

    try {
        const employee = employeesDb.findById(params.id);

        if (!employee) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<Employee>>(
            { success: true, data: employee },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get employee error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update employee
export async function PUT(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = requireAuth(request.headers.get('authorization'));
    if (!authResult.authenticated) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: authResult.error },
            { status: 401 }
        );
    }

    try {
        const body = await request.json();
        const updates = {
            ...body,
            updatedAt: new Date().toISOString(),
        };

        const updatedEmployee = employeesDb.update(params.id, updates);

        if (!updatedEmployee) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<Employee>>(
            { success: true, data: updatedEmployee, message: 'Employee updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update employee error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete employee
export async function DELETE(
    request: NextRequest,
    { params }: { params: { id: string } }
) {
    const authResult = requireAuth(request.headers.get('authorization'));
    if (!authResult.authenticated) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: authResult.error },
            { status: 401 }
        );
    }

    try {
        const deleted = employeesDb.delete(params.id);

        if (!deleted) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse>(
            { success: true, message: 'Employee deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete employee error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
