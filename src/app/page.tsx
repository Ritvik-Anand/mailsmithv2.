import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Zap, ArrowRight, Mail, Users, TrendingUp, Sparkles } from 'lucide-react'

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Ambient effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/5 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative border-b bg-background/80 backdrop-blur-sm">
        <div className="container flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Zap className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="font-bold text-xl">MailSmith</span>
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button asChild>
              <Link href="/signup">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-24 md:py-32">
        <div className="container px-4">
          <div className="mx-auto max-w-3xl text-center space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted/50 px-4 py-1.5 text-sm">
              <Sparkles className="h-4 w-4 text-primary" />
              <span>AI-Powered Outreach</span>
            </div>

            <h1 className="text-4xl md:text-6xl font-bold tracking-tight">
              Turn cold leads into
              <span className="text-primary"> warm conversations</span>
            </h1>

            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              MailSmith scrapes, nurtures, and engages your prospects with personalized
              AI-generated icebreakers. Scale your outreach without losing the human touch.
            </p>

            <div className="flex items-center justify-center gap-4">
              <Button size="lg" asChild>
                <Link href="/signup">
                  Start Free Trial
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild>
                <Link href="/login">View Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-24 border-t bg-muted/30">
        <div className="container px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Everything you need to scale outreach</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From lead generation to campaign analytics, MailSmith handles it all.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border rounded-2xl p-8 h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Smart Lead Scraping</h3>
                <p className="text-muted-foreground">
                  Connect to LinkedIn, Apollo, and more. Scrape thousands of qualified
                  leads with advanced filters.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border rounded-2xl p-8 h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Icebreakers</h3>
                <p className="text-muted-foreground">
                  Every lead gets a personalized, AI-crafted opening line that
                  references their work and interests.
                </p>
              </div>
            </div>

            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/10 rounded-2xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative bg-card border rounded-2xl p-8 h-full">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-6">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3">Campaign Automation</h3>
                <p className="text-muted-foreground">
                  Launch multi-step email sequences with follow-ups.
                  Track opens, replies, and optimize in real-time.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-24">
        <div className="container px-4">
          <div className="relative overflow-hidden rounded-3xl bg-primary p-12 md:p-16">
            <div className="absolute inset-0 bg-gradient-to-r from-primary to-primary/80" />
            <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full blur-3xl" />

            <div className="relative z-10 max-w-2xl">
              <h2 className="text-3xl md:text-4xl font-bold text-primary-foreground mb-4">
                Ready to transform your outreach?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8">
                Join hundreds of teams using MailSmith to scale personalized outreach.
                Start your free trial today.
              </p>
              <Button size="lg" variant="secondary" asChild>
                <Link href="/signup">
                  Get Started Free
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-12">
        <div className="container px-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="flex h-6 w-6 items-center justify-center rounded bg-primary">
                <Zap className="h-3 w-3 text-primary-foreground" />
              </div>
              <span className="font-semibold">MailSmith</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2026 MailSmith. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
