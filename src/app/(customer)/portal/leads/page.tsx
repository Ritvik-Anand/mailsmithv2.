import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
    Users,
    Sparkles,
    Mail,
    Building2,
    Briefcase,
    CheckCircle,
    Clock,
    XCircle,
    Search,
    Filter,
} from 'lucide-react'
import { Input } from '@/components/ui/input'
import { getPortalRecentLeads, getPortalLeadsSummary } from '@/server/actions/customer-portal'

export default async function CustomerLeadsPage() {
    const [leadsResult, summaryResult] = await Promise.all([
        getPortalRecentLeads(50),
        getPortalLeadsSummary()
    ])

    const leads = leadsResult.success ? leadsResult.leads! : []
    const summary = summaryResult.success ? summaryResult.summary! : {
        total: 0,
        withEmail: 0,
        withIcebreaker: 0,
        inCampaign: 0,
        byStatus: {}
    }

    return (
        <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white">Your Leads</h1>
                    <p className="text-white/50">View all leads being nurtured for your campaigns</p>
                </div>
            </div>

            {/* Stats Overview */}
            {summary.total > 0 && (
                <div className="grid gap-4 md:grid-cols-4">
                    <StatCard
                        label="Total Leads"
                        value={summary.total.toLocaleString()}
                        icon={Users}
                        color="text-white"
                    />
                    <StatCard
                        label="With Icebreaker"
                        value={summary.withIcebreaker.toLocaleString()}
                        icon={Sparkles}
                        color="text-amber-400"
                        subtext={`${summary.total > 0 ? Math.round((summary.withIcebreaker / summary.total) * 100) : 0}%`}
                    />
                    <StatCard
                        label="In Campaigns"
                        value={summary.inCampaign.toLocaleString()}
                        icon={Mail}
                        color="text-blue-400"
                        subtext={`${summary.total > 0 ? Math.round((summary.inCampaign / summary.total) * 100) : 0}%`}
                    />
                    <StatCard
                        label="Replies Received"
                        value={(summary.byStatus['replied'] || 0).toLocaleString()}
                        icon={CheckCircle}
                        color="text-green-400"
                    />
                </div>
            )}

            {/* Pipeline Visualization */}
            {summary.total > 0 && (
                <Card className="bg-white/[0.02] border-white/5">
                    <CardHeader>
                        <CardTitle className="text-base text-white">Lead Pipeline</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <PipelineStage
                                label="Total"
                                count={summary.total}
                                color="bg-zinc-600"
                                percentage={100}
                            />
                            <div className="h-px flex-1 bg-white/10"></div>
                            <PipelineStage
                                label="Enriched"
                                count={summary.withIcebreaker}
                                color="bg-amber-500"
                                percentage={summary.total > 0 ? (summary.withIcebreaker / summary.total) * 100 : 0}
                            />
                            <div className="h-px flex-1 bg-white/10"></div>
                            <PipelineStage
                                label="In Campaign"
                                count={summary.inCampaign}
                                color="bg-blue-500"
                                percentage={summary.total > 0 ? (summary.inCampaign / summary.total) * 100 : 0}
                            />
                            <div className="h-px flex-1 bg-white/10"></div>
                            <PipelineStage
                                label="Replied"
                                count={summary.byStatus['replied'] || 0}
                                color="bg-green-500"
                                percentage={summary.total > 0 ? ((summary.byStatus['replied'] || 0) / summary.total) * 100 : 0}
                            />
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Leads Table */}
            <Card className="bg-white/[0.02] border-white/5">
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-base text-white">Recent Leads</CardTitle>
                    <p className="text-sm text-white/40">Showing {leads.length} of {summary.total}</p>
                </CardHeader>
                <CardContent>
                    {leads.length > 0 ? (
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead>
                                    <tr className="border-b border-white/5">
                                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Name</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Company</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Icebreaker</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Status</th>
                                        <th className="text-left py-3 px-4 text-xs font-medium text-white/50">Added</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {leads.map((lead) => (
                                        <tr key={lead.id} className="border-b border-white/5 hover:bg-white/[0.02]">
                                            <td className="py-3 px-4">
                                                <div>
                                                    <p className="text-sm font-medium text-white">{lead.name}</p>
                                                    <p className="text-xs text-white/40">{lead.email}</p>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2 text-sm text-white/70">
                                                    <Building2 className="h-3.5 w-3.5 text-white/40" />
                                                    {lead.company}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {lead.hasIcebreaker ? (
                                                    <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                                                        <Sparkles className="h-3 w-3 mr-1" />
                                                        Ready
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-zinc-500/10 text-zinc-400 border-zinc-500/30">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <StatusBadge status={lead.status} />
                                            </td>
                                            <td className="py-3 px-4 text-sm text-white/40">
                                                {new Date(lead.createdAt).toLocaleDateString()}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    ) : (
                        <div className="py-16 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 mx-auto mb-4">
                                <Users className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-bold text-white mb-2">No Leads Yet</h3>
                            <p className="text-white/50 max-w-md mx-auto">
                                Your leads will appear here once your operator starts sourcing prospects for your campaigns.
                            </p>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}

function StatCard({
    label,
    value,
    icon: Icon,
    color,
    subtext
}: {
    label: string
    value: string
    icon: any
    color: string
    subtext?: string
}) {
    return (
        <Card className="bg-white/[0.02] border-white/5">
            <CardContent className="p-4">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${color === 'text-amber-400' ? 'bg-amber-500/10' :
                            color === 'text-blue-400' ? 'bg-blue-500/10' :
                                color === 'text-green-400' ? 'bg-green-500/10' :
                                    'bg-white/5'
                        }`}>
                        <Icon className={`h-5 w-5 ${color}`} />
                    </div>
                    <div>
                        <div className="flex items-baseline gap-2">
                            <p className={`text-xl font-bold ${color}`}>{value}</p>
                            {subtext && <span className="text-xs text-white/40">{subtext}</span>}
                        </div>
                        <p className="text-xs text-white/40">{label}</p>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function PipelineStage({
    label,
    count,
    color,
    percentage
}: {
    label: string
    count: number
    color: string
    percentage: number
}) {
    return (
        <div className="flex flex-col items-center">
            <div className={`h-12 w-12 rounded-full ${color} flex items-center justify-center mb-2`}>
                <span className="text-sm font-bold text-white">{count > 999 ? `${Math.round(count / 1000)}k` : count}</span>
            </div>
            <p className="text-xs text-white/60">{label}</p>
            <p className="text-xs text-white/30">{percentage.toFixed(0)}%</p>
        </div>
    )
}

function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { color: string; icon: any; label: string }> = {
        not_added: { color: 'bg-zinc-500/10 text-zinc-400 border-zinc-500/30', icon: Clock, label: 'Pending' },
        queued: { color: 'bg-blue-500/10 text-blue-400 border-blue-500/30', icon: Mail, label: 'Queued' },
        sent: { color: 'bg-purple-500/10 text-purple-400 border-purple-500/30', icon: Mail, label: 'Sent' },
        opened: { color: 'bg-amber-500/10 text-amber-400 border-amber-500/30', icon: CheckCircle, label: 'Opened' },
        replied: { color: 'bg-green-500/10 text-green-400 border-green-500/30', icon: CheckCircle, label: 'Replied' },
        bounced: { color: 'bg-red-500/10 text-red-400 border-red-500/30', icon: XCircle, label: 'Bounced' },
    }

    const cfg = config[status] || config.not_added
    const StatusIcon = cfg.icon

    return (
        <Badge className={`${cfg.color} border`}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {cfg.label}
        </Badge>
    )
}
