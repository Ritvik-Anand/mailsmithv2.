'use client'

import { useState, useEffect } from 'react'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Megaphone, Zap, ArrowRight, X } from 'lucide-react'
import { getLatestBroadcast } from '@/server/actions/notifications'
import { Notification } from '@/types'

export default function BroadcastPopup({ data }: { data: Notification | null }) {
    const [open, setOpen] = useState(false)

    useEffect(() => {
        if (!data) return

        // Check if user has already seen/dismissed this specific broadcast
        const dismissedId = localStorage.getItem('last_dismissed_broadcast')
        if (dismissedId !== data.id) {
            setOpen(true)
        }
    }, [data])

    const handleDismiss = () => {
        if (data) {
            localStorage.setItem('last_dismissed_broadcast', data.id)
        }
        setOpen(false)
    }

    if (!data) return null

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent className="sm:max-w-[500px] border-primary/20 bg-zinc-950 p-0 overflow-hidden shadow-2xl">
                {/* Decorative background */}
                <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none -mr-10 -mt-10">
                    <Megaphone className="h-48 w-48 text-primary rotate-12" />
                </div>

                <div className="relative p-8 space-y-6">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 mb-6">
                        <Megaphone className="h-6 w-6 text-primary" />
                    </div>

                    <DialogHeader className="space-y-4">
                        <DialogTitle className="text-3xl font-bold tracking-tight text-foreground leading-tight">
                            {data.title}
                        </DialogTitle>
                        <DialogDescription className="text-foreground/60 text-lg leading-relaxed">
                            {data.message}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="flex flex-wrap gap-2 pt-2">
                        <div className="flex items-center gap-2 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-bold uppercase tracking-wider text-primary border border-primary/20">
                            <Zap className="h-3 w-3" />
                            System Update
                        </div>
                        <div className="flex items-center gap-2 px-3 py-1 bg-foreground/5 rounded-full text-[10px] font-bold uppercase tracking-wider text-foreground/40 border border-border">
                            {new Date(data.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </div>
                    </div>
                </div>

                <DialogFooter className="p-8 pt-0 flex !justify-between gap-4">
                    <Button
                        variant="ghost"
                        onClick={handleDismiss}
                        className="text-foreground/40 hover:text-foreground hover:bg-foreground/5"
                    >
                        Dismiss
                    </Button>
                    <Button
                        onClick={handleDismiss}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg shadow-primary/20 px-8"
                    >
                        Acknowledge
                        <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
