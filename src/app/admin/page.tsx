'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter } from '@/components/ui/card'
import { Loader2, Mail, Lock } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { motion } from 'framer-motion'

export default function AdminLoginPage() {
    const router = useRouter()
    const supabase = createClient()
    const [isLoading, setIsLoading] = useState(true)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState('')

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession()
            if (session) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('role')
                    .eq('id', session.user.id)
                    .single()

                if (userData && (userData.role === 'super_admin' || userData.role === 'operator')) {
                    const path = userData.role === 'super_admin' ? '/admin-console' : '/operator'
                    window.location.href = path
                    return
                } else if (userData) {
                    // Logged in as customer, but trying to access admin login
                    window.location.href = '/portal'
                    return
                }
            }
            setIsLoading(false)
        }
        checkSession()
    }, [router, supabase])

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsSubmitting(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const { data: authData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password,
            })

            if (signInError) throw signInError

            const { data: userData, error: roleError } = await supabase
                .from('users')
                .select('role')
                .eq('id', authData.user.id)
                .single()

            if (roleError || !userData) {
                await supabase.auth.signOut()
                throw new Error('Unauthorized account.')
            }

            const role = userData.role
            if (role !== 'super_admin' && role !== 'operator') {
                await supabase.auth.signOut()
                throw new Error('Access denied: Admin role required.')
            }

            const redirectPath = role === 'super_admin' ? '/admin-console' : '/operator'
            window.location.href = redirectPath
        } catch (err: any) {
            setError(err.message || 'Invalid credentials')
            setIsSubmitting(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-black">
                <Loader2 className="h-6 w-6 text-primary animate-spin" />
            </div>
        )
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-[#050505] px-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <h1 className="text-2xl font-bold text-white tracking-tight">MailSmith</h1>
                    <p className="text-zinc-500 text-sm mt-1">Admin Console Login</p>
                </div>

                <Card className="bg-zinc-950 border-zinc-800 shadow-xl rounded-xl">
                    <form onSubmit={onSubmit}>
                        <CardContent className="space-y-5 pt-8 px-6">
                            {error && (
                                <div className="rounded-md bg-red-950/20 border border-red-900/50 p-3 text-xs text-red-400 font-medium">
                                    {error}
                                </div>
                            )}

                            <div className="space-y-2">
                                <Label htmlFor="email" className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Internal Email</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Mail className="h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <Input
                                        id="email"
                                        name="email"
                                        type="email"
                                        placeholder="admin@mailsmith.com"
                                        className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-primary focus:border-primary rounded-lg text-sm transition-all"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="password" className="text-[11px] font-semibold text-zinc-500 uppercase tracking-wider">Authentication Key</Label>
                                <div className="relative group">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-4 w-4 text-zinc-600 group-focus-within:text-primary transition-colors" />
                                    </div>
                                    <Input
                                        id="password"
                                        name="password"
                                        type="password"
                                        placeholder="••••••••"
                                        className="pl-10 h-11 bg-zinc-900/50 border-zinc-800 text-white placeholder:text-zinc-700 focus:ring-1 focus:ring-primary focus:border-primary rounded-lg transition-all"
                                        required
                                        disabled={isSubmitting}
                                    />
                                </div>
                            </div>
                        </CardContent>

                        <CardFooter className="pt-6 pb-8 px-6">
                            <Button
                                type="submit"
                                className="w-full h-11 bg-primary hover:bg-primary/90 text-white font-semibold rounded-lg transition-all active:scale-[0.98]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? (
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                    "Continue to Console"
                                )}
                            </Button>
                        </CardFooter>
                    </form>
                </Card>

                <div className="mt-8 flex items-center justify-center gap-2">
                    <div className="h-0.5 w-6 bg-zinc-900" />
                    <p className="text-zinc-600 text-[10px] uppercase tracking-widest font-bold">
                        Secure Authentication
                    </p>
                    <div className="h-0.5 w-6 bg-zinc-900" />
                </div>
            </div>
        </div>
    )
}
