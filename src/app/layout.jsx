import "./globals.css";
import "nprogress/nprogress.css";
import { Inter } from "next/font/google";
import { ToastProvider } from "@/components/common/Toast";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
    title: {
        default: "SmartHR - Hệ thống quản lý nhân sự",
        template: "%s | SmartHR",
    },
    description: "Hệ thống quản lý nhân sự thông minh cho doanh nghiệp",
    keywords: ["HR", "Human Resources", "Nhân sự", "Quản lý nhân viên"],
};

export default function RootLayout({ children }) {
    return (
        <html lang="vi">
            <body className={inter.className}>
                <ToastProvider>
                    {children}
                </ToastProvider>
            </body>
        </html>
    );
}
