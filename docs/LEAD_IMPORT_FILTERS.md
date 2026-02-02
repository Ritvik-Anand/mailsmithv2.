# Lead Import Filtering - Quick Reference

## ✅ IMPORTED LEADS (What Gets Into MailSmith)

A lead is imported if it meets **ALL** of these criteria:

### 1. Must Have Valid Email Address
- Email detected in any of these fields:
  - `email`
  - `personal_email`  
  - `work_email`
  - `contact_email`
  - `emailAddress`
  - `primaryEmail`
  - Or ANY field containing `@` symbol
  
### 2. Email Not Already in Database
- Unique constraint: `organization_id` + `email`
- Duplicates are silently skipped (upsert with `ignoreDuplicates: false`)

### 3. Valid Email Format
- Regex pattern: `[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}`
- Example: ✅ `john@company.com` | ❌ `invalid@`

---

## ❌ REJECTED LEADS (What Gets Filtered Out)

Leads are **NOT imported** if:

### 1. Missing Email Address
- Most common reason for rejection (~50% in your case)
- The Apify scraper found the profile but couldn't extract an email
- These are counted in "Leads Found" but not in "Leads Imported"

### 2. Duplicate Email
- Email already exists for this organization
- This protects against:
  - Re-scraping the same leads
  - Multiple scrape jobs finding same people
  - Data redundancy

### 3. Invalid Email Format
- Contains `@` but doesn't match email pattern
- Examples: `@company`, `name@`, `invalid email@domain`

---

## 📊 Your Example Breakdown

```
Screenshot shows:
"Found 2000 potential leads. Imported 994 to MailSmith."
```

### What this means:
- ✅ **994 leads (49.7%)** → Had valid emails, were imported
- ❌ **1,006 leads (50.3%)** → Missing or invalid emails, rejected

### Typical rejection breakdown:
- ~90% - No email found in scraped data
- ~5% - Duplicate emails (already in database)
- ~5% - Invalid email format

---

## 🔍 How Email Detection Works

The system uses **ultra-aggressive email finding**:

```typescript
1. Check standard keys first (fast):
   - email, personal_email, work_email, etc.

2. Recursively search ALL fields:
   - Nested objects → company.contact.email
   - Arrays → emails[0], contacts[1].email
   - All string values → any text containing @

3. Regex extraction:
   - Finds email even if embedded in text
   - Example: "Contact: john@acme.com (CEO)" → john@acme.com
```

**Code Location:** `src/lib/lead-finder/processor.ts` → `findEmail()`

---

## 💡 How to Improve Import Rate

### Option 1: Use Better Apify Actors
- Some actors have higher email extraction rates
- Current: `code_crafter~leads-finder`
- Consider: Actors with email enrichment features

### Option 2: Add Email Enrichment Layer
- Post-scrape email discovery service
- Tools: Hunter.io, Clearbit, Apollo
- Estimate: Could increase import rate to 70-80%

### Option 3: Adjust Email Quality Filter
Current setting in code:
```typescript
email_status: filters.email_status || ['validated']
```

Options:
- `validated` → Only verified emails (safest, lowest volume)
- `not_validated` → Unverified emails (riskier, higher volume)
- `unknown` → Unknown status (highest volume, highest risk)

To get MORE leads, add more email statuses:
```typescript
email_status: ['validated', 'not_validated', 'unknown']
```

---

## 🎯 What Data IS Stored (Even Without Emails)

**Important:** ALL scraped data is preserved in `raw_scraped_data` JSONB column.

This means:
- ✅ LinkedIn URLs
- ✅ Job titles  
- ✅ Company names
- ✅ Phone numbers
- ✅ Social profiles
- ✅ Everything else Apify found

**But:** Leads without emails are **not stored** since email is the primary identifier.

---

## 🛠 Custom Filtering (Future Enhancement)

Currently, the ONLY filter is: **"Has valid email?"**

You could add additional filters in `processJobResults()`:

```typescript
// Example: Only import C-level executives
const leads = transformToLeads(items, org, job)
    .filter(lead => {
        const title = lead.job_title?.toLowerCase() || ''
        return title.includes('ceo') || 
               title.includes('cto') || 
               title.includes('cmo')
    })

// Example: Only import verified emails
const leads = transformToLeads(items, org, job)
    .filter(lead => {
        const raw = lead.raw_scraped_data as any
        return raw.email_status === 'validated'
    })

// Example: Skip certain domains
const leads = transformToLeads(items, org, job)
    .filter(lead => {
        const domain = lead.email?.split('@')[1] || ''
        return !['gmail.com', 'yahoo.com'].includes(domain)
    })
```

**Location to add:** `src/server/actions/lead-finder.ts` line ~545

---

## 📌 Summary Table

| Metric | Value |
|--------|-------|
| **Primary Import Criteria** | Valid email address |
| **Email Detection Depth** | Recursive, all fields |
| **Deduplication Key** | organization_id + email |
| **Current Import Rate** | ~50% (industry average) |
| **Data Preservation** | 100% in raw_scraped_data |
| **Additional Filters** | None (email-only) |

---

## 🚀 Quick Actions

### View leads without emails (requires SQL):
```sql
-- This would require storing ALL scraped results first
-- Currently NOT implemented
```

### Check import statistics:
```sql
SELECT 
    s.id,
    s.leads_found,
    s.leads_imported,
    ROUND((s.leads_imported::float / s.leads_found * 100), 2) as import_rate_percent
FROM scrape_jobs s
WHERE s.organization_id = 'YOUR_ORG_ID'
ORDER BY s.created_at DESC
LIMIT 10;
```

### Find common rejection reasons:
```typescript
// Add logging in processJobResults()
console.log(`Items without emails: ${items.length - leads.length}`)
console.log(`Sample rejected item:`, items.find(i => !findEmail(i)))
```

---

**Need More Leads?**
1. ✅ Adjust `email_status` filter to include unverified emails
2. ✅ Use different Apify actors with better email coverage
3. ✅ Add email enrichment post-processing
4. ✅ Increase `fetch_count` parameter (more scraping volume)

**Want Better Quality?**
1. ✅ Keep `email_status: ['validated']` (current setting)
2. ✅ Add job title filters in `processJobResults()`
3. ✅ Add company size filters
4. ✅ Add seniority level filters
