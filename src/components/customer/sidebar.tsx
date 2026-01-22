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
    BarChart3,
    FileText,
    MessageSquare,
    Menu,
    ChevronLeft,
    Sparkles,
    TrendingUp,
} from 'lucide-react'
import type { UserWithRole } from '@/server/actions/roles'

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
        title: 'Analytics',
        href: '/portal/analytics',
        icon: BarChart3,
        description: 'Performance insights',
    },
    {
        title: 'Reports',
        href: '/portal/reports',
        icon: FileText,
        description: 'Download reports',
    },
    {
        title: 'AI Assistant',
        href: '/portal/assistant',
        icon: Sparkles,
        description: 'Ask questions about your data',
    },
]

export function CustomerSidebar({ user }: CustomerSidebarProps) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col border-r border-white/5 bg-black/40 backdrop-blur-xl transition-all duration-300',
                collapsed ? 'w-16' : 'w-72'
            )}
        >
            {/* Logo */}
            <div className="flex h-20 items-center border-b border-white/5 px-4">
                <Link href="/portal" className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 p-0.5 shadow-lg shadow-primary/20">
                        <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-black/20 backdrop-blur-sm">
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
                            <span className="font-bold text-lg text-white">MailSmith</span>
                            <span className="text-xs text-white/40">Client Portal</span>
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
                                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                                        : 'text-white/60 hover:bg-white/5 hover:text-white'
                                )}
                            >
                                <item.icon className={cn(
                                    'h-5 w-5 shrink-0 transition-colors',
                                    isActive ? 'text-white' : 'text-white/40'
                                )} />
                                {!collapsed && (
                                    <div className="flex flex-col">
                                        <span>{item.title}</span>
                                        {!isActive && (
                                            <span className="text-xs text-white/30">{item.description}</span>
                                        )}
                                    </div>
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Support Link */}
            <div className="border-t border-white/5 p-4">
                <Link
                    href="/portal/support"
                    className="flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-medium text-white/60 hover:bg-white/5 hover:text-white transition-all"
                >
                    <MessageSquare className="h-5 w-5 text-white/40" />
                    {!collapsed && <span>Contact Support</span>}
                </Link>
            </div>

            {/* Collapse Toggle */}
            <div className="border-t border-white/5 p-3">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-start text-white/40 hover:text-white hover:bg-white/5"
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

export function CustomerMobileSidebar({ user }: CustomerSidebarProps) {
    const pathname = usePathname()

    return (
        <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden text-white">
                    <Menu className="h-5 w-5" />
                    <span className="sr-only">Toggle menu</span>
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 p-0 bg-black/95 border-white/10">
                <div className="flex h-20 items-center border-b border-white/5 px-4">
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
                            <span className="font-bold text-lg text-white">MailSmith</span>
                            <span className="text-xs text-white/40">Client Portal</span>
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
                                            ? 'bg-primary text-white'
                                            : 'text-white/60 hover:bg-white/5 hover:text-white'
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
