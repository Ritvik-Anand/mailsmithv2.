'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Mail,
    Plus,
    MoreHorizontal,
    Play,
    Pause,
    CheckCircle2,
    Clock,
    LayoutGrid,
    List,
    TrendingUp,
    ExternalLink,
    ChevronRight
} from 'lucide-react'
import { getOrganizations } from '@/server/actions/organizations'
import { getOrganizationCampaigns } from '@/server/actions/instantly'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { toast } from 'sonner'

export default function OperatorCampaignsPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>('all')
    const [campaigns, setCampaigns] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        async function loadData() {
            setIsLoading(true)
            try {
                const orgs = await getOrganizations()
                setOrganizations(orgs)

                // If orgs exist and we haven't selected one, pick the first
                if (orgs.length > 0 && selectedOrgId === 'all') {
                    // Start by loading all or first? For operators, maybe all.
                    // But our getOrganizationCampaigns needs an ID. 
                    // Let's implement a 'getAllCampaigns' or just load the first org for now.
                    setSelectedOrgId(orgs[0].id)
                }
            } catch (error) {
                toast.error('Failed to load organizations')
            } finally {
                setIsLoading(false)
            }
        }
        loadData()
    }, [])

    useEffect(() => {
        async function loadCampaigns() {
            if (!selectedOrgId || selectedOrgId === 'all') return
            setIsLoading(true)
            try {
                const data = await getOrganizationCampaigns(selectedOrgId)
                setCampaigns(data)
            } catch (error) {
                toast.error('Failed to load campaigns')
            } finally {
                setIsLoading(false)
            }
        }
        loadCampaigns()
    }, [selectedOrgId])

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'active': return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20'
            case 'paused': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
            case 'completed': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
            default: return 'bg-zinc-500/10 text-zinc-500 border-zinc-500/20'
        }
    }

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Operations</h1>
                    <p className="text-muted-foreground">Manage and monitor outreach campaigns across all customers.</p>
                </div>
                <Link href="/operator/campaigns/new">
                    <Button className="bg-amber-500 hover:bg-amber-600 text-white font-bold h-11 px-6 shadow-lg shadow-amber-500/20">
                        <Plus className="mr-2 h-5 w-5" />
                        New Campaign
                    </Button>
                </Link>
            </div>

            {/* Filter Bar */}
            <div className="flex items-center gap-4 bg-zinc-900/30 p-4 rounded-xl border border-zinc-800">
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-zinc-500 uppercase tracking-widest pl-2">Filter Customer:</span>
                    <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                        <SelectTrigger className="w-[240px] h-9 bg-zinc-950 border-zinc-800 text-xs font-semibold">
                            <SelectValue placeholder="Select Customer" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-zinc-900">
                            {organizations.map(org => (
                                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            {/* Campaigns Grid */}
            {isLoading ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[1, 2, 3].map(i => (
                        <Card key={i} className="bg-zinc-950 border-zinc-800 h-[200px] animate-pulse" />
                    ))}
                </div>
            ) : campaigns.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 border-2 border-dashed border-zinc-800 rounded-3xl bg-zinc-900/10">
                    <div className="h-16 w-16 bg-zinc-900 rounded-full flex items-center justify-center mb-6">
                        <Mail className="h-8 w-8 text-zinc-700" />
                    </div>
                    <h3 className="text-xl font-bold text-zinc-400">No active campaigns</h3>
                    <p className="text-zinc-600 mt-2 max-w-sm text-center">There are no campaigns being run for this customer yet. Start a new one to begin outreach.</p>
                    <Link href="/operator/campaigns/new" className="mt-8">
                        <Button variant="outline" className="border-zinc-800 text-zinc-400 hover:bg-zinc-900">
                            Create First Campaign
                        </Button>
                    </Link>
                </div>
            ) : (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {campaigns.map((campaign) => (
                        <Card
                            key={campaign.id}
                            className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-all group overflow-hidden shadow-none cursor-pointer"
                            onClick={() => window.location.href = `/operator/campaigns/${campaign.id}`}
                        >
                            <CardHeader className="p-5 pb-2">
                                <div className="flex items-start justify-between">
                                    <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-tighter px-2", getStatusStyle(campaign.status))}>
                                        {campaign.status}
                                    </Badge>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                                            <Button variant="ghost" size="icon" className="h-8 w-8 text-zinc-500">
                                                <MoreHorizontal className="h-4 w-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="bg-zinc-950 border-zinc-900">
                                            <DropdownMenuItem className="text-xs font-bold text-zinc-400">View Logs</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold text-zinc-400">Edit Template</DropdownMenuItem>
                                            <DropdownMenuItem className="text-xs font-bold text-amber-500">Pause Campaign</DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </div>
                                <CardTitle className="text-base font-bold text-zinc-200 mt-3 truncate">{campaign.name}</CardTitle>
                                <CardDescription className="text-[11px] text-zinc-600 font-mono">ID: {campaign.instantly_campaign_id}</CardDescription>
                            </CardHeader>
                            <CardContent className="p-5 pt-4 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sent</p>
                                        <p className="text-sm font-bold text-zinc-300">{campaign.emails_sent || 0}</p>
                                    </div>
                                    <div className="space-y-1">
                                        <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Replies</p>
                                        <p className="text-sm font-bold text-emerald-500">{campaign.emails_replied || 0}</p>
                                    </div>
                                </div>

                                <div className="pt-4 border-t border-zinc-900 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <div className="h-6 w-6 rounded flex items-center justify-center bg-zinc-900">
                                            <TrendingUp className="h-3 w-3 text-zinc-500" />
                                        </div>
                                        <span className="text-[10px] font-bold text-zinc-500">{campaign.emails_opened || 0}% Open Rate</span>
                                    </div>
                                    <Link href={`/operator/campaigns/${campaign.id}`} onClick={(e) => e.stopPropagation()}>
                                        <Button variant="ghost" size="sm" className="h-7 px-2 text-[10px] font-bold text-zinc-600 hover:text-white uppercase tracking-wider">
                                            View Details
                                            <ChevronRight className="ml-1 h-3 w-3" />
                                        </Button>
                                    </Link>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
