import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft, Home } from 'lucide-react'

export default function UnauthorizedPage() {
    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <div className="text-center space-y-6 max-w-md">
                {/* Icon */}
                <div className="flex justify-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-full bg-destructive/10">
                        <ShieldX className="h-10 w-10 text-destructive" />
                    </div>
                </div>

                {/* Message */}
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold">Access Denied</h1>
                    <p className="text-muted-foreground">
                        You don't have permission to access this page. If you believe this is an error,
                        please contact your account administrator.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <Button variant="outline" asChild>
                        <Link href="javascript:history.back()">
                            <ArrowLeft className="mr-2 h-4 w-4" />
                            Go Back
                        </Link>
                    </Button>
                    <Button asChild>
                        <Link href="/">
                            <Home className="mr-2 h-4 w-4" />
                            Home
                        </Link>
                    </Button>
                </div>

                {/* Help text */}
                <p className="text-sm text-muted-foreground">
                    Need help?{' '}
                    <Link href="/support" className="text-primary hover:underline">
                        Contact support
                    </Link>
                </p>
            </div>
        </div>
    )
}
