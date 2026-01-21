import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Zap, ArrowRight, Mail, Users, TrendingUp, Sparkles } from 'lucide-react'
import * as motion from "framer-motion/client"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#030303] text-white selection:bg-primary/30">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-primary/10 rounded-full blur-[120px] opacity-50" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] opacity-30" />
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
              Sign in
            </Link>
            <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-24 md:pt-48 md:pb-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="mx-auto max-w-4xl text-center space-y-10">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary backdrop-blur-sm"
            >
              <Sparkles className="h-4 w-4 animate-pulse" />
              <span>New: Ultra-accurate lead scraping enabled</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.1]"
            >
              Turn cold leads into
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary"> warm conversations</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto leading-relaxed"
            >
              MailSmith scrapes, nurtures, and engages your prospects with personalized
              AI-generated icebreakers. Scale your outreach without losing the human touch.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
            >
              <Button size="lg" asChild className="h-14 px-10 rounded-full text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1 group">
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-10 rounded-full text-lg border-white/10 hover:bg-white/5 backdrop-blur-sm transition-all hover:-translate-y-1">
                <Link href="/login">View Demo</Link>
              </Button>
            </motion.div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] border border-white/5 rounded-full opacity-10" />
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 border-t border-white/5 bg-white/[0.01]">
        <div className="container relative z-10">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">Everything you need to scale outreach</h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
              From lead generation to campaign analytics, MailSmith handles it all with precision and intelligence.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 h-full backdrop-blur-sm transition-colors group-hover:border-primary/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-8 border border-primary/20">
                  <Users className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Smart Lead Scraping</h3>
                <p className="text-white/50 leading-relaxed">
                  Connect to LinkedIn, Apollo, and more. Scrape thousands of qualified
                  leads with advanced filters and real-time verification.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 h-full backdrop-blur-sm transition-colors group-hover:border-primary/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-8 border border-primary/20">
                  <Sparkles className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">AI Icebreakers</h3>
                <p className="text-white/50 leading-relaxed">
                  Every lead gets a personalized, AI-crafted opening line that
                  references their specific work, achievements, and interests.
                </p>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="relative group h-full"
            >
              <div className="absolute inset-0 bg-gradient-to-b from-primary/10 to-transparent rounded-3xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 h-full backdrop-blur-sm transition-colors group-hover:border-primary/20">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 mb-8 border border-primary/20">
                  <Mail className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">Campaign Automation</h3>
                <p className="text-white/50 leading-relaxed">
                  Launch multi-step sequences with automated follow-ups.
                  Track metrics and optimize your performance in real-time.
                </p>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="relative overflow-hidden rounded-[40px] bg-primary p-12 md:p-24 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/20 rounded-full blur-[100px] -ml-64 -mb-64" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Ready to transform your outreach?
              </h2>
              <p className="text-xl text-white/80 leading-relaxed">
                Join hundreds of high-performing teams using MailSmith to scale personalized outreach and close more deals.
              </p>
              <Button size="lg" variant="secondary" asChild className="h-16 px-12 rounded-full text-xl font-bold bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:-translate-y-1">
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-6 w-6" />
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
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="#" className="hover:text-white transition-colors">Contact</Link>
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

