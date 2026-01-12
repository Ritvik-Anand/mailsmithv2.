'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import {
    Bell,
    Send,
    AlertTriangle,
    Info,
    CheckCircle2,
    Megaphone,
    Search,
    Filter,
    Clock,
    User,
    Mail,
    Zap
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Mock System Notifications
const INITIAL_NOTIFICATIONS = [
    {
        id: '1',
        type: 'critical',
        title: 'System Latency Spike',
        message: 'Lead scraper node Alpha is reporting 2s+ latency. Investigate hardware resource limits.',
        timestamp: '10 mins ago',
        read: false
    },
    {
        id: '2',
        type: 'info',
        title: 'New Customer: Acme Corp',
        message: 'Acme Corp has completed onboarding and selected the Pro Plan.',
        timestamp: '45 mins ago',
        read: true
    },
    {
        id: '3',
        type: 'success',
        title: 'Deployment Successful',
        message: 'v2.1.0-alpha.3 has been successfully deployed to production cluster.',
        timestamp: '2 hours ago',
        read: true
    },
    {
        id: '4',
        type: 'warning',
        title: 'SMTP Rate Limit',
        message: 'Shared SMTP gateway reached 85% of its hourly quota.',
        timestamp: '5 hours ago',
        read: false
    }
]

export default function AdminNotificationsPage() {
    const [notifications, setNotifications] = useState(INITIAL_NOTIFICATIONS)
    const [broadcastTitle, setBroadcastTitle] = useState('')
    const [broadcastMessage, setBroadcastMessage] = useState('')
    const [isBroadcasting, setIsBroadcasting] = useState(false)

    const handleBroadcast = () => {
        if (!broadcastTitle || !broadcastMessage) return

        setIsBroadcasting(true)
        setTimeout(() => {
            setIsBroadcasting(false)
            setBroadcastTitle('')
            setBroadcastMessage('')
            toast.success('System broadcast sent to all active customers')
        }, 1500)
    }

    const markAsRead = (id: string) => {
        setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500 pb-10">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100 italic">Communications & Alerts</h1>
                <p className="text-zinc-500">
                    Monitor system events and broadcast critical updates to your customer base
                </p>
            </div>

            <div className="grid gap-8 lg:grid-cols-3">
                {/* Notification Feed */}
                <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800 h-full flex flex-col">
                        <CardHeader className="flex flex-row items-center justify-between space-y-0">
                            <div>
                                <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                                    <Bell className="h-5 w-5 text-primary" />
                                    System Intelligence Feed
                                </CardTitle>
                                <CardDescription className="text-zinc-500 text-xs">
                                    Real-time overview of platform activity and automated alerts
                                </CardDescription>
                            </div>
                            <div className="flex gap-2">
                                <Button variant="ghost" size="sm" className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold">
                                    Mark All As Read
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="flex-1 p-0 px-6">
                            <ScrollArea className="h-[600px] w-full pr-4">
                                <div className="space-y-4 pb-6">
                                    {notifications.map((n) => (
                                        <div
                                            key={n.id}
                                            className={cn(
                                                "p-4 rounded-xl border transition-all cursor-pointer group hover:bg-zinc-800/30",
                                                n.read ? "bg-zinc-900/20 border-zinc-800/50 opacity-60" : "bg-zinc-900 border-zinc-800"
                                            )}
                                            onClick={() => markAsRead(n.id)}
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className={cn(
                                                    "p-2 rounded-lg border",
                                                    n.type === 'critical' ? "bg-rose-500/10 border-rose-500/20" :
                                                        n.type === 'warning' ? "bg-amber-500/10 border-amber-500/20" :
                                                            "bg-zinc-800 border-zinc-700"
                                                )}>
                                                    {n.type === 'critical' ? <AlertTriangle className="h-4 w-4 text-rose-500" /> :
                                                        n.type === 'warning' ? <AlertTriangle className="h-4 w-4 text-amber-500" /> :
                                                            n.type === 'success' ? <CheckCircle2 className="h-4 w-4 text-emerald-500" /> :
                                                                <Info className="h-4 w-4 text-primary" />}
                                                </div>
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className={cn(
                                                            "text-sm font-bold",
                                                            !n.read ? "text-zinc-100" : "text-zinc-400"
                                                        )}>{n.title}</p>
                                                        <div className="flex items-center gap-1.5 text-[10px] text-zinc-500">
                                                            <Clock className="h-3 w-3" />
                                                            {n.timestamp}
                                                        </div>
                                                    </div>
                                                    <p className="text-xs text-zinc-500 leading-relaxed">
                                                        {n.message}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>
                        </CardContent>
                    </Card>
                </div>

                {/* Broadcast Tool */}
                <div className="space-y-6">
                    <Card className="bg-zinc-900 border-primary/20 shadow-[0_0_20px_rgba(var(--primary-rgb),0.1)] relative overflow-hidden">
                        {/* Visual overlay */}
                        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                            <Megaphone className="h-32 w-32" />
                        </div>

                        <CardHeader>
                            <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                                <Megaphone className="h-5 w-5 text-primary" />
                                Master Broadcast
                            </CardTitle>
                            <CardDescription className="text-zinc-500 text-xs">
                                Send a global announcement to all customer dashboards instantly.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4 pt-2">
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Broadcast Title</Label>
                                <Input
                                    placeholder="Maintenance Update..."
                                    className="bg-zinc-950 border-zinc-800 h-10 focus:ring-primary/20"
                                    value={broadcastTitle}
                                    onChange={(e) => setBroadcastTitle(e.target.value)}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Message Content</Label>
                                <Textarea
                                    placeholder="Describe the update clearly..."
                                    className="bg-zinc-950 border-zinc-800 min-h-[120px] focus:ring-primary/20"
                                    value={broadcastMessage}
                                    onChange={(e) => setBroadcastMessage(e.target.value)}
                                />
                            </div>
                            <div className="pt-2">
                                <Button
                                    className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/10 transition-all active:scale-[0.98]"
                                    onClick={handleBroadcast}
                                    disabled={isBroadcasting || !broadcastTitle || !broadcastMessage}
                                >
                                    {isBroadcasting ? (
                                        <Zap className="mr-2 h-4 w-4 animate-bounce" />
                                    ) : (
                                        <Send className="mr-2 h-4 w-4" />
                                    )}
                                    Deploy Announcement
                                </Button>
                                <p className="text-[10px] text-center text-zinc-600 mt-3 italic">
                                    Authorized agents only. This action cannot be undone.
                                </p>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-zinc-100 text-sm flex items-center gap-2 uppercase tracking-tighter">
                                <Filter className="h-4 w-4 text-zinc-500" />
                                Feed Filters
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-2">
                            {['Critical Alerts', 'Development Logs', 'Customer Milestones', 'Resolved'].map((filter) => (
                                <div key={filter} className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-zinc-800/50 transition-colors cursor-pointer group">
                                    <div className="h-1.5 w-1.5 rounded-full bg-zinc-700 group-hover:bg-primary transition-colors" />
                                    <span className="text-xs text-zinc-400 group-hover:text-zinc-200 transition-colors">{filter}</span>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
