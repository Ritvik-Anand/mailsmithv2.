import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'
import { syncUserOnboarding } from '@/server/actions/onboarding'
import { redirect } from 'next/navigation'

export default async function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Sync onboarding data on load
    const result = await syncUserOnboarding()

    // If sync failed significantly (e.g. not authenticated), redirect to login
    // Note: middleware already handles this, but this is a double check
    if (!result.success && result.error === 'Not authenticated') {
        redirect('/login')
    }

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Sidebar */}
            <Sidebar />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Header */}
                <Header />

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
