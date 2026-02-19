'use client'

import { useState, useEffect, use, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    BarChart3,
    Users,
    Layers,
    Calendar,
    Settings,
    Play,
    Pause,
    ChevronLeft,
    Mail,
    MousePointer,
    Reply,
    TrendingUp,
    Plus,
    Trash2,
    GripVertical,
    Eye,
    Loader2,
    RefreshCw,
    ArrowUpRight,
    Clock,
    CheckCircle2,
    XCircle,
    Send
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'
import { getCampaignById, getCampaignLeads, getCampaignSequences, upsertSequenceStep, deleteSequenceStep, getCampaignSchedules, upsertSchedule, updateCampaign, syncCampaignStats } from '@/server/actions/campaigns'
import { getOrganizationNodes, getCampaignAccountsFromInstantly, updateCampaignAccountsInInstantly, getCampaignAdvancedOptionsFromInstantly, updateCampaignAdvancedOptionsInInstantly, toggleCampaignStatus, syncAllCampaignLeads } from '@/server/actions/instantly'
import { cn } from '@/lib/utils'

const TABS = [
    { id: 'analytics', label: 'Analytics', icon: BarChart3 },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'sequences', label: 'Sequences', icon: Layers },
    { id: 'schedule', label: 'Schedule', icon: Calendar },
    { id: 'options', label: 'Options', icon: Settings },
]

export default function CampaignDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params)
    const router = useRouter()
    const [activeTab, setActiveTab] = useState('analytics')
    const [campaign, setCampaign] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isPausing, setIsPausing] = useState(false)
    const [isSyncingStat, setIsSyncingStat] = useState(false)
    const [isEditingInstantlyId, setIsEditingInstantlyId] = useState(false)
    const [instantlyIdInput, setInstantlyIdInput] = useState('')
    const [isSavingInstantlyId, setIsSavingInstantlyId] = useState(false)

    useEffect(() => {
        async function loadCampaign() {
            setIsLoading(true)
            try {
                const result = await getCampaignById(resolvedParams.id)
                if (result.success && result.campaign) {
                    setCampaign(result.campaign)
                } else {
                    toast.error('Campaign not found')
                    router.push('/operator/campaigns')
                }
            } catch (error) {
                console.error('Error loading campaign:', error)
                toast.error('Failed to load campaign')
            } finally {
                setIsLoading(false)
            }
        }
        loadCampaign()
    }, [resolvedParams.id, router])

    const handleStatusToggle = async () => {
        setIsPausing(true)
        const newStatus = campaign.status === 'active' ? 'paused' : 'active'
        try {
            const result = await toggleCampaignStatus(campaign.id, newStatus)
            if (result.success) {
                toast.success(newStatus === 'active' ? 'Campaign resumed' : 'Campaign paused')
                // Reload campaign to get updated data (especially if it was just created in Instantly)
                const refined = await getCampaignById(resolvedParams.id)
                if (refined.success && refined.campaign) {
                    setCampaign(refined.campaign)
                } else {
                    // Fallback to local update if reload fails
                    setCampaign((prev: any) => ({
                        ...prev,
                        status: newStatus
                    }))
                }
            } else {
                toast.error(result.error || 'Failed to update status')
            }
        } catch (error) {
            console.error('Error toggling status:', error)
            toast.error('Failed to update status')
        } finally {
            setIsPausing(false)
        }
    }

    const handleSyncStats = async () => {
        setIsSyncingStat(true)
        try {
            const result = await syncCampaignStats(campaign.id)
            if (result.success) {
                toast.success('Campaign statistics synchronized')
                // Reload campaign to get updated data
                const refined = await getCampaignById(resolvedParams.id)
                if (refined.success && refined.campaign) {
                    setCampaign(refined.campaign)
                }
            } else {
                toast.error(result.error || 'Failed to sync stats')
            }
        } catch (error) {
            console.error('Error syncing stats:', error)
            toast.error('Error syncing stats')
        } finally {
            setIsSyncingStat(false)
        }
    }

    const handleSaveInstantlyId = async () => {
        if (!instantlyIdInput.trim()) return
        setIsSavingInstantlyId(true)
        try {
            const result = await updateCampaign(campaign.id, { instantly_campaign_id: instantlyIdInput.trim() } as any)
            if (result.success) {
                toast.success('Instantly ID updated — re-sync stats to apply')
                setCampaign((prev: any) => ({ ...prev, instantly_campaign_id: instantlyIdInput.trim() }))
                setIsEditingInstantlyId(false)
            } else {
                toast.error('Failed to update Instantly ID')
            }
        } catch (e) {
            toast.error('Error saving')
        } finally {
            setIsSavingInstantlyId(false)
        }
    }

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active':
                return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'paused':
                return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'completed':
                return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default:
                return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex items-center justify-center h-96">
                <p className="text-zinc-500">Campaign not found</p>
            </div>
        )
    }

    return (
        <div className="space-y-6 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                <div className="flex items-start gap-4">
                    <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => router.push('/operator/campaigns')}
                        className="mt-1"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </Button>
                    <div>
                        <div className="flex items-center gap-3">
                            <h1 className="text-2xl font-bold tracking-tight">{campaign.name}</h1>
                            <Badge
                                variant="outline"
                                className={cn(
                                    "text-[10px] font-black uppercase tracking-tighter px-2",
                                    getStatusStyle(campaign.status)
                                )}
                            >
                                {campaign.status}
                            </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mt-1">
                            Campaign ID: {resolvedParams.id}
                        </p>
                        {/* Instantly ID display / edit */}
                        <div className="flex items-center gap-2 mt-1">
                            {isEditingInstantlyId ? (
                                <>
                                    <input
                                        value={instantlyIdInput}
                                        onChange={e => setInstantlyIdInput(e.target.value)}
                                        placeholder="Paste Instantly campaign UUID..."
                                        className="text-xs font-mono bg-zinc-900 border border-zinc-700 rounded px-2 py-1 text-zinc-200 w-72 outline-none focus:border-amber-500"
                                    />
                                    <button
                                        onClick={handleSaveInstantlyId}
                                        disabled={isSavingInstantlyId}
                                        className="text-xs font-bold text-amber-500 hover:text-amber-400 disabled:opacity-50"
                                    >
                                        {isSavingInstantlyId ? 'Saving...' : 'Save'}
                                    </button>
                                    <button
                                        onClick={() => setIsEditingInstantlyId(false)}
                                        className="text-xs text-zinc-500 hover:text-zinc-300"
                                    >
                                        Cancel
                                    </button>
                                </>
                            ) : (
                                <>
                                    <span className="text-xs font-mono text-zinc-600">
                                        Instantly ID: {campaign.instantly_campaign_id ? campaign.instantly_campaign_id.slice(0, 18) + '...' : 'Not linked'}
                                    </span>
                                    <button
                                        onClick={() => {
                                            setInstantlyIdInput(campaign.instantly_campaign_id || '')
                                            setIsEditingInstantlyId(true)
                                        }}
                                        className="text-[10px] text-amber-500/70 hover:text-amber-400 font-semibold"
                                    >
                                        Edit
                                    </button>
                                </>
                            )}
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 h-9 px-4 border border-zinc-800 bg-zinc-950 text-zinc-300 hover:text-white hover:bg-zinc-900 shadow-sm"
                        onClick={handleSyncStats}
                        disabled={isSyncingStat}
                    >
                        <RefreshCw className={cn("h-4 w-4", isSyncingStat && "animate-spin")} />
                        {isSyncingStat ? 'Syncing...' : 'Sync Stats'}
                    </Button>
                    <Button
                        size="sm"
                        className={cn(
                            "gap-2 font-bold",
                            campaign.status === 'active'
                                ? "bg-amber-500/10 text-amber-500 hover:bg-amber-500/20 border border-amber-500/30"
                                : "bg-emerald-500 hover:bg-emerald-600 text-white"
                        )}
                        onClick={handleStatusToggle}
                        disabled={isPausing}
                    >
                        {isPausing ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : campaign.status === 'active' ? (
                            <>
                                <Pause className="h-4 w-4" />
                                Pause Campaign
                            </>
                        ) : (
                            <>
                                <Play className="h-4 w-4" />
                                Resume Campaign
                            </>
                        )}
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="border-b border-zinc-800">
                <nav className="flex gap-8">
                    {TABS.map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={cn(
                                "flex items-center gap-2 py-4 text-sm font-medium border-b-2 transition-all",
                                activeTab === tab.id
                                    ? "text-primary border-primary"
                                    : "text-muted-foreground border-transparent hover:text-white hover:border-zinc-700"
                            )}
                        >
                            <tab.icon className="h-4 w-4" />
                            {tab.label}
                        </button>
                    ))}
                </nav>
            </div>

            {/* Tab Content */}
            <div className="mt-6">
                {activeTab === 'analytics' && <AnalyticsTab campaign={campaign} />}
                {activeTab === 'leads' && <LeadsTab campaignId={resolvedParams.id} />}
                {activeTab === 'sequences' && <SequencesTab campaignId={resolvedParams.id} />}
                {activeTab === 'schedule' && <ScheduleTab campaignId={resolvedParams.id} />}
                {activeTab === 'options' && <OptionsTab campaign={campaign} setCampaign={setCampaign} />}
            </div>
        </div>
    )
}

// ============================================================================
// ANALYTICS TAB
// ============================================================================
function AnalyticsTab({ campaign }: { campaign: any }) {
    const emailsSent = campaign.emails_sent || 0
    const emailsOpened = campaign.emails_opened || 0
    const emailsReplied = campaign.emails_replied || 0
    const emailsBounced = campaign.emails_bounced || 0
    const emailsClicked = campaign.emails_clicked || 0
    const emailsInterested = campaign.emails_interested || 0

    const openRate = emailsSent > 0
        ? ((emailsOpened / emailsSent) * 100).toFixed(1)
        : '0'
    const replyRate = emailsSent > 0
        ? ((emailsReplied / emailsSent) * 100).toFixed(1)
        : '0'
    const clickRate = emailsSent > 0
        ? ((emailsClicked / emailsSent) * 100).toFixed(1)
        : '0'
    const positiveRate = emailsReplied > 0
        ? ((emailsInterested / emailsReplied) * 100).toFixed(1)
        : '0'

    const metrics = [
        {
            label: 'Sequence Started',
            value: emailsSent.toLocaleString(),
            icon: Send,
            color: 'text-blue-400'
        },
        {
            label: 'Open Rate',
            value: `${openRate}%`,
            subValue: emailsOpened.toLocaleString(),
            icon: Eye,
            color: 'text-emerald-400'
        },
        {
            label: 'Click Rate',
            value: `${clickRate}%`,
            subValue: emailsClicked.toLocaleString(),
            icon: MousePointer,
            color: 'text-violet-400'
        },
        {
            label: 'Replies',
            value: emailsReplied.toString(),
            subValue: `${replyRate}%`,
            icon: Reply,
            color: 'text-amber-400'
        },
        {
            label: 'Interested',
            value: emailsInterested.toString(),
            subValue: `${positiveRate}% of replies`,
            icon: TrendingUp,
            color: 'text-emerald-500'
        },
        {
            label: 'Bounced',
            value: emailsBounced.toString(),
            icon: XCircle,
            color: 'text-red-400'
        },
    ]

    return (
        <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {metrics.map((metric) => (
                    <Card key={metric.label} className="bg-zinc-950 border-zinc-800">
                        <CardContent className="p-4">
                            <div className="flex items-center gap-2 text-xs text-zinc-500 font-medium mb-2">
                                <metric.icon className={cn("h-3.5 w-3.5", metric.color)} />
                                {metric.label}
                            </div>
                            <div className="text-2xl font-bold text-white">{metric.value}</div>
                            {metric.subValue && (
                                <div className="text-xs text-zinc-500 mt-1">
                                    {metric.subValue}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                ))}
            </div>

            {/* Timeline Chart Placeholder */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-medium text-zinc-400">Performance Over Time</CardTitle>
                        <Select defaultValue="7d">
                            <SelectTrigger className="w-[130px] h-8 text-xs bg-zinc-900 border-zinc-800">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-zinc-950 border-zinc-800">
                                <SelectItem value="7d">Last 7 days</SelectItem>
                                <SelectItem value="14d">Last 14 days</SelectItem>
                                <SelectItem value="30d">Last 30 days</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {/* Chart Legend */}
                    <div className="flex items-center gap-6 mb-4">
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-blue-500" />
                            <span className="text-xs text-zinc-500">Sent</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-amber-500" />
                            <span className="text-xs text-zinc-500">Total Opens</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-emerald-500" />
                            <span className="text-xs text-zinc-500">Unique Opens</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-cyan-500" />
                            <span className="text-xs text-zinc-500">Replies</span>
                        </div>
                    </div>

                    {/* Placeholder Chart */}
                    <div className="h-[200px] bg-zinc-900/50 rounded-lg flex items-center justify-center border border-zinc-800/50">
                        <div className="text-center">
                            <TrendingUp className="h-8 w-8 text-zinc-700 mx-auto mb-2" />
                            <p className="text-xs text-zinc-600">Chart coming soon</p>
                            <p className="text-[10px] text-zinc-700">Will pull from Instantly API</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Step Analytics Table */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-zinc-400">Step Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800">
                                    <th className="text-left py-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Step</th>
                                    <th className="text-left py-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Sent</th>
                                    <th className="text-left py-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Opened</th>
                                    <th className="text-left py-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Replied</th>
                                    <th className="text-left py-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Clicked</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="border-b border-zinc-900">
                                    <td className="py-3 font-medium text-white">Step 1</td>
                                    <td className="py-3 text-zinc-300">{emailsSent.toLocaleString()}</td>
                                    <td className="py-3">
                                        <span className="text-zinc-300">{emailsOpened.toLocaleString()}</span>
                                        <span className="text-zinc-500 ml-2">| {openRate}%</span>
                                    </td>
                                    <td className="py-3">
                                        <span className="text-zinc-300">{emailsReplied}</span>
                                        <span className="text-zinc-500 ml-2">| {replyRate}%</span>
                                    </td>
                                    <td className="py-3 text-zinc-500">0 | 0%</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}

// ============================================================================
// LEADS TAB
// ============================================================================
function LeadsTab({ campaignId }: { campaignId: string }) {
    const [leads, setLeads] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [totalLeads, setTotalLeads] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [isSyncing, setIsSyncing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const pageSize = 50

    useEffect(() => {
        async function loadLeads() {
            setIsLoading(true)
            try {
                const result = await getCampaignLeads(campaignId, currentPage, pageSize)
                setLeads(result.leads || [])
                setTotalLeads(result.total || 0)
            } catch (error) {
                console.error('Error loading leads:', error)
                toast.error('Failed to load leads')
            } finally {
                setIsLoading(false)
            }
        }
        loadLeads()
    }, [campaignId, currentPage, refreshKey])

    async function handleSyncToInstantly() {
        setIsSyncing(true)
        try {
            const result = await syncAllCampaignLeads(campaignId)
            if (result.success) {
                toast.success(result.message)
                setRefreshKey(prev => prev + 1)
            } else {
                toast.error(result.error)
            }
        } catch (error) {
            toast.error('Failed to sync leads')
        } finally {
            setIsSyncing(false)
        }
    }

    const filteredLeads = searchQuery
        ? leads.filter(lead =>
            (lead.email || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.first_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.last_name || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (lead.company_name || '').toLowerCase().includes(searchQuery.toLowerCase())
        )
        : leads

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'sent':
                return <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]"><Send className="h-3 w-3 mr-1" />{status}</Badge>
            case 'opened':
                return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 text-[10px]"><Eye className="h-3 w-3 mr-1" />{status}</Badge>
            case 'replied':
                return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 text-[10px]"><Reply className="h-3 w-3 mr-1" />{status}</Badge>
            case 'bounced':
                return <Badge variant="outline" className="bg-red-500/10 text-red-400 border-red-500/20 text-[10px]"><XCircle className="h-3 w-3 mr-1" />{status}</Badge>
            default:
                return <Badge variant="outline" className="bg-zinc-500/10 text-zinc-400 border-zinc-500/20 text-[10px]">{status || 'queued'}</Badge>
        }
    }

    return (
        <div className="space-y-4">
            {/* Header Controls */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Input
                        placeholder="Search leads..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-[200px] h-9 bg-zinc-950 border-zinc-800"
                    />
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                        <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {totalLeads.toLocaleString()} total
                        </span>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        size="sm"
                        className="gap-2 border-zinc-800"
                        onClick={handleSyncToInstantly}
                        disabled={isSyncing}
                    >
                        {isSyncing ? (
                            <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                        ) : (
                            <RefreshCw className="h-4 w-4 text-zinc-400" />
                        )}
                        Sync to Instantly
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2 border-zinc-800">
                        <Settings className="h-4 w-4" />
                        Filters
                    </Button>
                    <Button size="sm" className="gap-2 bg-primary hover:bg-primary/90">
                        <Plus className="h-4 w-4" />
                        Add Leads
                    </Button>
                </div>
            </div>

            {/* Leads Table */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-0">
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b border-zinc-800 bg-zinc-900/50">
                                    <th className="w-10 p-3">
                                        <Checkbox />
                                    </th>
                                    <th className="text-left p-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Email</th>
                                    <th className="text-left p-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Contact</th>
                                    <th className="text-left p-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Company</th>
                                    <th className="text-left p-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Job Title</th>
                                    <th className="text-left p-3 text-[10px] font-black text-zinc-500 uppercase tracking-wider">Status</th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center">
                                            <Loader2 className="h-5 w-5 animate-spin text-amber-500 mx-auto" />
                                            <p className="text-xs text-zinc-500 mt-2">Loading leads...</p>
                                        </td>
                                    </tr>
                                ) : filteredLeads.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-8 text-center text-zinc-500 text-sm">
                                            {searchQuery ? 'No leads match your search' : 'No leads assigned to this campaign'}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredLeads.map((lead, idx) => (
                                        <tr
                                            key={lead.id}
                                            className="border-b border-zinc-900 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                                        >
                                            <td className="p-3 text-zinc-500">{(currentPage - 1) * pageSize + idx + 1}</td>
                                            <td className="p-3">
                                                <span className="text-blue-400 hover:underline">{lead.email}</span>
                                            </td>
                                            <td className="p-3 text-zinc-300">{lead.first_name} {lead.last_name}</td>
                                            <td className="p-3 text-zinc-300">{lead.company_name || '—'}</td>
                                            <td className="p-3 text-zinc-400">{lead.job_title || '—'}</td>
                                            <td className="p-3">
                                                {getStatusBadge(lead.campaign_status)}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </CardContent>
            </Card>

            {totalLeads > pageSize && (
                <div className="flex items-center justify-center gap-4">
                    <span className="text-xs text-zinc-500">
                        Showing {((currentPage - 1) * pageSize) + 1}–{Math.min(currentPage * pageSize, totalLeads)} of {totalLeads.toLocaleString()}
                    </span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-800"
                            disabled={currentPage === 1}
                            onClick={() => setCurrentPage(p => p - 1)}
                        >
                            Previous
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="border-zinc-800"
                            disabled={currentPage * pageSize >= totalLeads}
                            onClick={() => setCurrentPage(p => p + 1)}
                        >
                            Next
                        </Button>
                    </div>
                </div>
            )}
        </div>
    )
}

// ============================================================================
// SEQUENCES TAB
// ============================================================================
function SequencesTab({ campaignId }: { campaignId: string }) {
    // Delete Step Confirmation
    const [deleteStepDialogOpen, setDeleteStepDialogOpen] = useState(false)
    const [stepToDelete, setStepToDelete] = useState<any>(null)
    const [isDeletingStep, setIsDeletingStep] = useState(false)

    const [sequences, setSequences] = useState<any[]>([])
    const [selectedStep, setSelectedStep] = useState<any>(null)
    const [activeVariantId, setActiveVariantId] = useState<string | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)
    const bodyRef = useRef<HTMLTextAreaElement>(null)
    const [showPreview, setShowPreview] = useState(false)
    const [previewLeads, setPreviewLeads] = useState<any[]>([])
    const [selectedLeadId, setSelectedLeadId] = useState<string>('sample')
    const [loadingPreviewLeads, setLoadingPreviewLeads] = useState(false)

    // Cursor tracking
    const [lastSelection, setLastSelection] = useState<{ field: 'subject' | 'body', start: number, end: number } | null>(null)
    const subjectRef = useRef<HTMLInputElement>(null)

    // Load sequences on mount
    useEffect(() => {
        loadSequences()
    }, [campaignId])

    async function loadSequences() {
        setIsLoading(true)
        try {
            const data = await getCampaignSequences(campaignId)
            if (data && data.length > 0) {
                // Group by step_number
                const grouped = new Map()
                data.forEach((s: any) => {
                    if (!grouped.has(s.step_number)) {
                        grouped.set(s.step_number, {
                            step: s.step_number,
                            delayDays: s.delay_days || 2, // Use delay from first variant found
                            variants: []
                        })
                    }
                    grouped.get(s.step_number).variants.push({
                        id: s.id,
                        label: s.variant_label || 'A',
                        subject: s.subject || '',
                        body: s.body || '',
                        delayDays: s.delay_days // Keep reference if needed
                    })
                })

                // Sort steps by number, and variants by label (A, B, C)
                const mapped = Array.from(grouped.values())
                    .sort((a: any, b: any) => a.step - b.step)
                    .map((step: any) => ({
                        ...step,
                        variants: step.variants.sort((a: any, b: any) => a.label.localeCompare(b.label))
                    }))

                setSequences(mapped)

                // Restore selection logic
                if (!selectedStep || !mapped.find((s: any) => s.step === selectedStep.step)) {
                    const first = mapped[0]
                    setSelectedStep(first)
                    if (first?.variants[0]) setActiveVariantId(first.variants[0].id)
                } else {
                    const current = mapped.find((s: any) => s.step === selectedStep.step)
                    setSelectedStep(current)
                    // Ensure active variant is valid for this step
                    if (!activeVariantId || !current.variants.find((v: any) => v.id === activeVariantId)) {
                        setActiveVariantId(current.variants[0]?.id)
                    }
                }
            } else {
                setSequences([])
                setSelectedStep(null)
                setActiveVariantId(null)
            }
        } catch (error) {
            console.error('Error loading sequences:', error)
            toast.error('Failed to load sequences')
        } finally {
            setIsLoading(false)
        }
    }

    const SAMPLE_VARIABLES: Record<string, string> = {
        '{{firstName}}': 'Alex',
        '{{lastName}}': 'Johnson',
        '{{companyName}}': 'Acme Corp',
        '{{jobTitle}}': 'Head of Marketing',
        '{{personalization}}': 'Saw your recent post on LinkedIn about scaling content ops — really resonated with some of the challenges we help teams solve.',
        '{{sendingAccountFirstName}}': 'Ritvik',
    }

    const getActiveVariables = (): Record<string, string> => {
        if (selectedLeadId === 'sample') return SAMPLE_VARIABLES
        const lead = previewLeads.find(l => l.id === selectedLeadId)
        if (!lead) return SAMPLE_VARIABLES
        return {
            '{{firstName}}': lead.first_name || '',
            '{{lastName}}': lead.last_name || '',
            '{{companyName}}': lead.company_name || '',
            '{{jobTitle}}': lead.job_title || '',
            '{{personalization}}': lead.icebreaker || '(No icebreaker generated)',
            '{{sendingAccountFirstName}}': 'Ritvik',
        }
    }

    const getActiveVariant = () => {
        if (!selectedStep || !activeVariantId) return null
        return selectedStep.variants.find((v: any) => v.id === activeVariantId)
    }

    const replaceVariables = (text: string) => {
        if (!text) return ''
        let result = text
        const vars = getActiveVariables()
        for (const [key, value] of Object.entries(vars)) {
            // Escape special characters in key for regex
            const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
            result = result.replace(new RegExp(escapedKey, 'g'), value || '')
        }
        return result
    }

    const openPreview = async () => {
        setShowPreview(true)
        setLoadingPreviewLeads(true)
        try {
            const result = await getCampaignLeads(campaignId, 1, 20)
            setPreviewLeads(result.leads || [])
        } catch (error) {
            console.error('Error loading preview leads:', error)
        } finally {
            setLoadingPreviewLeads(false)
        }
    }

    const addStep = async () => {
        const maxStep = sequences.length > 0 ? Math.max(...sequences.map(s => s.step)) : 0
        const newStepNumber = maxStep + 1
        // Create on server immediately (Variant A)
        const newStepData = {
            step_number: newStepNumber,
            subject: '',
            body: '',
            delay_days: 2,
            variant_label: 'A'
        }

        try {
            const result = await upsertSequenceStep(campaignId, newStepData)
            if (result.success && result.data) {
                const newVariant = {
                    id: result.data.id,
                    label: 'A',
                    subject: '',
                    body: '',
                    delayDays: 2
                }
                const newStep = {
                    step: newStepNumber,
                    delayDays: 2,
                    variants: [newVariant]
                }
                const updated = [...sequences, newStep]
                setSequences(updated)
                setSelectedStep(newStep)
                setActiveVariantId(newVariant.id)
                toast.success('Step added')
            } else {
                toast.error('Failed to add step')
            }
        } catch (error) {
            console.error('Error adding step:', error)
            toast.error('Failed to add step')
        }
    }

    const addVariant = async (e: React.MouseEvent, stepGroup: any) => {
        e.stopPropagation()
        // Calculate next label
        const labels = stepGroup.variants.map((v: any) => v.label)
        const maxCharCode = Math.max(...labels.map((l: string) => l.charCodeAt(0)), 'A'.charCodeAt(0) - 1)
        const nextLabel = String.fromCharCode(maxCharCode + 1)

        if (labels.length >= 26) {
            toast.error('Max variants reached (Z)')
            return
        }

        const newVariantData = {
            step_number: stepGroup.step,
            variant_label: nextLabel,
            subject: '',
            body: '',
            delay_days: stepGroup.delayDays // Use step's current delay
        }

        try {
            const result = await upsertSequenceStep(campaignId, newVariantData)
            if (result.success && result.data) {
                loadSequences() // Reload to simplify state update logic for nested structure
                toast.success(`Variant ${nextLabel} added`)
            } else {
                toast.error('Failed to add variant')
            }
        } catch (error) {
            console.error('Error adding variant:', error)
            toast.error('Failed to add variant')
        }
    }

    const deleteStep = async (e: React.MouseEvent, step: any) => {
        e.stopPropagation()
        if (sequences.length <= 1) {
            toast.warning('Campaign must have at least one step')
            return
        }
        setStepToDelete(step)
        setDeleteStepDialogOpen(true)
    }

    const confirmDeleteStep = async () => {
        if (!stepToDelete) return

        setIsDeletingStep(true)
        try {
            // Delete all variants for this step
            await Promise.all(stepToDelete.variants.map((v: any) => deleteSequenceStep(v.id, campaignId)))

            // Reload to sync step numbers and removing the step
            loadSequences()
            toast.success('Step deleted')
            setDeleteStepDialogOpen(false)
        } catch (error) {
            console.error('Error deleting step:', error)
            toast.error('Failed to delete step')
        } finally {
            setIsDeletingStep(false)
        }
    }

    // Auto-save ref
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null)

    const updateVariantContent = (newContent: Partial<{ subject: string, body: string }>) => {
        // Optimistic update locally
        if (!selectedStep || !activeVariantId) return

        const updatedVariants = selectedStep.variants.map((v: any) =>
            v.id === activeVariantId ? { ...v, ...newContent } : v
        )
        const updatedStep = { ...selectedStep, variants: updatedVariants }

        setSelectedStep(updatedStep)
        setSequences(sequences.map(s => s.step === selectedStep.step ? updatedStep : s))

        // Trigger Auto-Save
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current)

        setIsSaving(true)
        saveTimeoutRef.current = setTimeout(async () => {
            // Find latest variant state
            const latestVariant = updatedVariants.find((v: any) => v.id === activeVariantId)
            if (!latestVariant) return

            try {
                await upsertSequenceStep(campaignId, {
                    id: latestVariant.id,
                    step_number: updatedStep.step,
                    subject: latestVariant.subject,
                    body: latestVariant.body,
                    delay_days: updatedStep.delayDays,
                    variant_label: latestVariant.label
                })
                // Don't show success toast on every auto-save to avoid spam
            } catch (error) {
                console.error('Error auto-saving:', error)
                toast.error('Failed to auto-save')
            } finally {
                setIsSaving(false)
            }
        }, 1000)
    }

    const handleInputSelect = (field: 'subject' | 'body', e: React.SyntheticEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const target = e.currentTarget
        setLastSelection({
            field,
            start: target.selectionStart || 0,
            end: target.selectionEnd || 0
        })
    }

    const insertVariable = (variable: string) => {
        const variant = getActiveVariant()
        if (!variant) return

        const field = lastSelection?.field || 'body'
        const ref = field === 'subject' ? subjectRef : bodyRef
        const input = ref.current
        if (!input) return

        // Ensure we have correct focus if possible
        const start = input.selectionStart || 0
        const end = input.selectionEnd || 0
        const currentValue = field === 'subject' ? (variant.subject || '') : (variant.body || '')

        const newValue = currentValue.substring(0, start) + variable + currentValue.substring(end)

        updateVariantContent({ [field]: newValue })

        // Force update lastSelection so subsequent clicks work even if onSelect doesn't fire
        setLastSelection({
            field,
            start: start + variable.length,
            end: start + variable.length
        })

        requestAnimationFrame(() => {
            input.focus()
            input.setSelectionRange(start + variable.length, start + variable.length)
        })
    }

    const saveStep = async () => {
        const variant = getActiveVariant()
        if (!selectedStep || !variant) return

        setIsSaving(true)
        try {
            const result = await upsertSequenceStep(campaignId, {
                id: variant.id,
                step_number: selectedStep.step,
                subject: variant.subject,
                body: variant.body,
                delay_days: selectedStep.delayDays,
                variant_label: variant.label
            })

            if (result.success) {
                toast.success(`Variant ${variant.label} saved`)
            } else {
                toast.error('Failed to save: ' + result.error)
            }
        } catch (error) {
            console.error('Error saving step:', error)
            toast.error('Failed to save step')
        } finally {
            setIsSaving(false)
        }
    }

    const handleDelayUpdate = async (stepNumber: number, days: number) => {
        const step = sequences.find(s => s.step === stepNumber)
        if (!step) return

        // Update local UI
        const updatedStep = { ...step, delayDays: days }
        setSequences(sequences.map(s => s.step === stepNumber ? updatedStep : s))

        // Update ALL variants for this step on server
        try {
            await Promise.all(step.variants.map((v: any) =>
                upsertSequenceStep(campaignId, {
                    id: v.id,
                    step_number: stepNumber,
                    subject: v.subject,
                    body: v.body,
                    delay_days: days,
                    variant_label: v.label
                })
            ))
        } catch (error) {
            console.error('Error updating delay', error)
            toast.error('Failed to update delay')
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        )
    }

    if (sequences.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 border border-dashed border-zinc-800 rounded-lg">
                <p className="text-zinc-500 mb-4">No steps in this campaign yet</p>
                <Button onClick={addStep}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add First Step
                </Button>
            </div>
        )
    }

    const activeVariant = getActiveVariant()

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Steps */}
            <div className="col-span-3 space-y-4">
                {sequences.map((seq, idx) => (
                    <div key={seq.step}>
                        <div
                            onClick={() => {
                                setSelectedStep(seq)
                                if (!seq.variants.find((v: any) => v.id === activeVariantId)) {
                                    setActiveVariantId(seq.variants[0]?.id)
                                }
                            }}
                            className={cn(
                                "p-4 rounded-lg border cursor-pointer transition-all",
                                selectedStep?.step === seq.step
                                    ? "bg-zinc-900 border-primary"
                                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-white">Step {seq.step}</h4>
                                <Trash2
                                    className="h-4 w-4 text-zinc-600 hover:text-red-400 cursor-pointer transition-colors"
                                    onClick={(e) => deleteStep(e, seq)}
                                />
                            </div>
                            <div className="text-xs text-zinc-500 truncate">
                                {seq.variants.length > 1
                                    ? `${seq.variants.length} variants`
                                    : (seq.variants[0]?.subject || 'No subject')}
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-7 text-[10px] text-primary hover:text-primary/80 p-0"
                                onClick={(e) => addVariant(e, seq)}
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add variant
                            </Button>
                            {/* Variant pills if multiple */}
                            {seq.variants.length > 1 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {seq.variants.map((v: any) => (
                                        <div key={v.id} className="text-[10px] px-1.5 py-0.5 bg-zinc-800 rounded text-zinc-400">
                                            {v.label}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                        {idx < sequences.length - 1 && (
                            <div className="flex items-center gap-2 py-2 px-4">
                                <span className="text-[10px] text-zinc-600">Send next message in</span>
                                <Input
                                    type="number"
                                    value={sequences[idx + 1]?.delayDays || 1}
                                    onChange={(e) => handleDelayUpdate(sequences[idx + 1].step, parseInt(e.target.value) || 1)}
                                    className="w-12 h-6 text-xs text-center bg-zinc-950 border-zinc-800"
                                />
                                <span className="text-[10px] text-zinc-600">Days</span>
                            </div>
                        )}
                    </div>
                ))}
                <Button
                    variant="outline"
                    className="w-full border-dashed border-zinc-700 text-zinc-500 hover:text-white"
                    onClick={addStep}
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Step
                </Button>
            </div>

            {/* Right Panel - Email Editor */}
            <div className="col-span-9">
                <Card className="bg-zinc-950 border-zinc-800">
                    <CardHeader className="border-b border-zinc-800 pb-0">
                        {/* Variant Tabs */}
                        {selectedStep && selectedStep.variants.length > 1 && (
                            <div className="flex items-center gap-1 mb-4">
                                {selectedStep.variants.map((v: any) => (
                                    <button
                                        key={v.id}
                                        onClick={() => setActiveVariantId(v.id)}
                                        className={cn(
                                            "px-4 py-2 text-xs font-medium border-b-2 transition-colors",
                                            activeVariantId === v.id
                                                ? "border-primary text-white"
                                                : "border-transparent text-zinc-500 hover:text-zinc-300"
                                        )}
                                    >
                                        Variant {v.label}
                                    </button>
                                ))}
                            </div>
                        )}
                        <div className="flex items-center justify-between pb-4">
                            <div className="flex items-center gap-4">
                                <Label className="text-zinc-400">Subject</Label>
                                <Input
                                    ref={subjectRef}
                                    value={activeVariant?.subject || ''}
                                    onChange={(e) => updateVariantContent({ subject: e.target.value })}
                                    onSelect={(e) => handleInputSelect('subject', e)}
                                    onClick={(e) => handleInputSelect('subject', e)}
                                    onKeyUp={(e) => handleInputSelect('subject', e)}
                                    className="flex-1 min-w-[300px] bg-zinc-900 border-zinc-800"
                                    placeholder="Enter subject line..."
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-zinc-800"
                                onClick={openPreview}
                            >
                                <Eye className="h-4 w-4" />
                                Preview
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Textarea
                            ref={bodyRef}
                            value={activeVariant?.body || ''}
                            onChange={(e) => updateVariantContent({ body: e.target.value })}
                            onSelect={(e) => handleInputSelect('body', e)}
                            onClick={(e) => handleInputSelect('body', e)}
                            onKeyUp={(e) => handleInputSelect('body', e)}
                            className="min-h-[400px] bg-zinc-900 border-zinc-800 font-mono text-sm leading-relaxed"
                            placeholder="Write your email body here..."
                        />

                        {/* Editor Toolbar */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                            <div className="mr-auto flex items-center gap-2">
                                {isSaving ? (
                                    <div className="flex items-center text-xs text-zinc-500">
                                        <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                                        Saving...
                                    </div>
                                ) : (
                                    <div className="flex items-center text-xs text-emerald-500">
                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                        Saved
                                    </div>
                                )}
                            </div>
                            <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-zinc-400">
                                <span className="text-amber-400">✨</span>
                                AI Tools
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-zinc-400">
                                Templates
                            </Button>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-zinc-800 text-zinc-400"
                                onClick={() => {
                                    document.getElementById('variables-section')?.scrollIntoView({ behavior: 'smooth' })
                                }}
                            >
                                <span className="text-blue-400">⚡</span>
                                Variables
                            </Button>
                        </div>

                        {/* Variables Reference */}
                        <div id="variables-section" className="mt-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Available Variables — click to insert</p>
                            <div className="flex flex-wrap gap-2">
                                {['{{firstName}}', '{{lastName}}', '{{companyName}}', '{{jobTitle}}', '{{personalization}}', '{{sendingAccountFirstName}}'].map((v) => (
                                    <button
                                        key={v}
                                        className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-amber-400 cursor-pointer hover:bg-zinc-700 hover:text-amber-300 transition-colors select-none border border-zinc-700 font-mono"
                                        onClick={() => insertVariable(v)}
                                        onMouseDown={(e) => e.preventDefault()}
                                        type="button"
                                    >
                                        {v}
                                    </button>
                                ))}
                            </div>
                            <p className="text-[10px] text-zinc-600 mt-2">
                                💡 <span className="text-amber-400">{'{{personalization}}'}</span> = AI-generated icebreaker from MailSmith
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Preview Dialog */}
            <Dialog open={showPreview} onOpenChange={(open) => { setShowPreview(open); if (!open) setSelectedLeadId('sample') }}>
                <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">Email Preview</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            See how this email will look for a specific lead.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        {/* Lead Selector */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Preview as</span>
                            <select
                                value={selectedLeadId}
                                onChange={(e) => setSelectedLeadId(e.target.value)}
                                className="w-full h-9 px-3 text-sm bg-zinc-900 border border-zinc-800 rounded-md text-white focus:border-primary focus:outline-none"
                            >
                                <option value="sample">📋 Sample Data (Alex Johnson)</option>
                                {loadingPreviewLeads ? (
                                    <option disabled>Loading leads...</option>
                                ) : (
                                    previewLeads.map((lead) => (
                                        <option key={lead.id} value={lead.id}>
                                            {lead.first_name} {lead.last_name} — {lead.email}
                                        </option>
                                    ))
                                )}
                            </select>
                        </div>
                        {/* Subject */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Subject</span>
                            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-sm text-white font-medium">
                                {replaceVariables(activeVariant?.subject || '') || <span className="text-zinc-600 italic">No subject</span>}
                            </div>
                        </div>
                        {/* Body */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Body</span>
                            <div className="p-4 bg-white rounded-lg text-zinc-900 text-sm leading-relaxed whitespace-pre-wrap min-h-[200px]">
                                {replaceVariables(activeVariant?.body || '') || <span className="text-zinc-400 italic">No body content</span>}
                            </div>
                        </div>
                        {/* Variable mapping reference */}
                        <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">
                                {selectedLeadId === 'sample' ? 'Sample values used' : 'Lead data used'}
                            </p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {Object.entries(getActiveVariables()).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 text-[11px]">
                                        <code className="text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded">{key}</code>
                                        <span className="text-zinc-600">→</span>
                                        <span className="text-zinc-400 truncate">{value || <span className="italic text-zinc-600">(empty)</span>}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
            {/* Delete Step Confirmation Dialog */}
            <Dialog open={deleteStepDialogOpen} onOpenChange={setDeleteStepDialogOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-900">
                    <DialogHeader>
                        <DialogTitle>Delete Sequence Step</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete Step {stepToDelete?.step} and all its variants? <br />
                            <span className="text-red-500 font-bold">This action cannot be undone.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteStepDialogOpen(false)}
                            disabled={isDeletingStep}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={confirmDeleteStep}
                            disabled={isDeletingStep}
                        >
                            {isDeletingStep ? 'Deleting...' : 'Delete Step'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ============================================================================
// SCHEDULE TAB
// ============================================================================
const TIMEZONES = [
    "UTC",
    "America/New_York",
    "America/Chicago",
    "America/Denver",
    "America/Los_Angeles",
    "America/Anchorage",
    "America/Honolulu",
    "America/Phoenix",
    "America/Detroit",
    "America/Indiana/Indianapolis",
    "America/Kentucky/Louisville",
    "America/Toronto",
    "America/Vancouver",
    "America/Winnipeg",
    "America/Edmonton",
    "America/Halifax",
    "America/St_Johns",
    "Europe/London",
    "Europe/Paris",
    "Europe/Berlin",
    "Europe/Rome",
    "Europe/Madrid",
    "Europe/Amsterdam",
    "Europe/Brussels",
    "Europe/Dublin",
    "Europe/Lisbon",
    "Europe/Prague",
    "Europe/Vienna",
    "Europe/Warsaw",
    "Europe/Zurich",
    "Europe/Athens",
    "Europe/Bucharest",
    "Europe/Helsinki",
    "Europe/Kiev",
    "Europe/Moscow",
    "Europe/Istanbul",
    "Asia/Dubai",
    "Asia/Jerusalem",
    "Asia/Riyadh",
    "Asia/Baghdad",
    "Asia/Tehran",
    "Asia/Baku",
    "Asia/Tbilisi",
    "Asia/Yerevan",
    "Asia/Kabul",
    "Asia/Karachi",
    "Asia/Kolkata",
    "Asia/Kathmandu",
    "Asia/Dhaka",
    "Asia/Colombo",
    "Asia/Bangkok",
    "Asia/Jakarta",
    "Asia/Ho_Chi_Minh",
    "Asia/Singapore",
    "Asia/Kuala_Lumpur",
    "Asia/Hong_Kong",
    "Asia/Shanghai",
    "Asia/Taipei",
    "Asia/Manila",
    "Asia/Seoul",
    "Asia/Tokyo",
    "Australia/Perth",
    "Australia/Darwin",
    "Australia/Adelaide",
    "Australia/Brisbane",
    "Australia/Sydney",
    "Australia/Canberra",
    "Australia/Melbourne",
    "Australia/Hobart",
    "Pacific/Port_Moresby",
    "Pacific/Guam",
    "Pacific/Fiji",
    "Pacific/Auckland",
    "Pacific/Tongatapu",
    "Africa/Cairo",
    "Africa/Johannesburg",
    "Africa/Lagos",
    "Africa/Nairobi",
    "Africa/Casablanca"
].sort()

function ScheduleTab({ campaignId }: { campaignId: string }) {
    const [schedule, setSchedule] = useState({
        id: '',
        name: 'USA Schedule',
        fromHour: '9',
        fromMinute: '00',
        toHour: '18',
        toMinute: '00',
        timezone: 'America/New_York',
        days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false,
        }
    })
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    useEffect(() => {
        async function loadSchedule() {
            setIsLoading(true)
            try {
                const schedules = await getCampaignSchedules(campaignId)
                if (schedules && schedules.length > 0) {
                    const s = schedules[0] // Just load the first one for now as per UI
                    setSchedule({
                        id: s.id,
                        name: s.name,
                        fromHour: s.send_from_hour.toString(),
                        fromMinute: s.send_from_minute?.toString().padStart(2, '0') || '00',
                        toHour: s.send_to_hour.toString(),
                        toMinute: s.send_to_minute?.toString().padStart(2, '0') || '00',
                        timezone: s.timezone,
                        days: {
                            monday: s.monday,
                            tuesday: s.tuesday,
                            wednesday: s.wednesday,
                            thursday: s.thursday,
                            friday: s.friday,
                            saturday: s.saturday,
                            sunday: s.sunday,
                        }
                    })
                }
            } catch (error) {
                console.error('Error loading schedules:', error)
                toast.error('Failed to load schedule')
            } finally {
                setIsLoading(false)
            }
        }
        loadSchedule()
    }, [campaignId])

    const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

    const formatTime = (h: number) => {
        const ampm = h < 12 ? 'AM' : 'PM'
        const hours = h % 12 || 12
        return `${hours}:00 ${ampm}`
    }

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await upsertSchedule(campaignId, {
                id: schedule.id || undefined,
                name: schedule.name,
                send_from_hour: parseInt(schedule.fromHour),
                send_from_minute: parseInt(schedule.fromMinute),
                send_to_hour: parseInt(schedule.toHour),
                send_to_minute: parseInt(schedule.toMinute),
                timezone: schedule.timezone,
                ...schedule.days
            })

            if (result.success) {
                toast.success('Schedule saved successfully')
            } else {
                toast.error(result.error || 'Failed to save schedule')
            }
        } catch (error) {
            console.error('Error saving schedule:', error)
            toast.error('Failed to save schedule')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        )
    }

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar */}
            <div className="col-span-3 space-y-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        <span className="font-medium text-white">Start</span>
                        <span className="text-primary">Now</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        <span className="font-medium text-white">End</span>
                        <span className="text-primary">No end date</span>
                    </div>
                </div>

                <div className="border-t border-zinc-800 pt-4">
                    <div className="flex items-center gap-2 text-sm p-2 bg-zinc-900/50 rounded-lg border border-zinc-800">
                        <Calendar className="h-4 w-4 text-zinc-500" />
                        <span className="font-medium text-white">{schedule.name}</span>
                    </div>
                    <Button
                        variant="ghost"
                        size="sm"
                        className="mt-2 h-7 text-[10px] text-primary hover:text-primary/80"
                    >
                        <Plus className="h-3 w-3 mr-1" />
                        Add schedule
                    </Button>
                </div>
            </div>

            {/* Right Panel */}
            <div className="col-span-9">
                <Card className="bg-zinc-950 border-zinc-800">
                    <CardContent className="p-6 space-y-6">
                        {/* Schedule Name */}
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Schedule Name</Label>
                            <Input
                                value={schedule.name}
                                onChange={(e) => setSchedule({ ...schedule, name: e.target.value })}
                                className="bg-zinc-900 border-zinc-800"
                            />
                        </div>

                        {/* Timing */}
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Timing</Label>
                            <div className="grid grid-cols-3 gap-4">
                                <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-600">From</span>
                                    <Select
                                        value={`${schedule.fromHour}:${schedule.fromMinute}`}
                                        onValueChange={(val) => {
                                            const [h, m] = val.split(':')
                                            setSchedule({ ...schedule, fromHour: h, fromMinute: m })
                                        }}
                                    >
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800 max-h-[300px] overflow-y-auto">
                                            {Array.from({ length: 24 }).map((_, h) => (
                                                <SelectItem key={h} value={`${h}:00`}>
                                                    {formatTime(h)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-600">To</span>
                                    <Select
                                        value={`${schedule.toHour}:${schedule.toMinute}`}
                                        onValueChange={(val) => {
                                            const [h, m] = val.split(':')
                                            setSchedule({ ...schedule, toHour: h, toMinute: m })
                                        }}
                                    >
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800 max-h-[300px] overflow-y-auto">
                                            {Array.from({ length: 24 }).map((_, h) => (
                                                <SelectItem key={h} value={`${h}:00`}>
                                                    {formatTime(h)}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-600">Timezone</span>
                                    <Select
                                        value={schedule.timezone}
                                        onValueChange={(val) => setSchedule({ ...schedule, timezone: val })}
                                    >
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800 max-h-[300px] overflow-y-auto">
                                            {TIMEZONES.map((tz) => (
                                                <SelectItem key={tz} value={tz}>
                                                    {tz}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Days */}
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Days</Label>
                            <div className="flex items-center gap-4 flex-wrap">
                                {dayLabels.map((day) => (
                                    <label
                                        key={day}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={(schedule.days as any)[day]}
                                            onCheckedChange={(checked) => {
                                                setSchedule({
                                                    ...schedule,
                                                    days: { ...schedule.days, [day]: !!checked }
                                                })
                                            }}
                                        />
                                        <span className="text-sm text-zinc-300 capitalize">{day}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        <Button
                            className="bg-primary hover:bg-primary/90"
                            onClick={handleSave}
                            disabled={isSaving}
                        >
                            {isSaving ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Saving...
                                </>
                            ) : 'Save Schedule'}
                        </Button>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
}

// ============================================================================
// OPTIONS TAB
// ============================================================================
function OptionsTab({ campaign, setCampaign }: { campaign: any; setCampaign: any }) {
    const [isSaving, setIsSaving] = useState(false)
    const [showAdvanced, setShowAdvanced] = useState(false)
    const [advancedOptions, setAdvancedOptions] = useState<any>({})
    const [isLoadingAdvanced, setIsLoadingAdvanced] = useState(false)

    const [availableAccounts, setAvailableAccounts] = useState<any[]>([])
    const [selectedEmails, setSelectedEmails] = useState<string[]>([])
    const [isLoadingAccounts, setIsLoadingAccounts] = useState(false)

    useEffect(() => {
        async function loadAccountsAndOptions() {
            if (!campaign?.organization_id) return

            // 1. Load Accounts
            setIsLoadingAccounts(true)
            try {
                const nodes = await getOrganizationNodes(campaign.organization_id)
                setAvailableAccounts(nodes || [])

                if (campaign.instantly_campaign_id) {
                    const assigned = await getCampaignAccountsFromInstantly(campaign.id)
                    if (assigned.success && Array.isArray(assigned.emails)) {
                        setSelectedEmails(assigned.emails)
                    }
                }
            } catch (error) {
                console.error('Error loading accounts:', error)
                toast.error('Failed to load accounts')
            } finally {
                setIsLoadingAccounts(false)
            }

            // 2. Load Advanced Options
            if (campaign.instantly_campaign_id) {
                setIsLoadingAdvanced(true)
                try {
                    const adv = await getCampaignAdvancedOptionsFromInstantly(campaign.id)
                    if (adv.success && adv.options) {
                        setAdvancedOptions(adv.options)
                    }
                } catch (error) {
                    console.error('Error loading advanced options:', error)
                } finally {
                    setIsLoadingAdvanced(false)
                }
            }
        }
        loadAccountsAndOptions()
    }, [campaign?.id, campaign?.organization_id])

    const handleSaveOptions = async () => {
        setIsSaving(true)
        try {
            const result = await updateCampaign(campaign.id, {
                daily_limit: campaign.daily_limit,
                stop_on_reply: campaign.stop_on_reply,
                open_tracking: campaign.open_tracking,
                link_tracking: campaign.link_tracking,
                send_as_text: campaign.send_as_text
            })

            if (result.success) {
                // Update assigned accounts
                const accResult = await updateCampaignAccountsInInstantly(campaign.id, selectedEmails)
                if (!accResult.success) {
                    toast.error('Failed to update accounts: ' + accResult.error)
                }

                // Update advanced options
                const advResult = await updateCampaignAdvancedOptionsInInstantly(campaign.id, advancedOptions)
                if (!advResult.success) {
                    toast.error('Failed to update advanced options: ' + advResult.error)
                }

                toast.success('Campaign options saved')

                // If it was a draft locally (no ID), refresh to get the new ID
                if (!campaign.instantly_campaign_id) {
                    const refined = await getCampaignById(campaign.id)
                    if (refined.success && refined.campaign) {
                        setCampaign(refined.campaign)
                    }
                }
            } else {
                toast.error(result.error || 'Failed to save options')
            }
        } catch (error) {
            console.error('Error saving options:', error)
            toast.error('Failed to save options')
        } finally {
            setIsSaving(false)
        }
    }

    const toggleEmail = (email: string, checked: boolean) => {
        if (checked) {
            setSelectedEmails(prev => [...prev, email])
        } else {
            setSelectedEmails(prev => prev.filter(e => e !== email))
        }
    }

    return (
        <div className="max-w-3xl space-y-6">
            {/* Accounts */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6">
                    <div className="flex flex-col gap-4">
                        <div className="flex items-start justify-between">
                            <div>
                                <h3 className="font-bold text-white">Accounts to use</h3>
                                <p className="text-sm text-zinc-500 mt-1">Select accounts to send emails from</p>
                            </div>
                            <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-500 text-xs">
                                {selectedEmails.length} selected
                            </Badge>
                        </div>

                        {isLoadingAccounts ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                            </div>
                        ) : availableAccounts.length === 0 ? (
                            <p className="text-sm text-zinc-500 italic">No email accounts found for this organization.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[300px] overflow-y-auto p-1 custom-scrollbar">
                                {availableAccounts.map((acc) => {
                                    const isSelected = selectedEmails.includes(acc.email_address)
                                    return (
                                        <label
                                            key={acc.id}
                                            className={cn(
                                                "flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-colors",
                                                isSelected
                                                    ? "bg-primary/10 border-primary/50"
                                                    : "bg-zinc-900/50 border-zinc-800 hover:border-zinc-700"
                                            )}
                                        >
                                            <Checkbox
                                                checked={isSelected}
                                                onCheckedChange={(checked) => toggleEmail(acc.email_address, !!checked)}
                                            />
                                            <div className="flex flex-col overflow-hidden">
                                                <span className={cn("text-xs font-medium truncate", isSelected ? "text-primary" : "text-zinc-300")}>
                                                    {acc.email_address}
                                                </span>
                                                <span className="text-[10px] text-zinc-500 flex items-center gap-1">
                                                    Score: {acc.reputation_score || 0}
                                                    {acc.status === 'paused' && <span className="text-amber-500">• Paused</span>}
                                                </span>
                                            </div>
                                        </label>
                                    )
                                })}
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Stop on Reply */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white">Stop sending emails on reply</h3>
                            <p className="text-sm text-zinc-500 mt-1">Stop sending emails to a lead if a response has been received</p>
                        </div>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className={cn(
                                    "border-zinc-800",
                                    !campaign.stop_on_reply && "bg-zinc-900 text-white"
                                )}
                                onClick={() => setCampaign({ ...campaign, stop_on_reply: false })}
                            >
                                Disable
                            </Button>
                            <Button
                                size="sm"
                                className={cn(
                                    campaign.stop_on_reply
                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                        : "bg-zinc-900 text-zinc-400"
                                )}
                                onClick={() => setCampaign({ ...campaign, stop_on_reply: true })}
                            >
                                Enable
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Open Tracking */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white">Open Tracking</h3>
                            <p className="text-sm text-zinc-500 mt-1">Track email opens</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={campaign.link_tracking}
                                    onCheckedChange={(checked) => setCampaign({ ...campaign, link_tracking: !!checked })}
                                />
                                <span className="text-sm text-zinc-400">Link tracking</span>
                            </label>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    className={cn(
                                        "border-zinc-800",
                                        !campaign.open_tracking && "bg-zinc-900 text-white"
                                    )}
                                    onClick={() => setCampaign({ ...campaign, open_tracking: false })}
                                >
                                    Disable
                                </Button>
                                <Button
                                    size="sm"
                                    className={cn(
                                        campaign.open_tracking
                                            ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                            : "bg-zinc-900 text-zinc-400"
                                    )}
                                    onClick={() => setCampaign({ ...campaign, open_tracking: true })}
                                >
                                    Enable
                                </Button>
                            </div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Delivery Optimization */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div>
                                <h3 className="font-bold text-white">Delivery Optimization</h3>
                                <p className="text-sm text-zinc-500 mt-1">Disables open tracking</p>
                            </div>
                            <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20 text-[10px]">
                                Recommended
                            </Badge>
                        </div>
                        <div className="flex flex-col gap-2 items-end">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox
                                    checked={campaign.send_as_text}
                                    onCheckedChange={(checked) => setCampaign({ ...campaign, send_as_text: !!checked })}
                                />
                                <span className="text-sm text-zinc-400">Send emails as text-only (no HTML)</span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                                <Checkbox />
                                <span className="text-sm text-zinc-400">Send first email as text-only</span>
                                <Badge className="bg-blue-500/10 text-blue-400 border-blue-500/20 text-[10px]">Pro</Badge>
                            </label>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Daily Limit */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="font-bold text-white">Daily Limit</h3>
                            <p className="text-sm text-zinc-500 mt-1">Max number of emails to send per day for this campaign</p>
                        </div>
                        <Input
                            type="number"
                            value={campaign.daily_limit}
                            onChange={(e) => setCampaign({ ...campaign, daily_limit: parseInt(e.target.value) })}
                            className="w-24 bg-zinc-900 border-zinc-800 text-right"
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Advanced Options Section */}
            {showAdvanced && (
                <div className="space-y-6 pt-4 border-t border-zinc-800 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h3 className="text-lg font-semibold text-white">Advanced Settings</h3>

                    {isLoadingAdvanced ? (
                        <div className="flex items-center justify-center py-8">
                            <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
                        </div>
                    ) : (
                        <>
                            {/* Prioritize New Leads */}
                            <Card className="bg-zinc-950 border-zinc-800">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-white">Prioritize New Leads</h3>
                                        <p className="text-sm text-zinc-500 mt-1">Send first emails to new leads before sending follow-ups.</p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="sm"
                                            variant={advancedOptions.prioritize_new_leads ? "default" : "secondary"}
                                            className={cn(advancedOptions.prioritize_new_leads ? "bg-primary text-primary-foreground" : "bg-zinc-800 text-zinc-400")}
                                            onClick={() => setAdvancedOptions({ ...advancedOptions, prioritize_new_leads: true })}
                                        >
                                            Enable
                                        </Button>
                                        <Button
                                            size="sm"
                                            variant={!advancedOptions.prioritize_new_leads ? "default" : "outline"}
                                            className={cn(!advancedOptions.prioritize_new_leads ? "bg-zinc-900 text-white" : "border-zinc-800 text-zinc-400")}
                                            onClick={() => setAdvancedOptions({ ...advancedOptions, prioritize_new_leads: false })}
                                        >
                                            Disable
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Stop on Auto-Reply */}
                            <Card className="bg-zinc-950 border-zinc-800">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-white">Stop on Auto-Reply</h3>
                                        <p className="text-sm text-zinc-500 mt-1">Stop sending emails if an auto-reply (OOO) is received.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={advancedOptions.stop_on_auto_reply}
                                            onCheckedChange={(c) => setAdvancedOptions({ ...advancedOptions, stop_on_auto_reply: !!c })}
                                        />
                                        <span className="text-sm text-zinc-400">Enable</span>
                                    </label>
                                </CardContent>
                            </Card>

                            {/* Show Unsubscribe Header */}
                            <Card className="bg-zinc-950 border-zinc-800">
                                <CardContent className="p-6 flex items-center justify-between">
                                    <div>
                                        <h3 className="font-bold text-white">Unsubscribe Header</h3>
                                        <p className="text-sm text-zinc-500 mt-1">Include 'List-Unsubscribe' header in emails.</p>
                                    </div>
                                    <label className="flex items-center gap-2 cursor-pointer">
                                        <Checkbox
                                            checked={advancedOptions.show_unsubscribe}
                                            onCheckedChange={(c) => setAdvancedOptions({ ...advancedOptions, show_unsubscribe: !!c })}
                                        />
                                        <span className="text-sm text-zinc-400">Enable</span>
                                    </label>
                                </CardContent>
                            </Card>

                            {/* Wait Time & Variance */}
                            <Card className="bg-zinc-950 border-zinc-800">
                                <CardContent className="p-6 space-y-4">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <h3 className="font-bold text-white">Minimum Wait Time</h3>
                                            <p className="text-sm text-zinc-500 mt-1">Minimum minutes between emails sent from same account.</p>
                                        </div>
                                        <Input
                                            type="number"
                                            className="w-24 bg-zinc-900 border-zinc-800 text-right"
                                            value={advancedOptions.minimum_wait_time || 0}
                                            onChange={(e) => setAdvancedOptions({ ...advancedOptions, minimum_wait_time: parseInt(e.target.value) })}
                                        />
                                    </div>
                                    <div className="flex items-center justify-between border-t border-zinc-900 pt-4">
                                        <div>
                                            <h3 className="font-bold text-white">Random Variance</h3>
                                            <p className="text-sm text-zinc-500 mt-1">Max additional random minutes to wait.</p>
                                        </div>
                                        <Input
                                            type="number"
                                            className="w-24 bg-zinc-900 border-zinc-800 text-right"
                                            value={advancedOptions.random_variance || 0}
                                            onChange={(e) => setAdvancedOptions({ ...advancedOptions, random_variance: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </>
                    )}
                </div>
            )}

            {/* Action Bar */}
            <div className="flex items-center justify-between pt-4 border-t border-zinc-800">
                <Button
                    variant="ghost"
                    className="text-zinc-500 hover:text-white gap-2"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                >
                    <Settings className="h-4 w-4" />
                    {showAdvanced ? 'Hide advanced options' : 'Show advanced options'}
                </Button>

                <Button
                    className="bg-primary hover:bg-primary/90 min-w-[140px]"
                    onClick={handleSaveOptions}
                    disabled={isSaving}
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            Saving...
                        </>
                    ) : 'Save Changes'}
                </Button>
            </div>
        </div>
    )
}

