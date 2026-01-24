'use client'

import { useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Loader2, Mail, Lock, ArrowLeft } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { toast } from 'sonner'

export default function LoginPage() {
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
        if (!emailRegex.test(email)) {
            setError('Please enter a valid email address.');
            setIsLoading(false);
            return;
        }

        try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError

            // Fetch role to redirect correctly
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single()

            if (userError) {
                console.error('User lookup error:', userError)
            }

            const role = userData?.role || 'customer'

            toast.success('Signed in successfully!')

            // Determine redirect path based on role
            let redirectPath = '/portal'
            if (role === 'super_admin') {
                redirectPath = '/admin-console'
            } else if (role === 'operator') {
                redirectPath = '/operator'
            }

            // Use window.location for reliable redirect
            window.location.href = redirectPath
        } catch (err: any) {
            console.error('Login failed:', err);
            setError(err.message || 'Invalid email or password')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background via-background to-primary/5 px-4">
            {/* Ambient glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary/20 rounded-full blur-3xl" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary/10 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative backdrop-blur-sm bg-card/80 border-border/50">
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
                    <CardTitle className="text-2xl font-bold">Welcome back</CardTitle>
                    <CardDescription>
                        Sign in to your MailSmith account
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-4">
                        {error && (
                            <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email">Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="you@company.com"
                                    className="pl-10"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex items-center justify-between">
                                <Label htmlFor="password">Password</Label>
                                <Link
                                    href="/forgot-password"
                                    className="text-xs text-muted-foreground hover:text-primary transition-colors"
                                >
                                    Forgot password?
                                </Link>
                            </div>
                            <div className="relative">
                                <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••"
                                    className="pl-10"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4">
                        <Button type="submit" className="w-full" disabled={isLoading}>
                            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            {isLoading ? 'Signing in...' : 'Sign in'}
                        </Button>

                        <div className="text-center space-y-2">
                            <p className="text-xs text-muted-foreground">
                                Don't have an account? MailSmith is invite-only.
                            </p>
                            <Link
                                href="/"
                                className="text-xs text-primary hover:underline font-medium inline-flex items-center gap-1"
                            >
                                <ArrowLeft className="h-3 w-3" />
                                Back to homepage
                            </Link>
                        </div>
                    </CardFooter>
                </form>
            </Card>

            {/* Footer */}
            <div className="absolute bottom-4 text-center text-xs text-muted-foreground">
                © 2026 MailSmith. All rights reserved.
            </div>
        </div>
    )
}
