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
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Admin Dashboard</h1>
                <p className="text-muted-foreground">
                    Monitor platform health and manage customers
                </p>
            </div>

            {/* Priority Alerts */}
            {mockAlerts.length > 0 && (
                <div className="space-y-2">
                    {mockAlerts.map((alert) => (
                        <Link key={alert.id} href={alert.link}>
                            <div
                                className={`flex items-center justify-between rounded-lg border p-4 transition-colors hover:bg-accent ${alert.type === 'critical' ? 'border-rose-500/50 bg-rose-500/10' : 'border-amber-500/50 bg-amber-500/10'
                                    }`}
                            >
                                <div className="flex items-center gap-3">
                                    <AlertCircle
                                        className={`h-5 w-5 ${alert.type === 'critical' ? 'text-rose-500' : 'text-amber-500'}`}
                                    />
                                    <span className="font-medium">{alert.message}</span>
                                </div>
                                <ArrowUpRight className="h-4 w-4 text-muted-foreground" />
                            </div>
                        </Link>
                    ))}
                </div>
            )}

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Organizations"
                    value={mockStats.totalOrganizations}
                    icon={Users}
                    trend={{ value: 12, isPositive: true }}
                    description="from last month"
                />
                <StatCard
                    title="Active Users (24h)"
                    value={mockStats.activeUsers}
                    icon={Activity}
                />
                <StatCard
                    title="Total Leads"
                    value={mockStats.totalLeads.toLocaleString()}
                    icon={TrendingUp}
                />
                <StatCard
                    title="Open Tickets"
                    value={mockStats.openTickets}
                    icon={MessageSquare}
                    className={mockStats.openTickets > 5 ? 'border-amber-500/50' : ''}
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
                                {mockRecentCustomers.map((customer) => (
                                    <TableRow key={customer.id}>
                                        <TableCell>
                                            <Link
                                                href={`/admin/customers/${customer.id}`}
                                                className="font-medium hover:underline"
                                            >
                                                {customer.name}
                                            </Link>
                                            <div className="text-xs text-muted-foreground">
                                                Joined {customer.joinedAt}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{customer.plan}</Badge>
                                        </TableCell>
                                        <TableCell className="text-right">{customer.users}</TableCell>
                                        <TableCell className="text-right">{customer.leads.toLocaleString()}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`h-2 w-2 rounded-full ${customer.status === 'active' ? 'bg-emerald-500' : 'bg-amber-500'
                                                        }`}
                                                />
                                                <span className="capitalize text-sm">{customer.status}</span>
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
