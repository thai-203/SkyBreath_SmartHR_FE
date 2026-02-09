import CreateRoleForm from '@/components/roles/create-role-form';

export default function CreateRolePage() {
    return (
        <div className="container mx-auto py-10">
            <h1 className="text-3xl font-bold mb-8 text-gray-800">Role Management</h1>
            <CreateRoleForm />
        </div>
    );
}
