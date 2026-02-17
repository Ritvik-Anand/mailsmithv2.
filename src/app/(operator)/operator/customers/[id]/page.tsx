'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    ArrowLeft,
    Building2,
    Users,
    Target,
    Mail,
    Search,
    Loader2,
    CheckCircle2,
    Clock,
    Send,
    Sparkles,
    Wand2,
    Settings,
    ChevronRight,
    ArrowRight
} from 'lucide-react'
import { getOrganizationDetails } from '@/server/actions/organizations'
import { getSearchJobs, getLeadsForOrganization } from '@/server/actions/lead-finder'
import { getOrganizationCampaigns } from '@/server/actions/instantly'
import { ScrapeJob, Lead } from '@/types'
import { toast } from 'sonner'

export default function OperatorCustomerDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [organization, setOrganization] = useState<any>(null)
    const [jobs, setJobs] = useState<ScrapeJob[]>([])
    const [leads, setLeads] = useState<Lead[]>([])
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                // Fetch organization details
                const orgResult = await getOrganizationDetails(id)
                if (orgResult.success) {
                    setOrganization(orgResult.organization)
                }

                // Fetch jobs for this organization
                const jobsResult = await getSearchJobs({ organizationId: id, limit: 20 })
                if (jobsResult.success && jobsResult.jobs) {
                    setJobs(jobsResult.jobs)
                }

                // Fetch leads for this organization
                const leadsResult = await getLeadsForOrganization(id)
                if (leadsResult.success && leadsResult.leads) {
                    setLeads(leadsResult.leads)
                }

                // Fetch campaigns for this organization
                const campaignsResult = await getOrganizationCampaigns(id)
                if (campaignsResult) {
                    setCampaigns(campaignsResult)
                }
            } catch (error) {
                toast.error('Failed to load customer data')
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id])

    const filteredLeads = leads.filter(lead =>
        lead.first_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.last_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    const getIcebreakerStatus = (lead: Lead) => {
        if (lead.icebreaker) return 'ready'
        if (lead.icebreaker_status === 'generating') return 'generating'
        return 'pending'
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-zinc-500 font-medium">Loading customer data...</p>
            </div>
        )
    }

    if (!organization) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Building2 className="h-12 w-12 text-zinc-800" />
                <h3 className="text-zinc-500 font-bold">Customer not found</h3>
                <Link href="/operator/customers">
                    <Button variant="outline">Back to Customers</Button>
                </Link>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Link href="/operator/customers">
                    <Button variant="ghost" size="icon" className="mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
                            <Building2 className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-white">{organization.name}</h1>
                            <p className="text-zinc-500 font-mono text-sm">{organization.slug}</p>
                        </div>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Link href={`/operator/customers/${id}/icebreaker`}>
                        <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:text-white">
                            <Wand2 className="h-4 w-4 mr-2" />
                            Icebreaker Settings
                        </Button>
                    </Link>
                    <Link href={`/operator/scraper?org=${id}`}>
                        <Button className="bg-primary hover:bg-primary/90">
                            <Target className="h-4 w-4 mr-2" />
                            New Lead Scrape
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Users className="h-8 w-8 text-primary" />
                        <div>
                            <p className="text-2xl font-bold text-white">{leads.length}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">Total Leads</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Sparkles className="h-8 w-8 text-amber-500" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {leads.filter(l => l.icebreaker).length}
                            </p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">With Icebreakers</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Send className="h-8 w-8 text-emerald-500" />
                        <div>
                            <p className="text-2xl font-bold text-white">
                                {leads.filter(l => l.campaign_status === 'sent').length}
                            </p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">Sent to Campaign</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-950 border-zinc-900">
                    <CardContent className="p-4 flex items-center gap-3">
                        <Target className="h-8 w-8 text-purple-500" />
                        <div>
                            <p className="text-2xl font-bold text-white">{jobs.length}</p>
                            <p className="text-xs text-zinc-500 uppercase tracking-widest">Scrape Jobs</p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="leads" className="w-full">
                <TabsList className="bg-zinc-950 border border-zinc-900">
                    <TabsTrigger value="leads" className="data-[state=active]:bg-zinc-900">
                        <Users className="h-4 w-4 mr-2" />
                        Leads ({leads.length})
                    </TabsTrigger>
                    <TabsTrigger value="jobs" className="data-[state=active]:bg-zinc-900">
                        <Target className="h-4 w-4 mr-2" />
                        Scrape Jobs ({jobs.length})
                    </TabsTrigger>
                    <TabsTrigger value="campaigns" className="data-[state=active]:bg-zinc-900">
                        <Mail className="h-4 w-4 mr-2" />
                        Campaigns ({campaigns.length})
                    </TabsTrigger>
                </TabsList>

                {/* Leads Tab */}
                <TabsContent value="leads" className="mt-6 space-y-4">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                        <Input
                            placeholder="Search leads..."
                            className="pl-10 bg-zinc-950 border-zinc-800"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>

                    {filteredLeads.length === 0 ? (
                        <Card className="bg-zinc-950 border-zinc-900">
                            <CardContent className="py-16 text-center">
                                <Users className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                                <h3 className="text-zinc-500 font-bold">No leads yet</h3>
                                <p className="text-zinc-700 text-sm mt-2">Start a scrape to generate leads for this customer.</p>
                                <Link href={`/operator/scraper?org=${id}`}>
                                    <Button className="mt-4" variant="outline">
                                        <Target className="h-4 w-4 mr-2" />
                                        Launch Scraper
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="rounded-lg border border-zinc-900 overflow-hidden">
                            <table className="w-full">
                                <thead className="bg-zinc-950">
                                    <tr className="text-left text-[10px] text-zinc-500 uppercase tracking-widest">
                                        <th className="p-3 font-bold">Contact</th>
                                        <th className="p-3 font-bold">Company</th>
                                        <th className="p-3 font-bold">Title</th>
                                        <th className="p-3 font-bold">Icebreaker</th>
                                        <th className="p-3 font-bold">Status</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-zinc-900">
                                    {filteredLeads.slice(0, 50).map((lead) => (
                                        <tr key={lead.id} className="hover:bg-zinc-950/50">
                                            <td className="p-3">
                                                <p className="font-medium text-white text-sm">
                                                    {lead.first_name} {lead.last_name}
                                                </p>
                                                <p className="text-xs text-zinc-500">{lead.email}</p>
                                            </td>
                                            <td className="p-3 text-sm text-zinc-400">
                                                {lead.company_name || '-'}
                                            </td>
                                            <td className="p-3 text-sm text-zinc-400">
                                                {lead.job_title || '-'}
                                            </td>
                                            <td className="p-3">
                                                {lead.icebreaker ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-[10px]">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Ready
                                                    </Badge>
                                                ) : (
                                                    <Badge className="bg-zinc-500/10 text-zinc-500 border-zinc-500/20 text-[10px]">
                                                        <Clock className="h-3 w-3 mr-1" />
                                                        Pending
                                                    </Badge>
                                                )}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {lead.campaign_status || 'not_added'}
                                                </Badge>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filteredLeads.length > 50 && (
                                <div className="p-3 text-center text-xs text-zinc-500 bg-zinc-950 border-t border-zinc-900">
                                    Showing 50 of {filteredLeads.length} leads
                                </div>
                            )}
                        </div>
                    )}
                </TabsContent>

                {/* Jobs Tab */}
                <TabsContent value="jobs" className="mt-6 space-y-3">
                    {jobs.length === 0 ? (
                        <Card className="bg-zinc-950 border-zinc-900">
                            <CardContent className="py-16 text-center">
                                <Target className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                                <h3 className="text-zinc-500 font-bold">No scrape jobs yet</h3>
                                <p className="text-zinc-700 text-sm mt-2">Start a scrape for this customer.</p>
                                <Link href={`/operator/scraper?org=${id}`}>
                                    <Button className="mt-4" variant="outline">
                                        <Target className="h-4 w-4 mr-2" />
                                        Launch Scraper
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        jobs.map((job) => (
                            <Link key={job.id} href={`/operator/leads/${job.id}`}>
                                <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-700 transition-all cursor-pointer">
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${job.status === 'running' || job.status === 'pending' ? 'bg-amber-500/10' :
                                            job.status === 'completed' ? 'bg-emerald-500/10' : 'bg-red-500/10'
                                            }`}>
                                            {job.status === 'running' || job.status === 'pending' ? (
                                                <Loader2 className="h-5 w-5 text-amber-500 animate-spin" />
                                            ) : job.status === 'completed' ? (
                                                <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                                            ) : (
                                                <Target className="h-5 w-5 text-red-500" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center gap-2 mb-1">
                                                <Badge variant="outline" className="text-[10px] uppercase">
                                                    {job.status}
                                                </Badge>
                                                <span className="text-[10px] text-zinc-600 font-mono">
                                                    {job.id.slice(0, 8)}
                                                </span>
                                            </div>
                                            <p className="text-sm font-medium text-white">
                                                {job.input_params.contact_job_title?.join(', ') || 'General Search'}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white">{job.leads_imported || 0}</p>
                                            <p className="text-[10px] text-zinc-500 uppercase">Leads</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))
                    )}
                </TabsContent>

                {/* Campaigns Tab */}
                <TabsContent value="campaigns" className="mt-6 space-y-4">
                    <div className="flex justify-end">
                        <Link href={`/operator/campaigns/new?orgId=${id}`}>
                            <Button className="bg-primary hover:bg-primary/90">
                                <Target className="h-4 w-4 mr-2" />
                                New Campaign
                            </Button>
                        </Link>
                    </div>

                    {campaigns.length === 0 ? (
                        <Card className="bg-zinc-950 border-zinc-900">
                            <CardContent className="py-16 text-center">
                                <Mail className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                                <h3 className="text-zinc-500 font-bold">No campaigns yet</h3>
                                <p className="text-zinc-700 text-sm mt-2">Create a campaign to start outreach for this customer.</p>
                                <Link href={`/operator/campaigns/new?orgId=${id}`}>
                                    <Button className="mt-4" variant="outline">
                                        Create First Campaign
                                    </Button>
                                </Link>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {campaigns.map((campaign) => (
                                <Link key={campaign.id} href={`/operator/campaigns/${campaign.id}`}>
                                    <Card className="bg-zinc-950 border-zinc-900 hover:border-zinc-700 transition-all cursor-pointer group">
                                        <CardContent className="p-4 flex items-center gap-4">
                                            <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${campaign.status === 'active' ? 'bg-emerald-500/10' :
                                                campaign.status === 'paused' ? 'bg-amber-500/10' :
                                                    'bg-zinc-500/10'
                                                }`}>
                                                <Mail className={`h-5 w-5 ${campaign.status === 'active' ? 'text-emerald-500' :
                                                    campaign.status === 'paused' ? 'text-amber-500' :
                                                        'text-zinc-500'
                                                    }`} />
                                            </div>
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <Badge variant="outline" className={`text-[10px] uppercase ${campaign.status === 'active' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' :
                                                        campaign.status === 'paused' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' :
                                                            'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
                                                        }`}>
                                                        {campaign.status}
                                                    </Badge>
                                                    <span className="text-[10px] text-zinc-600 font-mono">
                                                        {campaign.id.slice(0, 8)}
                                                    </span>
                                                </div>
                                                <p className="text-sm font-medium text-white">
                                                    {campaign.name}
                                                </p>
                                            </div>

                                            {/* Stats */}
                                            <div className="hidden md:flex items-center gap-6 mr-4">
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-white">{campaign.emails_sent || 0}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase">Sent</p>
                                                </div>
                                                <div className="text-center">
                                                    <p className="text-lg font-bold text-emerald-500">{campaign.emails_replied || 0}</p>
                                                    <p className="text-[10px] text-zinc-500 uppercase">Replies</p>
                                                </div>
                                            </div>

                                            <ChevronRight className="h-5 w-5 text-zinc-700 group-hover:text-primary transition-colors" />
                                        </CardContent>
                                    </Card>
                                </Link>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
        </div>
    )
}
