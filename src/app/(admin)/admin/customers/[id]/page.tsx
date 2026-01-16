'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { StatCard } from '@/components/dashboard/stat-card'
import {
    ArrowLeft,
    Users,
    Mail,
    TrendingUp,
    UserCog,
    Ban,
    Settings,
    Activity,
    Shield,
    Save,
    ExternalLink,
    RefreshCw,
    AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { getOrganizationDetails, updateOrganization, toggleOrganizationStatus } from '@/server/actions/organizations'
import { Organization, OrganizationFeatures } from '@/types'
import { cn } from '@/lib/utils'

// Mock customer data
const mockCustomer = {
    id: '1',
    name: 'Acme Corp',
    email: 'admin@acmecorp.com',
    plan: 'Pro',
    status: 'active',
    createdAt: '2025-11-15',
    users: [
        { id: '1', name: 'John Admin', email: 'john@acmecorp.com', role: 'owner', lastLogin: '2 hours ago' },
        { id: '2', name: 'Sarah Manager', email: 'sarah@acmecorp.com', role: 'admin', lastLogin: '1 day ago' },
        { id: '3', name: 'Mike User', email: 'mike@acmecorp.com', role: 'member', lastLogin: '3 days ago' },
    ],
    stats: {
        leads: 4521,
        campaigns: 12,
        emailsSent: 15200,
        openRate: 32,
        replyRate: 8,
    },
    features: {
        aiIcebreakers: true,
        csvImport: true,
        apiAccess: false,
        customBranding: false,
        prioritySupport: true,
    },
    limits: {
        maxLeads: 10000,
        maxCampaigns: 25,
        maxTeamMembers: 10,
    },
    activity: [
        { id: '1', action: 'Campaign created', details: 'Q1 Outreach', timestamp: '2 hours ago' },
        { id: '2', action: 'Leads imported', details: '150 leads from LinkedIn', timestamp: '1 day ago' },
        { id: '3', action: 'User invited', details: 'mike@acmecorp.com', timestamp: '3 days ago' },
        { id: '4', action: 'Plan upgraded', details: 'Starter → Pro', timestamp: '1 week ago' },
    ],
}

const planColors: Record<string, string> = {
    free: 'bg-zinc-800 text-zinc-400',
    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

export default function AdminCustomerDetailPage() {
    const params = useParams()
    const router = useRouter()
    const id = params.id as string

    const [org, setOrg] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const [features, setFeatures] = useState<OrganizationFeatures | null>(null)
    const [limits, setLimits] = useState<any>(null)

    const fetchOrg = async () => {
        setIsLoading(true)
        try {
            const data = await getOrganizationDetails(id)
            if (!data) {
                toast.error('Node not found in current sector')
                router.push('/admin/customers')
                return
            }
            setOrg(data)
            setFeatures(data.features || {
                maxLeads: 100,
                maxCampaigns: 1,
                maxTeamMembers: 1,
                aiIcebreakers: false,
                csvImport: false,
                apiAccess: false,
                customBranding: false,
                prioritySupport: false,
                betaFeatures: []
            })
            setLimits({
                maxLeads: data.features?.maxLeads || 100,
                maxCampaigns: data.features?.maxCampaigns || 1,
                maxTeamMembers: data.features?.maxTeamMembers || 1,
            })
        } catch (error) {
            console.error(error)
            toast.error('Communication error with node')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchOrg()
    }, [id])

    const handleSaveFeatures = async () => {
        if (!features) return
        setIsSaving(true)
        try {
            await updateOrganization(id, {
                features: {
                    ...features,
                    ...limits
                }
            })
            toast.success('System configuration updated successfully')
            fetchOrg()
        } catch (error: any) {
            toast.error(`Update failed: ${error.message}`)
        } finally {
            setIsSaving(false)
        }
    }

    const handleToggleStatus = async () => {
        if (!org) return
        const newStatus = org.status === 'suspended' ? 'active' : 'suspended'
        const action = newStatus === 'active' ? 'Reactivating' : 'Suspending'

        try {
            await toggleOrganizationStatus(id, newStatus)
            toast.success(`${action} successful`)
            fetchOrg()
        } catch (error: any) {
            toast.error(`${action} failed: ${error.message}`)
        }
    }

    const handleImpersonate = (userId: string) => {
        toast.info('Initiating secure bridge to customer dashboard...')
        // In real implementation, this would open a new tab with impersonation token
        window.open('/dashboard', '_blank')
    }

    if (isLoading && !org) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-zinc-500 animate-pulse">
                <RefreshCw className="h-12 w-12 animate-spin text-primary" />
                <p className="text-sm font-black uppercase tracking-[0.2em]">Synchronizing Node Data...</p>
            </div>
        )
    }

    if (!org) return null

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Link href="/admin/customers" className="hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span>Customers</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight italic">{org.name}</h1>
                        <Badge variant="outline" className={cn("uppercase text-[10px] font-black tracking-widest", planColors[org.plan])}>
                            {org.plan}
                        </Badge>
                        <Badge
                            variant="outline"
                            className={cn(
                                "uppercase text-[10px] font-black tracking-widest",
                                org.status === 'active' ? 'border-emerald-500/50 text-emerald-400' : 'border-rose-500/50 text-rose-400'
                            )}
                        >
                            {org.status || 'active'}
                        </Badge>
                    </div>
                    <p className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">{org.id}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" className="border-zinc-800" onClick={() => handleImpersonate(org.users[0]?.id)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Impersonate
                    </Button>
                    {org.status === 'active' || !org.status ? (
                        <Button variant="destructive" className="bg-rose-500/10 text-rose-500 hover:bg-rose-500/20" onClick={handleToggleStatus}>
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                        </Button>
                    ) : (
                        <Button variant="outline" className="border-emerald-500/50 text-emerald-400 hover:bg-emerald-500/10" onClick={handleToggleStatus}>
                            <RefreshCw className="mr-2 h-4 w-4" />
                            Reactivate
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <StatCard title="Total Leads" value={org._count.leads.toLocaleString()} icon={Users} />
                <StatCard title="Campaigns" value={org._count.campaigns} icon={Mail} />
                <StatCard title="Emails Sent" value="0" icon={TrendingUp} />
                <StatCard title="Open Rate" value="0%" icon={Mail} />
                <StatCard title="Reply Rate" value="0%" icon={TrendingUp} />
            </div>

            {/* Tabs */}
            <Tabs defaultValue="overview" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="overview">
                        <Activity className="mr-2 h-4 w-4" />
                        Overview
                    </TabsTrigger>
                    <TabsTrigger value="users">
                        <Users className="mr-2 h-4 w-4" />
                        Users
                    </TabsTrigger>
                    <TabsTrigger value="features">
                        <Settings className="mr-2 h-4 w-4" />
                        Features
                    </TabsTrigger>
                    <TabsTrigger value="activity">
                        <Activity className="mr-2 h-4 w-4" />
                        Activity Log
                    </TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-2">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg italic">Node Specifications</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Organization</span>
                                    <span className="font-bold">{org.name}</span>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Slug / Sector</span>
                                    <span className="font-mono text-zinc-400">{org.slug}</span>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Plan Level</span>
                                    <Badge variant="outline" className={cn("uppercase text-[10px] font-black tracking-widest", planColors[org.plan])}>
                                        {org.plan}
                                    </Badge>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Creation Date</span>
                                    <span className="font-medium text-zinc-300">{new Date(org.created_at).toLocaleDateString()}</span>
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex justify-between items-center">
                                    <span className="text-xs text-zinc-500 uppercase tracking-widest font-bold">Active Force</span>
                                    <span className="font-bold text-emerald-500">{org.users.length} Users</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-lg italic">Resource Utilization</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-2">
                                        <span className="text-zinc-500">Managed Leads</span>
                                        <span className="text-zinc-300">{org._count.leads.toLocaleString()} / {limits?.maxLeads.toLocaleString()}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-zinc-800">
                                        <div
                                            className="h-full rounded-full bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.5)]"
                                            style={{ width: `${Math.min((org._count.leads / (limits?.maxLeads || 100)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-2">
                                        <span className="text-zinc-500">Live Campaigns</span>
                                        <span className="text-zinc-300">{org._count.campaigns} / {limits?.maxCampaigns}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-zinc-800">
                                        <div
                                            className="h-full rounded-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${Math.min((org._count.campaigns / (limits?.maxCampaigns || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-2">
                                        <span className="text-zinc-500">Team Force</span>
                                        <span className="text-zinc-300">{org.users.length} / {limits?.maxTeamMembers}</span>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-zinc-800">
                                        <div
                                            className="h-full rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]"
                                            style={{ width: `${Math.min((org.users.length / (limits?.maxTeamMembers || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* Users Tab */}
                <TabsContent value="users">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="italic underline underline-offset-8">Personnel Files</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader className="bg-zinc-900/50">
                                    <TableRow className="border-zinc-800">
                                        <TableHead className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold">Identified User</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold">Email Address</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold">Clearance</TableHead>
                                        <TableHead className="text-zinc-500 uppercase text-[10px] tracking-widest font-bold">Activation Date</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {org.users.map((user: any) => (
                                        <TableRow key={user.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                            <TableCell className="font-bold text-zinc-100">{user.full_name || 'Unidentified User'}</TableCell>
                                            <TableCell className="text-zinc-400 font-mono text-xs">{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn(
                                                    "uppercase text-[9px] font-black tracking-widest",
                                                    user.role === 'owner' ? 'border-primary/50 text-primary' : 'border-zinc-700 text-zinc-500'
                                                )}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-zinc-500 text-xs">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="text-zinc-500 hover:text-primary hover:bg-primary/10 font-bold text-xs"
                                                    onClick={() => handleImpersonate(user.id)}
                                                >
                                                    <ExternalLink className="mr-2 h-3.5 w-3.5" />
                                                    Bridge
                                                </Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Features Tab */}
                <TabsContent value="features" className="space-y-6">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="italic">Feature Authorization</CardTitle>
                            <CardDescription className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest pt-1">
                                Enable or disable modular platform capabilities
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <Label className="text-zinc-200 group-hover:text-primary transition-colors">AI Icebreakers</Label>
                                        <p className="text-xs text-zinc-500">
                                            Enable Claude 3.5 Sonnet generation for this node
                                        </p>
                                    </div>
                                    <Switch
                                        className="data-[state=checked]:bg-primary"
                                        checked={features?.aiIcebreakers}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, aiIcebreakers: checked })}
                                    />
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <Label className="text-zinc-200 group-hover:text-primary transition-colors">CSV Data Import</Label>
                                        <p className="text-xs text-zinc-500">
                                            Allow bulk lead injection via structured files
                                        </p>
                                    </div>
                                    <Switch
                                        className="data-[state=checked]:bg-primary"
                                        checked={features?.csvImport}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, csvImport: checked })}
                                    />
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <Label className="text-zinc-200 group-hover:text-primary transition-colors">API Control Bridge</Label>
                                        <p className="text-xs text-zinc-500">
                                            Enable programmatic access to this organization's data
                                        </p>
                                    </div>
                                    <Switch
                                        className="data-[state=checked]:bg-primary"
                                        checked={features?.apiAccess}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, apiAccess: checked })}
                                    />
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <Label className="text-zinc-200 group-hover:text-primary transition-colors">Custom Identity</Label>
                                        <p className="text-xs text-zinc-500">
                                            Remove MailSmith branding from outgoing transmissions
                                        </p>
                                    </div>
                                    <Switch
                                        className="data-[state=checked]:bg-primary"
                                        checked={features?.customBranding}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, customBranding: checked })}
                                    />
                                </div>
                                <Separator className="bg-zinc-800" />
                                <div className="flex items-center justify-between group">
                                    <div>
                                        <Label className="text-zinc-200 group-hover:text-primary transition-colors">Sub-Second Support</Label>
                                        <p className="text-xs text-zinc-500">
                                            Elevate ticket priority for this organization
                                        </p>
                                    </div>
                                    <Switch
                                        className="data-[state=checked]:bg-primary"
                                        checked={features?.prioritySupport}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, prioritySupport: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="italic">Resource Quotas</CardTitle>
                            <CardDescription className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest pt-1">
                                Override standard plan capacity limits
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Max Leads Capacity</Label>
                                    <Input
                                        type="number"
                                        className="bg-zinc-950 border-zinc-800"
                                        value={limits?.maxLeads}
                                        onChange={(e) => setLimits({ ...limits, maxLeads: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Max live campaigns</Label>
                                    <Input
                                        type="number"
                                        className="bg-zinc-950 border-zinc-800"
                                        value={limits?.maxCampaigns}
                                        onChange={(e) => setLimits({ ...limits, maxCampaigns: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label className="text-zinc-400 text-[10px] uppercase font-bold tracking-widest">Deployment Force (Max Users)</Label>
                                    <Input
                                        type="number"
                                        className="bg-zinc-950 border-zinc-800"
                                        value={limits?.maxTeamMembers}
                                        onChange={(e) => setLimits({ ...limits, maxTeamMembers: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end pt-4">
                        <Button
                            onClick={handleSaveFeatures}
                            disabled={isSaving}
                            className="bg-primary text-primary-foreground font-black uppercase tracking-widest px-8 shadow-[0_0_20px_rgba(var(--primary-rgb),0.3)] hover:scale-105 transition-transform"
                        >
                            {isSaving ? (
                                <>
                                    <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                                    Synchronizing...
                                </>
                            ) : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Push Updates
                                </>
                            )}
                        </Button>
                    </div>
                </TabsContent>

                {/* Activity Log Tab */}
                <TabsContent value="activity">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="italic">Activity Archive</CardTitle>
                            <CardDescription className="text-zinc-500 font-medium uppercase text-[10px] tracking-widest pt-1">
                                Recent signals captured from this node
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {org.activity.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center py-12 text-zinc-600 gap-3">
                                        <Activity className="h-10 w-10 opacity-10" />
                                        <p className="text-xs uppercase tracking-[0.2em] font-bold">No active signals detected</p>
                                    </div>
                                ) : (
                                    org.activity.map((item: any) => (
                                        <div key={item.id} className="flex items-start gap-4 rounded-xl border border-zinc-800 bg-zinc-950/30 p-4 hover:border-zinc-700 transition-colors">
                                            <div className="h-8 w-8 rounded-lg bg-zinc-900 border border-zinc-800 flex items-center justify-center shrink-0">
                                                <Activity className="h-4 w-4 text-primary" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-bold text-sm text-zinc-200">{item.action}</p>
                                                <p className="text-xs text-zinc-500 mt-0.5">{JSON.stringify(item.metadata)}</p>
                                            </div>
                                            <span className="text-[10px] font-mono text-zinc-600 uppercase pt-1">{new Date(item.created_at).toLocaleString()}</span>
                                        </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
