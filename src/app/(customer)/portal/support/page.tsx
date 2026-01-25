'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
import {
    ArrowLeft,
    Mail,
    Phone,
    MessageSquare,
    Clock,
    CheckCircle2,
    Loader2,
    ExternalLink,
} from 'lucide-react'
import Link from 'next/link'

export default function SupportPage() {
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [submitted, setSubmitted] = useState(false)
    const [subject, setSubject] = useState('')
    const [message, setMessage] = useState('')

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setIsSubmitting(true)

        // Simulate form submission
        await new Promise(resolve => setTimeout(resolve, 1500))

        setSubmitted(true)
        setIsSubmitting(false)
    }

    if (submitted) {
        return (
            <div className="max-w-2xl mx-auto space-y-6">
                <div className="flex items-center gap-4">
                    <Link href="/portal">
                        <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-white">Contact Support</h1>
                        <p className="text-sm text-white/50">We're here to help</p>
                    </div>
                </div>

                <Card className="bg-white/[0.02] border-white/5">
                    <CardContent className="p-8 text-center space-y-4">
                        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
                            <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-white">Message Sent!</h2>
                            <p className="text-white/50 mt-2">
                                Thank you for reaching out. Our team will get back to you within 24 hours.
                            </p>
                        </div>
                        <Link href="/portal">
                            <Button className="mt-4">
                                Return to Dashboard
                            </Button>
                        </Link>
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-2xl mx-auto space-y-6">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/portal">
                    <Button variant="ghost" size="icon" className="text-white/50 hover:text-white">
                        <ArrowLeft className="h-5 w-5" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-2xl font-bold text-white">Contact Support</h1>
                    <p className="text-sm text-white/50">We're here to help</p>
                </div>
            </div>

            {/* Contact Options */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-white/[0.02] border-white/5 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 text-center space-y-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 mx-auto">
                            <Mail className="h-5 w-5 text-primary" />
                        </div>
                        <h3 className="font-medium text-white text-sm">Email Us</h3>
                        <p className="text-xs text-white/40">support@mailsmith.co</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/[0.02] border-white/5 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 text-center space-y-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 mx-auto">
                            <Phone className="h-5 w-5 text-emerald-500" />
                        </div>
                        <h3 className="font-medium text-white text-sm">Call Us</h3>
                        <p className="text-xs text-white/40">+1 (555) 123-4567</p>
                    </CardContent>
                </Card>

                <Card className="bg-white/[0.02] border-white/5 hover:border-primary/30 transition-colors">
                    <CardContent className="p-4 text-center space-y-2">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-amber-500/10 mx-auto">
                            <Clock className="h-5 w-5 text-amber-500" />
                        </div>
                        <h3 className="font-medium text-white text-sm">Response Time</h3>
                        <p className="text-xs text-white/40">Within 24 hours</p>
                    </CardContent>
                </Card>
            </div>

            {/* Contact Form */}
            <Card className="bg-white/[0.02] border-white/5">
                <CardHeader>
                    <CardTitle className="text-white flex items-center gap-2">
                        <MessageSquare className="h-5 w-5 text-primary" />
                        Send a Message
                    </CardTitle>
                    <CardDescription className="text-white/50">
                        Fill out the form below and we'll get back to you as soon as possible.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject" className="text-white/70">Subject</Label>
                            <Input
                                id="subject"
                                placeholder="What can we help you with?"
                                value={subject}
                                onChange={(e) => setSubject(e.target.value)}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30"
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message" className="text-white/70">Message</Label>
                            <Textarea
                                id="message"
                                placeholder="Describe your issue or question in detail..."
                                value={message}
                                onChange={(e) => setMessage(e.target.value)}
                                rows={5}
                                className="bg-white/5 border-white/10 text-white placeholder:text-white/30 resize-none"
                                required
                            />
                        </div>

                        <Button
                            type="submit"
                            className="w-full"
                            disabled={isSubmitting || !subject.trim() || !message.trim()}
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending...
                                </>
                            ) : (
                                'Send Message'
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Help Resources */}
            <Card className="bg-white/[0.02] border-white/5">
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                                <ExternalLink className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                                <p className="text-sm font-medium text-white">Need quick answers?</p>
                                <p className="text-xs text-white/40">Check out our help documentation</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" className="text-white/60 border-white/10 hover:text-white">
                            View Docs
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    )
}
