# Admin Dashboard Specification

> **Last Updated:** 2026-01-12  
> **Status:** Planning

---

## 🎯 Design Philosophy

- **Operations-focused** - surface what needs immediate attention
- **Customer-centric views** - understand each customer's status at a glance
- **Efficiency tools** - minimize clicks for common admin tasks
- **Same design system** as customer dashboard for consistency

---

## 📊 1. Admin Master Dashboard

The command center for managing all customers and system health.

### Priority Alerts Section (Top of Page)
```
┌─────────────────────────────────────────────────────────────┐
│ 🔴 3 Critical Support Tickets    [View All →]              │
│ 🟡 2 Customers Approaching Limits [View →]                 │
│ 🟢 System Health: All Services Operational                 │
└─────────────────────────────────────────────────────────────┘
```

### Core Metrics
| Metric | Description |
|--------|-------------|
| **Total Organizations** | All customers on platform |
| **Active Users** | Users logged in (24h) |
| **Total Leads Processed** | Platform-wide |
| **Emails Sent Today** | Aggregate volume |
| **Open Support Tickets** | Needs attention |
| **System Uptime** | Service health |

### Functional Sections

#### Recent Activity Feed
- New signups
- Feature toggle changes
- Support tickets created
- High-priority events

#### Customers Needing Attention
- High bounce rates
- Approaching plan limits
- Overdue payments (future)
- Inactive for 7+ days

#### Quick Actions
- "Send Notification to All"
- "View Support Queue"
- "System Health Check"

---

## 👥 2. Customers Tab (Organizations)

### Customer List View
```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search    [Plan ▼]  [Status ▼]  [+ Add Customer]        │
├─────────────────────────────────────────────────────────────┤
│ Company Name      │ Plan    │ Users │ Leads │ Status       │
│───────────────────┼─────────┼───────┼───────┼──────────────│
│ Acme Corp         │ Pro     │ 5     │ 4,521 │ ● Active     │
│ StartupXYZ        │ Starter │ 2     │ 890   │ ● Active     │
│ TechVentures      │ Free    │ 1     │ 45    │ ○ Trial      │
│ OldCompany        │ Pro     │ 3     │ 2,100 │ ◉ Suspended  │
└─────────────────────────────────────────────────────────────┘
```

### Customer Detail View

#### Header
- Organization name
- Plan badge
- Status: Active / Trial / Suspended
- Quick actions: Impersonate, Suspend, Edit

#### Tabs

**1. Overview**
- Account created date
- Current plan + usage vs limits
- Key metrics (campaigns, leads, emails)
- Recent activity

**2. Users**
- All users in organization
- Roles (Owner, Admin, Member)
- Last login
- Actions: Impersonate, Reset Password

**3. Features**
```
Feature Toggles:
┌─────────────────────────────────────┐
│ ☑ AI Icebreakers         [ON]     │
│ ☑ CSV Import             [ON]     │
│ ☐ API Access             [OFF]    │
│ ☐ Custom Branding        [OFF]    │
│ ☑ Priority Support       [ON]     │
│                                    │
│ Custom Limits:                     │
│ Max Leads: [10000    ]            │
│ Max Campaigns: [25   ]            │
│ Max Team Members: [10]            │
│                                    │
│ [Save Changes]                     │
└─────────────────────────────────────┘
```

**4. Billing (Future)**
- Payment history
- Current invoice
- Apply credits/discounts

**5. Activity Log**
- Audit trail of all actions
- Filterable by action type
- Exportable

#### Impersonation Mode
- Button: "Login as Customer"
- Opens customer dashboard in new tab
- Admin banner at top: "Viewing as: Acme Corp [Exit]"
- All actions logged

---

## 💬 3. Support Tab

### Support Queue Dashboard
```
┌─────────────────────────────────────────────────────────────┐
│ SUPPORT QUEUE                                               │
├─────────────────────────────────────────────────────────────┤
│ [Unassigned (5)]  [My Tickets (3)]  [All (12)]  [Resolved] │
├─────────────────────────────────────────────────────────────┤
│ 🔴 HIGH - "Campaign not sending" - Acme Corp               │
│    AI Analysis: Instantly API error. Needs immediate fix.   │
│    [Assign to Me]  [View]                                   │
├─────────────────────────────────────────────────────────────┤
│ 🟡 MED - "How to import CSV?" - StartupXYZ                 │
│    AI Analysis: Knowledge base can answer. Auto-responded.  │
│    [View]                                                   │
├─────────────────────────────────────────────────────────────┤
│ 🟢 LOW - "Feature request: dark mode" - TechCo             │
│    [View]                                                   │
└─────────────────────────────────────────────────────────────┘
```

### AI Prioritization
The AI analyzes each ticket for:
- **Urgency keywords** (broken, urgent, not working)
- **Revenue impact** (paying customer vs free)
- **Sentiment** (frustrated, angry)
- **Technical severity** (bug vs question)

Tickets ranked automatically. Admins see AI reasoning.

### Ticket Assignment System
| State | Icon | Behavior |
|-------|------|----------|
| **Unassigned** | ○ | Visible to all admins |
| **Assigned** | ● John | Other admins see "John is handling" |
| **In Progress** | 🔄 | Active conversation |
| **Resolved** | ✓ | Moved to resolved queue |

### Live Chat Integration
- When customer escalates from AI chatbot
- Real-time messaging interface
- See customer's context (account, recent actions)
- Quick responses / canned replies
- Transfer to another admin option

### Ticket Detail View
- Full conversation history
- Customer context sidebar (plan, usage, recent tickets)
- Internal notes (not visible to customer)
- Status changes
- Resolution tagging

---

## 🔔 4. Notifications (Send to Customers)

### Notification Composer
```
┌─────────────────────────────────────────────────────────────┐
│ Send Notification                                           │
├─────────────────────────────────────────────────────────────┤
│ Recipients:                                                 │
│ ○ All Customers                                             │
│ ○ Specific Plans: [Starter ▼] [Pro ▼]                      │
│ ○ Specific Customers: [Search and add...]                  │
│                                                             │
│ Type:                                                       │
│ [Feature Update ▼]                                          │
│                                                             │
│ Title:                                                      │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ Introducing AI Reports!                                 ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ Message:                                                    │
│ ┌─────────────────────────────────────────────────────────┐│
│ │ We're excited to announce...                            ││
│ └─────────────────────────────────────────────────────────┘│
│                                                             │
│ [Preview]  [Send Now]  [Schedule]                          │
└─────────────────────────────────────────────────────────────┘
```

### Notification Types
- **Feature Update**: New capabilities
- **System Alert**: Maintenance, outages
- **Bug Update**: "Issue you reported is fixed"
- **Payment Reminder**: Upcoming/overdue (future)
- **Custom**: Freeform announcement

### Notification History
- All sent notifications
- Delivery stats (read rate)
- Resend option

---

## 🛡️ 5. System Health Tab

### Service Status
| Service | Status | Latency |
|---------|--------|---------|
| Supabase (DB) | ● Operational | 45ms |
| Instantly API | ● Operational | 120ms |
| Apify | ● Operational | 200ms |
| Anthropic AI | ● Operational | 800ms |
| Email Delivery | ● Operational | - |

### Metrics & Logs
- API error rates (last 24h)
- Background job queue depth
- Failed jobs list
- Quick retry/clear actions

### Admin Audit Log
- All admin actions logged
- Who did what, when
- Filter by admin, action type, date

---

## 👨‍💼 6. Admin Management

### Admin Users List
- All system admins
- Roles: Super Admin, Admin, Support
- Last active
- Actions: Add, Remove, Change Role

### Role Permissions
| Permission | Super Admin | Admin | Support |
|------------|-------------|-------|---------|
| View customers | ✓ | ✓ | ✓ |
| Edit features | ✓ | ✓ | ✗ |
| Impersonate | ✓ | ✓ | ✗ |
| Suspend accounts | ✓ | ✗ | ✗ |
| Manage admins | ✓ | ✗ | ✗ |
| Send notifications | ✓ | ✓ | ✗ |
| Handle support | ✓ | ✓ | ✓ |

---

## ✅ MVP vs Future Features

### MVP (Launch With)
- [x] Admin Master Dashboard
- [x] Customer list with search/filter
- [x] Customer detail + feature toggles
- [x] Impersonation mode
- [x] Support ticket queue
- [x] Ticket assignment system
- [x] Send notifications (broadcast)
- [x] Basic system health view

### Phase 2 (Post-Launch)
- [ ] AI ticket prioritization
- [ ] Live chat with customers
- [ ] Advanced audit logging
- [ ] Admin role management

### Phase 3 (Future)
- [ ] Billing management
- [ ] Revenue analytics
- [ ] Automated alerts (Slack/email)
- [ ] Custom dashboards
