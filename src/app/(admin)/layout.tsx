import { Sidebar } from '@/components/layout/sidebar'
import { Header } from '@/components/layout/header'

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div className="flex h-screen overflow-hidden bg-background">
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
