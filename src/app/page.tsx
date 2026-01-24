'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Users, Sparkles, CheckCircle2, Shield, Clock, Target, Rocket, BarChart3, Calendar } from 'lucide-react'
import * as motion from "framer-motion/client"

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.8, ease: [0.16, 1, 0.3, 1] }
}

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
}

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30 overflow-x-hidden">
      {/* Ambient effects - CopperX style */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-full h-[800px] mesh-gradient opacity-60" />
        <div className="absolute inset-0 bg-wavy-pattern opacity-[0.03] mix-blend-overlay" />
        <div className="absolute top-[20%] left-[10%] w-[400px] h-[400px] bg-primary/10 rounded-full blur-[120px] animate-pulse" />
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
          <div className="flex items-center gap-2 md:gap-6">
            <Link href="/how-it-works" className="relative px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors hidden md:block group">
              <span className="relative z-10">How It Works</span>
              <span className="absolute inset-0 bg-white/5 rounded-full scale-0 group-hover:scale-100 transition-transform duration-300 ease-premium" />
            </Link>
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

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container relative z-10">
          <motion.div
            variants={staggerContainer}
            initial="initial"
            animate="animate"
            className="mx-auto max-w-4xl text-center space-y-10"
          >
            <motion.div
              variants={fadeInUp}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm shadow-sm"
            >
              <Shield className="h-4 w-4" />
              <span>Fully Managed Service • Done-for-You Outreach</span>
            </motion.div>

            <div className="overflow-hidden">
              <motion.h1
                variants={fadeInUp}
                className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.05]"
              >
                Your dedicated
                <br />
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary">outreach team</span>
              </motion.h1>
            </div>

            <motion.p
              variants={fadeInUp}
              className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto leading-relaxed"
            >
              MailSmith is a white-glove cold email service. We handle lead sourcing,
              AI personalization, campaign execution, and deliverability—so you can focus on closing deals.
            </motion.p>

            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
            >
              <Button size="lg" asChild className="h-14 px-10 rounded-full text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1 hover:scale-[1.02] group active:scale-95">
                <Link href="/request-demo">
                  Request a Demo
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-10 rounded-full text-lg border-white/10 hover:bg-white/5 backdrop-blur-sm transition-all hover:-translate-y-1 active:scale-95">
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4 pt-8 text-sm text-white/40"
            >
              <div className="flex items-center gap-2 group cursor-default">
                <CheckCircle2 className="h-4 w-4 text-green-500 transition-transform group-hover:scale-110" />
                <span className="group-hover:text-white/60 transition-colors">No contracts</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                <CheckCircle2 className="h-4 w-4 text-green-500 transition-transform group-hover:scale-110" />
                <span className="group-hover:text-white/60 transition-colors">Dedicated team</span>
              </div>
              <div className="flex items-center gap-2 group cursor-default">
                <CheckCircle2 className="h-4 w-4 text-green-500 transition-transform group-hover:scale-110" />
                <span className="group-hover:text-white/60 transition-colors">Results in 2 weeks</span>
              </div>
            </motion.div>
          </motion.div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.2, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 0.1, scale: 1 }}
            transition={{ duration: 2, ease: "easeOut" }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] border border-white/5 rounded-full"
          />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-32 border-t border-white/5 bg-grid-white pb-48">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-20 space-y-4"
          >
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">How MailSmith Works</h2>
            <p className="text-white/50 max-w-xl mx-auto text-lg leading-relaxed">
              We take care of everything so you can focus on what you do best—closing deals.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Calendar, title: 'Book a Demo', desc: 'Tell us about your ideal customer profile and goals' },
              { step: '02', icon: Users, title: 'We Source Leads', desc: 'Our team finds and verifies your perfect prospects' },
              { step: '03', icon: Sparkles, title: 'AI Personalization', desc: 'Every email is crafted with relevant, personal context' },
              { step: '04', icon: Rocket, title: 'Results Delivered', desc: 'You get warm conversations and qualified meetings' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.8, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -8 }}
                className="relative group"
              >
                <div className="absolute inset-0 bg-primary/5 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="relative bg-white/[0.02] border border-white/5 rounded-2xl p-8 h-full transition-all duration-300 group-hover:border-primary/20 group-hover:bg-white/[0.04] backdrop-blur-sm shadow-sm group-hover:shadow-primary/5">
                  <div className="text-primary/30 text-5xl font-bold mb-4 transition-colors group-hover:text-primary/50">{item.step}</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6 border border-primary/20 transition-transform group-hover:scale-110 group-hover:rotate-3 shadow-inner">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-3 group-hover:text-primary transition-colors">{item.title}</h3>
                  <p className="text-white/50 text-sm leading-relaxed">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 border-t border-white/5 bg-black">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-24 space-y-4"
          >
            <h2 className="text-4xl md:text-6xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white to-white/60">What's Included</h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
              A complete outreach system managed by experts—not software you have to figure out.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              whileHover={{ y: -10 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 h-full backdrop-blur-md transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-8 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 shadow-inner">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Targeted Lead Sourcing</h3>
                <p className="text-white/50 leading-relaxed text-base">
                  We find and verify leads matching your ICP using LinkedIn, Apollo,
                  and proprietary data sources. No bad emails, no wasted time.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              whileHover={{ y: -10 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 h-full backdrop-blur-md transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-8 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 shadow-inner">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">AI Personalization</h3>
                <p className="text-white/50 leading-relaxed text-base">
                  Every email includes a unique icebreaker tailored to the prospect's
                  role, company news, or recent activity. No templates.
                </p>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
              whileHover={{ y: -10 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 h-full backdrop-blur-md transition-all duration-300 group-hover:border-primary/30 group-hover:shadow-2xl group-hover:shadow-primary/10">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-8 border border-primary/20 transition-all duration-300 group-hover:scale-110 group-hover:bg-primary/20 shadow-inner">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Managed Campaigns</h3>
                <p className="text-white/50 leading-relaxed text-base">
                  We write, schedule, and optimize your sequences. Deliverability,
                  domain warming, and inbox management included.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.01 }}
              className="relative group"
            >
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 backdrop-blur-md transition-all duration-300 group-hover:border-primary/20 group-hover:bg-white/[0.05]">
                <div className="flex items-start gap-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Real-Time Dashboard</h3>
                    <p className="text-white/50 leading-relaxed text-lg">
                      Track opens, replies, and meetings in your client portal.
                      See exactly how your campaigns are performing without any guesswork.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ scale: 1.01 }}
              className="relative group"
            >
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 backdrop-blur-md transition-all duration-300 group-hover:border-primary/20 group-hover:bg-white/[0.05]">
                <div className="flex items-start gap-8">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shrink-0 shadow-inner group-hover:scale-110 transition-transform">
                    <Target className="h-8 w-8 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4 group-hover:text-primary transition-colors">Dedicated Account Manager</h3>
                    <p className="text-white/50 leading-relaxed text-lg">
                      You get a dedicated human who knows your business. Weekly calls,
                      strategy sessions, and continuous optimization.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-48 overflow-hidden bg-[#030303]">
        <div className="container relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="relative overflow-hidden rounded-[40px] bg-primary p-12 md:p-32 text-center shadow-2xl shadow-primary/20"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600" />
            <motion.div
              animate={{
                scale: [1, 1.2, 1],
                rotate: [0, 90, 0]
              }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute top-0 right-0 w-[600px] h-[600px] bg-white/20 rounded-full blur-[120px] -mr-64 -mt-64"
            />
            <motion.div
              animate={{
                scale: [1, 1.1, 1],
                rotate: [0, -90, 0]
              }}
              transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
              className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-black/30 rounded-full blur-[120px] -ml-64 -mb-64"
            />

            <div className="relative z-10 max-w-3xl mx-auto space-y-10">
              <h2 className="text-4xl md:text-7xl font-bold text-white tracking-tight leading-tight">
                Ready to fill your pipeline?
              </h2>
              <p className="text-xl md:text-2xl text-white/80 leading-relaxed">
                Book a demo to see how MailSmith can generate qualified meetings for your sales team.
              </p>
              <Button size="lg" variant="secondary" asChild className="h-20 px-16 rounded-full text-2xl font-bold bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:-translate-y-2 hover:scale-105 active:scale-95 group">
                <Link href="/request-demo">
                  Book Your Demo
                  <ArrowRight className="ml-2 h-8 w-8 transition-transform group-hover:translate-x-2" />
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
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary overflow-hidden shadow-lg shadow-primary/20">
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
            <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12 text-sm font-medium text-white/50">
              <Link href="/how-it-works" className="hover:text-white transition-colors relative group">
                How It Works
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
              </Link>
              <Link href="#" className="hover:text-white transition-colors relative group">
                Privacy Policy
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
              </Link>
              <Link href="#" className="hover:text-white transition-colors relative group">
                Terms of Service
                <span className="absolute -bottom-1 left-0 w-0 h-px bg-primary transition-all group-hover:w-full" />
              </Link>
              <Link href="/admin" className="text-primary hover:text-white transition-colors italic opacity-70 hover:opacity-100">Team Login</Link>
            </div>
            <p className="text-sm text-white/30 font-medium">
              © 2026 MailSmith. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
