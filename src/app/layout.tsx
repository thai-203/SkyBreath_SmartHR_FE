import './globals.css';

export const metadata = {
    title: 'HRM System - Quản lý Nhân sự',
    description: 'Hệ thống quản lý nhân sự toàn diện',
};

export default function RootLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <html lang="vi">
            <body>{children}</body>
        </html>
    );
}
