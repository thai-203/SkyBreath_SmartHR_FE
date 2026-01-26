'use client';

import { getStoredUser, removeAuthToken, removeStoredUser } from '@/lib/utils';
import { useRouter } from 'next/navigation';
import './Navbar.css';

export default function Navbar() {
    const router = useRouter();
    const user = getStoredUser();

    const handleLogout = () => {
        removeAuthToken();
        removeStoredUser();
        router.push('/login');
    };

    return (
        <nav className="navbar">
            <div className="navbar-container">
                <div className="navbar-brand">
                    <h2>HRM System</h2>
                </div>

                <div className="navbar-menu">
                    <div className="navbar-user">
                        <div className="user-avatar">
                            {user?.name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <div className="user-info">
                            <span className="user-name">{user?.name || 'User'}</span>
                            <span className="user-role">{user?.role || 'employee'}</span>
                        </div>
                    </div>

                    <button className="btn-logout" onClick={handleLogout}>
                        Đăng xuất
                    </button>
                </div>
            </div>
        </nav>
    );
}
