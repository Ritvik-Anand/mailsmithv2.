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
import { getCampaignById, getCampaignLeads } from '@/server/actions/campaigns'

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
        // TODO: Implement pause/resume via API
        setTimeout(() => {
            setCampaign((prev: any) => ({
                ...prev,
                status: prev.status === 'active' ? 'paused' : 'active'
            }))
            toast.success(campaign.status === 'active' ? 'Campaign paused' : 'Campaign resumed')
            setIsPausing(false)
        }, 1000)
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
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" size="sm" className="gap-2">
                        <RefreshCw className="h-4 w-4" />
                        Sync Stats
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

    const openRate = emailsSent > 0
        ? ((emailsOpened / emailsSent) * 100).toFixed(1)
        : '0'
    const replyRate = emailsSent > 0
        ? ((emailsReplied / emailsSent) * 100).toFixed(2)
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
            value: 'Disabled',
            icon: MousePointer,
            color: 'text-zinc-500'
        },
        {
            label: 'Replies',
            value: emailsReplied.toString(),
            subValue: `${replyRate}%`,
            icon: Reply,
            color: 'text-amber-400'
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
    }, [campaignId, currentPage])

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
    const [sequences, setSequences] = useState([
        {
            id: '1',
            step: 1,
            subject: '{{firstName}}, quick question',
            body: `{{personalization}}

This might be a long shot, but teams with complex offerings often run into the same issue:

The product is strong, but the way it's explained publicly doesn't make the value obvious — which quietly hurts inbound demand and trust.

We help teams fix that by building simple content systems that make complex products easy to understand and easy to buy.

We've done this for 40+ tech-led businesses — one example is Plena, where content-driven distribution helped grow ~300k followers and drive a 125% increase in active users.

Just curious if this is something you're actively thinking about right now, or not a focus this quarter.

Thanks,
{{sendingAccountFirstName}}`,
            delayDays: 1,
            variants: [{ id: '1a', label: 'A', subject: '{{firstName}}, quick question' }]
        },
        {
            id: '2',
            step: 2,
            subject: 'One more thought',
            body: `Hey {{firstName}},

Just wanted to follow up on my last note. Didn't want it to get buried.

Happy to share a few examples if helpful - no pressure either way.

Best,
{{sendingAccountFirstName}}`,
            delayDays: 2,
            variants: []
        },
    ])
    const [selectedStep, setSelectedStep] = useState(sequences[0])
    const bodyRef = useRef<HTMLTextAreaElement>(null)
    const [showPreview, setShowPreview] = useState(false)

    const SAMPLE_VARIABLES: Record<string, string> = {
        '{{firstName}}': 'Alex',
        '{{lastName}}': 'Johnson',
        '{{companyName}}': 'Acme Corp',
        '{{jobTitle}}': 'Head of Marketing',
        '{{personalization}}': 'Saw your recent post on LinkedIn about scaling content ops — really resonated with some of the challenges we help teams solve.',
        '{{sendingAccountFirstName}}': 'Ritvik',
    }

    const replaceVariables = (text: string) => {
        let result = text
        for (const [key, value] of Object.entries(SAMPLE_VARIABLES)) {
            result = result.replaceAll(key, value)
        }
        return result
    }

    const addStep = () => {
        const newStep = {
            id: `${Date.now()}`,
            step: sequences.length + 1,
            subject: '',
            body: '',
            delayDays: 2,
            variants: []
        }
        setSequences([...sequences, newStep])
    }

    const deleteStep = (e: React.MouseEvent, stepId: string) => {
        e.stopPropagation()
        if (sequences.length <= 1) {
            toast.error('Campaign must have at least one step')
            return
        }
        const updated = sequences
            .filter(s => s.id !== stepId)
            .map((s, idx) => ({ ...s, step: idx + 1 }))
        setSequences(updated)
        // If the deleted step was selected, select the first remaining step
        if (selectedStep.id === stepId) {
            setSelectedStep(updated[0])
        }
    }

    const insertVariable = (variable: string) => {
        const textarea = bodyRef.current
        if (!textarea) {
            // Fallback: append to end
            setSelectedStep(prev => ({ ...prev, body: prev.body + variable }))
            return
        }
        const start = textarea.selectionStart
        const end = textarea.selectionEnd
        const currentBody = selectedStep.body
        const newBody = currentBody.substring(0, start) + variable + currentBody.substring(end)
        setSelectedStep(prev => ({ ...prev, body: newBody }))
        // Restore cursor position after the inserted variable
        requestAnimationFrame(() => {
            textarea.focus()
            const newCursorPos = start + variable.length
            textarea.setSelectionRange(newCursorPos, newCursorPos)
        })
    }

    return (
        <div className="grid grid-cols-12 gap-6">
            {/* Left Sidebar - Steps */}
            <div className="col-span-3 space-y-4">
                {sequences.map((seq, idx) => (
                    <div key={seq.id}>
                        <div
                            onClick={() => setSelectedStep(seq)}
                            className={cn(
                                "p-4 rounded-lg border cursor-pointer transition-all",
                                selectedStep.id === seq.id
                                    ? "bg-zinc-900 border-primary"
                                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                            )}
                        >
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-white">Step {seq.step}</h4>
                                <Trash2
                                    className="h-4 w-4 text-zinc-600 hover:text-red-400 cursor-pointer transition-colors"
                                    onClick={(e) => deleteStep(e, seq.id)}
                                />
                            </div>
                            <div className="text-xs text-zinc-500 truncate">{seq.subject || 'No subject'}</div>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 h-7 text-[10px] text-primary hover:text-primary/80 p-0"
                            >
                                <Plus className="h-3 w-3 mr-1" />
                                Add variant
                            </Button>
                        </div>
                        {idx < sequences.length - 1 && (
                            <div className="flex items-center gap-2 py-2 px-4">
                                <span className="text-[10px] text-zinc-600">Send next message in</span>
                                <Input
                                    type="number"
                                    value={sequences[idx + 1]?.delayDays || 1}
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
                    <CardHeader className="border-b border-zinc-800 pb-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <Label className="text-zinc-400">Subject</Label>
                                <Input
                                    value={selectedStep.subject}
                                    onChange={(e) => {
                                        setSelectedStep({ ...selectedStep, subject: e.target.value })
                                    }}
                                    className="flex-1 min-w-[300px] bg-zinc-900 border-zinc-800"
                                    placeholder="Enter subject line..."
                                />
                            </div>
                            <Button
                                variant="outline"
                                size="sm"
                                className="gap-2 border-zinc-800"
                                onClick={() => setShowPreview(true)}
                            >
                                <Eye className="h-4 w-4" />
                                Preview
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="pt-4">
                        <Textarea
                            ref={bodyRef}
                            value={selectedStep.body}
                            onChange={(e) => {
                                setSelectedStep({ ...selectedStep, body: e.target.value })
                            }}
                            className="min-h-[400px] bg-zinc-900 border-zinc-800 font-mono text-sm leading-relaxed"
                            placeholder="Write your email body here..."
                        />

                        {/* Editor Toolbar */}
                        <div className="flex items-center gap-2 mt-4 pt-4 border-t border-zinc-800">
                            <Button size="sm" className="bg-primary hover:bg-primary/90">
                                Save
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-zinc-400">
                                <span className="text-amber-400">✨</span>
                                AI Tools
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-zinc-400">
                                Templates
                            </Button>
                            <Button variant="outline" size="sm" className="gap-2 border-zinc-800 text-zinc-400">
                                <span className="text-blue-400">⚡</span>
                                Variables
                            </Button>
                        </div>

                        {/* Variables Reference */}
                        <div className="mt-4 p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Available Variables — click to insert</p>
                            <div className="flex flex-wrap gap-2">
                                {['{{firstName}}', '{{lastName}}', '{{companyName}}', '{{jobTitle}}', '{{personalization}}', '{{sendingAccountFirstName}}'].map((v) => (
                                    <code
                                        key={v}
                                        className="text-[10px] bg-zinc-800 px-2 py-1 rounded text-amber-400 cursor-pointer hover:bg-zinc-700 hover:text-amber-300 transition-colors select-none"
                                        onClick={() => insertVariable(v)}
                                    >
                                        {v}
                                    </code>
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
            <Dialog open={showPreview} onOpenChange={setShowPreview}>
                <DialogContent className="sm:max-w-2xl bg-zinc-950 border-zinc-800 max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle className="text-white">Email Preview</DialogTitle>
                        <DialogDescription className="text-zinc-500">
                            Preview with sample data — variables are replaced with example values.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 mt-2">
                        {/* Subject */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Subject</span>
                            <div className="p-3 bg-zinc-900 rounded-lg border border-zinc-800 text-sm text-white font-medium">
                                {replaceVariables(selectedStep.subject) || <span className="text-zinc-600 italic">No subject</span>}
                            </div>
                        </div>
                        {/* Body */}
                        <div className="space-y-1">
                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-wider">Body</span>
                            <div className="p-4 bg-white rounded-lg text-zinc-900 text-sm leading-relaxed whitespace-pre-wrap min-h-[200px]">
                                {replaceVariables(selectedStep.body) || <span className="text-zinc-400 italic">No body content</span>}
                            </div>
                        </div>
                        {/* Variable mapping reference */}
                        <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-800">
                            <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-2">Sample values used</p>
                            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                                {Object.entries(SAMPLE_VARIABLES).map(([key, value]) => (
                                    <div key={key} className="flex items-center gap-2 text-[11px]">
                                        <code className="text-amber-400 bg-zinc-800 px-1.5 py-0.5 rounded">{key}</code>
                                        <span className="text-zinc-600">→</span>
                                        <span className="text-zinc-400 truncate">{value}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}

// ============================================================================
// SCHEDULE TAB
// ============================================================================
function ScheduleTab({ campaignId }: { campaignId: string }) {
    const [schedule, setSchedule] = useState({
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

    const dayLabels = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const

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
                                    <Select value={`${schedule.fromHour}:${schedule.fromMinute}`}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800">
                                            {Array.from({ length: 24 }).map((_, h) => (
                                                <SelectItem key={h} value={`${h}:00`}>
                                                    {h.toString().padStart(2, '0')}:00 {h < 12 ? 'AM' : 'PM'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-600">To</span>
                                    <Select value={`${schedule.toHour}:${schedule.toMinute}`}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800">
                                            {Array.from({ length: 24 }).map((_, h) => (
                                                <SelectItem key={h} value={`${h}:00`}>
                                                    {h.toString().padStart(2, '0')}:00 {h < 12 ? 'AM' : 'PM'}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-1">
                                    <span className="text-[10px] text-zinc-600">Timezone</span>
                                    <Select value={schedule.timezone}>
                                        <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800">
                                            <SelectItem value="America/New_York">Eastern Time (US & Canada)</SelectItem>
                                            <SelectItem value="America/Chicago">Central Time (US & Canada)</SelectItem>
                                            <SelectItem value="America/Denver">Mountain Time (US & Canada)</SelectItem>
                                            <SelectItem value="America/Los_Angeles">Pacific Time (US & Canada)</SelectItem>
                                            <SelectItem value="UTC">UTC</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </div>

                        {/* Days */}
                        <div className="space-y-2">
                            <Label className="text-zinc-400">Days</Label>
                            <div className="flex items-center gap-4">
                                {dayLabels.map((day) => (
                                    <label
                                        key={day}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <Checkbox
                                            checked={schedule.days[day]}
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

                        <Button className="bg-primary hover:bg-primary/90">
                            Save
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
    // Mock accounts
    const accounts = [
        { id: '1', email: 'amanda@equityscale.org' },
        { id: '2', email: 'audrey@masterapexes.com' },
        { id: '3', email: 'bruce@masterapexes.com' },
        { id: '4', email: 'christian@masterapexes.com' },
        { id: '5', email: 'christopher@masterapexes.com' },
        { id: '6', email: 'claire@octafieldunit.org' },
    ]

    return (
        <div className="max-w-3xl space-y-6">
            {/* Accounts */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                        <div>
                            <h3 className="font-bold text-white">Accounts to use</h3>
                            <p className="text-sm text-zinc-500 mt-1">Select one or more accounts to send emails from</p>
                        </div>
                        <div className="flex flex-wrap gap-2 max-w-md justify-end">
                            {accounts.slice(0, 4).map((acc) => (
                                <Badge key={acc.id} variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-300 text-xs">
                                    {acc.email}
                                    <XCircle className="h-3 w-3 ml-1 cursor-pointer hover:text-red-400" />
                                </Badge>
                            ))}
                            <Badge variant="outline" className="bg-zinc-900 border-zinc-800 text-zinc-500 text-xs">
                                +{accounts.length - 4} more
                            </Badge>
                        </div>
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
                                <Checkbox checked={campaign.link_tracking} />
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
                                <Checkbox checked={campaign.send_as_text} />
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

            {/* Advanced Options Link */}
            <div className="flex justify-center pt-4">
                <Button variant="ghost" className="text-zinc-500 hover:text-white gap-2">
                    <Settings className="h-4 w-4" />
                    Show advanced options
                </Button>
            </div>
        </div>
    )
}

// Helper function
function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
