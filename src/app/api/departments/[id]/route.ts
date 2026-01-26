import { requireAuth } from '@/lib/auth';
import { departmentsDb } from '@/lib/db';
import type { ApiResponse, Department } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get department by ID
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
        const department = departmentsDb.findById(params.id);

        if (!department) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Department not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<Department>>(
            { success: true, data: department },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get department error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update department
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

        const updatedDepartment = departmentsDb.update(params.id, updates);

        if (!updatedDepartment) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Department not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<Department>>(
            { success: true, data: updatedDepartment, message: 'Department updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update department error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Delete department
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
        const deleted = departmentsDb.delete(params.id);

        if (!deleted) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Department not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse>(
            { success: true, message: 'Department deleted successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete department error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
