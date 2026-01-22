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
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'

// Mock data - will be replaced with real data fetching
const mockMetrics = {
    totalLeads: 2450,
    leadsChange: 12,
    emailsSent: 1890,
    emailsChange: 8,
    openRate: 34.2,
    openRateChange: 2.1,
    replyRate: 8.5,
    replyRateChange: 0.8,
}

const mockCampaigns = [
    { id: '1', name: 'Q1 Tech Founders', status: 'active', progress: 72, leads: 450, openRate: 36 },
    { id: '2', name: 'SaaS CMO Outreach', status: 'active', progress: 48, leads: 320, openRate: 31 },
    { id: '3', name: 'Series A Founders', status: 'completed', progress: 100, leads: 180, openRate: 42 },
]

const mockActivity = [
    { id: '1', type: 'reply', title: '12 new replies today', time: '2 min ago', highlight: true },
    { id: '2', type: 'open', title: '45 emails opened', time: '15 min ago', highlight: false },
    { id: '3', type: 'lead', title: '200 new leads added', time: '1 hour ago', highlight: false },
    { id: '4', type: 'campaign', title: 'Q1 Tech Founders hit 70%', time: '2 hours ago', highlight: false },
]

export default function CustomerPortalPage() {
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
                    value={mockMetrics.totalLeads.toLocaleString()}
                    change={mockMetrics.leadsChange}
                    icon={Users}
                />
                <MetricCard
                    title="Emails Sent"
                    value={mockMetrics.emailsSent.toLocaleString()}
                    change={mockMetrics.emailsChange}
                    icon={Mail}
                />
                <MetricCard
                    title="Open Rate"
                    value={`${mockMetrics.openRate}%`}
                    change={mockMetrics.openRateChange}
                    icon={MousePointer2}
                    suffix="%"
                />
                <MetricCard
                    title="Reply Rate"
                    value={`${mockMetrics.replyRate}%`}
                    change={mockMetrics.replyRateChange}
                    icon={MessageSquare}
                    suffix="%"
                />
            </div>

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
                    <CardContent className="space-y-6">
                        {mockCampaigns.map((campaign) => (
                            <div key={campaign.id} className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <span className="font-medium text-white">{campaign.name}</span>
                                        <Badge
                                            variant={campaign.status === 'completed' ? 'secondary' : 'default'}
                                            className={campaign.status === 'completed'
                                                ? 'bg-green-500/10 text-green-400'
                                                : 'bg-primary/20 text-primary'
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
                                    <span>{campaign.leads} leads</span>
                                    <span>{campaign.openRate}% open rate</span>
                                </div>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* Recent Activity */}
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-lg font-semibold text-white">Recent Activity</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {mockActivity.map((activity) => (
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
        </div>
    )
}

// Helper Components
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
                    <div className={`flex items-center gap-1 text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
                        {isPositive ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                        <span>{isPositive ? '+' : ''}{change}{suffix}</span>
                    </div>
                </div>
                <div className="mt-4">
                    <p className="text-2xl font-bold text-white">{value}</p>
                    <p className="text-sm text-white/40 mt-1">{title}</p>
                </div>
            </CardContent>
        </Card>
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
        default:
            return <Mail className={className} />
    }
}
