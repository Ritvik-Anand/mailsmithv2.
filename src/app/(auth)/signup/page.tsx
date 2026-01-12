'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import {
    Zap,
    Loader2,
    Mail,
    Lock,
    User,
    Briefcase,
    Globe,
    Users,
    Target,
    CheckCircle2,
    ChevronRight,
    ChevronLeft,
    Building2,
    Shield
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

type Step = 1 | 2 | 3 | 4 | 5

export default function SignupPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>(1)
    const [isLoading, setIsLoading] = useState(false)

    // Form State
    const [formData, setFormData] = useState({
        // Step 1: Account
        fullName: '',
        email: '',
        password: '',
        // Step 2: Org
        companyName: '',
        website: '',
        industry: '',
        // Step 3: Scale
        teamSize: '',
        monthlyVolume: '',
        // Step 4: Mission
        primaryGoal: '',
        referralSource: ''
    })

    const updateField = (field: string, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }))
    }

    const nextStep = () => {
        if (step < 5) setStep(prev => (prev + 1) as Step)
    }

    const prevStep = () => {
        if (step > 1) setStep(prev => (prev - 1) as Step)
    }

    const onSubmit = async () => {
        setIsLoading(true)
        try {
            // Simulate account provisioning
            await new Promise(resolve => setTimeout(resolve, 2000))
            toast.success('System Provisioned. Welcome to MailSmith.')
            router.push('/dashboard')
        } catch (error) {
            toast.error('Provisioning failed. Please check network.')
        } finally {
            setIsLoading(false)
        }
    }

    const progressValue = (step / 5) * 100

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4 relative overflow-hidden">
            {/* Command Center Ambient Effects */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[120px] animate-pulse" />
                <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] bg-emerald-500/5 rounded-full blur-[120px]" />
                <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-50" />
            </div>

            <div className="w-full max-w-2xl relative">
                {/* Progress Header */}
                <div className="mb-8 space-y-4">
                    <div className="flex items-center justify-between px-2">
                        <div className="flex items-center gap-2">
                            <div className="bg-primary p-1.5 rounded-lg shadow-lg shadow-primary/20">
                                <Zap className="h-4 w-4 text-primary-foreground" />
                            </div>
                            <span className="font-black tracking-tighter text-zinc-100 uppercase italic">Onboarding Sequence</span>
                        </div>
                        <span className="text-[10px] font-mono text-zinc-500 uppercase tracking-widest">Step {step} of 5</span>
                    </div>
                    <Progress value={progressValue} className="h-1 bg-zinc-900" />
                </div>

                <Card className="bg-zinc-900/50 border-zinc-800/50 backdrop-blur-xl shadow-2xl relative overflow-hidden">
                    {/* Visual Flairs */}
                    <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
                        <Shield className="h-24 w-24 text-primary" />
                    </div>

                    <CardHeader>
                        {step === 1 && (
                            <>
                                <CardTitle className="text-2xl font-black text-zinc-100 italic uppercase tracking-tight">Identity Authentication</CardTitle>
                                <CardDescription className="text-zinc-500">Initialize your administrative access to the platform.</CardDescription>
                            </>
                        )}
                        {step === 2 && (
                            <>
                                <CardTitle className="text-2xl font-black text-zinc-100 italic uppercase tracking-tight">Organization Profile</CardTitle>
                                <CardDescription className="text-zinc-500">Connect your company infrastructure to the MailSmith network.</CardDescription>
                            </>
                        )}
                        {step === 3 && (
                            <>
                                <CardTitle className="text-2xl font-black text-zinc-100 italic uppercase tracking-tight">Operational Scale</CardTitle>
                                <CardDescription className="text-zinc-500">Define your resource requirements and engagement throughput.</CardDescription>
                            </>
                        )}
                        {step === 4 && (
                            <>
                                <CardTitle className="text-2xl font-black text-zinc-100 italic uppercase tracking-tight">Mission Objectives</CardTitle>
                                <CardDescription className="text-zinc-500">What are the primary targets for your outreach campaigns?</CardDescription>
                            </>
                        )}
                        {step === 5 && (
                            <>
                                <CardTitle className="text-2xl font-black text-zinc-100 italic uppercase tracking-tight">Deployment Ready</CardTitle>
                                <CardDescription className="text-zinc-500">Review your configuration before initializing the dashboard.</CardDescription>
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="min-h-[300px] flex flex-col justify-center py-6">
                        {step === 1 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <div className="grid grid-cols-1 gap-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Full Combatant Name</Label>
                                        <div className="relative">
                                            <User className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                            <Input
                                                className="bg-zinc-950 border-zinc-800 pl-10 h-11 focus:ring-primary/20"
                                                placeholder="Ritvik Anand"
                                                value={formData.fullName}
                                                onChange={(e) => updateField('fullName', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Secure Email Address</Label>
                                        <div className="relative">
                                            <Mail className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                            <Input
                                                className="bg-zinc-950 border-zinc-800 pl-10 h-11 focus:ring-primary/20"
                                                placeholder="ritvik@acquifix.com"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => updateField('email', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Access Key (Password)</Label>
                                        <div className="relative">
                                            <Lock className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                            <Input
                                                className="bg-zinc-950 border-zinc-800 pl-10 h-11 focus:ring-primary/20"
                                                type="password"
                                                placeholder="••••••••"
                                                value={formData.password}
                                                onChange={(e) => updateField('password', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 2 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300 transition-all">
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Company Designation</Label>
                                        <div className="relative">
                                            <Building2 className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                            <Input
                                                className="bg-zinc-950 border-zinc-800 pl-10 h-11 focus:ring-primary/20"
                                                placeholder="Acquifix Systems"
                                                value={formData.companyName}
                                                onChange={(e) => updateField('companyName', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Corporate Website</Label>
                                        <div className="relative">
                                            <Globe className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                            <Input
                                                className="bg-zinc-950 border-zinc-800 pl-10 h-11 focus:ring-primary/20"
                                                placeholder="https://acquifix.com"
                                                value={formData.website}
                                                onChange={(e) => updateField('website', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Industry Sector</Label>
                                        <div className="relative">
                                            <Briefcase className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                            <Input
                                                className="bg-zinc-950 border-zinc-800 pl-10 h-11 focus:ring-primary/20"
                                                placeholder="SaaS / Fintech / Marketing"
                                                value={formData.industry}
                                                onChange={(e) => updateField('industry', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                <div className="space-y-3">
                                    <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Unit size (Team size)</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['1-10', '11-50', '51-200', '200+'].map(size => (
                                            <Button
                                                key={size}
                                                variant="outline"
                                                className={cn(
                                                    "border-zinc-800 hover:bg-zinc-800 text-xs h-10 transition-all font-bold tracking-tighter",
                                                    formData.teamSize === size && "bg-primary/20 border-primary text-primary"
                                                )}
                                                onClick={() => updateField('teamSize', size)}
                                            >
                                                {size}
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                                <div className="space-y-3">
                                    <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Target Engagement Volume (Monthly)</Label>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                        {['< 500', '500-2k', '2k-5k', '10k+'].map(vol => (
                                            <Button
                                                key={vol}
                                                variant="outline"
                                                className={cn(
                                                    "border-zinc-800 hover:bg-zinc-800 text-xs h-10 transition-all font-bold tracking-tighter",
                                                    formData.monthlyVolume === vol && "bg-primary/20 border-primary text-primary"
                                                )}
                                                onClick={() => updateField('monthlyVolume', vol)}
                                            >
                                                {vol} Leads
                                            </Button>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Mission Directive</Label>
                                <div className="space-y-3">
                                    {[
                                        { id: 'leads', icon: Target, title: 'Lead Generation', desc: 'Secure high-quality sales opportunities and revenue flow.' },
                                        { id: 'hiring', icon: Users, title: 'Talent Acquisition', desc: 'Recruit elite performers for your organization.' },
                                        { id: 'seo', icon: Globe, title: 'Digital PR & SEO', desc: 'Boost authority through personalized backlink outreach.' },
                                        { id: 'custom', icon: Zap, title: 'Custom Protocols', desc: 'Generalized high-scale engagement for various use cases.' },
                                    ].map(goal => (
                                        <div
                                            key={goal.id}
                                            className={cn(
                                                "flex items-center gap-4 p-4 rounded-xl border transition-all cursor-pointer group",
                                                formData.primaryGoal === goal.id ? "bg-primary/10 border-primary shadow-[0_0_15px_rgba(var(--primary-rgb),0.1)]" : "bg-zinc-950/50 border-zinc-800 hover:border-zinc-700"
                                            )}
                                            onClick={() => updateField('primaryGoal', goal.id)}
                                        >
                                            <div className={cn(
                                                "p-2 rounded-lg border",
                                                formData.primaryGoal === goal.id ? "bg-primary border-primary/20 text-primary-foreground" : "bg-zinc-900 border-zinc-800 text-zinc-500 group-hover:text-zinc-300"
                                            )}>
                                                <goal.icon className="h-5 w-5" />
                                            </div>
                                            <div className="flex-1">
                                                <p className={cn(
                                                    "text-sm font-black italic uppercase tracking-tight transition-colors",
                                                    formData.primaryGoal === goal.id ? "text-primary" : "text-zinc-300"
                                                )}>{goal.title}</p>
                                                <p className="text-[10px] text-zinc-600 group-hover:text-zinc-500 transition-colors uppercase tracking-widest">{goal.desc}</p>
                                            </div>
                                            <CheckCircle2 className={cn(
                                                "h-5 w-5 transition-all opacity-0",
                                                formData.primaryGoal === goal.id && "opacity-100 text-primary"
                                            )} />
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}

                        {step === 5 && (
                            <div className="space-y-6 animate-in zoom-in-95 duration-300">
                                <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4">
                                        <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-6">
                                        <div className="space-y-1">
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Lead Administrator</p>
                                            <p className="text-sm font-bold text-zinc-200">{formData.fullName || 'Ritvik Anand'}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono italic">{formData.email || 'ritvik@acquifix.com'}</p>
                                        </div>
                                        <div className="space-y-1 text-right">
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Organization</p>
                                            <p className="text-sm font-bold text-zinc-200 uppercase italic tracking-tighter">{formData.companyName || 'ACQUIFIX SYSTEMS'}</p>
                                            <p className="text-[10px] text-zinc-500 font-mono tracking-widest capitalize">{formData.industry || 'Tech / Infrastructure'}</p>
                                        </div>
                                    </div>

                                    <div className="h-px bg-zinc-900" />

                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="p-2 rounded-full bg-primary/20 border border-primary/30">
                                                <Target className="h-5 w-5 text-primary" />
                                            </div>
                                            <div>
                                                <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Primary Directive</p>
                                                <p className="text-sm font-black text-primary italic uppercase">{formData.primaryGoal ? formData.primaryGoal.replace('_', ' ') : 'LEAD GENERATION'}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-[10px] text-zinc-600 uppercase tracking-widest font-black">Capacity</p>
                                            <p className="text-sm font-bold text-zinc-300">{formData.monthlyVolume || '5,000+'} Monthly Leads</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-4 rounded-xl bg-primary/5 border border-primary/10">
                                    <Shield className="h-5 w-5 text-primary shrink-0" />
                                    <p className="text-[10px] text-zinc-500 leading-relaxed italic uppercase tracking-widest">
                                        By initializing deployment, you agree to the platform security protocols and outreach ethics guidelines. System access is granted upon authentication.
                                    </p>
                                </div>
                            </div>
                        )}
                    </CardContent>

                    <CardFooter className="flex items-center justify-between border-t border-zinc-800 pt-6">
                        <Button
                            variant="ghost"
                            className="text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800 font-black italic uppercase tracking-tighter text-xs"
                            onClick={prevStep}
                            disabled={step === 1 || isLoading}
                        >
                            <ChevronLeft className="mr-2 h-4 w-4" />
                            Return
                        </Button>

                        {step < 5 ? (
                            <Button
                                className="bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase tracking-tighter px-8 h-12 shadow-lg shadow-primary/20"
                                onClick={nextStep}
                            >
                                Advance
                                <ChevronRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                className="bg-emerald-500 hover:bg-emerald-600 text-white font-black italic uppercase tracking-tighter px-8 h-12 shadow-lg shadow-emerald-500/20"
                                onClick={onSubmit}
                                disabled={isLoading}
                            >
                                {isLoading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Provisioning...
                                    </>
                                ) : (
                                    <>
                                        Initialize Deployment
                                        <ArrowRight className="ml-2 h-4 w-4" />
                                    </>
                                )}
                            </Button>
                        )}
                    </CardFooter>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-8 text-[10px] text-zinc-600 font-mono tracking-widest uppercase italic">
                    <span className="flex items-center gap-1.5"><Shield className="h-3 w-3" /> End-to-End Encryption</span>
                    <span className="flex items-center gap-1.5"><Zap className="h-3 w-3" /> Global Node Proxy</span>
                    <span className="flex items-center gap-1.5"><CheckCircle2 className="h-3 w-3" /> SOC2 Compliant</span>
                </div>
            </div>
        </div>
    )
}
