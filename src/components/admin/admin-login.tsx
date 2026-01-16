'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { validateAdminCredentials } from '@/server/actions/admin-team'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Loader2, ShieldCheck, Lock, Mail } from 'lucide-react'

export function AdminLogin() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        const email = formData.get('email') as string
        const password = formData.get('password') as string

        try {
            const result = await validateAdminCredentials(email, password)

            if (result.success) {
                // Set the admin access cookie
                document.cookie = `admin_access=true; path=/; max-age=259200; samesite=lax`

                // Also store specific admin info if needed
                if (result.admin) {
                    document.cookie = `admin_role=${result.admin.role}; path=/; max-age=259200; samesite=lax`
                    document.cookie = `admin_name=${encodeURIComponent(result.admin.full_name)}; path=/; max-age=259200; samesite=lax`
                    document.cookie = `admin_email=${encodeURIComponent(result.admin.email)}; path=/; max-age=259200; samesite=lax`
                }

                await new Promise((resolve) => setTimeout(resolve, 800))
                window.location.reload()
            } else {
                setError(result.error || 'Invalid credentials or unauthorized access')
            }
        } catch (err: any) {
            setError('System authentication failure. Please try again later.')
            console.error(err)
        } finally {
            setIsLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-zinc-950 px-4">
            {/* Ambient glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-500/10 rounded-full blur-[120px] opacity-40" />
                <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-amber-500/10 rounded-full blur-[120px] opacity-40" />
            </div>

            <Card className="w-full max-w-md relative backdrop-blur-3xl bg-zinc-900/40 border-zinc-800/50 shadow-[0_0_50px_-12px_rgba(0,0,0,0.5)]">
                <CardHeader className="space-y-1 text-center pb-2">
                    <div className="flex justify-center mb-6">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-b from-zinc-800 to-zinc-900 border border-zinc-700/50 shadow-2xl group transition-all hover:border-zinc-500/50">
                            <ShieldCheck className="h-8 w-8 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-zinc-100">Command Center</CardTitle>
                    <CardDescription className="text-zinc-500 text-sm">
                        Enterprise Access Protocol
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-5 py-6">
                        {error && (
                            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 font-medium animate-in fade-in slide-in-from-top-2 duration-300">
                                {error}
                            </div>
                        )}

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-zinc-500 ml-1 text-[10px] uppercase tracking-widest font-bold">Admin Email</Label>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    placeholder="admin@acquifix.com"
                                    className="pl-11 h-12 bg-zinc-800/20 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-800 focus:border-zinc-500 focus:ring-zinc-500/20 rounded-xl transition-all"
                                    required
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-zinc-500 ml-1 text-[10px] uppercase tracking-widest font-bold">System Access Key</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    className="pl-11 h-12 bg-zinc-800/20 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-800 focus:border-zinc-500 focus:ring-zinc-500/20 rounded-xl transition-all"
                                    required
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <Button
                            type="submit"
                            className="w-full h-12 bg-zinc-100 text-zinc-950 hover:bg-white font-bold rounded-xl transition-all active:scale-[0.98] shadow-lg shadow-white/5"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Initiate Session"
                            )}
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-[10px] font-bold text-zinc-700 uppercase tracking-[0.2em] pt-2">
                            <Image
                                src="/logo.png"
                                alt="MailSmith"
                                width={12}
                                height={12}
                                className="object-contain opacity-50 grayscale"
                            />
                            MailSmith Security Protocol
                        </div>
                    </CardFooter>
                </form>
            </Card>

            <div className="absolute bottom-8 text-center text-[10px] text-zinc-800 uppercase tracking-widest font-medium">
                Vault Access Restricted to Root Admins Only
            </div>
        </div>
    )
}
