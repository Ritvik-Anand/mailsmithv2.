'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet'
import {
    LayoutDashboard,
    BarChart3,
    FileText,
    MessageSquare,
    Menu,
    ChevronLeft,
    Sparkles,
    TrendingUp,
    Users,
    Inbox,
} from 'lucide-react'
import type { UserWithRole } from '@/server/actions/roles'
import { ThemeToggle } from '@/components/theme-toggle'

interface CustomerSidebarProps {
    user: UserWithRole
}

const navItems = [
    {
        title: 'Overview',
        href: '/portal',
        icon: LayoutDashboard,
        description: 'Campaign progress & metrics',
    },
    {
        title: 'Campaigns',
        href: '/portal/campaigns',
        icon: TrendingUp,
        description: 'View your active campaigns',
    },
    {
        title: 'Leads',
        href: '/portal/leads',
        icon: Users,
        description: 'View your leads',
    },
    {
        title: 'Inbox',
        href: '/portal/inbox',
        icon: Inbox,
        description: 'Read & reply to responses',
    },
    {
        title: 'Analytics',
        href: '/portal/analytics',
        icon: BarChart3,
        description: 'Performance insights',
    },
    {
        title: 'AI Assistant',
        href: '/portal/assistant',
        icon: Sparkles,
        description: 'Ask questions about your data',
    },
]

// =============================================================================
// Unread badge — polls /api/inbox/unread every 60s
// =============================================================================
function InboxUnreadBadge() {
    const [count, setCount] = useState(0)

    useEffect(() => {
        const fetch = () =>
            window.fetch('/api/inbox/unread')
                .then(r => r.json())
                .then(d => setCount(d.count ?? 0))
                .catch(() => { })

        fetch()
        const id = setInterval(fetch, 60_000)
        return () => clearInterval(id)
    }, [])

    if (count === 0) return null
    return (
        <span className="ml-auto flex h-4 min-w-[16px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white tabular-nums">
            {count > 99 ? '99+' : count}
        </span>
    )
}

export function CustomerSidebar({ user }: CustomerSidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-r border-foreground/5 bg-background/40 backdrop-blur-xl transition-all duration-300',
                collapsed ? 'w-16' : 'w-72'
            )}
        >
            {/* Logo */}
            <div className="flex h-20 items-center border-b border-foreground/5 px-4">
                <Link href="/portal" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 p-0.5 shadow-lg shadow-primary/20">
                        <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-background/20 backdrop-blur-sm">
                            <Image
                                src="/logo.png"
                                alt="MailSmith Logo"
                                width={24}
                                height={24}
                                className="object-contain"
                            />
                        </div>
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-foreground">MailSmith</span>
                            <span className="text-xs text-foreground/40">Client Portal</span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation */}
            <ScrollArea className="flex-1 py-6">
                <nav className="space-y-2 px-3">
                    {navItems.map((item) => {
                        const isActive = item.href === '/portal'
                            ? pathname === item.href
                            : pathname.startsWith(item.href)
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                                    isActive
                                        ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                                        : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                                )}
                            >
                                <item.icon className={cn(
                                    'h-5 w-5 shrink-0 transition-colors',
                                    isActive ? 'text-foreground' : 'text-foreground/40'
                                )} />
                                {!collapsed && (
                                    <div className="flex flex-col flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span>{item.title}</span>
                                            {item.href === '/portal/inbox' && (
                                                <InboxUnreadBadge />
                                            )}
                                        </div>
                                        {!isActive && (
                                            <span className="text-xs text-foreground/30">{item.description}</span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Support Link */}
            <div className="border-t border-foreground/5 p-4">
                <Link
                    href="/portal/support"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-foreground/60 hover:bg-foreground/5 hover:text-foreground transition-all"
                >
                    <MessageSquare className="h-5 w-5 text-foreground/40" />
                    {!collapsed && <span>Contact Support</span>}
                </Link>
            </div>

            {/* Collapse Toggle */}
            <div className="border-t border-foreground/5 p-3 flex items-center justify-between gap-2">
                <Button
                    variant="ghost"
                    size="sm"
                    className="flex-1 justify-start text-foreground/40 hover:text-foreground hover:bg-foreground/5"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeft
                        className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')}
                    />
                    {!collapsed && <span className="ml-2">Collapse</span>}
                </Button>
                <ThemeToggle />
            </div>
        </aside>
    )
}

export function CustomerMobileSidebar({ user }: CustomerSidebarProps) {
    const pathname = usePathname()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-foreground">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-background/95 border-foreground/10">
                <div className="flex h-20 items-center border-b border-foreground/5 px-4">
                    <Link href="/portal" className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60">
                            <Image
                                src="/logo.png"
                                alt="MailSmith Logo"
                                width={24}
                                height={24}
                                className="object-contain"
                            />
                        </div>
                        <div className="flex flex-col">
                            <span className="font-bold text-lg text-foreground">MailSmith</span>
                            <span className="text-xs text-foreground/40">Client Portal</span>
                        </div>
                    </Link>
                </div>
                <ScrollArea className="flex-1 py-6">
                    <nav className="space-y-2 px-3">
                        {navItems.map((item) => {
                            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`)
                            return (
                                <Link
                                    key={item.href}
                                    href={item.href}
                                    className={cn(
                                        'flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium transition-all',
                                        isActive
                                            ? 'bg-primary text-primary-foreground'
                                            : 'text-foreground/60 hover:bg-foreground/5 hover:text-foreground'
                                    )}
                                >
                                    <item.icon className="h-5 w-5" />
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
