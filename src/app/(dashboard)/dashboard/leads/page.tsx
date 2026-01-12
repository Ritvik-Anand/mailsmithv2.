'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog'
import { Label } from '@/components/ui/label'
import {
    Search,
    MoreHorizontal,
    Plus,
    Upload,
    Download,
    Trash2,
    Sparkles,
    Mail,
    Eye,
    Filter,
    Users,
    Linkedin,
    Globe,
    MapPin,
    Clock,
    CheckCircle,
    XCircle,
    RefreshCw,
} from 'lucide-react'

// Mock leads data
const mockLeads = [
    {
        id: '1',
        firstName: 'John',
        lastName: 'Smith',
        email: 'john@techcorp.com',
        company: 'TechCorp',
        jobTitle: 'CEO',
        linkedinUrl: 'https://linkedin.com/in/johnsmith',
        icebreaker: 'I saw your recent keynote at TechCrunch Disrupt - your vision for AI in enterprise is spot on!',
        icebreakerStatus: 'completed',
        campaignStatus: 'replied',
        source: 'LinkedIn',
        createdAt: '2026-01-10',
    },
    {
        id: '2',
        firstName: 'Sarah',
        lastName: 'Johnson',
        email: 'sarah@startupxyz.com',
        company: 'StartupXYZ',
        jobTitle: 'CTO',
        linkedinUrl: 'https://linkedin.com/in/sarahjohnson',
        icebreaker: 'Congrats on the Series A! Love what you\'re building in the developer tools space.',
        icebreakerStatus: 'completed',
        campaignStatus: 'opened',
        source: 'Apollo',
        createdAt: '2026-01-09',
    },
    {
        id: '3',
        firstName: 'Mike',
        lastName: 'Chen',
        email: 'mike@innovate.io',
        company: 'Innovate.io',
        jobTitle: 'VP Engineering',
        linkedinUrl: 'https://linkedin.com/in/mikechen',
        icebreaker: null,
        icebreakerStatus: 'pending',
        campaignStatus: 'not_added',
        source: 'LinkedIn',
        createdAt: '2026-01-08',
    },
    {
        id: '4',
        firstName: 'Emily',
        lastName: 'Davis',
        email: 'emily@venture.co',
        company: 'Venture Co',
        jobTitle: 'Partner',
        linkedinUrl: 'https://linkedin.com/in/emilydavis',
        icebreaker: 'Your portfolio is impressive - especially the early bet on climate tech.',
        icebreakerStatus: 'completed',
        campaignStatus: 'bounced',
        source: 'Manual',
        createdAt: '2026-01-07',
    },
    {
        id: '5',
        firstName: 'Alex',
        lastName: 'Wilson',
        email: 'alex@growth.io',
        company: 'Growth.io',
        jobTitle: 'Head of Sales',
        linkedinUrl: 'https://linkedin.com/in/alexwilson',
        icebreaker: null,
        icebreakerStatus: 'failed',
        campaignStatus: 'sent',
        source: 'CSV Import',
        createdAt: '2026-01-06',
    },
]

// Mock scrape jobs
const mockScrapeJobs = [
    {
        id: '1',
        actorName: 'LinkedIn Sales Navigator',
        status: 'completed',
        leadsFound: 150,
        leadsImported: 145,
        startedAt: '2026-01-10 14:30',
        completedAt: '2026-01-10 14:45',
    },
    {
        id: '2',
        actorName: 'Apollo People Search',
        status: 'completed',
        leadsFound: 200,
        leadsImported: 198,
        startedAt: '2026-01-08 10:00',
        completedAt: '2026-01-08 10:20',
    },
    {
        id: '3',
        actorName: 'LinkedIn Sales Navigator',
        status: 'running',
        leadsFound: 45,
        leadsImported: 0,
        startedAt: '2026-01-12 09:00',
        completedAt: null,
    },
]

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
    completed: { label: 'Completed', icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
    failed: { label: 'Failed', icon: <XCircle className="h-4 w-4 text-rose-500" /> },
}

export default function LeadsPage() {
    const [selectedLeads, setSelectedLeads] = useState<string[]>([])
    const [scrapeDialogOpen, setScrapeDialogOpen] = useState(false)

    const toggleSelectAll = () => {
        if (selectedLeads.length === mockLeads.length) {
            setSelectedLeads([])
        } else {
            setSelectedLeads(mockLeads.map((l) => l.id))
        }
    }

    const toggleSelectLead = (id: string) => {
        if (selectedLeads.includes(id)) {
            setSelectedLeads(selectedLeads.filter((l) => l !== id))
        } else {
            setSelectedLeads([...selectedLeads, id])
        }
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leads</h1>
                    <p className="text-muted-foreground">
                        Manage your leads and scrape new prospects
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline">
                        <Upload className="mr-2 h-4 w-4" />
                        Import CSV
                    </Button>
                    <Dialog open={scrapeDialogOpen} onOpenChange={setScrapeDialogOpen}>
                        <DialogTrigger asChild>
                            <Button>
                                <Plus className="mr-2 h-4 w-4" />
                                Scrape Leads
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-lg">
                            <DialogHeader>
                                <DialogTitle>Scrape New Leads</DialogTitle>
                                <DialogDescription>
                                    Choose a data source to scrape leads from
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <Card className="cursor-pointer hover:border-primary transition-colors">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                            <Linkedin className="h-5 w-5 text-blue-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">LinkedIn Sales Navigator</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Search by title, company, location, and more
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="cursor-pointer hover:border-primary transition-colors">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                                            <Globe className="h-5 w-5 text-purple-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Apollo People Search</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Access Apollo's database of contacts
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                                <Card className="cursor-pointer hover:border-primary transition-colors">
                                    <CardContent className="flex items-center gap-4 p-4">
                                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                                            <MapPin className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <h4 className="font-medium">Google Maps</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Scrape local businesses by location
                                            </p>
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                            <DialogFooter>
                                <Button variant="outline" onClick={() => setScrapeDialogOpen(false)}>
                                    Cancel
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Total Leads
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{mockLeads.length.toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            With Icebreakers
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {mockLeads.filter((l) => l.icebreakerStatus === 'completed').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            In Campaigns
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">
                            {mockLeads.filter((l) => l.campaignStatus !== 'not_added').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Replied
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-purple-500">
                            {mockLeads.filter((l) => l.campaignStatus === 'replied').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="all-leads" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="all-leads">
                        <Users className="mr-2 h-4 w-4" />
                        All Leads
                    </TabsTrigger>
                    <TabsTrigger value="scrape-history">
                        <Clock className="mr-2 h-4 w-4" />
                        Scrape History
                    </TabsTrigger>
                </TabsList>

                {/* All Leads Tab */}
                <TabsContent value="all-leads" className="space-y-4">
                    {/* Filters and Bulk Actions */}
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div className="relative w-64">
                                <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input placeholder="Search leads..." className="pl-10" />
                            </div>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
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
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue placeholder="Icebreaker" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All</SelectItem>
                                    <SelectItem value="completed">Has Icebreaker</SelectItem>
                                    <SelectItem value="pending">Pending</SelectItem>
                                    <SelectItem value="failed">Failed</SelectItem>
                                </SelectContent>
                            </Select>
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
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-[40px]">
                                        <Checkbox
                                            checked={selectedLeads.length === mockLeads.length}
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
                                {mockLeads.map((lead) => (
                                    <TableRow key={lead.id}>
                                        <TableCell>
                                            <Checkbox
                                                checked={selectedLeads.includes(lead.id)}
                                                onCheckedChange={() => toggleSelectLead(lead.id)}
                                            />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {lead.firstName} {lead.lastName}
                                        </TableCell>
                                        <TableCell>{lead.email}</TableCell>
                                        <TableCell>{lead.company}</TableCell>
                                        <TableCell>{lead.jobTitle}</TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                {icebreakerStatusConfig[lead.icebreakerStatus].icon}
                                                {lead.icebreaker ? (
                                                    <span className="max-w-[200px] truncate text-sm" title={lead.icebreaker}>
                                                        {lead.icebreaker}
                                                    </span>
                                                ) : (
                                                    <span className="text-sm text-muted-foreground">
                                                        {icebreakerStatusConfig[lead.icebreakerStatus].label}
                                                    </span>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <div className={`h-2 w-2 rounded-full ${campaignStatusConfig[lead.campaignStatus].color}`} />
                                                <span className="text-sm">
                                                    {campaignStatusConfig[lead.campaignStatus].label}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline">{lead.source}</Badge>
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
                    </Card>
                </TabsContent>

                {/* Scrape History Tab */}
                <TabsContent value="scrape-history">
                    <Card>
                        <CardHeader>
                            <CardTitle>Scrape History</CardTitle>
                            <CardDescription>View all your previous scraping jobs</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Source</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Leads Found</TableHead>
                                        <TableHead className="text-right">Imported</TableHead>
                                        <TableHead>Started</TableHead>
                                        <TableHead>Completed</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockScrapeJobs.map((job) => (
                                        <TableRow key={job.id}>
                                            <TableCell className="font-medium">{job.actorName}</TableCell>
                                            <TableCell>
                                                <Badge variant={job.status === 'completed' ? 'secondary' : 'default'}>
                                                    {job.status === 'running' && <RefreshCw className="mr-1 h-3 w-3 animate-spin" />}
                                                    {job.status}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">{job.leadsFound}</TableCell>
                                            <TableCell className="text-right">{job.leadsImported}</TableCell>
                                            <TableCell className="text-muted-foreground">{job.startedAt}</TableCell>
                                            <TableCell className="text-muted-foreground">{job.completedAt || '-'}</TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
