'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    RefreshCw,
    ShieldCheck,
    AlertCircle,
    Search,
    Monitor,
    Hash
} from 'lucide-react'
import { syncOutreachNodes, assignNodeToOrganization, getAllOutreachNodes } from '@/server/actions/instantly'
import { getOrganizations } from '@/server/actions/organizations'
import { toast } from 'sonner'

export default function InfrastructurePage() {
    const [nodes, setNodes] = useState<any[]>([])
    const [organizations, setOrganizations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [isSyncing, setIsSyncing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')

    const fetchData = async () => {
        setIsLoading(true)
        try {
            // Fetch organizations for the dropdown
            const orgs = await getOrganizations()
            setOrganizations(orgs)

            // Fetch nodes via server action
            const nodesData = await getAllOutreachNodes()
            setNodes(nodesData || [])
        } catch (error) {
            toast.error('Failed to load infrastructure data')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchData()
    }, [])

    const handleSync = async () => {
        setIsSyncing(true)
        try {
            const result = await syncOutreachNodes()
            if (result.success) {
                if (result.count === 0 && result.remoteCount > 0) {
                    toast.warning(`Database Error: ${result.error || 'Blocked by constraints'}`)
                } else {
                    toast.success(`Successfully synced ${result.count} nodes from Instantly`)
                }
                fetchData()
            } else {
                toast.error(result.error || 'Sync failed')
            }
        } finally {
            setIsSyncing(false)
        }
    }

    const handleAssign = async (nodeId: string, orgId: string) => {
        const result = await assignNodeToOrganization(nodeId, orgId)
        if (result.success) {
            toast.success('Node assigned successfully')
            fetchData()
        } else {
            toast.error(result.error || 'Assignment failed')
        }
    }

    const filteredNodes = nodes.filter(node =>
        node.email_address.toLowerCase().includes(searchTerm.toLowerCase()) ||
        node.instantly_account_id.toLowerCase().includes(searchTerm.toLowerCase())
    )

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex items-end justify-between">
                <div className="space-y-1">
                    <h1 className="text-2xl font-bold text-white tracking-tight">Outreach Infrastructure</h1>
                    <p className="text-zinc-500 text-sm font-medium">Manage and assign Instantly outreach nodes to your clients.</p>
                </div>
                <Button
                    onClick={handleSync}
                    disabled={isSyncing}
                    className="bg-primary hover:bg-primary/90 text-white font-bold h-10 shadow-lg shadow-primary/10 transition-all"
                >
                    {isSyncing ? <RefreshCw className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-2 h-4 w-4" />}
                    Sync from Instantly
                </Button>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 md:grid-cols-3">
                <InfrastructureStat
                    title="Total Capacity"
                    value={nodes.length}
                    icon={Monitor}
                    sub="Active outreach nodes"
                />
                <InfrastructureStat
                    title="Unassigned Nodes"
                    value={nodes.filter(n => !n.organization_id).length}
                    icon={Hash}
                    sub="Ready for deployment"
                />
                <InfrastructureStat
                    title="System Health"
                    value="Optimal"
                    icon={ShieldCheck}
                    sub="Avg reputation: 98%"
                />
            </div>

            {/* Nodes Table */}
            <Card className="bg-zinc-950 border-zinc-800 rounded-xl overflow-hidden shadow-none">
                <CardHeader className="flex flex-row items-center justify-between border-b border-zinc-900 px-6 py-4 bg-zinc-900/10">
                    <div className="flex items-center gap-4">
                        <CardTitle className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Outreach Nodes</CardTitle>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-zinc-600" />
                            <Input
                                placeholder="Filter by email or ID..."
                                className="h-8 w-64 bg-zinc-900/50 border-zinc-800 pl-9 text-xs text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-primary rounded-lg"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-zinc-900 hover:bg-transparent bg-black">
                                <TableHead className="text-[10px] font-bold text-zinc-500 pl-6 h-10 uppercase tracking-wider">Email Address</TableHead>
                                <TableHead className="text-[10px] font-bold text-zinc-500 h-10 uppercase tracking-wider">Status</TableHead>
                                <TableHead className="text-[10px] font-bold text-zinc-500 h-10 uppercase tracking-wider text-right">Reputation</TableHead>
                                <TableHead className="text-[10px] font-bold text-zinc-500 h-10 uppercase tracking-wider text-right pr-6">Assignment</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                Array(8).fill(0).map((_, i) => (
                                    <TableRow key={i} className="border-zinc-900/50">
                                        <TableCell className="pl-6 py-4"><div className="h-3 w-32 bg-zinc-900 animate-pulse rounded" /></TableCell>
                                        <TableCell><div className="h-3 w-16 bg-zinc-900 animate-pulse rounded" /></TableCell>
                                        <TableCell className="text-right"><div className="h-3 w-8 ml-auto bg-zinc-900 animate-pulse rounded" /></TableCell>
                                        <TableCell className="pr-6 text-right"><div className="h-8 w-40 ml-auto bg-zinc-900 animate-pulse rounded" /></TableCell>
                                    </TableRow>
                                ))
                            ) : filteredNodes.map((node) => (
                                <TableRow key={node.id} className="border-zinc-900/50 hover:bg-zinc-900/30 transition-colors">
                                    <TableCell className="pl-6 py-4">
                                        <div className="flex flex-col">
                                            <span className="font-bold text-sm text-zinc-200">{node.email_address}</span>
                                            <span className="text-[9px] font-mono text-zinc-600 uppercase tracking-tighter">ID: {node.instantly_account_id}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant="outline" className={cn(
                                            "text-[10px] font-bold px-1.5 py-0 rounded lowercase",
                                            node.status === 'active' ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" : "bg-red-500/5 text-red-500 border-red-500/20"
                                        )}>
                                            {node.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-xs font-bold text-zinc-300 font-mono">{node.reputation_score}%</span>
                                            {node.warmup_enabled && (
                                                <span className="text-[8px] font-black text-primary uppercase tracking-widest">Warmup Active</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="pr-6 text-right">
                                        <div className="flex justify-end min-w-[180px]">
                                            <Select
                                                defaultValue={node.organization_id || "unassigned"}
                                                onValueChange={(value) => handleAssign(node.id, value)}
                                            >
                                                <SelectTrigger className="h-8 w-48 bg-zinc-900/50 border-zinc-800 text-xs font-semibold rounded-lg focus:ring-primary/20">
                                                    <SelectValue placeholder="Select Customer" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-zinc-950 border-zinc-900 text-zinc-300">
                                                    <SelectItem value="unassigned" className="text-xs font-bold text-red-400">UNASSIGNED</SelectItem>
                                                    {organizations.map((org) => (
                                                        <SelectItem key={org.id} value={org.id} className="text-xs font-medium">
                                                            {org.name}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}

function InfrastructureStat({ title, value, icon: Icon, sub }: any) {
    return (
        <Card className="bg-zinc-950 border-zinc-800 rounded-xl shadow-none">
            <CardContent className="p-6">
                <div className="flex items-center gap-4">
                    <div className="h-10 w-10 border border-zinc-800 rounded-lg flex items-center justify-center bg-zinc-900">
                        <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                        <p className="text-[10px] text-zinc-600 uppercase font-black tracking-widest mb-1">{title}</p>
                        <div className="flex items-baseline gap-2">
                            <h3 className="text-xl font-bold text-white">{value}</h3>
                            <span className="text-[10px] text-zinc-500 font-medium">{sub}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    )
}

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(' ')
}
