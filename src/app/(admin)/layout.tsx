import { cookies } from 'next/headers'
import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { AdminLogin } from '@/components/admin/admin-login'
import { SessionTracker } from '@/components/admin/session-tracker'

export default async function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const cookieStore = await cookies()
    const isAdminAuthenticated = cookieStore.has('admin_access')
    const lastActive = cookieStore.get('admin_last_active')?.value

    const TIMEOUT_DURATION = 15 * 60 * 1000 // 15 minutes
    const isSessionExpired = lastActive ? (Date.now() - parseInt(lastActive) > TIMEOUT_DURATION) : true

    if (!isAdminAuthenticated || isSessionExpired) {
        return <AdminLogin />
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            <SessionTracker />
            {/* Admin Sidebar */}
            <Sidebar isAdmin />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Admin Header */}
                <Header isAdmin />

                {/* Page Content */}
                <main className="flex-1 overflow-y-auto">
                    <div className="container py-6 px-4 md:px-6 lg:px-8">
                        {children}
                    </div>
                </main>
            </div>
        </div>
    )
}
