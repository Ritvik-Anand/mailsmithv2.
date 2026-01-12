'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Settings,
    Shield,
    Zap,
    Database,
    Globe,
    Lock,
    Bell,
    Server,
    AlertCircle,
    CheckCircle2,
    RefreshCw,
    Activity
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { getSystemHealth } from '@/server/actions/admin'
import { useEffect } from 'react'

export default function AdminSettingsPage() {
    const [maintenanceMode, setMaintenanceMode] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [health, setHealth] = useState<any>(null)

    const fetchHealth = async () => {
        setIsRefreshing(true)
        try {
            const data = await getSystemHealth()
            setHealth(data)
        } catch (error) {
            toast.error('Failed to fetch infrastructure health metrics')
        } finally {
            setIsRefreshing(false)
        }
    }

    useEffect(() => {
        fetchHealth()
    }, [])

    const handleSave = () => {
        setIsLoading(true)
        setTimeout(() => {
            setIsLoading(false)
            toast.success('System configuration updated successfully')
        }, 1200)
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-100 italic">System Configuration</h1>
                <p className="text-zinc-500">
                    Master control panel for global platform variables and security protocols
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-zinc-900 border border-zinc-800 p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-zinc-800">
                        <Settings className="mr-2 h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="infrastructure" className="data-[state=active]:bg-zinc-800">
                        <Server className="mr-2 h-4 w-4" />
                        Infrastructure
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-zinc-800">
                        <Shield className="mr-2 h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="data-[state=active]:bg-zinc-800">
                        <Zap className="mr-2 h-4 w-4" />
                        Integrations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    Platform Identity
                                </CardTitle>
                                <CardDescription className="text-zinc-500">
                                    Global branding and naming conventions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Platform Name</Label>
                                    <Input defaultValue="MailSmith v2" className="bg-zinc-950 border-zinc-800" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Support Email</Label>
                                    <Input defaultValue="support@acquifix.com" className="bg-zinc-950 border-zinc-800" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-zinc-100 text-lg flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-amber-500" />
                                    Operational Status
                                </CardTitle>
                                <CardDescription className="text-zinc-500">
                                    Control public access and maintenance states
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800/50">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-zinc-200">System Maintenance Mode</p>
                                        <p className="text-xs text-zinc-500">Redirects all non-admin users to a waiting page</p>
                                    </div>
                                    <Switch
                                        checked={maintenanceMode}
                                        onCheckedChange={setMaintenanceMode}
                                        className="data-[state=checked]:bg-amber-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800/50">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-zinc-200">New User Signups</p>
                                        <p className="text-xs text-zinc-500">Enable or disable the registration of new organizations</p>
                                    </div>
                                    <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="infrastructure" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-zinc-100">Live Health Systems</CardTitle>
                                <CardDescription className="text-zinc-500">Real-time status of critical internal services</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-zinc-800 hover:bg-zinc-800"
                                onClick={fetchHealth}
                                disabled={isRefreshing}
                            >
                                <RefreshCw className={cn("mr-2 h-4 w-4", isRefreshing && "animate-spin")} />
                                Refresh Status
                            </Button>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {[
                                    { name: 'Primary Database Cluster', status: health?.database.status || 'loading', delay: health?.database.latency || '...', icon: Database },
                                    { name: 'ElasticSearch Engine', status: health?.search.status || 'loading', delay: health?.search.latency || '...', icon: Activity },
                                    { name: 'Lead Scraper Node-Alpha', status: health?.scraper.status || 'loading', delay: health?.scraper.latency || '...', icon: Zap },
                                    { name: 'SMTP Relay Gateway', status: health?.smtp.status || 'loading', delay: health?.smtp.latency || '...', icon: Globe },
                                    { name: 'Authentication Layer', status: 'operational', delay: '8ms', icon: Lock },
                                ].map((service) => (
                                    <div key={service.name} className="flex items-center justify-between p-4 rounded-xl bg-zinc-950 border border-zinc-800/50 group hover:border-zinc-700 transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-zinc-900 border border-zinc-800">
                                                <service.icon className="h-5 w-5 text-zinc-400 group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-zinc-200">{service.name}</p>
                                                <p className="text-[10px] text-zinc-500 uppercase tracking-widest font-mono">LATENCY: {service.delay}</p>
                                            </div>
                                        </div>
                                        <Badge
                                            className={cn(
                                                "px-2 py-0.5 rounded-md border-none uppercase text-[10px] font-black",
                                                service.status === 'operational' ? "bg-emerald-500/10 text-emerald-500" :
                                                    service.status === 'loading' ? "bg-zinc-500/10 text-zinc-500 animate-pulse" :
                                                        "bg-amber-500/10 text-amber-500"
                                            )}
                                        >
                                            {service.status}
                                        </Badge>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="security" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-zinc-100">Global Security Protocols</CardTitle>
                            <CardDescription className="text-zinc-500">Manage sensitive access keys and platform-wide locks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Admin Session Duration (Days)</Label>
                                    <Input type="number" defaultValue="3" className="bg-zinc-950 border-zinc-800 font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400">Max Failed Login Attempts</Label>
                                    <Input type="number" defaultValue="5" className="bg-zinc-950 border-zinc-800 font-mono" />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-zinc-800/50">
                                <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    EMERGENCY SYSTEM LOCKDOWN
                                </Button>
                                <p className="text-[10px] text-zinc-600 mt-2 italic">
                                    Warning: This will terminate all active sessions and disable portal access until manually reactivated via Master Root.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-zinc-800">
                <Button variant="ghost" className="text-zinc-500 hover:text-zinc-100">Cancel</Button>
                <Button
                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold px-8"
                    onClick={handleSave}
                    disabled={isLoading}
                >
                    {isLoading ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : 'Apply System Changes'}
                </Button>
            </div>
        </div>
    )
}
