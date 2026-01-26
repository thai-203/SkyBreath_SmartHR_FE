import type { User } from '@/types';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const SALT_ROUNDS = 10;

// Hash password
export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
}

// Verify password
export async function verifyPassword(password: string, hashedPassword: string): Promise<boolean> {
    return bcrypt.compare(password, hashedPassword);
}

// Generate JWT token
export function generateToken(user: Omit<User, 'password'>): string {
    return jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role
        },
        JWT_SECRET,
        { expiresIn: '7d' }
    );
}

// Verify JWT token
export function verifyToken(token: string): any {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

// Extract token from Authorization header
export function extractToken(authHeader: string | null): string | null {
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return null;
    }
    return authHeader.substring(7);
}

// Middleware to check authentication
export function requireAuth(authHeader: string | null): { authenticated: boolean; user?: any; error?: string } {
    const token = extractToken(authHeader);

    if (!token) {
        return { authenticated: false, error: 'No token provided' };
    }

    const decoded = verifyToken(token);

    if (!decoded) {
        return { authenticated: false, error: 'Invalid or expired token' };
    }

    return { authenticated: true, user: decoded };
}
