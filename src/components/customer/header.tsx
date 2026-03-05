'use client'

import { useState } from 'react'
import { Bell, LogOut, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { CustomerMobileSidebar } from './sidebar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserWithRole } from '@/server/actions/roles'

interface CustomerHeaderProps {
    user: UserWithRole
}

export function CustomerHeader({ user }: CustomerHeaderProps) {
    const [isLoading, setIsLoading] = useState(false)

    const initials = user.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'U'

    const handleSignOut = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            await supabase.auth.signOut()

            // Clear any admin cookies too
            document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            document.cookie = "admin_name=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            document.cookie = "admin_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            document.cookie = "admin_email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"

            toast.success('Signed out successfully')

            // Force hard redirect to login
            window.location.href = '/login'
        } catch (error) {
            console.error('Sign out failed:', error)
            toast.error('Failed to sign out')
            window.location.reload()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <header className="sticky top-0 z-40 border-b border-foreground/5 bg-background/50 backdrop-blur-xl">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* Mobile sidebar trigger */}
                <CustomerMobileSidebar user={user} />

                {/* Page title placeholder - can be filled by child pages */}
                <div className="flex-1" />

                {/* Right side actions */}
                <div className="flex items-center gap-4">
                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative text-foreground/60 hover:text-foreground hover:bg-foreground/5"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-foreground">
                            3
                        </span>
                        <span className="sr-only">Notifications</span>
                    </Button>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 px-2 hover:bg-foreground/5"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt={user.fullName || 'User'} />
                                    <AvatarFallback className="bg-primary/20 text-primary text-sm">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden md:block text-sm font-medium text-foreground">
                                    {user.fullName || user.email}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56 bg-background/95 border-foreground/10">
                            <DropdownMenuLabel className="text-foreground/60">
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium text-foreground">{user.fullName || 'User'}</p>
                                    <p className="text-xs text-foreground/40">{user.email}</p>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator className="bg-foreground/10" />
                            <DropdownMenuItem className="text-foreground/80 focus:bg-foreground/5 focus:text-foreground cursor-pointer">
                                Profile Settings
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-foreground/80 focus:bg-foreground/5 focus:text-foreground cursor-pointer">
                                Notification Preferences
                            </DropdownMenuItem>
                            <DropdownMenuSeparator className="bg-foreground/10" />
                            <DropdownMenuItem
                                onClick={handleSignOut}
                                disabled={isLoading}
                                className="text-red-400 focus:bg-foreground/5 focus:text-red-300 cursor-pointer"
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Signing out...
                                    </>
                                ) : (
                                    <>
                                        <LogOut className="mr-2 h-4 w-4" />
                                        Sign out
                                    </>
                                )}
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </header>
    )
}
