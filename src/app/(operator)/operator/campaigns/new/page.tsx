'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue
} from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import {
    Mail,
    Rocket,
    Layout,
    CheckCircle2,
    ChevronRight,
    Loader2,
    Users,
    Activity
} from 'lucide-react'
import { getOrganizations } from '@/server/actions/organizations'
import { getOrganizationNodes, launchCampaign } from '@/server/actions/instantly'
import { toast } from 'sonner'

export default function NewCampaignPage() {
    const router = useRouter()
    const [organizations, setOrganizations] = useState<any[]>([])
    const [selectedOrgId, setSelectedOrgId] = useState<string>('')
    const [orgNodes, setOrgNodes] = useState<any[]>([])
    const [selectedNodeIds, setSelectedNodeIds] = useState<string[]>([])
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [step, setStep] = useState(1)

    // Form states
    const [campaignName, setCampaignName] = useState('')
    const [subject, setSubject] = useState('')
    const [body, setBody] = useState('')

    useEffect(() => {
        async function loadOrgs() {
            const orgs = await getOrganizations()
            setOrganizations(orgs)
        }
        loadOrgs()
    }, [])

    useEffect(() => {
        async function loadNodes() {
            if (selectedOrgId) {
                const nodes = await getOrganizationNodes(selectedOrgId)
                setOrgNodes(nodes)
                // Auto-select all nodes by default for convenience
                setSelectedNodeIds(nodes.map(n => n.id))
            } else {
                setOrgNodes([])
                setSelectedNodeIds([])
            }
        }
        loadNodes()
    }, [selectedOrgId])

    const toggleNode = (id: string) => {
        setSelectedNodeIds(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        )
    }

    const handleLaunch = async (startImmediately: boolean = false) => {
        if (!selectedOrgId || !campaignName || !subject || !body || selectedNodeIds.length === 0) {
            toast.error('Please fill in all fields and select at least one outreach node.')
            return
        }

        setIsSubmitting(true)
        try {
            const result = await launchCampaign({
                organizationId: selectedOrgId,
                name: campaignName,
                subject,
                body,
                outreachNodeIds: selectedNodeIds,
                startImmediately
            })

            if (result.success) {
                toast.success(`Campaign "${campaignName}" ${startImmediately ? 'launched' : 'created'} successfully!`)
                router.push('/operator/campaigns')
            } else {
                toast.error(result.error || 'Failed to launch campaign')
            }
        } catch (error) {
            toast.error('An unexpected error occurred')
        } finally {
            setIsSubmitting(false)
        }
    }

    return (
        <div className="max-w-4xl mx-auto space-y-8 pb-20">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Campaign Launcher</h1>
                    <p className="text-muted-foreground">Setup and blast a new outreach campaign via Instantly.</p>
                </div>
            </div>

            {/* Stepper */}
            <div className="flex items-center gap-4 text-sm font-medium">
                <div className={`flex items-center gap-2 ${step >= 1 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${step >= 1 ? 'bg-primary border-primary text-white' : 'border-current'}`}>1</div>
                    Target Client
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 ${step >= 2 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${step >= 2 ? 'bg-primary border-primary text-white' : 'border-current'}`}>2</div>
                    Creative & Assets
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                <div className={`flex items-center gap-2 ${step >= 3 ? 'text-primary' : 'text-muted-foreground'}`}>
                    <div className={`flex h-6 w-6 items-center justify-center rounded-full border ${step >= 3 ? 'bg-primary border-primary text-white' : 'border-current'}`}>3</div>
                    Configuration
                </div>
            </div>

            {/* Step Content */}
            {step === 1 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Select Target Customer</CardTitle>
                        <CardDescription>Choose which customer organization this campaign belongs to.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label>Customer Organization</Label>
                            <Select value={selectedOrgId} onValueChange={setSelectedOrgId}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select an organization" />
                                </SelectTrigger>
                                <SelectContent>
                                    {organizations.map(org => (
                                        <SelectItem key={org.id} value={org.id}>{org.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {selectedOrgId && (
                            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg flex items-center gap-3">
                                <Users className="h-5 w-5 text-green-500" />
                                <div>
                                    <p className="text-sm font-medium">Context Active: {organizations.find(o => o.id === selectedOrgId)?.name}</p>
                                    <p className="text-xs text-muted-foreground">Infrastructure nodes for this client will be loaded in the next step.</p>
                                </div>
                            </div>
                        )}

                        <div className="flex justify-end">
                            <Button disabled={!selectedOrgId} onClick={() => setStep(2)}>
                                Next Step
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 2 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Creative & Assets</CardTitle>
                        <CardDescription>Define the outreach sequence and campaign metadata.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-2">
                            <Label htmlFor="name">Internal Campaign Name</Label>
                            <Input
                                id="name"
                                placeholder="e.g. Q1 SaaS Founders Cold Outreach"
                                value={campaignName}
                                onChange={(e) => setCampaignName(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject">Email Subject</Label>
                            <Input
                                id="subject"
                                placeholder="Quick question regarding {{companyName}}"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="body">Email Body (First Step)</Label>
                            <Textarea
                                id="body"
                                placeholder="Hi {{firstName}}, I saw your work at {{companyName}}..."
                                className="min-h-[200px]"
                                value={body}
                                onChange={(e) => setBody(e.target.value)}
                            />
                            <p className="text-[10px] text-muted-foreground">Variables allowed: {"{{firstName}}, {{companyName}}, {{industry}}, {{jobTitle}}"}</p>
                        </div>

                        <div className="flex justify-between">
                            <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
                            <Button disabled={!campaignName || !subject || !body} onClick={() => setStep(3)}>
                                Next Step
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {step === 3 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Configuration & Launch</CardTitle>
                        <CardDescription>Select the outreach nodes and finalize settings.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <Label className="text-base">Outreach Nodes (Active Senders)</Label>
                                <Badge variant="secondary">{selectedNodeIds.length} Selected</Badge>
                            </div>

                            {orgNodes.length === 0 ? (
                                <div className="p-8 text-center border-2 border-dashed rounded-lg">
                                    <AlertCircle className="h-8 w-8 text-amber-500 mx-auto mb-2" />
                                    <p className="text-sm font-medium">No outreach nodes assigned to this client.</p>
                                    <p className="text-xs text-muted-foreground mt-1">Assign nodes in the Admin Console first.</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                    {orgNodes.map(node => (
                                        <div
                                            key={node.id}
                                            onClick={() => toggleNode(node.id)}
                                            className={`p-3 rounded-lg border cursor-pointer transition-all flex items-center justify-between ${selectedNodeIds.includes(node.id)
                                                    ? 'border-primary bg-primary/5'
                                                    : 'border-zinc-800 hover:border-zinc-700'
                                                }`}
                                        >
                                            <div className="flex items-center gap-3">
                                                <div className={`h-2 w-2 rounded-full ${node.status === 'active' ? 'bg-green-500' : 'bg-red-500'}`} />
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-white">{node.email_address}</span>
                                                    <span className="text-[10px] text-zinc-500">Reputation: {node.reputation_score}%</span>
                                                </div>
                                            </div>
                                            {selectedNodeIds.includes(node.id) && (
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="p-4 rounded-lg bg-zinc-900/50 border border-zinc-800 space-y-3">
                            <h4 className="text-sm font-bold flex items-center gap-2">
                                <Activity className="h-4 w-4 text-primary" />
                                Pre-flight Check
                            </h4>
                            <div className="grid grid-cols-2 gap-4 text-xs">
                                <div>
                                    <span className="text-zinc-500">Campaign:</span>
                                    <p className="font-semibold text-white">{campaignName}</p>
                                </div>
                                <div>
                                    <span className="text-zinc-500">Outreach Nodes:</span>
                                    <p className="font-semibold text-white">{selectedNodeIds.length} active nodes</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-between gap-4 pt-4">
                            <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    disabled={isSubmitting || selectedNodeIds.length === 0}
                                    onClick={() => handleLaunch(false)}
                                >
                                    Save as Draft
                                </Button>
                                <Button
                                    className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold"
                                    disabled={isSubmitting || selectedNodeIds.length === 0}
                                    onClick={() => handleLaunch(true)}
                                >
                                    {isSubmitting ? (
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    ) : (
                                        <Rocket className="mr-2 h-4 w-4" />
                                    )}
                                    Launch Instantly
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}

function AlertCircle(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="8" x2="12" y2="12" />
            <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
    )
}
