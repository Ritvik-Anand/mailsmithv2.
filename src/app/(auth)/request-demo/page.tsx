'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import { Loader2, Mail, User, Building2, ArrowLeft, CheckCircle2, Calendar, Sparkles } from 'lucide-react'
import { toast } from 'sonner'

export default function RequestDemoPage() {
    const [isLoading, setIsLoading] = useState(false)
    const [isSubmitted, setIsSubmitted] = useState(false)

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)

        const formData = new FormData(event.currentTarget)
        const data = {
            name: formData.get('name') as string,
            email: formData.get('email') as string,
            company: formData.get('company') as string,
            teamSize: formData.get('teamSize') as string,
            message: formData.get('message') as string,
        }

        // Simulate API call - in production, send to your backend or email service
        try {
            // TODO: Actually send this data to your backend
            await new Promise(resolve => setTimeout(resolve, 1500))

            console.log('Demo request:', data)
            toast.success('Demo request submitted!')
            setIsSubmitted(true)
        } catch (error) {
            toast.error('Something went wrong. Please try again.')
        } finally {
            setIsLoading(false)
        }
    }

    if (isSubmitted) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
                    <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
                </div>

                <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/80 border-border/50">
                    <CardHeader className="text-center space-y-4 pb-8">
                        <div className="flex justify-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10 border border-green-500/20">
                                <CheckCircle2 className="h-8 w-8 text-green-500" />
                            </div>
                        </div>
                        <CardTitle className="text-2xl font-bold">Demo Request Received!</CardTitle>
                        <CardDescription className="text-base">
                            Thank you for your interest in MailSmith. A member of our team will reach out within 24 hours to schedule your personalized demo.
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 space-y-3">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-primary" />
                                What to expect:
                            </h4>
                            <ul className="text-sm text-muted-foreground space-y-2">
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    30-minute personalized demo call
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    Overview of our lead sourcing process
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    Live AI icebreaker demonstration
                                </li>
                                <li className="flex items-start gap-2">
                                    <CheckCircle2 className="h-4 w-4 text-green-500 mt-0.5 shrink-0" />
                                    Custom pricing based on your needs
                                </li>
                            </ul>
                        </div>
                    </CardContent>
                    <CardFooter>
                        <Button variant="outline" asChild className="w-full">
                            <Link href="/">
                                <ArrowLeft className="h-4 w-4 mr-2" />
                                Back to Homepage
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4 py-12">
            {/* Ambient glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-lg relative backdrop-blur-sm bg-card/80 border-border/50">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary shadow-lg shadow-primary/25 overflow-hidden">
                            <Image
                                src="/logo.png"
                                alt="MailSmith Logo"
                                width={48}
                                height={48}
                                className="object-contain p-2"
                            />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold">Request a Demo</CardTitle>
                    <CardDescription>
                        See how MailSmith can fill your pipeline with qualified meetings
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Full Name</Label>
                                <div className="relative">
                                    <User className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="name"
                                        name="name"
                                        placeholder="John Smith"
                                        className="pl-10"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="email">Work Email</Label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="john@company.com"
                                        className="pl-10"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="company">Company Name</Label>
                                <div className="relative">
                                    <Building2 className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input
                                        id="company"
                                        name="company"
                                        placeholder="Acme Inc"
                                        className="pl-10"
                                        required
                                        disabled={isLoading}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="teamSize">Team Size</Label>
                                <Select name="teamSize" required disabled={isLoading}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select size" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1-5">1-5 people</SelectItem>
                                        <SelectItem value="6-20">6-20 people</SelectItem>
                                        <SelectItem value="21-50">21-50 people</SelectItem>
                                        <SelectItem value="51-200">51-200 people</SelectItem>
                                        <SelectItem value="200+">200+ people</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message">What are you looking to achieve?</Label>
                            <Textarea
                                id="message"
                                name="message"
                                placeholder="Tell us about your outreach goals, target audience, and any challenges you're facing..."
                                rows={4}
                                disabled={isLoading}
                            />
                        </div>

                        <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex items-start gap-3">
                            <Sparkles className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-foreground">What you'll get in the demo:</p>
                                <p className="text-muted-foreground mt-1">
                                    Personalized walkthrough, live AI icebreaker demo, and a custom proposal for your team.
                                </p>
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Submitting...' : 'Request Demo'}
                        </Button>

                        <div className="text-center">
                            <Link
                                href="/"
                                className="text-xs text-muted-foreground hover:text-primary transition-colors inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back to homepage
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>
        </div>
    )
}
