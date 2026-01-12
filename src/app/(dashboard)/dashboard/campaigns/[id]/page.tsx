'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table'
import { Separator } from '@/components/ui/separator'
import { StatCard, PercentageRing } from '@/components/dashboard/stat-card'
import {
    ArrowLeft,
    Play,
    Pause,
    Settings,
    Users,
    Mail,
    TrendingUp,
    Clock,
    Plus,
    Trash2,
    GripVertical,
    Save,
    Eye,
} from 'lucide-react'

// Mock campaign data
const mockCampaign = {
    id: '1',
    name: 'Q1 Outreach - Tech Founders',
    description: 'Targeting tech founders and CTOs for our new product launch.',
    status: 'active',
    createdAt: '2026-01-05',
    leads: 450,
    sent: 380,
    opened: 122,
    replied: 31,
    bounced: 8,
    sequences: [
        {
            id: '1',
            step: 1,
            subject: 'Quick question about {{company}}',
            body: `Hi {{firstName}},

{{icebreaker}}

I noticed {{company}} is scaling fast, and I wanted to reach out because we've helped similar companies streamline their outreach.

Would you be open to a quick 15-minute call this week?

Best,
{{senderName}}`,
            waitDays: 0,
        },
        {
            id: '2',
            step: 2,
            subject: 'Re: Quick question about {{company}}',
            body: `Hi {{firstName}},

Just following up on my previous email. I know you're busy, so I'll keep this brief.

We recently helped [Similar Company] increase their response rates by 3x. Happy to share how.

Worth a quick chat?

{{senderName}}`,
            waitDays: 3,
        },
        {
            id: '3',
            step: 3,
            subject: 'Last try - {{firstName}}',
            body: `Hi {{firstName}},

I don't want to be a pest, so this will be my last email.

If you're curious about how we help companies like {{company}} scale outreach, just reply "interested" and I'll send over a quick case study.

No worries if not - I'll leave you alone after this. 😊

{{senderName}}`,
            waitDays: 5,
        },
    ],
}

const mockLeads = [
    { id: '1', name: 'John Smith', email: 'john@techcorp.com', company: 'TechCorp', status: 'replied', openedAt: '2 hours ago' },
    { id: '2', name: 'Sarah Johnson', email: 'sarah@startupxyz.com', company: 'StartupXYZ', status: 'opened', openedAt: '5 hours ago' },
    { id: '3', name: 'Mike Chen', email: 'mike@innovate.io', company: 'Innovate.io', status: 'sent', openedAt: null },
    { id: '4', name: 'Emily Davis', email: 'emily@venture.co', company: 'Venture Co', status: 'bounced', openedAt: null },
    { id: '5', name: 'Alex Wilson', email: 'alex@growth.io', company: 'Growth.io', status: 'opened', openedAt: '1 day ago' },
]

const statusColors: Record<string, string> = {
    sent: 'bg-blue-500',
    opened: 'bg-purple-500',
    replied: 'bg-emerald-500',
    bounced: 'bg-rose-500',
}

export default function CampaignDetailPage() {
    const params = useParams()
    const [sequences, setSequences] = useState(mockCampaign.sequences)
    const [editingSequence, setEditingSequence] = useState<string | null>(null)

    const campaign = mockCampaign
    const openRate = campaign.sent > 0 ? Math.round((campaign.opened / campaign.sent) * 100) : 0
    const replyRate = campaign.sent > 0 ? Math.round((campaign.replied / campaign.sent) * 100) : 0
    const bounceRate = campaign.sent > 0 ? Math.round((campaign.bounced / campaign.sent) * 100) : 0

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                        <Link href="/dashboard/campaigns" className="hover:text-foreground transition-colors">
                            <ArrowLeft className="h-4 w-4" />
                        </Link>
                        <span>Campaigns</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <h1 className="text-3xl font-bold tracking-tight">{campaign.name}</h1>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                            {campaign.status}
                        </Badge>
                    </div>
                    <p className="text-muted-foreground">{campaign.description}</p>
                </div>
                <div className="flex gap-2">
                    {campaign.status === 'active' ? (
                        <Button variant="outline">
                            <Pause className="mr-2 h-4 w-4" />
                            Pause
                        </Button>
                    ) : (
                        <Button variant="outline">
                            <Play className="mr-2 h-4 w-4" />
                            Resume
                        </Button>
                    )}
                    <Button variant="outline">
                        <Settings className="mr-2 h-4 w-4" />
                        Settings
                    </Button>
                </div>
            </div>

            {/* Stats */}
            <div className="grid gap-4 md:grid-cols-4">
                <StatCard title="Total Leads" value={campaign.leads} icon={Users} />
                <StatCard title="Emails Sent" value={campaign.sent} icon={Mail} />
                <StatCard title="Replies" value={campaign.replied} icon={TrendingUp} />
                <StatCard title="Bounce Rate" value={`${bounceRate}%`} icon={Mail} />
            </div>

            {/* Performance Metrics */}
            <Card>
                <CardHeader>
                    <CardTitle>Campaign Performance</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex justify-around">
                        <PercentageRing value={openRate} title="Open Rate" />
                        <PercentageRing value={replyRate} title="Reply Rate" />
                        <PercentageRing value={bounceRate} title="Bounce Rate" />
                    </div>
                </CardContent>
            </Card>

            {/* Tabs */}
            <Tabs defaultValue="sequences" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="sequences">
                        <Mail className="mr-2 h-4 w-4" />
                        Sequences
                    </TabsTrigger>
                    <TabsTrigger value="leads">
                        <Users className="mr-2 h-4 w-4" />
                        Leads ({campaign.leads})
                    </TabsTrigger>
                    <TabsTrigger value="analytics">
                        <TrendingUp className="mr-2 h-4 w-4" />
                        Analytics
                    </TabsTrigger>
                </TabsList>

                {/* Sequences Tab */}
                <TabsContent value="sequences" className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold">Email Sequences</h3>
                            <p className="text-sm text-muted-foreground">
                                Edit your email sequence. Changes will sync to Instantly.
                            </p>
                        </div>
                        <Button variant="outline" size="sm">
                            <Plus className="mr-2 h-4 w-4" />
                            Add Step
                        </Button>
                    </div>

                    <div className="space-y-4">
                        {sequences.map((sequence, index) => (
                            <Card key={sequence.id} className="relative">
                                <CardHeader className="pb-2">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <GripVertical className="h-4 w-4 cursor-grab" />
                                                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                                    {sequence.step}
                                                </span>
                                            </div>
                                            <div>
                                                <CardTitle className="text-base">Step {sequence.step}</CardTitle>
                                                {sequence.waitDays > 0 && (
                                                    <CardDescription className="flex items-center gap-1">
                                                        <Clock className="h-3 w-3" />
                                                        Wait {sequence.waitDays} days after previous
                                                    </CardDescription>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="ghost"
                                                size="sm"
                                                onClick={() => setEditingSequence(editingSequence === sequence.id ? null : sequence.id)}
                                            >
                                                {editingSequence === sequence.id ? (
                                                    <>
                                                        <Eye className="mr-2 h-4 w-4" />
                                                        Preview
                                                    </>
                                                ) : (
                                                    <>
                                                        <Settings className="mr-2 h-4 w-4" />
                                                        Edit
                                                    </>
                                                )}
                                            </Button>
                                            <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive">
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    {editingSequence === sequence.id ? (
                                        <div className="space-y-4">
                                            <div className="space-y-2">
                                                <Label>Subject Line</Label>
                                                <Input defaultValue={sequence.subject} />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Email Body</Label>
                                                <Textarea
                                                    defaultValue={sequence.body}
                                                    rows={8}
                                                    className="font-mono text-sm"
                                                />
                                            </div>
                                            <div className="space-y-2">
                                                <Label>Wait Days</Label>
                                                <Input
                                                    type="number"
                                                    defaultValue={sequence.waitDays}
                                                    className="w-24"
                                                />
                                            </div>
                                            <div className="flex justify-end">
                                                <Button>
                                                    <Save className="mr-2 h-4 w-4" />
                                                    Save Changes
                                                </Button>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <div>
                                                <span className="text-sm font-medium text-muted-foreground">Subject:</span>
                                                <p className="font-medium">{sequence.subject}</p>
                                            </div>
                                            <Separator />
                                            <div>
                                                <span className="text-sm font-medium text-muted-foreground">Body:</span>
                                                <pre className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground font-sans">
                                                    {sequence.body}
                                                </pre>
                                            </div>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Leads Tab */}
                <TabsContent value="leads">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Campaign Leads</CardTitle>
                                <Button size="sm">
                                    <Plus className="mr-2 h-4 w-4" />
                                    Add Leads
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Company</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead>Last Activity</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {mockLeads.map((lead) => (
                                        <TableRow key={lead.id}>
                                            <TableCell className="font-medium">{lead.name}</TableCell>
                                            <TableCell>{lead.email}</TableCell>
                                            <TableCell>{lead.company}</TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <div className={`h-2 w-2 rounded-full ${statusColors[lead.status]}`} />
                                                    <span className="capitalize">{lead.status}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-muted-foreground">
                                                {lead.openedAt || '-'}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Analytics Tab */}
                <TabsContent value="analytics">
                    <Card>
                        <CardHeader>
                            <CardTitle>Campaign Analytics</CardTitle>
                            <CardDescription>Coming soon - detailed analytics and insights</CardDescription>
                        </CardHeader>
                        <CardContent className="h-64 flex items-center justify-center text-muted-foreground">
                            <div className="text-center">
                                <TrendingUp className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                <p>Analytics dashboard coming in Phase 2</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
