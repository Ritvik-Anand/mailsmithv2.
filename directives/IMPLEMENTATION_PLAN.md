# MailSmith v2 - Complete Implementation Plan

> **Version:** 2.0  
> **Created:** 2026-01-12  
> **Status:** Planning Phase

---

## 📋 Executive Summary

MailSmith v2 is a **multi-tenant SaaS platform** for automated lead nurturing and email campaign management. The system scrapes prospect data via Apify, enriches it with AI-generated personalized icebreakers using Anthropic Claude, and launches targeted email campaigns through Instantly.ai.

### Core Value Proposition
Turn cold leads into warm conversations with AI-powered personalization at scale.

---

## 🏗️ System Architecture

### High-Level Data Flow

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                              MAILSMITH v2 ARCHITECTURE                        │
└──────────────────────────────────────────────────────────────────────────────┘

    ┌─────────────┐      ┌─────────────┐      ┌─────────────┐      ┌─────────────┐
    │   SCRAPE    │ ───▶ │    STORE    │ ───▶ │   NURTURE   │ ───▶ │   LAUNCH    │
    │   (Apify)   │      │  (Supabase) │      │ (Anthropic) │      │ (Instantly) │
    └─────────────┘      └─────────────┘      └─────────────┘      └─────────────┘
          │                    │                    │                    │
          ▼                    ▼                    ▼                    ▼
    LinkedIn/Apollo      PostgreSQL +         Custom Icebreaker    Email Campaigns
    Google Maps          Row-Level Security   Generation           + Analytics
    Web Scrapers         Multi-tenant         per Lead

                    ┌─────────────────────────────────────┐
                    │         CUSTOMER DASHBOARD           │
                    │         (Next.js 15 + React)         │
                    │                                      │
                    │  ┌─────────┐ ┌─────────┐ ┌────────┐ │
                    │  │ Leads   │ │Campaigns│ │Reports │ │
                    │  └─────────┘ └─────────┘ └────────┘ │
                    └─────────────────────────────────────┘
                                      │
                    ┌─────────────────────────────────────┐
                    │           ADMIN CONSOLE              │
                    │  Customer Management | Feature Flags │
                    │  Bug Reports | System Health         │
                    └─────────────────────────────────────┘
```

---

## 🛠️ Technology Stack

### Frontend
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Framework** | Next.js 15 (App Router) | Server Components, streaming, excellent DX |
| **Styling** | Tailwind CSS v4 + shadcn/ui | Rapid development, consistent design system |
| **State** | Zustand + React Query | Lightweight global state + server state caching |
| **Forms** | React Hook Form + Zod | Type-safe validation, excellent UX |
| **Charts** | Recharts | Rich analytics visualization |
| **Animations** | Framer Motion | Premium micro-interactions |

### Backend
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **API** | Next.js API Routes + Server Actions | Colocation with frontend, type safety |
| **Database** | Supabase (PostgreSQL) | RLS for multi-tenancy, real-time, auth built-in |
| **ORM** | Prisma | Type-safe queries, migrations, studio |
| **Queue** | Inngest | Serverless background jobs, event-driven |
| **AI** | Anthropic Claude 3.5 Sonnet | Best-in-class reasoning for icebreakers |

### Integrations (via MCP)
| Service | Purpose | MCP Server |
|---------|---------|------------|
| **Apify** | Lead scraping | Custom execution script |
| **Instantly.ai** | Email campaigns | `instantly-mcp` |
| **GitHub** | Code management | `github-mcp-server` |

### Infrastructure
| Layer | Technology | Rationale |
|-------|------------|-----------|
| **Hosting** | Vercel | Native Next.js optimization, edge functions |
| **CDN** | Vercel Edge | Global distribution |
| **Monitoring** | Sentry + Vercel Analytics | Error tracking + performance |
| **Logging** | Axiom | Structured logs, affordable |

---

## 📊 Database Schema

### Multi-Tenancy Strategy
**Approach:** Shared Database, Shared Schema with Row-Level Security (RLS)

Every tenant-specific table includes a `tenant_id` column, and PostgreSQL RLS policies enforce data isolation automatically.

### Core Tables

```sql
-- Organizations (Tenants)
CREATE TABLE organizations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    plan TEXT DEFAULT 'free', -- 'free', 'starter', 'pro', 'enterprise'
    features JSONB DEFAULT '{}', -- Feature flags per org
    settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Users
CREATE TABLE users (
    id UUID PRIMARY KEY REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    role TEXT DEFAULT 'member', -- 'owner', 'admin', 'member'
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Leads (Scraped Contacts)
CREATE TABLE leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    -- Contact Info
    first_name TEXT,
    last_name TEXT,
    email TEXT NOT NULL,
    phone TEXT,
    linkedin_url TEXT,
    
    -- Company Info
    company_name TEXT,
    company_domain TEXT,
    job_title TEXT,
    industry TEXT,
    company_size TEXT,
    location TEXT,
    
    -- Enrichment Data
    raw_scraped_data JSONB DEFAULT '{}',
    enrichment_data JSONB DEFAULT '{}',
    
    -- Icebreaker
    icebreaker_status TEXT DEFAULT 'pending', -- 'pending', 'generating', 'completed', 'failed'
    icebreaker TEXT,
    icebreaker_generated_at TIMESTAMPTZ,
    icebreaker_metadata JSONB DEFAULT '{}',
    
    -- Campaign Status
    campaign_id UUID REFERENCES campaigns(id),
    campaign_status TEXT DEFAULT 'not_added', -- 'not_added', 'queued', 'sent', 'opened', 'replied', 'bounced'
    
    -- Source
    source TEXT, -- 'apify_linkedin', 'apify_apollo', 'manual', 'csv_import'
    scrape_job_id UUID REFERENCES scrape_jobs(id),
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(organization_id, email)
);

-- Scrape Jobs
CREATE TABLE scrape_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    actor_id TEXT NOT NULL, -- Apify Actor ID
    actor_name TEXT,
    input_params JSONB NOT NULL,
    
    status TEXT DEFAULT 'pending', -- 'pending', 'running', 'completed', 'failed'
    apify_run_id TEXT,
    
    leads_found INTEGER DEFAULT 0,
    leads_imported INTEGER DEFAULT 0,
    
    started_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    error_message TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Campaigns
CREATE TABLE campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    
    name TEXT NOT NULL,
    description TEXT,
    
    -- Instantly Integration
    instantly_campaign_id TEXT,
    instantly_account_id TEXT,
    
    -- Email Template
    subject_template TEXT,
    body_template TEXT,
    
    -- Stats (synced from Instantly)
    total_leads INTEGER DEFAULT 0,
    emails_sent INTEGER DEFAULT 0,
    emails_opened INTEGER DEFAULT 0,
    emails_replied INTEGER DEFAULT 0,
    emails_bounced INTEGER DEFAULT 0,
    
    status TEXT DEFAULT 'draft', -- 'draft', 'active', 'paused', 'completed'
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Bug Reports
CREATE TABLE bug_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id),
    user_id UUID REFERENCES users(id),
    
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    severity TEXT DEFAULT 'medium', -- 'low', 'medium', 'high', 'critical'
    status TEXT DEFAULT 'open', -- 'open', 'in_progress', 'resolved', 'closed'
    
    browser_info JSONB,
    screenshot_urls TEXT[],
    
    admin_notes TEXT,
    resolved_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Activity Log (Audit Trail)
CREATE TABLE activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id),
    
    action TEXT NOT NULL,
    resource_type TEXT, -- 'lead', 'campaign', 'scrape_job', etc.
    resource_id UUID,
    metadata JSONB DEFAULT '{}',
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Row-Level Security Policies

```sql
-- Enable RLS on all tenant tables
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_jobs ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their organization's data
CREATE POLICY "Users can view own organization leads"
ON leads FOR SELECT
USING (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

CREATE POLICY "Users can insert leads to own organization"
ON leads FOR INSERT
WITH CHECK (
    organization_id = (
        SELECT organization_id FROM users WHERE id = auth.uid()
    )
);

-- Similar policies for campaigns, scrape_jobs, etc.
```

---

## 🎨 Frontend Architecture

### Directory Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth routes (login, signup)
│   │   ├── login/
│   │   └── signup/
│   ├── (dashboard)/              # Protected dashboard routes
│   │   ├── layout.tsx            # Dashboard shell with sidebar
│   │   ├── page.tsx              # Dashboard home
│   │   ├── leads/
│   │   │   ├── page.tsx          # Leads list
│   │   │   ├── [id]/page.tsx     # Lead detail
│   │   │   └── import/page.tsx   # CSV import
│   │   ├── campaigns/
│   │   │   ├── page.tsx          # Campaigns list
│   │   │   ├── new/page.tsx      # Create campaign
│   │   │   └── [id]/page.tsx     # Campaign detail + analytics
│   │   ├── scraper/
│   │   │   ├── page.tsx          # Scraper dashboard
│   │   │   └── new/page.tsx      # New scrape job
│   │   ├── reports/
│   │   │   └── page.tsx          # Analytics & reports
│   │   ├── settings/
│   │   │   ├── page.tsx          # General settings
│   │   │   ├── team/page.tsx     # Team management
│   │   │   └── integrations/     # API keys, Instantly, etc.
│   │   └── support/
│   │       ├── page.tsx          # Support center
│   │       └── bug-report/       # Bug report form
│   ├── (admin)/                  # Admin console (separate layout)
│   │   ├── layout.tsx
│   │   ├── page.tsx              # Admin dashboard
│   │   ├── organizations/        # Manage orgs
│   │   ├── users/                # Manage users
│   │   ├── features/             # Feature flag management
│   │   ├── bugs/                 # Bug triage
│   │   └── system/               # System health
│   ├── api/                      # API Routes
│   │   ├── webhooks/
│   │   │   ├── apify/route.ts    # Apify webhook
│   │   │   └── instantly/route.ts
│   │   └── trpc/[trpc]/route.ts  # tRPC handler (optional)
│   ├── layout.tsx                # Root layout
│   └── globals.css
├── components/
│   ├── ui/                       # shadcn/ui components
│   ├── dashboard/                # Dashboard-specific components
│   ├── leads/                    # Lead components
│   ├── campaigns/                # Campaign components
│   └── admin/                    # Admin components
├── lib/
│   ├── supabase/                 # Supabase client setup
│   ├── api/                      # API utilities
│   ├── hooks/                    # Custom React hooks
│   └── utils/                    # Helper functions
├── server/
│   ├── actions/                  # Server Actions
│   ├── services/                 # Business logic
│   └── queue/                    # Inngest job definitions
└── types/                        # TypeScript types
```

### UI/UX Design Principles

1. **Dark Mode First**: Professional, reduces eye strain for power users
2. **Information Density**: Show more data, fewer clicks
3. **Real-time Feedback**: Live updates for scrape jobs, campaign stats
4. **Micro-interactions**: Smooth animations for all state changes
5. **Progressive Disclosure**: Simple by default, powerful when needed

### Key UI Components

| Component | Description |
|-----------|-------------|
| **Command Palette** | `⌘+K` for quick navigation anywhere |
| **Data Tables** | Virtualized, sortable, filterable, bulk actions |
| **Pipeline View** | Kanban-style lead progression |
| **Stats Cards** | Real-time metrics with sparklines |
| **Activity Feed** | Live timeline of system activities |

---

## ⚙️ Backend Architecture

### Server Actions (Next.js 15)

```typescript
// src/server/actions/leads.ts
'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

const importLeadsSchema = z.object({
  leads: z.array(z.object({
    email: z.string().email(),
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    company: z.string().optional(),
  })),
})

export async function importLeads(formData: FormData) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error('Unauthorized')
  
  // Get user's organization
  const { data: userData } = await supabase
    .from('users')
    .select('organization_id')
    .eq('id', user.id)
    .single()
  
  const parsed = importLeadsSchema.parse(JSON.parse(formData.get('leads') as string))
  
  // Insert leads with organization_id
  const { data, error } = await supabase
    .from('leads')
    .insert(
      parsed.leads.map(lead => ({
        ...lead,
        organization_id: userData.organization_id,
        source: 'csv_import',
      }))
    )
    .select()
  
  if (error) throw error
  
  revalidatePath('/leads')
  return { success: true, count: data.length }
}
```

### Background Jobs (Inngest)

```typescript
// src/server/queue/icebreaker.ts
import { inngest } from '@/lib/inngest'
import { generateIcebreaker } from '@/server/services/ai'

export const generateIcebreakerJob = inngest.createFunction(
  { id: 'generate-icebreaker' },
  { event: 'lead/icebreaker.generate' },
  async ({ event, step }) => {
    const { leadId } = event.data
    
    // Step 1: Fetch lead data
    const lead = await step.run('fetch-lead', async () => {
      return fetchLeadById(leadId)
    })
    
    // Step 2: Generate icebreaker with AI
    const icebreaker = await step.run('generate', async () => {
      return generateIcebreaker(lead)
    })
    
    // Step 3: Update lead record
    await step.run('update-lead', async () => {
      return updateLeadIcebreaker(leadId, icebreaker)
    })
    
    return { success: true, icebreaker }
  }
)
```

---

## 🔌 Integration Layer

### Apify Integration

```typescript
// src/server/services/apify.ts
import { ApifyClient } from 'apify-client'

const client = new ApifyClient({
  token: process.env.APIFY_API_TOKEN,
})

export async function startScrapeJob(params: {
  actorId: string
  input: Record<string, unknown>
  webhookUrl: string
}) {
  const run = await client.actor(params.actorId).call(params.input, {
    webhooks: [{
      eventTypes: ['ACTOR.RUN.SUCCEEDED', 'ACTOR.RUN.FAILED'],
      requestUrl: params.webhookUrl,
    }],
  })
  
  return {
    runId: run.id,
    status: run.status,
  }
}

export async function fetchScrapeResults(runId: string) {
  const { items } = await client.run(runId).dataset().listItems()
  return items
}
```

### Instantly Integration (via MCP)

The Instantly MCP server provides these key operations:
- **Campaign Management**: Create, update, pause campaigns
- **Lead Management**: Add leads, update status, move between campaigns
- **Analytics**: Fetch open rates, reply rates, bounce rates
- **Email Operations**: View replies, send follow-ups

```typescript
// Example: Adding leads to Instantly campaign
export async function addLeadsToCampaign(
  campaignId: string,
  leads: Lead[]
) {
  // This will be called via the Instantly MCP server
  const results = await instantlyMcp.addLeadsToCampaign({
    campaignId,
    leads: leads.map(lead => ({
      email: lead.email,
      firstName: lead.first_name,
      lastName: lead.last_name,
      companyName: lead.company_name,
      icebreaker: lead.icebreaker,
      customVariables: {
        icebreaker: lead.icebreaker,
        company: lead.company_name,
        title: lead.job_title,
      },
    })),
  })
  
  return results
}
```

### AI Icebreaker Generation

```typescript
// src/server/services/ai.ts
import Anthropic from '@anthropic-ai/sdk'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

export async function generateIcebreaker(lead: Lead): Promise<string> {
  const systemPrompt = `You are an expert at writing personalized, warm email icebreakers.

Your task is to create a brief (1-2 sentence) icebreaker that:
1. References something specific about the person or their company
2. Feels genuine and human, not templated
3. Creates curiosity or establishes common ground
4. Avoids being salesy or pushy

Use the provided data to find unique angles like:
- Recent company news or achievements
- Shared interests or background
- Industry trends they're likely interested in
- Their content or thought leadership`

  const userPrompt = `Create a personalized icebreaker for:

Name: ${lead.first_name} ${lead.last_name}
Title: ${lead.job_title}
Company: ${lead.company_name}
Industry: ${lead.industry}
Location: ${lead.location}

Additional context from LinkedIn/web:
${JSON.stringify(lead.enrichment_data, null, 2)}

Write ONLY the icebreaker, nothing else.`

  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20241022',
    max_tokens: 256,
    messages: [
      { role: 'user', content: userPrompt }
    ],
    system: systemPrompt,
  })

  return response.content[0].type === 'text' 
    ? response.content[0].text 
    : ''
}
```

---

## 👥 Multi-Tenant Customer System

### Organization Lifecycle

```
┌─────────────────────────────────────────────────────────────────┐
│                     ONBOARDING FLOW                              │
└─────────────────────────────────────────────────────────────────┘

  1. SIGNUP          2. ORG SETUP         3. INTEGRATION        4. FIRST USE
  ─────────────────────────────────────────────────────────────────────────
  
  User creates    →  Creates org      →  Connects Instantly  →  Imports/scrapes
  account            Sets team name      Enters API keys        first leads
                     Invites members     Tests connection       Runs first campaign
```

### Feature Flags System

```typescript
// Feature flags stored in organization.features JSONB
interface OrganizationFeatures {
  // Core Features
  maxLeads: number              // Lead limit
  maxCampaigns: number          // Campaign limit
  maxTeamMembers: number        // Team size limit
  
  // Advanced Features
  aiIcebreakers: boolean        // AI generation enabled
  csvImport: boolean            // CSV import enabled
  apiAccess: boolean            // API access enabled
  customBranding: boolean       // White-label
  prioritySupport: boolean      // Priority support access
  
  // Beta Features
  betaFeatures: string[]        // ['advanced-analytics', 'ab-testing']
}

// Default feature sets by plan
const PLAN_FEATURES: Record<string, OrganizationFeatures> = {
  free: {
    maxLeads: 100,
    maxCampaigns: 1,
    maxTeamMembers: 1,
    aiIcebreakers: false,
    csvImport: true,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
    betaFeatures: [],
  },
  starter: {
    maxLeads: 1000,
    maxCampaigns: 5,
    maxTeamMembers: 3,
    aiIcebreakers: true,
    csvImport: true,
    apiAccess: false,
    customBranding: false,
    prioritySupport: false,
    betaFeatures: [],
  },
  pro: {
    maxLeads: 10000,
    maxCampaigns: 25,
    maxTeamMembers: 10,
    aiIcebreakers: true,
    csvImport: true,
    apiAccess: true,
    customBranding: false,
    prioritySupport: true,
    betaFeatures: [],
  },
  enterprise: {
    maxLeads: -1, // Unlimited
    maxCampaigns: -1,
    maxTeamMembers: -1,
    aiIcebreakers: true,
    csvImport: true,
    apiAccess: true,
    customBranding: true,
    prioritySupport: true,
    betaFeatures: ['advanced-analytics', 'ab-testing'],
  },
}
```

---

## 🛡️ Admin Console

### Admin Capabilities

| Module | Capabilities |
|--------|-------------|
| **Organizations** | View all orgs, edit features, adjust limits, suspend/activate |
| **Users** | Impersonate, reset password, change roles |
| **Feature Flags** | Toggle features per org, roll out betas |
| **Bug Reports** | View, triage, assign, resolve, respond |
| **System Health** | API status, queue depth, error rates |
| **Audit Logs** | All admin actions logged |

### Admin Access Control

```typescript
// Admin role check middleware
export async function requireAdmin() {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  // Check if user has admin role in system_admins table
  const { data: admin } = await supabase
    .from('system_admins')
    .select('*')
    .eq('user_id', user?.id)
    .single()
  
  if (!admin) {
    redirect('/unauthorized')
  }
  
  return admin
}
```

---

## 🐛 Bug Reporting System

### User-Facing Flow

1. **Report Button**: Floating button in dashboard (bottom-right)
2. **Quick Form**: Title, description, severity, optional screenshot
3. **Auto-Capture**: Browser info, current URL, console errors
4. **Confirmation**: Ticket number, estimated response time

### Admin Triage Flow

1. **Inbox View**: All new bugs, sortable by severity
2. **Quick Actions**: Assign, change status, add internal notes
3. **User Communication**: Reply directly (creates email)
4. **Resolution**: Mark resolved, add public update

---

## 📁 Project Directory Structure (Complete)

```
mailsmithv2/
├── .env                          # Environment variables
├── .env.example                   # Template for env vars
├── .gitignore
├── GEMINI.md                     # Agent instructions
├── README.md
├── package.json
├── next.config.js
├── tailwind.config.ts
├── tsconfig.json
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── migrations/               # Migration history
├── directives/                   # Agent SOPs
│   ├── IMPLEMENTATION_PLAN.md    # This document
│   ├── scrape_leads.md           # Apify scraping SOP
│   ├── generate_icebreakers.md   # AI generation SOP
│   ├── launch_campaign.md        # Instantly campaign SOP
│   └── bug_triage.md             # Bug handling SOP
├── execution/                    # Deterministic scripts
│   ├── apify_scraper.py          # Apify integration
│   ├── icebreaker_generator.py   # AI icebreaker generation
│   ├── instantly_sync.py         # Instantly sync
│   └── db_manager.py             # Database utilities
├── src/
│   ├── app/                      # Next.js App Router
│   ├── components/               # React components
│   ├── lib/                      # Utilities
│   ├── server/                   # Server-side code
│   └── types/                    # TypeScript types
└── .tmp/                         # Temporary files
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1-2)
- [x] Initialize Next.js 15 project with App Router
- [x] Set up Supabase with auth and RLS
- [x] Create database schema and migrations
- [ ] Implement auth flow (login, signup, password reset)
- [ ] Build dashboard shell (sidebar, header, layouts)
- [ ] Design system setup (Tailwind, shadcn/ui)

### Phase 2: Core Features (Week 3-4)
- [ ] Leads module (CRUD, import, list views)
- [ ] Apify integration (start jobs, webhook handler, result processing)
- [ ] AI icebreaker generation pipeline
- [ ] Background job queue (Inngest setup)

### Phase 3: Campaigns (Week 5-6)
- [ ] Campaign creation flow
- [ ] Instantly MCP integration
- [ ] Lead-to-campaign assignment
- [ ] Campaign analytics dashboard

### Phase 4: Multi-Tenant & Admin (Week 7-8)
- [ ] Organization management
- [ ] Team invites and roles
- [ ] Feature flag system
- [ ] Admin console (all modules)
- [ ] Bug reporting system

### Phase 5: Polish & Launch (Week 9-10)
- [ ] Performance optimization
- [ ] End-to-end testing
- [ ] Security audit
- [ ] Documentation
- [ ] Production deployment

---

## ✅ Best Practices Checklist

### Security
- [ ] All API routes protected by authentication
- [ ] RLS enabled on all tenant tables
- [ ] Input validation with Zod on all forms
- [ ] CSRF protection on state-changing operations
- [ ] Rate limiting on auth endpoints
- [ ] Secure cookie configuration
- [ ] API keys stored in environment variables only

### Performance
- [ ] Server Components by default
- [ ] Client Components only where needed
- [ ] Image optimization with next/image
- [ ] Lazy loading for heavy components
- [ ] Database query optimization
- [ ] Connection pooling via Supabase

### UX
- [ ] Loading states for all async operations
- [ ] Error boundaries with helpful messages
- [ ] Optimistic updates where appropriate
- [ ] Keyboard shortcuts for power users
- [ ] Mobile-responsive design
- [ ] Dark/light mode support

### Code Quality
- [ ] TypeScript strict mode
- [ ] ESLint + Prettier configured
- [ ] Unit tests for utilities
- [ ] Integration tests for key flows
- [ ] E2E tests for critical paths
- [ ] Git hooks for pre-commit checks

---

## 📞 Questions Before Starting

1. **Apify Actors**: Which specific Apify actors will we use for scraping? (LinkedIn Sales Navigator, Apollo, Google Maps, etc.)

2. **Email Templates**: Do you have existing email templates, or should we build a template builder?

3. **Instantly Account**: Do you have an Instantly API key ready, or should we mock the integration first?

4. **Branding**: Do you have brand guidelines (colors, fonts, logo) for the UI design?

5. **Existing Customers**: How many customers are you expecting initially? This affects our multi-tenancy scaling decisions.

6. **Admin Access**: Who should have admin access? Should we implement MFA for admins?

---

*This plan follows the 3-layer architecture defined in GEMINI.md. Ready to begin Phase 1 on your approval.*
