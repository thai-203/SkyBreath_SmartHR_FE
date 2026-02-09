import { ToastProvider } from "@/components/common/Toast";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { Inter } from "next/font/google";
import "nprogress/nprogress.css";
import "./globals.css";

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
        <html lang="vi" suppressHydrationWarning>
            <body className={inter.className}>
                <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
                    <ToastProvider>
                        {children}
                        <Toaster />
                    </ToastProvider>
                </ThemeProvider>
            </body>
        </html>
    );
}
