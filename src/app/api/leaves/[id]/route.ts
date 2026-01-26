import { requireAuth } from '@/lib/auth';
import { leavesDb } from '@/lib/db';
import type { ApiResponse, LeaveRequest } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

// GET - Get leave request by ID
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
        const leave = leavesDb.findById(params.id);

        if (!leave) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Leave request not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<LeaveRequest>>(
            { success: true, data: leave },
            { status: 200 }
        );
    } catch (error) {
        console.error('Get leave error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// PUT - Update/Approve/Reject leave request
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
        const { status, rejectionReason } = body;

        const updates: Partial<LeaveRequest> = {
            ...body,
            updatedAt: new Date().toISOString(),
        };

        // If approving or rejecting, add metadata
        if (status === 'approved' || status === 'rejected') {
            updates.approvedBy = authResult.user.id;
            updates.approvedAt = new Date().toISOString();
            if (status === 'rejected' && rejectionReason) {
                updates.rejectionReason = rejectionReason;
            }
        }

        const updatedLeave = leavesDb.update(params.id, updates);

        if (!updatedLeave) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Leave request not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse<LeaveRequest>>(
            { success: true, data: updatedLeave, message: 'Leave request updated successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Update leave error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}

// DELETE - Cancel leave request
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
        const deleted = leavesDb.delete(params.id);

        if (!deleted) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Leave request not found' },
                { status: 404 }
            );
        }

        return NextResponse.json<ApiResponse>(
            { success: true, message: 'Leave request cancelled successfully' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Delete leave error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
