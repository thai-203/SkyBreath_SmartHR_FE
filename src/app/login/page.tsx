'use client';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import { setAuthToken, setStoredUser } from '@/lib/utils';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import './login.css';

export default function LoginPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (data.success) {
                setAuthToken(data.data.token);
                setStoredUser(data.data.user);
                router.push('/dashboard');
            } else {
                setError(data.error || 'Đăng nhập thất bại');
            }
        } catch (err) {
            setError('Lỗi kết nối. Vui lòng thử lại.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-header">
                    <h1>Đăng nhập</h1>
                    <p>Chào mừng trở lại! Vui lòng đăng nhập để tiếp tục.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <Input
                        label="Email"
                        type="email"
                        id="email"
                        placeholder="your@email.com"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        required
                        fullWidth
                    />

                    <Input
                        label="Mật khẩu"
                        type="password"
                        id="password"
                        placeholder="••••••••"
                        value={formData.password}
                        onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                        required
                        fullWidth
                    />

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>
                        Chưa có tài khoản?{' '}
                        <Link href="/register" className="auth-link">
                            Đăng ký ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
