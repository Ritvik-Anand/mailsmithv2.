'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import {
    MessageSquare,
    HelpCircle,
    Bug,
    Send,
    Search,
    Book,
    Video,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Clock,
    Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

// Mock FAQ data
const mockFaqs = [
    {
        id: '1',
        question: 'How do I create a new campaign?',
        answer: 'Go to Campaigns > New Campaign. Enter your campaign details, add leads, and set up your email sequence. Once ready, click "Launch Campaign" to start sending.',
        category: 'campaigns',
    },
    {
        id: '2',
        question: 'How do I scrape leads from LinkedIn?',
        answer: 'Go to Leads > Scrape Leads > LinkedIn Sales Navigator. Enter your search criteria (job titles, companies, locations) and click "Start Scrape". Your leads will be imported automatically.',
        category: 'leads',
    },
    {
        id: '3',
        question: 'What are icebreakers and how do they work?',
        answer: 'Icebreakers are AI-generated personalized opening lines for each lead. We analyze their LinkedIn profile and recent activity to craft a relevant, engaging first line. Use the {{icebreaker}} variable in your email templates.',
        category: 'features',
    },

    {
        id: '5',
        question: 'What counts towards my plan limits?',
        answer: 'Your plan limits include total leads stored, active campaigns, and team members. Deleted leads don\'t count. Check Settings > Billing for current usage.',
        category: 'billing',
    },
]

// Mock past bug reports
const mockBugReports = [
    {
        id: '1',
        title: 'Campaign not starting',
        status: 'resolved',
        createdAt: '2026-01-05',
        resolvedAt: '2026-01-06',
    },
    {
        id: '2',
        title: 'LinkedIn scraper timeout',
        status: 'in_progress',
        createdAt: '2026-01-10',
        resolvedAt: null,
    },
]

const bugStatusConfig: Record<string, { label: string; icon: React.ReactNode }> = {
    open: { label: 'Open', icon: <AlertCircle className="h-4 w-4 text-amber-500" /> },
    in_progress: { label: 'In Progress', icon: <Clock className="h-4 w-4 text-blue-500" /> },
    resolved: { label: 'Resolved', icon: <CheckCircle className="h-4 w-4 text-emerald-500" /> },
    closed: { label: 'Closed', icon: <CheckCircle className="h-4 w-4 text-muted-foreground" /> },
}

export default function SupportPage() {
    const [searchQuery, setSearchQuery] = useState('')
    const [bugFormData, setBugFormData] = useState({
        title: '',
        description: '',
        severity: '',
    })
    const [isSubmitting, setIsSubmitting] = useState(false)

    const filteredFaqs = mockFaqs.filter(
        (faq) =>
            faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
            faq.answer.toLowerCase().includes(searchQuery.toLowerCase())
    )

    const handleBugSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate API call
        await new Promise((resolve) => setTimeout(resolve, 1500))

        toast.success('Bug report submitted', {
            description: "We'll get back to you within 24 hours.",
        })

        setBugFormData({ title: '', description: '', severity: '' })
        setIsSubmitting(false)
    }

    return (
        <div className="space-y-6">
            {/* Page Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight">Support</h1>
                <p className="text-muted-foreground">
                    Get help, report issues, or browse our knowledge base
                </p>
            </div>

            {/* Quick Help Cards */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10">
                            <Book className="h-6 w-6 text-blue-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Knowledge Base</h3>
                            <p className="text-sm text-muted-foreground">
                                Browse articles and guides
                            </p>
                        </div>
                        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10">
                            <Video className="h-6 w-6 text-purple-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Video Tutorials</h3>
                            <p className="text-sm text-muted-foreground">
                                Watch how-to videos
                            </p>
                        </div>
                        <ChevronRight className="ml-auto h-5 w-5 text-muted-foreground" />
                    </CardContent>
                </Card>
                <Card className="cursor-pointer hover:border-primary transition-colors">
                    <CardContent className="flex items-center gap-4 p-6">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10">
                            <MessageSquare className="h-6 w-6 text-emerald-500" />
                        </div>
                        <div>
                            <h3 className="font-semibold">Live Chat</h3>
                            <p className="text-sm text-muted-foreground">
                                Chat with our AI assistant
                            </p>
                        </div>
                        <Badge variant="secondary">Coming Soon</Badge>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="faq" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="faq">
                        <HelpCircle className="mr-2 h-4 w-4" />
                        FAQ
                    </TabsTrigger>
                    <TabsTrigger value="bug-report">
                        <Bug className="mr-2 h-4 w-4" />
                        Report a Bug
                    </TabsTrigger>
                    <TabsTrigger value="my-tickets">
                        <MessageSquare className="mr-2 h-4 w-4" />
                        My Tickets
                    </TabsTrigger>
                </TabsList>

                {/* FAQ Tab */}
                <TabsContent value="faq" className="space-y-6">
                    {/* Search */}
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search FAQs..."
                            className="pl-10"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>

                    {/* FAQ List */}
                    <div className="space-y-4">
                        {filteredFaqs.map((faq) => (
                            <Card key={faq.id}>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-base">{faq.question}</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground">{faq.answer}</p>
                                </CardContent>
                            </Card>
                        ))}

                        {filteredFaqs.length === 0 && (
                            <Card>
                                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                                    <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="font-semibold">No matching FAQs</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Try a different search term or report a bug if you're having issues.
                                    </p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Bug Report Tab */}
                <TabsContent value="bug-report">
                    <div className="grid gap-6 lg:grid-cols-2">
                        {/* Bug Report Form */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Report a Bug</CardTitle>
                                <CardDescription>
                                    Help us improve by reporting any issues you encounter
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <form onSubmit={handleBugSubmit} className="space-y-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="bug-title">Title</Label>
                                        <Input
                                            id="bug-title"
                                            placeholder="Brief description of the issue"
                                            value={bugFormData.title}
                                            onChange={(e) =>
                                                setBugFormData({ ...bugFormData, title: e.target.value })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bug-severity">Severity</Label>
                                        <Select
                                            value={bugFormData.severity}
                                            onValueChange={(value) =>
                                                setBugFormData({ ...bugFormData, severity: value })
                                            }
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select severity" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="low">Low - Minor inconvenience</SelectItem>
                                                <SelectItem value="medium">Medium - Feature not working properly</SelectItem>
                                                <SelectItem value="high">High - Major feature broken</SelectItem>
                                                <SelectItem value="critical">Critical - Can't use the app</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="bug-description">Description</Label>
                                        <Textarea
                                            id="bug-description"
                                            placeholder="Please describe the issue in detail. Include steps to reproduce if possible."
                                            rows={6}
                                            value={bugFormData.description}
                                            onChange={(e) =>
                                                setBugFormData({ ...bugFormData, description: e.target.value })
                                            }
                                            required
                                        />
                                    </div>

                                    <div className="rounded-lg bg-muted/50 p-4 text-sm text-muted-foreground">
                                        <p className="font-medium text-foreground mb-1">Auto-captured info:</p>
                                        <ul className="space-y-1">
                                            <li>• Browser: {typeof window !== 'undefined' ? navigator.userAgent.split(' ').pop() : 'N/A'}</li>
                                            <li>• Current page: /dashboard/support</li>
                                            <li>• Timestamp: {new Date().toISOString()}</li>
                                        </ul>
                                    </div>

                                    <Button type="submit" className="w-full" disabled={isSubmitting}>
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                                Submitting...
                                            </>
                                        ) : (
                                            <>
                                                <Send className="mr-2 h-4 w-4" />
                                                Submit Bug Report
                                            </>
                                        )}
                                    </Button>
                                </form>
                            </CardContent>
                        </Card>

                        {/* Tips */}
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Tips for a Good Bug Report</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 text-sm">
                                    <div className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                            1
                                        </span>
                                        <p>
                                            <strong>Be specific:</strong> Describe exactly what happened vs. what you expected.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                            2
                                        </span>
                                        <p>
                                            <strong>Steps to reproduce:</strong> Tell us how to recreate the issue.
                                        </p>
                                    </div>
                                    <div className="flex gap-3">
                                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-medium text-primary-foreground">
                                            3
                                        </span>
                                        <p>
                                            <strong>Screenshots help:</strong> If visual, attach a screenshot.
                                        </p>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-base">Response Times</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-2 text-sm">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Critical</span>
                                        <span className="font-medium">Within 4 hours</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">High</span>
                                        <span className="font-medium">Within 24 hours</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">Medium/Low</span>
                                        <span className="font-medium">Within 72 hours</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                {/* My Tickets Tab */}
                <TabsContent value="my-tickets">
                    <Card>
                        <CardHeader>
                            <CardTitle>My Bug Reports</CardTitle>
                            <CardDescription>Track the status of your submitted reports</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {mockBugReports.length > 0 ? (
                                <div className="space-y-4">
                                    {mockBugReports.map((report) => (
                                        <div
                                            key={report.id}
                                            className="flex items-center justify-between rounded-lg border p-4"
                                        >
                                            <div className="space-y-1">
                                                <h4 className="font-medium">{report.title}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Submitted on {report.createdAt}
                                                </p>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {bugStatusConfig[report.status].icon}
                                                <span className="text-sm font-medium">
                                                    {bugStatusConfig[report.status].label}
                                                </span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-12 text-center">
                                    <Bug className="h-12 w-12 text-muted-foreground/50 mb-4" />
                                    <h3 className="font-semibold">No bug reports yet</h3>
                                    <p className="text-sm text-muted-foreground">
                                        You haven't submitted any bug reports.
                                    </p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
