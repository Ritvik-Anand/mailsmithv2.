'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Bell,
    Clock,
    Megaphone,
    CheckCircle2,
    Info,
    AlertTriangle,
    Zap,
    ArrowRight
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { getNotifications, markNotificationAsRead } from '@/server/actions/notifications'
import { Notification } from '@/types'

function timeAgo(date: string) {
    const seconds = Math.floor((new Date().getTime() - new Date(date).getTime()) / 1000)
    let interval = seconds / 31536000
    if (interval > 1) return Math.floor(interval) + "y"
    interval = seconds / 2592000
    if (interval > 1) return Math.floor(interval) + "mo"
    interval = seconds / 86400
    if (interval > 1) return Math.floor(interval) + "d"
    interval = seconds / 3600
    if (interval > 1) return Math.floor(interval) + "h"
    interval = seconds / 60
    if (interval > 1) return Math.floor(interval) + "m"
    return "now"
}

export default function DashboardNotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchNotifications = async () => {
        setIsLoading(true)
        const data = await getNotifications()
        setNotifications(data)
        setIsLoading(false)
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
        } catch (error) {
            console.error(error)
        }
    }

    const unreadCount = notifications.filter(n => !n.read).length

    return (
        <div className="space-y-8 animate-in fade-in duration-500 max-w-4xl mx-auto pb-20">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-black tracking-tighter text-zinc-100 italic uppercase">Logistics & Intel</h1>
                    <p className="text-zinc-500 text-sm">
                        Unified platform feed containing system broadcasts and campaign intelligence
                    </p>
                </div>
                {unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground font-black px-3 py-1">
                        {unreadCount} NEW UPDATES
                    </Badge>
                )}
            </div>

            <div className="grid gap-6">
                {isLoading ? (
                    <div className="flex flex-col items-center justify-center py-20 space-y-4">
                        <Zap className="h-10 w-10 text-primary animate-pulse" />
                        <p className="text-zinc-500 font-mono text-xs uppercase tracking-widest">Scanning Network Clusters...</p>
                    </div>
                ) : notifications.length === 0 ? (
                    <Card className="bg-zinc-900/50 border-zinc-800 border-dashed py-20">
                        <CardContent className="flex flex-col items-center justify-center text-center">
                            <Bell className="h-12 w-12 text-zinc-800 mb-4" />
                            <h3 className="text-zinc-300 font-bold">All Quiet on the Base</h3>
                            <p className="text-zinc-500 text-sm max-w-xs mt-2">
                                No new notifications or broadcasts have been received at this terminal.
                            </p>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n) => (
                        <Card
                            key={n.id}
                            className={cn(
                                "group transition-all border-zinc-800 hover:border-zinc-700 overflow-hidden",
                                n.read ? "bg-zinc-900/30 opacity-60" : "bg-zinc-900 shadow-[0_0_20px_rgba(var(--primary-rgb),0.03)]"
                            )}
                        >
                            <div className="flex flex-col md:flex-row">
                                <div className={cn(
                                    "w-full md:w-2 shrink-0 transition-colors",
                                    !!n.metadata?.broadcast ? "bg-primary" : "bg-zinc-800",
                                    n.read && "bg-transparent"
                                )} />
                                <div className="flex-1 p-6">
                                    <div className="flex items-start justify-between gap-4 mb-3">
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "p-2 rounded-lg border",
                                                !!n.metadata?.broadcast ? "bg-primary/10 border-primary/20" : "bg-zinc-950 border-zinc-800"
                                            )}>
                                                {!!n.metadata?.broadcast ? (
                                                    <Megaphone className="h-5 w-5 text-primary" />
                                                ) : n.type === 'campaign' ? (
                                                    <Zap className="h-5 w-5 text-amber-500" />
                                                ) : n.type === 'reply' ? (
                                                    <Info className="h-5 w-5 text-blue-500" />
                                                ) : (
                                                    <Bell className="h-5 w-5 text-zinc-400" />
                                                )}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h3 className={cn(
                                                        "font-bold text-lg",
                                                        !n.read ? "text-zinc-100" : "text-zinc-400"
                                                    )}>
                                                        {n.title}
                                                    </h3>
                                                    {!!n.metadata?.broadcast && (
                                                        <Badge variant="outline" className="text-[9px] border-primary/30 text-primary uppercase font-black tracking-tighter">
                                                            Master Broadcast
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-3 text-[10px] text-zinc-500 font-mono uppercase tracking-widest mt-0.5">
                                                    <span className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        {timeAgo(n.created_at)}
                                                    </span>
                                                    <span>•</span>
                                                    <span>ORIGIN: {!!n.metadata?.broadcast ? 'CENTRAL COMMAND' : 'SYSTEM NODE'}</span>
                                                </div>
                                            </div>
                                        </div>

                                        {!n.read && (
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                className="text-[10px] uppercase font-black tracking-widest text-primary hover:bg-primary/10"
                                                onClick={() => handleMarkAsRead(n.id)}
                                            >
                                                Acknowledge
                                            </Button>
                                        )}
                                    </div>
                                    <p className="text-zinc-400 text-sm leading-relaxed max-w-3xl">
                                        {n.message}
                                    </p>

                                    {!!n.metadata?.broadcast && !n.read && (
                                        <div className="mt-4 pt-4 border-t border-zinc-800/50 flex items-center justify-between">
                                            <p className="text-[10px] text-zinc-600 italic">
                                                This is a high-priority system transmission from the platform administrator.
                                            </p>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                className="text-primary p-0 h-auto text-xs"
                                                onClick={() => handleMarkAsRead(n.id)}
                                            >
                                                Dismiss Intel <ArrowRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
