'use client';

import Navbar from '@/components/layout/Navbar';
import Sidebar from '@/components/layout/Sidebar';
import { getAuthToken } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';
import './dashboard.css';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();

    useEffect(() => {
        const token = getAuthToken();
        if (!token) {
            router.push('/login');
        }
    }, [router]);

    return (
        <div className="dashboard-layout">
            <Navbar />
            <div className="dashboard-container">
                <Sidebar />
                <main className="dashboard-main">{children}</main>
            </div>
        </div>
    );
}
