# Customer Dashboard Specification

> **Last Updated:** 2026-01-12  
> **Status:** Planning

---

## 🎯 Design Philosophy

- **Gorgeous, premium UI** that wows users at first glance
- **Information-rich** without feeling cluttered
- **Actionable insights** - every metric should lead to an action
- **Consistent design system** across all features

---

## 📊 1. Master Dashboard (Landing Page)

The first thing users see after login. Must convey health of their outreach at a glance.

### Core Metrics (Hero Section)
| Metric | Description | Visual |
|--------|-------------|--------|
| **Active Campaigns** | Count + trend arrow | Large stat card |
| **Total Leads** | All leads in system | Large stat card |
| **Emails Sent (30d)** | Monthly volume | Large stat card |
| **Open Rate** | % opens with trend | Gauge/percentage ring |
| **Reply Rate** | % replies with trend | Gauge/percentage ring |
| **Bounce Rate** | % bounces (warning if high) | Gauge/percentage ring |

### Functional Sections

#### Campaign Performance Table
- Top 5 active campaigns with key metrics
- Quick actions: Pause, View, Edit
- "View All" link to Campaigns tab

#### Lead Activity Feed
- Real-time feed showing:
  - New leads scraped
  - Emails opened
  - Replies received
  - Bounces detected
- Click to navigate to specific lead/campaign

#### Leads Breakdown Widget
| Status | Description |
|--------|-------------|
| **New** | Just imported, not contacted |
| **Contacted** | Email sent, awaiting response |
| **Opened** | Email opened |
| **Replied** | Got a response ✓ |
| **No Reply** | No response after sequence |
| **Bounced** | Invalid email |

#### Quick Actions Panel
- "Start New Campaign" button
- "Scrape More Leads" button
- "Generate Report" button

#### 🤖 AI Report Generator
- Button: "Generate AI Report"
- Modal with options:
  - Date range selection
  - Include/exclude specific campaigns
  - Report depth (Summary / Detailed)
- Output: Beautiful PDF matching MailSmith design
- Report contents:
  - Executive summary
  - Campaign-by-campaign breakdown
  - What's working (green highlights)
  - What needs attention (amber)
  - Critical issues (red)
  - AI-powered recommendations
  - Actionable next steps

### Additional Widgets (My Recommendations)
| Widget | Rationale |
|--------|-----------|
| **Best Performing Sequence** | Show what's working |
| **Leads Needing Attention** | Replied leads awaiting follow-up |
| **Weekly Goal Tracker** | Gamification, motivation |
| **Upcoming Scheduled Sends** | Transparency on queue |

---

## 📧 2. Campaigns Tab

Central hub for all email campaign management.

### Campaign List View
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search    [Filter ▼]    [+ New Campaign]                │
├─────────────────────────────────────────────────────────────┤
│ ● Active Campaigns (3)                                      │
│ ├─ Q1 Outreach - Tech Founders    │ 450 leads │ 32% open   │
│ ├─ Product Launch - VCs           │ 120 leads │ 28% open   │
│ └─ Follow-up Sequence             │ 89 leads  │ 45% open   │
│                                                             │
│ ⏸ Paused Campaigns (1)                                     │
│ └─ Holiday Campaign               │ 200 leads │ Paused     │
│                                                             │
│ ✓ Completed Campaigns (5)                                   │
│ └─ ...                                                      │
│                                                             │
│ 📝 Draft Campaigns (2)                                      │
│ └─ ...                                                      │
└─────────────────────────────────────────────────────────────┘
```

### Campaign Detail View

#### Header Section
- Campaign name (editable inline)
- Status badge (Active/Paused/Draft/Completed)
- Quick stats: Leads, Sent, Opens, Replies
- Actions: Edit, Pause/Resume, Duplicate, Delete

#### Tabs within Campaign Detail

**1. Overview Tab**
- Performance chart (opens, replies over time)
- Funnel visualization (leads → sent → opened → replied)
- AI insights card

**2. Leads Tab**
- All leads in this campaign
- Filter by status (Sent, Opened, Replied, Bounced)
- Bulk actions: Remove, Move to another campaign
- Individual lead detail on click

**3. Sequences Tab (Email Editor)**
```
Sequence Steps:
┌─────────────────────────────────────────┐
│ Step 1: Initial Outreach                │
│ ├─ Subject: "Quick question, {firstName}"
│ ├─ Body: [Click to edit]                │
│ ├─ Variables: {firstName}, {company}, {icebreaker}
│ └─ Wait: 3 days                         │
├─────────────────────────────────────────┤
│ Step 2: Follow-up #1                    │
│ ├─ Subject: "Re: Quick question..."     │
│ └─ Wait: 5 days                         │
├─────────────────────────────────────────┤
│ Step 3: Final Follow-up                 │
│ └─ ...                                  │
└─────────────────────────────────────────┘
[+ Add Step]
```

- **Live editing** - changes sync to Instantly via MCP
- Preview with sample lead data
- Variable insertion toolbar

**4. Settings Tab**
- Sending account selection
- Daily send limit
- Timezone settings
- Tracking options (open tracking, link tracking)

#### 🤖 AI Report Generator (Campaign-Specific)
- Same as Master Dashboard but scoped to single campaign
- Includes sequence-level analysis
- A/B test recommendations

---

## 👥 3. Leads Tab

Complete lead management and scraping hub.

### Leads List View
- Searchable, filterable table
- Columns: Name, Email, Company, Campaign, Status, Icebreaker, Added
- Bulk actions: Add to Campaign, Generate Icebreakers, Delete
- Export to CSV

### Lead Detail View
- Full contact info
- Company info + enrichment data
- Icebreaker (with regenerate option)
- Activity timeline (all emails, opens, replies)
- Campaign history

### Scrape New Leads Section

#### Scraper Selection
| Scraper | Use Case |
|---------|----------|
| LinkedIn Sales Navigator | B2B prospects by title/company |
| Apollo.io | Verified B2B emails |
| Google Maps | Local businesses |
| Custom URL | Any website list |

#### Scrape Configuration
- Input parameters (mirrors Apify actor inputs)
- Lead count limit
- Deduplication settings
- Auto-add to campaign option
- Auto-generate icebreakers toggle

#### Scrape History
- List of past scrape jobs
- Status, leads found, date
- Re-run with same parameters

---

## 💬 4. Customer Support Tab

### Help Center Landing
- FAQ accordion (common questions)
- Video tutorials carousel
- Search across help content

### 🤖 AI Support Chatbot
```
┌─────────────────────────────────────────┐
│ 🤖 MailSmith Assistant                  │
├─────────────────────────────────────────┤
│ How can I help you today?               │
│                                         │
│ [Campaign setup]  [Lead issues]         │
│ [Billing]         [Technical help]      │
│                                         │
│ Or type your question...                │
│ ┌─────────────────────────────────┐    │
│ │ Type a message...          [→] │    │
│ └─────────────────────────────────┘    │
└─────────────────────────────────────────┘
```

- AI-powered first response (Claude)
- Attempts to resolve common issues
- Knows user's account context
- Escalation: "Talk to a human" button

### Bug Report Form
- Title, Description, Severity
- Screenshot upload
- Auto-capture browser info
- Ticket number + expected response time

### Live Chat (When Escalated)
- Seamless handoff from AI
- Chat persists across sessions
- Shows agent typing indicator
- Message history preserved

---

## 🔔 5. Notification System

### Notification Bell (Header)
- Subtle badge with unread count
- Click opens dropdown panel
- Mark as read, mark all read

### Notification Types
| Type | Example | Priority |
|------|---------|----------|
| **System** | "New feature: AI Reports!" | Normal |
| **Campaign** | "Campaign X completed" | Normal |
| **Alert** | "High bounce rate detected" | High |
| **Reply** | "New reply from John Doe" | High |
| **Admin** | "Payment reminder" | Normal |
| **Bug Update** | "Your reported bug was fixed" | Normal |

### Notification Preferences (in Settings)
- Toggle by type
- Email notifications on/off
- Daily digest option

---

## 👤 6. User Profile & Settings

### Profile Section
- Avatar upload
- Display name
- Email (read-only)
- Password change

### Team Management
- Invite team members (limited by plan)
- Role assignment: Admin, Member, Viewer
- Remove members
- Pending invites

### Integrations
- Instantly API key connection
- Connection status indicator
- Re-authenticate option

### Billing (Future - Not MVP)
- Current plan display
- Usage meters
- Upgrade prompts

---

## 🎨 Design System Notes

- **Primary Color:** Deep purple/indigo (professional, modern)
- **Accent:** Electric blue (actions, links)
- **Success:** Emerald green
- **Warning:** Amber
- **Error:** Rose red
- **Background:** Dark slate (dark mode default)
- **Cards:** Subtle glassmorphism effect
- **Typography:** Inter or similar clean sans-serif
- **Animations:** Smooth 200-300ms transitions
- **Charts:** Consistent color palette, tooltips

---

## ✅ MVP vs Future Features

### MVP (Launch With)
- [x] Master Dashboard with core metrics
- [x] Campaign list & detail views
- [x] Sequence editing (syncs to Instantly)
- [x] Leads list & detail
- [x] Basic scraper integration (1-2 actors)
- [x] AI Icebreaker generation
- [x] Bug report form
- [x] Notification system (admin broadcasts)
- [x] User profile basics

### Phase 2 (Post-Launch)
- [ ] AI Report Generator (PDF)
- [ ] AI Support Chatbot
- [ ] Live chat with admin
- [ ] Advanced scraper options
- [ ] Team management

### Phase 3 (Future)
- [ ] Billing/payments
- [ ] A/B testing for sequences
- [ ] Advanced analytics
- [ ] Webhook integrations
- [ ] API access for customers
