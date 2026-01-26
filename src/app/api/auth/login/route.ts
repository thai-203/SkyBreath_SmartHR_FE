import { generateToken, verifyPassword } from '@/lib/auth';
import { usersDb } from '@/lib/db';
import type { ApiResponse, AuthToken } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password } = body;

        // Validation
        if (!email || !password) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Email and password are required' },
                { status: 400 }
            );
        }

        // Find user
        const user = usersDb.findOne(u => u.email === email);
        if (!user) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Verify password
        const isValidPassword = await verifyPassword(password, user.password);
        if (!isValidPassword) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid credentials' },
                { status: 401 }
            );
        }

        // Generate token
        const { password: _, ...userWithoutPassword } = user;
        const token = generateToken(userWithoutPassword);

        const response: AuthToken = {
            token,
            user: userWithoutPassword,
        };

        return NextResponse.json<ApiResponse<AuthToken>>(
            { success: true, data: response, message: 'Login successful' },
            { status: 200 }
        );
    } catch (error) {
        console.error('Login error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
