'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table'
import {
    Search,
    Users,
    Mail,
    Zap,
    Loader2,
    CheckCircle2,
    AlertCircle,
    ExternalLink,
    RefreshCw,
    Sparkles,
    Send
} from 'lucide-react'
import { getLeadsFromJob, getSearchJobStatus } from '@/server/actions/lead-finder'
import { generateIcebreakersForBatch } from '@/server/actions/ai'
import { addLeadsToInstantlyCampaign, getOrganizationCampaigns } from '@/server/actions/instantly'
import { toast } from 'sonner'
import { Lead, ScrapeJob } from '@/types'

export default function LeadJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: jobId } = use(params)
    const [job, setJob] = useState<ScrapeJob | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [selectedCampaign, setSelectedCampaign] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPushing, setIsPushing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'queued' | 'sent'>('all')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            const [jobRes, leadsRes] = await Promise.all([
                getSearchJobStatus(jobId),
                getLeadsFromJob(jobId, { pageSize: 100 })
            ])

            if (jobRes.success && jobRes.job) {
                setJob(jobRes.job)
                // Also fetch campaigns for this org
                const caps = await getOrganizationCampaigns(jobRes.job.organization_id)
                setCampaigns(caps)
            }
            if (leadsRes.success && leadsRes.leads) {
                setLeads(leadsRes.leads)
            }
        } catch (error) {
            toast.error('Failed to load job data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [jobId])

    const handleGenerateIcebreakers = async () => {
        const pendingLeads = leads.filter(l => l.icebreaker_status === 'pending' || l.icebreaker_status === 'failed')
        if (pendingLeads.length === 0) {
            toast.info('All leads already have icebreakers or are in progress.')
            return
        }

        setIsGenerating(true)
        try {
            const leadIds = pendingLeads.map(l => l.id)
            const result = await generateIcebreakersForBatch(leadIds)
            if (result.success) {
                toast.success(`Successfully generated ${result.successCount} icebreakers`)
                fetchData()
            } else {
                toast.error('Failed to generate icebreakers')
            }
        } catch (error) {
            toast.error('AI Service unavailable')
        } finally {
            setIsGenerating(false)
        }
    }

    const handlePushToInstantly = async () => {
        if (!selectedCampaign) {
            toast.error('Please select a target campaign first')
            return
        }

        const readyLeads = leads.filter(l => l.icebreaker_status === 'completed' && l.campaign_status === 'not_added')
        if (readyLeads.length === 0) {
            toast.warning('No leads ready to push. Ensure icebreakers are generated first.')
            return
        }

        setIsPushing(true)
        try {
            const result = await addLeadsToInstantlyCampaign(selectedCampaign, readyLeads.map(l => l.id))
            if (result.success) {
                toast.success(`Successfully pushed ${result.count} leads to Instantly`)
                fetchData()
            } else {
                toast.error(result.error || 'Failed to push leads')
            }
        } catch (error) {
            toast.error('Failed to communicate with Instantly')
        } finally {
            setIsPushing(false)
        }
    }

    if (isLoading && !job) {
        return (
            <div className="h-96 flex flex-col items-center justify-center gap-4">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-zinc-500 font-medium">Crunching data...</p>
            </div>
        )
    }

    const filteredLeads = leads.filter(lead => {
        const matchesSearch =
            lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.job_title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase())

        if (filterStatus === 'all') return matchesSearch
        if (filterStatus === 'ready') return matchesSearch && lead.campaign_status === 'not_added'
        return matchesSearch && lead.campaign_status === filterStatus
    })

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors cursor-default">
                            {job?.status === 'completed' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                            {job?.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-zinc-500 font-mono">ID: {jobId.slice(0, 8)}</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Scrape Results: {job?.input_params.contact_job_title?.join(', ')}</h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Found {job?.leads_found} potential leads. Imported {job?.leads_imported} to MailSmith.
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <Button
                        variant="outline"
                        className="bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                        onClick={fetchData}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    <Button
                        className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                        onClick={handleGenerateIcebreakers}
                        disabled={isGenerating || leads.length === 0}
                    >
                        {isGenerating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Sparkles className="mr-2 h-4 w-4" />}
                        Generate Icebreakers
                    </Button>
                </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
                {/* Leads Table */}
                <div className="lg:col-span-2 space-y-4">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-500" />
                            <Input
                                placeholder="Search leads by name, email, or company..."
                                className="pl-10 bg-zinc-950 border-zinc-800 h-10 text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {(['all', 'ready', 'queued', 'sent'] as const).map(status => (
                                <Button
                                    key={status}
                                    variant="outline"
                                    size="sm"
                                    className={`text-[10px] font-bold uppercase tracking-widest h-8 px-3 ${filterStatus === status ? 'border-primary text-primary bg-primary/5' : 'border-zinc-800 text-zinc-500'}`}
                                    onClick={() => setFilterStatus(status)}
                                >
                                    {status}
                                </Button>
                            ))}
                        </div>
                    </div>

                    <Card className="bg-zinc-950 border-zinc-800 rounded-xl overflow-hidden shadow-none">
                        <CardHeader className="border-b border-zinc-900 bg-zinc-900/10 py-3">
                            <div className="flex items-center justify-between">
                                <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Prospect List</CardTitle>
                                <span className="text-[10px] text-zinc-500 font-mono">{filteredLeads.length} matches</span>
                            </div>
                        </CardHeader>
                        <CardContent className="p-0">
                            <Table>
                                <TableHeader>
                                    <TableRow className="border-zinc-900 hover:bg-transparent bg-black">
                                        <TableHead className="text-[10px] font-bold text-zinc-500 pl-6 h-10 uppercase">Lead</TableHead>
                                        <TableHead className="text-[10px] font-bold text-zinc-500 h-10 uppercase">Icebreaker</TableHead>
                                        <TableHead className="text-[10px] font-bold text-zinc-500 h-10 uppercase pr-6 text-right">Status</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={3} className="h-32 text-center text-zinc-600 italic text-xs">
                                                No leads matching your filters
                                            </TableCell>
                                        </TableRow>
                                    ) : filteredLeads.map((lead) => (
                                        <TableRow key={lead.id} className="border-zinc-900/50 hover:bg-zinc-900/30 transition-colors">
                                            <TableCell className="pl-6 py-4 max-w-[200px]">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-zinc-200">{lead.first_name} {lead.last_name}</span>
                                                    <span className="text-xs text-zinc-500 truncate">{lead.job_title} @ {lead.company_name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-zinc-600 truncate">{lead.email}</span>
                                                        {lead.linkedin_url && (
                                                            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80">
                                                                <ExternalLink className="h-3 w-3" />
                                                            </a>
                                                        )}
                                                    </div>
                                                </div>
                                            </TableCell>
                                            <TableCell className="py-4">
                                                {lead.icebreaker_status === 'completed' ? (
                                                    <p className="text-xs text-zinc-300 italic line-clamp-2 max-w-[300px]">"{lead.icebreaker}"</p>
                                                ) : lead.icebreaker_status === 'generating' ? (
                                                    <div className="flex items-center gap-2 text-primary font-bold text-[10px] uppercase tracking-tighter">
                                                        <Loader2 className="h-3 w-3 animate-spin" />
                                                        Writing...
                                                    </div>
                                                ) : lead.icebreaker_status === 'failed' ? (
                                                    <span className="text-xs text-red-500 font-medium">Wait, let me try again</span>
                                                ) : (
                                                    <span className="text-[10px] text-zinc-600 uppercase font-black tracking-widest">Pending AI Review</span>
                                                )}
                                            </TableCell>
                                            <TableCell className="pr-6 text-right">
                                                <Badge variant="outline" className={`
                                                    text-[10px] font-bold px-1.5 py-0 rounded lowercase
                                                    ${lead.campaign_status === 'queued' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' :
                                                        lead.campaign_status === 'sent' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                                                            'bg-zinc-500/5 text-zinc-500 border-zinc-500/20'}
                                                `}>
                                                    {lead.campaign_status === 'not_added' ? 'ready' : lead.campaign_status}
                                                </Badge>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>

                {/* Automation Panel */}
                <div className="space-y-6">
                    <Card className="bg-zinc-950 border-zinc-800 shadow-none border-t-primary/30 border-t-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-primary">Push to Outreach</CardTitle>
                            <CardDescription className="text-[11px] text-zinc-500">Send these high-quality leads to an active Instantly campaign.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs text-zinc-400">Target Campaign</Label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                    value={selectedCampaign}
                                    onChange={(e) => setSelectedCampaign(e.target.value)}
                                >
                                    <option value="">Select a campaign...</option>
                                    {campaigns.map(cap => (
                                        <option key={cap.id} value={cap.id}>{cap.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">Total Leads</span>
                                    <span className="font-bold text-white">{leads.length}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">Icebreakers Ready</span>
                                    <span className="font-bold text-green-500">{leads.filter(l => l.icebreaker_status === 'completed').length}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-zinc-900 pt-3">
                                    <span className="text-zinc-500">Available to push</span>
                                    <span className="font-bold text-white">{leads.filter(l => l.icebreaker_status === 'completed' && l.campaign_status === 'not_added').length}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 shadow-xl shadow-primary/20 transition-all"
                                disabled={isPushing || leads.filter(l => l.icebreaker_status === 'completed' && l.campaign_status === 'not_added').length === 0}
                                onClick={handlePushToInstantly}
                            >
                                {isPushing ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Pushing to Instantly...
                                    </>
                                ) : (
                                    <>
                                        <Send className="mr-2 h-4 w-4" />
                                        PUSH TO CAMPAIGN
                                    </>
                                )}
                            </Button>
                        </CardContent>
                    </Card>

                    <Card className="bg-zinc-950 border-zinc-800 shadow-none">
                        <CardHeader>
                            <CardTitle className="text-xs font-bold uppercase tracking-widest text-zinc-500">Processing Stats</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                                <div
                                    className="h-full bg-primary transition-all duration-500"
                                    style={{ width: `${(leads.filter(l => l.icebreaker_status === 'completed').length / (leads.length || 1)) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium">
                                AI coverage: <span className="text-zinc-200">{(leads.filter(l => l.icebreaker_status === 'completed').length / (leads.length || 1) * 100).toFixed(0)}%</span> of this batch.
                            </p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    )
}
