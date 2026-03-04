'use client'

import { useState, useEffect, useCallback, useTransition } from 'react'
import type { InboxEmail } from '@/server/actions/inbox'
import { replyToInboxEmail } from '@/server/actions/inbox'
import {
    Inbox,
    RefreshCw,
    Search,
    Filter,
    Mail,
    MailOpen,
    Reply,
    Send,
    X,
    ChevronDown,
    Clock,
    User,
    Tag,
    AlertCircle,
    CheckCircle2,
    Loader2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'

// =============================================================================
// TYPES
// =============================================================================

type FilterType = 'all' | 'unread' | 'replied'

interface InboxLayoutProps {
    initialEmails: InboxEmail[]
    accounts: string[]
}

// =============================================================================
// INTENT LABEL CONFIG
// =============================================================================

const INTENT_COLORS: Record<string, string> = {
    Interested: 'bg-green-500/15 text-green-400 border-green-500/20',
    'Not Interested': 'bg-red-500/15 text-red-400 border-red-500/20',
    'Meeting Booked': 'bg-blue-500/15 text-blue-400 border-blue-500/20',
    'Out of Office': 'bg-amber-500/15 text-amber-400 border-amber-500/20',
    'Do Not Contact': 'bg-red-700/15 text-red-300 border-red-700/20',
}

// =============================================================================
// ROOT LAYOUT
// =============================================================================

export function InboxLayout({ initialEmails, accounts }: InboxLayoutProps) {
    const [emails, setEmails] = useState<InboxEmail[]>(initialEmails)
    const [selectedId, setSelectedId] = useState<string | null>(
        initialEmails[0]?.id ?? null
    )
    const [filter, setFilter] = useState<FilterType>('all')
    const [search, setSearch] = useState('')
    const [isRefreshing, setIsRefreshing] = useState(false)
    const [lastPolled, setLastPolled] = useState(new Date().toISOString())

    // ── Derived: filtered email list ──────────────────────────────────────────
    const filtered = emails.filter(email => {
        if (filter === 'unread' && email.isRead) return false
        if (filter === 'replied' && !email.isReply) return false
        if (search) {
            const q = search.toLowerCase()
            return (
                email.fromAddress.toLowerCase().includes(q) ||
                email.fromName.toLowerCase().includes(q) ||
                email.subject.toLowerCase().includes(q) ||
                email.bodyPreview.toLowerCase().includes(q)
            )
        }
        return true
    })

    const selected = emails.find(e => e.id === selectedId) ?? null

    // ── Poll every 30 seconds for new emails ──────────────────────────────────
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
        } catch {
            // Silent fail — next poll will pick up any missed emails
        }
    }, [lastPolled])

    useEffect(() => {
        const interval = setInterval(poll, 30_000)
        return () => clearInterval(interval)
    }, [poll])

    // ── Manual refresh ────────────────────────────────────────────────────────
    const refresh = async () => {
        setIsRefreshing(true)
        try {
            const res = await fetch('/api/inbox?since=2020-01-01T00:00:00Z')
            const data = await res.json()
            if (data.success) {
                setEmails(data.emails ?? [])
                setLastPolled(new Date().toISOString())
            }
        } catch {
            // ignore
        } finally {
            setIsRefreshing(false)
        }
    }

    const unreadCount = emails.filter(e => !e.isRead).length

    // ── Empty state: no accounts ──────────────────────────────────────────────
    if (accounts.length === 0) {
        return <NoAccountsState />
    }

    return (
        <div className="flex h-full min-h-[calc(100vh-12rem)] rounded-2xl overflow-hidden border border-white/5 bg-white/[0.01]">
            {/* ── Left panel: email list ── */}
            <div className="w-[340px] shrink-0 flex flex-col border-r border-white/5">
                {/* Header */}
                <div className="p-4 border-b border-white/5 space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <h2 className="font-semibold text-white text-lg">Inbox</h2>
                            {unreadCount > 0 && (
                                <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1.5 text-[10px] font-bold text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-white/40 hover:text-white"
                            onClick={refresh}
                            disabled={isRefreshing}
                        >
                            <RefreshCw className={cn('h-4 w-4', isRefreshing && 'animate-spin')} />
                        </Button>
                    </div>

                    {/* Search */}
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-white/30" />
                        <input
                            type="text"
                            placeholder="Search emails…"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:ring-1 focus:ring-primary/50"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white">
                                <X className="h-3.5 w-3.5" />
                            </button>
                        )}
                    </div>

                    {/* Filters */}
                    <div className="flex gap-1.5">
                        {(['all', 'unread', 'replied'] as FilterType[]).map(f => (
                            <button
                                key={f}
                                onClick={() => setFilter(f)}
                                className={cn(
                                    'flex-1 rounded-lg py-1.5 text-xs font-medium capitalize transition-all',
                                    filter === f
                                        ? 'bg-primary text-white'
                                        : 'text-white/40 hover:text-white hover:bg-white/5'
                                )}
                            >
                                {f}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Email list */}
                <div className="flex-1 overflow-y-auto">
                    {filtered.length === 0 ? (
                        <EmptyListState search={search} filter={filter} />
                    ) : (
                        filtered.map(email => (
                            <EmailListItem
                                key={email.id}
                                email={email}
                                isSelected={email.id === selectedId}
                                onClick={() => setSelectedId(email.id)}
                            />
                        ))
                    )}
                </div>

                {/* Footer: account info */}
                <div className="p-3 border-t border-white/5">
                    <p className="text-xs text-white/30">
                        {accounts.length} account{accounts.length !== 1 ? 's' : ''} •{' '}
                        {emails.length} email{emails.length !== 1 ? 's' : ''}
                    </p>
                </div>
            </div>

            {/* ── Right panel: thread / compose ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {selected ? (
                    <EmailThread
                        email={selected}
                        accounts={accounts}
                        onReplySent={(reply) => {
                            // Mark as read + prepend the sent reply optimistically
                            setEmails(prev =>
                                prev.map(e => e.id === selected.id ? { ...e, isRead: true } : e)
                            )
                        }}
                    />
                ) : (
                    <NoSelectionState />
                )}
            </div>
        </div>
    )
}

// =============================================================================
// EMAIL LIST ITEM
// =============================================================================

function EmailListItem({
    email,
    isSelected,
    onClick,
}: {
    email: InboxEmail
    isSelected: boolean
    onClick: () => void
}) {
    const time = formatTime(email.timestamp)
    const hasLabel = !!email.interestLabel
    const labelColor = email.interestLabel ? INTENT_COLORS[email.interestLabel] : ''

    return (
        <button
            onClick={onClick}
            className={cn(
                'w-full text-left px-4 py-3.5 border-b border-white/[0.04] transition-all',
                isSelected
                    ? 'bg-primary/10 border-l-2 border-l-primary'
                    : 'hover:bg-white/[0.03] border-l-2 border-l-transparent'
            )}
        >
            <div className="flex items-start gap-3">
                {/* Unread dot */}
                <div className="mt-1.5 shrink-0">
                    {!email.isRead ? (
                        <span className="block h-2 w-2 rounded-full bg-primary" />
                    ) : (
                        <span className="block h-2 w-2 rounded-full bg-transparent" />
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    {/* From + time */}
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                        <span className={cn(
                            'text-sm truncate',
                            !email.isRead ? 'font-semibold text-white' : 'font-medium text-white/70'
                        )}>
                            {email.fromName !== email.fromAddress
                                ? email.fromName
                                : email.fromAddress.split('@')[0]}
                        </span>
                        <span className="text-[10px] text-white/30 shrink-0">{time}</span>
                    </div>

                    {/* Subject */}
                    <p className={cn(
                        'text-xs truncate mb-1',
                        !email.isRead ? 'text-white/80' : 'text-white/50'
                    )}>
                        {email.subject}
                    </p>

                    {/* Preview */}
                    <p className="text-[11px] text-white/30 truncate">
                        {email.bodyPreview}
                    </p>

                    {/* Intent label */}
                    {hasLabel && (
                        <span className={cn(
                            'inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium border',
                            labelColor || 'bg-white/10 text-white/50 border-white/10'
                        )}>
                            <Tag className="h-2.5 w-2.5" />
                            {email.interestLabel}
                        </span>
                    )}
                </div>
            </div>
        </button>
    )
}

// =============================================================================
// EMAIL THREAD + REPLY COMPOSER
// =============================================================================

function EmailThread({
    email,
    accounts,
    onReplySent,
}: {
    email: InboxEmail
    accounts: string[]
    onReplySent: (reply: string) => void
}) {
    const [replyText, setReplyText] = useState('')
    const [selectedAccount, setSelectedAccount] = useState(
        email.eaccount && accounts.includes(email.eaccount) ? email.eaccount : accounts[0] ?? ''
    )
    const [showAccountPicker, setShowAccountPicker] = useState(false)
    const [isPending, startTransition] = useTransition()
    const [status, setStatus] = useState<'idle' | 'success' | 'error'>('idle')
    const [errorMsg, setErrorMsg] = useState('')

    // Reset state when email changes
    useEffect(() => {
        setReplyText('')
        setStatus('idle')
        setErrorMsg('')
        setSelectedAccount(
            email.eaccount && accounts.includes(email.eaccount) ? email.eaccount : accounts[0] ?? ''
        )
    }, [email.id, email.eaccount, accounts])

    const sendReply = () => {
        if (!replyText.trim() || !selectedAccount) return

        startTransition(async () => {
            setStatus('idle')
            const result = await replyToInboxEmail({
                replyToId: email.id,
                fromAccount: selectedAccount,
                subject: `Re: ${email.subject}`,
                body: replyText.trim(),
            })

            if (result.success) {
                setStatus('success')
                setReplyText('')
                onReplySent(replyText)
                // Reset success badge after 3s
                setTimeout(() => setStatus('idle'), 3000)
            } else {
                setStatus('error')
                setErrorMsg(result.error ?? 'Failed to send reply')
            }
        })
    }

    return (
        <div className="flex flex-col h-full">
            {/* ── Email header ── */}
            <div className="p-6 border-b border-white/5 space-y-4">
                <div className="flex items-start justify-between gap-4">
                    <h3 className="text-lg font-semibold text-white leading-snug">
                        {email.subject}
                    </h3>
                    {email.interestLabel && (
                        <span className={cn(
                            'shrink-0 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border',
                            INTENT_COLORS[email.interestLabel] ?? 'bg-white/10 text-white/50 border-white/10'
                        )}>
                            <Tag className="h-3 w-3" />
                            {email.interestLabel}
                        </span>
                    )}
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/50">
                    <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-white/30" />
                        <span>
                            <span className="text-white/70">{email.fromName}</span>
                            {' — '}
                            <span className="text-white/40">{email.fromAddress}</span>
                        </span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Mail className="h-3.5 w-3.5 text-white/30" />
                        <span>to <span className="text-white/70">{selectedAccount || email.toAddresses[0]}</span></span>
                    </div>
                    <div className="flex items-center gap-2">
                        <Clock className="h-3.5 w-3.5 text-white/30" />
                        <span>{formatFullDate(email.timestamp)}</span>
                    </div>
                </div>
            </div>

            {/* ── Email body ── */}
            <div className="flex-1 overflow-y-auto p-6">
                <div
                    className="text-sm text-white/70 leading-relaxed whitespace-pre-wrap"
                    dangerouslySetInnerHTML={{
                        __html: sanitizeHtml(email.body || email.bodyPreview)
                    }}
                />
            </div>

            {/* ── Reply composer ── */}
            <div className="border-t border-white/5 p-5 space-y-3">
                {/* Account selector */}
                {accounts.length > 1 && (
                    <div className="relative">
                        <button
                            onClick={() => setShowAccountPicker(!showAccountPicker)}
                            className="flex items-center gap-2 text-xs text-white/50 hover:text-white/80 transition-colors"
                        >
                            <Mail className="h-3.5 w-3.5" />
                            <span>Replying as <span className="text-white/80 font-medium">{selectedAccount}</span></span>
                            <ChevronDown className={cn('h-3.5 w-3.5 transition-transform', showAccountPicker && 'rotate-180')} />
                        </button>

                        {showAccountPicker && (
                            <div className="absolute bottom-full mb-2 left-0 z-50 min-w-[280px] rounded-xl bg-zinc-900 border border-white/10 shadow-2xl overflow-hidden">
                                {accounts.map(acc => (
                                    <button
                                        key={acc}
                                        onClick={() => {
                                            setSelectedAccount(acc)
                                            setShowAccountPicker(false)
                                        }}
                                        className={cn(
                                            'w-full text-left px-4 py-2.5 text-sm transition-colors',
                                            acc === selectedAccount
                                                ? 'bg-primary/20 text-white'
                                                : 'text-white/60 hover:bg-white/5 hover:text-white'
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
                <div className="rounded-xl border border-white/10 bg-white/[0.03] overflow-hidden focus-within:border-primary/40 focus-within:ring-1 focus-within:ring-primary/20 transition-all">
                    <textarea
                        value={replyText}
                        onChange={e => {
                            setReplyText(e.target.value)
                            if (status === 'error') setStatus('idle')
                        }}
                        placeholder="Write your reply…"
                        rows={5}
                        className="w-full bg-transparent px-4 pt-3 pb-2 text-sm text-white placeholder:text-white/30 resize-none focus:outline-none"
                    />

                    {/* Toolbar */}
                    <div className="flex items-center justify-between px-3 pb-3">
                        <div className="flex items-center gap-2">
                            {status === 'success' && (
                                <span className="flex items-center gap-1.5 text-xs text-green-400">
                                    <CheckCircle2 className="h-3.5 w-3.5" />
                                    Reply sent!
                                </span>
                            )}
                            {status === 'error' && (
                                <span className="flex items-center gap-1.5 text-xs text-red-400">
                                    <AlertCircle className="h-3.5 w-3.5" />
                                    {errorMsg}
                                </span>
                            )}
                        </div>

                        <Button
                            onClick={sendReply}
                            disabled={!replyText.trim() || isPending || !selectedAccount}
                            size="sm"
                            className="bg-primary hover:bg-primary/90 gap-2"
                        >
                            {isPending ? (
                                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                            ) : (
                                <Send className="h-3.5 w-3.5" />
                            )}
                            {isPending ? 'Sending…' : 'Send Reply'}
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    )
}

// =============================================================================
// EMPTY / ZERO STATES
// =============================================================================

function NoAccountsState() {
    return (
        <div className="flex flex-col items-center justify-center h-[500px] text-center p-8">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/5 mb-4">
                <Inbox className="h-8 w-8 text-white/20" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No Outreach Accounts Yet</h3>
            <p className="text-sm text-white/40 max-w-xs">
                Your operator hasn't assigned any email accounts to your organisation yet.
                Replies will appear here once accounts are linked.
            </p>
        </div>
    )
}

function NoSelectionState() {
    return (
        <div className="flex flex-col items-center justify-center h-full text-center p-8">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/5 mb-4">
                <MailOpen className="h-7 w-7 text-white/20" />
            </div>
            <p className="text-sm font-medium text-white/40">Select an email to read it</p>
        </div>
    )
}

function EmptyListState({ search, filter }: { search: string; filter: FilterType }) {
    return (
        <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/5 mb-3">
                <Inbox className="h-6 w-6 text-white/20" />
            </div>
            <p className="text-sm font-medium text-white/50">
                {search ? `No emails matching "${search}"` : filter === 'unread' ? 'All caught up! No unread emails.' : 'No emails yet'}
            </p>
            <p className="text-xs text-white/30 mt-1">
                {search ? 'Try a different search term.' : 'Replies from your campaigns will appear here.'}
            </p>
        </div>
    )
}

// =============================================================================
// HELPERS
// =============================================================================

function formatTime(iso: string): string {
    const date = new Date(iso)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = diffMs / 3_600_000
    const diffDays = diffMs / 86_400_000

    if (diffHours < 1) return `${Math.floor(diffMs / 60000)}m ago`
    if (diffHours < 24) return `${Math.floor(diffHours)}h ago`
    if (diffDays < 7) return `${Math.floor(diffDays)}d ago`

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function formatFullDate(iso: string): string {
    return new Date(iso).toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
    })
}

/**
 * Very basic HTML sanitisation — strips script tags and dangerous attributes.
 * For production, replace with DOMPurify on the client.
 */
function sanitizeHtml(raw: string): string {
    if (!raw) return ''
    return raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/on\w+="[^"]*"/gi, '')
        .replace(/javascript:/gi, '')
}
