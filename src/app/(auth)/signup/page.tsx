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
    Shield,
    ArrowRight,
    Search
} from 'lucide-react'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import { createClient } from '@/lib/supabase/client'

type Step = 1 | 2 | 3 | 4 | 5

export default function SignupPage() {
    const router = useRouter()
    const supabase = createClient()
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
        // Validation for Step 1
        if (step === 1) {
            if (!formData.fullName.trim() || !formData.email.trim()) {
                toast.error('Identity required: Full Name and Email must be provided.')
                return
            }
            if (!formData.email.includes('@')) {
                toast.error('Invalid transmission address: Please check your email format.')
                return
            }
            if (formData.password.length < 6) {
                toast.error('Security protocol: Access Key must be at least 6 characters.')
                return
            }
        }
        if (step < 5) setStep(prev => (prev + 1) as Step)
    }

    const prevStep = () => {
        if (step > 1) setStep(prev => (prev - 1) as Step)
    }

    const [isEmailSent, setIsEmailSent] = useState(false)

    const onSubmit = async () => {
        // Final sanity check
        if (!formData.fullName.trim() || !formData.email.trim() || !formData.password.trim()) {
            toast.error('Authentication payload incomplete.')
            setStep(1)
            return
        }

        setIsLoading(true)
        try {
            const { data, error: signUpError } = await supabase.auth.signUp({
                email: formData.email,
                password: formData.password,
                options: {
                    data: {
                        full_name: formData.fullName,
                        company_name: formData.companyName,
                        website: formData.website,
                        industry: formData.industry,
                        team_size: formData.teamSize,
                        monthly_volume: formData.monthlyVolume,
                        primary_goal: formData.primaryGoal,
                    }
                }
            })

            if (signUpError) throw signUpError

            if (data.user && !data.session) {
                // Email confirmation is required
                setIsEmailSent(true)
                toast.success('Onboarding initialization sent to your email.')
                return
            }

            toast.success('System Provisioned. Welcome to MailSmith.')
            router.push('/dashboard')
        } catch (error: any) {
            // Enhanced error reporting for "load error" issues
            console.error('Signup Error:', error)
            toast.error(error.message || 'Transmission failed: A load error occurred during provisioning.')
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
                        {isEmailSent ? (
                            <>
                                <CardTitle className="text-2xl font-black text-zinc-100 italic uppercase tracking-tight text-center pt-8">Verify Transmission</CardTitle>
                                <CardDescription className="text-zinc-500 text-center">We've sent an encrypted initialization link to <span className="text-primary font-bold">{formData.email}</span>.</CardDescription>
                            </>
                        ) : (
                            <>
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
                            </>
                        )}
                    </CardHeader>

                    <CardContent className="min-h-[300px] flex flex-col justify-center py-6">
                        {isEmailSent ? (
                            <div className="space-y-8 py-8 animate-in zoom-in-95 duration-500">
                                <div className="flex justify-center">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-primary/20 rounded-full blur-2xl animate-pulse" />
                                        <div className="relative h-24 w-24 bg-zinc-950 border border-zinc-800 rounded-3xl flex items-center justify-center">
                                            <Mail className="h-10 w-10 text-primary animate-bounce" />
                                        </div>
                                    </div>
                                </div>
                                <div className="text-center space-y-4">
                                    <p className="text-sm text-zinc-400 max-w-sm mx-auto">
                                        Please click the link in the email to activate your account and initialize your administrative dashboard.
                                    </p>
                                    <div className="flex flex-col gap-2 max-w-xs mx-auto pt-4">
                                        <Button asChild className="bg-primary hover:bg-primary/90 text-primary-foreground font-black italic uppercase tracking-tighter">
                                            <Link href="/login">Return to Command Center</Link>
                                        </Button>
                                        <Button variant="ghost" className="text-zinc-500 text-xs uppercase tracking-widest font-bold" onClick={() => setIsEmailSent(false)}>
                                            Incorrect email? Try again
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <>
                                {step === 1 && (
                                    <div className="space-y-4 animate-in slide-in-from-right-4 duration-300">
                                        <div className="grid grid-cols-1 gap-4">
                                            <div className="space-y-2">
                                                <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Full Name</Label>
                                                <div className="relative">
                                                    <User className="absolute left-3 top-3 h-4 w-4 text-zinc-600" />
                                                    <Input
                                                        className="bg-zinc-950 border-zinc-800 pl-10 h-11 focus:ring-primary/20"
                                                        placeholder="e.g. Alexander Pierce"
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
                                                        placeholder="e.g. precision@node-alpha.io"
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
                                                        placeholder="••••••••••••"
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
                                                <Select value={formData.industry} onValueChange={(val) => updateField('industry', val)}>
                                                    <SelectTrigger className="bg-zinc-950 border-zinc-800 h-11 focus:ring-primary/20">
                                                        <SelectValue placeholder="Select Sector" />
                                                    </SelectTrigger>
                                                    <SelectContent className="bg-zinc-900 border-zinc-800 text-zinc-300">
                                                        <SelectItem value="tech">Technology & SaaS</SelectItem>
                                                        <SelectItem value="finance">Finance & Fintech</SelectItem>
                                                        <SelectItem value="healthcare">Healthcare & Life Sciences</SelectItem>
                                                        <SelectItem value="pro-services">Professional Services</SelectItem>
                                                        <SelectItem value="ecommerce">E-commerce & Retail</SelectItem>
                                                        <SelectItem value="manufacturing">Manufacturing</SelectItem>
                                                        <SelectItem value="media">Media & Entertainment</SelectItem>
                                                        <SelectItem value="real-estate">Real Estate</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {step === 3 && (
                                    <div className="space-y-6 animate-in slide-in-from-right-4 duration-300">
                                        <div className="space-y-4">
                                            <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Unit size (Team size)</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: '1-10', label: 'Solo / Small', desc: '1-10 operatives' },
                                                    { id: '11-50', label: 'Scaling', desc: '11-50 operatives' },
                                                    { id: '51-200', label: 'Enterprise', desc: '51-200 operatives' },
                                                    { id: '200+', label: 'Global', desc: '200+ operatives' },
                                                ].map(size => (
                                                    <div
                                                        key={size.id}
                                                        className={cn(
                                                            "p-3 rounded-xl border transition-all cursor-pointer text-left group",
                                                            formData.teamSize === size.id ? "bg-primary/10 border-primary shadow-lg shadow-primary/5" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                                                        )}
                                                        onClick={() => updateField('teamSize', size.id)}
                                                    >
                                                        <p className={cn(
                                                            "text-sm font-black uppercase italic tracking-tighter",
                                                            formData.teamSize === size.id ? "text-primary" : "text-zinc-300"
                                                        )}>{size.label}</p>
                                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{size.desc}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        <div className="space-y-4">
                                            <Label className="text-zinc-400 text-xs uppercase tracking-widest font-bold">Target Engagement Volume</Label>
                                            <div className="grid grid-cols-2 gap-3">
                                                {[
                                                    { id: '< 500', label: 'Precision', desc: '< 500 leads/mo' },
                                                    { id: '500-2k', label: 'Growth', desc: '500-2,000/mo' },
                                                    { id: '2k-5k', label: 'Scale', desc: '2,000-5,000/mo' },
                                                    { id: '10k+', label: 'Dominance', desc: '10k+ leads/mo' },
                                                ].map(vol => (
                                                    <div
                                                        key={vol.id}
                                                        className={cn(
                                                            "p-3 rounded-xl border transition-all cursor-pointer text-left group",
                                                            formData.monthlyVolume === vol.id ? "bg-emerald-500/10 border-emerald-500 shadow-lg shadow-emerald-500/5" : "bg-zinc-950 border-zinc-800 hover:border-zinc-700"
                                                        )}
                                                        onClick={() => updateField('monthlyVolume', vol.id)}
                                                    >
                                                        <p className={cn(
                                                            "text-sm font-black uppercase italic tracking-tighter",
                                                            formData.monthlyVolume === vol.id ? "text-emerald-500" : "text-zinc-300"
                                                        )}>{vol.label}</p>
                                                        <p className="text-[10px] text-zinc-600 uppercase tracking-widest">{vol.desc}</p>
                                                    </div>
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
                            </>
                        )}
                    </CardContent>

                    {!isEmailSent && (
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
                                            Signing up...
                                        </>
                                    ) : (
                                        <>
                                            Sign Up
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </>
                                    )}
                                </Button>
                            )}
                        </CardFooter>
                    )}
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
