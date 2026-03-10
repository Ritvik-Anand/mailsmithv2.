/**
 * Instantly.ai API Client - Version 2
 * This client interacts with the master Instantly account using the V2 API.
 * These methods should only be called from Server Components or Server Actions.
 */

const INSTANTLY_BASE_URL = 'https://api.instantly.ai/api/v2'

export interface InstantlyAccount {
    email: string // In V2, email is the primary identifier for accounts
    status: string // e.g., 'active', 'paused'
    warmup_status: string // e.g., 'enabled', 'disabled'
    reputation: number
    daily_limit: number
    first_name?: string
    last_name?: string
}

export interface InstantlyCampaign {
    id: string
    name: string
    status: number
    created_at: string
    // Advanced options
    daily_limit?: number
    stop_on_reply?: boolean
    stop_on_auto_reply?: boolean
    open_tracking?: boolean
    link_tracking?: boolean
    delivery_optimization?: boolean
    prioritize_new_leads?: boolean
    first_email_text_only?: boolean
    show_unsubscribe?: boolean // inferred from search 'insert_unsubscribe_header'
    minimum_wait_time?: number
    random_variance?: number
    cc_email_list?: string[]
    bcc_email_list?: string[]
}

export interface InstantlyCampaignOptions {
    daily_limit?: number
    stop_on_reply?: boolean
    stop_on_auto_reply?: boolean
    open_tracking?: boolean
    link_tracking?: boolean
    delivery_optimization?: boolean
    prioritize_new_leads?: boolean
    first_email_text_only?: boolean
    show_unsubscribe?: boolean
    minimum_wait_time?: number
    random_variance?: number
    cc_email_list?: string[]
    bcc_email_list?: string[]
    send_as_text?: boolean
}

export class InstantlyClient {
    private apiKey: string
    // ... existing constructor ...

    constructor() {
        const key = process.env.INSTANTLY_API_KEY
        if (!key) {
            throw new Error('INSTANTLY_API_KEY is not defined in environment variables')
        }
        this.apiKey = key
    }

    private async request<T>(endpoint: string, options: RequestInit = {}, retries = 3): Promise<T> {
        const url = new URL(`${INSTANTLY_BASE_URL}${endpoint}`)

        const response = await fetch(url.toString(), {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        // Retry with exponential backoff on rate limit errors
        if (response.status === 429 && retries > 0) {
            const retryAfterHeader = response.headers.get('Retry-After')
            const waitMs = retryAfterHeader
                ? parseInt(retryAfterHeader) * 1000
                : (4 - retries) * 2000 // 2s, 4s, 6s
            console.warn(`[Instantly] 429 Rate limited. Retrying in ${waitMs}ms... (${retries} retries left)`)
            await new Promise(resolve => setTimeout(resolve, waitMs))
            return this.request<T>(endpoint, options, retries - 1)
        }

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`Instantly API Error Raw: ${errorText}`)
            throw new Error(`Instantly API Error (V2): ${response.status} ${response.statusText} - ${errorText}`)
        }

        return response.json() as Promise<T>
    }

    /**
     * Lists all email accounts in the master account.
     * Paginates through all pages using the V2 cursor (next_starting_after)
     * so we never hit the default 20-item page cap.
     */
    async getAccounts(): Promise<InstantlyAccount[]> {
        const allAccounts: InstantlyAccount[] = []
        let startingAfter: string | undefined = undefined

        while (true) {
            const endpoint = startingAfter
                ? `/accounts?limit=100&starting_after=${encodeURIComponent(startingAfter)}`
                : '/accounts?limit=100'

            const response: any = await this.request<any>(endpoint)

            // Normalise to an array of items
            let items: InstantlyAccount[] = []
            if (Array.isArray(response)) {
                items = response
            } else if (response.items && Array.isArray(response.items)) {
                items = response.items
            } else if (response.data && Array.isArray(response.data)) {
                items = response.data
            } else if (response.accounts && Array.isArray(response.accounts)) {
                items = response.accounts
            }

            allAccounts.push(...items)

            // Stop only when there is no next cursor or the page is empty
            const nextCursor = response?.next_starting_after
            if (!nextCursor || items.length === 0) break
            startingAfter = nextCursor
        }

        return allAccounts
    }

    /**
     * Lists all campaigns in the master account.
     * Paginates through all pages using the V2 cursor (next_starting_after)
     * so we never hit the default 20-item page cap.
     */
    async getCampaigns(): Promise<InstantlyCampaign[]> {
        const allCampaigns: InstantlyCampaign[] = []
        let startingAfter: string | undefined = undefined

        while (true) {
            const endpoint = startingAfter
                ? `/campaigns?limit=100&starting_after=${encodeURIComponent(startingAfter)}`
                : '/campaigns?limit=100'

            const response: any = await this.request<any>(endpoint)

            let items: InstantlyCampaign[] = []
            if (Array.isArray(response)) {
                items = response
            } else if (response.items && Array.isArray(response.items)) {
                items = response.items
            } else if (response.data && Array.isArray(response.data)) {
                items = response.data
            } else if (response.campaigns && Array.isArray(response.campaigns)) {
                items = response.campaigns
            }

            allCampaigns.push(...items)

            const nextCursor = response?.next_starting_after
            if (!nextCursor || items.length === 0) break
            startingAfter = nextCursor
        }

        return allCampaigns
    }

    /**
     * Creates a new campaign
     */
    async createCampaign(name: string, schedule?: {
        from_hour: number;
        to_hour: number;
        timezone: string;
        days: number[];
    }): Promise<{ id: string }> {
        // Construct default schedule if not provided (e.g. 9-5 EST M-F)
        const singleSchedule = schedule ? {
            name: 'Default Schedule',
            timing: {
                from: `${schedule.from_hour.toString().padStart(2, '0')}:00`,
                to: `${schedule.to_hour.toString().padStart(2, '0')}:00`
            },
            timezone: schedule.timezone,
            days: schedule.days.reduce((acc: any, day) => ({ ...acc, [day]: true }), {})
        } : {
            name: 'Default Schedule',
            timing: {
                from: '09:00',
                to: '17:00'
            },
            timezone: 'America/New_York',
            days: { 1: true, 2: true, 3: true, 4: true, 5: true }
        }

        return this.request<{ id: string }>('/campaigns', {
            method: 'POST',
            body: JSON.stringify({
                name,
                campaign_schedule: {
                    schedules: [singleSchedule]
                }
            }),
        })
    }

    /**
     * Assigns email accounts (by email address) to a specific campaign
     */
    async addAccountsToCampaign(campaignId: string, emails: string[]): Promise<any> {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                email_list: emails,
            }),
        })
    }

    /**
     * Adds leads to a campaign in bulk
     */
    async addLeadsToCampaign(campaignId: string, leads: any[]): Promise<any> {
        // V2 Sequential - Reverting because V1 is 404
        // DEBUG MODE ENABLED
        const formattedLeads = leads.map(lead => {
            const payload: any = {
                email: lead.email,
                first_name: lead.first_name,
                last_name: lead.last_name,
                companyName: lead.company_name,
                phone: lead.phone,
                website: lead.website,
                job_title: lead.job_title,
                linkedin_url: lead.linkedin_url,
                custom_variables: lead.enrichment_data ? {
                    ...lead.custom_variables,
                    ...lead.enrichment_data
                } : lead.custom_variables
            }

            const personalization = lead.personalization || lead.icebreaker
            if (personalization) {
                payload.personalization = personalization
            }

            // Clean up undefined/null
            Object.keys(payload).forEach(key => {
                if (payload[key] === undefined || payload[key] === null) {
                    delete payload[key]
                }
            })

            return payload
        })

        // Process in small concurrent batches with a delay between each
        // to avoid Instantly's rate limit (429 Too Many Requests).
        // 5 concurrent + 200ms pause = ~20 req/s, well under typical API limits.
        // Process in concurrent batches to stay within Vercel's 15-30s timeout limits.
        // 30 concurrent + 100ms pause = ~150-200 items/s — handles 1000 leads in ~5-10s.
        // Instantly V2 has a higher peak ingestion limit but individual request retry handles 429s.
        const batchSize = 30
        const BATCH_DELAY_MS = 100
        const results = []

        for (let i = 0; i < formattedLeads.length; i += batchSize) {
            const batch = formattedLeads.slice(i, i + batchSize)
            const batchPromises = batch.map(lead =>
                this.request('/leads', {
                    method: 'POST',
                    body: JSON.stringify({
                        campaign: campaignId,
                        campaign_id: campaignId,
                        skip_if_in_workspace: false,
                        skip_if_in_campaign: true,
                        ...lead
                    })
                })
            )
            const batchResults = await Promise.allSettled(batchPromises)
            results.push(...batchResults)

            // Optional: check for high failure rate in this batch
            const rejections = batchResults.filter(r => r.status === 'rejected')
            if (rejections.length > 0) {
                console.warn(`[Instantly] ${rejections.length}/${batch.length} leads in batch i=${i} failed. Sample error:`, (rejections[0] as PromiseRejectedResult).reason)
            }

            // Pause between batches to respect rate limits
            if (i + batchSize < formattedLeads.length) {
                await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS))
            }
        }

        // Verify some leads actually made it in. If EVERY single lead across ALL batches rejected, throw.
        const totalFulfilled = results.filter(r => r.status === 'fulfilled').length
        if (totalFulfilled === 0 && leads.length > 0) {
            throw new Error(`Instantly API Push Failed: Zero leads (out of ${leads.length}) were successfully added. This usually happens if the campaign ID is invalid or a global rate limit was hit.`)
        }

        return results
    }



    /**
     * Updates the status of a campaign
     * V2: status 0 = paused, 1 = active
     */
    async updateCampaignStatus(campaignId: string, status: 0 | 1): Promise<any> {
        const action = status === 1 ? 'activate' : 'pause'
        return this.request(`/campaigns/${campaignId}/${action}`, {
            method: 'POST',
            body: JSON.stringify({})
        })
    }

    /**
     * Gets summary stats for all campaigns
     */
    async getSummaryStats(): Promise<any> {
        // V2 /campaigns often returns a wrapped object or array
        return this.request<any>('/campaigns')
    }

    /**
     * Get detailed campaign info by ID
     */
    async getCampaign(campaignId: string): Promise<any> {
        return this.request<any>(`/campaigns/${campaignId}`)
    }

    /**
     * Get campaign analytics/stats
     */
    async getCampaignAnalytics(campaignId: string): Promise<any> {
        // V2 analytics overview endpoint
        // Use a wide date range to get all-time stats by default
        const startDate = '2024-01-01'
        const endDate = new Date().toISOString().split('T')[0]

        // expand_crm_events=true provides more granular interested/deal data
        return this.request<any>(`/campaigns/analytics/overview?campaign_id=${campaignId}&start_date=${startDate}&end_date=${endDate}&expand_crm_events=true`)
    }

    /**
     * Get analytics for all campaigns at once
     */
    async getAnalyticsOverview(startDate: string = '2024-01-01'): Promise<any[]> {
        const endDate = new Date().toISOString().split('T')[0]
        const response = await this.request<any>(`/campaigns/analytics/overview?start_date=${startDate}&end_date=${endDate}&expand_crm_events=true`)

        // V2 Overview usually returns an array directly, but handle potential wrapping
        return Array.isArray(response) ? response : (response?.data || [])
    }

    /**
     * Get leads for a specific campaign
     */
    async getCampaignLeads(campaignId: string, limit: number = 100, skip: number = 0): Promise<any> {
        return this.request<any>(`/leads?campaign=${campaignId}&limit=${limit}&skip=${skip}`)
    }

    async updateCampaignSequences(campaignId: string, steps: any[]): Promise<any> {
        // V2 structure: sequences is an array of sequence objects (usually just one main one)
        // Each sequence has 'steps' array.
        // Each step has 'variants' array.
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                sequences: [
                    {
                        steps: steps.map(step => {
                            // Support both flat database rows and nested UI structures
                            const variants = step.variants && step.variants.length > 0
                                ? step.variants.map((v: any) => ({
                                    subject: v.subject || '',
                                    body: v.body || ''
                                }))
                                : [
                                    {
                                        subject: step.subject || '',
                                        body: step.body || ''
                                    }
                                ];

                            return {
                                type: 'email',
                                delay: step.delay_days ?? (step.step_number === 1 ? 0 : 1),
                                delay_unit: 'days',
                                pre_delay_unit: 'days',
                                variants: variants
                            }
                        })
                    }
                ]
            }),
        })
    }

    /**
     * Update campaign schedule
     */
    async updateCampaignSchedule(campaignId: string, schedule: {
        from_hour: number;
        to_hour: number;
        timezone: string;
        days: number[]; // 0-6 for Sunday-Saturday
    }): Promise<any> {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                schedule: {
                    from: `${schedule.from_hour.toString().padStart(2, '0')}:00`,
                    to: `${schedule.to_hour.toString().padStart(2, '0')}:00`,
                    timezone: schedule.timezone,
                    days: schedule.days,
                }
            }),
        })
    }

    /**
     * Update campaign options — maps our internal field names to Instantly V2 API names.
     * Only sends fields that are explicitly provided (not undefined).
     */
    async updateCampaignOptions(campaignId: string, options: InstantlyCampaignOptions & Record<string, any>): Promise<any> {
        // Build a clean payload with only defined values, using correct V2 API field names
        const payload: Record<string, any> = {}

        if (options.daily_limit !== undefined) payload.daily_limit = options.daily_limit
        if (options.stop_on_reply !== undefined) payload.stop_on_reply = options.stop_on_reply
        if (options.stop_on_auto_reply !== undefined) payload.stop_on_auto_reply = options.stop_on_auto_reply
        if (options.open_tracking !== undefined) payload.open_tracking = options.open_tracking
        if (options.link_tracking !== undefined) payload.link_tracking = options.link_tracking
        if (options.delivery_optimization !== undefined) payload.delivery_optimization = options.delivery_optimization
        if (options.prioritize_new_leads !== undefined) payload.prioritize_new_leads = options.prioritize_new_leads
        if (options.first_email_text_only !== undefined) payload.first_email_text_only = options.first_email_text_only
        if (options.show_unsubscribe !== undefined) payload.insert_unsubscribe_header = options.show_unsubscribe
        // V2 uses email_gap / random_wait_max for these
        if (options.minimum_wait_time !== undefined) payload.email_gap = options.minimum_wait_time
        if (options.random_variance !== undefined) payload.random_wait_max = options.random_variance
        if (options.cc_email_list !== undefined) payload.cc_email_list = options.cc_email_list
        if (options.bcc_email_list !== undefined) payload.bcc_email_list = options.bcc_email_list
        // Extra fields
        if (options.send_as_text !== undefined) payload.send_as_plain_text = options.send_as_text
        if (options.stop_campaign_for_company !== undefined) payload.stop_campaign_for_company = options.stop_campaign_for_company
        if (options.allow_risky_emails !== undefined) payload.allow_risky_emails = options.allow_risky_emails
        if (options.disable_bounce_protect !== undefined) payload.disable_bounce_protect = options.disable_bounce_protect

        return this.request(`/campaigns/${campaignId}`, {
            method: 'PATCH',
            body: JSON.stringify(payload),
        })
    }

    /**
     * Delete a campaign
     */
    async deleteCampaign(campaignId: string): Promise<any> {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'DELETE',
        })
    }

    // =========================================================================
    // INBOX / EMAIL METHODS
    // =========================================================================

    /**
     * Fetch interest/intent label definitions from Instantly.
     * Returns labels with their numeric ID (matches ai_interest_value on emails),
     * display name, and color. Use this instead of hardcoding the mapping.
     */
    async getLeadLabels(): Promise<InstantlyLeadLabel[]> {
        try {
            const response = await this.request<any>('/lead-labels')
            // Normalise whatever shape the API returns
            const items: any[] = Array.isArray(response)
                ? response
                : (response?.items ?? response?.data ?? response?.labels ?? [])
            return items.map((item: any) => ({
                id: item.id ?? item.value ?? item.interest_value,
                name: item.label ?? item.name ?? item.title ?? String(item.id),
                color: item.color ?? item.hex_color ?? null,
            }))
        } catch {
            // Non-fatal — fall back to hardcoded defaults in the server action
            return []
        }
    }

    /**
     * List emails visible in the Unibox (replies, sent, etc.)
     * Supports filtering by account, campaign, and type.
     * Paginates using next_starting_after cursor.
     */
    async getEmails(params: {
        limit?: number
        starting_after?: string
        eaccount?: string   // filter to a specific sending account
        campaign_id?: string     // filter to a specific campaign
        type?: 'reply' | 'sent' | 'all'
        email_type?: 'received' | 'sent'
        is_read?: boolean
    } = {}): Promise<InstantlyEmail[]> {
        const { limit = 50, starting_after, eaccount, campaign_id, type, email_type, is_read } = params

        const query = new URLSearchParams()
        query.set('limit', String(limit))
        if (starting_after) query.set('starting_after', starting_after)
        if (eaccount) query.set('eaccount', eaccount)
        if (email_type) query.set('email_type', email_type)
        if (campaign_id) query.set('campaign_id', campaign_id)
        if (type && type !== 'all') query.set('type', type)
        if (is_read !== undefined) query.set('is_read', String(is_read))

        const response = await this.request<any>(`/emails?${query.toString()}`)

        // Normalise to array
        if (Array.isArray(response)) return response
        if (response?.items && Array.isArray(response.items)) return response.items
        if (response?.data && Array.isArray(response.data)) return response.data
        return []
    }

    /**
     * Fetch ALL inbound replies (ue_type === 2) for a set of accounts by
     * paginating through the Unibox history.
     *
     * Rate limit: Instantly allows 20 req/min. We cap at 3 pages (300 emails)
     * with a 400ms delay between pages = max 3 requests per call, well under limit.
     * Increase maxPages cautiously — each extra page = 1 more API request.
     */
    async getAllInboundEmails(ownAccounts: string[], params: {
        campaign_id?: string
        maxPages?: number
    } = {}): Promise<InstantlyEmail[]> {
        const PAGE_SIZE = 100
        const maxPages = params.maxPages ?? 3   // 3 pages = 300 emails = 3 req (safe)
        const ownAccountSet = new Set(ownAccounts.map(a => a.toLowerCase()))

        const inbound: InstantlyEmail[] = []

        // Chunk accounts to avoid URL length limits 
        // 20 accounts max per query string
        const CHUNK_SIZE = 20
        const accountChunks: string[][] = []
        for (let i = 0; i < ownAccounts.length; i += CHUNK_SIZE) {
            accountChunks.push(ownAccounts.slice(i, i + CHUNK_SIZE))
        }

        for (const chunk of accountChunks) {
            let startingAfter: string | undefined = undefined

            for (let page = 0; page < maxPages; page++) {
                // Throttle: 600ms between pages to stay under 20 req/min
                if (page > 0 || chunk !== accountChunks[0]) {
                    await new Promise(resolve => setTimeout(resolve, 600))
                }

                let batch: InstantlyEmail[]
                try {
                    batch = await this.getEmails({
                        limit: PAGE_SIZE,
                        starting_after: startingAfter,
                        campaign_id: params.campaign_id,
                        eaccount: chunk.join(','),
                        email_type: 'received',
                    })
                } catch (err: any) {
                    // On rate limit (429), return what we have so far — don't crash inbox
                    if (err?.message?.includes('429') || err?.status === 429) {
                        console.warn('[Inbox] Rate limited by Instantly — returning partial results')
                        break
                    }
                    throw err
                }

                if (!batch.length) break

                // Collect inbound emails for this org's accounts
                for (const email of batch) {
                    if (
                        email.ue_type === 2 &&
                        email.eaccount &&
                        ownAccountSet.has(email.eaccount.toLowerCase())
                    ) {
                        inbound.push(email)
                    }
                }

                // Stop if this was the last page
                if (batch.length < PAGE_SIZE) break

                // Cursor for next page = ID of last item in this batch
                startingAfter = batch[batch.length - 1].id
            }
        }

        // Sort newest first
        return inbound.sort((a, b) => {
            const tA = new Date(a.timestamp_created ?? a.timestamp_email ?? 0).getTime()
            const tB = new Date(b.timestamp_created ?? b.timestamp_email ?? 0).getTime()
            return tB - tA
        })

    }

    /**
     * Get a single email by ID (for thread view / detail).
     */
    async getEmail(emailId: string): Promise<InstantlyEmail> {
        return this.request<InstantlyEmail>(`/emails/${emailId}`)
    }

    /**
     * Mark one or more emails as read in the Instantly Unibox.
     * Instantly v2: PATCH /emails with { ids, is_unread: 0 }
     */
    async markEmailRead(emailId: string): Promise<void> {
        try {
            await this.request('/emails', {
                method: 'PATCH',
                body: JSON.stringify({ ids: [emailId], is_unread: 0 }),
            })
        } catch {
            // Non-fatal — if this fails the UI still shows it as read locally
        }
    }

    /**
     * Reply to an email in the Unibox.
     */
    async replyToEmail(params: {
        reply_to_uuid: string
        eaccount: string
        subject: string
        body: string
    }): Promise<any> {
        return this.request('/emails/reply', {
            method: 'POST',
            body: JSON.stringify(params),
        })
    }

    /**
     * Update a lead's interest/intent status in Instantly.
     * interest_value: 0=Not Interested, 1=Interested, 2=Meeting Booked,
     *                 3=Out of Office, 4=Do Not Contact, 5=Wrong Person
     */
    async updateLeadInterestStatus(params: {
        email: string          // the lead's email address
        interest_value: number // numeric label ID
    }): Promise<any> {
        return this.request('/leads/update-interest-status', {
            method: 'PATCH',
            body: JSON.stringify(params),
        })
    }

    // ─── Webhook management ──────────────────────────────────────────────────

    /** List all registered webhooks in the workspace. */
    async listWebhooks(): Promise<any[]> {
        const res = await this.request<any>('/webhooks')
        if (Array.isArray(res)) return res
        return res?.items ?? res?.data ?? []
    }

    /** Register a new webhook endpoint for a given event type. */
    async registerWebhook(params: {
        url: string           // public HTTPS endpoint
        event_type: string    // e.g. 'reply_received'
        name?: string
    }): Promise<any> {
        return this.request('/webhooks', {
            method: 'POST',
            body: JSON.stringify(params),
        })
    }

    /** Delete a registered webhook by its ID. */
    async deleteWebhook(webhookId: string): Promise<any> {
        return this.request(`/webhooks/${webhookId}`, { method: 'DELETE' })
    }
}

// =============================================================================
// INTERFACES
// =============================================================================

export interface InstantlyEmail {
    id?: string
    // Real field names from Instantly v2 /emails endpoint (confirmed via debug)
    timestamp_created?: string          // when created in system
    timestamp_email?: string            // actual email timestamp
    message_id?: string
    subject?: string
    to_address_email_list?: string      // recipient — STRING, not array
    body?: any                          // { html } for outbound, { text } for inbound
    organization_id?: string
    eaccount?: string                   // the account this belongs to
    from_address_email?: string         // sender email
    campaign_id?: string
    lead?: string                       // lead email address
    ue_type?: number                    // 1 = outbound, 2 = inbound reply
    step?: string
    is_unread?: number                  // 0 = read, 1 = unread
    is_focused?: number
    thread_id?: string
    ai_interest_value?: number          // AI interest label (numeric)
    i_status?: number
    content_preview?: string            // text preview (inbound only)
    from_address_json?: Array<{ address: string; name: string }>  // inbound only
    to_address_json?: Array<{ address: string; name: string }>    // inbound only
}

export interface InstantlyLeadLabel {
    id: number          // matches ai_interest_value on email objects
    name: string        // e.g. "Interested", "Not Interested", "Meeting Booked"
    color: string | null // hex color from Instantly, e.g. "#22c55e"
}

export const instantly = new InstantlyClient()
