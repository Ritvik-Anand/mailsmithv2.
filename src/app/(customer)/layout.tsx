import { requireCustomer } from '@/server/actions/roles'
import { CustomerSidebar } from '@/components/customer/sidebar'
import { CustomerHeader } from '@/components/customer/header'

export default async function CustomerPortalLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Verify the user is a customer (or operator/admin previewing)
    const user = await requireCustomer()

    return (
        <div className="flex h-screen overflow-hidden bg-[#030303]">
            {/* Customer Sidebar */}
            <CustomerSidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Customer Header */}
                <CustomerHeader user={user} />

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
