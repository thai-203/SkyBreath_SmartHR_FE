import { requireAuth } from '@/lib/auth';
import { departmentsDb } from '@/lib/db';
import { generateId } from '@/lib/utils';
import type { ApiResponse, Department } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET - List all departments
export async function GET(request: NextRequest) {
    const authResult = requireAuth(request.headers.get('authorization'));
    if (!authResult.authenticated) {
        return NextResponse.json<ApiResponse>(
            { success: false, error: authResult.error },
            { status: 401 }
        );
    }

    try {
        const departments = departmentsDb.findAll();
        return NextResponse.json<ApiResponse<Department[]>>(
            { success: true, data: departments },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get departments error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new department
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
        const { name, code, description, managerId } = body;

        // Validation
        if (!name || !code) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Name and code are required' },
                { status: 400 }
            );
        }

        // Check if code already exists
        const existingDept = departmentsDb.findOne(d => d.code === code);
        if (existingDept) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Department code already exists' },
                { status: 409 }
            );
        }

        const newDepartment: Department = {
            id: generateId(),
            name,
            code,
            description: description || '',
            managerId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        departmentsDb.create(newDepartment);

        return NextResponse.json<ApiResponse<Department>>(
            { success: true, data: newDepartment, message: 'Department created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create department error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
