'use client'

import { useState, useEffect, use } from 'react'
import Link from 'next/link'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    Save,
    Loader2,
    Sparkles,
    Wand2,
    Info
} from 'lucide-react'
import { toast } from 'sonner'
import { getOrganizationDetails, updateOrganizationIcebreakerContext } from '@/server/actions/organizations'

export default function CustomerIcebreakerSettingsPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const [organization, setOrganization] = useState<any>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [isSaving, setIsSaving] = useState(false)

    // Form state
    const [context, setContext] = useState({
        description: '',
        industry_focus: '',
        services: '',
        experience: '',
        example_format: '{"icebreaker":"Hey {name}, \\n\\n really respect X and love that you\'re doing Y. Wanted to run something by you"}'
    })

    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true)
            try {
                const result = await getOrganizationDetails(id)
                if (result.success && result.organization) {
                    setOrganization(result.organization)
                    // Load existing context if available
                    if (result.organization.icebreaker_context) {
                        setContext({
                            description: result.organization.icebreaker_context.description || '',
                            industry_focus: result.organization.icebreaker_context.industry_focus || '',
                            services: result.organization.icebreaker_context.services || '',
                            experience: result.organization.icebreaker_context.experience || '',
                            example_format: result.organization.icebreaker_context.example_format || '{"icebreaker":"Hey {name}, \\n\\n really respect X and love that you\'re doing Y. Wanted to run something by you"}'
                        })
                    }
                }
            } catch (error) {
                toast.error('Failed to load organization')
            } finally {
                setIsLoading(false)
            }
        }
        fetchData()
    }, [id])

    const handleSave = async () => {
        setIsSaving(true)
        try {
            const result = await updateOrganizationIcebreakerContext(id, context)
            if (result.success) {
                toast.success('Icebreaker settings saved successfully!')
            } else {
                toast.error(result.error || 'Failed to save settings')
            }
        } catch (error) {
            toast.error('Failed to save settings')
        } finally {
            setIsSaving(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary" />
                <p className="text-zinc-500 font-medium">Loading settings...</p>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-10 max-w-3xl">
            {/* Header */}
            <div className="flex items-start gap-4">
                <Link href={`/operator/customers/${id}`}>
                    <Button variant="ghost" size="icon" className="mt-1">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div className="flex-1">
                    <h1 className="text-2xl font-bold text-white">Icebreaker Configuration</h1>
                    <p className="text-zinc-500 text-sm font-medium">
                        Configure how AI generates personalized icebreakers for {organization?.name}
                    </p>
                </div>
            </div>

            {/* Info Card */}
            <Card className="bg-primary/5 border-primary/20">
                <CardContent className="p-4 flex gap-3">
                    <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <div className="text-sm text-zinc-300">
                        <p className="font-bold text-primary mb-1">How this works:</p>
                        <p>
                            The AI uses this context to connect your customer's offering with each prospect.
                            For example, if your customer runs a content studio for AI companies, the icebreaker
                            might mention how they also work with AI businesses.
                        </p>
                    </div>
                </CardContent>
            </Card>

            {/* Configuration Form */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Wand2 className="h-5 w-5 text-primary" />
                        Customer Context
                    </CardTitle>
                    <CardDescription>
                        This information is used to personalize icebreakers so they relate your customer to each prospect.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Main Description */}
                    <div className="space-y-2">
                        <Label htmlFor="description" className="text-zinc-200">
                            Customer Description <span className="text-primary">*</span>
                        </Label>
                        <Textarea
                            id="description"
                            placeholder="I am the founder of a Creative studio that works with tech and AI companies to help them with promo and explainer videos. We also help them with social media content. Been in the content space for more than 7 years."
                            className="min-h-[120px] bg-zinc-900 border-zinc-800"
                            value={context.description}
                            onChange={(e) => setContext({ ...context, description: e.target.value })}
                        />
                        <p className="text-[10px] text-zinc-600">
                            Write as if you are the customer. This is injected into the AI prompt as "Here is information about me..."
                        </p>
                    </div>

                    {/* Industry Focus */}
                    <div className="space-y-2">
                        <Label htmlFor="industry_focus" className="text-zinc-200">
                            Industry Focus
                        </Label>
                        <Input
                            id="industry_focus"
                            placeholder="tech and AI companies"
                            className="bg-zinc-900 border-zinc-800"
                            value={context.industry_focus}
                            onChange={(e) => setContext({ ...context, industry_focus: e.target.value })}
                        />
                    </div>

                    {/* Services */}
                    <div className="space-y-2">
                        <Label htmlFor="services" className="text-zinc-200">
                            Services / Products
                        </Label>
                        <Input
                            id="services"
                            placeholder="promo videos, explainer videos, social media content"
                            className="bg-zinc-900 border-zinc-800"
                            value={context.services}
                            onChange={(e) => setContext({ ...context, services: e.target.value })}
                        />
                    </div>

                    {/* Experience */}
                    <div className="space-y-2">
                        <Label htmlFor="experience" className="text-zinc-200">
                            Experience / Credibility
                        </Label>
                        <Input
                            id="experience"
                            placeholder="7+ years in the content space"
                            className="bg-zinc-900 border-zinc-800"
                            value={context.experience}
                            onChange={(e) => setContext({ ...context, experience: e.target.value })}
                        />
                    </div>

                    {/* Example Format */}
                    <div className="space-y-2">
                        <Label htmlFor="example_format" className="text-zinc-200">
                            Desired JSON Brand/Format <span className="text-primary">*</span>
                        </Label>
                        <Textarea
                            id="example_format"
                            placeholder='{"icebreaker":"Hey {name}, \n\n really respect X and love that you’re doing Y. Wanted to run something by you"}'
                            className="min-h-[80px] bg-zinc-900 border-zinc-800 font-mono text-xs"
                            value={context.example_format}
                            onChange={(e) => setContext({ ...context, example_format: e.target.value })}
                        />
                        <p className="text-[10px] text-zinc-600">
                            The exact JSON structure the AI should return. Use this to control the "vibe" and structure of all icebreakers.
                        </p>
                    </div>

                    {/* Save Button */}
                    <div className="pt-4 border-t border-zinc-800">
                        <Button
                            onClick={handleSave}
                            disabled={isSaving || !context.description}
                            className="bg-primary hover:bg-primary/90"
                        >
                            {isSaving ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Save className="h-4 w-4 mr-2" />
                            )}
                            Save Icebreaker Settings
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Preview Card - Dynamic based on context */}
            <Card className="bg-zinc-950 border-zinc-800">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Prompt Preview
                    </CardTitle>
                    <CardDescription>
                        This shows what the AI will receive about your customer when generating icebreakers.
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    {/* Customer Context Preview */}
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">
                            Customer Context (Injected into AI Prompt)
                        </p>
                        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800">
                            {context.description ? (
                                <p className="text-sm text-zinc-300">
                                    <span className="text-primary">Here is information about me:</span><br /><br />
                                    "{context.description}"
                                </p>
                            ) : (
                                <p className="text-sm text-zinc-600 italic">
                                    No context configured yet. Fill in the "Customer Description" above.
                                </p>
                            )}
                        </div>
                    </div>

                    {/* Example Output */}
                    <div>
                        <p className="text-[10px] text-zinc-500 uppercase tracking-widest mb-2 font-bold">
                            Active Format Template
                        </p>
                        <div className="bg-zinc-900 p-4 rounded-lg border border-zinc-800 font-mono text-xs text-primary">
                            {context.example_format}
                        </div>
                        <p className="text-[10px] text-zinc-600 mt-2">
                            The AI will use this exact structure, replacing X and Y with personalized context from the prospect's data.
                        </p>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
