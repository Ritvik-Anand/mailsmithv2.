'use client'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { StatCard } from '@/components/dashboard/stat-card'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    Users,
    MessageSquare,
    AlertCircle,
    Activity,
    ArrowUpRight,
    CheckCircle,
    Clock,
    Server,
    Database,
    Mail,
    Zap,
    TrendingUp,
} from 'lucide-react'
import { getAdminDashboardStats } from '@/server/actions/organizations'
import { toast } from 'sonner'

const priorityColors: Record<string, string> = {
    low: 'bg-emerald-500',
    medium: 'bg-amber-500',
    high: 'bg-rose-500',
    critical: 'bg-red-600',
}

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
    open: { label: 'Open', variant: 'outline' },
    in_progress: { label: 'In Progress', variant: 'default' },
    resolved: { label: 'Resolved', variant: 'secondary' },
}

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    const fetchStats = async () => {
        setIsLoading(true)
        try {
            const data = await getAdminDashboardStats()
            setStats(data)
        } catch (error) {
            console.error(error)
            toast.error('Failed to sync dashboard stats')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Monitor platform health and manage customers
                </p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Organizations"
                    value={isLoading ? "..." : stats?.totalOrganizations}
                    icon={Users}
                    description="Registered organizations"
                />
                <StatCard
                    title="Active Users"
                    value={isLoading ? "..." : stats?.totalUsers}
                    icon={Activity}
                    description="Total user accounts"
                />
                <StatCard
                    title="Total Leads"
                    value={isLoading ? "..." : stats?.totalLeads.toLocaleString()}
                    icon={TrendingUp}
                    description="Managed across platform"
                />
                <StatCard
                    title="Open Tickets"
                    value="0"
                    icon={MessageSquare}
                />
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Recent Customers */}
                <Card className="lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Recent Customers</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/admin/customers">
                                View all <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Organization</TableHead>
                                    <TableHead>Plan</TableHead>
                                    <TableHead className="text-right">Users</TableHead>
                                    <TableHead className="text-right">Leads</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(3).fill(0).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell className="h-12"><div className="h-4 w-24 bg-zinc-800 animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-12 bg-zinc-800 animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="h-4 w-6 ml-auto bg-zinc-800 animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="h-4 w-8 ml-auto bg-zinc-800 animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-16 bg-zinc-800 animate-pulse rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : stats?.recentOrganizations.map((customer: any) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <Link
                                                href={`/admin/customers/${customer.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {customer.name}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">
                                                Joined {new Date(customer.created_at).toLocaleDateString()}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="capitalize">{customer.plan}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{customer._count.users}</TableCell>
                                        <TableCell className="text-right">{customer._count.leads.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`h-2 w-2 rounded-full ${customer.status === 'suspended' ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                />
                                                <span className="capitalize text-sm">{customer.status || 'active'}</span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Support Queue & System Status */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Support Queue (Mocked for now) */}
                    <Card>
                        <CardHeader className="flex flex-row items-center justify-between">
                            <CardTitle>Support Queue</CardTitle>
                            <Button variant="ghost" size="sm" asChild>
                                <Link href="/admin/support">
                                    View all <ArrowUpRight className="ml-1 h-4 w-4" />
                                </Link>
                            </Button>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="text-sm text-muted-foreground italic text-center py-4">
                                No active tickets in queue
                            </div>
                        </CardContent>
                    </Card>

                    {/* System Status */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CardTitle>System Status</CardTitle>
                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500 border-none">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    All Operational
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Database className="h-4 w-4 text-muted-foreground" />
                                    <span>Supabase (DB)</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">45ms</span>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                </div>
                            </div>
                            <div className="flex items-center justify-between text-sm">
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>Instantly API</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className="text-muted-foreground">120ms</span>
                                    <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
