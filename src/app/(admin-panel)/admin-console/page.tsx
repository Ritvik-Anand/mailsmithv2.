'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Users,
    TrendingUp,
    Globe,
    ArrowUpRight,
    Search,
    Filter,
    Activity,
    Zap
} from 'lucide-react'
import Link from 'next/link'
import { getAdminDashboardStats } from '@/server/actions/organizations'
import { toast } from 'sonner'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'

export default function AdminDashboardPage() {
    const [stats, setStats] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const data = await getAdminDashboardStats()
                setStats(data)
            } catch (error) {
                console.error(error)
                toast.error('Failed to sync management data')
            } finally {
                setIsLoading(false)
            }
        }
        fetchStats()
    }, [])

    return (
        <div className="space-y-8 pb-10">
            {/* Header Area */}
            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Admin Console</h1>
                    <p className="text-zinc-500 text-sm font-medium">Platform-wide overview and organization management.</p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="h-9 bg-zinc-900 border-zinc-800 text-xs font-semibold rounded-lg hover:border-primary/50 transition-colors">
                        <Search className="mr-2 h-3.5 w-3.5 text-zinc-500" />
                        Quick Search
                    </Button>
                    <Button className="h-9 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg shadow-lg shadow-primary/10 transition-all">
                        System Sync
                    </Button>
                </div>
            </div>

            {/* Core Metrics */}
            <div className="grid gap-4 md:grid-cols-3">
                <MetricCard
                    title="Total Organizations"
                    value={isLoading ? "..." : stats?.totalOrganizations}
                    icon={Globe}
                    trend="+12% from last month"
                />
                <MetricCard
                    title="Active User IDs"
                    value={isLoading ? "..." : stats?.totalUsers}
                    icon={Users}
                    trend="+4.5% from last month"
                />
                <MetricCard
                    title="Total Leads Managed"
                    value={isLoading ? "..." : stats?.totalLeads?.toLocaleString()}
                    icon={TrendingUp}
                    trend="+28% from last month"
                />
            </div>

            {/* Main Content Area */}
            <div className="grid gap-6 lg:grid-cols-3">
                {/* Deployment Log */}
                <Card className="lg:col-span-2 bg-zinc-950 border-zinc-800 rounded-xl overflow-hidden shadow-none">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900 px-6 py-4 bg-zinc-900/10">
                        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Recent Deployments</CardTitle>
                        <Link href="/admin-console/customers">
                            <Button variant="link" size="sm" className="text-xs text-primary hover:text-primary/80 font-bold p-0 h-auto">
                                View directory
                                <ArrowUpRight className="ml-1 h-3 w-3" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="p-0">
                        <Table>
                            <TableHeader>
                                <TableRow className="border-zinc-900 hover:bg-transparent bg-black">
                                    <TableHead className="text-[10px] font-bold text-zinc-500 pl-6 h-10 uppercase tracking-wider">Account</TableHead>
                                    <TableHead className="text-[10px] font-bold text-zinc-500 h-10 uppercase tracking-wider">Plan</TableHead>
                                    <TableHead className="text-[10px] font-bold text-zinc-500 text-right h-10 uppercase tracking-wider">Seats</TableHead>
                                    <TableHead className="text-[10px] font-bold text-zinc-500 text-right pr-6 h-10 uppercase tracking-wider">Health</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array(6).fill(0).map((_, i) => (
                                        <TableRow key={i} className="border-zinc-900/50">
                                            <TableCell className="pl-6 py-4"><div className="h-3 w-24 bg-zinc-900 animate-pulse rounded" /></TableCell>
                                            <TableCell><div className="h-3 w-12 bg-zinc-900 animate-pulse rounded" /></TableCell>
                                            <TableCell className="text-right"><div className="h-3 w-8 ml-auto bg-zinc-900 animate-pulse rounded" /></TableCell>
                                            <TableCell className="pr-6 text-right"><div className="h-3 w-16 ml-auto bg-zinc-900 animate-pulse rounded" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : stats?.recentOrganizations?.map((org: any) => (
                                    <TableRow key={org.id} className="border-zinc-900/50 hover:bg-zinc-900/30 transition-colors">
                                        <TableCell className="pl-6 py-4">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-sm text-zinc-200">{org.name}</span>
                                                <span className="text-[10px] text-zinc-600 font-medium">Created {new Date(org.created_at).toLocaleDateString()}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-[10px] font-bold text-zinc-400 px-1.5 py-0 rounded lowercase">
                                                {org.plan}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right text-xs text-zinc-500 font-mono font-bold">
                                            {org._count.users}
                                        </TableCell>
                                        <TableCell className="pr-6 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <div className={`h-1.5 w-1.5 rounded-full ${org.status === 'suspended' ? 'bg-red-500' : 'bg-primary shadow-[0_0_8px_rgba(var(--primary-rgb),0.3)]'}`} />
                                                <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
                                                    {org.status || 'Stable'}
                                                </span>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>

                {/* System Diagnostics */}
                <div className="space-y-6">
                    <Card className="bg-zinc-950 border-zinc-800 rounded-xl overflow-hidden shadow-none">
                        <CardHeader className="border-b border-zinc-900 px-6 py-4">
                            <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">System Health</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-5">
                            <HealthRow label="Core API" status="99.9% Uptime" latency="12ms" />
                            <HealthRow label="Auth Engine" status="Online" latency="24ms" />
                            <HealthRow label="Global Search" status="Optimal" latency="412ms" />
                            <HealthRow label="Database RL" status="Stable" latency="8ms" />
                        </CardContent>
                    </Card>

                    <Card className="bg-primary/5 border-primary/20 rounded-xl p-5 border shadow-[inset_0_1px_1px_rgba(255,255,255,0.05)] mb-6">
                        <div className="flex items-center gap-3 mb-3">
                            <Activity className="h-4 w-4 text-primary" />
                            <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Operational Status</span>
                        </div>
                        <p className="text-[11px] text-zinc-400 font-semibold leading-relaxed">
                            System is running at full capacity. All nodes are balanced and background scraping tasks are proceeding as scheduled.
                        </p>
                    </Card>

                    <Card className="bg-zinc-950 border-zinc-800 rounded-xl overflow-hidden shadow-none border-t-2 border-t-primary/30">
                        <CardHeader className="pb-2">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Operator Console</CardTitle>
                                <Zap className="h-4 w-4 text-primary animate-pulse" />
                            </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <p className="text-[11px] text-zinc-500 font-medium leading-relaxed">
                                Access the lead generation engine, AI campaign managers, and high-level customer operations.
                            </p>
                            <Link href="/operator">
                                <Button className="w-full h-10 bg-primary hover:bg-primary/90 text-white text-xs font-bold rounded-lg transition-all group">
                                    Launch Operator Hub
                                    <ArrowUpRight className="ml-2 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                                </Button>
                            </Link>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}

function MetricCard({ title, value, icon: Icon, trend }: any) {
    return (
        <Card className="bg-zinc-950 border-zinc-800 rounded-xl shadow-none hover:border-zinc-700 transition-colors group">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="h-10 w-10 border border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-900 group-hover:bg-primary/10 group-hover:border-primary/20 transition-all">
                        <Icon className="h-5 w-5 text-zinc-500 group-hover:text-primary transition-colors" />
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500/80 uppercase tracking-tighter bg-emerald-500/5 px-2 py-1 rounded">
                        {trend}
                    </span>
                </div>
                <div>
                    <p className="text-[11px] text-zinc-500 uppercase font-black tracking-widest mb-1">{title}</p>
                    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function HealthRow({ label, status, latency }: any) {
    return (
        <div className="flex items-center justify-between">
            <div className="flex flex-col gap-0.5">
                <span className="text-xs font-bold text-zinc-100">{label}</span>
                <span className="text-[9px] text-zinc-500 uppercase font-black tracking-widest">{status}</span>
            </div>
            <div className="flex items-center gap-3">
                <span className="text-[10px] font-mono font-bold text-zinc-600">{latency}</span>
                <div className="h-1 w-1 rounded-full bg-primary" />
            </div>
        </div>
    )
}
