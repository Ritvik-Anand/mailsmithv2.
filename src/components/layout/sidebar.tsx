'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
    LayoutDashboard,
    Mail,
    Users,
    MessageSquare,
    Settings,
    Bell,
    Menu,
    ChevronLeft,
    Zap,
    Shield,
} from 'lucide-react'

interface SidebarProps {
    isAdmin?: boolean
}

const customerNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
    },
    {
        title: 'Campaigns',
        href: '/dashboard/campaigns',
        icon: Mail,
    },
    {
        title: 'Leads',
        href: '/dashboard/leads',
        icon: Users,
    },
    {
        title: 'Intelligence',
        href: '/dashboard/notifications',
        icon: Bell,
    },
    {
        title: 'Support',
        href: '/dashboard/support',
        icon: MessageSquare,
    },
    {
        title: 'Settings',
        href: '/dashboard/settings',
        icon: Settings,
    },
]

const adminNavItems = [
    {
        title: 'Dashboard',
        href: '/admin',
        icon: LayoutDashboard,
    },
    {
        title: 'Customers',
        href: '/admin/customers',
        icon: Users,
    },
    {
        title: 'Internal Team',
        href: '/admin/team',
        icon: Shield,
    },
    {
        title: 'Support Queue',
        href: '/admin/support',
        icon: MessageSquare,
    },
    {
        title: 'Notifications',
        href: '/admin/notifications',
        icon: Bell,
    },
    {
        title: 'Settings',
        href: '/admin/settings',
        icon: Settings,
    },
]

export function Sidebar({ isAdmin = false }: SidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)
    const navItems = isAdmin ? adminNavItems : customerNavItems

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-r bg-card transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-4">
                <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
                        <Image
                            src="/logo.png"
                            alt="MailSmith Logo"
                            width={32}
                            height={32}
                            className="object-contain p-1"
                        />
                    </div>
                    {!collapsed && (
                        <span className="font-semibold text-lg">
                            MailSmith {isAdmin && <span className="text-xs text-muted-foreground">Admin</span>}
                        </span>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive = item.href === '/admin' || item.href === '/dashboard'
                            ? pathname === item.href
                            : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-primary text-primary-foreground'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Collapse Toggle */}
            <div className="border-t p-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeft
                        className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
                    />
                    {!collapsed && <span className="ml-2">Collapse</span>}
                </Button>
            </div>
        </aside>
    )
}

export function MobileSidebar({ isAdmin = false }: SidebarProps) {
    const pathname = usePathname()
    const navItems = isAdmin ? adminNavItems : customerNavItems

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-64 p-0">
                <div className="flex h-16 items-center border-b px-4">
                    <Link href={isAdmin ? '/admin' : '/dashboard'} className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="MailSmith Logo"
                                width={32}
                                height={32}
                                className="object-contain p-1"
                            />
                        </div>
                        <span className="font-semibold text-lg">MailSmith</span>
                    </Link>
                </div>
                <ScrollArea className="flex-1 py-4">
                    <nav className="space-y-1 px-2">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                    )}
                                >
                                    <item.icon className="h-4 w-4" />
                                    <span>{item.title}</span>
                                </Link>
                            )
                        })}
                    </nav>
                </ScrollArea>
            </SheetContent>
        </Sheet>
    )
}
