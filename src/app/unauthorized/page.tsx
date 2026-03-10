'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ShieldX, ArrowLeft, Home, LogOut } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

export default function UnauthorizedPage() {
    const supabase = createClient()
    const router = useRouter()

    const handleSignOut = async () => {
        await supabase.auth.signOut()
        window.location.href = '/'
    }

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
                        You don't have permission to access this page. This may happen if you're logged in with an account that hasn't been fully set up yet.
                    </p>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-3 justify-center">
                    <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button variant="outline" asChild className="flex-1">
                            <Link href="/">
                                <Home className="mr-2 h-4 w-4" />
                                Home Page
                            </Link>
                        </Button>
                        <Button onClick={handleSignOut} variant="destructive" className="flex-1">
                            <LogOut className="mr-2 h-4 w-4" />
                            Sign Out
                        </Button>
                    </div>

                    <p className="text-xs text-muted-foreground mt-4">
                        Signed in as a different user? <strong>Sign Out</strong> above to switch accounts.
                    </p>
                </div>

                {/* Help text */}
                <p className="text-sm text-muted-foreground pt-4 border-t border-border/50">
                    Need help?{' '}
                    <Link href="mailto:support@mailsmith.com" className="text-primary hover:underline">
                        Contact support
                    </Link>
                </p>
            </div>
        </div>
    )
}
