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
    status: number // V2: 0=paused, 1=active, etc.
    created_at: string
}

export class InstantlyClient {
    private apiKey: string

    constructor() {
        const key = process.env.INSTANTLY_API_KEY
        if (!key) {
            throw new Error('INSTANTLY_API_KEY is not defined in environment variables')
        }
        this.apiKey = key
    }

    private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
        const url = new URL(`${INSTANTLY_BASE_URL}${endpoint}`)
        url.searchParams.append('api_key', this.apiKey)

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
            throw new Error(`Instantly API Error (V2): ${response.status} ${response.statusText}`)
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
    async createCampaign(name: string): Promise<{ id: string }> {
        return this.request<{ id: string }>('/campaigns', {
            method: 'POST',
            body: JSON.stringify({ name }),
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
        // V2 structure: POST /leads with array of leads
        const leadsWithCampaign = leads.map(lead => ({
            campaign: campaignId,
            email: lead.email,
            first_name: lead.first_name,
            last_name: lead.last_name,
            company_name: lead.company_name,
            title: lead.job_title,
            linkedin: lead.linkedin_url,
            custom_variables: lead.custom_variables || {},
            skip_if_in_workspace: true,
            skip_if_in_campaign: true
        }))

        return this.request('/leads', {
            method: 'POST',
            body: JSON.stringify(leadsWithCampaign),
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
}

export const instantly = new InstantlyClient()
