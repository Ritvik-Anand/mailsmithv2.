'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
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
    ArrowRight
} from 'lucide-react'
import { MobileSidebar } from './sidebar'
import { cn } from '@/lib/utils'
import { getNotifications, markNotificationAsRead } from '@/server/actions/notifications'
import { Notification } from '@/types'

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

    const fetchNotifications = async () => {
        const data = await getNotifications()
        setNotifications(data)
    }

    useEffect(() => {
        fetchNotifications()
        // In a real app, you'd set up a Supabase Realtime subscription here
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

    const handleLogout = () => {
        document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;"
        window.location.reload()
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
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            <MobileSidebar isAdmin={isAdmin} />

            <div className="flex-1">
                <Button
                    variant="outline"
                    className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 md:w-80"
                >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline-flex">Search...</span>
                    <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <Command className="h-3 w-3" />K
                    </kbd>
                </Button>
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
                                <div className="flex flex-col items-center justify-center h-40 text-center p-6">
                                    <Bell className="h-8 w-8 text-zinc-800 mb-2" />
                                    <p className="text-xs text-zinc-500 italic">No intelligence reports currently available.</p>
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
                                                    !notification.read ? "font-bold text-zinc-100 italic" : "font-medium text-zinc-400"
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
                                href={isAdmin ? "/admin/notifications" : "/dashboard/notifications"}
                                className="text-[10px] text-zinc-500 hover:text-primary uppercase tracking-widest font-black flex items-center justify-center gap-1 group"
                                onClick={() => setNotificationsOpen(false)}
                            >
                                View Global Intelligence
                                <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                            </Link>
                        </div>
                    </PopoverContent>
                </Popover>

                <Button variant="ghost" size="icon" className="hidden md:flex" asChild>
                    <Link href={isAdmin ? "/admin/support" : "/dashboard/support"}>
                        <HelpCircle className="h-5 w-5" />
                    </Link>
                </Button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8 border border-zinc-800">
                                <AvatarImage src="https://github.com/ritvikanand.png" alt="Ritvik" />
                                <AvatarFallback className="bg-zinc-800 text-zinc-400">RA</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56 bg-zinc-900 border-zinc-800" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-zinc-100 italic">
                                    {isAdmin ? 'Ritvik (Master Root)' : 'Ritvik'}
                                </p>
                                <p className="text-[10px] leading-none text-zinc-500 font-mono">
                                    ritvik@acquifix.com
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem asChild className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer">
                            <Link href="/admin/team" className="flex items-center w-full">
                                <User className="mr-2 h-4 w-4" />
                                <span>System Profile</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800 cursor-pointer">
                            <Link href="/admin/settings" className="flex items-center w-full">
                                <Settings className="mr-2 h-4 w-4" />
                                <span>Preferences</span>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
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
