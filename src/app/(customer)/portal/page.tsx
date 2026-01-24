import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    TrendingUp,
    TrendingDown,
    Mail,
    Users,
    MousePointer2,
    MessageSquare,
    Sparkles,
    ArrowRight,
    Clock,
    Zap,
    Target,
    BarChart3,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import {
    getPortalMetrics,
    getPortalCampaigns,
    getPortalActivity,
    getPortalLeadsSummary
} from '@/server/actions/customer-portal'

export default async function CustomerPortalPage() {
    // Fetch real data from server actions
    const [metricsResult, campaignsResult, activityResult, leadsSummaryResult] = await Promise.all([
        getPortalMetrics(),
        getPortalCampaigns(),
        getPortalActivity(),
        getPortalLeadsSummary()
    ])

    const metrics = metricsResult.success ? metricsResult.metrics! : {
        totalLeads: 0,
        leadsChange: 0,
        emailsSent: 0,
        emailsChange: 0,
        openRate: 0,
        openRateChange: 0,
        replyRate: 0,
        replyRateChange: 0
    }

    const campaigns = campaignsResult.success ? campaignsResult.campaigns! : []
    const activities = activityResult.success ? activityResult.activities! : []
    const leadsSummary = leadsSummaryResult.success ? leadsSummaryResult.summary! : {
        total: 0,
        withEmail: 0,
        withIcebreaker: 0,
        inCampaign: 0,
        byStatus: {}
    }

    const hasData = metrics.totalLeads > 0 || campaigns.length > 0

    return (
        <div className="space-y-8">
            {/* Welcome Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold text-white">Welcome back</h1>
                <p className="text-white/50">Here's an overview of your outreach performance</p>
            </div>

            {/* Key Metrics Grid */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Total Leads"
                    value={metrics.totalLeads.toLocaleString()}
                    change={metrics.leadsChange}
                    icon={Users}
                />
                <MetricCard
                    title="Emails Sent"
                    value={metrics.emailsSent.toLocaleString()}
                    change={metrics.emailsChange}
                    icon={Mail}
                />
                <MetricCard
                    title="Open Rate"
                    value={`${metrics.openRate}%`}
                    change={metrics.openRateChange}
                    icon={MousePointer2}
                    suffix="%"
                />
                <MetricCard
                    title="Reply Rate"
                    value={`${metrics.replyRate}%`}
                    change={metrics.replyRateChange}
                    icon={MessageSquare}
                    suffix="%"
                />
            </div>

            {/* Lead Pipeline Summary */}
            {leadsSummary.total > 0 && (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white flex items-center gap-2">
                            <Target className="h-5 w-5 text-primary" />
                            Lead Pipeline
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <PipelineCard
                                label="Total Leads"
                                value={leadsSummary.total}
                                color="text-white"
                            />
                            <PipelineCard
                                label="With Icebreaker"
                                value={leadsSummary.withIcebreaker}
                                color="text-amber-400"
                                percentage={leadsSummary.total > 0 ? Math.round((leadsSummary.withIcebreaker / leadsSummary.total) * 100) : 0}
                            />
                            <PipelineCard
                                label="In Campaign"
                                value={leadsSummary.inCampaign}
                                color="text-blue-400"
                                percentage={leadsSummary.total > 0 ? Math.round((leadsSummary.inCampaign / leadsSummary.total) * 100) : 0}
                            />
                            <PipelineCard
                                label="Replied"
                                value={leadsSummary.byStatus['replied'] || 0}
                                color="text-green-400"
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Campaign Progress & Activity */}
            <div className="grid gap-6 lg:grid-cols-2">
                {/* Campaign Progress */}
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader className="flex flex-row items-center justify-between">
                        <CardTitle className="text-lg font-semibold text-white">Campaign Progress</CardTitle>
                        <Link href="/portal/campaigns">
                            <Button variant="ghost" size="sm" className="text-white/50 hover:text-white">
                                View all
                                <ArrowRight className="ml-1 h-4 w-4" />
                            </Button>
                        </Link>
                    </CardHeader>
                    <CardContent>
                        {campaigns.length > 0 ? (
                            <div className="space-y-6">
                                {campaigns.map((campaign) => (
                                    <div key={campaign.id} className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <span className="font-medium text-white">{campaign.name}</span>
                                                <Badge
                                                    variant={campaign.status === 'completed' ? 'secondary' : 'default'}
                                                    className={campaign.status === 'completed'
                                                        ? 'bg-green-500/10 text-green-400'
                                                        : campaign.status === 'active'
                                                            ? 'bg-primary/20 text-primary'
                                                            : 'bg-zinc-500/20 text-zinc-400'
                                                    }
                                                >
                                                    {campaign.status}
                                                </Badge>
                                            </div>
                                            <span className="text-sm text-white/50">{campaign.progress}%</span>
                                        </div>
                                        <Progress
                                            value={campaign.progress}
                                            className="h-2 bg-white/5"
                                        />
                                        <div className="flex items-center gap-4 text-xs text-white/40">
                                            <span>{campaign.totalLeads} leads</span>
                                            <span>{campaign.openRate}% open rate</span>
                                            <span>{campaign.replyRate}% reply rate</span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={BarChart3}
                                title="No campaigns yet"
                                description="Your campaign performance will appear here once campaigns are launched."
                            />
                        )}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        {activities.length > 0 ? (
                            <div className="space-y-4">
                                {activities.map((activity) => (
                                    <div
                                        key={activity.id}
                                        className={`flex items-start gap-4 p-3 rounded-xl transition-colors ${activity.highlight ? 'bg-primary/10 border border-primary/20' : ''
                                            }`}
                                    >
                                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${activity.highlight ? 'bg-primary/20' : 'bg-white/5'
                                            }`}>
                                            <ActivityIcon type={activity.type} highlight={activity.highlight} />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className={`text-sm font-medium ${activity.highlight ? 'text-white' : 'text-white/80'}`}>
                                                {activity.title}
                                            </p>
                                            <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                                                <Clock className="h-3 w-3" />
                                                {activity.time}
                                            </p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <EmptyState
                                icon={Zap}
                                title="No recent activity"
                                description="Activity like new leads, icebreakers, and campaign updates will appear here."
                            />
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* AI Assistant Prompt */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                <CardContent className="flex flex-col md:flex-row items-center justify-between gap-4 p-6">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/20">
                            <Sparkles className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-white">Have questions about your performance?</h3>
                            <p className="text-sm text-white/50">Ask our AI assistant for insights and recommendations</p>
                        </div>
                    </div>
                    <Link href="/portal/assistant">
                        <Button className="bg-primary hover:bg-primary/90">
                            Start Conversation
                            <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>

            {/* Getting Started - Only show if no data */}
            {!hasData && (
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-8 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                            <Zap className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">Get Started with MailSmith</h3>
                        <p className="text-white/50 max-w-md mx-auto mb-6">
                            Your dashboard is ready! Once your operator adds leads and launches campaigns,
                            your performance metrics will appear here.
                        </p>
                        <div className="flex flex-wrap gap-3 justify-center">
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-white/60">
                                <span className="h-2 w-2 rounded-full bg-amber-500"></span>
                                Leads being sourced
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-white/60">
                                <span className="h-2 w-2 rounded-full bg-blue-500"></span>
                                AI icebreakers ready
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-full text-sm text-white/60">
                                <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                Campaigns launching soon
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

// =============================================================================
// Helper Components
// =============================================================================

function MetricCard({
    title,
    value,
    change,
    icon: Icon,
    suffix = ''
}: {
    title: string
    value: string
    change: number
    icon: any
    suffix?: string
}) {
    const isPositive = change >= 0

    return (
        <Card className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {change !== 0 && (
                        <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                            {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span>{isPositive ? '+' : ''}{change}{suffix}</span>
                        </div>
                    )}
                </div>
                <div className="mt-4">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-white/40 mt-1">{title}</p>
                </div>
            </CardContent>
        </Card>
    )
}

function PipelineCard({
    label,
    value,
    color,
    percentage
}: {
    label: string
    value: number
    color: string
    percentage?: number
}) {
    return (
        <div className="p-4 rounded-xl bg-white/[0.02] border border-white/5">
            <p className={`text-2xl font-bold ${color}`}>{value.toLocaleString()}</p>
            <p className="text-xs text-white/40 mt-1">{label}</p>
            {percentage !== undefined && (
                <p className="text-xs text-white/30 mt-0.5">{percentage}% of total</p>
            )}
        </div>
    )
}

function ActivityIcon({ type, highlight }: { type: string; highlight: boolean }) {
    const className = `h-5 w-5 ${highlight ? 'text-primary' : 'text-white/40'}`

    switch (type) {
        case 'reply':
            return <MessageSquare className={className} />
        case 'open':
            return <MousePointer2 className={className} />
        case 'lead':
            return <Users className={className} />
        case 'campaign':
            return <Mail className={className} />
        case 'icebreaker':
            return <Sparkles className={className} />
        default:
            return <Mail className={className} />
    }
}

function EmptyState({
    icon: Icon,
    title,
    description
}: {
    icon: any
    title: string
    description: string
}) {
    return (
        <div className="flex flex-col items-center justify-center py-8 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/5 mb-3">
                <Icon className="h-6 w-6 text-white/30" />
            </div>
            <p className="text-sm font-medium text-white/60">{title}</p>
            <p className="text-xs text-white/40 mt-1 max-w-[200px]">{description}</p>
        </div>
    )
}
