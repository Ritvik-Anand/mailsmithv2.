'use client'

import { useState, useEffect, use } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
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
    Loader,
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
    Save,
    Download,
    ChevronLeft,
    ChevronRight,
    UserPlus,
    Pencil,
    Check,
    Plus
} from 'lucide-react'
import { getLeadsFromJob, getSearchJobStatus, retrySyncFromApify, updateLeadIcebreaker, exportLeadsToCSV, assignLeadsToCustomer, renameScrapeJob, createCampaignFromPush } from '@/server/actions/lead-finder'
import { generateSingleIcebreaker } from '@/server/actions/ai'
import { addLeadsToInstantlyCampaign, getOrganizationCampaigns } from '@/server/actions/instantly'
import { getOrganizationsWithIcebreakerConfigs, getOrganizations } from '@/server/actions/organizations'
import { toast } from 'sonner'
import { Lead, ScrapeJob } from '@/types'

export default function LeadJobPage({ params }: { params: Promise<{ id: string }> }) {
    const { id: jobId } = use(params)
    const [job, setJob] = useState<ScrapeJob | null>(null)
    const [leads, setLeads] = useState<Lead[]>([])
    const [totalLeads, setTotalLeads] = useState(0)
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [selectedCampaign, setSelectedCampaign] = useState<string>('')
    const [isLoading, setIsLoading] = useState(true)
    const [isGenerating, setIsGenerating] = useState(false)
    const [isPushing, setIsPushing] = useState(false)
    const [isSyncing, setIsSyncing] = useState(false)
    const [isExporting, setIsExporting] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterStatus, setFilterStatus] = useState<'all' | 'ready' | 'queued' | 'sent'>('all')
    const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
    const [editingIcebreaker, setEditingIcebreaker] = useState<string>('')
    const [isSavingIcebreaker, setIsSavingIcebreaker] = useState(false)
    const [currentPage, setCurrentPage] = useState(1)
    const [pageSize, setPageSize] = useState(100)
    const [loadAll, setLoadAll] = useState(false)
    const [cancelGeneration, setCancelGeneration] = useState(false)
    const [regenerateMode, setRegenerateMode] = useState(false)
    const [generateLimit, setGenerateLimit] = useState<number | null>(null)
    const [allLeadsStats, setAllLeadsStats] = useState<{
        total: number
        completed: number
        pending: number
        failed: number
        readyToPush: number
    }>({
        total: 0,
        completed: 0,
        pending: 0,
        failed: 0,
        readyToPush: 0
    })
    const [icebreakerConfigs, setIcebreakerConfigs] = useState<Array<{ id: string; name: string }>>([])
    const [selectedConfigOrgId, setSelectedConfigOrgId] = useState<string>('')
    const [allOrganizations, setAllOrganizations] = useState<any[]>([])
    const [selectedTargetOrg, setSelectedTargetOrg] = useState('')
    const [isAssigning, setIsAssigning] = useState(false)

    // Rename job feature
    const [isRenamingJob, setIsRenamingJob] = useState(false)
    const [newJobName, setNewJobName] = useState('')

    // Create campaign feature
    const [isCreatingCampaign, setIsCreatingCampaign] = useState(false)
    const [newCampaignName, setNewCampaignName] = useState('')

    // Confirmation States
    const [assignDialogOpen, setAssignDialogOpen] = useState(false)
    const [generationDialogOpen, setGenerationDialogOpen] = useState(false)
    const [leadsToProcess, setLeadsToProcess] = useState<any[]>([])
    const [generationMessage, setGenerationMessage] = useState('')

    const fetchData = async (resetPage = false) => {
        setIsLoading(true)
        try {
            console.log('[LeadJobPage] Fetching data for job:', jobId)

            // If resetPage is true, reset to page 1
            const page = resetPage ? 1 : currentPage
            if (resetPage) setCurrentPage(1)

            const [jobRes, leadsRes] = await Promise.all([
                getSearchJobStatus(jobId),
                getLeadsFromJob(jobId, {
                    page: loadAll ? 1 : page,
                    pageSize: loadAll ? -1 : pageSize
                })
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
                setTotalLeads(leadsRes.total || 0)

                // Fetch ALL leads stats if we're on a paginated view
                if (!loadAll && leadsRes.total && leadsRes.total > pageSize) {
                    // Fetch all leads to calculate accurate stats
                    const allLeadsRes = await getLeadsFromJob(jobId, { pageSize: -1 })
                    if (allLeadsRes.success && allLeadsRes.leads) {
                        const all = allLeadsRes.leads
                        setAllLeadsStats({
                            total: all.length,
                            completed: all.filter(l => l.icebreaker_status === 'completed').length,
                            pending: all.filter(l => l.icebreaker_status === 'pending').length,
                            failed: all.filter(l => l.icebreaker_status === 'failed').length,
                            readyToPush: all.filter(l => l.icebreaker_status === 'completed' && l.campaign_status === 'not_added').length
                        })
                    }
                } else {
                    // Calculate stats from current leads
                    setAllLeadsStats({
                        total: leadsRes.leads.length,
                        completed: leadsRes.leads.filter(l => l.icebreaker_status === 'completed').length,
                        pending: leadsRes.leads.filter(l => l.icebreaker_status === 'pending').length,
                        failed: leadsRes.leads.filter(l => l.icebreaker_status === 'failed').length,
                        readyToPush: leadsRes.leads.filter(l => l.icebreaker_status === 'completed' && l.campaign_status === 'not_added').length
                    })
                }
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
        // Also fetch icebreaker configs
        fetchIcebreakerConfigs()
        // Fetch all organizations for assignment dropdown
        fetchAllOrganizations()
    }, [jobId, currentPage, loadAll])

    const fetchAllOrganizations = async () => {
        const result = await getOrganizations()
        if (result && Array.isArray(result)) {
            setAllOrganizations(result)
        }
    }

    const fetchIcebreakerConfigs = async () => {
        const result = await getOrganizationsWithIcebreakerConfigs()
        if (result.success && result.organizations) {
            setIcebreakerConfigs(result.organizations)
            // Auto-select the job's organization if it has a config
            if (job?.organization_id) {
                const hasConfig = result.organizations.find(org => org.id === job.organization_id)
                if (hasConfig) {
                    setSelectedConfigOrgId(job.organization_id)
                }
            }
        }
    }

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

    const initiateGeneration = async () => {
        setIsGenerating(true)
        toast.info('Loading all leads from job...')

        try {
            // First, fetch ALL leads from the job
            const allLeadsRes = await getLeadsFromJob(jobId, { pageSize: -1 })
            if (!allLeadsRes.success || !allLeadsRes.leads) {
                toast.error('Failed to load leads')
                setIsGenerating(false)
                return
            }

            const allLeads = allLeadsRes.leads

            // In regenerate mode, target ALL leads. Otherwise, only pending/failed
            const targetLeads = regenerateMode
                ? allLeads
                : allLeads.filter(l => l.icebreaker_status === 'pending' || l.icebreaker_status === 'failed')

            // Apply limit if specified
            const leadsToGen = generateLimit && generateLimit > 0
                ? targetLeads.slice(0, generateLimit)
                : targetLeads

            if (leadsToGen.length === 0) {
                toast.info('No leads to generate icebreakers for.')
                setIsGenerating(false)
                return
            }

            setLeadsToProcess(leadsToGen)

            // If regenerate mode, ask for confirmation. 
            // Actually, let's ask always for better UX, or stick to original logic.
            // Original: only if regenerateMode. 
            // But having a dialog popup is good practice for bulk actions.
            const message = regenerateMode
                ? `Generate icebreakers for ${leadsToGen.length} leads (including ${targetLeads.filter(l => l.icebreaker_status === 'completed').length} with existing icebreakers)?`
                : `Generate icebreakers for ${leadsToGen.length} leads?`

            setGenerationMessage(message)

            if (regenerateMode) {
                setGenerationDialogOpen(true)
            } else {
                // If not regenerate mode, just start?
                // The user asked for popups. Let's make it consistent and ask always.
                setGenerationDialogOpen(true)
            }
        } catch (error) {
            console.error('Error preparing generation:', error)
            toast.error('Failed to prepare generation')
            setIsGenerating(false)
        }
    }

    const executeGeneration = async () => {
        setGenerationDialogOpen(false)
        // Keep isGenerating true

        try {
            setCancelGeneration(false)
            let successCount = 0
            let failureCount = 0
            let skippedCount = 0

            toast.info(`Generating icebreakers for ${leadsToProcess.length} leads...`)

            // Process icebreakers one by one
            for (let i = 0; i < leadsToProcess.length; i++) {
                const lead = leadsToProcess[i]

                // Check if user cancelled
                if (cancelGeneration) {
                    const processed = successCount + failureCount + skippedCount
                    toast.warning(`Generation stopped. Processed ${processed} of ${leadsToProcess.length} leads.`)
                    break
                }

                if (i > 0 && i % 10 === 0) {
                    toast.info(`Progress: ${i}/${leadsToProcess.length} leads processed...`)
                }

                // Update local status
                setLeads(prev => prev.map(l =>
                    l.id === lead.id ? { ...l, icebreaker_status: 'generating' } : l
                ))

                const result = await generateSingleIcebreaker(lead.id, selectedConfigOrgId || undefined)

                if (result.success) {
                    successCount++
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

            if (!cancelGeneration) {
                if (successCount > 0) toast.success(`Successfully generated ${successCount} icebreakers`)
                if (failureCount > 0) toast.error(`Failed to generate ${failureCount} icebreakers`)
            }

            await fetchData()
        } catch (error) {
            toast.error('Error during icebreaker generation')
        } finally {
            setIsGenerating(false)
            setCancelGeneration(false)
        }
    }

    const handleStopGeneration = () => {
        setCancelGeneration(true)
        toast.info('Stopping generation after current lead...')
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
                toast.success(result.message || `Successfully pushed ${result.count} leads to campaign`)
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

    const initiateAssign = () => {
        if (!selectedTargetOrg) {
            toast.error('Please select a target customer first')
            return
        }
        setAssignDialogOpen(true)
    }

    const executeAssign = async () => {
        setAssignDialogOpen(false)
        setIsAssigning(true)
        try {
            const result = await assignLeadsToCustomer({
                jobId,
                targetOrganizationId: selectedTargetOrg
            })

            if (result.success) {
                toast.success(`Successfully assigned ${result.assignedCount} leads to customer`)
                await fetchData()
            } else {
                toast.error(result.error || 'Failed to assign leads')
            }
        } catch (error) {
            toast.error('Error assigning leads to customer')
        } finally {
            setIsAssigning(false)
        }
    }

    const handleRenameJob = async () => {
        if (!newJobName.trim()) {
            toast.error('Please enter a job name')
            return
        }

        setIsRenamingJob(true)
        try {
            const result = await renameScrapeJob({
                jobId,
                newName: newJobName.trim()
            })

            if (result.success) {
                toast.success('Job renamed successfully')
                setJob(job ? { ...job, name: newJobName.trim() } : null)
                setIsRenamingJob(false)
                setNewJobName('')
            } else {
                toast.error(result.error || 'Failed to rename job')
            }
        } catch (error) {
            toast.error('Error renaming job')
        } finally {
            setIsRenamingJob(false)
        }
    }

    const handleCreateCampaign = async () => {
        if (!newCampaignName.trim()) {
            toast.error('Please enter a campaign name')
            return
        }

        if (!job?.organization_id) {
            toast.error('Organization not found')
            return
        }

        setIsCreatingCampaign(true)
        try {
            const result = await createCampaignFromPush({
                organizationId: job.organization_id,
                campaignName: newCampaignName.trim()
            })

            if (result.success && result.campaignId) {
                toast.success('Campaign created successfully')
                // Refresh campaigns list
                const caps = await getOrganizationCampaigns(job.organization_id)
                setCampaigns(caps)
                // Auto-select the new campaign
                setSelectedCampaign(result.campaignId)
                setIsCreatingCampaign(false)
                setNewCampaignName('')
            } else {
                toast.error(result.error || 'Failed to create campaign')
            }
        } catch (error) {
            toast.error('Error creating campaign')
        } finally {
            setIsCreatingCampaign(false)
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

    const handleExportCSV = async () => {
        setIsExporting(true)
        try {
            const result = await exportLeadsToCSV(jobId)
            if (result.success && result.csvContent && result.filename) {
                // Create a blob and download
                const blob = new Blob([result.csvContent], { type: 'text/csv;charset=utf-8;' })
                const link = document.createElement('a')
                const url = URL.createObjectURL(blob)
                link.setAttribute('href', url)
                link.setAttribute('download', result.filename)
                link.style.visibility = 'hidden'
                document.body.appendChild(link)
                link.click()
                document.body.removeChild(link)
                toast.success(`Exported ${totalLeads} leads to CSV`)
            } else {
                toast.error(result.error || 'Failed to export CSV')
            }
        } catch (error) {
            toast.error('Error exporting CSV')
        } finally {
            setIsExporting(false)
        }
    }

    const handleLoadAll = () => {
        setLoadAll(true)
        setCurrentPage(1)
    }

    const handleNextPage = () => {
        if (currentPage * pageSize < totalLeads) {
            setCurrentPage(prev => prev + 1)
        }
    }

    const handlePrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(prev => prev - 1)
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
                            {job?.status === 'completed' ? <CheckCircle2 className="mr-1 h-3 w-3" /> : <Loader className="mr-1 h-3 w-3" />}
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
                                ID: {job.apify_run_id.slice(0, 8)}
                                <ExternalLink className="h-3 w-3" />
                            </a>
                        )}
                    </div>
                    {!isRenamingJob ? (
                        <div className="flex items-center gap-2">
                            <h1 className="text-2xl font-bold text-white tracking-tight">
                                {job?.name || `Scrape Results: ${job?.input_params.contact_job_title?.join(', ') || 'General Search'}`}
                            </h1>
                            <button
                                onClick={() => {
                                    setIsRenamingJob(true)
                                    setNewJobName(job?.name || job?.input_params.contact_job_title?.join(', ') || 'General Search')
                                }}
                                className="p-1.5 rounded hover:bg-zinc-800 text-zinc-500 hover:text-zinc-300 transition-colors"
                                title="Rename job"
                            >
                                <Pencil className="h-4 w-4" />
                            </button>
                        </div>
                    ) : (
                        <div className="flex items-center gap-2">
                            <Input
                                value={newJobName}
                                onChange={(e) => setNewJobName(e.target.value)}
                                className="text-xl font-bold bg-zinc-900 border-zinc-700 text-white max-w-md"
                                placeholder="Enter job name"
                                autoFocus
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter') handleRenameJob()
                                    if (e.key === 'Escape') {
                                        setIsRenamingJob(false)
                                        setNewJobName('')
                                    }
                                }}
                            />
                            <Button
                                size="sm"
                                onClick={handleRenameJob}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <Check className="h-4 w-4 mr-1" />
                                Save
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setIsRenamingJob(false)
                                    setNewJobName('')
                                }}
                            >
                                <X className="h-4 w-4" />
                            </Button>
                        </div>
                    )}
                    <p className="text-zinc-500 text-sm font-medium">
                        Found {job?.leads_found || 0} potential leads. Imported {job?.leads_imported || 0} to MailSmith.
                    </p>
                </div>

                <div className="flex flex-col md:flex-row items-start md:items-center gap-3 w-full md:w-auto">
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
                        className="bg-emerald-600/10 border-emerald-600/30 text-emerald-500 hover:bg-emerald-600/20 hover:text-emerald-400"
                        onClick={handleExportCSV}
                        disabled={isExporting || leads.length === 0}
                    >
                        {isExporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                        Export CSV
                    </Button>
                    <Button
                        variant="outline"
                        className="bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white"
                        onClick={() => fetchData(true)}
                    >
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                    </Button>
                    {/* Generation Controls */}
                    <div className="flex flex-wrap items-center gap-3">
                        {/* Icebreaker Config Selector */}
                        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
                            <label className="text-xs text-zinc-400 font-medium whitespace-nowrap">Config:</label>
                            <select
                                value={selectedConfigOrgId}
                                onChange={(e) => setSelectedConfigOrgId(e.target.value)}
                                disabled={isGenerating}
                                className="bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-primary outline-none min-w-[150px]"
                            >
                                <option value="">Default (Job's Org)</option>
                                {icebreakerConfigs.map(org => (
                                    <option key={org.id} value={org.id}>{org.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Regenerate Mode Toggle */}
                        <label className="flex items-center gap-2 cursor-pointer bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800 hover:border-zinc-700">
                            <input
                                type="checkbox"
                                checked={regenerateMode}
                                onChange={(e) => setRegenerateMode(e.target.checked)}
                                disabled={isGenerating}
                                className="w-4 h-4 rounded border-zinc-700 text-primary focus:ring-primary"
                            />
                            <span className="text-xs text-zinc-400 font-medium">Regenerate All</span>
                        </label>

                        {/* Quantity Limit */}
                        <div className="flex items-center gap-2 bg-zinc-900 px-3 py-2 rounded-lg border border-zinc-800">
                            <label className="text-xs text-zinc-400 font-medium">Limit:</label>
                            <input
                                type="number"
                                min="1"
                                max="1000"
                                value={generateLimit || ''}
                                onChange={(e) => setGenerateLimit(e.target.value ? parseInt(e.target.value) : null)}
                                placeholder="All"
                                disabled={isGenerating}
                                className="w-20 bg-zinc-950 border border-zinc-700 rounded px-2 py-1 text-xs text-white focus:ring-1 focus:ring-primary outline-none"
                            />
                        </div>

                        {/* Generate/Stop Button */}
                        {isGenerating ? (
                            <Button
                                variant="destructive"
                                className="bg-red-600 hover:bg-red-500 text-white font-bold shadow-lg shadow-red-500/20"
                                onClick={handleStopGeneration}
                            >
                                <X className="mr-2 h-4 w-4" />
                                Stop Generation
                            </Button>
                        ) : (
                            <Button
                                className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold shadow-lg shadow-indigo-500/20"
                                onClick={initiateGeneration}
                                disabled={leads.length === 0}
                            >
                                <Sparkles className="mr-2 h-4 w-4" />
                                {regenerateMode ? 'Regenerate' : 'Generate'} {generateLimit ? `(${generateLimit})` : ''}
                            </Button>
                        )}
                    </div>
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
                                <div className="flex items-center gap-4">
                                    <CardTitle className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Prospect List</CardTitle>
                                    <span className="text-[10px] text-zinc-500 font-mono">
                                        Showing {leads.length} of {totalLeads} leads {!loadAll && totalLeads > pageSize && `(Page ${currentPage})`}
                                    </span>
                                </div>
                                {!loadAll && totalLeads > pageSize && (
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-7 text-[10px] bg-primary/10 border-primary/30 text-primary hover:bg-primary/20"
                                        onClick={handleLoadAll}
                                    >
                                        Load All {totalLeads} Leads
                                    </Button>
                                )}
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
                        {!loadAll && totalLeads > pageSize && (
                            <div className="border-t border-zinc-900 bg-zinc-900/10 px-6 py-3 flex items-center justify-between">
                                <span className="text-xs text-zinc-500">
                                    Page {currentPage} of {Math.ceil(totalLeads / pageSize)}
                                </span>
                                <div className="flex items-center gap-2">
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"
                                        onClick={handlePrevPage}
                                        disabled={currentPage === 1}
                                    >
                                        <ChevronLeft className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="outline"
                                        className="h-8 px-3 bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white disabled:opacity-50"
                                        onClick={handleNextPage}
                                        disabled={currentPage * pageSize >= totalLeads}
                                    >
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            </div>
                        )}
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
                                {!isCreatingCampaign ? (
                                    <>
                                        <select
                                            className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm focus:ring-1 focus:ring-primary outline-none"
                                            value={selectedCampaign}
                                            onChange={(e) => {
                                                if (e.target.value === '__create_new__') {
                                                    setIsCreatingCampaign(true)
                                                } else {
                                                    setSelectedCampaign(e.target.value)
                                                }
                                            }}
                                        >
                                            <option value="">Select a campaign...</option>
                                            <option value="__create_new__" className="text-primary font-bold">
                                                ➕ Create New Campaign
                                            </option>
                                            {campaigns.map(cap => (
                                                <option key={cap.id} value={cap.id}>{cap.name}</option>
                                            ))}
                                        </select>
                                    </>
                                ) : (
                                    <div className="space-y-2 p-3 bg-zinc-900/50 border border-primary/20 rounded-lg">
                                        <div className="flex items-center gap-2 text-xs text-primary font-bold mb-2">
                                            <Plus className="h-3 w-3" />
                                            Create New Campaign
                                        </div>
                                        <Input
                                            value={newCampaignName}
                                            onChange={(e) => setNewCampaignName(e.target.value)}
                                            className="bg-zinc-950 border-zinc-700 text-sm"
                                            placeholder="Enter campaign name"
                                            autoFocus
                                            onKeyDown={(e) => {
                                                if (e.key === 'Enter') handleCreateCampaign()
                                                if (e.key === 'Escape') {
                                                    setIsCreatingCampaign(false)
                                                    setNewCampaignName('')
                                                }
                                            }}
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                size="sm"
                                                onClick={handleCreateCampaign}
                                                className="flex-1 bg-primary hover:bg-primary/90"
                                            >
                                                <Check className="h-3 w-3 mr-1" />
                                                Create
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => {
                                                    setIsCreatingCampaign(false)
                                                    setNewCampaignName('')
                                                }}
                                                className="border-zinc-700"
                                            >
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">Total Leads</span>
                                    <span className="font-bold text-white">{allLeadsStats.total}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">Icebreakers Ready</span>
                                    <span className="font-bold text-green-500">{allLeadsStats.completed}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs">
                                    <span className="text-zinc-500">Pending Generation</span>
                                    <span className="font-bold text-amber-500">{allLeadsStats.pending + allLeadsStats.failed}</span>
                                </div>
                                <div className="flex items-center justify-between text-xs border-t border-zinc-900 pt-3">
                                    <span className="text-zinc-500">Available to push</span>
                                    <span className="font-bold text-white">{allLeadsStats.readyToPush}</span>
                                </div>
                            </div>

                            <Button
                                className="w-full bg-primary hover:bg-primary/90 text-white font-black py-6 shadow-xl shadow-primary/20 transition-all"
                                disabled={isPushing || allLeadsStats.readyToPush === 0}
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

                    {/* Assign to Customer Card */}
                    <Card className="bg-zinc-950 border-zinc-800 shadow-none border-t-blue-500/30 border-t-2">
                        <CardHeader>
                            <CardTitle className="text-sm font-bold uppercase tracking-widest text-blue-500 flex items-center gap-2">
                                <UserPlus className="h-4 w-4" />
                                Assign to Customer
                            </CardTitle>
                            <CardDescription className="text-[11px] text-zinc-500">
                                Transfer these leads to a customer's account without adding to campaign.
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="space-y-2">
                                <Label className="text-xs text-zinc-400">Target Customer</Label>
                                <select
                                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg h-10 px-3 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                                    value={selectedTargetOrg}
                                    onChange={(e) => setSelectedTargetOrg(e.target.value)}
                                >
                                    <option value="">Select customer...</option>
                                    {allOrganizations.map(org => (
                                        <option key={org.id} value={org.id}>{org.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="space-y-2 bg-blue-500/5 border border-blue-500/20 rounded-lg p-3">
                                <p className="text-[10px] text-zinc-500 font-semibold uppercase tracking-wider">What This Does:</p>
                                <ul className="text-[11px] text-zinc-400 space-y-1">
                                    <li>• Transfers {allLeadsStats.total} leads to customer's account</li>
                                    <li>• Leads become visible in customer's dashboard</li>
                                    <li>• Does NOT add to any campaign yet</li>
                                    <li>• Customer can review and organize leads first</li>
                                </ul>
                            </div>

                            <Button
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-black py-6 shadow-xl shadow-blue-500/20 transition-all"
                                disabled={isAssigning || !selectedTargetOrg || allLeadsStats.total === 0}
                                onClick={initiateAssign}
                            >
                                {isAssigning ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Assigning...
                                    </>
                                ) : (
                                    <>
                                        <UserPlus className="mr-2 h-4 w-4" />
                                        ASSIGN TO CUSTOMER
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
                                    style={{ width: `${(allLeadsStats.completed / (allLeadsStats.total || 1)) * 100}%` }}
                                />
                            </div>
                            <p className="text-[10px] text-zinc-500 font-medium">
                                AI coverage: <span className="text-zinc-200">{(allLeadsStats.completed / (allLeadsStats.total || 1) * 100).toFixed(0)}%</span> across all {allLeadsStats.total} leads.
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
            {/* Confirmation Dialogs */}
            <Dialog open={assignDialogOpen} onOpenChange={setAssignDialogOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Assign Leads to Customer</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Assign all {allLeadsStats.total} leads to the selected customer? This allows the customer to view these leads in their portal.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setAssignDialogOpen(false)}>Cancel</Button>
                        <Button onClick={executeAssign}>Confirm Assignment</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={generationDialogOpen} onOpenChange={setGenerationDialogOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-900 text-zinc-100">
                    <DialogHeader>
                        <DialogTitle>Generate Icebreakers</DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            {generationMessage}
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => {
                            setGenerationDialogOpen(false)
                            setIsGenerating(false) // Reset loading state
                        }}>Cancel</Button>
                        <Button onClick={executeGeneration} className="bg-amber-500 text-black hover:bg-amber-600">
                            Start Generation
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
