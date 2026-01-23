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
    Users,
    Mail,
    Inbox,
    ClipboardList,
    Target,
    Settings,
    Menu,
    ChevronLeft,
    Zap,
    Shield,
} from 'lucide-react'
import type { UserWithRole } from '@/server/actions/roles'

interface OperatorSidebarProps {
    user: UserWithRole
}

const navItems = [
    {
        title: 'Dashboard',
        href: '/operator',
        icon: LayoutDashboard,
    },
    {
        title: 'My Customers',
        href: '/operator/customers',
        icon: Users,
    },
    {
        title: 'Lead Scraper',
        href: '/operator/scraper',
        icon: Target,
    },
    {
        title: 'Scrape Jobs',
        href: '/operator/jobs',
        icon: ClipboardList,
    },
    {
        title: 'Campaigns',
        href: '/operator/campaigns',
        icon: Mail,
    },
    {
        title: 'Settings',
        href: '/operator/settings',
        icon: Settings,
    },
]

export function OperatorSidebar({ user }: OperatorSidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-r bg-card transition-all duration-300',
                collapsed ? 'w-16' : 'w-64'
            )}
        >
            {/* Logo */}
            <div className="flex h-16 items-center border-b px-4">
                <Link href="/operator" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 overflow-hidden">
                        <Zap className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-semibold text-lg">MailSmith</span>
                            <span className="text-xs text-amber-500">Operator Console</span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-4">
                <nav className="space-y-1 px-2">
                    {navItems.map((item) => {
                        const isActive = item.href === '/operator'
                            ? pathname === item.href
                            : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                                    isActive
                                        ? 'bg-amber-500 text-white'
                                        : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                                )}
                            >
                                <item.icon className="h-4 w-4 shrink-0" />
                                {!collapsed && <span>{item.title}</span>}
                            </Link>
                        )
                    })}

                    {/* Admin Switcher for Super Admins */}
                    {user.role === 'super_admin' && (
                        <div className="mt-4 pt-4 border-t border-border">
                            <Link
                                href="/admin-console"
                                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-primary hover:bg-primary/10 transition-colors"
                            >
                                <Shield className="h-4 w-4 shrink-0" />
                                {!collapsed && <span>Admin Console</span>}
                            </Link>
                        </div>
                    )}
                </nav>
            </ScrollArea>

            {/* User Info */}
            <div className="border-t p-4">
                {!collapsed && (
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-500/10 text-amber-500 text-sm font-medium">
                            {user.fullName?.charAt(0) || user.email?.charAt(0) || 'O'}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{user.fullName || 'Operator'}</p>
                            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                        </div>
                    </div>
                )}
            </div>

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

export function OperatorMobileSidebar({ user }: OperatorSidebarProps) {
    const pathname = usePathname()

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
                    <Link href="/operator" className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500">
                            <Zap className="h-5 w-5 text-white" />
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
                                            ? 'bg-amber-500 text-white'
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
