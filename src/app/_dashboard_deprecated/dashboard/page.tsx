import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { StatCard, PercentageRing } from '@/components/dashboard/stat-card'
import {
    Mail,
    Users,
    TrendingUp,
    ArrowUpRight,
    Zap,
    Eye,
    MessageSquare,
    AlertCircle,
    Plus,
    FileText,
} from 'lucide-react'

// Mock data - will be replaced with real data
const mockStats = {
    activeCampaigns: 3,
    totalLeads: 4521,
    emailsSent: 12450,
    openRate: 32,
    replyRate: 8,
    bounceRate: 2,
}

const mockCampaigns = [
    {
        id: '1',
        name: 'Q1 Outreach - Tech Founders',
        status: 'active',
        leads: 450,
        openRate: 32,
        replyRate: 8,
    },
    {
        id: '2',
        name: 'Product Launch - VCs',
        status: 'active',
        leads: 120,
        openRate: 28,
        replyRate: 5,
    },
    {
        id: '3',
        name: 'Follow-up Sequence',
        status: 'active',
        leads: 89,
        openRate: 45,
        replyRate: 12,
    },
]

const mockLeadBreakdown = {
    new: 1250,
    contacted: 2100,
    opened: 890,
    replied: 180,
    noReply: 1920,
    bounced: 81,
}

const mockRecentActivity = [
    { id: '1', type: 'reply', message: 'John Smith replied to Q1 Outreach', time: '2 min ago' },
    { id: '2', type: 'open', message: '15 new opens on Product Launch campaign', time: '15 min ago' },
    { id: '3', type: 'lead', message: '50 new leads imported from LinkedIn', time: '1 hour ago' },
    { id: '4', type: 'campaign', message: 'Follow-up Sequence started', time: '2 hours ago' },
]

export default function DashboardPage() {
    return (
        <div className="space-y-8">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
                    <p className="text-muted-foreground">
                        Welcome back! Here's your outreach overview.
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <FileText className="mr-2 h-4 w-4" />
                        Generate Report
                    </Button>
                    <Button>
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Button>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Active Campaigns"
                    value={mockStats.activeCampaigns}
                    icon={Mail}
                    trend={{ value: 12, isPositive: true }}
                    description="from last month"
                />
                <StatCard
                    title="Total Leads"
                    value={mockStats.totalLeads.toLocaleString()}
                    icon={Users}
                    trend={{ value: 8, isPositive: true }}
                    description="from last month"
                />
                <StatCard
                    title="Emails Sent"
                    value={mockStats.emailsSent.toLocaleString()}
                    icon={TrendingUp}
                    trend={{ value: 24, isPositive: true }}
                    description="this month"
                />
                <StatCard
                    title="Reply Rate"
                    value={`${mockStats.replyRate}%`}
                    icon={MessageSquare}
                    trend={{ value: 2.5, isPositive: true }}
                    description="from last month"
                />
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Performance Metrics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-around">
                        <PercentageRing value={mockStats.openRate} title="Open Rate" />
                        <PercentageRing value={mockStats.replyRate} title="Reply Rate" />
                        <PercentageRing value={mockStats.bounceRate} title="Bounce Rate" />
                    </div>
                </CardContent>
            </Card>

            {/* Main Content Grid */}
            <div className="grid gap-6 lg:grid-cols-7">
                {/* Campaigns Table */}
                <Card className="lg:col-span-4">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle>Active Campaigns</CardTitle>
                        <Button variant="ghost" size="sm" asChild>
                            <Link href="/dashboard/campaigns">
                                View all <ArrowUpRight className="ml-1 h-4 w-4" />
                            </Link>
                        </Button>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockCampaigns.map((campaign) => (
                                <div
                                    key={campaign.id}
                                    className="flex items-center justify-between rounded-lg border p-4 hover:bg-accent/50 transition-colors cursor-pointer"
                                >
                                    <div className="space-y-1">
                                        <div className="flex items-center gap-2">
                                            <span className="font-medium">{campaign.name}</span>
                                            <Badge variant="secondary" className="capitalize">
                                                {campaign.status}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {campaign.leads} leads
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-6 text-sm">
                                        <div className="text-center">
                                            <div className="font-medium">{campaign.openRate}%</div>
                                            <div className="text-muted-foreground text-xs">Opens</div>
                                        </div>
                                        <div className="text-center">
                                            <div className="font-medium">{campaign.replyRate}%</div>
                                            <div className="text-muted-foreground text-xs">Replies</div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Lead Breakdown + Activity Feed */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Lead Breakdown */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Lead Breakdown</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            {Object.entries(mockLeadBreakdown).map(([key, value]) => {
                                const labels: Record<string, { label: string; color: string }> = {
                                    new: { label: 'New', color: 'bg-blue-500' },
                                    contacted: { label: 'Contacted', color: 'bg-indigo-500' },
                                    opened: { label: 'Opened', color: 'bg-purple-500' },
                                    replied: { label: 'Replied', color: 'bg-emerald-500' },
                                    noReply: { label: 'No Reply', color: 'bg-amber-500' },
                                    bounced: { label: 'Bounced', color: 'bg-rose-500' },
                                }
                                const { label, color } = labels[key]
                                const total = Object.values(mockLeadBreakdown).reduce((a, b) => a + b, 0)
                                const percentage = Math.round((value / total) * 100)

                                return (
                                    <div key={key} className="space-y-2">
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${color}`} />
                                                <span>{label}</span>
                                            </div>
                                            <span className="font-medium">{value.toLocaleString()}</span>
                                        </div>
                                        <Progress value={percentage} className="h-1" />
                                    </div>
                                )
                            })}
                        </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Recent Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {mockRecentActivity.map((activity) => {
                                    const icons: Record<string, React.ReactNode> = {
                                        reply: <MessageSquare className="h-4 w-4 text-emerald-500" />,
                                        open: <Eye className="h-4 w-4 text-blue-500" />,
                                        lead: <Users className="h-4 w-4 text-purple-500" />,
                                        campaign: <Zap className="h-4 w-4 text-amber-500" />,
                                    }

                                    return (
                                        <div key={activity.id} className="flex items-start gap-3">
                                            <div className="mt-0.5">{icons[activity.type]}</div>
                                            <div className="flex-1 space-y-1">
                                                <p className="text-sm">{activity.message}</p>
                                                <p className="text-xs text-muted-foreground">{activity.time}</p>
                                            </div>
                                        </div>
                                    )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>

            {/* Quick Actions */}
            <Card className="bg-gradient-to-r from-primary/10 via-primary/5 to-transparent border-primary/20">
                <CardContent className="py-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h3 className="font-semibold">Ready to grow your outreach?</h3>
                            <p className="text-sm text-muted-foreground">
                                Start a new campaign or scrape more leads to fuel your pipeline.
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <Button variant="outline" asChild>
                                <Link href="/dashboard/leads">
                                    <Users className="mr-2 h-4 w-4" />
                                    Scrape Leads
                                </Link>
                            </Button>
                            <Button asChild>
                                <Link href="/dashboard/campaigns/new">
                                    <Plus className="mr-2 h-4 w-4" />
                                    New Campaign
                                </Link>
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
