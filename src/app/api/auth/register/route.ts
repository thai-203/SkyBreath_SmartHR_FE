import { hashPassword } from '@/lib/auth';
import { usersDb } from '@/lib/db';
import { generateId, isValidEmail } from '@/lib/utils';
import type { ApiResponse, User } from '@/types';
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { email, password, name, role = 'employee' } = body;

        // Validation
        if (!email || !password || !name) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Missing required fields' },
                { status: 400 }
            );
        }

        if (!isValidEmail(email)) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Invalid email format' },
                { status: 400 }
            );
        }

        // Check if user already exists
        const existingUser = usersDb.findOne(u => u.email === email);
        if (existingUser) {
            return NextResponse.json<ApiResponse>(
                { success: false, error: 'Email already registered' },
                { status: 409 }
            );
        }

        // Hash password and create user
        const hashedPassword = await hashPassword(password);
        const newUser: User = {
            id: generateId(),
            email,
            password: hashedPassword,
            name,
            role: role as User['role'],
            createdAt: new Date().toISOString(),
        };

        usersDb.create(newUser);

        // Return user without password
        const { password: _, ...userWithoutPassword } = newUser;

        return NextResponse.json<ApiResponse>(
            { success: true, data: userWithoutPassword, message: 'User registered successfully' },
            { status: 201 }
        );
    } catch (error) {
        console.error('Registration error:', error);
        return NextResponse.json<ApiResponse>(
            { success: false, error: 'Internal server error' },
            { status: 500 }
        );
    }
}
