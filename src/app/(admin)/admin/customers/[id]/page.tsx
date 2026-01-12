'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
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
} from 'lucide-react'
import { toast } from 'sonner'

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
    Free: 'bg-gray-500',
    Starter: 'bg-blue-500',
    Pro: 'bg-purple-500',
    Enterprise: 'bg-amber-500',
}

export default function AdminCustomerDetailPage() {
    const params = useParams()
    const [features, setFeatures] = useState(mockCustomer.features)
    const [limits, setLimits] = useState(mockCustomer.limits)
    const [isSaving, setIsSaving] = useState(false)

    const handleSaveFeatures = async () => {
        setIsSaving(true)
        await new Promise((resolve) => setTimeout(resolve, 1500))
        toast.success('Features updated successfully')
        setIsSaving(false)
    }

    const handleImpersonate = (userId: string) => {
        toast.info('Opening customer dashboard in new tab...')
        // In real implementation, this would open a new tab with impersonation token
        window.open('/dashboard', '_blank')
    }

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
                        <h1 className="text-3xl font-bold tracking-tight">{mockCustomer.name}</h1>
                        <Badge className={`${planColors[mockCustomer.plan]} text-white`}>
                            {mockCustomer.plan}
                        </Badge>
                        <Badge variant={mockCustomer.status === 'active' ? 'secondary' : 'destructive'}>
                            {mockCustomer.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{mockCustomer.email}</p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => handleImpersonate(mockCustomer.users[0].id)}>
                        <UserCog className="mr-2 h-4 w-4" />
                        Impersonate
                    </Button>
                    {mockCustomer.status === 'active' ? (
                        <Button variant="destructive">
                            <Ban className="mr-2 h-4 w-4" />
                            Suspend
                        </Button>
                    ) : (
                        <Button variant="outline">
                            Reactivate
                        </Button>
                    )}
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-5">
                <StatCard title="Total Leads" value={mockCustomer.stats.leads.toLocaleString()} icon={Users} />
                <StatCard title="Campaigns" value={mockCustomer.stats.campaigns} icon={Mail} />
                <StatCard title="Emails Sent" value={mockCustomer.stats.emailsSent.toLocaleString()} icon={TrendingUp} />
                <StatCard title="Open Rate" value={`${mockCustomer.stats.openRate}%`} icon={Mail} />
                <StatCard title="Reply Rate" value={`${mockCustomer.stats.replyRate}%`} icon={TrendingUp} />
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
                                    <span className="font-medium">{mockCustomer.name}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Email</span>
                                    <span className="font-medium">{mockCustomer.email}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Plan</span>
                                    <Badge className={`${planColors[mockCustomer.plan]} text-white`}>
                                        {mockCustomer.plan}
                                    </Badge>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Created</span>
                                    <span className="font-medium">{mockCustomer.createdAt}</span>
                                </div>
                                <Separator />
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Team Members</span>
                                    <span className="font-medium">{mockCustomer.users.length}</span>
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
                                        <span>{mockCustomer.stats.leads.toLocaleString()} / {mockCustomer.limits.maxLeads.toLocaleString()}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${(mockCustomer.stats.leads / mockCustomer.limits.maxLeads) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Campaigns</span>
                                        <span>{mockCustomer.stats.campaigns} / {mockCustomer.limits.maxCampaigns}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${(mockCustomer.stats.campaigns / mockCustomer.limits.maxCampaigns) * 100}%` }}
                                        />
                                    </div>
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-2">
                                        <span>Team Members</span>
                                        <span>{mockCustomer.users.length} / {mockCustomer.limits.maxTeamMembers}</span>
                                    </div>
                                    <div className="h-2 rounded-full bg-muted">
                                        <div
                                            className="h-full rounded-full bg-primary"
                                            style={{ width: `${(mockCustomer.users.length / mockCustomer.limits.maxTeamMembers) * 100}%` }}
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
                            <CardDescription>
                                Users in this organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Last Login</TableHead>
                                        <TableHead className="w-[100px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockCustomer.users.map((user) => (
                                        <TableRow key={user.id}>
                                            <TableCell className="font-medium">{user.name}</TableCell>
                                            <TableCell>{user.email}</TableCell>
                                            <TableCell>
                                                <Badge variant={user.role === 'owner' ? 'default' : 'secondary'}>
                                                    {user.role}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">{user.lastLogin}</TableCell>
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
                                        checked={features.aiIcebreakers}
                                        onCheckedChange={(checked) => setFeatures({ ...features, aiIcebreakers: checked })}
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
                                        checked={features.csvImport}
                                        onCheckedChange={(checked) => setFeatures({ ...features, csvImport: checked })}
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
                                        checked={features.apiAccess}
                                        onCheckedChange={(checked) => setFeatures({ ...features, apiAccess: checked })}
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
                                        checked={features.customBranding}
                                        onCheckedChange={(checked) => setFeatures({ ...features, customBranding: checked })}
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
                                        checked={features.prioritySupport}
                                        onCheckedChange={(checked) => setFeatures({ ...features, prioritySupport: checked })}
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
                                        value={limits.maxLeads}
                                        onChange={(e) => setLimits({ ...limits, maxLeads: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Campaigns</Label>
                                    <Input
                                        type="number"
                                        value={limits.maxCampaigns}
                                        onChange={(e) => setLimits({ ...limits, maxCampaigns: parseInt(e.target.value) })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label>Max Team Members</Label>
                                    <Input
                                        type="number"
                                        value={limits.maxTeamMembers}
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
                            <CardDescription>
                                Recent actions by this organization
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockCustomer.activity.map((item) => (
                                    <div key={item.id} className="flex items-start gap-4 rounded-lg border p-4">
                                        <Activity className="h-5 w-5 text-muted-foreground mt-0.5" />
                                        <div className="flex-1">
                                            <p className="font-medium">{item.action}</p>
                                            <p className="text-sm text-muted-foreground">{item.details}</p>
                                        </div>
                                        <span className="text-sm text-muted-foreground">{item.timestamp}</span>
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
