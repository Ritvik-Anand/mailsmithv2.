'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Zap, Loader2, ShieldCheck, Lock } from 'lucide-react'

export default function AdminLoginPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState('')

    async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault()
        setIsLoading(true)
        setError('')

        const formData = new FormData(event.currentTarget)
        const password = formData.get('password') as string

        // Secure Admin Login with Key
        if (password === 'Rv@129') {
            // Set simple cookie for frontend-only auth demo
            document.cookie = "admin_access=true; path=/; max-age=3600"

            await new Promise((resolve) => setTimeout(resolve, 1000))
            router.push('/admin')
        } else {
            await new Promise((resolve) => setTimeout(resolve, 500))
            setError('Invalid access key')
            setIsLoading(false)
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 px-4">
            {/* Ambient glow effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-40 -right-40 w-80 h-80 bg-rose-500/10 rounded-full blur-3xl opacity-50" />
                <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-amber-500/10 rounded-full blur-3xl opacity-50" />
            </div>

            <Card className="w-full max-w-md relative backdrop-blur-xl bg-zinc-900/50 border-zinc-800 shadow-2xl">
                <CardHeader className="space-y-1 text-center">
                    <div className="flex justify-center mb-4">
                        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-zinc-800 border border-zinc-700 shadow-inner group transition-all hover:border-zinc-500">
                            <ShieldCheck className="h-7 w-7 text-zinc-400 group-hover:text-zinc-100 transition-colors" />
                        </div>
                    </div>
                    <CardTitle className="text-2xl font-bold tracking-tight text-zinc-100">Command Center</CardTitle>
                    <CardDescription className="text-zinc-500 text-base">
                        System Administrator Authentication
                    </CardDescription>
                </CardHeader>
                <form onSubmit={onSubmit}>
                    <CardContent className="space-y-6 py-6">
                        {error && (
                            <div className="rounded-xl bg-rose-500/10 border border-rose-500/20 p-4 text-sm text-rose-400 font-medium">
                                {error}
                            </div>
                        )}

                        <div className="space-y-3">
                            <Label htmlFor="password" className="text-zinc-400 ml-1">Access Key</Label>
                            <div className="relative">
                                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
                                <Input
                                    id="password"
                                    name="password"
                                    type="password"
                                    placeholder="••••••••••••"
                                    className="pl-11 h-12 bg-zinc-800/50 border-zinc-700/50 text-zinc-100 placeholder:text-zinc-700 focus:border-zinc-500 focus:ring-zinc-500/20 rounded-xl transition-all"
                                    required
                                    autoFocus
                                    disabled={isLoading}
                                />
                            </div>
                        </div>
                    </CardContent>

                    <CardFooter className="flex flex-col space-y-4 pb-8">
                        <Button
                            type="submit"
                            className="w-full h-12 bg-zinc-100 text-zinc-950 hover:bg-white font-semibold rounded-xl transition-all active:scale-[0.98]"
                            disabled={isLoading}
                        >
                            {isLoading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                "Initiate Session"
                            )}
                        </Button>

                        <div className="flex items-center justify-center gap-2 text-xs font-medium text-zinc-600 uppercase tracking-widest pt-2">
                            <Zap className="h-3 w-3" />
                            MailSmith v2 Operations
                        </div>
                    </CardFooter>
                </form>
            </Card>

            <div className="absolute bottom-6 text-center text-[10px] text-zinc-700 uppercase tracking-tighter">
                Highly encrypted environment. Unauthorized access logged.
            </div>
        </div>
    )
}
