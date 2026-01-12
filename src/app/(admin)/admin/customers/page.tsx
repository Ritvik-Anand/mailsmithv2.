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
} from 'lucide-react'

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
    Free: 'bg-gray-500',
    Starter: 'bg-blue-500',
    Pro: 'bg-purple-500',
    Enterprise: 'bg-amber-500',
}

const statusConfig: Record<string, { label: string; color: string }> = {
    active: { label: 'Active', color: 'bg-emerald-500' },
    trial: { label: 'Trial', color: 'bg-amber-500' },
    suspended: { label: 'Suspended', color: 'bg-rose-500' },
    churned: { label: 'Churned', color: 'bg-gray-500' },
}

export default function AdminCustomersPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Customers</h1>
                <p className="text-muted-foreground">
                    Manage all organizations on the platform
                </p>
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
                        <div className="text-2xl font-bold">{mockCustomers.length}</div>
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
                            {mockCustomers.reduce((sum, c) => sum + c.users, 0)}
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
                            {mockCustomers.reduce((sum, c) => sum + c.leads, 0).toLocaleString()}
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
                            {mockCustomers.filter((c) => c.plan !== 'Free' && c.status === 'active').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search customers..." className="pl-10" />
                </div>
                <Select defaultValue="all">
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
                <Select defaultValue="all">
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
                            <TableHead className="text-right">Campaigns</TableHead>
                            <TableHead>Last Active</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockCustomers.map((customer) => (
                            <TableRow key={customer.id}>
                                <TableCell>
                                    <Link
                                        href={`/admin/customers/${customer.id}`}
                                        className="font-medium hover:underline"
                                    >
                                        {customer.name}
                                    </Link>
                                    <div className="text-xs text-muted-foreground">{customer.email}</div>
                                </TableCell>
                                <TableCell>
                                    <Badge
                                        variant="secondary"
                                        className={`${planColors[customer.plan]} text-white`}
                                    >
                                        {customer.plan}
                                    </Badge>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${statusConfig[customer.status].color}`} />
                                        <span className="text-sm">{statusConfig[customer.status].label}</span>
                                    </div>
                                </TableCell>
                                <TableCell className="text-right">{customer.users}</TableCell>
                                <TableCell className="text-right">{customer.leads.toLocaleString()}</TableCell>
                                <TableCell className="text-right">{customer.campaigns}</TableCell>
                                <TableCell className="text-muted-foreground">{customer.lastActive}</TableCell>
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
                                            <DropdownMenuSeparator />
                                            {customer.status === 'active' ? (
                                                <DropdownMenuItem className="text-destructive">
                                                    <Ban className="mr-2 h-4 w-4" />
                                                    Suspend
                                                </DropdownMenuItem>
                                            ) : customer.status === 'suspended' ? (
                                                <DropdownMenuItem>
                                                    <Users className="mr-2 h-4 w-4" />
                                                    Reactivate
                                                </DropdownMenuItem>
                                            ) : null}
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
