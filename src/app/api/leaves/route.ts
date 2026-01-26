import { requireAuth } from '@/lib/auth';
import { employeesDb, leavesDb } from '@/lib/db';
import { calculateDays, generateId } from '@/lib/utils';
import type { ApiResponse, LeaveRequest } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET - List leave requests with filters
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
        const employeeId = searchParams.get('employeeId');
        const status = searchParams.get('status');

        let leaves = leavesDb.findAll();

        // Apply filters
        if (employeeId) {
            leaves = leaves.filter(l => l.employeeId === employeeId);
        }
        if (status) {
            leaves = leaves.filter(l => l.status === status);
        }

        // Sort by creation date (newest first)
        leaves.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        return NextResponse.json<ApiResponse<LeaveRequest[]>>(
            { success: true, data: leaves },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get leaves error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create new leave request
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
        const { employeeId, leaveType, startDate, endDate, reason } = body;

        // Validation
        if (!employeeId || !leaveType || !startDate || !endDate || !reason) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Verify employee exists
        const employee = employeesDb.findById(employeeId);
        if (!employee) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Employee not found' },
                { status: 404 }
            );
        }

        // Calculate days
        const days = calculateDays(startDate, endDate);

        const newLeave: LeaveRequest = {
            id: generateId(),
            employeeId,
            leaveType,
            startDate,
            endDate,
            days,
            reason,
            status: 'pending',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        leavesDb.create(newLeave);

        return NextResponse.json<ApiResponse<LeaveRequest>>(
            { success: true, data: newLeave, message: 'Leave request created successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Create leave error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
