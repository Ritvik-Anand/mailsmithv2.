'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { MobileSidebar } from './sidebar'
import { cn } from '@/lib/utils'

interface HeaderProps {
    isAdmin?: boolean
}

// Mock notifications - will be replaced with real data
const mockNotifications = [
    {
        id: '1',
        type: 'reply',
        title: 'New reply from John Doe',
        message: 'Thanks for reaching out! I would love to...',
        read: false,
        createdAt: '2 min ago',
    },
    {
        id: '2',
        type: 'campaign',
        title: 'Campaign completed',
        message: 'Q1 Outreach campaign has finished sending',
        read: false,
        createdAt: '1 hour ago',
    },
    {
        id: '3',
        type: 'system',
        title: 'New feature available',
        message: 'AI Reports are now available for Pro users',
        read: true,
        createdAt: '1 day ago',
    },
]

export function Header({ isAdmin = false }: HeaderProps) {
    const [notificationsOpen, setNotificationsOpen] = useState(false)
    const unreadCount = mockNotifications.filter((n) => !n.read).length

    return (
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 px-4 md:px-6">
            {/* Mobile Menu */}
            <MobileSidebar isAdmin={isAdmin} />

            {/* Search / Command Palette Trigger */}
            <div className="flex-1">
                <Button
                    variant="outline"
                    className="relative h-9 w-full justify-start text-sm text-muted-foreground sm:w-64 md:w-80"
                    onClick={() => {
                        // TODO: Open command palette
                        console.log('Open command palette')
                    }}
                >
                    <Search className="mr-2 h-4 w-4" />
                    <span className="hidden sm:inline-flex">Search...</span>
                    <kbd className="pointer-events-none absolute right-2 top-2 hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
                        <Command className="h-3 w-3" />K
                    </kbd>
                </Button>
            </div>

            {/* Right Side Actions */}
            <div className="flex items-center gap-2">
                {/* Notifications */}
                <Popover open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="relative">
                            <Bell className="h-5 w-5" />
                            {unreadCount > 0 && (
                                <Badge
                                    variant="destructive"
                                    className="absolute -right-1 -top-1 h-5 w-5 rounded-full p-0 text-xs flex items-center justify-center"
                                >
                                    {unreadCount}
                                </Badge>
                            )}
                            <span className="sr-only">Notifications</span>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-80 p-0" align="end">
                        <div className="flex items-center justify-between border-b p-4">
                            <h4 className="font-semibold">Notifications</h4>
                            <Button variant="ghost" size="sm" className="text-xs">
                                Mark all read
                            </Button>
                        </div>
                        <ScrollArea className="h-[300px]">
                            {mockNotifications.length === 0 ? (
                                <div className="flex h-full items-center justify-center p-4 text-sm text-muted-foreground">
                                    No notifications
                                </div>
                            ) : (
                                <div className="divide-y">
                                    {mockNotifications.map((notification) => (
                                        <div
                                            key={notification.id}
                                            className={cn(
                                                'flex gap-3 p-4 hover:bg-accent cursor-pointer transition-colors',
                                                !notification.read && 'bg-accent/50'
                                            )}
                                        >
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm font-medium">{notification.title}</p>
                                                <p className="text-xs text-muted-foreground line-clamp-2">
                                                    {notification.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground">
                                                    {notification.createdAt}
                                                </p>
                                            </div>
                                            {!notification.read && (
                                                <div className="h-2 w-2 rounded-full bg-primary mt-2" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </ScrollArea>
                        <div className="border-t p-2">
                            <Button variant="ghost" size="sm" className="w-full" asChild>
                                <Link href={isAdmin ? '/admin/notifications' : '/dashboard/notifications'}>
                                    View all notifications
                                </Link>
                            </Button>
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Help */}
                <Button variant="ghost" size="icon" asChild>
                    <Link href={isAdmin ? '/admin/support' : '/dashboard/support'}>
                        <HelpCircle className="h-5 w-5" />
                        <span className="sr-only">Help</span>
                    </Link>
                </Button>

                {/* User Menu */}
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                            <Avatar className="h-8 w-8 ring-2 ring-primary/20 transition-all hover:ring-primary/50">
                                <AvatarImage src="/avatars/admin.png" alt="Ritvik" />
                                <AvatarFallback className="bg-primary text-primary-foreground font-bold">R</AvatarFallback>
                            </Avatar>
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-56" align="end" forceMount>
                        <DropdownMenuLabel className="font-normal">
                            <div className="flex flex-col space-y-1">
                                <p className="text-sm font-semibold leading-none text-zinc-100">Ritvik</p>
                                <p className="text-xs leading-none text-muted-foreground">
                                    master.admin@acquifix.com
                                </p>
                            </div>
                        </DropdownMenuLabel>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-zinc-100">
                            <Link href="/admin/profile">
                                <User className="mr-2 h-4 w-4" />
                                Master Profile
                                <Badge className="ml-auto bg-primary/20 text-primary border-none text-[10px]">MASTER</Badge>
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem asChild className="focus:bg-zinc-800 focus:text-zinc-100">
                            <Link href="/admin/settings">
                                <Settings className="mr-2 h-4 w-4" />
                                System Settings
                            </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-zinc-800" />
                        <DropdownMenuItem className="text-rose-400 focus:text-rose-400 focus:bg-rose-400/10 cursor-pointer" onClick={() => {
                            document.cookie = "admin_access=; path=/; expires=Thu, 01 Jan 1970 00:00:01 GMT;";
                            window.location.href = "/admin/login";
                        }}>
                            <LogOut className="mr-2 h-4 w-4" />
                            Secure Logout
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    )
}
