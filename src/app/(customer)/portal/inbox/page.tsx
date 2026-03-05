import { getInboxEmails } from '@/server/actions/inbox'
import { InboxLayout } from '@/components/inbox/InboxLayout'
import { Inbox, Mail } from 'lucide-react'

export const metadata = {
    title: 'Inbox — MailSmith',
    description: 'Read and reply to email responses from your outreach campaigns.',
}

export default async function InboxPage() {
    const result = await getInboxEmails({ type: 'reply', limit: 50 })

    const emails = result.success ? (result.emails ?? []) : []
    const accounts = result.success ? (result.accounts ?? []) : []

    return (
        <div className="space-y-6">
            {/* Page header */}
            <div className="flex items-center justify-between">
                <div className="space-y-1">
                    <div className="flex items-center gap-3">
                        <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
                            <Inbox className="h-5 w-5 text-primary" />
                        </div>
                        <h1 className="text-2xl font-bold text-foreground">Inbox</h1>
                    </div>
                    <p className="text-sm text-foreground/40 pl-12">
                        View and reply to responses from your outreach campaigns
                    </p>
                </div>

                {/* Stats pill */}
                {accounts.length > 0 && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-foreground/[0.03] border border-foreground/5">
                        <Mail className="h-4 w-4 text-foreground/40" />
                        <span className="text-sm text-foreground/60">
                            <span className="text-foreground font-medium">{emails.length}</span> email{emails.length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-foreground/20">·</span>
                        <span className="text-sm text-foreground/60">
                            <span className="text-foreground font-medium">{accounts.length}</span> account{accounts.length !== 1 ? 's' : ''}
                        </span>
                    </div>
                )}
            </div>

            {/* Error state */}
            {!result.success && (
                <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
                    Could not load inbox: {result.error}. Please refresh the page.
                </div>
            )}

            {/* Main inbox UI */}
            <InboxLayout initialEmails={emails} accounts={accounts} />
        </div>
    )
}
