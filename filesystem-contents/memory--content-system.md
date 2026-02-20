# Content System Design

## Two Triggers

### 1. Event-Driven (when new content is added)
- **New city added** → Queue a city thread (5-post thread with images, like Tirana format)
- **New buildings added** → Queue 2-3 individual building spotlights
- **New CRE product enriched** → Queue "New tool added" post for @CRESoftware
- Triggered inline during the city pipeline, not via cron

### 2. Steady Drip (daily cron)
- Runs 1x daily at 14:00 UTC (~9am EST)
- Picks from a rotating template library
- Schedules to `next-free-slot` on Typefully
- Pulls building data from Heroku DB so content is always fresh

## Template Library (rotate through)

### @ArchitectrHelpr
1. **Building spotlight** — Single building, surprising fact + image + link
2. **Style roundup** — "4 [style] buildings in [city]" + hero image
3. **City thread** — 5-post thread with grouped images (event-driven only)
4. **Architect spotlight** — Focus on one architect, 2-3 buildings
5. **Detail/comparison** — "Gothic vs Neo-Gothic" / "This building is hiding..."
6. **Engagement question** — "What's the most beautiful building in [city]?"
7. **Fun fact** — Single surprising architectural fact
8. **Before/after** — Historical context of a building

### @CRESoftware
1. **New product** — "Just added [X]. [What it does]. [Notable detail]."
2. **Category spotlight** — "[Category] is crowded. Here are 3 worth knowing."
3. **Comparison angle** — "[A] vs [B] — different approaches"
4. **Industry observation** — Trend + relevant products
5. **Stat/data** — Pricing or feature trends across the directory

## Scheduling Strategy
- @ArchitectrHelpr: 1-2 posts/day → `next-free-slot`
- @CRESoftware: 3-4 posts/week → `next-free-slot`
- @NathanSRobinson: Drafts only, never auto-schedule

## Content State Tracking
- Track what's been posted in `memory/content-posted.json`
- Track which buildings/cities/products have been featured
- Avoid repeating the same building within 30 days
- Rotate through templates evenly

## Thread Format (for city launches)
- Post 1: Opener + 2 images (hook)
- Post 2: Style group 1 + 2-3 images
- Post 3: Style group 2 + 2-3 images  
- Post 4: Style group 3 + 2-3 images
- Post 5: CTA with link to Place page (no image)

## Image Upload Flow
1. POST `/v2/social-sets/{id}/media/upload` → get presigned URL + media_id
2. Download image from S3 to /tmp
3. PUT to presigned URL (NO Content-Type header)
4. Wait 15s for processing
5. Reference media_id in draft posts
