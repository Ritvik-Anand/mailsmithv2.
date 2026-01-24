import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import {
    ArrowRight,
    Mail,
    Users,
    Sparkles,
    CheckCircle2,
    Shield,
    Target,
    Rocket,
    BarChart3,
    Calendar,
    MessageSquare,
    Zap,
    Clock,
    Globe,
    Database,
    Bot,
    TrendingUp,
    ArrowLeft,
} from 'lucide-react'
import * as motion from "framer-motion/client"

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30">
            {/* Ambient effects */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
            </div>

            {/* Header */}
            <header className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl">
                <div className="container flex h-20 items-center justify-between">
                    <Link href="/" className="flex items-center gap-3 group">
                        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-primary to-primary/60 p-0.5 shadow-lg shadow-primary/20 transition-transform group-hover:scale-110">
                            <div className="flex h-full w-full items-center justify-center rounded-[9px] bg-black/20 backdrop-blur-sm">
                                <Image
                                    src="/logo.png"
                                    alt="MailSmith Logo"
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                />
                            </div>
                        </div>
                        <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">MailSmith</span>
                    </Link>
                    <div className="flex items-center gap-6">
                        <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
                            Client Login
                        </Link>
                        <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
                            <Link href="/request-demo">Request Demo</Link>
                        </Button>
                    </div>
                </div>
            </header>

            {/* Hero */}
            <section className="relative pt-24 pb-16 overflow-hidden">
                <div className="container">
                    <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                        Back to Home
                    </Link>

                    <div className="max-w-3xl space-y-6">
                        <h1 className="text-5xl md:text-6xl font-bold tracking-tight">
                            How MailSmith Works
                        </h1>
                        <p className="text-xl text-white/50 leading-relaxed">
                            MailSmith is a fully-managed cold email service. We handle everything—from
                            finding leads to booking meetings—so you can focus on closing deals.
                        </p>
                    </div>
                </div>
            </section>

            {/* The Process */}
            <section className="relative py-24 border-t border-white/5">
                <div className="container">
                    <h2 className="text-3xl font-bold mb-16">The Process</h2>

                    <div className="space-y-24">
                        {/* Step 1 */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold">1</span>
                                    <span className="text-primary font-medium">DISCOVERY</span>
                                </div>
                                <h3 className="text-3xl font-bold">We Learn Your Business</h3>
                                <p className="text-white/50 leading-relaxed text-lg">
                                    It starts with a discovery call. We learn about your ideal customer profile,
                                    value proposition, and what makes your solution unique. This helps us craft
                                    messages that resonate.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Define your ICP (Ideal Customer Profile)</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Understand your unique selling points</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Align on goals and success metrics</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white/[0.03] rounded-xl p-4 flex flex-col items-center text-center">
                                        <Target className="h-8 w-8 text-primary mb-3" />
                                        <span className="text-sm font-medium">ICP Definition</span>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-4 flex flex-col items-center text-center">
                                        <MessageSquare className="h-8 w-8 text-primary mb-3" />
                                        <span className="text-sm font-medium">Messaging Strategy</span>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-4 flex flex-col items-center text-center">
                                        <TrendingUp className="h-8 w-8 text-primary mb-3" />
                                        <span className="text-sm font-medium">Goal Setting</span>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-4 flex flex-col items-center text-center">
                                        <Calendar className="h-8 w-8 text-primary mb-3" />
                                        <span className="text-sm font-medium">Timeline Planning</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Step 2 */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-4 bg-white/[0.03] rounded-xl p-4">
                                        <Globe className="h-6 w-6 text-primary shrink-0" />
                                        <div>
                                            <p className="font-medium">LinkedIn Sales Navigator</p>
                                            <p className="text-xs text-white/40">Primary lead source</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/[0.03] rounded-xl p-4">
                                        <Database className="h-6 w-6 text-primary shrink-0" />
                                        <div>
                                            <p className="font-medium">Apollo.io Database</p>
                                            <p className="text-xs text-white/40">Contact enrichment</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4 bg-white/[0.03] rounded-xl p-4">
                                        <Shield className="h-6 w-6 text-green-500 shrink-0" />
                                        <div>
                                            <p className="font-medium">Email Verification</p>
                                            <p className="text-xs text-white/40">99%+ deliverability</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 space-y-6">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold">2</span>
                                    <span className="text-primary font-medium">LEAD SOURCING</span>
                                </div>
                                <h3 className="text-3xl font-bold">We Find Your Perfect Prospects</h3>
                                <p className="text-white/50 leading-relaxed text-lg">
                                    Our team sources leads from LinkedIn, Apollo, and proprietary databases.
                                    Every email is verified to ensure high deliverability and protect your domain reputation.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Multi-source lead generation</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Triple email verification</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Enriched with company data</span>
                                    </li>
                                </ul>
                            </div>
                        </div>

                        {/* Step 3 */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="space-y-6">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold">3</span>
                                    <span className="text-primary font-medium">PERSONALIZATION</span>
                                </div>
                                <h3 className="text-3xl font-bold">AI Writes Your Icebreakers</h3>
                                <p className="text-white/50 leading-relaxed text-lg">
                                    For each lead, our AI analyzes their LinkedIn, company news, and recent activity
                                    to craft a unique opening line. No templates. Every email feels personally written.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">References specific achievements</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Mentions relevant company news</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Human-reviewed for quality</span>
                                    </li>
                                </ul>
                            </div>
                            <div className="bg-white/[0.02] border border-white/10 rounded-3xl p-8">
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3 mb-6">
                                        <Bot className="h-6 w-6 text-primary" />
                                        <span className="font-medium">AI-Generated Icebreaker</span>
                                    </div>
                                    <div className="bg-white/[0.03] rounded-xl p-5 border border-primary/20">
                                        <p className="text-white/80 leading-relaxed italic">
                                            "Saw your recent post on scaling B2B sales teams—the point about
                                            hiring for curiosity over experience really resonated. We're helping
                                            companies like DataCorp automate their outreach while keeping that
                                            personal touch..."
                                        </p>
                                    </div>
                                    <p className="text-xs text-white/40 text-center">
                                        Example of a personalized icebreaker
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Step 4 */}
                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div className="order-2 md:order-1 bg-white/[0.02] border border-white/10 rounded-3xl p-8">
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm text-white/50">Campaign Performance</span>
                                        <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">Live</span>
                                    </div>
                                    <div className="grid grid-cols-3 gap-4 text-center">
                                        <div>
                                            <p className="text-3xl font-bold text-primary">47%</p>
                                            <p className="text-xs text-white/40">Open Rate</p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-green-400">12%</p>
                                            <p className="text-xs text-white/40">Reply Rate</p>
                                        </div>
                                        <div>
                                            <p className="text-3xl font-bold text-amber-400">8</p>
                                            <p className="text-xs text-white/40">Meetings</p>
                                        </div>
                                    </div>
                                    <div className="h-2 bg-white/5 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-primary to-green-500 w-[65%] rounded-full" />
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 space-y-6">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-lg font-bold">4</span>
                                    <span className="text-primary font-medium">EXECUTION</span>
                                </div>
                                <h3 className="text-3xl font-bold">We Run & Optimize Campaigns</h3>
                                <p className="text-white/50 leading-relaxed text-lg">
                                    We handle domain setup, inbox warming, and deliverability. Campaigns run on
                                    autopilot with automated follow-ups. You track everything in your real-time dashboard.
                                </p>
                                <ul className="space-y-3">
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Domain warming included</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Multi-step sequences</span>
                                    </li>
                                    <li className="flex items-start gap-3">
                                        <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5 shrink-0" />
                                        <span className="text-white/70">Real-time analytics dashboard</span>
                                    </li>
                                </ul>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="relative py-24 border-t border-white/5 bg-white/[0.01]">
                <div className="container">
                    <div className="text-center mb-16 space-y-4">
                        <h2 className="text-3xl md:text-4xl font-bold">Your Timeline to Results</h2>
                        <p className="text-white/50 max-w-xl mx-auto">
                            From kickoff to qualified meetings in just 2 weeks
                        </p>
                    </div>

                    <div className="grid md:grid-cols-4 gap-6">
                        {[
                            { week: 'Week 1', title: 'Setup', desc: 'Discovery, ICP definition, domain setup, inbox warming begins' },
                            { week: 'Week 2', title: 'Launch', desc: 'Lead sourcing, AI personalization, first emails sent' },
                            { week: 'Week 3', title: 'Optimize', desc: 'Analyze performance, A/B test messaging, scale volume' },
                            { week: 'Ongoing', title: 'Scale', desc: 'Continuous optimization, weekly reports, grow pipeline' },
                        ].map((item, i) => (
                            <div key={i} className="relative">
                                <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 h-full hover:border-primary/20 transition-colors">
                                    <div className="text-primary text-sm font-medium mb-2">{item.week}</div>
                                    <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                                    <p className="text-white/50 text-sm">{item.desc}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-24">
                <div className="container">
                    <div className="relative overflow-hidden rounded-[40px] bg-primary p-12 md:p-20 text-center">
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600" />
                        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-white/20 rounded-full blur-[100px] -mr-48 -mt-48" />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-6">
                            <h2 className="text-3xl md:text-5xl font-bold text-white tracking-tight">
                                Ready to get started?
                            </h2>
                            <p className="text-lg text-white/80">
                                Book a demo to see how MailSmith can fill your pipeline with qualified meetings.
                            </p>
                            <Button size="lg" variant="secondary" asChild className="h-14 px-10 rounded-full text-lg font-bold bg-white text-primary hover:bg-white/90 shadow-2xl">
                                <Link href="/request-demo">
                                    Book Your Demo
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Link>
                            </Button>
                        </div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-12 bg-black">
                <div className="container">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                        <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary overflow-hidden">
                                <Image
                                    src="/logo.png"
                                    alt="MailSmith Logo"
                                    width={24}
                                    height={24}
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-bold text-xl tracking-tight">MailSmith</span>
                        </div>
                        <div className="flex items-center gap-8 text-sm text-white/50">
                            <Link href="/" className="hover:text-white transition-colors">Home</Link>
                            <Link href="/request-demo" className="hover:text-white transition-colors">Request Demo</Link>
                            <Link href="/login" className="hover:text-white transition-colors">Client Login</Link>
                        </div>
                        <p className="text-sm text-white/30">
                            © 2026 MailSmith. All rights reserved.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
