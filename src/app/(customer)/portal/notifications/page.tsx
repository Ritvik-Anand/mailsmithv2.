'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Bell,
    CheckCircle2,
    AlertCircle,
    Info,
    Mail,
    ArrowLeft,
    Loader2,
} from 'lucide-react'
import Link from 'next/link'
import { getNotifications, markNotificationAsRead } from '@/server/actions/notifications'
import type { Notification } from '@/types'
import { toast } from 'sonner'

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([])
    const [isLoading, setIsLoading] = useState(true)

    const fetchNotifications = async () => {
        try {
            const data = await getNotifications()
            setNotifications(data)
        } catch (error) {
            console.error('Failed to fetch notifications:', error)
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchNotifications()
    }, [])

    const handleMarkAsRead = async (id: string) => {
        try {
            await markNotificationAsRead(id)
            setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
            toast.success('Notification marked as read')
        } catch (error) {
            toast.error('Failed to mark as read')
        }
    }

    const getIcon = (type: string) => {
        switch (type) {
            case 'alert': return <AlertCircle className="h-5 w-5 text-red-400" />
            case 'campaign': return <Mail className="h-5 w-5 text-blue-400" />
            case 'system': return <CheckCircle2 className="h-5 w-5 text-green-400" />
            default: return <Info className="h-5 w-5 text-zinc-400" />
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20 gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-foreground/50">Loading notifications...</p>
            </div>
        )
    }

    return (
        <div className="max-w-3xl mx-auto space-y-6">
            <div className="flex items-center gap-4">
                <Link href="/portal">
                    <Button variant="ghost" size="icon" className="text-foreground/50 hover:text-foreground">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-foreground">Notifications</h1>
                    <p className="text-sm text-foreground/50">Stay updated on your campaign progress</p>
                </div>
            </div>

            <div className="space-y-4">
                {notifications.length === 0 ? (
                    <Card className="bg-foreground/[0.02] border-foreground/5">
                        <CardContent className="py-20 text-center space-y-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-foreground/5 mx-auto">
                                <Bell className="h-6 w-6 text-foreground/20" />
                            </div>
                            <div>
                                <h3 className="text-lg font-medium text-foreground">All caught up!</h3>
                                <p className="text-foreground/40 text-sm mt-1">You don't have any notifications at the moment.</p>
                            </div>
                        </CardContent>
                    </Card>
                ) : (
                    notifications.map((n) => (
                        <Card key={n.id} className={`bg-foreground/[0.02] border-foreground/5 transition-all ${!n.read ? 'border-l-4 border-l-primary' : ''}`}>
                            <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-foreground/5 mt-1">
                                        {getIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0 space-y-1">
                                        <div className="flex items-center justify-between gap-2">
                                            <p className={`text-sm font-semibold truncate ${n.read ? 'text-foreground/70' : 'text-foreground'}`}>
                                                {n.title}
                                            </p>
                                            <span className="text-[10px] text-foreground/30 whitespace-nowrap">
                                                {new Date(n.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className={`text-sm leading-relaxed ${n.read ? 'text-foreground/40' : 'text-foreground/60'}`}>
                                            {n.message}
                                        </p>
                                        {!n.read && (
                                            <div className="pt-2">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-8 text-[11px] font-bold uppercase tracking-wider text-primary hover:text-primary hover:bg-primary/10 px-0"
                                                    onClick={() => handleMarkAsRead(n.id)}
                                                >
                                                    Mark as read
                                                </Button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))
                )}
            </div>
        </div>
    )
}
