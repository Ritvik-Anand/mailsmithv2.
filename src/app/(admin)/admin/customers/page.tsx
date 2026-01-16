'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
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
    Search,
    MoreHorizontal,
    Eye,
    UserCog,
    Ban,
    Mail,
    Users,
    TrendingUp,
    CreditCard,
    RefreshCw,
    AlertCircle,
} from 'lucide-react'
import { getOrganizations, toggleOrganizationStatus, OrganizationWithStats } from '@/server/actions/organizations'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

// Mock customers data
const mockCustomers = [
    {
        id: '1',
        name: 'Acme Corp',
        email: 'admin@acmecorp.com',
        plan: 'Pro',
        users: 5,
        leads: 4521,
        campaigns: 12,
        status: 'active',
        createdAt: '2025-11-15',
        lastActive: '2 hours ago',
    },
    {
        id: '2',
        name: 'StartupXYZ',
        email: 'founder@startupxyz.com',
        plan: 'Starter',
        users: 2,
        leads: 890,
        campaigns: 3,
        status: 'active',
        createdAt: '2025-12-20',
        lastActive: '1 day ago',
    },
    {
        id: '3',
        name: 'TechVentures',
        email: 'cto@techventures.io',
        plan: 'Free',
        users: 1,
        leads: 45,
        campaigns: 1,
        status: 'trial',
        createdAt: '2026-01-10',
        lastActive: '5 hours ago',
    },
    {
        id: '4',
        name: 'OldCompany Inc',
        email: 'support@oldcompany.com',
        plan: 'Pro',
        users: 3,
        leads: 2100,
        campaigns: 8,
        status: 'suspended',
        createdAt: '2025-08-01',
        lastActive: '2 weeks ago',
    },
    {
        id: '5',
        name: 'GrowthHackers',
        email: 'team@growthhackers.co',
        plan: 'Enterprise',
        users: 15,
        leads: 25000,
        campaigns: 45,
        status: 'active',
        createdAt: '2025-06-15',
        lastActive: '30 minutes ago',
    },
]

const planColors: Record<string, string> = {
    free: 'bg-zinc-800 text-zinc-400',
    starter: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
    pro: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
    enterprise: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
}

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'bg-emerald-500' },
    trial: { label: 'Trial', color: 'bg-amber-500' },
    suspended: { label: 'Suspended', color: 'bg-rose-500' },
    churned: { label: 'Churned', color: 'bg-zinc-500' },
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<OrganizationWithStats[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [planFilter, setPlanFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')

    const fetchCustomers = async () => {
        setIsLoading(true)
        try {
            const data = await getOrganizations()
            setCustomers(data)
        } catch (error) {
            console.error(error)
            toast.error('Sector scan failed: Unable to retrieve organizations')
        } finally {
            setIsLoading(false)
        }
    }

    useEffect(() => {
        fetchCustomers()
    }, [])

    const handleToggleStatus = async (id: string, currentStatus: string) => {
        const newStatus = currentStatus === 'suspended' ? 'active' : 'suspended'
        const action = newStatus === 'active' ? 'Reactivating' : 'Suspending'

        try {
            await toggleOrganizationStatus(id, newStatus)
            toast.success(`${action} successful`)
            fetchCustomers()
        } catch (error: any) {
            toast.error(`${action} failed: ${error.message}`)
        }
    }

    const filteredCustomers = customers.filter(customer => {
        const matchesSearch = customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            customer.slug.toLowerCase().includes(searchQuery.toLowerCase())
        const matchesPlan = planFilter === 'all' || customer.plan === planFilter
        const matchesStatus = statusFilter === 'all' || (customer as any).status === statusFilter
        return matchesSearch && matchesPlan && matchesStatus
    })

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Page Header */}
            <div className="flex flex-col gap-2">
                <h1 className="text-3xl font-bold tracking-tight italic">Operations Control</h1>
                <p className="text-zinc-500">
                    Manage and monitor all active deployments on the platform
                </p>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">
                            Total Organizations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">
                            Total Platform Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customers.reduce((sum, c) => sum + (c._count?.users || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">
                            Managed Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customers.reduce((sum, c) => sum + (c._count?.leads || 0), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-zinc-500">
                            Paying Nodes
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {customers.filter((c) => c.plan !== 'free' && (c as any).status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex flex-col md:flex-row items-center gap-4">
                <div className="relative flex-1 w-full max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                    <Input
                        placeholder="Search by name or slug..."
                        className="pl-10 bg-zinc-900/50 border-zinc-800 focus:border-primary/50"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <div className="flex gap-2 w-full md:w-auto">
                    <Select value={planFilter} onValueChange={setPlanFilter}>
                        <SelectTrigger className="w-full md:w-[150px] bg-zinc-900/50 border-zinc-800">
                            <SelectValue placeholder="Level" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="all">All Levels</SelectItem>
                            <SelectItem value="free">Free</SelectItem>
                            <SelectItem value="starter">Starter</SelectItem>
                            <SelectItem value="pro">Pro</SelectItem>
                            <SelectItem value="enterprise">Enterprise</SelectItem>
                        </SelectContent>
                    </Select>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-[150px] bg-zinc-900/50 border-zinc-800">
                            <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-zinc-800">
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="active">Active</SelectItem>
                            <SelectItem value="trial">Trial</SelectItem>
                            <SelectItem value="suspended">Suspended</SelectItem>
                        </SelectContent>
                    </Select>
                    <Button variant="ghost" size="icon" onClick={fetchCustomers} className="border border-zinc-800">
                        <RefreshCw className={cn("h-4 w-4 text-zinc-500", isLoading && "animate-spin")} />
                    </Button>
                </div>
            </div>

            {/* Customers Table */}
            <Card className="bg-zinc-900/50 border-zinc-800 overflow-hidden">
                <Table>
                    <TableHeader className="bg-zinc-900 border-zinc-800">
                        <TableRow className="hover:bg-zinc-900 border-zinc-800">
                            <TableHead className="text-zinc-400">Organization</TableHead>
                            <TableHead className="text-zinc-400">Level</TableHead>
                            <TableHead className="text-zinc-400">Status</TableHead>
                            <TableHead className="text-right text-zinc-400">Users</TableHead>
                            <TableHead className="text-right text-zinc-400">Leads</TableHead>
                            <TableHead className="text-right text-zinc-400">Campaigns</TableHead>
                            <TableHead className="text-zinc-400">Deployment Date</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    {isLoading ? (
                                        <div className="flex flex-col items-center gap-3 text-zinc-500">
                                            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                                            <p className="text-sm font-medium uppercase tracking-widest">Scanning sector for nodes...</p>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center gap-3 text-zinc-500">
                                            <AlertCircle className="h-8 w-8 opacity-20" />
                                            <p className="text-sm">No organizations found in this sector.</p>
                                        </div>
                                    )}
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id} className="hover:bg-zinc-800/30 border-zinc-800 transition-colors">
                                    <TableCell>
                                        <Link
                                            href={`/admin/customers/${customer.id}`}
                                            className="font-bold hover:text-primary transition-colors"
                                        >
                                            {customer.name}
                                        </Link>
                                        <div className="text-[10px] text-zinc-500 font-mono uppercase tracking-tighter">{customer.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className={cn("uppercase text-[10px] font-black tracking-widest", planColors[customer.plan])}
                                        >
                                            {customer.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-1.5 w-1.5 rounded-full ${statusConfig[(customer as any).status || 'active'].color} shadow-[0_0_8px_rgba(0,0,0,0.5)]`} />
                                            <span className="text-xs font-medium text-zinc-300">
                                                {statusConfig[(customer as any).status || 'active'].label}
                                            </span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right font-mono text-xs">{customer._count.users}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{customer._count.leads.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono text-xs">{customer._count.campaigns}</TableCell>
                                    <TableCell className="text-zinc-500 text-xs">{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin/customers/${customer.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View Details
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <UserCog className="mr-2 h-4 w-4" />
                                                    Impersonate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Mail className="mr-2 h-4 w-4" />
                                                    Send Message
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator className="bg-zinc-800" />
                                                {((customer as any).status || 'active') === 'active' ? (
                                                    <DropdownMenuItem
                                                        className="text-rose-400 hover:text-rose-100 hover:bg-rose-500/20 cursor-pointer font-bold"
                                                        onClick={() => handleToggleStatus(customer.id, 'active')}
                                                    >
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Suspend Node
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem
                                                        className="text-emerald-400 hover:text-emerald-100 hover:bg-emerald-500/20 cursor-pointer font-bold"
                                                        onClick={() => handleToggleStatus(customer.id, 'suspended')}
                                                    >
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Reactivate Node
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )))
                        }
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
