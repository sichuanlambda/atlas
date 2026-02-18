# CRE Product Enrichment Runbook
> Last updated: 2026-02-18

## Overview
Enrich product entries in cresoftware.tech with real data scraped from company websites.
Repo: /home/openclaw/projects/cre-directory
GitHub: sichuanlambda/cre-directory (use github-atlas.env token)

## Data Files
- `data/products.json` — all 174 products, source of truth
- `data/categories.json` — 14 category definitions

## Product Schema (enriched)
```json
{
  "name": "VTS",
  "slug": "vts",
  "category": "Leasing & Deal Management",
  "website": "https://www.vts.com",
  "description": "Real description from their site...",
  "features": ["Feature 1", "Feature 2"],
  "feature_groups": [
    {"name": "Core Features", "items": ["...", "..."]},
    {"name": "Analytics", "items": ["...", "..."]}
  ],
  "pricing": {
    "model": "Quote-based",
    "plans": [
      {"name": "Enterprise", "price": "Custom", "features": ["..."]}
    ]
  },
  "pros": ["Pro 1", "Pro 2"],
  "cons": ["Con 1", "Con 2"],
  "company": {
    "founded": "2012",
    "headquarters": "New York, NY",
    "employees": "500+",
    "funding": "$300M+"
  },
  "integrations": ["Yardi", "MRI"],
  "logo": "https://..."
}
```

## Enrichment Process

### Step 1: Identify unenriched products
- Check `data/products.json` for products with generic/empty descriptions
- Enriched products have `feature_groups`, `pros`, `cons`, `company` fields

### Step 2: Scrape company website
```
web_fetch(url=product.website, maxChars=5000)
```
- Extract: description, features, pricing, company info
- Look for /pricing, /features, /about pages

### Step 3: Generate enriched data
- Use the scraped content to fill all schema fields
- Be factual — only include info that's on their website
- Don't fabricate pricing if not public — use "Contact for pricing"
- Condense product page: no empty placeholder sections

### Step 4: Update products.json
- Edit the specific product entry in data/products.json
- Keep the slug, category, and website unchanged
- Add all enriched fields

### Step 5: Git push
```bash
source ~/.config/secrets/github-atlas.env
cd /home/openclaw/projects/cre-directory
git add -A && git commit -m "Enrich: {product_name}" && git push origin main
```

## Known Issues

### ❌ G2, Capterra, Crunchbase block datacenter IPs
- Can't scrape reviews from these sites
- Stick to company's own website for data
- Review data needs manual input, proxy, or paid APIs

### ❌ Some CRE companies have minimal websites
- Small vendors may have just a landing page
- Extract what you can; leave unknown fields empty
- Don't pad with generic filler

### Logos
- Try: company website favicon, SVG logo from homepage
- Fallback: Clearbit `https://logo.clearbit.com/{domain}`
- Some block Clearbit — check manually

## Cost
- ~$0.04 per product on Sonnet (web fetch + enrichment)
- Full 174 products = ~$7 total
- Batch in groups of 50 to manage context

## Quality Rules
- **No "Contact for pricing" noise** on cards — show real price or nothing
- **Condense** when data is missing — no empty state placeholders
- **Entire card clickable** on the directory page
- Every enriched product should feel like a real G2 listing
