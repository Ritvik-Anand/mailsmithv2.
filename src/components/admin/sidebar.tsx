'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Zap,
    LayoutDashboard,
    Users,
    MessageSquare,
    Settings,
    Bell,
    Shield,
    ChevronLeft,
    Monitor
} from 'lucide-react'

const adminNavItems = [
    {
        title: 'Console Home',
        href: '/admin-console',
        icon: LayoutDashboard,
    },
    {
        title: 'Operator Portal',
        href: '/operator',
        icon: Zap,
    },
    {
        title: 'Organizations',
        href: '/admin-console/customers',
        icon: Users,
    },
    {
        title: 'Outreach Nodes',
        href: '/admin-console/infrastructure',
        icon: Monitor,
    },
    {
        title: 'Internal Team',
        href: '/admin-console/team',
        icon: Shield,
    },
    {
        title: 'Support Queue',
        href: '/admin-console/support',
        icon: MessageSquare,
    },
    {
        title: 'System Activity',
        href: '/admin-console/notifications',
        icon: Bell,
    },
    {
        title: 'System Config',
        href: '/admin-console/settings',
        icon: Settings,
    },
]

export function AdminSidebar() {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <aside
            className={cn(
                'hidden lg:flex flex-col bg-[#050505] border-r border-zinc-900 transition-all duration-300 ease-in-out relative',
                collapsed ? 'w-20' : 'w-64'
            )}
        >
            {/* Branding area */}
            <div className="flex h-20 items-center px-6 border-b border-zinc-900/50">
                <Link href="/admin-console" className="flex items-center gap-3 group">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary border border-primary/20 shadow-lg shadow-primary/10 transition-transform group-hover:scale-105">
                        <Monitor className="h-5 w-5 text-white" />
                    </div>
                    {!collapsed && (
                        <div className="flex flex-col">
                            <span className="font-bold text-base text-zinc-100 tracking-tight leading-none">
                                MailSmith
                            </span>
                            <span className="text-[10px] text-primary font-bold uppercase tracking-[0.2em] mt-1 shrink-0">
                                Administration
                            </span>
                        </div>
                    )}
                </Link>
            </div>

            {/* Navigation items */}
            <ScrollArea className="flex-1 px-3 py-8">
                <nav className="space-y-1.5">
                    {adminNavItems.map((item) => {
                        const isActive = item.href === '/admin-console'
                            ? pathname === item.href
                            : pathname.startsWith(item.href)

                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg px-3.5 py-3 text-[13px] font-semibold transition-all group relative',
                                    isActive
                                        ? 'bg-primary/10 text-primary border border-primary/10'
                                        : 'text-zinc-500 hover:text-white hover:bg-zinc-900/50'
                                )}
                            >
                                <item.icon className={cn(
                                    "h-4 w-4 shrink-0 transition-colors",
                                    isActive ? "text-primary" : "text-zinc-600 group-hover:text-zinc-400"
                                )} />
                                {!collapsed && (
                                    <span className="flex-1 truncate">
                                        {item.title}
                                    </span>
                                )}
                                {isActive && !collapsed && (
                                    <div className="absolute right-3 h-1 w-1 rounded-full bg-primary" />
                                )}
                            </Link>
                        )
                    })}
                </nav>
            </ScrollArea>

            {/* Footer */}
            <div className="p-4 border-t border-zinc-900 bg-zinc-950/20">
                <Button
                    variant="ghost"
                    size="sm"
                    className="w-full justify-center h-10 rounded-lg text-zinc-600 hover:text-primary hover:bg-primary/5 transition-all"
                    onClick={() => setCollapsed(!collapsed)}
                >
                    <ChevronLeft
                        className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')}
                    />
                    {!collapsed && <span className="ml-2 text-[10px] font-bold uppercase tracking-[0.1em]">Collapse Admin</span>}
                </Button>
            </div>
        </aside>
    )
}
