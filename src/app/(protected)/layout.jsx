import AdminLayout from "@/components/layout/AdminLayout";

export const metadata = {
    title: "Dashboard",
};

export default function Layout({ children }) {
    return <AdminLayout>{children}</AdminLayout>;
}
