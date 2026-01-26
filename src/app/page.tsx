'use client';

import { getAuthToken } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function HomePage() {
    const router = useRouter();

    useEffect(() => {
        const token = getAuthToken();
        if (token) {
            router.push('/dashboard');
        } else {
            router.push('/login');
        }
    }, [router]);

    return (
        <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
            background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
            color: 'white'
        }}>
            <h1>Đang tải...</h1>
        </div>
    );
}
