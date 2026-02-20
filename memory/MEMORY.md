# MEMORY.md - Atlas Long-Term Memory

## Nathan - Core Context

- Husband first. Christian. Builder.
- Product leader: part-time at Swizzel and Givo, building his own startup
- Startup: CEO / BD / product / customer work. Short-term goal is buying time.
- Lives at vision × execution. Strategy × shipping. Ambition × responsibility.
- Wants to build physical buildings eventually. For now: products, systems, leverage.

## Atlas - Operating Principles

- Hold the long arc. Remember what matters when Nathan forgets.
- Push back. Zoom out. Protect focus. Call out drift.
- No flattery. No filler. Truth and utility.

## Plotzy.ai

- Nathan's startup: plotzy.ai
- Email: nathan@plotzy.ai
- Details: researching overnight (see memory/research-plotzy-2025-07-17.md)

## Nathan Online

- X/Twitter: @nathansrobinson

## Architecture Helper — Current State

- atlas@architecturehelper.com account (admin)
- City guides live: SF (8 buildings), Chicago (9 buildings), Den Haag (10/32), Denver (14/56), **New Orleans (14 buildings, IDs 921-934)**, **NYC (18 buildings, IDs 935-952)**
- PRs merged: #1-#7 all deployed
  - #5: style normalization (rake styles:normalize_all run)
  - #6: building count fix, Select All, multi-style cards
  - #7: **async GPT analysis** (ProcessBuildingAnalysisJob) + admin building management
- Admin UI: /admin/building_analyses — search, delete, bulk actions, visibility toggle
- Admin UI: /admin/places — place management, content editing
- Browser working: headless Chromium via Playwright on VPS
- Image optimization: Pillow available for resize/compress before upload
- Key learning: always optimize images before upload (70-95% size reduction), submit via image upload path (not address search)
- GPT analysis is now async via Sidekiq worker — no more R12 timeouts

## Pinterest System

- Business account: Architecture Helper (@nathaninproduct), login nathaninproduct@gmail.com
- Creds: ~/.config/secrets/pinterest.env
- 10 boards: 4 city + 6 style
- Pin creation: "Save from website" flow (enter building URL, Pinterest pulls S3 image)
- Template v1: "{building_name} | {primary_style} Architecture in {city}"
- Tracking: memory/pinterest-pins.json
- Cron: 4x daily posting (bc621e88), 3-day performance review (9bfc068d)

## Atlas Dashboard

- Repo: sichuanlambda/atlas (push access, no PRs needed)
- URL: sichuanlambda.github.io/atlas
- I update data.json → dashboard re-renders
- Has file sharing workspace (files/from-nathan/ for Nathan to drop assets)

## Zoning Data System

- Pipeline script: zoning-data/acquire.py (pagination, batch mode, point-in-polygon testing)
- **10 cities acquired, ~120K zones, ~566 MB total**
  - CA: Los Angeles (58K), Sacramento (11K), San Francisco (1.6K)
  - TX: Austin (22K), Dallas (3.8K)
  - FL: Tampa (11K), Miami-Dade (4K), Orlando (2K), Fort Lauderdale (739)
  - OK: Norman (4.4K) — proof of concept
- Not available: Houston (no zoning law), San Antonio (733K too large), Fort Worth/San Diego/San Jose/Jacksonville (no public ArcGIS)
- Coverage data: zoning-data/coverage.json
- Key insight: county assessor + ArcGIS zoning + municipal code = complete property zoning lookup from public sources
- **Potential Plotzy product feature**: enter address → instant zone + ordinance meaning

## Next Cities Pipeline

- Wave 1 (next): Washington DC, Philadelphia, Boston
- Wave 2: Los Angeles, Detroit, Savannah
- Wave 3: Miami, Charleston, Pittsburgh, Nashville
- Philadelphia = sweet spot: rich architecture, large city, surprisingly underserved SEO
- Report: memory/next-cities-ranking.md

## cresoftware.tech

- Repo: sichuanlambda/cre-directory (GitHub Pages static site)
- DNS on GitHub Pages (old AWS IP gone as of 2026-02-17)
- G2-style product pages: rich schema with feature_groups, pricing plans, pros/cons, company info, integrations
- 30/174 products enriched with real scraped data. Cost: ~$0.04/product on Sonnet.
- Homepage: clean hero, trust bar, featured tools, dynamic search, trust section
- Category pages: editorial content + FAQ with JSON-LD for all 14 categories
- Submit form: Formspree https://formspree.io/f/maqdjvqo
- Enrichment approach: scrape company websites (G2/Capterra/Crunchbase all block datacenter IPs)

## Google Search Console

- Service account: atlas-indexing@stoked-virtue-413221.iam.gserviceaccount.com
- Needs JSON key file from Nathan + Owner permission in Search Console for both sites
- Plan: indexing script, auto-submit new pages, sitemap generator, cron

## City Guide Expansion Pipeline

- 14 new cities in pipeline (Wave 1: DC/Philly/Boston/Barcelona, Wave 2: Bruges/Edinburgh/Kraków/Tirana/Istanbul/Rome/Detroit/Savannah/LA/Miami)
- SEO copy written for all 14
- Image sourcing: Wikipedia rate-limited. Use more sources (Wikimedia Commons API, Flickr Commons, HABS/LOC, Unsplash). Don't reduce resolution.
- Building submission: CSRF issues with curl — use browser instead

## Architecture Helper — Current State (updated 2026-02-17)

- PRs merged: #1-#14 all deployed
  - #14: Building detail overhaul (structured JSON prompt, style pages, similar buildings, lightbox)
- Style pages now public (added to auth exempt list)
- Routes: /styles (index), /styles/:name (show), /building_library/styles/:name (by_style with library view)
- Cities live: Denver, Den Haag, SF, Chicago, New Orleans, NYC (6 cities, 14 more in pipeline)

## Runbooks System
- Created 2026-02-18 after wasting hours rediscovering building submission pitfalls
- Location: memory/runbooks/*.md
- Available: building-submission, pinterest-pin-creation, cre-product-enrichment, city-guide-pipeline, dashboard-updates, browser-automation
- Rule: every sub-agent reads the relevant runbook before starting work
- Rule: update runbooks when new pitfalls are discovered

## Building Submission — Critical Knowledge
- **Image first, address after** — address triggers Street View which overrides uploaded images
- Use external image URL field (ref e8), NOT file upload (broken in headless Chrome)
- Never use `form.submit()` — use `.click()` on the submit button
- After submission, add address via "Update Location" on the show page
- Wikimedia images work for GPT analysis (server-side download) but display broken on site (hotlink blocking)
- Full procedure: memory/runbooks/building-submission.md

## Architecture Helper — Current State (updated 2026-02-18)
- Cities live: Denver, Den Haag, SF, Chicago, New Orleans, NYC, DC, Philadelphia (8 cities)
- ~473 total buildings, 334 users
- Philly + Boston buildings being resubmitted with proper images (Street View issue fixed)
- PR #18 deployed: pagination, meta descriptions, OG tags, cache headers, canonical URLs
- 30 style pages with editorial content
- CRE Software: 174/174 products enriched, SSL fixed

## Pinterest — Current State (updated 2026-02-18)
- 7 pins published (all NOLA), 7 in queue
- 52 impressions, 7 saves, 5 clicks in ~48 hours
- Cron: 4x daily posting (bc621e88), 3-day review (9bfc068d)
- No API access for metrics — rely on Nathan screenshots
- Pontalba Buildings best performer (14 impressions) — style board cross-posting works

## Open Questions

- Nathan's timezone (not yet captured — seems US-based)
- What "buying time" looks like concretely
- Plotzy pricing, stage, traction — pending research
- Nathan offered to share financial position — advised broad strokes only (runway, income coverage) not exact numbers for security reasons

## Morning Briefing (Feb 19, 2026)
- Strategic memo at memory/nathan-morning-briefing.md covering 5 topics Nathan requested
- CRE OpenClaw SaaS plan: $99-799/mo tiers, 1-click deploy template, Plotzy zoning data as moat
- Top 3 integrations: Heroku CLI (#1), Email (#2), Google Search Console (#3)
- Dashboard killer feature: Decision Queue with one-tap approve/reject
- Money-making Tier 1 (do now): Zoning Data API + DFY reports + SEO affiliate = $3-15K/mo
- Nathan's core focus is Plotzy — everything else is proving ground

## PR #20: Image Performance
- Thumbnail system: Ruby helper + JS thumbUrl() + generate_thumbnails rake task
- fix_batch task: fixes last 7 broken images (hardcoded Wikimedia URLs)
- Expected ~90% page weight reduction on Place pages
- Nathan needs to merge, deploy, run 3 rake tasks

## Overnight Patterns (Feb 19)
- Hourly status cron was wasteful overnight — reduced to 4x daily
- Sub-agents work well for research/writing tasks (briefing done in 2 min)
- Wikimedia Commons API needs User-Agent header or returns 403 from VPS
- Building count corrected to ~500 across 9 cities (Den Haag is the 9th, was miscounted)

## Heroku CLI Access (Feb 19, 2026)
- Heroku CLI installed on VPS: /usr/local/bin/heroku v10.17.0
- API key at ~/.config/secrets/heroku.env
- Remote: `https://heroku:$HEROKU_API_KEY@git.heroku.com/boiling-atoll-02251.git`
- Atlas can now deploy and run rake tasks autonomously — full pipeline unblocked
- S3 bucket blocks ACLs — never use `acl: "public-read"` in upload calls

## Building Submission from X Posts / Photos
- Nathan sends photo or X link → Atlas identifies, finds address, submits
- X blocks web_fetch — use browser tool to extract from DOM
- External image URL field must be injected into form via JS (not in DOM by default)
- Buildings #1030 (Armour-Stiner Octagon House) and #1031 (Schwerin Castle) added this way

## CRE Software Directory — Current State (Feb 19)
- 208 total products (174 original + 34 new)
- 66 with real features, 142 still need enrichment
- Scout sub-agent pattern: read agents/scout.md first, commit in batches of 10
- Search fixed, new logo, quick filters, comparison badges live

## Thumbnail System — Paused
- Helper created but disabled — returns original URLs for now
- Rake task exists but only processed 64/409 before session timeout
- onerror fallback unreliable with lazy loading + S3 403s
- Re-enable after full thumbnail generation completes

## Content Queue System (Feb 19, 2026)
- Atlas Control Center page: sichuanlambda.github.io/atlas/#/content
- Data: /home/openclaw/projects/atlas/content-queue.json
- Accounts: @architectrHelpr (X, manual), @nathansrobinson (X, manual), @plotzyai (X, future), Pinterest (auto)
- Voice profiles per account — different tone for each
- Workflow: Atlas drafts → Nathan reviews → posts manually → shares analytics → Atlas learns
- Nathan can screenshot X analytics → Atlas tracks engagement and improves content

## X/Twitter Access (Feb 19, 2026)
- @architectrHelpr creds at ~/.config/secrets/x-architecturehelper.env
- Email: cdnathan.robinson@gmail.com
- Headless browser login blocked by X anti-bot — need API access
- Free tier: 1,500 tweets/mo at developer.x.com — Nathan to apply

## Image Validation Rule (Feb 19 — learned from Boston/Philly)
- Wikimedia Commons search returns documents, book covers, plaques — NOT just building photos
- MUST vision-validate all images before submitting to AH
- Updated runbook: memory/runbooks/building-submission.md
- Skip filenames with: .pdf, .tif, plan, diagram, plaque, marker, painting, interior

## Pinterest Queue Status (Feb 19)
- 90 pins total queue, 12 published
- All cities covered: SF, Chicago, NOLA, NYC, DC, Philly, Boston, standalone
- ~22 days of content at 4 pins/day
