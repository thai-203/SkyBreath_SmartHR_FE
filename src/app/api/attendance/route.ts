import { requireAuth } from '@/lib/auth';
import { attendanceDb, employeesDb } from '@/lib/db';
import { calculateWorkHours, generateId } from '@/lib/utils';
import type { ApiResponse, AttendanceRecord } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET - List attendance records with filters
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
        const startDate = searchParams.get('startDate');
        const endDate = searchParams.get('endDate');

        let records = attendanceDb.findAll();

        // Apply filters
        if (employeeId) {
            records = records.filter(r => r.employeeId === employeeId);
        }
        if (startDate) {
            records = records.filter(r => r.date >= startDate);
        }
        if (endDate) {
            records = records.filter(r => r.date <= endDate);
        }

        // Sort by date (newest first)
        records.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json<ApiResponse<AttendanceRecord[]>>(
            { success: true, data: records },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get attendance error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// POST - Create attendance record (check-in/check-out)
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
        const { employeeId, type, notes } = body; // type: 'check-in' or 'check-out'

        // Validation
        if (!employeeId || !type) {
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

        const today = new Date().toISOString().split('T')[0];
        const now = new Date().toISOString();

        if (type === 'check-in') {
            // Check if already checked in today
            const existingRecord = attendanceDb.findOne(
                r => r.employeeId === employeeId && r.date === today
            );

            if (existingRecord) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Already checked in today' },
                    { status: 409 }
                );
            }

            const newRecord: AttendanceRecord = {
                id: generateId(),
                employeeId,
                date: today,
                checkIn: now,
                status: 'present',
                notes,
                createdAt: now,
                updatedAt: now,
            };

            attendanceDb.create(newRecord);

            return NextResponse.json<ApiResponse<AttendanceRecord>>(
                { success: true, data: newRecord, message: 'Checked in successfully' },
                { status: 201 }
            );
        } else if (type === 'check-out') {
            // Find today's record
            const record = attendanceDb.findOne(
                r => r.employeeId === employeeId && r.date === today
            );

            if (!record) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'No check-in record found for today' },
                    { status: 404 }
                );
            }

            if (record.checkOut) {
                return NextResponse.json<ApiResponse>(
                    { success: false, error: 'Already checked out today' },
                    { status: 409 }
                );
            }

            // Calculate work hours
            const workHours = record.checkIn ? calculateWorkHours(record.checkIn, now) : 0;

            const updatedRecord = attendanceDb.update(record.id, {
                checkOut: now,
                workHours,
                updatedAt: now,
            });

            return NextResponse.json<ApiResponse<AttendanceRecord>>(
                { success: true, data: updatedRecord, message: 'Checked out successfully' },
                { status: 200 }
            );
        } else {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid type. Must be check-in or check-out' },
                { status: 400 }
            );
        }
    } catch (error) {
        console.error('Create attendance error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
