# Lead Scraping System Specification

> **Actor:** `code_crafter/leads-finder`  
> **Version:** 1.0  
> **Created:** 2026-01-19  
> **Status:** ✅ IMPLEMENTED

---

## 📋 Executive Summary

This document specifies the lead scraping system for Mailsmith v2 using the **code_crafter/leads-finder** Apify actor. This actor provides a cost-effective alternative to ZoomInfo, Lusha, and Apollo at **$1.5/1,000 leads**.

### Key Capabilities
- ✅ Verified business emails
- ✅ Mobile numbers (paid Apify plans only)
- ✅ LinkedIn profile URLs
- ✅ Detailed company data
- ✅ Advanced targeting filters

---

## 🔧 Actor Configuration

### API Endpoints

```
# Run actor (async)
POST https://api.apify.com/v2/acts/code_crafter~leads-finder/runs?token=<APIFY_API_TOKEN>

# Run actor and get results immediately (sync)
POST https://api.apify.com/v2/acts/code_crafter~leads-finder/run-sync-get-dataset-items?token=<APIFY_API_TOKEN>

# Get actor details
GET https://api.apify.com/v2/acts/code_crafter~leads-finder?token=<APIFY_API_TOKEN>

# Get run results
GET https://api.apify.com/v2/datasets/<DATASET_ID>/items?token=<APIFY_API_TOKEN>
```

---

## 📥 Input Schema Reference

### General Settings

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `fetch_count` | integer | 50000 | Maximum leads to fetch. Leave empty for all matches. |
| `file_name` | string | - | Custom run label / export name |

### People Targeting

| Field | Type | Description |
|-------|------|-------------|
| `contact_job_title` | array[string] | Include titles (e.g., "Marketing Manager", "CTO") |
| `contact_not_job_title` | array[string] | Exclude titles |
| `seniority_level` | array[string] | Founder, Owner, C-Level, Director, VP, Head, Manager, Senior, Entry, Trainee |
| `functional_level` | array[string] | C-Level, Finance, Product, Engineering, Design, HR, IT, Legal, Marketing, Operations, Sales, Support |

### Location (Include)

| Field | Type | Description |
|-------|------|-------------|
| `contact_location` | array[string] | Region/Country/State (e.g., "EMEA", "United States", "California") |
| `contact_city` | array[string] | Specific cities. **Use instead of `contact_location` for city-level targeting.** |

### Location (Exclude)

| Field | Type | Description |
|-------|------|-------------|
| `contact_not_location` | array[string] | Regions/Countries/States to exclude |
| `contact_not_city` | array[string] | Cities to exclude |

> ⚠️ **Important:** Choose either `contact_location` OR `contact_city`, not both. Same applies for exclude fields.

### Email Quality

| Field | Type | Options | Description |
|-------|------|---------|-------------|
| `email_status` | array[string] | `validated`, `not_validated`, `unknown` | Prefill: `validated` |

> 💡 **Best Practice:** Use `["validated"]` for outreach-ready lists. Add `"unknown"` to increase volume when needed.

### Company Targeting

| Field | Type | Description |
|-------|------|-------------|
| `company_domain` | array[string] | Limit to specific domains (e.g., "google.com", "apple.com") |
| `size` | array[string] | Company size ranges (see options below) |
| `company_industry` | array[string] | Include industries |
| `company_not_industry` | array[string] | Exclude industries |
| `company_keywords` | array[string] | Include free-text keywords |
| `company_not_keywords` | array[string] | Exclude free-text keywords |
| `min_revenue` | string | Minimum revenue band |
| `max_revenue` | string | Maximum revenue band |
| `funding` | array[string] | Funding stages |

#### Company Size Options
- `0-1`
- `2-10`
- `11-20`
- `21-50`
- `51-100`
- `101-200`
- `201-500`
- `501-1000`
- `1001-2000`
- `2001-5000`
- `10000+`

#### Revenue Bands
Range from `100K` to `10B`

#### Funding Stages
- `Seed`
- `Angel`
- `Series A`
- `Series B`
- `Series C`
- `Series D`
- `Series E`
- `Series F`
- `Venture`
- `Debt`
- `Convertible`
- `PE`
- `Other`

---

## 📤 Output Schema Reference

### Person Fields

| Field | Description |
|-------|-------------|
| `first_name` | Contact first name |
| `last_name` | Contact last name |
| `full_name` | Combined full name |
| `job_title` | Current job title |
| `headline` | LinkedIn headline |
| `functional_level` | Functional department |
| `seniority_level` | Seniority level |
| `email` | Verified business email |
| `mobile_number` | Mobile number (paid plans only) |
| `personal_email` | Personal email address |
| `linkedin` | LinkedIn profile URL |
| `city` | Contact city |
| `state` | Contact state |
| `country` | Contact country |

### Company Fields

| Field | Description |
|-------|-------------|
| `company_name` | Company name |
| `company_domain` | Company website domain |
| `company_website` | Full website URL |
| `company_linkedin` | Company LinkedIn page |
| `company_linkedin_uid` | LinkedIn company ID |
| `company_size` | Employee count range |
| `industry` | Industry category |
| `company_description` | Company description |
| `company_annual_revenue` | Revenue (formatted) |
| `company_annual_revenue_clean` | Revenue (numeric) |
| `company_total_funding` | Total funding (formatted) |
| `company_total_funding_clean` | Total funding (numeric) |
| `company_founded_year` | Year founded |
| `company_phone` | Company phone |
| `company_street_address` | Street address |
| `company_city` | Company city |
| `company_state` | Company state |
| `company_country` | Company country |
| `company_postal_code` | Postal code |
| `company_full_address` | Complete address |
| `company_market_cap` | Market cap (public companies) |

### Context Fields

| Field | Description |
|-------|-------------|
| `keywords` | Relevant keywords |
| `company_technologies` | Tech stack used by company |

---

## 🎯 Example Input Configurations

### Example 1: US SaaS Marketing Leaders

```json
{
  "contact_job_title": ["Head of Marketing", "VP Marketing", "CMO"],
  "functional_level": ["marketing"],
  "contact_location": ["united states"],
  "company_industry": [
    "computer software",
    "internet",
    "information technology & services",
    "marketing & advertising",
    "saas"
  ],
  "email_status": ["validated"],
  "fetch_count": 5000
}
```

### Example 2: UK CTOs and Engineering Leaders

```json
{
  "contact_job_title": ["CTO", "Head of Engineering", "VP Engineering"],
  "contact_location": ["united kingdom"],
  "email_status": ["validated", "unknown"],
  "fetch_count": 2000
}
```

### Example 3: Startup Founders (Funded Companies)

```json
{
  "seniority_level": ["Founder", "Owner", "C-Level"],
  "contact_location": ["united states", "united kingdom", "germany"],
  "size": ["2-10", "11-20", "21-50"],
  "funding": ["Seed", "Angel", "Series A", "Series B"],
  "email_status": ["validated"],
  "fetch_count": 3000
}
```

### Example 4: E-commerce Decision Makers

```json
{
  "contact_job_title": ["CEO", "Founder", "Head of E-commerce", "E-commerce Director"],
  "company_industry": ["retail", "e-commerce", "consumer goods"],
  "min_revenue": "1M",
  "max_revenue": "100M",
  "email_status": ["validated"],
  "fetch_count": 5000
}
```

### Example 5: Tech Companies in SF Bay Area

```json
{
  "seniority_level": ["C-Level", "VP", "Director"],
  "contact_city": ["San Francisco", "Palo Alto", "Mountain View", "San Jose"],
  "company_industry": ["computer software", "internet", "saas"],
  "email_status": ["validated"],
  "fetch_count": 2000
}
```

---

## 💰 Pricing & Limits

| Plan | Leads per Run | Mobile Numbers | Cost |
|------|---------------|----------------|------|
| **Free Apify** | 100 max | ❌ Not included | Free |
| **Paid Apify** | 50,000 max | ✅ Included | ~$1.5 / 1,000 leads |

---

## 🏗️ Mailsmith Integration Architecture

### Database Mapping

Map Apify output fields to Mailsmith's `leads` table:

```sql
-- Apify Output → Mailsmith leads table
INSERT INTO leads (
  organization_id,
  first_name,
  last_name,
  email,
  phone,
  linkedin_url,
  company_name,
  company_domain,
  job_title,
  industry,
  company_size,
  location,
  raw_scraped_data,
  source,
  scrape_job_id
) VALUES (
  -- organization_id (from context)
  -- first_name ← apify.first_name
  -- last_name ← apify.last_name
  -- email ← apify.email
  -- phone ← apify.mobile_number
  -- linkedin_url ← apify.linkedin
  -- company_name ← apify.company_name
  -- company_domain ← apify.company_domain
  -- job_title ← apify.job_title
  -- industry ← apify.industry
  -- company_size ← apify.company_size
  -- location ← CONCAT(apify.city, ', ', apify.state, ', ', apify.country)
  -- raw_scraped_data ← entire apify row as JSONB
  -- source ← 'apify_leads_finder'
  -- scrape_job_id ← (from context)
);
```

### Execution Flow

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                         LEAD SCRAPING FLOW                                   │
└─────────────────────────────────────────────────────────────────────────────┘

  1. USER INPUT           2. VALIDATION         3. APIFY CALL
  ─────────────────────────────────────────────────────────────────────────
  
  User fills form    →   Validate filters   →   Call Apify API
  (UI or API)            (business rules)       (POST /runs)
                                                    │
                                                    ▼
  6. READY FOR           5. DEDUPLICATION     4. PROCESS RESULTS
     NURTURING                                     
  ─────────────────────────────────────────────────────────────────────────
  
  Leads marked        ←  Remove duplicates   ←  Receive webhook
  pending for             by email/linkedin      Transform data
  icebreaker                                     Insert to DB
```

### Webhook Handler

```typescript
// POST /api/webhooks/apify/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  // Verify Apify webhook
  const { resource, eventType, eventData } = body;
  
  if (eventType === 'ACTOR.RUN.SUCCEEDED') {
    const runId = resource.id;
    
    // 1. Fetch dataset items
    const results = await fetchApifyResults(runId);
    
    // 2. Transform and deduplicate
    const leads = transformApifyLeads(results);
    const dedupedLeads = deduplicateLeads(leads);
    
    // 3. Insert to database
    await insertLeads(dedupedLeads, scrapeJobId);
    
    // 4. Update scrape job status
    await updateScrapeJobStatus(scrapeJobId, 'completed', {
      leads_found: results.length,
      leads_imported: dedupedLeads.length
    });
    
    // 5. Trigger icebreaker generation (if enabled)
    await triggerIcebreakerGeneration(dedupedLeads);
  }
  
  return Response.json({ success: true });
}
```

---

## 🖥️ UI Components

### Lead Scraper Dashboard

The scraper UI should include:

1. **Preset Templates**
   - Quick-start templates for common use cases
   - Save custom search configurations

2. **Filter Builder**
   - People targeting section
   - Location targeting section
   - Company targeting section
   - Email quality selector

3. **Search Preview**
   - Estimated lead count before running
   - Cost estimate
   - Filter summary

4. **Job History**
   - List of past scrape jobs
   - Status (pending, running, completed, failed)
   - Leads found vs imported
   - Re-run capability

### Filter Categories for UI

```typescript
// UI filter configuration
const SCRAPER_FILTERS = {
  people: {
    jobTitle: { type: 'multi-select-creatable', label: 'Job Titles' },
    notJobTitle: { type: 'multi-select-creatable', label: 'Exclude Titles' },
    seniority: { 
      type: 'multi-select', 
      label: 'Seniority Level',
      options: ['Founder', 'Owner', 'C-Level', 'Director', 'VP', 'Head', 'Manager', 'Senior', 'Entry', 'Trainee']
    },
    functional: {
      type: 'multi-select',
      label: 'Function',
      options: ['C-Level', 'Finance', 'Product', 'Engineering', 'Design', 'HR', 'IT', 'Legal', 'Marketing', 'Operations', 'Sales', 'Support']
    }
  },
  location: {
    location: { type: 'multi-select-creatable', label: 'Region/Country/State' },
    city: { type: 'multi-select-creatable', label: 'Cities (use instead of location)' },
    notLocation: { type: 'multi-select-creatable', label: 'Exclude Region/Country/State' },
    notCity: { type: 'multi-select-creatable', label: 'Exclude Cities' }
  },
  company: {
    domain: { type: 'multi-select-creatable', label: 'Specific Domains' },
    size: { 
      type: 'multi-select', 
      label: 'Company Size',
      options: ['0-1', '2-10', '11-20', '21-50', '51-100', '101-200', '201-500', '501-1000', '1001-2000', '2001-5000', '10000+']
    },
    industry: { type: 'multi-select-creatable', label: 'Industries' },
    notIndustry: { type: 'multi-select-creatable', label: 'Exclude Industries' },
    keywords: { type: 'multi-select-creatable', label: 'Keywords' },
    notKeywords: { type: 'multi-select-creatable', label: 'Exclude Keywords' },
    minRevenue: { type: 'select', label: 'Min Revenue', options: ['100K', '500K', '1M', '5M', '10M', '25M', '50M', '100M', '250M', '500M', '1B', '5B', '10B'] },
    maxRevenue: { type: 'select', label: 'Max Revenue', options: ['100K', '500K', '1M', '5M', '10M', '25M', '50M', '100M', '250M', '500M', '1B', '5B', '10B'] },
    funding: {
      type: 'multi-select',
      label: 'Funding Stage',
      options: ['Seed', 'Angel', 'Series A', 'Series B', 'Series C', 'Series D', 'Series E', 'Series F', 'Venture', 'Debt', 'Convertible', 'PE', 'Other']
    }
  },
  quality: {
    emailStatus: {
      type: 'multi-select',
      label: 'Email Quality',
      options: ['validated', 'not_validated', 'unknown'],
      default: ['validated']
    },
    fetchCount: { type: 'number', label: 'Max Leads', default: 1000, max: 50000 }
  }
};
```

---

## ✅ Best Practices

### Query Optimization

1. **Start broad, then narrow**
   - Begin with Location + title
   - Add industry/revenue/funding to refine

2. **Use include & exclude together**
   - Quickly remove irrelevant sectors with `company_not_industry` / `company_not_keywords`

3. **Location vs City rule**
   - Choose one, not both
   - Use `contact_location` for region/country/state
   - Use `contact_city` for city-level targeting

4. **Email quality balance**
   - `validated` only = higher quality, lower volume
   - `validated` + `unknown` = more leads, mixed quality

### Deduplication Strategy

When merging runs or importing leads, deduplicate by:
1. `email` (primary key)
2. `linkedin` (if email missing)
3. `(full_name, company_domain)` (last resort)

### Compliance

- Use for **B2B prospecting only**
- Follow **GDPR/CCPA/PECR** and local regulations
- Provide opt-out mechanisms in outreach

---

## 🧯 Troubleshooting

| Problem | Solution |
|---------|----------|
| **Few or zero results** | Loosen filters, remove `company_not_*`, broaden location, allow `unknown` email status, try title synonyms |
| **Too many results** | Add industry, revenue, funding constraints, or switch from region to country/state/city |
| **Geography mismatches** | Don't mix regions with cities; use either `contact_location` OR `contact_city` |
| **Duplicate leads** | Run deduplication by email → linkedin → (full_name, company_domain) |

---

## 🔄 Future Enhancements

1. **Smart Search Templates**
   - Pre-built templates by vertical (SaaS, E-comm, Fintech)
   - Industry-specific job title mappings

2. **Lead Quality Scoring**
   - Score leads based on data completeness
   - Flag leads with verified emails as "hot"

3. **Search History & Analytics**
   - Track which search parameters yield best results
   - ROI per scrape (leads that converted)

4. **Real-time Cost Estimation**
   - Show estimated cost before running
   - Warn when approaching plan limits

---

## 📎 Related Documents

- [IMPLEMENTATION_PLAN.md](./IMPLEMENTATION_PLAN.md) - Overall system architecture
- [ADMIN_DASHBOARD_SPEC.md](./ADMIN_DASHBOARD_SPEC.md) - Admin console specification
- [CUSTOMER_DASHBOARD_SPEC.md](./CUSTOMER_DASHBOARD_SPEC.md) - Customer dashboard specification
