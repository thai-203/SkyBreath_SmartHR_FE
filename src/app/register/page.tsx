'use client';

import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useState } from 'react';
import '../login/login.css';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        confirmPassword: '',
    });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');

        if (formData.password !== formData.confirmPassword) {
            setError('Mật khẩu không khớp');
            return;
        }

        if (formData.password.length < 6) {
            setError('Mật khẩu phải có ít nhất 6 ký tự');
            return;
        }

        setLoading(true);

        try {
            const response = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: formData.name,
                    email: formData.email,
                    password: formData.password,
                }),
            });

            const data = await response.json();

            if (data.success) {
                router.push('/login');
            } else {
                setError(data.error || 'Đăng ký thất bại');
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
                    <h1>Đăng ký</h1>
                    <p>Tạo tài khoản mới để bắt đầu sử dụng hệ thống.</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    {error && <div className="error-message">{error}</div>}

                    <Input
                        label="Họ và tên"
                        type="text"
                        id="name"
                        placeholder="Nguyễn Văn A"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        required
                        fullWidth
                    />

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

                    <Input
                        label="Xác nhận mật khẩu"
                        type="password"
                        id="confirmPassword"
                        placeholder="••••••••"
                        value={formData.confirmPassword}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        required
                        fullWidth
                    />

                    <Button type="submit" fullWidth disabled={loading}>
                        {loading ? 'Đang đăng ký...' : 'Đăng ký'}
                    </Button>
                </form>

                <div className="auth-footer">
                    <p>
                        Đã có tài khoản?{' '}
                        <Link href="/login" className="auth-link">
                            Đăng nhập ngay
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}
