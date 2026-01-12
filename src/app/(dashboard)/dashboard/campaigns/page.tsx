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
} from '@/components/ui/dropdown-menu'
import {
    Plus,
    Search,
    MoreHorizontal,
    Play,
    Pause,
    Copy,
    Trash2,
    Eye,
    Edit,
} from 'lucide-react'

// Mock campaigns data
const mockCampaigns = [
    {
        id: '1',
        name: 'Q1 Outreach - Tech Founders',
        status: 'active',
        leads: 450,
        sent: 380,
        opened: 122,
        replied: 31,
        bounced: 8,
        createdAt: '2026-01-05',
    },
    {
        id: '2',
        name: 'Product Launch - VCs',
        status: 'active',
        leads: 120,
        sent: 95,
        opened: 28,
        replied: 6,
        bounced: 2,
        createdAt: '2026-01-08',
    },
    {
        id: '3',
        name: 'Follow-up Sequence',
        status: 'active',
        leads: 89,
        sent: 89,
        opened: 40,
        replied: 11,
        bounced: 1,
        createdAt: '2026-01-10',
    },
    {
        id: '4',
        name: 'Holiday Campaign',
        status: 'paused',
        leads: 200,
        sent: 150,
        opened: 45,
        replied: 8,
        bounced: 5,
        createdAt: '2025-12-20',
    },
    {
        id: '5',
        name: 'Partner Outreach',
        status: 'draft',
        leads: 0,
        sent: 0,
        opened: 0,
        replied: 0,
        bounced: 0,
        createdAt: '2026-01-12',
    },
    {
        id: '6',
        name: 'Q4 Retrospective',
        status: 'completed',
        leads: 500,
        sent: 500,
        opened: 180,
        replied: 42,
        bounced: 15,
        createdAt: '2025-11-15',
    },
]

const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    active: { label: 'Active', variant: 'default' },
    paused: { label: 'Paused', variant: 'secondary' },
    draft: { label: 'Draft', variant: 'outline' },
    completed: { label: 'Completed', variant: 'secondary' },
}

export default function CampaignsPage() {
    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaigns</h1>
                    <p className="text-muted-foreground">
                        Manage your email outreach campaigns
                    </p>
                </div>
                <Button asChild>
                    <Link href="/dashboard/campaigns/new">
                        <Plus className="mr-2 h-4 w-4" />
                        New Campaign
                    </Link>
                </Button>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Campaigns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockCampaigns.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Active
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {mockCampaigns.filter((c) => c.status === 'active').length}
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
                            {mockCampaigns.reduce((sum, c) => sum + c.leads, 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Avg. Reply Rate
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {Math.round(
                                (mockCampaigns.reduce((sum, c) => sum + c.replied, 0) /
                                    mockCampaigns.reduce((sum, c) => sum + c.sent, 0)) *
                                100
                            )}%
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search campaigns..." className="pl-10" />
                </div>
                <Select defaultValue="all">
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="paused">Paused</SelectItem>
                        <SelectItem value="draft">Draft</SelectItem>
                        <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Campaigns Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Campaign Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead className="text-right">Leads</TableHead>
                            <TableHead className="text-right">Sent</TableHead>
                            <TableHead className="text-right">Opens</TableHead>
                            <TableHead className="text-right">Replies</TableHead>
                            <TableHead className="text-right">Open Rate</TableHead>
                            <TableHead className="text-right">Reply Rate</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {mockCampaigns.map((campaign) => {
                            const openRate = campaign.sent > 0
                                ? Math.round((campaign.opened / campaign.sent) * 100)
                                : 0
                            const replyRate = campaign.sent > 0
                                ? Math.round((campaign.replied / campaign.sent) * 100)
                                : 0

                            return (
                                <TableRow key={campaign.id} className="cursor-pointer hover:bg-accent/50">
                                    <TableCell>
                                        <Link
                                            href={`/dashboard/campaigns/${campaign.id}`}
                                            className="font-medium hover:underline"
                                        >
                                            {campaign.name}
                                        </Link>
                                        <div className="text-xs text-muted-foreground">
                                            Created {campaign.createdAt}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={statusConfig[campaign.status].variant}>
                                            {statusConfig[campaign.status].label}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">{campaign.leads}</TableCell>
                                    <TableCell className="text-right">{campaign.sent}</TableCell>
                                    <TableCell className="text-right">{campaign.opened}</TableCell>
                                    <TableCell className="text-right">{campaign.replied}</TableCell>
                                    <TableCell className="text-right">
                                        <span className={openRate >= 30 ? 'text-emerald-500' : openRate >= 20 ? 'text-amber-500' : 'text-muted-foreground'}>
                                            {openRate}%
                                        </span>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <span className={replyRate >= 10 ? 'text-emerald-500' : replyRate >= 5 ? 'text-amber-500' : 'text-muted-foreground'}>
                                            {replyRate}%
                                        </span>
                                    </TableCell>
                                    <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/dashboard/campaigns/${campaign.id}`}>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        View
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem>
                                                    <Edit className="mr-2 h-4 w-4" />
                                                    Edit
                                                </DropdownMenuItem>
                                                {campaign.status === 'active' ? (
                                                    <DropdownMenuItem>
                                                        <Pause className="mr-2 h-4 w-4" />
                                                        Pause
                                                    </DropdownMenuItem>
                                                ) : campaign.status === 'paused' ? (
                                                    <DropdownMenuItem>
                                                        <Play className="mr-2 h-4 w-4" />
                                                        Resume
                                                    </DropdownMenuItem>
                                                ) : null}
                                                <DropdownMenuItem>
                                                    <Copy className="mr-2 h-4 w-4" />
                                                    Duplicate
                                                </DropdownMenuItem>
                                                <DropdownMenuItem className="text-destructive">
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )
                        })}
                    </TableBody>
                </Table>
            </Card>
        </div>
    )
}
