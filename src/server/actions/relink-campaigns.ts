'use server'

import { createAdminClient } from '@/lib/supabase/admin'
import { instantly } from '@/lib/instantly/client'
import { revalidatePath } from 'next/cache'

/**
 * Fetches all campaigns from Instantly and re-links them to local campaigns by name.
 * Fixes cases where instantly_campaign_id in the DB points to the wrong Instantly campaign.
 */
export async function relinkInstantlyCampaigns() {
    const supabase = createAdminClient()

    try {
        // 1. Get all local campaigns
        const { data: localCampaigns, error: localErr } = await supabase
            .from('campaigns')
            .select('id, name, instantly_campaign_id')

        if (localErr || !localCampaigns) {
            return { success: false, error: 'Failed to fetch local campaigns' }
        }

        // 2. Get all Instantly campaigns
        const response = await instantly.getSummaryStats()
        const instantlyCampaigns: any[] = Array.isArray(response)
            ? response
            : (response?.items || response?.data || [])

        if (!instantlyCampaigns || instantlyCampaigns.length === 0) {
            return { success: false, error: 'No campaigns returned from Instantly' }
        }

        console.log(`Instantly campaigns (${instantlyCampaigns.length}):`,
            instantlyCampaigns.map((c: any) => ({ id: c.id, name: c.name })))

        // 3. For each LOCAL campaign, find matching Instantly campaign by name
        const report: { name: string; old: string | null; new: string | null; status: string }[] = []

        for (const local of localCampaigns) {
            const match = instantlyCampaigns.find((ic: any) =>
                (ic.name ?? '').trim().toLowerCase() === (local.name ?? '').trim().toLowerCase()
            )

            if (!match) {
                report.push({ name: local.name, old: local.instantly_campaign_id, new: null, status: 'no_match' })
                continue
            }

            if (match.id === local.instantly_campaign_id) {
                report.push({ name: local.name, old: local.instantly_campaign_id, new: match.id, status: 'already_correct' })
                continue
            }

            // Mismatch found — update
            const { error: updateErr } = await supabase
                .from('campaigns')
                .update({ instantly_campaign_id: match.id } as any)
                .eq('id', local.id)

            if (updateErr) {
                report.push({ name: local.name, old: local.instantly_campaign_id, new: match.id, status: `error: ${updateErr.message}` })
            } else {
                console.log(`Re-linked "${local.name}": ${local.instantly_campaign_id} → ${match.id}`)
                report.push({ name: local.name, old: local.instantly_campaign_id, new: match.id, status: 'updated' })
            }
        }

        revalidatePath('/operator/campaigns')

        const updated = report.filter(r => r.status === 'updated')
        return {
            success: true,
            report,
            summary: `${updated.length} campaign(s) re-linked, ${report.filter(r => r.status === 'already_correct').length} already correct, ${report.filter(r => r.status === 'no_match').length} with no Instantly match.`
        }
    } catch (error: any) {
        console.error('Error in relinkInstantlyCampaigns:', error)
        return { success: false, error: error.message }
    }
}
