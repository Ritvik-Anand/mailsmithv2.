'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
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
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Search,
    MoreHorizontal,
    UserCog,
    Mail,
    Ban,
    Eye,
    Users,
    RefreshCw,
    AlertCircle,
    Target,
} from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { getOrganizations, toggleOrganizationStatus, updateOrganization } from '@/server/actions/organizations'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { OrganizationWithStats } from '@/types'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'

const planColors: Record<string, string> = {
    free: 'bg-slate-500',
    starter: 'bg-blue-500',
    pro: 'bg-purple-500',
    enterprise: 'bg-amber-500',
}

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'bg-emerald-500' },
    trial: { label: 'Trial', color: 'bg-blue-400' },
    suspended: { label: 'Suspended', color: 'bg-rose-500' },
    churned: { label: 'Churned', color: 'bg-slate-400' },
}

export default function AdminCustomersPage() {
    const [customers, setCustomers] = useState<OrganizationWithStats[]>([])
    const [isLoading, setIsLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState('')
    const [planFilter, setPlanFilter] = useState('all')
    const [statusFilter, setStatusFilter] = useState('all')
    const [editingOrg, setEditingOrg] = useState<OrganizationWithStats | null>(null)
    const [newLimit, setNewLimit] = useState<number>(1000)
    const [isUpdating, setIsUpdating] = useState(false)

    const fetchCustomers = async () => {
        setIsLoading(true)
        try {
            const data = await getOrganizations()
            setCustomers(data)
        } catch (error) {
            console.error(error)
            toast.error('Failed to retrieve organizations')
        } finally {
            setIsLoading(false)
        }
    }

    const handleUpdateLimit = async () => {
        if (!editingOrg) return
        setIsUpdating(true)
        try {
            await updateOrganization(editingOrg.id, { monthly_lead_limit: newLimit } as any)
            toast.success('Limit updated successfully')
            setEditingOrg(null)
            fetchCustomers()
        } catch (error: any) {
            toast.error(error.message)
        } finally {
            setIsUpdating(false)
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
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Customer Management</h1>
                    <p className="text-muted-foreground">
                        Manage and monitor all organizations on the platform
                    </p>
                </div>
                <Button variant="outline" size="icon" onClick={fetchCustomers}>
                    <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Organizations
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{customers.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Users
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customers.reduce((sum, c) => sum + (c._count?.users || 0), 0)}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {customers.reduce((sum, c) => sum + (c._count?.leads || 0), 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Paying Customers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {customers.filter((c) => c.plan !== 'free' && (c as any).status !== 'suspended').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search customers..."
                        className="pl-10"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <Select value={planFilter} onValueChange={setPlanFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Plan" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Plans</SelectItem>
                        <SelectItem value="free">Free</SelectItem>
                        <SelectItem value="starter">Starter</SelectItem>
                        <SelectItem value="pro">Pro</SelectItem>
                        <SelectItem value="enterprise">Enterprise</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="trial">Trial</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Customers Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Organization</TableHead>
                            <TableHead>Plan</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Users</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                            <TableHead className="text-right">Monthly Limit</TableHead>
                            <TableHead>Joined at</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {isLoading && filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <RefreshCw className="h-8 w-8 animate-spin" />
                                        <p>Fetching platform data...</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : filteredCustomers.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={8} className="h-64 text-center">
                                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                        <AlertCircle className="h-8 w-8 opacity-20" />
                                        <p>No organizations found matching filters.</p>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            filteredCustomers.map((customer) => (
                                <TableRow key={customer.id}>
                                    <TableCell>
                                        <Link
                                            href={`/admin-console/customers/${customer.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {customer.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">{customer.slug}</div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            className={`${planColors[customer.plan]} text-white capitalize`}
                                        >
                                            {customer.plan}
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex items-center gap-2">
                                            <div className={`h-2 w-2 rounded-full ${statusConfig[(customer as any).status || 'active'].color}`} />
                                            <span className="text-sm capitalize">{(customer as any).status || 'active'}</span>
                                        </div>
                                    </TableCell>
                                    <TableCell className="text-right">{customer._count?.users || 0}</TableCell>
                                    <TableCell className="text-right">{customer._count?.leads.toLocaleString() || 0}</TableCell>
                                    <TableCell className="text-right font-medium">
                                        {customer.monthly_lead_limit?.toLocaleString() || '1,000'}
                                    </TableCell>
                                    <TableCell className="text-muted-foreground">{new Date(customer.created_at).toLocaleDateString()}</TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/admin-console/customers/${customer.id}`}>
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
                                                <DropdownMenuItem onClick={() => {
                                                    setEditingOrg(customer)
                                                    setNewLimit(customer.monthly_lead_limit || 1000)
                                                }}>
                                                    <Target className="mr-2 h-4 w-4" />
                                                    Set Lead Limit
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                {(customer as any).status === 'suspended' ? (
                                                    <DropdownMenuItem onClick={() => handleToggleStatus(customer.id, 'suspended')}>
                                                        <RefreshCw className="mr-2 h-4 w-4" />
                                                        Reactivate
                                                    </DropdownMenuItem>
                                                ) : (
                                                    <DropdownMenuItem className="text-destructive" onClick={() => handleToggleStatus(customer.id, 'active')}>
                                                        <Ban className="mr-2 h-4 w-4" />
                                                        Suspend
                                                    </DropdownMenuItem>
                                                )}
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </Card>

            {/* EDIT LIMIT DIALOG */}
            <Dialog open={!!editingOrg} onOpenChange={(open) => !open && setEditingOrg(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Set Monthly Lead Limit</DialogTitle>
                        <DialogDescription>
                            Update the monthly lead scraping limit for <strong>{editingOrg?.name}</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="py-4 space-y-4">
                        <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Monthly Limit (Leads)</label>
                            <Input
                                type="number"
                                value={newLimit}
                                onChange={(e) => setNewLimit(parseInt(e.target.value))}
                                placeholder="e.g. 5000"
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="ghost" onClick={() => setEditingOrg(null)}>Cancel</Button>
                        <Button onClick={handleUpdateLimit} disabled={isUpdating}>
                            {isUpdating ? 'Updating...' : 'Save Limit'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
