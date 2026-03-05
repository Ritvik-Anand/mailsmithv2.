'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import type { InboxEmail } from '@/server/actions/inbox'
import { replyToInboxEmail, updateLeadStatus } from '@/server/actions/inbox'
import { createClient } from '@/lib/supabase/client'
import {
    Inbox,
    RefreshCw,
    Search,
    Reply,
    Send,
    X,
    ChevronDown,
    Clock,
    User,
    Mail,
    AlertCircle,
    CheckCircle2,
    Loader2,
    MailOpen,
    ThumbsUp,
    ThumbsDown,
    Calendar,
    Ban,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

// =============================================================================
// INTENT LABEL BADGE — uses live colors from Instantly /lead-labels
// =============================================================================

function IntentBadge({ label, color, className }: {
    label: string
    color: string | null
    className?: string
}) {
    // Convert Instantly hex color to a semi-transparent badge style
    const style = color ? {
        backgroundColor: `${color}22`,   // 13% opacity
        color,
        borderColor: `${color}44`,       // 27% opacity
    } : undefined

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium border',
                !color && 'bg-foreground/10 text-foreground/50 border-foreground/10',
                className
            )}
            style={style}
        >
            {label}
        </span>
    )
}

// =============================================================================
// ROOT LAYOUT
// =============================================================================

interface InboxLayoutProps {
    initialEmails: InboxEmail[]
    accounts: string[]
}

export function InboxLayout({ initialEmails, accounts }: InboxLayoutProps) {
    const [emails, setEmails] = useState<InboxEmail[]>(initialEmails)
    const [selectedId, setSelectedId] = useState<string | null>(initialEmails[0]?.id ?? null)
    const [search, setSearch] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastPolled, setLastPolled] = useState(new Date().toISOString())

    const filtered = emails.filter(e => {
        if (!search) return true
        const q = search.toLowerCase()
        return (
            e.fromAddress.toLowerCase().includes(q) ||
            e.fromName.toLowerCase().includes(q) ||
            e.subject.toLowerCase().includes(q) ||
            e.bodyPreview.toLowerCase().includes(q)
        )
    })

    const selected = emails.find(e => e.id === selectedId) ?? filtered[0] ?? null

    // ── Poll every 30s for new emails (fallback when webhook is not firing) ──
    const poll = useCallback(async () => {
        try {
            const res = await fetch(`/api/inbox?since=${encodeURIComponent(lastPolled)}`)
            const data = await res.json()
            if (data.success && data.emails?.length > 0) {
                setEmails(prev => {
                    const existingIds = new Set(prev.map(e => e.id))
                    const fresh = (data.emails as InboxEmail[]).filter(e => !existingIds.has(e.id))
                    return [...fresh, ...prev]
                })
                setLastPolled(new Date().toISOString())
            }
        } catch { /* silent */ }
    }, [lastPolled])

    useEffect(() => {
        const id = setInterval(poll, 30_000)
        return () => clearInterval(id)
    }, [poll])

    // ── Supabase Realtime — instant updates when webhook fires ─────────────
    useEffect(() => {
        const supabase = createClient()
        const channel = supabase
            .channel('inbox-broadcast')
            .on('broadcast', { event: 'new_reply' }, () => {
                // Webhook fired — poll immediately to get the new email
                poll()
            })
            .subscribe()
        return () => { supabase.removeChannel(channel) }
    }, [poll])

    // ── Manual refresh ────────────────────────────────────────────────────────
    const refresh = async () => {
        setIsRefreshing(true)
        try {
            // Re-fetch page by reloading server data
            const res = await fetch('/api/inbox?since=2020-01-01T00:00:00Z')
            const data = await res.json()
            if (data.success) {
                setEmails(data.emails ?? [])
                setLastPolled(new Date().toISOString())
            }
        } catch { /* ignore */ }
        setIsRefreshing(false)
    }

    if (accounts.length === 0) return <NoAccountsState />

    return (
        <div className="flex h-full min-h-[calc(100vh-13rem)] rounded-2xl overflow-hidden border border-foreground/5 bg-foreground/[0.01]">

            {/* ── LEFT: Email list ── */}
            <div className="w-[320px] shrink-0 flex flex-col border-r border-foreground/5">

                {/* Header */}
                <div className="px-4 pt-4 pb-3 border-b border-foreground/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-foreground/60 uppercase tracking-wider">
                            Replies
                        </span>
                        <button
                            onClick={refresh}
                            disabled={isRefreshing}
                            className="text-foreground/30 hover:text-foreground transition-colors"
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        </button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/25" />
                        <input
                            type="text"
                            placeholder="Search…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-foreground/[0.04] border border-foreground/[0.08] rounded-lg pl-9 pr-8 py-2 text-sm text-foreground placeholder:text-foreground/25 focus:outline-none focus:border-primary/40"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground/25 hover:text-foreground"
                            >
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <EmptyList search={search} />
                    ) : (
                        filtered.map(email => (
                            <EmailRow
                                key={email.id}
                                email={email}
                                isActive={email.id === (selected?.id)}
                                onClick={() => setSelectedId(email.id)}
                            />
                        ))
                    )}
                </div>

                {/* Footer */}
                <div className="px-4 py-2.5 border-t border-foreground/5">
                    <p className="text-[11px] text-foreground/25">
                        {emails.length} {emails.length === 1 ? 'reply' : 'replies'} · {accounts.length} accounts
                    </p>
                </div>
            </div>

            {/* ── RIGHT: Thread + Reply ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {selected
                    ? <EmailDetail
                        email={selected}
                        accounts={accounts}
                        onReplySent={() => {
                            setEmails(prev => prev.map(e => e.id === selected.id ? { ...e, isRead: true } : e))
                        }}
                        onLabelChange={(label, color) => {
                            setEmails(prev => prev.map(e =>
                                e.id === selected.id
                                    ? { ...e, interestLabel: label, interestColor: color }
                                    : e
                            ))
                        }}
                    />
                    : <EmptySelection />
                }
            </div>
        </div>
    )
}

// =============================================================================
// EMAIL ROW
// =============================================================================

function EmailRow({ email, isActive, onClick }: {
    email: InboxEmail
    isActive: boolean
    onClick: () => void
}) {
    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left px-4 py-3.5 border-b border-foreground/[0.04] transition-all group',
                isActive
                    ? 'bg-primary/10 border-l-[2px] border-l-primary'
                    : 'hover:bg-foreground/[0.025] border-l-[2px] border-l-transparent'
            )}
        >
            <div className="flex items-start gap-2.5">
                {/* Unread dot */}
                <span className={cn(
                    'mt-[5px] h-1.5 w-1.5 shrink-0 rounded-full',
                    !email.isRead ? 'bg-primary' : 'bg-transparent'
                )} />

                <div className="flex-1 min-w-0 space-y-0.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className={cn(
                            'text-sm truncate',
                            !email.isRead ? 'font-semibold text-foreground' : 'text-foreground/60'
                        )}>
                            {email.fromName !== email.fromAddress
                                ? email.fromName
                                : email.fromAddress.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-foreground/25 tabular-nums shrink-0">
                            {formatRelative(email.timestamp)}
                        </span>
                    </div>

                    <p className={cn(
                        'text-xs truncate',
                        !email.isRead ? 'text-foreground/70' : 'text-foreground/40'
                    )}>
                        {email.subject}
                    </p>

                    <p className="text-[11px] text-foreground/30 truncate">
                        {email.bodyPreview}
                    </p>

                    {email.interestLabel && (
                        <IntentBadge
                            label={email.interestLabel}
                            color={email.interestColor}
                            className="mt-1"
                        />
                    )}
                </div>
            </div>
        </button>
    )
}

// =============================================================================
// EMAIL DETAIL + REPLY COMPOSER
// =============================================================================

function EmailDetail({ email, accounts, onReplySent, onLabelChange }: {
    email: InboxEmail
    accounts: string[]
    onReplySent: () => void
    onLabelChange: (label: string | null, color: string | null) => void
}) {
    const [replyText, setReplyText] = useState('')
    const [fromAccount, setFromAccount] = useState(
        email.eaccount && accounts.includes(email.eaccount) ? email.eaccount : accounts[0] ?? ''
    )
    const [showAccountPicker, setShowAccountPicker] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [statusPending, setStatusPending] = useState<number | null>(null)
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    // Lead status buttons definition (numeric value matches Instantly)
    const STATUS_BUTTONS = [
        { value: 1, label: 'Interested', icon: ThumbsUp, color: '#22c55e' },
        { value: 2, label: 'Meeting Booked', icon: Calendar, color: '#3b82f6' },
        { value: 0, label: 'Not Interested', icon: ThumbsDown, color: '#ef4444' },
        { value: 4, label: 'Do Not Contact', icon: Ban, color: '#dc2626' },
    ]

    const handleStatusClick = (value: number, label: string, color: string) => {
        if (statusPending !== null) return
        setStatusPending(value)
        // Optimistic update immediately
        onLabelChange(label, color)
        updateLeadStatus({ leadEmail: email.fromAddress, interestValue: value })
            .then(res => {
                if (!res.success) onLabelChange(email.interestLabel, email.interestColor) // revert
            })
            .finally(() => setStatusPending(null))
    }

    useEffect(() => {
        setReplyText('')
        setStatus('idle')
        setFromAccount(
            email.eaccount && accounts.includes(email.eaccount) ? email.eaccount : accounts[0] ?? ''
        )
    }, [email.id, email.eaccount, accounts])

    const send = () => {
        if (!replyText.trim() || !fromAccount) return
        startTransition(async () => {
            const result = await replyToInboxEmail({
                replyToId: email.id,
                fromAccount,
                subject: `Re: ${email.subject}`,
                body: replyText.trim(),
            })
            if (result.success) {
                setStatus('success')
                setReplyText('')
                onReplySent()
                setTimeout(() => setStatus('idle'), 3000)
            } else {
                setStatus('error')
                setErrorMsg(result.error ?? 'Failed to send')
            }
        })
    }

    return (
        <div className="flex flex-col h-full overflow-hidden">

            {/* ── Email header ── */}
            <div className="px-6 py-5 border-b border-foreground/5">
                <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1 min-w-0">
                        <h2 className="text-base font-semibold text-foreground leading-snug mb-1.5">
                            {email.subject}
                        </h2>
                        {email.interestLabel && (
                            <IntentBadge
                                label={email.interestLabel}
                                color={email.interestColor}
                                className="px-2 py-0.5 rounded-full text-[11px]"
                            />
                        )}
                    </div>
                </div>

                {/* Lead status one-click buttons */}
                <div className="flex items-center gap-1.5 mb-3 flex-wrap">
                    <span className="text-[10px] text-foreground/30 uppercase tracking-wider mr-1 flex items-center gap-1">
                        <Zap className="h-2.5 w-2.5" /> Label lead:
                    </span>
                    {STATUS_BUTTONS.map(btn => {
                        const isActive = email.interestLabel === btn.label
                        const isLoading = statusPending === btn.value
                        return (
                            <button
                                key={btn.value}
                                onClick={() => handleStatusClick(btn.value, btn.label, btn.color)}
                                disabled={statusPending !== null}
                                title={btn.label}
                                className={cn(
                                    'flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-medium border transition-all',
                                    isActive
                                        ? 'text-foreground border-transparent'
                                        : 'text-foreground/40 border-foreground/10 hover:border-foreground/20 hover:text-foreground/70',
                                    statusPending !== null && !isLoading && 'opacity-40 cursor-not-allowed'
                                )}
                                style={isActive ? {
                                    backgroundColor: `${btn.color}30`,
                                    borderColor: `${btn.color}60`,
                                    color: btn.color,
                                } : undefined}
                            >
                                {isLoading
                                    ? <Loader2 className="h-3 w-3 animate-spin" />
                                    : <btn.icon className="h-3 w-3" />
                                }
                                {btn.label}
                            </button>
                        )
                    })}
                </div>

                <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-foreground/40">
                    <span className="flex items-center gap-1.5">
                        <User className="h-3 w-3" />
                        <span className="text-foreground/70">{email.fromName}</span>
                        {email.fromName !== email.fromAddress && (
                            <span className="text-foreground/30">‹{email.fromAddress}›</span>
                        )}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Mail className="h-3 w-3" />
                        {email.eaccount || email.toAddresses[0]}
                    </span>
                    <span className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3" />
                        {formatFull(email.timestamp)}
                    </span>
                </div>
            </div>

            {/* ── Body ── */}
            <div className="flex-1 overflow-y-auto px-6 py-5">
                <div
                    className="text-sm text-foreground/65 leading-relaxed"
                    dangerouslySetInnerHTML={{ __html: sanitize(email.body) }}
                />
            </div>

            {/* ── Reply composer ── */}
            <div className="border-t border-foreground/5 px-5 py-4 space-y-2.5">
                {/* From selector */}
                {accounts.length > 1 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowAccountPicker(p => !p)}
                            className="flex items-center gap-1.5 text-xs text-foreground/40 hover:text-foreground/70 transition-colors"
                        >
                            <Reply className="h-3 w-3" />
                            Replying as <span className="text-foreground/70 font-medium">{fromAccount}</span>
                            <ChevronDown className={cn('h-3 w-3 transition-transform', showAccountPicker && 'rotate-180')} />
                        </button>
                        {showAccountPicker && (
                            <div className="absolute bottom-full mb-2 z-50 rounded-xl bg-zinc-900 border border-foreground/10 shadow-2xl overflow-hidden min-w-[260px]">
                                {accounts.map(acc => (
                                    <button
                                        key={acc}
                                        onClick={() => { setFromAccount(acc); setShowAccountPicker(false) }}
                                        className={cn(
                                            'w-full text-left px-4 py-2.5 text-sm transition-colors',
                                            acc === fromAccount ? 'bg-primary/20 text-foreground' : 'text-foreground/50 hover:bg-foreground/5 hover:text-foreground'
                                        )}
                                    >
                                        {acc}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Textarea */}
                <div className={cn(
                    'rounded-xl border bg-foreground/[0.03] overflow-hidden transition-all',
                    status === 'error' ? 'border-red-500/40' : 'border-foreground/10 focus-within:border-primary/40'
                )}>
                    <textarea
                        value={replyText}
                        onChange={e => { setReplyText(e.target.value); if (status !== 'idle') setStatus('idle') }}
                        placeholder="Write your reply…"
                        rows={4}
                        className="w-full bg-transparent px-4 pt-3 pb-1 text-sm text-foreground/80 placeholder:text-foreground/25 resize-none focus:outline-none"
                    />
                    <div className="flex items-center justify-between px-3 pb-3">
                        <div>
                            {status === 'success' && (
                                <span className="flex items-center gap-1.5 text-xs text-emerald-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" /> Reply sent!
                                </span>
                            )}
                            {status === 'error' && (
                                <span className="flex items-center gap-1.5 text-xs text-red-400">
                                    <AlertCircle className="h-3.5 w-3.5" /> {errorMsg}
                                </span>
                            )}
                        </div>
                        <Button
                            size="sm"
                            onClick={send}
                            disabled={!replyText.trim() || isPending || !fromAccount}
                            className="bg-primary hover:bg-primary/90 gap-1.5 text-xs h-8"
                        >
                            {isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                            {isPending ? 'Sending…' : 'Send Reply'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// EMPTY STATES
// =============================================================================

function EmptyList({ search }: { search: string }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <Inbox className="h-8 w-8 text-foreground/10 mb-3" />
            <p className="text-sm text-foreground/40">
                {search ? `No results for "${search}"` : 'No replies yet'}
            </p>
            <p className="text-xs text-foreground/25 mt-1">
                {search ? 'Try a different search.' : 'Replies from your campaigns will appear here.'}
            </p>
        </div>
    )
}

function EmptySelection() {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <MailOpen className="h-10 w-10 text-foreground/10 mb-3" />
            <p className="text-sm text-foreground/35">Select a reply to read it</p>
        </div>
    )
}

function NoAccountsState() {
    return (
        <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
            <Inbox className="h-10 w-10 text-foreground/10 mb-4" />
            <h3 className="text-base font-semibold text-foreground mb-2">No Outreach Accounts</h3>
            <p className="text-sm text-foreground/40 max-w-xs">
                No email accounts have been assigned to your organisation yet. Contact your operator.
            </p>
        </div>
    )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatRelative(iso: string): string {
    const diff = Date.now() - new Date(iso).getTime()
    const m = diff / 60000
    const h = diff / 3600000
    const d = diff / 86400000
    if (m < 1) return 'just now'
    if (h < 1) return `${Math.floor(m)}m`
    if (d < 1) return `${Math.floor(h)}h`
    if (d < 7) return `${Math.floor(d)}d`
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFull(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric',
        hour: 'numeric', minute: '2-digit',
    })
}

function sanitize(html: string): string {
    if (!html) return ''
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '')
}
