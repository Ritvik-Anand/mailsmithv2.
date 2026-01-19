import { createClient } from '@supabase/supabase-js'

/**
 * Admin client that bypasses RLS.
 * Use ONLY in server-side contexts where RLS is not appropriate (e.g. webhooks, background jobs).
 */
export function createAdminClient() {
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!
    )
}
