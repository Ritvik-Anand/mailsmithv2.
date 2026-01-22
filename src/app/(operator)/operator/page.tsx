'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
    Users,
    Mail,
    MessageSquare,
    ClipboardList,
    TrendingUp,
    AlertTriangle,
    ArrowRight,
    Clock,
    CheckCircle2,
    Target,
    Loader2
} from 'lucide-react'
import Link from 'next/link'
import { ScrapeJob } from '@/types'

// Mock data - will be replaced with real data
const mockStats = {
    assignedCustomers: 12,
    pendingTasks: 5,
    unreadReplies: 23,
    activeJobs: 3,
}

const mockTaskQueue = [
    { id: '1', type: 'reply', customer: 'Acme Corp', title: 'Handle positive reply from John Smith', priority: 'high', time: '5 min ago' },
    { id: '2', type: 'approval', customer: 'TechVentures', title: 'Approve 150 scraped leads', priority: 'medium', time: '1 hour ago' },
    { id: '3', type: 'review', customer: 'StartupXYZ', title: 'Review email sequence draft', priority: 'low', time: '2 hours ago' },
    { id: '4', type: 'scrape', customer: 'GlobalTech', title: 'Scrape job completed - 500 leads', priority: 'medium', time: '3 hours ago' },
]

const mockCustomerHealth = [
    { id: '1', name: 'Acme Corp', health: 95, leads: 2450, openRate: 34, replyRate: 8.5, status: 'excellent' },
    { id: '2', name: 'TechVentures', health: 82, leads: 1200, openRate: 28, replyRate: 6.2, status: 'good' },
    { id: '3', name: 'StartupXYZ', health: 68, leads: 890, openRate: 22, replyRate: 4.1, status: 'attention' },
    { id: '4', name: 'GlobalTech', health: 100, leads: 3200, openRate: 38, replyRate: 10.2, status: 'excellent' },
]

import { getSearchJobs } from '@/server/actions/lead-finder'
import { useState, useEffect } from 'react'

export default function OperatorDashboardPage() {
    const [jobs, setJobs] = useState<ScrapeJob[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function fetchJobs() {
            const res = await getSearchJobs({ limit: 5 })
            if (res.success && res.jobs) {
                setJobs(res.jobs)
            }
            setIsLoading(false)
        }
        fetchJobs()
    }, [])

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">Operator Dashboard</h1>
                    <p className="text-zinc-500 font-medium">Manage outreach operations for your assigned customers.</p>
                </div>
                <Link href="/operator/scraper">
                    <Button className="bg-primary hover:bg-primary/90 text-white font-bold px-6 shadow-lg shadow-primary/20">
                        <Target className="mr-2 h-4 w-4" />
                        Launch Scraper
                    </Button>
                </Link>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <StatCard
                    title="Assigned Customers"
                    value={mockStats.assignedCustomers}
                    icon={Users}
                    color="text-blue-500"
                    bgColor="bg-blue-500/10"
                />
                <StatCard
                    title="Pending Tasks"
                    value={mockStats.pendingTasks}
                    icon={ClipboardList}
                    color="text-amber-500"
                    bgColor="bg-amber-500/10"
                    alert
                />
                <StatCard
                    title="Active Scrape Jobs"
                    value={jobs.filter(j => j.status === 'running').length}
                    icon={Target}
                    color="text-purple-500"
                    bgColor="bg-purple-500/10"
                />
            </div>

            {/* Jobs & Health */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Real Scrape Jobs */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Recent Scrape Jobs</CardTitle>
                        <Link href="/operator/scraper">
                            <Button variant="ghost" size="sm">
                                New Job
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {isLoading ? (
                            <div className="flex justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                            </div>
                        ) : jobs.length === 0 ? (
                            <div className="text-center py-8 border-2 border-dashed rounded-lg">
                                <p className="text-sm text-zinc-500">No recent jobs found.</p>
                            </div>
                        ) : (
                            jobs.map((job) => (
                                <Link key={job.id} href={`/operator/leads/${job.id}`}>
                                    <div
                                        className="flex items-start gap-4 p-3 rounded-lg border hover:bg-accent/50 transition-colors mb-3"
                                    >
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${job.status === 'running' ? 'bg-purple-500/10' :
                                            job.status === 'completed' ? 'bg-green-500/10' :
                                                'bg-zinc-500/10'
                                            }`}>
                                            <Target className={`h-5 w-5 ${job.status === 'running' ? 'text-purple-500' : job.status === 'completed' ? 'text-green-500' : 'text-zinc-500'}`} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {job.status}
                                                </Badge>
                                                <span className="text-[10px] text-zinc-500 font-mono">{job.id.slice(0, 8)}</span>
                                            </div>
                                            <p className="text-sm font-medium truncate">
                                                {job.input_params.contact_job_title?.join(', ') || 'General Search'}
                                            </p>
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {job.leads_imported || 0} leads found • {new Date(job.created_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                        <Button variant="ghost" size="sm">
                                            Manage
                                        </Button>
                                    </div>
                                </Link>
                            ))
                        )}
                    </CardContent>
                </Card>

                {/* Customer Health */}
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg">Customer Health</CardTitle>
                        <Link href="/operator/customers">
                            <Button variant="ghost" size="sm">
                                View all
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {mockCustomerHealth.map((customer) => (
                            <div
                                key={customer.id}
                                className="flex items-center justify-between p-3 rounded-lg border"
                            >
                                <div className="flex items-center gap-3">
                                    <HealthIndicator score={customer.health} />
                                    <div>
                                        <p className="font-medium">{customer.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            {customer.leads.toLocaleString()} leads • {customer.openRate}% open • {customer.replyRate}% reply
                                        </p>
                                    </div>
                                </div>
                                <StatusBadge status={customer.status} />
                            </div>
                        ))}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Actions */}
            <Card>
                <CardHeader>
                    <CardTitle className="text-lg">Quick Actions</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid gap-4 md:grid-cols-4">
                        <Link href="/operator/scraper">
                            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2 border-primary/20 bg-primary/5">
                                <Target className="h-6 w-6 text-primary" />
                                <span className="font-bold">New Scrape Job</span>
                            </Button>
                        </Link>
                        <Link href="/operator/inbox">
                            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                                <MessageSquare className="h-6 w-6 text-green-500" />
                                <span>Check Replies</span>
                            </Button>
                        </Link>
                        <Link href="/operator/campaigns">
                            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                                <Mail className="h-6 w-6 text-blue-500" />
                                <span>Manage Campaigns</span>
                            </Button>
                        </Link>
                        <Link href="/operator/queue">
                            <Button variant="outline" className="w-full h-auto py-4 flex flex-col gap-2">
                                <ClipboardList className="h-6 w-6 text-amber-500" />
                                <span>View All Tasks</span>
                            </Button>
                        </Link>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// Helper Components
function StatCard({
    title,
    value,
    icon: Icon,
    color,
    bgColor,
    alert = false
}: {
    title: string
    value: number
    icon: any
    color: string
    bgColor: string
    alert?: boolean
}) {
    return (
        <Card className={alert && value > 0 ? 'border-amber-500/50' : ''}>
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-lg ${bgColor}`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    {alert && value > 0 && (
                        <AlertTriangle className="h-5 w-5 text-amber-500" />
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-2xl font-bold">{value}</p>
                    <p className="text-sm text-muted-foreground mt-1">{title}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function TaskIcon({ type, priority }: { type: string; priority: string }) {
    const color = priority === 'high' ? 'text-red-500' :
        priority === 'medium' ? 'text-amber-500' :
            'text-blue-500'

    switch (type) {
        case 'reply':
            return <MessageSquare className={`h-5 w-5 ${color}`} />
        case 'approval':
            return <CheckCircle2 className={`h-5 w-5 ${color}`} />
        case 'review':
            return <Mail className={`h-5 w-5 ${color}`} />
        case 'scrape':
            return <Target className={`h-5 w-5 ${color}`} />
        default:
            return <ClipboardList className={`h-5 w-5 ${color}`} />
    }
}

function PriorityBadge({ priority }: { priority: string }) {
    const styles = {
        high: 'bg-red-500/10 text-red-500 border-red-500/20',
        medium: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
        low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
    }

    return (
        <Badge variant="outline" className={`text-xs ${styles[priority as keyof typeof styles]}`}>
            {priority}
        </Badge>
    )
}

function HealthIndicator({ score }: { score: number }) {
    const color = score >= 90 ? 'bg-green-500' :
        score >= 70 ? 'bg-yellow-500' :
            'bg-red-500'

    return (
        <div className="relative h-10 w-10">
            <svg className="h-10 w-10 -rotate-90" viewBox="0 0 36 36">
                <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className="stroke-muted"
                    strokeWidth="2"
                />
                <circle
                    cx="18"
                    cy="18"
                    r="16"
                    fill="none"
                    className={score >= 90 ? 'stroke-green-500' : score >= 70 ? 'stroke-yellow-500' : 'stroke-red-500'}
                    strokeWidth="2"
                    strokeDasharray={`${score}, 100`}
                    strokeLinecap="round"
                />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center text-xs font-medium">
                {score}
            </span>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const styles = {
        excellent: 'bg-green-500/10 text-green-500',
        good: 'bg-blue-500/10 text-blue-500',
        attention: 'bg-amber-500/10 text-amber-500',
        critical: 'bg-red-500/10 text-red-500',
    }

    return (
        <Badge className={styles[status as keyof typeof styles]}>
            {status}
        </Badge>
    )
}
