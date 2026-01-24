'use client'

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

const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "-100px" },
    transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
}

const staggerContainer = {
    animate: {
        transition: {
            staggerChildren: 0.1
        }
    }
}

export default function HowItWorksPage() {
    return (
        <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 overflow-x-hidden">
            {/* Ambient effects - CopperX style */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full h-[800px] mesh-gradient opacity-40" />
                <div className="absolute inset-0 bg-wavy-pattern opacity-[0.02] mix-blend-overlay" />
            </div>

            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="relative z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl"
            >
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
                        <Link href="/login" className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors group">
                            <span className="relative z-10">Client Login</span>
                            <span className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-premium" />
                        </Link>
                        <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all hover:-translate-y-0.5 active:scale-95">
                            <Link href="/request-demo">Request Demo</Link>
                        </Button>
                    </div>
                </div>
            </motion.header>

            {/* Hero */}
            <section className="relative pt-24 pb-16 overflow-hidden">
                <div className="container">
                    <motion.div
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.5 }}
                    >
                        <Link href="/" className="inline-flex items-center gap-2 text-sm text-white/50 hover:text-white mb-8 transition-colors group">
                            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-1" />
                            Back to Home
                        </Link>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="max-w-3xl space-y-6"
                    >
                        <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
                            How MailSmith Works
                        </h1>
                        <p className="text-xl md:text-2xl text-white/50 leading-relaxed font-medium">
                            MailSmith is a fully-managed cold email service. We handle everything—from
                            finding leads to booking meetings—so you can focus on closing deals.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* The Process */}
            <section className="relative py-32 border-t border-white/5 bg-grid-white">
                <div className="container relative z-10">
                    <motion.h2
                        {...fadeInUp}
                        className="text-4xl font-bold mb-20"
                    >
                        The Process
                    </motion.h2>

                    <div className="space-y-48">
                        {/* Step 1 */}
                        <motion.div
                            {...fadeInUp}
                            className="grid md:grid-cols-2 gap-20 items-center"
                        >
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold shadow-lg shadow-primary/20">1</span>
                                    <span className="text-primary font-bold tracking-widest text-sm uppercase">DISCOVERY</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold tracking-tight">We Learn Your Business</h3>
                                <p className="text-white/60 leading-relaxed text-xl">
                                    It starts with a discovery call. We learn about your ideal customer profile,
                                    value proposition, and what makes your solution unique. This helps us craft
                                    messages that resonate.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        'Define your ICP (Ideal Customer Profile)',
                                        'Understand your unique selling points',
                                        'Align on goals and success metrics'
                                    ].map((text, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                            viewport={{ once: true }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="mt-1 bg-green-500/10 p-1 rounded-full">
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                            </div>
                                            <span className="text-white/80 text-lg font-medium">{text}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative bg-white/[0.03] border border-white/10 rounded-[32px] p-10 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-primary/20 group-hover:scale-[1.02]">
                                    <div className="grid grid-cols-2 gap-6">
                                        {[
                                            { icon: Target, label: 'ICP Definition' },
                                            { icon: MessageSquare, label: 'Messaging Strategy' },
                                            { icon: TrendingUp, label: 'Goal Setting' },
                                            { icon: Calendar, label: 'Timeline Planning' }
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ y: -5, scale: 1.05 }}
                                                className="bg-white/[0.03] rounded-2xl p-6 flex flex-col items-center text-center border border-white/5 hover:border-primary/30 transition-all shadow-inner"
                                            >
                                                <item.icon className="h-10 w-10 text-primary mb-4" />
                                                <span className="text-sm font-bold text-white/90">{item.label}</span>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 2 */}
                        <motion.div
                            {...fadeInUp}
                            className="grid md:grid-cols-2 gap-20 items-center"
                        >
                            <div className="order-2 md:order-1 relative group">
                                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative bg-white/[0.03] border border-white/10 rounded-[32px] p-10 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-primary/20 group-hover:scale-[1.02]">
                                    <div className="space-y-6">
                                        {[
                                            { icon: Globe, title: 'LinkedIn Sales Navigator', desc: 'Primary lead source' },
                                            { icon: Database, title: 'Apollo.io Database', desc: 'Contact enrichment' },
                                            { icon: Shield, title: 'Email Verification', desc: '99%+ deliverability', color: 'text-green-500' }
                                        ].map((item, i) => (
                                            <motion.div
                                                key={i}
                                                whileHover={{ x: 10 }}
                                                className="flex items-center gap-6 bg-white/[0.03] rounded-2xl p-6 border border-white/5 hover:border-primary/20 transition-all"
                                            >
                                                <div className="bg-primary/10 p-4 rounded-xl">
                                                    <item.icon className={`h-8 w-8 ${item.color || 'text-primary'}`} />
                                                </div>
                                                <div>
                                                    <p className="font-bold text-xl">{item.title}</p>
                                                    <p className="text-sm text-white/40 font-medium">{item.desc}</p>
                                                </div>
                                            </motion.div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 space-y-8">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold shadow-lg shadow-primary/20">2</span>
                                    <span className="text-primary font-bold tracking-widest text-sm uppercase">LEAD SOURCING</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Perfect Prospects</h3>
                                <p className="text-white/60 leading-relaxed text-xl">
                                    Our team sources leads from LinkedIn, Apollo, and proprietary databases.
                                    Every email is verified to ensure high deliverability and protect your domain reputation.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        'Multi-source lead generation',
                                        'Triple email verification',
                                        'Enriched with company data'
                                    ].map((text, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                            viewport={{ once: true }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="mt-1 bg-green-500/10 p-1 rounded-full">
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                            </div>
                                            <span className="text-white/80 text-lg font-medium">{text}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>

                        {/* Step 3 */}
                        <motion.div
                            {...fadeInUp}
                            className="grid md:grid-cols-2 gap-20 items-center"
                        >
                            <div className="space-y-8">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold shadow-lg shadow-primary/20">3</span>
                                    <span className="text-primary font-bold tracking-widest text-sm uppercase">PERSONALIZATION</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold tracking-tight">AI Generated Icebreakers</h3>
                                <p className="text-white/60 leading-relaxed text-xl">
                                    For each lead, our AI analyzes their LinkedIn, company news, and recent activity
                                    to craft a unique opening line. No templates. Every email feels personally written.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        'References specific achievements',
                                        'Mentions relevant company news',
                                        'Human-reviewed for quality'
                                    ].map((text, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: -10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                            viewport={{ once: true }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="mt-1 bg-green-500/10 p-1 rounded-full">
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                            </div>
                                            <span className="text-white/80 text-lg font-medium">{text}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                            <div className="relative group">
                                <div className="absolute inset-0 bg-primary/10 rounded-3xl blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative bg-white/[0.03] border border-white/10 rounded-[32px] p-10 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-primary/20">
                                    <div className="space-y-6">
                                        <div className="flex items-center gap-4 mb-4">
                                            <div className="bg-primary/20 p-3 rounded-xl animate-pulse">
                                                <Bot className="h-8 w-8 text-primary" />
                                            </div>
                                            <span className="text-xl font-bold">AI Icebreaker Engine</span>
                                        </div>
                                        <motion.div
                                            initial={{ scale: 0.95, opacity: 0 }}
                                            whileInView={{ scale: 1, opacity: 1 }}
                                            transition={{ duration: 0.8, delay: 0.3 }}
                                            viewport={{ once: true }}
                                            className="bg-primary/5 rounded-2xl p-8 border border-primary/20 shadow-2xl"
                                        >
                                            <p className="text-white/90 leading-relaxed italic text-lg font-medium">
                                                "Saw your recent post on scaling B2B sales teams—the point about
                                                hiring for curiosity over experience really resonated. We're helping
                                                companies like DataCorp automate their outreach while keeping that
                                                personal touch..."
                                            </p>
                                        </motion.div>
                                        <p className="text-xs text-white/40 text-center font-bold tracking-widest uppercase mt-4">
                                            Live Generation Preview
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Step 4 */}
                        <motion.div
                            {...fadeInUp}
                            className="grid md:grid-cols-2 gap-20 items-center"
                        >
                            <div className="order-2 md:order-1 relative group">
                                <div className="absolute inset-0 bg-green-500/5 rounded-3xl blur-[40px] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className="relative bg-white/[0.03] border border-white/10 rounded-[32px] p-12 backdrop-blur-sm transition-all duration-500 group-hover:bg-white/[0.05] group-hover:border-green-500/20">
                                    <div className="space-y-10">
                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-bold tracking-widest text-white/50 uppercase">Cloud Analytics</span>
                                            <span className="text-xs font-bold text-green-400 bg-green-500/10 px-3 py-1.5 rounded-full animate-pulse border border-green-500/20">LIVE DATA</span>
                                        </div>
                                        <div className="grid grid-cols-3 gap-8 text-center">
                                            {[
                                                { label: 'Open Rate', val: '47%', color: 'text-primary' },
                                                { label: 'Reply Rate', val: '12%', color: 'text-green-400' },
                                                { label: 'Meetings', val: '8', color: 'text-amber-400' }
                                            ].map((stat, i) => (
                                                <div key={i}>
                                                    <motion.p
                                                        initial={{ scale: 0.5, opacity: 0 }}
                                                        whileInView={{ scale: 1, opacity: 1 }}
                                                        transition={{ duration: 0.5, delay: 0.5 + (i * 0.1) }}
                                                        viewport={{ once: true }}
                                                        className={`text-4xl font-black mb-2 ${stat.color}`}
                                                    >
                                                        {stat.val}
                                                    </motion.p>
                                                    <p className="text-xs font-bold text-white/40 uppercase tracking-wider">{stat.label}</p>
                                                </div>
                                            ))}
                                        </div>
                                        <div className="relative pt-4">
                                            <div className="h-3 bg-white/5 rounded-full overflow-hidden border border-white/5">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: '65%' }}
                                                    transition={{ duration: 1.5, delay: 1, ease: "easeOut" }}
                                                    viewport={{ once: true }}
                                                    className="h-full bg-gradient-to-r from-primary via-blue-400 to-green-500 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2 space-y-8">
                                <div className="inline-flex items-center gap-3">
                                    <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-xl font-bold shadow-lg shadow-primary/20">4</span>
                                    <span className="text-primary font-bold tracking-widest text-sm uppercase">EXECUTION</span>
                                </div>
                                <h3 className="text-4xl md:text-5xl font-bold tracking-tight">Run & Optimize</h3>
                                <p className="text-white/60 leading-relaxed text-xl">
                                    We handle domain setup, inbox warming, and deliverability. Campaigns run on
                                    autopilot with automated follow-ups. You track everything in your real-time dashboard.
                                </p>
                                <ul className="space-y-4">
                                    {[
                                        'Domain warming included',
                                        'Multi-step sequences',
                                        'Real-time analytics dashboard'
                                    ].map((text, i) => (
                                        <motion.li
                                            key={i}
                                            initial={{ opacity: 0, x: 10 }}
                                            whileInView={{ opacity: 1, x: 0 }}
                                            transition={{ delay: 0.2 + (i * 0.1) }}
                                            viewport={{ once: true }}
                                            className="flex items-start gap-4"
                                        >
                                            <div className="mt-1 bg-green-500/10 p-1 rounded-full">
                                                <CheckCircle2 className="h-5 w-5 text-green-500 shrink-0" />
                                            </div>
                                            <span className="text-white/80 text-lg font-medium">{text}</span>
                                        </motion.li>
                                    ))}
                                </ul>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Timeline */}
            <section className="relative py-48 border-t border-white/5 bg-black">
                <div className="container relative z-10">
                    <motion.div
                        {...fadeInUp}
                        className="text-center mb-24 space-y-6"
                    >
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight">Your Timeline to Results</h2>
                        <p className="text-white/50 max-w-xl mx-auto text-xl font-medium">
                            From kickoff to qualified meetings in just 2 weeks
                        </p>
                    </motion.div>

                    <div className="grid md:grid-cols-4 gap-8">
                        {[
                            { week: 'Week 1', title: 'Setup', desc: 'Discovery, ICP definition, domain setup, inbox warming begins', icon: Settings },
                            { week: 'Week 2', title: 'Launch', desc: 'Lead sourcing, AI personalization, first emails sent', icon: Rocket },
                            { week: 'Week 3', title: 'Optimize', desc: 'Analyze performance, A/B test messaging, scale volume', icon: TrendingUp },
                            { week: 'Ongoing', title: 'Scale', desc: 'Continuous optimization, weekly reports, grow pipeline', icon: Zap },
                        ].map((item, i) => (
                            <motion.div
                                key={i}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ duration: 0.8, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                                whileHover={{ y: -12, backgroundColor: "rgba(255,255,255,0.05)" }}
                                className="relative group cursor-default"
                            >
                                <div className="bg-white/[0.02] border border-white/10 rounded-[32px] p-8 h-full transition-all duration-500 group-hover:border-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/5 backdrop-blur-sm">
                                    <div className="text-primary text-sm font-black tracking-widest uppercase mb-4">{item.week}</div>
                                    <div className="mb-6 bg-primary/10 w-fit p-3 rounded-xl transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6">
                                        <item.icon className="h-6 w-6 text-primary" />
                                    </div>
                                    <h3 className="text-2xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                                    <p className="text-white/40 text-sm leading-relaxed font-medium group-hover:text-white/60 transition-colors">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className="relative py-48 bg-[#030303]">
                <div className="container relative z-10">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                        viewport={{ once: true }}
                        className="relative overflow-hidden rounded-[48px] bg-primary p-12 md:p-32 text-center shadow-3xl shadow-primary/20"
                    >
                        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600" />
                        <motion.div
                            animate={{ scale: [1, 1.2, 1], rotate: 45 }}
                            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                            className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[120px] -mr-64 -mt-64"
                        />

                        <div className="relative z-10 max-w-2xl mx-auto space-y-10">
                            <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                                Ready to get started?
                            </h2>
                            <p className="text-xl md:text-2xl text-white/80 leading-relaxed font-medium">
                                Book a demo to see how MailSmith can fill your pipeline with qualified meetings.
                            </p>
                            <Button size="lg" variant="secondary" asChild className="h-20 px-16 rounded-full text-2xl font-bold bg-white text-primary hover:bg-white/90 shadow-3xl shadow-primary/40 transition-all hover:-translate-y-2 hover:scale-105 active:scale-95 group">
                                <Link href="/request-demo" className="flex items-center gap-4">
                                    Book Your Demo
                                    <ArrowRight className="h-8 w-8 transition-transform group-hover:translate-x-2" />
                                </Link>
                            </Button>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* Footer */}
            <footer className="border-t border-white/5 py-20 bg-black">
                <div className="container">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-12">
                        <div className="flex items-center gap-4">
                            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/20">
                                <Image
                                    src="/logo.png"
                                    alt="MailSmith Logo"
                                    width={28}
                                    height={28}
                                    className="object-contain"
                                />
                            </div>
                            <span className="font-bold text-2xl tracking-tight">MailSmith</span>
                        </div>
                        <div className="flex flex-wrap justify-center gap-8 md:gap-12 text-sm font-bold text-white/50 tracking-widest uppercase">
                            <Link href="/" className="hover:text-white transition-colors relative group">
                                Home
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
                            </Link>
                            <Link href="/request-demo" className="hover:text-white transition-colors relative group">
                                Request Demo
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
                            </Link>
                            <Link href="/login" className="hover:text-white transition-colors relative group">
                                Client Login
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
                            </Link>
                        </div>
                        <p className="text-sm text-white/30 font-bold uppercase tracking-[0.2em]">
                            © 2026 MailSmith.
                        </p>
                    </div>
                </div>
            </footer>
        </div>
    )
}
