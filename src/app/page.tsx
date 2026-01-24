import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { ArrowRight, Mail, Users, Sparkles, CheckCircle2, Shield, Clock, Target, Rocket, BarChart3, Calendar } from 'lucide-react'
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
            <Link href="/how-it-works" className="text-sm font-medium text-white/70 hover:text-white transition-colors hidden md:block">
              How It Works
            </Link>
            <Link href="/login" className="text-sm font-medium text-white/70 hover:text-white transition-colors">
              Client Login
            </Link>
            <Button asChild className="rounded-full px-6 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all hover:-translate-y-0.5">
              <Link href="/request-demo">Request Demo</Link>
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
              <Shield className="h-4 w-4" />
              <span>Fully Managed Service • Done-for-You Outreach</span>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl md:text-8xl font-bold tracking-tight leading-[1.1]"
            >
              Your dedicated
              <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r from-primary via-blue-400 to-primary">outreach team</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="text-xl md:text-2xl text-white/50 max-w-2xl mx-auto leading-relaxed"
            >
              MailSmith is a white-glove cold email service. We handle lead sourcing,
              AI personalization, campaign execution, and deliverability—so you can focus on closing deals.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-5 pt-4"
            >
              <Button size="lg" asChild className="h-14 px-10 rounded-full text-lg shadow-xl shadow-primary/25 hover:shadow-primary/40 transition-all hover:-translate-y-1 group">
                <Link href="/request-demo">
                  Request a Demo
                  <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="h-14 px-10 rounded-full text-lg border-white/10 hover:bg-white/5 backdrop-blur-sm transition-all hover:-translate-y-1">
                <Link href="/how-it-works">Learn More</Link>
              </Button>
            </motion.div>

            {/* Trust indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="flex items-center justify-center gap-8 pt-8 text-sm text-white/40"
            >
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>No contracts</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Dedicated team</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-500" />
                <span>Results in 2 weeks</span>
              </div>
            </motion.div>
          </div>
        </div>

        {/* Background decorative elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full -z-10 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] border border-white/5 rounded-full opacity-20" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1100px] h-[1100px] border border-white/5 rounded-full opacity-10" />
        </div>
      </section>

      {/* How It Works */}
      <section className="relative py-24 border-t border-white/5">
        <div className="container">
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-3xl md:text-4xl font-bold">How MailSmith Works</h2>
            <p className="text-white/50 max-w-xl mx-auto">
              We take care of everything so you can focus on what you do best—closing deals.
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '01', icon: Calendar, title: 'Book a Demo', desc: 'Tell us about your ideal customer profile and goals' },
              { step: '02', icon: Users, title: 'We Source Leads', desc: 'Our team finds and verifies your perfect prospects' },
              { step: '03', icon: Sparkles, title: 'AI Personalization', desc: 'Every email is crafted with relevant, personal context' },
              { step: '04', icon: Rocket, title: 'Results Delivered', desc: 'You get warm conversations and qualified meetings' },
            ].map((item, i) => (
              <motion.div
                key={item.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="relative"
              >
                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 h-full hover:border-primary/20 transition-colors">
                  <div className="text-primary/30 text-5xl font-bold mb-4">{item.step}</div>
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 mb-4 border border-primary/20">
                    <item.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-white/50 text-sm">{item.desc}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="relative py-32 border-t border-white/5 bg-white/[0.01]">
        <div className="container relative z-10">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-4xl md:text-5xl font-bold tracking-tight">What's Included</h2>
            <p className="text-white/50 max-w-2xl mx-auto text-lg leading-relaxed">
              A complete outreach system managed by experts—not software you have to figure out.
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
                <h3 className="text-2xl font-bold mb-4">Targeted Lead Sourcing</h3>
                <p className="text-white/50 leading-relaxed">
                  We find and verify leads matching your ICP using LinkedIn, Apollo,
                  and proprietary data sources. No bad emails, no wasted time.
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
                <h3 className="text-2xl font-bold mb-4">AI-Powered Personalization</h3>
                <p className="text-white/50 leading-relaxed">
                  Every email includes a unique icebreaker tailored to the prospect's
                  role, company news, or recent activity. No templates.
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
                <h3 className="text-2xl font-bold mb-4">Managed Campaigns</h3>
                <p className="text-white/50 leading-relaxed">
                  We write, schedule, and optimize your sequences. Deliverability,
                  domain warming, and inbox management included.
                </p>
              </div>
            </motion.div>
          </div>

          <div className="grid md:grid-cols-2 gap-8 mt-8">
            <motion.div
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 backdrop-blur-sm transition-colors group-hover:border-primary/20">
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                    <BarChart3 className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Real-Time Dashboard</h3>
                    <p className="text-white/50 leading-relaxed">
                      Track opens, replies, and meetings in your client portal.
                      See exactly how your campaigns are performing without any guesswork.
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              whileHover={{ y: -5 }}
              className="relative group"
            >
              <div className="relative bg-white/[0.03] border border-white/10 rounded-3xl p-10 backdrop-blur-sm transition-colors group-hover:border-primary/20">
                <div className="flex items-start gap-6">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 border border-primary/20 shrink-0">
                    <Target className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold mb-4">Dedicated Account Manager</h3>
                    <p className="text-white/50 leading-relaxed">
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
      <section className="relative py-32 overflow-hidden">
        <div className="container relative z-10">
          <div className="relative overflow-hidden rounded-[40px] bg-primary p-12 md:p-24 text-center">
            <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-blue-600" />
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-white/20 rounded-full blur-[100px] -mr-64 -mt-64" />
            <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-black/20 rounded-full blur-[100px] -ml-64 -mb-64" />

            <div className="relative z-10 max-w-3xl mx-auto space-y-8">
              <h2 className="text-4xl md:text-6xl font-bold text-white tracking-tight">
                Ready to fill your pipeline?
              </h2>
              <p className="text-xl text-white/80 leading-relaxed">
                Book a demo to see how MailSmith can generate qualified meetings for your sales team.
              </p>
              <Button size="lg" variant="secondary" asChild className="h-16 px-12 rounded-full text-xl font-bold bg-white text-primary hover:bg-white/90 shadow-2xl transition-all hover:-translate-y-1">
                <Link href="/request-demo">
                  Book Your Demo
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
              <Link href="/how-it-works" className="hover:text-white transition-colors">How It Works</Link>
              <Link href="#" className="hover:text-white transition-colors">Privacy</Link>
              <Link href="#" className="hover:text-white transition-colors">Terms</Link>
              <Link href="/admin" className="hover:text-white transition-colors italic opacity-50 hover:opacity-100">Team</Link>
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
