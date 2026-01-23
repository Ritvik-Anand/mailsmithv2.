'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
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
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import {
    Bell,
    Search,
    LogOut,
    User,
    Settings,
    HelpCircle,
    Command,
    ShieldCheck,
    Lock,
    Clock,
    Megaphone,
    ArrowRight,
    Zap
} from 'lucide-react'
import { MobileSidebar } from './sidebar'
import { cn } from '@/lib/utils'
import { getNotifications, markNotificationAsRead } from '@/server/actions/notifications'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types'
import { toast } from 'sonner'

interface HeaderProps {
    isAdmin?: boolean
}

function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + " years ago"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + " months ago"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + " days ago"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + " hours ago"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + " mins ago"
    return "just now"
}

export function Header({ isAdmin = false }: HeaderProps) {
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(false)
    const [user, setUser] = useState<{ email?: string; name?: string; role?: string } | null>(null)

    const fetchNotifications = async () => {
        const data = await getNotifications()
        setNotifications(data)
    }

    const fetchUser = async () => {
        // If we are in admin mode, check for admin session cookies first
        if (isAdmin) {
            const cookies = document.cookie.split('; ')
            const adminName = cookies.find(c => c.startsWith('admin_name='))?.split('=')[1]
            const adminRole = cookies.find(c => c.startsWith('admin_role='))?.split('=')[1]
            const adminEmail = cookies.find(c => c.startsWith('admin_email='))?.split('=')[1] // We should add this too

            if (adminName) {
                setUser({
                    name: decodeURIComponent(adminName),
                    role: adminRole as any,
                    email: adminEmail ? decodeURIComponent(adminEmail) : 'admin@acquifix.com'
                } as any)
                return
            }
        }

        const supabase = createClient()
        const { data: { user } } = await supabase.auth.getUser()
        if (user) {
            setUser({
                email: user.email,
                name: user.user_metadata?.full_name || user.email?.split('@')[0]
            })
        }
    }

    useEffect(() => {
        fetchNotifications()
        fetchUser()
    }, [])

    const unreadCount = notifications.filter((n) => !n.read).length

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        } catch (error) {
            console.error(error)
        }
    }

    const handleLogout = async () => {
        setIsLoading(true)
        try {
            // 1. Handle Supabase Logout
            const supabase = createClient()
            await supabase.auth.signOut()

            // 2. Clear Admin Cookie (if present)
            document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"

            // 3. Clear all potential Supabase cookies by refreshing
            toast.success('Secure session terminated.')

            // 4. Force hard redirect to home
            window.location.href = '/'
        } catch (error) {
            console.error('Logout failed:', error)
            window.location.reload()
        } finally {
            setIsLoading(false)
        }
    }

    const handleMarkAllAsRead = async () => {
        const unreadIds = notifications.filter(n => !n.read).map(n => n.id)
        if (unreadIds.length === 0) return

        try {
            await Promise.all(unreadIds.map(id => markNotificationAsRead(id)))
            setNotifications(prev => prev.map(n => ({ ...n, read: true })))
        } catch (error) {
            console.error(error)
        }
    }

    return (
        <header className={cn(
            "sticky top-0 z-50 flex h-16 items-center justify-between gap-4 border-b border-zinc-900/50 px-6 backdrop-blur-md transition-all duration-300",
            isAdmin ? "bg-black/90" : "bg-zinc-950/90"
        )}>
            <div className="flex items-center gap-4">
                <MobileSidebar isAdmin={isAdmin} />

                <div className="relative group hidden sm:block">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                    </div>
                    <Input
                        placeholder="Search..."
                        className="pl-10 h-10 w-64 md:w-80 bg-zinc-900/40 border-zinc-800/60 text-xs text-white placeholder:text-zinc-600 focus:ring-1 focus:ring-primary focus:border-primary transition-all rounded-lg"
                    />
                    <kbd className="pointer-events-none absolute right-2.5 top-2.5 hidden h-5 select-none items-center gap-1 rounded bg-zinc-950 border border-zinc-900 px-1.5 font-mono text-[9px] font-medium text-zinc-600 opacity-100 sm:flex">
                        <Command className="h-2.5 w-2.5" />K
                    </kbd>
                </div>
            </div>

            <div className="flex items-center gap-2 md:gap-4">
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <span className="absolute right-2 top-2 flex h-2 w-2 rounded-full bg-primary" />
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="flex items-center justify-between border-b px-4 py-2">
                            <h4 className="text-sm font-semibold">Notifications</h4>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="text-xs"
                                onClick={handleMarkAllAsRead}
                                disabled={unreadCount === 0}
                            >
                                Mark all as read
                            </Button>
                        </div>
                        <ScrollArea className="h-80">
                            {notifications.length === 0 ? (
                                <div className="flex flex-col items-center justify-center h-40 text-center p-6 text-muted-foreground">
                                    <Bell className="h-8 w-8 mb-2 opacity-20" />
                                    <p className="text-xs">No notifications at this time.</p>
                                </div>
                            ) : (
                                notifications.map((notification) => (
                                    <div
                                        key={notification.id}
                                        onClick={() => {
                                            if (!notification.read) handleMarkAsRead(notification.id)
                                        }}
                                        className={cn(
                                            "flex flex-col gap-1 border-b px-4 py-3 last:border-0 hover:bg-muted/50 transition-all cursor-pointer relative",
                                            !notification.read && "bg-primary/5 border-l-2 border-l-primary"
                                        )}
                                    >
                                        <div className="flex items-center justify-between gap-2">
                                            <div className="flex items-center gap-2">
                                                {!!notification.metadata?.broadcast && (
                                                    <Megaphone className="h-3 w-3 text-primary animate-pulse" />
                                                )}
                                                <span className={cn(
                                                    "text-sm",
                                                    !notification.read ? "font-semibold text-foreground" : "font-medium text-muted-foreground"
                                                )}>
                                                    {notification.title}
                                                </span>
                                            </div>
                                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                                                {timeAgo(notification.created_at)}
                                            </span>
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                                            {notification.message}
                                        </p>

                                        {!notification.read && (
                                            <div className="absolute right-2 bottom-2">
                                                <div className="h-1.5 w-1.5 rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]" />
                                            </div>
                                        )}
                                    </div>
                                ))
                            )}
                        </ScrollArea>
                        <div className="p-2 border-t text-center">
                            <Link
                                href={isAdmin ? "/admin-console/notifications" : "/portal/notifications"}
                                className="text-[10px] text-muted-foreground hover:text-primary uppercase tracking-wider font-semibold flex items-center justify-center gap-1 group"
                                onClick={() => setNotificationsOpen(false)}
                            >
                                View All Notifications
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                    <Link href={isAdmin ? "/admin-console/support" : "/portal/support"}>
                        <HelpCircle className="h-5 w-5" />
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8 border border-zinc-800">
                                <AvatarFallback className="bg-zinc-800 text-zinc-400 uppercase">
                                    {user?.name?.substring(0, 2) || (isAdmin ? 'RA' : 'U')}
                                </AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none">
                                    {isAdmin ? `${user?.name || 'Ritvik'} (Admin)` : (user?.name || 'User')}
                                </p>
                                <p className="text-[10px] leading-none text-muted-foreground">
                                    {user?.email || 'user@example.com'}
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild className="cursor-pointer">
                            {isAdmin || user?.role === 'operator' ? (
                                <Link href="/operator" className="flex items-center w-full">
                                    <Zap className="mr-2 h-4 w-4 text-primary" />
                                    <span>Operator Portal</span>
                                </Link>
                            ) : null}
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={isAdmin ? "/admin-console/team" : "/portal/settings"} className="flex items-center w-full">
                                <User className="mr-2 h-4 w-4" />
                                <span>{isAdmin ? 'Team Profile' : 'Profile'}</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="cursor-pointer">
                            <Link href={isAdmin ? "/admin-console/settings" : "/portal/settings"} className="flex items-center w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Settings</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={handleLogout}
                            className="text-rose-400 hover:text-rose-100 hover:bg-rose-500/20 cursor-pointer font-bold"
                        >
                            <LogOut className="mr-2 h-4 w-4" />
                            <span>Secure Logout</span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}

