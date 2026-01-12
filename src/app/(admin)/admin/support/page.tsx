'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    Search,
    MessageSquare,
    AlertCircle,
    CheckCircle,
    Clock,
    Send,
    Eye,
    ExternalLink,
    UserCog,
} from 'lucide-react'
import { toast } from 'sonner'

// Mock tickets data
const mockTickets = [
    {
        id: '1',
        title: 'Campaign not sending emails',
        description: 'My campaign has been active for 2 days but no emails have been sent.',
        customer: 'Acme Corp',
        customerEmail: 'admin@acmecorp.com',
        priority: 'high',
        status: 'open',
        createdAt: '2026-01-12 14:30',
        updatedAt: '2026-01-12 14:30',
        messages: [
            {
                id: '1',
                sender: 'customer',
                senderName: 'John Admin',
                message: 'My campaign has been active for 2 days but no emails have been sent. Can you please check what\'s wrong?',
                timestamp: '2026-01-12 14:30',
            },
        ],
    },
    {
        id: '2',
        title: 'LinkedIn scraper timeout',
        description: 'Getting timeout errors when scraping LinkedIn Sales Navigator.',
        customer: 'StartupXYZ',
        customerEmail: 'founder@startupxyz.com',
        priority: 'medium',
        status: 'in_progress',
        createdAt: '2026-01-12 10:15',
        updatedAt: '2026-01-12 12:00',
        messages: [
            {
                id: '1',
                sender: 'customer',
                senderName: 'Sarah Founder',
                message: 'I keep getting timeout errors when trying to scrape leads from LinkedIn Sales Navigator.',
                timestamp: '2026-01-12 10:15',
            },
            {
                id: '2',
                sender: 'admin',
                senderName: 'Support Team',
                message: 'Hi Sarah, we\'re looking into this. It seems there might be a rate limit issue. Can you tell us how many leads you were trying to scrape?',
                timestamp: '2026-01-12 12:00',
            },
        ],
    },
    {
        id: '3',
        title: 'How to import CSV?',
        description: 'Need help with importing leads from a CSV file.',
        customer: 'TechVentures',
        customerEmail: 'cto@techventures.io',
        priority: 'low',
        status: 'open',
        createdAt: '2026-01-11 16:45',
        updatedAt: '2026-01-11 16:45',
        messages: [
            {
                id: '1',
                sender: 'customer',
                senderName: 'Mike CTO',
                message: 'I have a CSV file with 500 leads. How do I import them into MailSmith?',
                timestamp: '2026-01-11 16:45',
            },
        ],
    },
    {
        id: '4',
        title: 'Billing inquiry',
        description: 'Question about upgrading from Starter to Pro plan.',
        customer: 'GrowthHackers',
        customerEmail: 'team@growthhackers.co',
        priority: 'low',
        status: 'resolved',
        createdAt: '2026-01-10 09:00',
        updatedAt: '2026-01-10 11:30',
        messages: [
            {
                id: '1',
                sender: 'customer',
                senderName: 'Growth Team',
                message: 'We want to upgrade to Pro. What are the benefits and can we do a prorated upgrade?',
                timestamp: '2026-01-10 09:00',
            },
            {
                id: '2',
                sender: 'admin',
                senderName: 'Support Team',
                message: 'Absolutely! Pro gives you more leads, campaigns, and priority support. The upgrade is prorated, so you only pay for the remaining days in your billing cycle. I\'ve added a 20% discount for you.',
                timestamp: '2026-01-10 11:30',
            },
        ],
    },
]

const priorityConfig: Record<string, { label: string; color: string }> = {
    low: { label: 'Low', color: 'bg-emerald-500' },
    medium: { label: 'Medium', color: 'bg-amber-500' },
    high: { label: 'High', color: 'bg-rose-500' },
    critical: { label: 'Critical', color: 'bg-red-600' },
}

const statusConfig: Record<string, { label: string; icon: React.ReactNode; variant: 'default' | 'secondary' | 'outline' }> = {
    open: { label: 'Open', icon: <AlertCircle className="h-4 w-4 text-amber-500" />, variant: 'outline' },
    in_progress: { label: 'In Progress', icon: <Clock className="h-4 w-4 text-blue-500" />, variant: 'default' },
    resolved: { label: 'Resolved', icon: <CheckCircle className="h-4 w-4 text-emerald-500" />, variant: 'secondary' },
    closed: { label: 'Closed', icon: <CheckCircle className="h-4 w-4 text-muted-foreground" />, variant: 'secondary' },
}

export default function AdminSupportPage() {
    const [selectedTicket, setSelectedTicket] = useState<typeof mockTickets[0] | null>(null)
    const [replyMessage, setReplyMessage] = useState('')
    const [filterStatus, setFilterStatus] = useState('all')
    const [filterPriority, setFilterPriority] = useState('all')

    const filteredTickets = mockTickets.filter((ticket) => {
        if (filterStatus !== 'all' && ticket.status !== filterStatus) return false
        if (filterPriority !== 'all' && ticket.priority !== filterPriority) return false
        return true
    })

    const handleSendReply = () => {
        if (!replyMessage.trim()) return
        toast.success('Reply sent to customer')
        setReplyMessage('')
    }

    const handleUpdateStatus = (ticketId: string, newStatus: string) => {
        toast.success(`Ticket status updated to ${statusConfig[newStatus].label}`)
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Support Tickets</h1>
                <p className="text-muted-foreground">
                    Manage customer support requests
                </p>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Open Tickets
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-amber-500">
                            {mockTickets.filter((t) => t.status === 'open').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            In Progress
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-blue-500">
                            {mockTickets.filter((t) => t.status === 'in_progress').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            Resolved Today
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-emerald-500">
                            {mockTickets.filter((t) => t.status === 'resolved').length}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium text-muted-foreground">
                            High Priority
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold text-rose-500">
                            {mockTickets.filter((t) => t.priority === 'high' && t.status !== 'resolved').length}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4">
                <div className="relative flex-1 max-w-sm">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search tickets..." className="pl-10" />
                </div>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Status</SelectItem>
                        <SelectItem value="open">Open</SelectItem>
                        <SelectItem value="in_progress">In Progress</SelectItem>
                        <SelectItem value="resolved">Resolved</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Priority" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="all">All Priority</SelectItem>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {/* Tickets Table */}
            <Card>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Ticket</TableHead>
                            <TableHead>Customer</TableHead>
                            <TableHead>Priority</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Created</TableHead>
                            <TableHead className="w-[100px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {filteredTickets.map((ticket) => (
                            <TableRow key={ticket.id}>
                                <TableCell>
                                    <div className="font-medium">{ticket.title}</div>
                                    <div className="text-sm text-muted-foreground truncate max-w-xs">
                                        {ticket.description}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="font-medium">{ticket.customer}</div>
                                    <div className="text-sm text-muted-foreground">{ticket.customerEmail}</div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        <div className={`h-2 w-2 rounded-full ${priorityConfig[ticket.priority].color}`} />
                                        {priorityConfig[ticket.priority].label}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="flex items-center gap-2">
                                        {statusConfig[ticket.status].icon}
                                        <Badge variant={statusConfig[ticket.status].variant}>
                                            {statusConfig[ticket.status].label}
                                        </Badge>
                                    </div>
                                </TableCell>
                                <TableCell className="text-muted-foreground">
                                    {ticket.createdAt}
                                </TableCell>
                                <TableCell>
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => setSelectedTicket(ticket)}
                                    >
                                        <Eye className="mr-2 h-4 w-4" />
                                        View
                                    </Button>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </Card>

            {/* Ticket Detail Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={() => setSelectedTicket(null)}>
                {selectedTicket && (
                    <DialogContent className="max-w-3xl max-h-[80vh] flex flex-col">
                        <DialogHeader>
                            <div className="flex items-start justify-between">
                                <div>
                                    <DialogTitle>{selectedTicket.title}</DialogTitle>
                                    <DialogDescription>
                                        {selectedTicket.customer} • {selectedTicket.customerEmail}
                                    </DialogDescription>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className={`h-2 w-2 rounded-full ${priorityConfig[selectedTicket.priority].color}`} />
                                    <Badge variant={statusConfig[selectedTicket.status].variant}>
                                        {statusConfig[selectedTicket.status].label}
                                    </Badge>
                                </div>
                            </div>
                        </DialogHeader>

                        {/* Quick Actions */}
                        <div className="flex items-center gap-2 py-2 border-b">
                            <Button variant="outline" size="sm" asChild>
                                <Link href={`/admin/customers/${selectedTicket.id}`}>
                                    <UserCog className="mr-2 h-4 w-4" />
                                    View Customer
                                </Link>
                            </Button>
                            <Select
                                defaultValue={selectedTicket.status}
                                onValueChange={(value) => handleUpdateStatus(selectedTicket.id, value)}
                            >
                                <SelectTrigger className="w-[150px]">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Messages */}
                        <div className="flex-1 overflow-y-auto space-y-4 py-4">
                            {selectedTicket.messages.map((msg) => (
                                <div
                                    key={msg.id}
                                    className={`flex ${msg.sender === 'admin' ? 'justify-end' : 'justify-start'}`}
                                >
                                    <div
                                        className={`max-w-[80%] rounded-lg p-4 ${msg.sender === 'admin'
                                                ? 'bg-primary text-primary-foreground'
                                                : 'bg-muted'
                                            }`}
                                    >
                                        <div className="flex items-center gap-2 mb-2">
                                            <span className="text-sm font-medium">{msg.senderName}</span>
                                            <span className="text-xs opacity-70">{msg.timestamp}</span>
                                        </div>
                                        <p className="text-sm">{msg.message}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Reply Input */}
                        <div className="border-t pt-4">
                            <div className="space-y-2">
                                <Label>Reply</Label>
                                <Textarea
                                    placeholder="Type your reply..."
                                    value={replyMessage}
                                    onChange={(e) => setReplyMessage(e.target.value)}
                                    rows={3}
                                />
                            </div>
                        </div>

                        <DialogFooter>
                            <Button variant="outline" onClick={() => setSelectedTicket(null)}>
                                Close
                            </Button>
                            <Button onClick={handleSendReply} disabled={!replyMessage.trim()}>
                                <Send className="mr-2 h-4 w-4" />
                                Send Reply
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                )}
            </Dialog>
        </div>
    )
}
