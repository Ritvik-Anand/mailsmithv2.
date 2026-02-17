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

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = new URL(`${INSTANTLY_BASE_URL}${endpoint}`)
        // V2 uses Authorization header, query param not needed/might interfere


        const response = await fetch(url.toString(), {
            ...options,
            headers: {
                'Authorization': `Bearer ${this.apiKey}`,
                'Content-Type': 'application/json',
                ...options.headers,
            },
        })

        if (!response.ok) {
            const errorText = await response.text()
            console.error(`Instantly API Error Raw: ${errorText}`)
            throw new Error(`Instantly API Error (V2): ${response.status} ${response.statusText} - ${errorText}`)
        }

        return response.json() as Promise<T>
    }

    /**
     * Lists all email accounts in the master account
     */
    async getAccounts(): Promise<InstantlyAccount[]> {
        const response: any = await this.request<any>('/accounts')

        // V2 uses 'items' for the array of results
        if (Array.isArray(response)) return response
        if (response.items && Array.isArray(response.items)) return response.items
        if (response.data && Array.isArray(response.data)) return response.data
        if (response.accounts && Array.isArray(response.accounts)) return response.accounts
        return []
    }

    /**
     * Lists all campaigns in the master account
     */
    async getCampaigns(): Promise<InstantlyCampaign[]> {
        const response: any = await this.request<any>('/campaigns')

        if (Array.isArray(response)) return response
        if (response.items && Array.isArray(response.items)) return response.items
        if (response.data && Array.isArray(response.data)) return response.data
        if (response.campaigns && Array.isArray(response.campaigns)) return response.campaigns
        return []
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
        // V2 structure: POST /leads with { campaign_id, leads: [...] }
        const formattedLeads = leads.map(lead => ({
            email: lead.email,
            first_name: lead.first_name,
            last_name: lead.last_name,
            company_name: lead.company_name,
            personalization: lead.icebreaker, // Map icebreaker to personalization
            job_title: lead.job_title, // Instantly uses job_title or title? keeping both or standardizing
            linkedin_url: lead.linkedin_url,
            custom_variables: {
                ...lead.custom_variables,
                phone: lead.phone
            }
        }))

        return this.request('/leads', {
            method: 'POST',
            body: JSON.stringify({
                campaign_id: campaignId,
                skip_if_in_workspace: true,
                skip_if_in_campaign: true,
                leads: formattedLeads
            }),
        })
    }

    /**
     * Updates the status of a campaign
     * V2: status 0 = paused, 1 = active
     */
    async updateCampaignStatus(campaignId: string, status: 0 | 1): Promise<any> {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                status,
            }),
        })
    }

    /**
     * Gets summary stats for all campaigns
     */
    async getSummaryStats(): Promise<any[]> {
        // In V2, basic stats are often included in /campaigns or via /analytics
        // For now, listing campaigns is a good fallback or if there's a specific summary endpoint
        return this.request<any[]>('/campaigns')
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
        // V2 analytics endpoint
        return this.request<any>(`/campaigns/${campaignId}/analytics`)
    }

    /**
     * Get leads for a specific campaign
     */
    async getCampaignLeads(campaignId: string, limit: number = 100, skip: number = 0): Promise<any> {
        return this.request<any>(`/leads?campaign=${campaignId}&limit=${limit}&skip=${skip}`)
    }

    /**
     * Update campaign sequences (email steps)
     */
    async updateCampaignSequences(campaignId: string, sequences: any[]): Promise<any> {
        // V2 structure: sequences is an array of sequence objects (usually just one main one)
        // Each sequence has 'steps' array.
        // Each step has 'variants' array.
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PATCH',
            body: JSON.stringify({
                sequences: [
                    {
                        steps: sequences.map(seq => ({
                            type: 'email',
                            start_delay: seq.step_number === 1 ? 0 : (seq.delay_days ?? 1), // V2 uses start_delay for first step? search said 'delay'
                            delay: seq.delay_days ?? (seq.step_number === 1 ? 0 : 1),
                            variants: [
                                {
                                    subject: seq.subject,
                                    body: seq.body
                                }
                            ]
                        }))
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
     * Update campaign options
     */
    async updateCampaignOptions(campaignId: string, options: InstantlyCampaignOptions): Promise<any> {
        return this.request(`/campaigns/${campaignId}`, {
            method: 'PATCH',
            body: JSON.stringify(options),
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
}

export const instantly = new InstantlyClient()

