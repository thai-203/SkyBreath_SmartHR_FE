import { differenceInDays, format, parseISO } from 'date-fns';

// Format date to readable string
export function formatDate(date: string | Date, formatStr: string = 'dd/MM/yyyy'): string {
    const dateObj = typeof date === 'string' ? parseISO(date) : date;
    return format(dateObj, formatStr);
}

// Calculate days between dates
export function calculateDays(startDate: string, endDate: string): number {
    return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
}

// Generate unique ID
export function generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// Validate email
export function isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Format currency (VND)
export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND'
    }).format(amount);
}

// Calculate work hours
export function calculateWorkHours(checkIn: string, checkOut: string): number {
    const checkInTime = new Date(checkIn);
    const checkOutTime = new Date(checkOut);
    const diffMs = checkOutTime.getTime() - checkInTime.getTime();
    return Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10; // Round to 1 decimal
}

// API client helper
export async function apiClient<T = any>(
    url: string,
    options?: RequestInit
): Promise<{ success: boolean; data?: T; error?: string }> {
    try {
        const response = await fetch(url, {
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        const data = await response.json();

        if (!response.ok) {
            return { success: false, error: data.error || 'Request failed' };
        }

        return { success: true, data };
    } catch (error) {
        return { success: false, error: 'Network error' };
    }
}

// Get token from localStorage (client-side only)
export function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('authToken');
}

// Set token to localStorage (client-side only)
export function setAuthToken(token: string): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('authToken', token);
}

// Remove token from localStorage (client-side only)
export function removeAuthToken(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('authToken');
}

// Get user from localStorage (client-side only)
export function getStoredUser(): any {
    if (typeof window === 'undefined') return null;
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
}

// Set user to localStorage (client-side only)
export function setStoredUser(user: any): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem('user', JSON.stringify(user));
}

// Remove user from localStorage (client-side only)
export function removeStoredUser(): void {
    if (typeof window === 'undefined') return;
    localStorage.removeItem('user');
}
