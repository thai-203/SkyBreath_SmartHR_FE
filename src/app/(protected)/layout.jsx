import AdminLayout from "@/components/layout/AdminLayout";
import AssistantChatbot from "@/components/chat/AssistantChatbot";

export const metadata = {
    title: "Dashboard",
};

export default function Layout({ children  }) {
    return (
        <>
            <AdminLayout>
                {children}
            </AdminLayout>
            <AssistantChatbot />
        </>
    );
}
