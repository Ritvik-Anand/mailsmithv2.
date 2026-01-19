'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import { Separator } from '@/components/ui/separator'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
    DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { LeadSearchFilters, Lead, ScrapeJob } from '@/types'
import { SearchPresets, SearchFiltersForm, SearchJobsList } from '@/components/lead-finder'
import { startLeadSearchJob, quickLeadSearch, getSearchJobs } from '@/server/actions/lead-finder'
import { DEFAULT_FETCH_COUNT, COST_PER_1000_LEADS } from '@/lib/lead-finder/constants'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { createClient } from '@/lib/supabase/client'
import {
    Search,
    MoreHorizontal,
    Upload,
    Download,
    Trash2,
    Sparkles,
    Mail,
    Eye,
    Users,
    Target,
    Zap,
    CheckCircle2,
    Clock,
    XCircle,
    RefreshCw,
    Loader2,
    Rocket,
    ArrowRight,
    Info,
    Plus,
    Filter,
    LayoutGrid,
    List,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

// Status configurations
const campaignStatusConfig: Record<string, { label: string; color: string }> = {
    not_added: { label: 'Not Added', color: 'bg-gray-500' },
    queued: { label: 'Queued', color: 'bg-blue-500' },
    sent: { label: 'Sent', color: 'bg-indigo-500' },
    opened: { label: 'Opened', color: 'bg-purple-500' },
    replied: { label: 'Replied', color: 'bg-emerald-500' },
    bounced: { label: 'Bounced', color: 'bg-rose-500' },
}

const icebreakerStatusConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    pending: { label: 'Pending', icon: <Clock className="h-4 w-4 text-amber-500" /> },
    generating: { label: 'Generating', icon: <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" /> },
    completed: { label: 'Completed', icon: <CheckCircle2 className="h-4 w-4 text-emerald-500" /> },
    failed: { label: 'Failed', icon: <XCircle className="h-4 w-4 text-rose-500" /> },
}

export default function LeadsPage() {
    // Tab state
    const [activeTab, setActiveTab] = useState('all-leads')

    // Lead Finder state
    const [filters, setFilters] = useState<LeadSearchFilters>({
        email_status: ['validated'],
        fetch_count: DEFAULT_FETCH_COUNT,
    })
    const [isSearching, setIsSearching] = useState(false)
    const [isPreviewing, setIsPreviewing] = useState(false)
    const [refreshKey, setRefreshKey] = useState(0)
    const [showFilters, setShowFilters] = useState(false)

    // Leads list state
    const [leads, setLeads] = useState<Lead[]>([])
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [loadingLeads, setLoadingLeads] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [statusFilter, setStatusFilter] = useState('all')
    const [icebreakerFilter, setIcebreakerFilter] = useState('all')

    // Stats
    const [stats, setStats] = useState({
        total: 0,
        withIcebreakers: 0,
        inCampaigns: 0,
        replied: 0,
    })

    // Load leads from database
    const loadLeads = useCallback(async () => {
        setLoadingLeads(true)
        try {
            const supabase = createClient()
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100)

            if (error) throw error

            setLeads(data || [])

            // Calculate stats
            const leadsList = data || []
            setStats({
                total: leadsList.length,
                withIcebreakers: leadsList.filter(l => l.icebreaker_status === 'completed').length,
                inCampaigns: leadsList.filter(l => l.campaign_status !== 'not_added').length,
                replied: leadsList.filter(l => l.campaign_status === 'replied').length,
            })
        } catch (error) {
            console.error('Failed to load leads:', error)
        } finally {
            setLoadingLeads(false)
        }
    }, [])

    useEffect(() => {
        loadLeads()
    }, [loadLeads])

    // Lead selection handlers
    const toggleSelectAll = () => {
        if (selectedLeads.length === filteredLeads.length) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(filteredLeads.map((l) => l.id))
        }
    }

    const toggleSelectLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter((l) => l !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
    }

    // Filter leads
    const filteredLeads = leads.filter(lead => {
        const matchesSearch = !searchQuery ||
            `${lead.first_name} ${lead.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            lead.company_name?.toLowerCase().includes(searchQuery.toLowerCase())

        const matchesStatus = statusFilter === 'all' || lead.campaign_status === statusFilter
        const matchesIcebreaker = icebreakerFilter === 'all' || lead.icebreaker_status === icebreakerFilter

        return matchesSearch && matchesStatus && matchesIcebreaker
    })

    // Lead Finder handlers
    const handlePresetSelect = (presetFilters: LeadSearchFilters) => {
        setFilters({
            ...filters,
            ...presetFilters,
        })
        setShowFilters(true)
    }

    const handleFiltersChange = (newFilters: LeadSearchFilters) => {
        setFilters(newFilters)
    }

    const handleStartSearch = async () => {
        setIsSearching(true)
        try {
            const result = await startLeadSearchJob(filters)
            if (result.success) {
                toast.success('Lead search started! Results will appear here when complete.')
                setRefreshKey(prev => prev + 1)
                setActiveTab('search-history')
            } else {
                toast.error(result.error || 'Failed to start search')
            }
        } catch {
            toast.error('Failed to start search')
        } finally {
            setIsSearching(false)
        }
    }

    const hasFilters = () => {
        return (
            (filters.contact_job_title?.length || 0) > 0 ||
            (filters.seniority_level?.length || 0) > 0 ||
            (filters.functional_level?.length || 0) > 0 ||
            (filters.contact_location?.length || 0) > 0 ||
            (filters.contact_city?.length || 0) > 0 ||
            (filters.company_industry?.length || 0) > 0 ||
            (filters.size?.length || 0) > 0 ||
            (filters.funding?.length || 0) > 0
        )
    }

    const estimatedCost = ((filters.fetch_count || DEFAULT_FETCH_COUNT) / 1000) * COST_PER_1000_LEADS

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10">
                            <Users className="h-6 w-6 text-primary" />
                        </div>
                        Leads
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Find, manage, and nurture your prospects
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" size="sm">
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Button variant="outline" size="sm">
                        <Download className="mr-2 h-4 w-4" />
                        Export
                    </Button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border-blue-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-blue-500" />
                            Total Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.total.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-green-500/5 to-green-500/0 border-green-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Sparkles className="h-4 w-4 text-green-500" />
                            With Icebreakers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-green-600">{stats.withIcebreakers}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border-purple-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <Mail className="h-4 w-4 text-purple-500" />
                            In Campaigns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{stats.inCampaigns}</div>
                    </CardContent>
                </Card>
                <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/0 border-emerald-500/20">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                            Replied
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-600">{stats.replied}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Main Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
                <TabsList className="grid w-full grid-cols-3 lg:w-auto lg:inline-grid">
                    <TabsTrigger value="all-leads" className="gap-2">
                        <List className="h-4 w-4" />
                        All Leads
                    </TabsTrigger>
                    <TabsTrigger value="find-leads" className="gap-2">
                        <Target className="h-4 w-4" />
                        Find Leads
                    </TabsTrigger>
                    <TabsTrigger value="search-history" className="gap-2">
                        <Clock className="h-4 w-4" />
                        Search History
                    </TabsTrigger>
                </TabsList>

                {/* ALL LEADS TAB */}
                <TabsContent value="all-leads" className="space-y-4">
                    {/* Filters and Bulk Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search leads..."
                                    className="pl-10"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                            </div>
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Status</SelectItem>
                                    <SelectItem value="not_added">Not Added</SelectItem>
                                    <SelectItem value="sent">Sent</SelectItem>
                                    <SelectItem value="opened">Opened</SelectItem>
                                    <SelectItem value="replied">Replied</SelectItem>
                                </SelectContent>
                            </Select>
                            <Select value={icebreakerFilter} onValueChange={setIcebreakerFilter}>
                                <SelectTrigger className="w-[140px]">
                                    <SelectValue placeholder="Icebreaker" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="completed">Has Icebreaker</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={loadLeads}
                            >
                                <RefreshCw className={cn("h-4 w-4", loadingLeads && "animate-spin")} />
                            </Button>
                        </div>

                        {/* Bulk Actions */}
                        {selectedLeads.length > 0 && (
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-muted-foreground">
                                    {selectedLeads.length} selected
                                </span>
                                <Button size="sm" variant="outline">
                                    <Mail className="mr-2 h-4 w-4" />
                                    Add to Campaign
                                </Button>
                                <Button size="sm" variant="outline">
                                    <Sparkles className="mr-2 h-4 w-4" />
                                    Generate Icebreakers
                                </Button>
                                <Button size="sm" variant="outline" className="text-destructive">
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Delete
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Leads Table */}
                    <Card>
                        {loadingLeads ? (
                            <div className="flex items-center justify-center py-12">
                                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                            </div>
                        ) : filteredLeads.length === 0 ? (
                            <div className="text-center py-12">
                                <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                                <h3 className="font-medium text-lg">No leads yet</h3>
                                <p className="text-sm text-muted-foreground mt-2 mb-4">
                                    Start by finding leads using our powerful search tool
                                </p>
                                <Button onClick={() => setActiveTab('find-leads')}>
                                    <Target className="mr-2 h-4 w-4" />
                                    Find Leads
                                </Button>
                            </div>
                        ) : (
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead className="w-[40px]">
                                            <Checkbox
                                                checked={selectedLeads.length === filteredLeads.length && filteredLeads.length > 0}
                                                onCheckedChange={toggleSelectAll}
                                            />
                                        </TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead>Icebreaker</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Source</TableHead>
                                        <TableHead className="w-[50px]"></TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {filteredLeads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell>
                                                <Checkbox
                                                    checked={selectedLeads.includes(lead.id)}
                                                    onCheckedChange={() => toggleSelectLead(lead.id)}
                                                />
                                            </TableCell>
                                            <TableCell className="font-medium">
                                                {lead.first_name} {lead.last_name}
                                            </TableCell>
                                            <TableCell className="text-sm">{lead.email}</TableCell>
                                            <TableCell>{lead.company_name || '-'}</TableCell>
                                            <TableCell className="text-sm">{lead.job_title || '-'}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    {icebreakerStatusConfig[lead.icebreaker_status || 'pending']?.icon}
                                                    {lead.icebreaker ? (
                                                        <span className="max-w-[150px] truncate text-sm" title={lead.icebreaker}>
                                                            {lead.icebreaker}
                                                        </span>
                                                    ) : (
                                                        <span className="text-sm text-muted-foreground">
                                                            {icebreakerStatusConfig[lead.icebreaker_status || 'pending']?.label}
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${campaignStatusConfig[lead.campaign_status || 'not_added']?.color}`} />
                                                    <span className="text-sm">
                                                        {campaignStatusConfig[lead.campaign_status || 'not_added']?.label}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <Badge variant="outline" className="text-xs">
                                                    {lead.source === 'apify_leads_finder' ? 'Lead Finder' :
                                                        lead.source === 'csv_import' ? 'CSV' :
                                                            lead.source || 'Manual'}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon">
                                                            <MoreHorizontal className="h-4 w-4" />
                                                        </Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuItem>
                                                            <Eye className="mr-2 h-4 w-4" />
                                                            View Details
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Sparkles className="mr-2 h-4 w-4" />
                                                            Generate Icebreaker
                                                        </DropdownMenuItem>
                                                        <DropdownMenuItem>
                                                            <Mail className="mr-2 h-4 w-4" />
                                                            Add to Campaign
                                                        </DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem className="text-destructive">
                                                            <Trash2 className="mr-2 h-4 w-4" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        )}
                    </Card>
                </TabsContent>

                {/* FIND LEADS TAB */}
                <TabsContent value="find-leads" className="space-y-6">
                    {/* Feature Highlights */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/0 border-blue-500/20">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-blue-500/10">
                                    <Users className="h-5 w-5 text-blue-500" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">300M+ Contacts</h4>
                                    <p className="text-xs text-muted-foreground">Global B2B database</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-green-500/5 to-green-500/0 border-green-500/20">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-green-500/10">
                                    <CheckCircle2 className="h-5 w-5 text-green-500" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">Verified Emails</h4>
                                    <p className="text-xs text-muted-foreground">High deliverability</p>
                                </div>
                            </CardContent>
                        </Card>
                        <Card className="bg-gradient-to-br from-purple-500/5 to-purple-500/0 border-purple-500/20">
                            <CardContent className="p-4 flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-purple-500/10">
                                    <Zap className="h-5 w-5 text-purple-500" />
                                </div>
                                <div>
                                    <h4 className="font-medium text-sm">Instant Import</h4>
                                    <p className="text-xs text-muted-foreground">Ready for campaigns</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Quick Start Templates */}
                    <SearchPresets
                        onSelectPreset={handlePresetSelect}
                    />

                    <Separator />

                    {/* Search Builder */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Filters */}
                        <div className="lg:col-span-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Filter className="h-5 w-5 text-primary" />
                                        Search Filters
                                    </CardTitle>
                                    <CardDescription>
                                        Customize your search to find the perfect leads
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <SearchFiltersForm
                                        filters={filters}
                                        onChange={handleFiltersChange}
                                    />
                                </CardContent>
                            </Card>
                        </div>

                        {/* Search Summary & Actions */}
                        <div className="space-y-4">
                            <Card className="sticky top-6">
                                <CardHeader>
                                    <CardTitle className="text-lg">Search Summary</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {/* Active Filters */}
                                    <div className="space-y-2">
                                        <h4 className="text-sm font-medium">Active Filters</h4>
                                        {hasFilters() ? (
                                            <div className="flex flex-wrap gap-1">
                                                {filters.contact_job_title?.map(t => (
                                                    <Badge key={t} variant="secondary" className="text-xs">{t}</Badge>
                                                ))}
                                                {filters.seniority_level?.map(s => (
                                                    <Badge key={s} variant="outline" className="text-xs">{s}</Badge>
                                                ))}
                                                {filters.contact_location?.map(l => (
                                                    <Badge key={l} variant="outline" className="text-xs">{l}</Badge>
                                                ))}
                                                {filters.contact_city?.map(c => (
                                                    <Badge key={c} variant="outline" className="text-xs">{c}</Badge>
                                                ))}
                                                {filters.company_industry?.map(i => (
                                                    <Badge key={i} variant="outline" className="text-xs">{i}</Badge>
                                                ))}
                                                {(filters.size?.length || 0) > 0 && (
                                                    <Badge variant="outline" className="text-xs">
                                                        {filters.size?.length} sizes
                                                    </Badge>
                                                )}
                                            </div>
                                        ) : (
                                            <p className="text-xs text-muted-foreground">
                                                Select a template above or add filters
                                            </p>
                                        )}
                                    </div>

                                    <Separator />

                                    {/* Lead Count */}
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Leads to fetch</span>
                                            <span className="text-lg font-bold">
                                                {(filters.fetch_count || DEFAULT_FETCH_COUNT).toLocaleString()}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium">Estimated cost</span>
                                            <span className="text-lg font-bold text-primary">
                                                ${estimatedCost.toFixed(2)}
                                            </span>
                                        </div>
                                    </div>

                                    <Separator />

                                    {/* Actions */}
                                    <Button
                                        className="w-full"
                                        size="lg"
                                        onClick={handleStartSearch}
                                        disabled={isSearching || !hasFilters()}
                                    >
                                        {isSearching ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Starting Search...
                                            </>
                                        ) : (
                                            <>
                                                <Rocket className="mr-2 h-4 w-4" />
                                                Find Leads
                                                <ArrowRight className="ml-2 h-4 w-4" />
                                            </>
                                        )}
                                    </Button>

                                    <p className="text-xs text-muted-foreground text-center flex items-center justify-center gap-1">
                                        <Info className="h-3 w-3" />
                                        Results automatically appear in All Leads
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* SEARCH HISTORY TAB */}
                <TabsContent value="search-history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Search History</CardTitle>
                            <CardDescription>
                                Track your lead searches and view results
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            <SearchJobsList
                                refreshKey={refreshKey}
                                onViewJob={(jobId) => {
                                    // Could open a modal or filter leads by job
                                    toast.info('View leads from this search')
                                }}
                            />
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
