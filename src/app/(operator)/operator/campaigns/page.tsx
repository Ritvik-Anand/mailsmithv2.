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
    ChevronRight,
    ArrowRightLeft
} from 'lucide-react'
import { getOrganizations } from '@/server/actions/organizations'
import { getOrganizationCampaigns, deleteCampaign, assignCampaignToOrganization } from '@/server/actions/instantly'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter
} from '@/components/ui/dialog'
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
    const [moveModalOpen, setMoveModalOpen] = useState(false)
    const [campaignToMove, setCampaignToMove] = useState<any>(null)
    const [targetOrgId, setTargetOrgId] = useState<string>('')
    const [isMoving, setIsMoving] = useState(false)

    // Delete Modal State
    const [deleteModalOpen, setDeleteModalOpen] = useState(false)
    const [campaignToDelete, setCampaignToDelete] = useState<any>(null)
    const [isDeleting, setIsDeleting] = useState(false)

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
                <div className="space-y-3">
                    {campaigns.map((campaign) => (
                        <Card
                            key={campaign.id}
                            className="bg-zinc-950 border-zinc-800 hover:border-zinc-700 transition-all group overflow-hidden shadow-none"
                        >
                            <CardContent className="p-5">
                                <div className="flex items-center gap-6">
                                    {/* Status Badge */}
                                    <div className="flex-shrink-0">
                                        <Badge variant="outline" className={cn("text-[10px] font-black uppercase tracking-tighter px-2.5 py-1", getStatusStyle(campaign.status))}>
                                            {campaign.status}
                                        </Badge>
                                    </div>

                                    {/* Campaign Info */}
                                    <div className="flex-1 min-w-0">
                                        <h3 className="text-base font-bold text-zinc-200 truncate">{campaign.name}</h3>
                                        <p className="text-[11px] text-zinc-600 font-mono mt-0.5">ID: {campaign.id.slice(0, 13)}...</p>
                                    </div>

                                    {/* Stats */}
                                    <div className="hidden md:flex items-center gap-8">
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Sent</p>
                                            <p className="text-sm font-bold text-zinc-300 mt-1">{campaign.emails_sent || 0}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Replies</p>
                                            <p className="text-sm font-bold text-emerald-500 mt-1">{campaign.emails_replied || 0}</p>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-[9px] font-black text-zinc-600 uppercase tracking-widest">Open Rate</p>
                                            <p className="text-sm font-bold text-blue-500 mt-1">{campaign.emails_opened || 0}%</p>
                                        </div>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex items-center gap-2">
                                        <Link href={`/operator/campaigns/${campaign.id}`}>
                                            <Button variant="outline" size="sm" className="h-8 px-3 text-[10px] font-bold border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 uppercase tracking-wider">
                                                View Details
                                                <ChevronRight className="ml-1 h-3 w-3" />
                                            </Button>
                                        </Link>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-zinc-400 hover:text-white hover:bg-zinc-800"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setCampaignToMove(campaign)
                                                setTargetOrgId(selectedOrgId !== 'all' ? selectedOrgId : '')
                                                setMoveModalOpen(true)
                                            }}
                                            title="Move to another customer"
                                        >
                                            <ArrowRightLeft className="h-4 w-4" />
                                        </Button>

                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            className="h-8 w-8 p-0 text-red-500 hover:text-red-400 hover:bg-red-500/10"
                                            onClick={(e) => {
                                                e.stopPropagation()
                                                setCampaignToDelete(campaign)
                                                setDeleteModalOpen(true)
                                            }}
                                            title="Delete campaign"
                                        >
                                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                            </svg>
                                        </Button>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            )}


            {/* Move Campaign Dialog */}
            <Dialog open={moveModalOpen} onOpenChange={setMoveModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-900">
                    <DialogHeader>
                        <DialogTitle>Move Campaign</DialogTitle>
                        <DialogDescription>
                            Move "{campaignToMove?.name}" to another customer. All data associated with this campaign will be moved.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Select Target Customer</label>
                            <Select value={targetOrgId} onValueChange={setTargetOrgId}>
                                <SelectTrigger className="bg-zinc-900 border-zinc-800">
                                    <SelectValue placeholder="Select customer..." />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-950 border-zinc-900 max-h-[300px]">
                                    {organizations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setMoveModalOpen(false)}
                            disabled={isMoving}
                        >
                            Cancel
                        </Button>
                        <Button
                            className="bg-primary hover:bg-primary/90"
                            onClick={async () => {
                                if (!targetOrgId || !campaignToMove) return
                                setIsMoving(true)
                                try {
                                    const result = await assignCampaignToOrganization(campaignToMove.id, targetOrgId)
                                    if (result.success) {
                                        toast.success(`Moved campaign to customer`)
                                        setMoveModalOpen(false)
                                        // Refresh list if we moved it out of the current view
                                        if (selectedOrgId !== 'all' && selectedOrgId !== targetOrgId) {
                                            const data = await getOrganizationCampaigns(selectedOrgId)
                                            setCampaigns(data)
                                        }
                                    } else {
                                        toast.error(result.error || 'Failed to move campaign')
                                    }
                                } catch (error) {
                                    toast.error('Error moving campaign')
                                } finally {
                                    setIsMoving(false)
                                }
                            }}
                            disabled={!targetOrgId || isMoving}
                        >
                            {isMoving ? 'Moving...' : 'Move Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Campaign Dialog */}
            <Dialog open={deleteModalOpen} onOpenChange={setDeleteModalOpen}>
                <DialogContent className="bg-zinc-950 border-zinc-900">
                    <DialogHeader>
                        <DialogTitle>Delete Campaign</DialogTitle>
                        <DialogDescription>
                            Are you sure you want to delete "{campaignToDelete?.name}"? <br />
                            <span className="text-red-500 font-bold">This action cannot be undone.</span>
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setDeleteModalOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={async () => {
                                if (!campaignToDelete) return
                                setIsDeleting(true)
                                try {
                                    const result = await deleteCampaign(campaignToDelete.id)
                                    if (result.success) {
                                        toast.success('Campaign deleted successfully')
                                        setDeleteModalOpen(false)
                                        // Refresh campaigns list
                                        const data = await getOrganizationCampaigns(selectedOrgId)
                                        setCampaigns(data)
                                    } else {
                                        toast.error(result.error || 'Failed to delete campaign')
                                    }
                                } catch (error) {
                                    toast.error('Failed to delete campaign')
                                } finally {
                                    setIsDeleting(false)
                                }
                            }}
                            disabled={isDeleting}
                        >
                            {isDeleting ? 'Deleting...' : 'Delete Campaign'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
