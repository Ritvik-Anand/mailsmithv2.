import { requireOperator } from '@/server/actions/roles'
import { OperatorSidebar } from '@/components/operator/sidebar'
import { OperatorHeader } from '@/components/operator/header'

export default async function OperatorLayout({
    children,
}: {
    children: React.ReactNode
}) {
    // Verify the user is an operator or super_admin
    const user = await requireOperator()

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* Operator Sidebar */}
            <OperatorSidebar user={user} />

            {/* Main Content */}
            <div className="flex flex-1 flex-col overflow-hidden">
                {/* Operator Header with Customer Switcher */}
                <OperatorHeader user={user} />

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
