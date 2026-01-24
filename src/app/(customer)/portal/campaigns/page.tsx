import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import {
    Mail,
    Users,
    MousePointer2,
    MessageSquare,
    ArrowRight,
    Clock,
    TrendingUp,
    Calendar,
    BarChart3,
    Play,
    Pause,
    CheckCircle,
} from 'lucide-react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getPortalCampaigns } from '@/server/actions/customer-portal'

export default async function CustomerCampaignsPage() {
    const result = await getPortalCampaigns()
    const campaigns = result.success ? result.campaigns! : []

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white">Your Campaigns</h1>
                    <p className="text-white/50">Track the progress of your outreach campaigns</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 text-sm text-white/50">
                        <div className="flex h-2 w-2 rounded-full bg-green-500"></div>
                        <span>{campaigns.filter(c => c.status === 'active').length} Active</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-white/50">
                        <div className="flex h-2 w-2 rounded-full bg-amber-500"></div>
                        <span>{campaigns.filter(c => c.status === 'paused').length} Paused</span>
                    </div>
                </div>
            </div>

            {/* Stats Overview */}
            {campaigns.length > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                        label="Total Campaigns"
                        value={campaigns.length.toString()}
                        icon={BarChart3}
                    />
                    <StatCard
                        label="Total Leads"
                        value={campaigns.reduce((sum, c) => sum + c.totalLeads, 0).toLocaleString()}
                        icon={Users}
                    />
                    <StatCard
                        label="Emails Sent"
                        value={campaigns.reduce((sum, c) => sum + c.emailsSent, 0).toLocaleString()}
                        icon={Mail}
                    />
                    <StatCard
                        label="Avg Reply Rate"
                        value={`${campaigns.length > 0
                            ? Math.round(campaigns.reduce((sum, c) => sum + c.replyRate, 0) / campaigns.length)
                            : 0}%`}
                        icon={MessageSquare}
                    />
                </div>
            )}

            {/* Campaigns List */}
            {campaigns.length > 0 ? (
                <div className="space-y-4">
                    {campaigns.map((campaign) => (
                        <CampaignCard key={campaign.id} campaign={campaign} />
                    ))}
                </div>
            ) : (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardContent className="py-16 text-center">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                            <Mail className="h-8 w-8 text-primary" />
                        </div>
                        <h3 className="text-xl font-bold text-white mb-2">No Campaigns Yet</h3>
                        <p className="text-white/50 max-w-md mx-auto">
                            Your campaigns will appear here once they're launched. Your operator is
                            working on getting your first campaign ready!
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon
}: {
    label: string
    value: string
    icon: any
}) {
    return (
        <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-xl font-bold text-white">{value}</p>
                        <p className="text-xs text-white/40">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function CampaignCard({ campaign }: { campaign: any }) {
    const statusConfig: Record<string, { color: string; icon: any; label: string }> = {
        active: { color: 'bg-green-500/10 text-green-400 border-green-500/30', icon: Play, label: 'Active' },
        paused: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: Pause, label: 'Paused' },
        completed: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: CheckCircle, label: 'Completed' },
        draft: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', icon: Clock, label: 'Draft' },
    }

    const status = statusConfig[campaign.status] || statusConfig.draft
    const StatusIcon = status.icon

    return (
        <Card className="bg-white/[0.02] border-white/5 hover:bg-white/[0.04] transition-colors">
            <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                    {/* Campaign Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                            <h3 className="text-lg font-semibold text-white truncate">{campaign.name}</h3>
                            <Badge className={`${status.color} border`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {status.label}
                            </Badge>
                        </div>

                        <div className="flex items-center gap-4 text-sm text-white/50 mb-4">
                            <div className="flex items-center gap-1">
                                <Calendar className="h-3.5 w-3.5" />
                                <span>{new Date(campaign.createdAt).toLocaleDateString()}</span>
                            </div>
                            <div className="flex items-center gap-1">
                                <Users className="h-3.5 w-3.5" />
                                <span>{campaign.totalLeads} leads</span>
                            </div>
                        </div>

                        {/* Progress Bar */}
                        <div className="space-y-2">
                            <div className="flex justify-between text-xs">
                                <span className="text-white/50">Progress</span>
                                <span className="text-white/70">{campaign.progress}%</span>
                            </div>
                            <Progress value={campaign.progress} className="h-2 bg-white/5" />
                        </div>
                    </div>

                    {/* Stats */}
                    <div className="flex items-center gap-6 lg:gap-8">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-lg font-bold text-white">
                                <Mail className="h-4 w-4 text-primary" />
                                {campaign.emailsSent.toLocaleString()}
                            </div>
                            <p className="text-xs text-white/40">Sent</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-lg font-bold text-blue-400">
                                <MousePointer2 className="h-4 w-4" />
                                {campaign.openRate}%
                            </div>
                            <p className="text-xs text-white/40">Open Rate</p>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 text-lg font-bold text-green-400">
                                <MessageSquare className="h-4 w-4" />
                                {campaign.replyRate}%
                            </div>
                            <p className="text-xs text-white/40">Reply Rate</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}
