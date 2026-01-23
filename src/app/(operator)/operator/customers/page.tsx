'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import {
    Users,
    Search,
    TrendingUp,
    ExternalLink,
    Building2,
    Target,
    Loader2
} from 'lucide-react'
import { getOperatorAssignments } from '@/server/actions/roles'
import { toast } from 'sonner'

export default function OperatorCustomersPage() {
    const [organizations, setOrganizations] = useState<any[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchTerm, setSearchTerm] = useState('')

    useEffect(() => {
        const fetchAssignments = async () => {
            setIsLoading(true)
            try {
                const result = await getOperatorAssignments()
                if (result.success) {
                    setOrganizations(result.organizations || [])
                } else {
                    toast.error(result.error || 'Failed to load assigned customers')
                }
            } catch (error) {
                toast.error('An error occurred during data fetch')
            } finally {
                setIsLoading(false)
            }
        }
        fetchAssignments()
    }, [])

    const filteredOrgs = organizations.filter(org =>
        org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    )

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-zinc-500 font-medium">Loading your portfolio...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div className="space-y-2">
                    <h1 className="text-3xl font-bold tracking-tight text-white">My Managed Customers</h1>
                    <p className="text-zinc-500 font-medium font-mono text-sm uppercase tracking-widest">
                        {organizations.length} Organizations Under Management
                    </p>
                </div>
                <div className="relative w-full md:w-64">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-zinc-600" />
                    <Input
                        placeholder="Search portfolio..."
                        className="pl-10 bg-zinc-900 border-zinc-800 text-sm h-10"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Organizations Grid */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredOrgs.map((org) => (
                    <Card key={org.id} className="bg-zinc-950 border-zinc-900 hover:border-zinc-700 transition-all group shadow-2xl">
                        <CardHeader className="pb-4">
                            <div className="flex justify-between items-start">
                                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center border border-primary/20">
                                    <Building2 className="h-5 w-5 text-primary" />
                                </div>
                                <Badge variant="outline" className={cn(
                                    "text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-tighter",
                                    org.healthScore >= 90 ? "bg-emerald-500/5 text-emerald-500 border-emerald-500/20" :
                                        org.healthScore >= 70 ? "bg-amber-500/5 text-amber-500 border-amber-500/20" :
                                            "bg-red-500/5 text-red-500 border-red-500/20"
                                )}>
                                    Health: {org.healthScore}%
                                </Badge>
                            </div>
                            <CardTitle className="text-xl font-bold text-white mt-4">{org.name}</CardTitle>
                            <CardDescription className="text-zinc-500 font-mono text-xs font-medium uppercase tracking-tighter italic">
                                {org.slug}
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-900">
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Status</p>
                                    <p className="text-sm font-bold text-zinc-300">Active</p>
                                </div>
                                <div className="p-3 bg-zinc-900/50 rounded-lg border border-zinc-900">
                                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-widest mb-1">Role</p>
                                    <p className="text-sm font-bold text-zinc-300">{org.isPrimary ? 'Primary' : 'Support'}</p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 pt-2">
                                <Link href={`/operator/customers/${org.id}`}>
                                    <Button className="w-full bg-primary hover:bg-primary/90 text-white text-xs font-bold h-10">
                                        View Customer Profile
                                    </Button>
                                </Link>
                                <Link href={`/operator/scraper?org=${org.id}`}>
                                    <Button variant="outline" className="w-full text-zinc-400 hover:text-white text-xs font-bold h-10 border-zinc-800">
                                        <Target className="mr-2 h-3.5 w-3.5" />
                                        Launch Lead Engine
                                    </Button>
                                </Link>
                            </div>
                        </CardContent>
                    </Card>
                ))}

                {filteredOrgs.length === 0 && (
                    <div className="col-span-full py-20 text-center border-2 border-dashed border-zinc-900 rounded-2xl bg-zinc-950/20">
                        <Users className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
                        <h3 className="text-zinc-500 font-bold uppercase tracking-widest text-sm">Portfolio Empty</h3>
                        <p className="text-zinc-700 text-xs mt-2">You don't have any organizations assigned to your account yet.</p>
                    </div>
                )}
            </div>
        </div>
    )
}
