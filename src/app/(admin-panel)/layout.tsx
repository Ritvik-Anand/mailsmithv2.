import { requireSuperAdmin } from '@/server/actions/roles'
import { AdminSidebar } from '@/components/admin/sidebar'
import { Header } from '@/components/layout/header'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // This will redirect to /admin if not authenticated or not a super_admin
    await requireSuperAdmin()

    return (
        <div className="flex h-screen overflow-hidden bg-[#0a0a0a]">
            {/* Minimal Admin Sidebar */}
            <AdminSidebar />

            {/* Main Content Area */}
            <div className="flex flex-1 flex-col overflow-hidden bg-black">
                {/* Admin Header */}
                <Header isAdmin />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto relative">
                    <div className="container py-8 px-6 md:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
