'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import {
    ArrowLeft,
    Save,
    Rocket,
    Plus,
    Trash2,
    Copy,
    BarChart3,
    Users,
    Mail,
    Calendar,
    Settings,
    Loader2,
    CheckCircle2,
    Clock,
    Zap,
    Eye
} from 'lucide-react'
import { getOrganizations } from '@/server/actions/organizations'
import { getOrganizationNodes, launchCampaign } from '@/server/actions/instantly'
import { toast } from 'sonner'

// Timezone options
const TIMEZONES = [
    { value: 'America/New_York', label: 'Eastern Time (ET)' },
    { value: 'America/Chicago', label: 'Central Time (CT)' },
    { value: 'America/Denver', label: 'Mountain Time (MT)' },
    { value: 'America/Los_Angeles', label: 'Pacific Time (PT)' },
    { value: 'America/Phoenix', label: 'Arizona (MST)' },
    { value: 'Europe/London', label: 'London (GMT)' },
    { value: 'Europe/Paris', label: 'Paris (CET)' },
    { value: 'Asia/Dubai', label: 'Dubai (GST)' },
    { value: 'Asia/Kolkata', label: 'India (IST)' },
    { value: 'Asia/Singapore', label: 'Singapore (SGT)' },
    { value: 'Australia/Sydney', label: 'Sydney (AEDT)' },
]

// Tab type
type TabType = 'sequences' | 'schedule' | 'options'

function NewCampaignContent() {
    const router = useRouter()
    const searchParams = useSearchParams()
    const orgId = searchParams.get('orgId')
    const [activeTab, setActiveTab] = useState<TabType>('sequences')
    const [selectedStepId, setSelectedStepId] = useState<number>(1)
    const [isSubmitting, setIsSubmitting] = useState(false)

    // Organization and nodes
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>('')
    const [orgNodes, setOrgNodes] = useState<any[]>([])
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])

    // Campaign basics
    const [campaignName, setCampaignName] = useState('')

    // Sequences (multi-step emails)
    const [sequences, setSequences] = useState([
        { id: 1, stepNumber: 1, delayDays: 0, subject: '', body: '', variants: [] as any[] }
    ])

    // Schedule
    const [schedule, setSchedule] = useState({
        sendFromHour: 9,
        sendToHour: 17,
        timezone: 'America/New_York',
        days: {
            monday: true,
            tuesday: true,
            wednesday: true,
            thursday: true,
            friday: true,
            saturday: false,
            sunday: false
        }
    })

    // Options - All Instantly campaign options
    const [options, setOptions] = useState({
        stopOnReply: true,
        openTracking: true,
        linkTracking: false,
        sendAsText: false,
        dailyLimit: 50,
        // Advanced options
        ccEmail: '',
        bccEmail: '',
        customTrackingDomain: '',
        prioritizeNewLeads: true,
        matchLeadTimezone: false,
        skipWeekends: true,
        randomizeDelay: true,
        minDelay: 3,
        maxDelay: 7
    })

    // Load organizations
    useEffect(() => {
        async function loadOrgs() {
            const orgs = await getOrganizations()
            setOrganizations(orgs)

            // Auto-select if orgId is in URL
            if (orgId && orgs.some((o: any) => o.id === orgId)) {
                setSelectedOrgId(orgId)
            }
        }
        loadOrgs()
    }, [orgId])

    // Load nodes when org changes
    useEffect(() => {
        async function loadNodes() {
            if (selectedOrgId) {
                const nodes = await getOrganizationNodes(selectedOrgId)
                setOrgNodes(nodes)
                setSelectedNodeIds(nodes.map((n: any) => n.id))
            } else {
                setOrgNodes([])
                setSelectedNodeIds([])
            }
        }
        loadNodes()
    }, [selectedOrgId])

    // Toggle node selection
    const toggleNode = (id: string) => {
        setSelectedNodeIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    // Add new sequence step
    const addSequenceStep = () => {
        setSequences(prev => {
            const newStep = {
                id: Math.max(...prev.map(s => s.id)) + 1,
                stepNumber: prev.length + 1,
                delayDays: 3,
                subject: '',
                body: '',
                variants: []
            }
            return [...prev, newStep]
        })
    }

    // Remove sequence step
    const removeSequenceStep = (id: number) => {
        setSequences(prev => {
            if (prev.length > 1) {
                return prev.filter(s => s.id !== id)
            }
            return prev
        })
    }

    const [lastFocusedStepId, setLastFocusedStepId] = useState<number>(1)
    const [lastFocusedField, setLastFocusedField] = useState<'subject' | 'body'>('body')

    // Update sequence - using functional update to fix stale closure
    const updateSequence = (id: number, field: string, value: any) => {
        setSequences(prev => prev.map(s =>
            s.id === id ? { ...s, [field]: value } : s
        ))
    }

    const insertVariable = (variable: string) => {
        setSequences(prev => prev.map(s => {
            if (s.id === lastFocusedStepId) {
                const currentVal = (s as any)[lastFocusedField] || ''
                // For simplicity in this non-ref version, we append.
                // In a perfect world we'd use refs like in the edit page,
                // but let's at least make it work.
                return { ...s, [lastFocusedField]: currentVal + variable }
            }
            return s
        }))
    }

    // Handle launch
    const handleLaunch = async (startImmediately: boolean = false) => {
        if (!selectedOrgId) {
            toast.error('Please select a customer organization')
            return
        }
        if (!campaignName) {
            toast.error('Please enter a campaign name')
            return
        }
        if (!sequences[0]?.subject || !sequences[0]?.body) {
            toast.error('Please complete the first email sequence')
            return
        }
        if (selectedNodeIds.length === 0) {
            toast.error('Please select at least one sending account')
            return
        }

        setIsSubmitting(true)
        try {
            const result = await launchCampaign({
                organizationId: selectedOrgId,
                name: campaignName,
                sequences: sequences,
                schedule: schedule,
                options: options,
                outreachNodeIds: selectedNodeIds,
                startImmediately
            })

            if (result.success) {
                toast.success(`Campaign "${campaignName}" ${startImmediately ? 'launched' : 'created'} successfully!`)
                router.push('/operator/campaigns')
            } else {
                toast.error(result.error || 'Failed to create campaign')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    // Tab components
    const tabs = [
        { id: 'sequences' as TabType, label: 'Sequences', icon: Mail },
        { id: 'schedule' as TabType, label: 'Schedule', icon: Calendar },
        { id: 'options' as TabType, label: 'Options', icon: Settings },
    ]

    return (
        <div className="min-h-screen pb-20">
            {/* Header */}
            <div className="sticky top-0 z-10 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-zinc-800">
                <div className="container py-4">
                    <div className="flex items-center justify-between">
                        {/* Left: Back + Title */}
                        <div className="flex items-center gap-4">
                            <Link href="/operator/campaigns">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div className="flex items-center gap-3">
                                <Input
                                    value={campaignName}
                                    onChange={(e) => setCampaignName(e.target.value)}
                                    placeholder="New Campaign Name..."
                                    className="text-lg font-bold bg-transparent border-none focus-visible:ring-0 px-0 h-auto w-[300px]"
                                />
                                <Badge variant="outline" className="bg-zinc-800 text-zinc-400 border-zinc-700">
                                    DRAFT
                                </Badge>
                            </div>
                        </div>

                        {/* Right: Actions */}
                        <div className="flex items-center gap-3">
                            <Button
                                variant="outline"
                                className="border-zinc-700 text-zinc-400"
                                onClick={() => handleLaunch(false)}
                                disabled={isSubmitting}
                            >
                                <Save className="mr-2 h-4 w-4" />
                                Save Draft
                            </Button>
                            <Button
                                className="bg-amber-500 hover:bg-amber-600 text-black font-bold"
                                onClick={() => handleLaunch(true)}
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                ) : (
                                    <Rocket className="mr-2 h-4 w-4" />
                                )}
                                Launch Campaign
                            </Button>
                        </div>
                    </div>

                    {/* Tabs */}
                    <div className="flex items-center gap-1 mt-4">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg transition-colors ${activeTab === tab.id
                                    ? 'bg-amber-500/10 text-amber-500'
                                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50'
                                    }`}
                            >
                                <tab.icon className="h-4 w-4" />
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            <div className="container py-6">
                {/* Customer Selection Banner */}
                <Card className="bg-zinc-900/50 border-zinc-800 mb-6">
                    <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                                    <Users className="h-5 w-5 text-amber-500" />
                                </div>
                                <div>
                                    <Label className="text-xs text-zinc-500 uppercase tracking-wider">Target Customer</Label>
                                    <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                                        <SelectTrigger className="w-[300px] mt-1 bg-zinc-950 border-zinc-800">
                                            <SelectValue placeholder="Select customer organization..." />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800">
                                            {organizations.map(org => (
                                                <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {selectedOrgId && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                    <CheckCircle2 className="mr-1 h-3 w-3" />
                                    Customer Connected
                                </Badge>
                            )}
                        </div>
                    </CardContent>
                </Card>

                {/* Tab Content */}
                {activeTab === 'sequences' && (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Sequence Steps */}
                        <div className="lg:col-span-1 space-y-3">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="text-sm font-bold text-zinc-400 uppercase tracking-wider">Email Steps</h3>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={addSequenceStep}
                                    className="text-amber-500 hover:text-amber-400 hover:bg-amber-500/10"
                                >
                                    <Plus className="h-4 w-4 mr-1" />
                                    Add Step
                                </Button>
                            </div>

                            {sequences.map((seq, idx) => (
                                <div
                                    key={seq.id}
                                    onClick={() => {
                                        setSelectedStepId(seq.id)
                                        setLastFocusedStepId(seq.id)
                                    }}
                                    className={`p-4 rounded-xl border transition-all cursor-pointer ${selectedStepId === seq.id
                                        ? 'bg-amber-500/5 border-amber-500/30'
                                        : 'bg-zinc-900/50 border-zinc-800 hover:border-zinc-700'
                                        }`}
                                >
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            <div className={`h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold ${idx === 0 ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                                                }`}>
                                                {seq.stepNumber}
                                            </div>
                                            <span className="text-sm font-medium">Step {seq.stepNumber}</span>
                                        </div>
                                        {sequences.length > 1 && (
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-6 w-6 text-zinc-600 hover:text-red-500"
                                                onClick={() => removeSequenceStep(seq.id)}
                                            >
                                                <Trash2 className="h-3 w-3" />
                                            </Button>
                                        )}
                                    </div>

                                    {idx > 0 && (
                                        <div className="flex items-center gap-2 mb-3">
                                            <Clock className="h-3 w-3 text-zinc-600" />
                                            <span className="text-xs text-zinc-600">Wait</span>
                                            <Input
                                                type="number"
                                                value={seq.delayDays}
                                                onChange={(e) => updateSequence(seq.id, 'delayDays', parseInt(e.target.value))}
                                                className="w-14 h-6 text-xs bg-zinc-950 border-zinc-800 text-center"
                                            />
                                            <span className="text-xs text-zinc-600">days</span>
                                        </div>
                                    )}

                                    <p className="text-xs text-zinc-500 truncate">
                                        {seq.subject || 'No subject yet...'}
                                    </p>
                                </div>
                            ))}
                        </div>

                        {/* Email Editor */}
                        <div className="lg:col-span-2">
                            {(() => {
                                const activeStep = sequences.find(s => s.id === selectedStepId) || sequences[0]
                                return (
                                    <Card className="bg-zinc-900/50 border-zinc-800">
                                        <CardHeader className="border-b border-zinc-800">
                                            <div className="flex items-center justify-between">
                                                <CardTitle className="text-base">Step {activeStep?.stepNumber} Email</CardTitle>
                                                <Button variant="ghost" size="sm" className="text-zinc-500">
                                                    <Eye className="h-4 w-4 mr-2" />
                                                    Preview
                                                </Button>
                                            </div>
                                        </CardHeader>
                                        <CardContent className="p-6 space-y-4">
                                            <div>
                                                <Label className="text-xs text-zinc-500 mb-2 block">Subject Line</Label>
                                                <Input
                                                    value={activeStep?.subject || ''}
                                                    onChange={(e) => updateSequence(activeStep?.id || 1, 'subject', e.target.value)}
                                                    onFocus={() => { setLastFocusedStepId(activeStep?.id || 1); setLastFocusedField('subject') }}
                                                    placeholder="Enter subject line..."
                                                    className="bg-zinc-950 border-zinc-800"
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs text-zinc-500 mb-2 block">Email Body</Label>
                                                <Textarea
                                                    value={activeStep?.body || ''}
                                                    onChange={(e) => updateSequence(activeStep?.id || 1, 'body', e.target.value)}
                                                    onFocus={() => { setLastFocusedStepId(activeStep?.id || 1); setLastFocusedField('body') }}
                                                    placeholder="Write your email here..."
                                                    className="min-h-[300px] bg-zinc-950 border-zinc-800 font-mono text-sm"
                                                />
                                            </div>

                                            {/* Variable hints */}
                                            <div className="flex flex-wrap gap-2 pt-2">
                                                <span className="text-xs text-zinc-600">Available variables:</span>
                                                {[
                                                    { var: '{{firstName}}', desc: 'Leads first name' },
                                                    { var: '{{lastName}}', desc: 'Leads last name' },
                                                    { var: '{{companyName}}', desc: 'Leads company name' },
                                                    { var: '{{jobTitle}}', desc: 'Leads job title' },
                                                    { var: '{{personalization}}', desc: 'AI icebreaker', highlight: true },
                                                    { var: '{{sendingAccountFirstName}}', desc: 'My first name' },
                                                ].map(v => (
                                                    <Badge
                                                        key={v.var}
                                                        variant="outline"
                                                        className={`text-[10px] cursor-pointer ${v.highlight
                                                            ? 'bg-amber-500/10 border-amber-500/50 text-amber-500 hover:bg-amber-500/20'
                                                            : 'bg-zinc-950 border-zinc-800 text-zinc-500 hover:border-amber-500/50 hover:text-amber-500'
                                                            }`}
                                                        title={v.desc}
                                                        onClick={() => insertVariable(v.var)}
                                                    >
                                                        {v.var}
                                                    </Badge>
                                                ))}
                                            </div>
                                        </CardContent>
                                    </Card>
                                )
                            })()}
                        </div>
                    </div>
                )}

                {activeTab === 'schedule' && (
                    <div className="max-w-2xl">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Calendar className="h-4 w-4 text-amber-500" />
                                    Sending Schedule
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Time Range */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label className="text-xs text-zinc-500 mb-2 block">Send From</Label>
                                        <Select
                                            value={schedule.sendFromHour.toString()}
                                            onValueChange={(v) => setSchedule({ ...schedule, sendFromHour: parseInt(v) })}
                                        >
                                            <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800">
                                                {[...Array(24)].map((_, i) => (
                                                    <SelectItem key={i} value={i.toString()}>
                                                        {i.toString().padStart(2, '0')}:00
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div>
                                        <Label className="text-xs text-zinc-500 mb-2 block">Send To</Label>
                                        <Select
                                            value={schedule.sendToHour.toString()}
                                            onValueChange={(v) => setSchedule({ ...schedule, sendToHour: parseInt(v) })}
                                        >
                                            <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-950 border-zinc-800">
                                                {[...Array(24)].map((_, i) => (
                                                    <SelectItem key={i} value={i.toString()}>
                                                        {i.toString().padStart(2, '0')}:00
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                {/* Timezone */}
                                <div>
                                    <Label className="text-xs text-zinc-500 mb-2 block">Timezone</Label>
                                    <Select
                                        value={schedule.timezone}
                                        onValueChange={(v) => setSchedule({ ...schedule, timezone: v })}
                                    >
                                        <SelectTrigger className="bg-zinc-950 border-zinc-800">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-950 border-zinc-800">
                                            {TIMEZONES.map(tz => (
                                                <SelectItem key={tz.value} value={tz.value}>{tz.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Days of Week */}
                                <div>
                                    <Label className="text-xs text-zinc-500 mb-3 block">Active Days</Label>
                                    <div className="flex flex-wrap gap-2">
                                        {Object.entries(schedule.days).map(([day, active]) => (
                                            <button
                                                key={day}
                                                onClick={() => setSchedule({
                                                    ...schedule,
                                                    days: { ...schedule.days, [day]: !active }
                                                })}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${active
                                                    ? 'bg-amber-500 text-black'
                                                    : 'bg-zinc-900 text-zinc-500 hover:bg-zinc-800'
                                                    }`}
                                            >
                                                {day.charAt(0).toUpperCase() + day.slice(1, 3)}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {activeTab === 'options' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Sending Accounts */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-base flex items-center gap-2">
                                        <Mail className="h-4 w-4 text-amber-500" />
                                        Sending Accounts
                                    </CardTitle>
                                    <Badge variant="outline" className="bg-zinc-800 border-zinc-700">
                                        {selectedNodeIds.length} Selected
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent>
                                {!selectedOrgId ? (
                                    <div className="text-center py-8 text-zinc-600">
                                        <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">Select a customer first</p>
                                    </div>
                                ) : orgNodes.length === 0 ? (
                                    <div className="text-center py-8 text-zinc-600">
                                        <Mail className="h-8 w-8 mx-auto mb-2 opacity-50" />
                                        <p className="text-sm">No sending accounts assigned</p>
                                    </div>
                                ) : (
                                    <div className="space-y-2 max-h-[300px] overflow-y-auto">
                                        {orgNodes.map(node => (
                                            <div
                                                key={node.id}
                                                onClick={() => toggleNode(node.id)}
                                                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedNodeIds.includes(node.id)
                                                    ? 'border-amber-500/50 bg-amber-500/5'
                                                    : 'border-zinc-800 hover:border-zinc-700'
                                                    }`}
                                            >
                                                <div className="flex items-center gap-3">
                                                    <div className={`h-2 w-2 rounded-full ${node.status === 'active' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                                    <div>
                                                        <p className="text-sm font-medium">{node.email_address}</p>
                                                        <p className="text-xs text-zinc-600">Warmup: {node.reputation_score || 0}%</p>
                                                    </div>
                                                </div>
                                                {selectedNodeIds.includes(node.id) && (
                                                    <CheckCircle2 className="h-4 w-4 text-amber-500" />
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Campaign Settings */}
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-base flex items-center gap-2">
                                    <Settings className="h-4 w-4 text-amber-500" />
                                    Campaign Settings
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* Basic Settings */}
                                <div className="space-y-4">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Behavior</h4>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Stop on Reply</p>
                                            <p className="text-xs text-zinc-600">Pause sequence when lead replies</p>
                                        </div>
                                        <Checkbox
                                            checked={options.stopOnReply}
                                            onCheckedChange={(checked) => setOptions({ ...options, stopOnReply: !!checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Prioritize New Leads</p>
                                            <p className="text-xs text-zinc-600">Send to new leads first</p>
                                        </div>
                                        <Checkbox
                                            checked={options.prioritizeNewLeads}
                                            onCheckedChange={(checked) => setOptions({ ...options, prioritizeNewLeads: !!checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Match Lead Timezone</p>
                                            <p className="text-xs text-zinc-600">Send based on lead&apos;s timezone</p>
                                        </div>
                                        <Checkbox
                                            checked={options.matchLeadTimezone}
                                            onCheckedChange={(checked) => setOptions({ ...options, matchLeadTimezone: !!checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Skip Weekends</p>
                                            <p className="text-xs text-zinc-600">Don&apos;t count weekends in delays</p>
                                        </div>
                                        <Checkbox
                                            checked={options.skipWeekends}
                                            onCheckedChange={(checked) => setOptions({ ...options, skipWeekends: !!checked })}
                                        />
                                    </div>
                                </div>

                                {/* Tracking Settings */}
                                <div className="space-y-4 pt-4 border-t border-zinc-800">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Tracking</h4>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Open Tracking</p>
                                            <p className="text-xs text-zinc-600">Track when emails are opened</p>
                                        </div>
                                        <Checkbox
                                            checked={options.openTracking}
                                            onCheckedChange={(checked) => setOptions({ ...options, openTracking: !!checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Link Tracking</p>
                                            <p className="text-xs text-zinc-600">Track link clicks in emails</p>
                                        </div>
                                        <Checkbox
                                            checked={options.linkTracking}
                                            onCheckedChange={(checked) => setOptions({ ...options, linkTracking: !!checked })}
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Send as Plain Text</p>
                                            <p className="text-xs text-zinc-600">Better deliverability, no formatting</p>
                                        </div>
                                        <Checkbox
                                            checked={options.sendAsText}
                                            onCheckedChange={(checked) => setOptions({ ...options, sendAsText: !!checked })}
                                        />
                                    </div>
                                </div>

                                {/* Limits */}
                                <div className="space-y-4 pt-4 border-t border-zinc-800">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Limits & Delays</h4>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Daily Email Limit</p>
                                            <p className="text-xs text-zinc-600">Max emails per account per day</p>
                                        </div>
                                        <Input
                                            type="number"
                                            value={options.dailyLimit}
                                            onChange={(e) => setOptions({ ...options, dailyLimit: parseInt(e.target.value) || 50 })}
                                            className="w-20 h-8 bg-zinc-950 border-zinc-800 text-center"
                                        />
                                    </div>

                                    <div className="flex items-center justify-between py-2">
                                        <div>
                                            <p className="text-sm font-medium">Randomize Delay</p>
                                            <p className="text-xs text-zinc-600">Add random variation to sequence delays</p>
                                        </div>
                                        <Checkbox
                                            checked={options.randomizeDelay}
                                            onCheckedChange={(checked) => setOptions({ ...options, randomizeDelay: !!checked })}
                                        />
                                    </div>

                                    {options.randomizeDelay && (
                                        <div className="flex items-center gap-3 py-2 pl-4 border-l-2 border-amber-500/30">
                                            <span className="text-xs text-zinc-600">Delay range:</span>
                                            <Input
                                                type="number"
                                                value={options.minDelay}
                                                onChange={(e) => setOptions({ ...options, minDelay: parseInt(e.target.value) || 1 })}
                                                className="w-16 h-7 text-xs bg-zinc-950 border-zinc-800 text-center"
                                            />
                                            <span className="text-xs text-zinc-600">to</span>
                                            <Input
                                                type="number"
                                                value={options.maxDelay}
                                                onChange={(e) => setOptions({ ...options, maxDelay: parseInt(e.target.value) || 7 })}
                                                className="w-16 h-7 text-xs bg-zinc-950 border-zinc-800 text-center"
                                            />
                                            <span className="text-xs text-zinc-600">days</span>
                                        </div>
                                    )}
                                </div>

                                {/* CC/BCC */}
                                <div className="space-y-4 pt-4 border-t border-zinc-800">
                                    <h4 className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Email Copies</h4>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-zinc-500">CC Email (optional)</Label>
                                        <Input
                                            value={options.ccEmail}
                                            onChange={(e) => setOptions({ ...options, ccEmail: e.target.value })}
                                            placeholder="cc@example.com"
                                            className="bg-zinc-950 border-zinc-800 text-sm"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <Label className="text-xs text-zinc-500">BCC Email (optional)</Label>
                                        <Input
                                            value={options.bccEmail}
                                            onChange={(e) => setOptions({ ...options, bccEmail: e.target.value })}
                                            placeholder="bcc@example.com"
                                            className="bg-zinc-950 border-zinc-800 text-sm"
                                        />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    )
}

export default function NewCampaignPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-zinc-500" />
            </div>
        }>
            <NewCampaignContent />
        </Suspense>
    )
}
