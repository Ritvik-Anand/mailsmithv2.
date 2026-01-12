# Deployment Guide

> **Platform:** Vercel  
> **Domain:** Your custom domain

---

## 🚀 Quick Deploy

### Step 1: Login to Vercel
```bash
vercel login
```

### Step 2: Deploy
```bash
vercel --prod
```

### Step 3: Add Custom Domain
After deployment, go to:
1. Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Configure DNS records as shown

---

## 🔧 Environment Variables

Set these in Vercel Dashboard → Settings → Environment Variables:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Your Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anonymous key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key |
| `ANTHROPIC_API_KEY` | Anthropic API key for AI |
| `APIFY_API_TOKEN` | Apify token for scraping |
| `INSTANTLY_API_KEY` | Instantly API key |
| `NEXT_PUBLIC_APP_URL` | Your custom domain URL |
| `ADMIN_SECRET_KEY` | Admin authentication secret |

---

## 📋 DNS Configuration

For custom domain, add these DNS records:

### If using apex domain (example.com):
```
Type: A
Name: @
Value: 76.76.21.21
```

### If using subdomain (app.example.com):
```
Type: CNAME
Name: app
Value: cname.vercel-dns.com
```

---

## 🔄 Continuous Deployment

Connect your GitHub repo to Vercel for automatic deploys:
1. Push to GitHub
2. Connect repo in Vercel
3. Every push to `main` auto-deploys

---

## 🛡️ Production Checklist

- [ ] Environment variables set in Vercel
- [ ] Custom domain configured
- [ ] SSL certificate active (auto by Vercel)
- [ ] Supabase project ready
- [ ] RLS policies enabled in Supabase
