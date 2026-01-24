import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    BarChart3,
    TrendingUp,
    TrendingDown,
    Users,
    Mail,
    MousePointer2,
    MessageSquare,
    Clock,
    Target,
    Sparkles,
    ArrowRight,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getPortalMetrics, getPortalCampaigns, getPortalLeadsSummary } from '@/server/actions/customer-portal'
import { getQuickInsights } from '@/server/actions/ai-assistant'

export default async function CustomerAnalyticsPage() {
    const [metricsResult, campaignsResult, summaryResult, insightsResult] = await Promise.all([
        getPortalMetrics(),
        getPortalCampaigns(),
        getPortalLeadsSummary(),
        getQuickInsights()
    ])

    const metrics = metricsResult.success ? metricsResult.metrics! : {
        totalLeads: 0, leadsChange: 0, emailsSent: 0, emailsChange: 0,
        openRate: 0, openRateChange: 0, replyRate: 0, replyRateChange: 0
    }
    const campaigns = campaignsResult.success ? campaignsResult.campaigns! : []
    const summary = summaryResult.success ? summaryResult.summary! : { total: 0, withEmail: 0, withIcebreaker: 0, inCampaign: 0, byStatus: {} }
    const insights = insightsResult.success ? insightsResult.insights! : []

    const hasData = metrics.totalLeads > 0 || campaigns.length > 0

    // Calculate conversion funnel
    const funnelStages = [
        { name: 'Total Leads', value: summary.total, color: 'bg-zinc-500' },
        { name: 'With Icebreaker', value: summary.withIcebreaker, color: 'bg-amber-500' },
        { name: 'In Campaigns', value: summary.inCampaign, color: 'bg-blue-500' },
        { name: 'Sent', value: metrics.emailsSent, color: 'bg-purple-500' },
        { name: 'Replied', value: summary.byStatus['replied'] || 0, color: 'bg-green-500' },
    ]

    // Calculate best performing campaign
    const bestCampaign = campaigns.length > 0
        ? campaigns.reduce((best, c) => c.replyRate > best.replyRate ? c : best, campaigns[0])
        : null

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="space-y-1">
                <h1 className="text-2xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="h-6 w-6 text-primary" />
                    Analytics
                </h1>
                <p className="text-white/50">Detailed insights into your outreach performance</p>
            </div>

            {/* AI Insights */}
            {insights.length > 0 && (
                <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
                    <CardHeader>
                        <CardTitle className="text-base text-white flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-primary" />
                            AI Insights
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <ul className="space-y-3">
                            {insights.map((insight, i) => (
                                <li key={i} className="flex items-start gap-3">
                                    <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/20 text-primary text-xs font-bold">
                                        {i + 1}
                                    </div>
                                    <p className="text-sm text-white/80">{insight}</p>
                                </li>
                            ))}
                        </ul>
                        <div className="mt-4 pt-4 border-t border-primary/20">
                            <Link href="/portal/assistant">
                                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80">
                                    Ask more questions
                                    <ArrowRight className="ml-2 h-4 w-4" />
                                </Button>
                            </Link>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Key Metrics */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <MetricCard
                    title="Open Rate"
                    value={`${metrics.openRate}%`}
                    change={metrics.openRateChange}
                    icon={MousePointer2}
                    benchmark={35}
                    benchmarkLabel="Industry avg: 35%"
                />
                <MetricCard
                    title="Reply Rate"
                    value={`${metrics.replyRate}%`}
                    change={metrics.replyRateChange}
                    icon={MessageSquare}
                    benchmark={5}
                    benchmarkLabel="Industry avg: 5%"
                />
                <MetricCard
                    title="Leads Enriched"
                    value={`${summary.total > 0 ? Math.round((summary.withIcebreaker / summary.total) * 100) : 0}%`}
                    icon={Sparkles}
                    subtext={`${summary.withIcebreaker} of ${summary.total}`}
                />
                <MetricCard
                    title="Campaign Utilization"
                    value={`${summary.total > 0 ? Math.round((summary.inCampaign / summary.total) * 100) : 0}%`}
                    icon={Target}
                    subtext={`${summary.inCampaign} leads in campaigns`}
                />
            </div>

            {/* Conversion Funnel */}
            {hasData && (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-base text-white">Conversion Funnel</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {funnelStages.map((stage, i) => {
                                const width = summary.total > 0
                                    ? Math.max((stage.value / summary.total) * 100, 5)
                                    : 0
                                const conversionRate = i > 0 && funnelStages[i - 1].value > 0
                                    ? ((stage.value / funnelStages[i - 1].value) * 100).toFixed(0)
                                    : null

                                return (
                                    <div key={stage.name} className="space-y-2">
                                        <div className="flex justify-between text-sm">
                                            <span className="text-white">{stage.name}</span>
                                            <div className="flex items-center gap-3">
                                                {conversionRate && (
                                                    <span className="text-xs text-white/40">
                                                        {conversionRate}% conversion
                                                    </span>
                                                )}
                                                <span className="text-white font-medium">{stage.value.toLocaleString()}</span>
                                            </div>
                                        </div>
                                        <div className="h-8 bg-white/5 rounded-lg overflow-hidden">
                                            <div
                                                className={`h-full ${stage.color} transition-all duration-500 rounded-lg flex items-center justify-end pr-3`}
                                                style={{ width: `${width}%` }}
                                            >
                                                {width > 15 && (
                                                    <span className="text-xs font-medium text-white">
                                                        {width.toFixed(0)}%
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Campaign Comparison */}
            {campaigns.length > 1 && (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-base text-white">Campaign Performance Comparison</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Campaign</th>
                                        <th className="text-center py-3 px-4 text-xs font-medium text-white/50">Status</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-white/50">Leads</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-white/50">Sent</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-white/50">Open Rate</th>
                                        <th className="text-right py-3 px-4 text-xs font-medium text-white/50">Reply Rate</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaigns.map((campaign) => (
                                        <tr key={campaign.id} className="border-b border-white/5">
                                            <td className="py-3 px-4 text-sm text-white">{campaign.name}</td>
                                            <td className="py-3 px-4 text-center">
                                                <Badge className={`${campaign.status === 'active' ? 'bg-green-500/10 text-green-400' :
                                                        campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-400' :
                                                            'bg-zinc-500/10 text-zinc-400'
                                                    }`}>
                                                    {campaign.status}
                                                </Badge>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-white text-right">{campaign.totalLeads}</td>
                                            <td className="py-3 px-4 text-sm text-white text-right">{campaign.emailsSent}</td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                <span className={campaign.openRate >= 35 ? 'text-green-400' : 'text-white'}>
                                                    {campaign.openRate}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4 text-sm text-right">
                                                <span className={campaign.replyRate >= 5 ? 'text-green-400' : 'text-white'}>
                                                    {campaign.replyRate}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Best Performing Campaign */}
            {bestCampaign && (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardContent className="p-6">
                        <div className="flex items-center gap-4">
                            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-500/10">
                                <TrendingUp className="h-6 w-6 text-green-400" />
                            </div>
                            <div className="flex-1">
                                <h3 className="text-sm text-white/50">Top Performing Campaign</h3>
                                <p className="text-lg font-semibold text-white">{bestCampaign.name}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-2xl font-bold text-green-400">{bestCampaign.replyRate}%</p>
                                <p className="text-xs text-white/40">Reply Rate</p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Empty State */}
            {!hasData && (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardContent className="py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                            <BarChart3 className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Analytics Yet</h3>
                        <p className="text-white/50 max-w-md mx-auto">
                            Once your campaigns are launched and emails are sent, you'll see detailed
                            analytics about opens, replies, and conversion rates here.
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function MetricCard({
    title,
    value,
    change,
    icon: Icon,
    benchmark,
    benchmarkLabel,
    subtext
}: {
    title: string
    value: string
    change?: number
    icon: any
    benchmark?: number
    benchmarkLabel?: string
    subtext?: string
}) {
    const numValue = parseFloat(value)
    const isAboveBenchmark = benchmark ? numValue >= benchmark : null

    return (
        <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    {change !== undefined && change !== 0 && (
                        <div className={`flex items-center gap-1 text-sm ${change >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                            {change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                            <span>{change >= 0 ? '+' : ''}{change}%</span>
                        </div>
                    )}
                </div>
                <p className="text-2xl font-bold text-white">{value}</p>
                <p className="text-sm text-white/40 mt-1">{title}</p>
                {benchmarkLabel && (
                    <p className={`text-xs mt-2 ${isAboveBenchmark ? 'text-green-400' : 'text-amber-400'}`}>
                        {isAboveBenchmark ? '✓' : '○'} {benchmarkLabel}
                    </p>
                )}
                {subtext && (
                    <p className="text-xs text-white/30 mt-2">{subtext}</p>
                )}
            </CardContent>
        </Card>
    )
}
