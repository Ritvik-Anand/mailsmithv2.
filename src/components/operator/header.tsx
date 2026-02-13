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
import { Badge } from '@/components/ui/badge'
import { OperatorMobileSidebar } from './sidebar'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'
import type { UserWithRole } from '@/server/actions/roles'

interface OperatorHeaderProps {
    user: UserWithRole
}

export function OperatorHeader({ user }: OperatorHeaderProps) {
    const [isLoading, setIsLoading] = useState(false)

    const initials = user.fullName
        ? user.fullName.split(' ').map(n => n[0]).join('').toUpperCase()
        : user.email?.substring(0, 2).toUpperCase() || 'O'

    const handleSignOut = async () => {
        setIsLoading(true)
        try {
            const supabase = createClient()
            await supabase.auth.signOut()

            // Clear all admin/operator cookies
            document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            document.cookie = "admin_name=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            document.cookie = "admin_role=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
            document.cookie = "admin_email=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"

            toast.success('Signed out successfully')

            // Force redirect to admin login
            window.location.href = '/admin'
        } catch (error) {
            console.error('Sign out failed:', error)
            toast.error('Failed to sign out')
            window.location.reload()
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
            <div className="flex h-16 items-center justify-between px-4 md:px-6">
                {/* Mobile sidebar trigger */}
                <OperatorMobileSidebar user={user} />

                {/* Right side actions */}
                <div className="flex items-center gap-4">
                    {/* Task Counter Badge */}
                    <Button variant="outline" size="sm" className="hidden md:flex gap-2">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-amber-500 text-[10px] font-bold text-white">
                            5
                        </span>
                        <span>Pending Tasks</span>
                    </Button>

                    {/* Notifications */}
                    <Button
                        variant="ghost"
                        size="icon"
                        className="relative"
                    >
                        <Bell className="h-5 w-5" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white">
                            2
                        </span>
                        <span className="sr-only">Notifications</span>
                    </Button>

                    {/* User menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="flex items-center gap-2 px-2"
                            >
                                <Avatar className="h-8 w-8">
                                    <AvatarImage src="" alt={user.fullName || 'Operator'} />
                                    <AvatarFallback className="bg-amber-500/20 text-amber-600">
                                        {initials}
                                    </AvatarFallback>
                                </Avatar>
                                <span className="hidden md:block text-sm font-medium">
                                    {user.fullName || user.email}
                                </span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-56">
                            <DropdownMenuLabel>
                                <div className="flex flex-col space-y-1">
                                    <p className="text-sm font-medium">{user.fullName || 'Operator'}</p>
                                    <p className="text-xs text-muted-foreground">{user.email}</p>
                                    <Badge variant="outline" className="w-fit mt-1 text-amber-600 border-amber-600">
                                        {user.role}
                                    </Badge>
                                </div>
                            </DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>My Profile</DropdownMenuItem>
                            <DropdownMenuItem>Preferences</DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onClick={handleSignOut}
                                disabled={isLoading}
                                className="text-red-600 cursor-pointer"
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

