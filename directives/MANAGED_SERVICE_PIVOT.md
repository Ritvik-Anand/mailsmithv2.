# Managed Service Pivot - Implementation Plan

> **Version:** 1.0  
> **Created:** 2026-01-22  
> **Status:** 🟡 Planning

---

## 📋 Executive Summary

This document outlines the strategic pivot from **self-service SaaS** to a **managed outreach service** with a customer-facing analytics dashboard + AI assistant. 

### Business Model Change

| Aspect | OLD (Self-Service SaaS) | NEW (Managed Service) |
|--------|------------------------|----------------------|
| **Customer Role** | Operates the tool themselves | Views progress, asks questions |
| **Your Team Role** | Support only | Full campaign operations |
| **Pricing** | $50-500/month subscription | $2K-10K/month retainer |
| **Value Prop** | "Tool to send emails" | "System that books meetings" |
| **Churn Risk** | High (tool blame) | Low (outcome dependency) |
| **Scalability** | Unlimited users | ~50-100 clients per operator |

---

## 🎯 New System Architecture

### Role-Based Access

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MAILSMITH MANAGED SERVICE                             │
└─────────────────────────────────────────────────────────────────────────────┘

  SUPER ADMIN                 OPERATOR                    CUSTOMER
  (You/Core Team)             (Campaign Managers)         (Paying Clients)
  ─────────────────────────────────────────────────────────────────────────────
  
  Full system access          Campaign operations         Read-only dashboard
  ├─ All dashboards           ├─ Lead scraping            ├─ Campaign progress
  ├─ All customers            ├─ Icebreaker generation    ├─ Analytics & metrics
  ├─ Settings & billing       ├─ Email sequences          ├─ Activity feed
  └─ User management          ├─ Reply handling           ├─ AI Assistant chat
                              └─ Customer assignments      └─ Report downloads
```

---

## 🔍 Codebase Audit Results

### Current State Analysis

#### ✅ What Exists (Can Keep)

| Component | Location | Status | Notes |
|-----------|----------|--------|-------|
| **Admin Dashboard** | `src/app/(admin)/admin/` | ✅ Exists | Core admin views, customer management |
| **Lead Finder** | `src/server/actions/lead-finder.ts` | ✅ Exists | Apify integration, job management |
| **Database Schema** | `sql/*.sql` | ✅ Exists | Organizations, leads, scrape_jobs tables |
| **Auth System** | `src/lib/supabase/` | ✅ Exists | Supabase auth with RLS |
| **UI Components** | `src/components/ui/` | ✅ Exists | shadcn/ui design system |
| **Landing Page** | `src/app/page.tsx` | ✅ Updated | Premium dark theme |

#### 🔄 What Needs to Change

| Component | Current State | Required Change |
|-----------|--------------|-----------------|
| **Customer Dashboard** | Full operational controls | Read-only analytics + AI chat |
| **Role System** | 2 roles (admin, member) | 3 roles (admin, operator, customer) |
| **Campaigns View** | Self-Create campaigns | View-only campaign progress |
| **Leads View** | Full CRUD operations | View leads scraped for them |
| **Scraper** | Customer can run scrapes | Operators run, customers view |
| **AI Assistant** | Not implemented | New feature needed |

#### ❌ What Needs to Be Built

| Component | Priority | Effort | Description |
|-----------|----------|--------|-------------|
| **AI Assistant** | P0 | High | Claude-powered chat that answers customer questions |
| **Read-Only Customer Dashboard** | P0 | Medium | Analytics, metrics, activity feed |
| **Operator Dashboard** | P1 | Medium | Campaign operations across customers |
| **Customer Assignment** | P1 | Low | Link operators to customer accounts |
| **Report Generation** | P2 | Medium | PDF exports of campaign performance |
| **Email Notifications** | P2 | Low | Weekly summary emails to customers |

---

## 📊 New Customer Dashboard Specification

The customer dashboard should be **simple, beautiful, and read-only**.

### 1. Overview Page (Home)

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ Welcome back, [Customer Name]                           🔔 │ 👤 Profile    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │
│   │   Leads     │  │   Emails    │  │  Open Rate  │  │ Reply Rate  │       │
│   │   2,450     │  │   1,890     │  │   34.2%     │  │   8.5%      │       │
│   │   ▲ +120    │  │   ▲ +89     │  │   ▲ +2.1%   │  │   ▲ +0.8%   │       │
│   └─────────────┘  └─────────────┘  └─────────────┘  └─────────────┘       │
│                                                                             │
│   ┌────────────────────────────────────────────────────────────────────┐   │
│   │ Campaign Progress                                                   │   │
│   │ ═══════════════════════════════════════════════════════╗           │   │
│   │ Q1 Tech Founders    ████████████████████░░░░░░░   72%   ║           │   │
│   │ SaaS CMO Outreach   ██████████████░░░░░░░░░░░░░   48%   ║           │   │
│   │ Series A Founders   ████████████████████████████  100%  ║ Complete  │   │
│   └────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│   ┌────────────────────────────┐  ┌────────────────────────────────────┐   │
│   │ Recent Activity            │  │ 🤖 AI Assistant                    │   │
│   │                            │  │                                    │   │
│   │ • 12 new replies today     │  │ "How can I help you today?"        │   │
│   │ • 45 emails opened         │  │                                    │   │
│   │ • 200 new leads scraped    │  │ ┌────────────────────────────────┐ │   │
│   │ • Campaign X completed     │  │ │ Ask about your campaigns...   │ │   │
│   │                            │  │ └────────────────────────────────┘ │   │
│   └────────────────────────────┘  └────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Campaigns Page

**Purpose:** View campaign performance (no editing)

| Section | Content |
|---------|---------|
| **Campaign List** | All campaigns for customer, status badges |
| **Campaign Detail** | Progress chart, lead funnel, email stats |
| **Replies Tab** | List of positive replies (masked if needed) |

### 3. Analytics Page

**Purpose:** Deep dive into performance metrics

| Widget | Description |
|--------|-------------|
| **Performance Over Time** | Line chart: opens, replies, bounces by week |
| **Best Performing Sequences** | Which email steps get most replies |
| **Lead Quality Score** | Average lead score, source breakdown |
| **Comparison View** | This month vs last month |

### 4. Reports Page

**Purpose:** Download and view reports

| Feature | Description |
|---------|-------------|
| **Weekly Reports** | Auto-generated PDF every Monday |
| **Custom Date Range** | Generate report for any period |
| **AI Summary** | AI-written executive summary in each report |

### 5. AI Assistant (Floating Widget + Page)

**Purpose:** Answer customer questions about their data

#### Chat Interface

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ 🤖 MailSmith AI Assistant                                        ─ □ ✕     │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  🤖 Based on your Q1 Tech Founders campaign, you're seeing a 34% open      │
│     rate and 8.5% reply rate. That's above industry average!                │
│                                                                             │
│     Your best performing subject line is "Quick question about              │
│     {company_name}" with a 42% open rate.                                   │
│                                                                             │
│  👤 How many meetings have we booked this month?                            │
│                                                                             │
│  🤖 This month you've had 23 positive replies that our team is             │
│     converting into meetings. 8 meetings are already scheduled,             │
│     with 15 conversations in progress.                                      │
│                                                                             │
│     Would you like me to generate a detailed report?                        │
│                                                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│ ┌─────────────────────────────────────────────────────────────────────────┐ │
│ │ Type your question...                                              [→] │ │
│ └─────────────────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

#### AI Capabilities

| Capability | Example Questions |
|------------|-------------------|
| **Performance Queries** | "How is my campaign doing?", "What's my reply rate?" |
| **Comparative Analysis** | "How does this month compare to last?", "Which campaign is best?" |
| **Recommendations** | "How can we improve?", "Why are open rates low?" |
| **Data Lookups** | "How many leads from California?", "Show tech founders" |
| **Report Generation** | "Generate a report for January", "Export my leads" |
| **Escalation** | "Talk to my account manager", "I have a billing question" |

---

## 🛠️ Operator Dashboard Specification

The operator dashboard is for your team to run campaigns on behalf of customers.

### 1. Customer Switcher

```
┌─────────────────────────────────────────────────────────────────┐
│ 🔄 Active Customer: [Acme Corp ▼]          [Switch Customer]   │
└─────────────────────────────────────────────────────────────────┘
```

Operators see a dropdown to switch between their assigned customers.

### 2. Operator Queue

| View | Purpose |
|------|---------|
| **My Customers** | List of assigned customers with health status |
| **Pending Tasks** | Actions needed (lead approvals, reply handling) |
| **Scrape Queue** | Upcoming and running scrape jobs |
| **Reply Inbox** | All positive replies across customers |

### 3. Per-Customer Operations

When viewing a specific customer, operators can:
- Configure and run lead scrapes
- Review and approve leads before adding to campaign
- Edit email sequences
- Handle positive replies
- Generate reports

---

## 📐 Database Schema Changes

### New Tables

```sql
-- Customer assignments (link operators to customers)
CREATE TABLE operator_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operator_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    is_primary BOOLEAN DEFAULT false,  -- Primary account manager
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(operator_user_id, organization_id)
);

-- AI Chat History
CREATE TABLE ai_chat_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES ai_chat_sessions(id) ON DELETE CASCADE,
    role TEXT NOT NULL, -- 'user' or 'assistant'
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}', -- Store tool calls, data queries, etc.
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated Reports
CREATE TABLE customer_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL, -- 'weekly', 'monthly', 'custom'
    date_range_start DATE NOT NULL,
    date_range_end DATE NOT NULL,
    file_url TEXT, -- Supabase storage URL
    ai_summary TEXT,
    generated_by UUID REFERENCES users(id),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Modify Existing Tables

```sql
-- Add role column to users table
ALTER TABLE users ADD COLUMN role TEXT DEFAULT 'customer';
-- Roles: 'super_admin', 'admin', 'operator', 'customer'

-- Add health tracking to organizations
ALTER TABLE organizations ADD COLUMN health_score INTEGER DEFAULT 100;
ALTER TABLE organizations ADD COLUMN last_activity_at TIMESTAMPTZ;
ALTER TABLE organizations ADD COLUMN account_manager_notes TEXT;
```

---

## 🗂️ File Structure Changes

```
src/
├── app/
│   ├── (admin)/                    # KEEP - Super admin console
│   │   └── admin/
│   │       ├── page.tsx            # System overview
│   │       ├── customers/          # All customers
│   │       ├── operators/          # NEW - Manage operators
│   │       └── ...
│   │
│   ├── (operator)/                 # NEW - Operator console
│   │   ├── layout.tsx
│   │   └── operator/
│   │       ├── page.tsx            # Operator dashboard
│   │       ├── customers/          # Assigned customers
│   │       ├── queue/              # Task queue
│   │       └── inbox/              # Reply inbox
│   │
│   ├── (customer)/                 # REFACTOR from (dashboard)
│   │   ├── layout.tsx
│   │   └── portal/                 # Customer portal (read-only)
│   │       ├── page.tsx            # Overview + AI widget
│   │       ├── campaigns/          # View campaigns
│   │       ├── analytics/          # Performance metrics
│   │       ├── reports/            # Download reports
│   │       └── assistant/          # Full AI chat page
│   │
│   └── api/
│       ├── ai/
│       │   └── chat/route.ts       # NEW - AI Assistant API
│       └── reports/
│           └── generate/route.ts   # NEW - Report generation
│
├── components/
│   ├── customer/                   # NEW - Customer portal components
│   │   ├── metrics-cards.tsx
│   │   ├── campaign-progress.tsx
│   │   ├── activity-feed.tsx
│   │   └── ai-assistant-widget.tsx
│   │
│   ├── operator/                   # NEW - Operator components
│   │   ├── customer-switcher.tsx
│   │   ├── task-queue.tsx
│   │   └── reply-inbox.tsx
│   │
│   └── ai/                         # NEW - AI components
│       ├── chat-interface.tsx
│       ├── chat-message.tsx
│       └── suggested-questions.tsx
│
├── server/
│   ├── actions/
│   │   ├── ai-assistant.ts         # NEW - AI chat actions
│   │   ├── customer-portal.ts      # NEW - Read-only data fetching
│   │   └── reports.ts              # NEW - Report generation
│   │
│   └── services/
│       ├── ai-chat.ts              # NEW - Claude integration for chat
│       └── report-generator.ts     # NEW - PDF generation
│
└── lib/
    ├── ai/
    │   ├── prompts.ts              # NEW - AI system prompts
    │   └── tools.ts                # NEW - AI tool definitions
    └── reports/
        └── templates.ts            # NEW - Report templates
```

---

## 🚀 Implementation Phases

### Phase 1: Foundation (Week 1) ✅ COMPLETED
- [x] Add `role` column to users table → `sql/managed_service_migration.sql`
- [x] Create `operator_assignments` table → `sql/managed_service_migration.sql`
- [x] Create AI chat tables → `sql/managed_service_migration.sql`
- [x] Create customer reports table → `sql/managed_service_migration.sql`
- [x] Create activity feed table → `sql/managed_service_migration.sql`
- [x] Implement role-based middleware → `src/server/actions/roles.ts`
- [x] Create basic customer portal layout → `src/app/(customer)/layout.tsx`
- [x] Create customer sidebar → `src/components/customer/sidebar.tsx`
- [x] Create customer header → `src/components/customer/header.tsx`
- [x] Create AI assistant widget (shell) → `src/components/customer/ai-assistant-widget.tsx`
- [x] Create customer portal home page → `src/app/(customer)/portal/page.tsx`
- [x] Create operator dashboard layout → `src/app/(operator)/layout.tsx`
- [x] Create operator sidebar → `src/components/operator/sidebar.tsx`
- [x] Create operator header with customer switcher → `src/components/operator/header.tsx`
- [x] Create operator dashboard home page → `src/app/(operator)/operator/page.tsx`
- [x] Create unauthorized page → `src/app/unauthorized/page.tsx`
- [x] Separate Team vs Customer login flows
    - [x] Create dedicated Team Login page → `src/app/(auth)/team/login/page.tsx`
    - [x] Update standard Login to redirect based on role → `src/app/(auth)/login/page.tsx`
    - [x] Deprecate old `/dashboard` routes → `src/app/_dashboard_deprecated`

### Phase 2: Customer Portal (Week 2)
- [ ] Build metrics cards component
- [ ] Build campaign progress view
- [ ] Build activity feed
- [ ] Build analytics charts
- [ ] Implement data fetching for read-only views

### Phase 3: AI Assistant (Week 3)
- [ ] Create AI chat tables
- [ ] Build Claude integration with context
- [ ] Create chat UI components
- [ ] Implement floating widget
- [ ] Create full chat page
- [ ] Define AI tools for data queries

### Phase 4: Operator Tools (Week 4)
- [ ] Build customer switcher
- [ ] Create operator queue views
- [ ] Build reply inbox
- [ ] Implement task management
- [ ] Add customer health tracking

### Phase 5: Reports & Polish (Week 5)
- [ ] Implement PDF report generation
- [ ] Create report templates
- [ ] Add AI summary generation
- [ ] Email notification system
- [ ] Testing and refinement

---

## 🤖 AI Assistant Technical Design

### System Prompt Structure

```typescript
const CUSTOMER_AI_SYSTEM_PROMPT = `You are the MailSmith AI Assistant, helping customers understand their outreach performance.

## Your Role
- Answer questions about campaign performance, leads, and metrics
- Provide actionable insights based on their data
- Help them understand what's working and what isn't
- Generate summaries and reports on request
- Escalate to their account manager when needed

## Context
Customer: {{customer_name}}
Organization: {{organization_name}}
Account Manager: {{account_manager_name}}

## Available Data
You have access to the following functions to query their data:
- getCampaignMetrics(campaignId?: string): Campaign performance data
- getLeadStats(filters?: object): Lead statistics
- getReplyAnalysis(): Positive reply analysis
- getWeeklyComparison(): This week vs last week
- generateReport(dateRange: object): Generate PDF report

## Guidelines
1. Always be positive but honest about performance
2. Provide specific numbers when available
3. Offer actionable recommendations
4. If asked about operations (changing campaigns, etc.), explain that their account manager handles that
5. For billing/contract questions, always escalate to the account manager

## Tone
Professional, friendly, data-driven. Like a helpful analyst who knows their account well.`
```

### AI Tool Definitions

```typescript
const AI_TOOLS = [
  {
    name: 'getCampaignMetrics',
    description: 'Get metrics for a specific campaign or all campaigns',
    parameters: {
      type: 'object',
      properties: {
        campaignId: {
          type: 'string',
          description: 'Optional specific campaign ID'
        },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          }
        }
      }
    }
  },
  {
    name: 'getLeadStats',
    description: 'Get statistics about leads',
    parameters: {
      type: 'object',
      properties: {
        status: {
          type: 'string',
          enum: ['all', 'contacted', 'opened', 'replied', 'bounced']
        },
        campaignId: { type: 'string' }
      }
    }
  },
  {
    name: 'comparePerformance',
    description: 'Compare performance between two time periods',
    parameters: {
      type: 'object',
      properties: {
        period1Start: { type: 'string' },
        period1End: { type: 'string' },
        period2Start: { type: 'string' },
        period2End: { type: 'string' }
      }
    }
  },
  {
    name: 'generateReport',
    description: 'Generate a PDF performance report',
    parameters: {
      type: 'object',
      properties: {
        reportType: {
          type: 'string',
          enum: ['summary', 'detailed', 'executive']
        },
        dateRange: {
          type: 'object',
          properties: {
            start: { type: 'string' },
            end: { type: 'string' }
          }
        }
      },
      required: ['reportType']
    }
  },
  {
    name: 'escalateToAccountManager',
    description: 'Escalate the conversation to the account manager',
    parameters: {
      type: 'object',
      properties: {
        reason: { type: 'string' },
        urgency: {
          type: 'string',
          enum: ['low', 'medium', 'high']
        }
      },
      required: ['reason']
    }
  }
]
```

---

## ✅ Success Criteria

### Customer Portal
- [ ] Customers can log in and see their data (read-only)
- [ ] All metrics are accurate and real-time
- [ ] AI Assistant can answer 80%+ of common questions
- [ ] Reports can be generated and downloaded
- [ ] Mobile-responsive design

### Operator Dashboard
- [ ] Operators can switch between assigned customers
- [ ] All current operational features work per-customer
- [ ] Task queue shows pending actions
- [ ] Reply inbox aggregates all positive replies

### AI Assistant
- [ ] Responds accurately to data questions
- [ ] Uses tools to fetch real data
- [ ] Escalates appropriately to account managers
- [ ] Chat history is preserved

---

## 📎 Related Documents

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Original SaaS implementation plan
- [CUSTOMER_DASHBOARD_SPEC.md](./CUSTOMER_DASHBOARD_SPEC.md) - Previous customer dashboard (to be deprecated)
- [ADMIN_DASHBOARD_SPEC.md](./ADMIN_DASHBOARD_SPEC.md) - Admin console specification
- [LEAD_SCRAPING_SPEC.md](./LEAD_SCRAPING_SPEC.md) - Lead finder integration
