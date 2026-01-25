# Demo Data Management

Manages demo data for Mailsmith video recordings and presentations.

## Overview

This directive covers the seeding and cleanup of demo data for the X Assure customer profile in Mailsmith. The demo data includes:

- **Demo Organization**: X Assure (Tasksurance) - an insurance VA/AI solutions company
- **Demo Customer User**: Login credentials for the customer portal
- **Demo Leads**: 2,000 realistic insurance agency owner/decision-maker contacts
- **Icebreaker Context**: Pre-configured AI context for personalized icebreaker generation
- **Sample Campaigns**: 2 campaigns (1 active with stats, 1 draft)
- **Activity Feed**: Realistic activity history for the portal

## Scripts

### Seed Demo Data
```bash
npm run demo:seed
```
Creates the X Assure demo organization with all related data.

### Cleanup Demo Data
```bash
npm run demo:cleanup
```
Removes all demo data cleanly from the database.

## Demo Organization Details

- **Name**: X Assure
- **Slug**: `xassure-demo-2026`
- **Industry**: Insurance virtual assistants & AI solutions
- **Target Audience**: Independent insurance agencies

## Customer Portal Access

After running the seed script, you can log in to the customer portal:

| Field | Value |
|-------|-------|
| **URL** | `/portal` |
| **Email** | `demo@xassure.co` |
| **Password** | `XAssure2026!` |

This allows you to demo the customer-facing portal with real data.

## Leads Overview

2,000 leads across 40+ US cities:
- **1,950 leads** with pre-generated icebreakers (for showcasing data at scale)
- **50 leads** pending icebreaker generation (for live AI demo)

Each lead includes:
- Full contact info (name, email, phone, LinkedIn)
- Company details (name, domain, size, location)
- Raw scraped data (headline, description, industry, etc.)
- Realistic job titles (Agency Owner, Principal Agent, Managing Partner, etc.)

## Campaigns

1. **Insurance Agency VA Outreach - Q1 2026** (Active)
   - 1,000 leads, 847 sent, 312 opened, 67 replied
   - 3-step sequence
   
2. **AI-Powered Agency Tools - Q1 2026** (Draft)
   - Ready to launch
   - 2-step sequence

## Activity Feed

8 realistic activity items including:
- Reply notifications (highlighted)
- Campaign launch events
- Icebreaker generation updates
- Lead import notifications
- Email open tracking

## Workflow for Recording

1. Run `npm run demo:cleanup` to ensure clean slate
2. Run `npm run demo:seed` to create fresh demo data (~30-60 seconds)
3. **For Operator Console**: Log in as admin/operator
4. **For Customer Portal**: Log in as `demo@xassure.co`
5. Record your demo video
6. Run `npm run demo:cleanup` when finished

## Demo Scenarios

### Operator Console Demo
- Navigate to Customers → X Assure
- View 2,000 leads with icebreaker statuses
- Show campaign builder and email sequences
- Generate icebreakers for pending leads

### Customer Portal Demo
- Log in as demo@xassure.co
- View dashboard with metrics (2000 leads, 847 sent, 36.8% open rate)
- Show campaign progress cards
- View activity feed with replies highlighted
- Explore lead pipeline visualization

## Technical Notes

- Leads inserted in batches of 100 for performance
- Uses unique slug `xassure-demo-2026` for easy identification
- All leads sourced as `demo_seed` for tracking
- Emails unique using index suffix to prevent duplicates
- Icebreakers use 10 different templates for variety
- Demo user created via Supabase Admin API

## Related Files

- `execution/seed_demo_data.ts` - Main seed script
- `execution/cleanup_demo_data.ts` - Cleanup script
