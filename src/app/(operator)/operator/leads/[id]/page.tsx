'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
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
    Send,
    Eye,
    X,
    Building2,
    Phone,
    Linkedin,
    Save
} from 'lucide-react'
import { getLeadsFromJob, getSearchJobStatus, retrySyncFromApify, updateLeadIcebreaker } from '@/server/actions/lead-finder'
import { generateSingleIcebreaker } from '@/server/actions/ai'
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
    const [isSyncing, setIsSyncing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'queued' | 'sent'>('all')
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [editingIcebreaker, setEditingIcebreaker] = useState<string>('')
    const [isSavingIcebreaker, setIsSavingIcebreaker] = useState(false)

    const fetchData = async () => {
        setIsLoading(true)
        try {
            console.log('[LeadJobPage] Fetching data for job:', jobId)
            const [jobRes, leadsRes] = await Promise.all([
                getSearchJobStatus(jobId),
                getLeadsFromJob(jobId, { pageSize: 100 })
            ])

            console.log('[LeadJobPage] Job response:', jobRes)
            console.log('[LeadJobPage] Leads response:', leadsRes)

            if (jobRes.success && jobRes.job) {
                setJob(jobRes.job)
                // Also fetch campaigns for this org
                const caps = await getOrganizationCampaigns(jobRes.job.organization_id)
                setCampaigns(caps)
            } else {
                console.error('[LeadJobPage] Job fetch error:', jobRes.error)
            }

            if (leadsRes.success && leadsRes.leads) {
                console.log('[LeadJobPage] Setting leads:', leadsRes.leads.length)
                setLeads(leadsRes.leads)
            } else {
                console.error('[LeadJobPage] Leads fetch error:', leadsRes.error)
                toast.error(leadsRes.error || 'Failed to fetch leads')
            }
        } catch (error) {
            console.error('[LeadJobPage] Unexpected error:', error)
            toast.error('Failed to load job data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [jobId])

    // Auto-poll for running/pending jobs
    useEffect(() => {
        if (!job) return

        // If job is still running or pending, poll every 5 seconds
        if (job.status === 'running' || job.status === 'pending') {
            const pollInterval = setInterval(() => {
                fetchData()
            }, 5000)

            return () => clearInterval(pollInterval)
        }
    }, [job?.status])

    const handleGenerateIcebreakers = async () => {
        const pendingLeads = leads.filter(l => l.icebreaker_status === 'pending' || l.icebreaker_status === 'failed')
        if (pendingLeads.length === 0) {
            toast.info('All leads already have icebreakers or are in progress.')
            return
        }

        setIsGenerating(true)
        let successCount = 0
        let failureCount = 0

        try {
            // Process icebreakers one by one for "live" UI updates
            for (const lead of pendingLeads) {
                // Update local status to "generating" immediately
                setLeads(prev => prev.map(l =>
                    l.id === lead.id ? { ...l, icebreaker_status: 'generating' } : l
                ))

                const result = await generateSingleIcebreaker(lead.id)

                if (result.success) {
                    successCount++
                    // Update local state incrementally - this triggers the "Ready" count to update live!
                    setLeads(prev => prev.map(l =>
                        l.id === lead.id ? {
                            ...l,
                            icebreaker: result.icebreaker ?? null,
                            icebreaker_status: 'completed'
                        } : l
                    ))
                } else {
                    failureCount++
                    setLeads(prev => prev.map(l =>
                        l.id === lead.id ? { ...l, icebreaker_status: 'failed' } : l
                    ))
                }
            }

            if (successCount > 0) {
                toast.success(`Successfully generated ${successCount} icebreakers`)
            }
            if (failureCount > 0) {
                toast.error(`Failed to generate ${failureCount} icebreakers`)
            }
        } catch (error) {
            toast.error('Error during icebreaker generation')
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

    const handleRetrySync = async () => {
        setIsSyncing(true)
        try {
            const result = await retrySyncFromApify(jobId)
            if (result.success) {
                toast.success(result.message || `Synced ${result.leadsImported} leads from Apify`)
                fetchData() // Refresh the data
            } else {
                toast.error(result.error || 'Failed to sync from Apify')
            }
        } catch (error) {
            toast.error('Failed to sync from Apify')
        } finally {
            setIsSyncing(false)
        }
    }

    const handleUpdateIcebreaker = async () => {
        if (!selectedLead) return

        setIsSavingIcebreaker(true)
        try {
            const result = await updateLeadIcebreaker(selectedLead.id, editingIcebreaker)
            if (result.success) {
                toast.success('Icebreaker updated successfully')
                // Update local state
                setLeads(leads.map(l => l.id === selectedLead.id ? { ...l, icebreaker: editingIcebreaker, icebreaker_status: 'completed' } : l))
                setSelectedLead({ ...selectedLead, icebreaker: editingIcebreaker, icebreaker_status: 'completed' })
            } else {
                toast.error(result.error || 'Failed to update icebreaker')
            }
        } catch (error) {
            toast.error('Error updating icebreaker')
        } finally {
            setIsSavingIcebreaker(false)
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
                    <div className="flex items-center gap-2 flex-wrap">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 hover:bg-primary/10 transition-colors cursor-default">
                            {job?.status === 'completed' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                            {job?.status.toUpperCase()}
                        </Badge>
                        <span className="text-xs text-zinc-500 font-mono">Job: {jobId.slice(0, 8)}</span>
                        {job?.apify_run_id && (
                            <a
                                href={`https://console.apify.com/actors/runs/${job.apify_run_id}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-500 hover:text-blue-400 font-mono flex items-center gap-1"
                            >
                                Apify: {job.apify_run_id.slice(0, 8)}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight">Scrape Results: {job?.input_params.contact_job_title?.join(', ') || 'General Search'}</h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Found {job?.leads_found || 0} potential leads. Imported {job?.leads_imported || 0} to MailSmith.
                    </p>
                </div>

                <div className="flex items-center gap-3 flex-wrap">
                    {/* Show Retry Sync button if job has apify_run_id but no leads imported */}
                    {job?.apify_run_id && (job?.leads_imported || 0) === 0 && (
                        <Button
                            variant="outline"
                            className="bg-amber-500/10 border-amber-500/30 text-amber-500 hover:bg-amber-500/20 hover:text-amber-400"
                            onClick={handleRetrySync}
                            disabled={isSyncing}
                        >
                            {isSyncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
                            Retry Sync from Apify
                        </Button>
                    )}
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
                                        <TableRow
                                            key={lead.id}
                                            className="border-zinc-900/50 hover:bg-zinc-900/30 transition-colors cursor-pointer"
                                            onClick={() => {
                                                setSelectedLead(lead)
                                                setEditingIcebreaker(lead.icebreaker || '')
                                            }}
                                        >
                                            <TableCell className="pl-6 py-4 max-w-[200px]">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-sm text-zinc-200">{lead.first_name} {lead.last_name}</span>
                                                    <span className="text-xs text-zinc-500 truncate">{lead.job_title} @ {lead.company_name}</span>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        <span className="text-[10px] text-zinc-600 truncate">{lead.email}</span>
                                                        {lead.linkedin_url && (
                                                            <a href={lead.linkedin_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:text-primary/80" onClick={(e) => e.stopPropagation()}>
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
                                                <div className="flex items-center justify-end gap-2">
                                                    <Badge variant="outline" className={`
                                                        text-[10px] font-bold px-1.5 py-0 rounded lowercase
                                                        ${lead.campaign_status === 'queued' ? 'bg-amber-500/5 text-amber-500 border-amber-500/20' :
                                                            lead.campaign_status === 'sent' ? 'bg-emerald-500/5 text-emerald-500 border-emerald-500/20' :
                                                                'bg-zinc-500/5 text-zinc-500 border-zinc-500/20'}
                                                    `}>
                                                        {lead.campaign_status === 'not_added' ? 'ready' : lead.campaign_status}
                                                    </Badge>
                                                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-zinc-500 hover:text-primary">
                                                        <Eye className="h-3.5 w-3.5" />
                                                    </Button>
                                                </div>
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

            {/* Lead Detail Panel (Slide-out) */}
            {selectedLead && (
                <div className="fixed inset-0 z-50 flex justify-end">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                        onClick={() => setSelectedLead(null)}
                    />

                    {/* Panel */}
                    <div className="relative w-full max-w-xl bg-zinc-950 border-l border-zinc-800 h-full overflow-y-auto animate-in slide-in-from-right duration-300">
                        {/* Header */}
                        <div className="sticky top-0 bg-zinc-950 border-b border-zinc-800 p-6 flex items-start justify-between">
                            <div>
                                <h2 className="text-xl font-bold text-white">
                                    {selectedLead.first_name} {selectedLead.last_name}
                                </h2>
                                <p className="text-zinc-500 text-sm">{selectedLead.job_title} @ {selectedLead.company_name}</p>
                            </div>
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setSelectedLead(null)}
                                className="text-zinc-500 hover:text-white"
                            >
                                <X className="h-5 w-5" />
                            </Button>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Contact Info */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">Contact Info</h3>
                                <div className="grid gap-3">
                                    <div className="flex items-center gap-3 text-sm">
                                        <Mail className="h-4 w-4 text-zinc-600" />
                                        <span className="text-zinc-200">{selectedLead.email}</span>
                                    </div>
                                    {selectedLead.phone && (
                                        <div className="flex items-center gap-3 text-sm">
                                            <Phone className="h-4 w-4 text-zinc-600" />
                                            <span className="text-zinc-200">{selectedLead.phone}</span>
                                        </div>
                                    )}
                                    {selectedLead.linkedin_url && (
                                        <a
                                            href={selectedLead.linkedin_url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-3 text-sm text-primary hover:text-primary/80"
                                        >
                                            <Linkedin className="h-4 w-4" />
                                            View LinkedIn Profile
                                        </a>
                                    )}
                                </div>
                            </div>

                            {/* Icebreaker (Editable) */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">AI Icebreaker</h3>
                                    {selectedLead.icebreaker_status === 'completed' && (
                                        <Badge variant="outline" className="text-[10px] text-emerald-500 border-emerald-500/20 bg-emerald-500/5">
                                            AI Generated
                                        </Badge>
                                    )}
                                </div>
                                <div className="space-y-4">
                                    <Textarea
                                        value={editingIcebreaker}
                                        onChange={(e) => setEditingIcebreaker(e.target.value)}
                                        placeholder="No icebreaker generated yet..."
                                        className="min-h-[120px] bg-zinc-900 border-zinc-800 text-sm text-zinc-300 italic resize-none focus:ring-1 focus:ring-primary"
                                    />
                                    <div className="flex justify-end">
                                        <Button
                                            size="sm"
                                            onClick={handleUpdateIcebreaker}
                                            disabled={isSavingIcebreaker || editingIcebreaker === (selectedLead.icebreaker || '')}
                                            className="bg-primary hover:bg-primary/90 text-white text-xs font-bold"
                                        >
                                            {isSavingIcebreaker ? <Loader2 className="h-3 w-3 animate-spin mr-2" /> : <Save className="h-3 w-3 mr-2" />}
                                            Save Changes
                                        </Button>
                                    </div>
                                </div>
                            </div>

                            {/* Raw Apify Data */}
                            <div className="space-y-3">
                                <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
                                    Full Scraped Data (from Apify)
                                </h3>
                                <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 max-h-[400px] overflow-y-auto">
                                    {selectedLead.raw_scraped_data && typeof selectedLead.raw_scraped_data === 'object' ? (
                                        <div className="space-y-2">
                                            {Object.entries(selectedLead.raw_scraped_data as Record<string, any>).map(([key, value]) => {
                                                if (value === null || value === undefined || value === '') return null;
                                                return (
                                                    <div key={key} className="grid grid-cols-3 gap-2 py-1 border-b border-zinc-800 last:border-0">
                                                        <span className="text-[10px] text-zinc-500 font-mono uppercase">
                                                            {key.replace(/_/g, ' ')}
                                                        </span>
                                                        <span className="col-span-2 text-xs text-zinc-300 break-words">
                                                            {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                                                        </span>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    ) : (
                                        <p className="text-zinc-600 text-sm italic">No raw data available</p>
                                    )}
                                </div>
                            </div>

                            {/* Raw JSON (collapsible) */}
                            <details className="group">
                                <summary className="text-xs font-bold text-zinc-600 uppercase tracking-widest cursor-pointer hover:text-zinc-400">
                                    View Raw JSON
                                </summary>
                                <pre className="mt-3 bg-black p-4 rounded-lg border border-zinc-800 text-[10px] text-zinc-400 overflow-x-auto max-h-[300px] overflow-y-auto">
                                    {JSON.stringify(selectedLead.raw_scraped_data, null, 2)}
                                </pre>
                            </details>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
