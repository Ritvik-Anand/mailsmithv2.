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
    RefreshCw,
} from 'lucide-react'
import { getAdminDashboardStats } from '@/server/actions/organizations'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

// Mock data
const mockStats = {
    totalOrganizations: 156,
    activeUsers: 342,
    totalLeads: 125000,
    openTickets: 8,
}

const mockAlerts = [
    {
        id: '1',
        type: 'critical',
        message: '3 critical support tickets need attention',
        link: '/admin/support',
    },
    {
        id: '2',
        type: 'warning',
        message: '5 customers approaching plan limits',
        link: '/admin/customers',
    },
]

const mockRecentCustomers = [
    {
        id: '1',
        name: 'Acme Corp',
        plan: 'Pro',
        users: 5,
        leads: 4521,
        status: 'active',
        joinedAt: '2026-01-10',
    },
    {
        id: '2',
        name: 'StartupXYZ',
        plan: 'Starter',
        users: 2,
        leads: 890,
        status: 'active',
        joinedAt: '2026-01-08',
    },
    {
        id: '3',
        name: 'TechVentures',
        plan: 'Free',
        users: 1,
        leads: 45,
        status: 'trial',
        joinedAt: '2026-01-12',
    },
]

const mockRecentTickets = [
    {
        id: '1',
        title: 'Campaign not sending emails',
        customer: 'Acme Corp',
        priority: 'high',
        status: 'open',
        createdAt: '2 hours ago',
    },
    {
        id: '2',
        title: 'LinkedIn scraper timeout',
        customer: 'StartupXYZ',
        priority: 'medium',
        status: 'in_progress',
        createdAt: '5 hours ago',
    },
    {
        id: '3',
        title: 'How to import CSV?',
        customer: 'TechVentures',
        priority: 'low',
        status: 'open',
        createdAt: '1 day ago',
    },
]

const mockServiceStatus = [
    { name: 'Supabase (DB)', status: 'operational', latency: '45ms' },
    { name: 'Instantly API', status: 'operational', latency: '120ms' },
    { name: 'Apify', status: 'operational', latency: '200ms' },
    { name: 'Anthropic AI', status: 'operational', latency: '800ms' },
]

const planColors: Record<string, string> = {
    free: 'bg-zinc-800 text-zinc-400',
    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

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
            toast.error('Global downlink failure: Sync failed')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchStats()
    }, [])

    return (
        <div className="space-y-8 animate-in fade-in duration-700">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight italic">Universal Command</h1>
                    <p className="text-zinc-500">
                        Global platform health and fleet monitoring
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchStats} className="border-zinc-800">
                    <RefreshCw className={cn("h-4 w-4 text-zinc-500", isLoading && "animate-spin")} />
                </Button>
            </div>

            {/* Priority Alerts */}
            <div className="space-y-2">
                <div className="flex items-center justify-between rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 transition-all hover:bg-emerald-500/10">
                    <div className="flex items-center gap-3">
                        <CheckCircle className="h-5 w-5 text-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />
                        <span className="font-bold text-emerald-400 uppercase text-xs tracking-widest">All core systems are operational</span>
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Fleet"
                    value={isLoading ? "..." : stats?.totalOrganizations}
                    icon={Users}
                    description="Registered organizations"
                />
                <StatCard
                    title="Total Inhabitants"
                    value={isLoading ? "..." : stats?.totalUsers}
                    icon={Activity}
                    description="Synchronized user profiles"
                />
                <StatCard
                    title="Propulsion Leads"
                    value={isLoading ? "..." : stats?.totalLeads.toLocaleString()}
                    icon={TrendingUp}
                    description="Active prospect nodes"
                />
                <StatCard
                    title="System Uptime"
                    value="99.9%"
                    icon={Server}
                    className="border-emerald-500/20"
                />
            </div>

            {/* Main Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Recent Customers */}
                <Card className="lg:col-span-4 bg-zinc-900/50 border-zinc-800 overflow-hidden">
                    <CardHeader className="flex flex-row items-center justify-between bg-zinc-900/50 border-b border-zinc-800">
                        <CardTitle className="text-lg italic underline underline-offset-4 decoration-primary/50">Recent Deployments</CardTitle>
                        <Button variant="ghost" size="sm" asChild className="text-zinc-500 hover:text-primary">
                            <Link href="/admin/customers">
                                See Full Fleet <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader className="bg-zinc-900/30">
                                <TableRow className="border-zinc-800 hover:bg-transparent">
                                    <TableHead className="text-[10px] uppercase font-bold tracking-tighter text-zinc-500">Sub-Sector</TableHead>
                                    <TableHead className="text-[10px] uppercase font-bold tracking-tighter text-zinc-500">Clearance</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-bold tracking-tighter text-zinc-500">Nodes</TableHead>
                                    <TableHead className="text-right text-[10px] uppercase font-bold tracking-tighter text-zinc-500">Signal</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(5).fill(0).map((_, i) => (
                                        <TableRow key={i} className="border-zinc-800">
                                            <TableCell className="h-12"><div className="h-4 w-24 bg-zinc-800 animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-4 w-12 bg-zinc-800 animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="h-4 w-6 ml-auto bg-zinc-800 animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="h-4 w-8 ml-auto bg-zinc-800 animate-pulse rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : stats?.recentOrganizations.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-48 text-center text-zinc-600 italic">
                                            No active deployments detected.
                                        </TableCell>
                                    </TableRow>
                                ) : (
                                    stats?.recentOrganizations.map((customer: any) => (
                                        <TableRow key={customer.id} className="border-zinc-800 hover:bg-zinc-800/20 transition-colors">
                                            <TableCell>
                                                <Link
                                                    href={`/admin/customers/${customer.id}`}
                                                    className="font-bold text-zinc-200 hover:text-primary transition-colors text-sm"
                                                >
                                                    {customer.name}
                                                </Link>
                                                <div className="text-[10px] text-zinc-500 font-mono">
                                                    Registered {new Date(customer.created_at).toLocaleDateString()}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className={cn("uppercase text-[9px] font-black tracking-widest", planColors[customer.plan])}>
                                                    {customer.plan}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right font-mono text-xs">{customer._count.users}</TableCell>
                                            <TableCell className="text-right font-mono text-xs">{customer._count.leads.toLocaleString()}</TableCell>
                                        </TableRow>
                                    ))
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* Support Queue & System Status */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Support Queue */}
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
                            {mockRecentTickets.map((ticket) => (
                                <div
                                    key={ticket.id}
                                    className="flex items-start gap-3 rounded-lg border p-3"
                                >
                                    <div className={`mt-1 h-2 w-2 rounded-full ${priorityColors[ticket.priority]}`} />
                                    <div className="flex-1 space-y-1">
                                        <p className="text-sm font-medium">{ticket.title}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {ticket.customer} • {ticket.createdAt}
                                        </p>
                                    </div>
                                    <Badge variant={statusConfig[ticket.status].variant}>
                                        {statusConfig[ticket.status].label}
                                    </Badge>
                                </div>
                            ))}
                        </CardContent>
                    </Card>

                    {/* System Status */}
                    <Card>
                        <CardHeader>
                            <div className="flex items-center gap-2">
                                <CardTitle>System Status</CardTitle>
                                <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-500">
                                    <CheckCircle className="mr-1 h-3 w-3" />
                                    All Operational
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {mockServiceStatus.map((service, index) => (
                                <div key={index} className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2">
                                        {service.name.includes('Supabase') && <Database className="h-4 w-4 text-muted-foreground" />}
                                        {service.name.includes('Instantly') && <Mail className="h-4 w-4 text-muted-foreground" />}
                                        {service.name.includes('Apify') && <Server className="h-4 w-4 text-muted-foreground" />}
                                        {service.name.includes('Anthropic') && <Zap className="h-4 w-4 text-muted-foreground" />}
                                        <span>{service.name}</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-muted-foreground">{service.latency}</span>
                                        <div className="h-2 w-2 rounded-full bg-emerald-500" />
                                    </div>
                                </div>
                            ))}
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
