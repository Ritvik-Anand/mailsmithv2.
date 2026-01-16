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
} from 'lucide-react'
import { toast } from 'sonner'
import { getOrganizationDetails, updateOrganization, toggleOrganizationStatus } from '@/server/actions/organizations'
import { OrganizationFeatures } from '@/types'

const planColors: Record<string, string> = {
    free: 'bg-zinc-500',
    starter: 'bg-blue-500',
    pro: 'bg-purple-500',
    enterprise: 'bg-amber-500',
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
                toast.error('Organization not found')
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
            toast.error('Failed to load organization details')
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
            toast.success('Features updated successfully')
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
        toast.info('Opening customer dashboard...')
        window.open('/dashboard', '_blank')
    }

    if (isLoading && !org) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4 text-muted-foreground animate-pulse">
                <RefreshCw className="h-10 w-10 animate-spin text-primary" />
                <p>Loading Organization Data...</p>
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
                        <h1 className="text-3xl font-bold tracking-tight">{org.name}</h1>
                        <Badge className={`${planColors[org.plan]} text-white capitalize`}>
                            {org.plan}
                        </Badge>
                        <Badge variant={org.status === 'suspended' ? 'destructive' : 'secondary'} className="capitalize">
                            {org.status || 'active'}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground font-mono text-sm">{org.slug}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleImpersonate(org.users[0]?.id)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Impersonate
                    </Button>
                    {org.status === 'suspended' ? (
                        <Button variant="outline" onClick={handleToggleStatus}>
                            Reactivate
                        </Button>
                    ) : (
                        <Button variant="destructive" onClick={handleToggleStatus}>
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
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
                        <Card>
                            <CardHeader>
                                <CardTitle>Account Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Organization</span>
                                    <span className="font-medium">{org.name}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Slug</span>
                                    <span className="font-mono text-sm">{org.slug}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Plan</span>
                                    <Badge className={`${planColors[org.plan]} text-white capitalize`}>
                                        {org.plan}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span className="font-medium">{new Date(org.created_at).toLocaleDateString()}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Team Members</span>
                                    <span className="font-medium">{org.users.length}</span>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Usage vs Limits</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Leads</span>
                                        <span>{org._count.leads.toLocaleString()} / {limits?.maxLeads.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${Math.min((org._count.leads / (limits?.maxLeads || 100)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Campaigns</span>
                                        <span>{org._count.campaigns} / {limits?.maxCampaigns}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${Math.min((org._count.campaigns / (limits?.maxCampaigns || 1)) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Team Members</span>
                                        <span>{org.users.length} / {limits?.maxTeamMembers}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Team Members</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Joined at</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {org.users.map((user: any) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.full_name || 'No Name'}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'owner' ? 'default' : 'secondary'} className="capitalize">
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{new Date(user.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => handleImpersonate(user.id)}
                                                >
                                                    <ExternalLink className="mr-2 h-4 w-4" />
                                                    Login as
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
                    <Card>
                        <CardHeader>
                            <CardTitle>Feature Toggles</CardTitle>
                            <CardDescription>
                                Enable or disable features for this customer
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>AI Icebreakers</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Generate personalized icebreakers with AI
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features?.aiIcebreakers}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, aiIcebreakers: checked })}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>CSV Import</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Allow importing leads from CSV files
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features?.csvImport}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, csvImport: checked })}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>API Access</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Enable programmatic API access
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features?.apiAccess}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, apiAccess: checked })}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Custom Branding</Label>
                                        <p className="text-sm text-muted-foreground">
                                            White-label email templates
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features?.customBranding}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, customBranding: checked })}
                                    />
                                </div>
                                <Separator />
                                <div className="flex items-center justify-between">
                                    <div>
                                        <Label>Priority Support</Label>
                                        <p className="text-sm text-muted-foreground">
                                            Faster response times for support tickets
                                        </p>
                                    </div>
                                    <Switch
                                        checked={features?.prioritySupport}
                                        onCheckedChange={(checked) => features && setFeatures({ ...features, prioritySupport: checked })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Custom Limits</CardTitle>
                            <CardDescription>
                                Override default plan limits for this customer
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-3">
                                <div className="space-y-2">
                                    <Label>Max Leads</Label>
                                    <Input
                                        type="number"
                                        value={limits?.maxLeads}
                                        onChange={(e) => setLimits({ ...limits, maxLeads: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Campaigns</Label>
                                    <Input
                                        type="number"
                                        value={limits?.maxCampaigns}
                                        onChange={(e) => setLimits({ ...limits, maxCampaigns: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Team Members</Label>
                                    <Input
                                        type="number"
                                        value={limits?.maxTeamMembers}
                                        onChange={(e) => setLimits({ ...limits, maxTeamMembers: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    <div className="flex justify-end">
                        <Button onClick={handleSaveFeatures} disabled={isSaving}>
                            {isSaving ? 'Saving...' : (
                                <>
                                    <Save className="mr-2 h-4 w-4" />
                                    Save Changes
                                </>
                            )}
                        </Button>
                    </div>
                </TabsContent>

                {/* Activity Log Tab */}
                <TabsContent value="activity">
                    <Card>
                        <CardHeader>
                            <CardTitle>Activity Log</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {org.activity.length === 0 ? (
                                    <div className="text-center py-8 text-muted-foreground italic text-sm">
                                        No recent activity detected
                                    </div>
                                ) : org.activity.map((item: any) => (
                                    <div key={item.id} className="flex items-start gap-4 rounded-lg border p-4">
                                        <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.action}</p>
                                            <p className="text-sm text-muted-foreground">{JSON.stringify(item.metadata)}</p>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{new Date(item.created_at).toLocaleString()}</span>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
