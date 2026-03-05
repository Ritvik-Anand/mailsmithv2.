import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * POST /api/webhooks/instantly
 * Receives real-time push events from Instantly (e.g. reply_received).
 * Broadcasts to Supabase Realtime so connected inbox tabs update immediately.
 */
export async function POST(req: NextRequest) {
    try {
        const payload = await req.json()

        // Instantly sends events with event_type and data fields
        const eventType = payload?.event_type ?? payload?.type ?? payload?.event
        const emailData = payload?.data ?? payload?.email ?? payload

        // Only process inbound replies
        if (eventType !== 'reply_received' && eventType !== 'email_reply') {
            return NextResponse.json({ ok: true, skipped: true })
        }

        // Broadcast via Supabase Realtime channel so connected clients pick it up instantly
        const supabase = createAdminClient()
        await supabase.channel('inbox-broadcast').send({
            type: 'broadcast',
            event: 'new_reply',
            payload: {
                event_type: eventType,
                email: emailData,
                received_at: new Date().toISOString(),
            },
        })

        return NextResponse.json({ ok: true })
    } catch (error: any) {
        console.error('[Webhook] instantly handler error:', error)
        return NextResponse.json({ ok: false, error: error.message }, { status: 500 })
    }
}

// Allow Instantly to verify the endpoint is reachable via GET
export async function GET() {
    return NextResponse.json({ ok: true, endpoint: 'MailSmith Instantly Webhook' })
}
