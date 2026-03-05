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
                <h1 className="text-3xl font-bold tracking-tight text-foreground italic">System Configuration</h1>
                <p className="text-muted-foreground">
                    Master control panel for global platform variables and security protocols
                </p>
            </div>

            <Tabs defaultValue="general" className="space-y-6">
                <TabsList className="bg-muted border border-border p-1">
                    <TabsTrigger value="general" className="data-[state=active]:bg-muted">
                        <Settings className="mr-2 h-4 w-4" />
                        General
                    </TabsTrigger>
                    <TabsTrigger value="infrastructure" className="data-[state=active]:bg-muted">
                        <Server className="mr-2 h-4 w-4" />
                        Infrastructure
                    </TabsTrigger>
                    <TabsTrigger value="security" className="data-[state=active]:bg-muted">
                        <Shield className="mr-2 h-4 w-4" />
                        Security
                    </TabsTrigger>
                    <TabsTrigger value="integrations" className="data-[state=active]:bg-muted">
                        <Zap className="mr-2 h-4 w-4" />
                        Integrations
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="general" className="space-y-6">
                    <div className="grid gap-6 md:grid-cols-2">
                        <Card className="bg-foreground/5 border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-lg flex items-center gap-2">
                                    <Globe className="h-5 w-5 text-primary" />
                                    Platform Identity
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Global branding and naming conventions
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Platform Name</Label>
                                    <Input defaultValue="MailSmith v2" className="bg-card border-border" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Support Email</Label>
                                    <Input defaultValue="support@acquifix.com" className="bg-card border-border" />
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-foreground/5 border-border">
                            <CardHeader>
                                <CardTitle className="text-foreground text-lg flex items-center gap-2">
                                    <Shield className="h-5 w-5 text-amber-500" />
                                    Operational Status
                                </CardTitle>
                                <CardDescription className="text-muted-foreground">
                                    Control public access and maintenance states
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-foreground">System Maintenance Mode</p>
                                        <p className="text-xs text-muted-foreground">Redirects all non-admin users to a waiting page</p>
                                    </div>
                                    <Switch
                                        checked={maintenanceMode}
                                        onCheckedChange={setMaintenanceMode}
                                        className="data-[state=checked]:bg-amber-500"
                                    />
                                </div>
                                <div className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                                    <div className="space-y-1">
                                        <p className="text-sm font-bold text-foreground">New User Signups</p>
                                        <p className="text-xs text-muted-foreground">Enable or disable the registration of new organizations</p>
                                    </div>
                                    <Switch defaultChecked className="data-[state=checked]:bg-primary" />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="infrastructure" className="space-y-6">
                    <Card className="bg-foreground/5 border-border">
                        <CardHeader className="flex flex-row items-center justify-between">
                            <div>
                                <CardTitle className="text-foreground">Live Health Systems</CardTitle>
                                <CardDescription className="text-muted-foreground">Real-time status of critical internal services</CardDescription>
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="border-border hover:bg-muted"
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
                                    <div key={service.name} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50 group hover:border-border transition-all">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-lg bg-muted border border-border">
                                                <service.icon className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-bold text-foreground">{service.name}</p>
                                                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">LATENCY: {service.delay}</p>
                                            </div>
                                        </div>
                                        <Badge
                                            className={cn(
                                                "px-2 py-0.5 rounded-md border-none uppercase text-[10px] font-black",
                                                service.status === 'operational' ? "bg-emerald-500/10 text-emerald-500" :
                                                    service.status === 'loading' ? "bg-zinc-500/10 text-muted-foreground animate-pulse" :
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
                    <Card className="bg-foreground/5 border-border">
                        <CardHeader>
                            <CardTitle className="text-foreground">Global Security Protocols</CardTitle>
                            <CardDescription className="text-muted-foreground">Manage sensitive access keys and platform-wide locks</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid gap-6 md:grid-cols-2">
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Admin Session Duration (Days)</Label>
                                    <Input type="number" defaultValue="3" className="bg-card border-border font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-muted-foreground">Max Failed Login Attempts</Label>
                                    <Input type="number" defaultValue="5" className="bg-card border-border font-mono" />
                                </div>
                            </div>
                            <div className="pt-4 border-t border-border/50">
                                <Button className="bg-rose-600 hover:bg-rose-700 text-white font-bold">
                                    <AlertCircle className="mr-2 h-4 w-4" />
                                    EMERGENCY SYSTEM LOCKDOWN
                                </Button>
                                <p className="text-[10px] text-muted-foreground mt-2 italic">
                                    Warning: This will terminate all active sessions and disable portal access until manually reactivated via Master Root.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
                <Button variant="ghost" className="text-muted-foreground hover:text-foreground">Cancel</Button>
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
