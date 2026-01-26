'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './Sidebar.css';

const menuItems = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/employees', label: 'Nhân viên', icon: '👥' },
    { href: '/dashboard/departments', label: 'Phòng ban', icon: '🏢' },
    { href: '/dashboard/leaves', label: 'Nghỉ phép', icon: '📅' },
    { href: '/dashboard/attendance', label: 'Chấm công', icon: '⏰' },
];

export default function Sidebar() {
    const pathname = usePathname();

    return (
        <aside className="sidebar">
            <nav className="sidebar-nav">
                {menuItems.map((item) => {
                    const isActive = pathname === item.href;
                    return (
                        <Link
                            key={item.href}
                            href={item.href}
                            className={`sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
                        >
                            <span className="sidebar-icon">{item.icon}</span>
                            <span className="sidebar-label">{item.label}</span>
                        </Link>
                    );
                })}
            </nav>
        </aside>
    );
}
