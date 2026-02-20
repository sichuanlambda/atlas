# Architecture Helper — Vision Document
*Last updated: 2026-02-18*

## Vision Statement

Architecture Helper becomes the world's definitive visual encyclopedia of notable buildings — the "Shazam for architecture." Any building worth knowing about is cataloged, analyzed by AI, and explorable through maps, style connections, and historical context. We're building the interface between people and the built environment.

Not a social network. Not a design tool. A **knowledge platform** for the physical world, starting with architecture.

## Current State

| Metric | Value |
|--------|-------|
| Buildings cataloged | 473 |
| Cities covered | 8 (Denver, Den Haag, SF, Chicago, New Orleans, NYC, DC, Philadelphia) |
| Users | 334 |
| Style pages (editorial) | 30 |
| AI stack | GPT-4o analysis, DALL-E generation |
| Maps | Mapbox |
| Primary channel | Pinterest + programmatic SEO |

**What's working:** Programmatic SEO infrastructure is solid — every building, style, and city is a rankable URL. Pinterest drives visual discovery. AI analysis gives us content depth no competitor matches at our scale. The European city (Den Haag) proves international expansion works with the same pipeline.

**What's not working yet:** User retention is unclear. No engagement loop beyond browse-and-leave. No mobile experience. No community. Growth is linear, not compounding.

## Product Roadmap

### Months 1–3: Content Engine + Retention Loop

**Priority: Make the existing product stickier and grow the content flywheel.**

1. **"Submit a Building" pipeline** — Let users add buildings. Light moderation queue. This is the single most important feature to build. Every user-submitted building = free content + engagement + ownership feeling. Target: 50 submissions/month by month 3.
2. **Neighborhood-level guides** — Break cities into walkable zones. "Architecture walk: Chicago Loop" with a route. Each neighborhood = new rankable URL. This is what turns a database into a travel product.
3. **Collections/favorites** — Users save buildings to personal lists. Dead simple. Creates accounts, return visits, and data on what people care about.
4. **Email capture + weekly digest** — "Best architecture finds this week." Low effort, compounds over time.

### Months 3–6: Mobile + Depth

5. **Mobile-optimized PWA** — Not a native app yet. PWA with "Add to Home Screen," location-aware nearby buildings, walking directions. Architecture is experienced on foot — mobile is essential.
6. **Interior design mode** — AI analysis of interior spaces, not just facades. Opens a massive new content category. Interior keywords have 10x the search volume of exterior architecture.
7. **Comparison view** — "Art Deco in Chicago vs. Art Deco in NYC." Side-by-side style analysis. Unique content, highly shareable, great for SEO.
8. **10 more cities** — Prioritize: London, Paris, Barcelona, LA, Boston, Portland, Amsterdam, Berlin, Tokyo, Dubai. Mix of high-tourism + strong architecture identity.

### Months 6–12: Platform + Revenue

9. **API for developers** — Architecture data as a service. Real estate platforms, travel apps, education tools can integrate our analysis. This is the long-term moat play.
10. **AR building identification** — Point phone at building, get instant analysis. Tech is ready (ARKit/ARCore + our data). This is the "wow" feature that gets press coverage.
11. **Guided tours marketplace** — Partner with local guides or let users create paid walking tours. Revenue + content + community.
12. **Education partnerships** — Architecture schools, history departments. Bulk access, curriculum integration.

## Go-to-Market Strategy

### Phase 1: 334 → 10K users (Months 1–6)

**Pinterest (40% of effort)**
- Already working. Double down. Post 5–10 pins/day across style boards.
- Create "Best of [City]" boards. "Art Deco Buildings" board. "Brutalist Architecture" board.
- Rich Pins with building metadata. Every pin links to a building page.
- Target: 500K monthly pin impressions → 5K monthly site visits from Pinterest alone.

**Programmatic SEO (30% of effort)**
- Current asset: 473 building pages + 30 style pages + 8 city guides = 500+ rankable URLs.
- Expand to neighborhood pages (8 cities × 10 neighborhoods = 80 new pages).
- Target long-tail: "art deco buildings in chicago," "brutalist architecture san francisco," "best architecture in den haag."
- Internal linking between style↔city↔building. Every page should link to 5+ others.
- Target: 20K organic monthly visits by month 6.

**Reddit (15% of effort)**
- Share genuinely interesting building analyses in r/architecture (890K), r/ArchitecturePorn (1M+), city subs.
- Not spam. Share the AI analysis as a comment, link to full page. Be a contributor, not a marketer.
- One high-quality post per week. If it resonates, 2–5K visits per post.

**Content marketing (15% of effort)**
- Monthly "best architecture in [city]" blog posts. Listicle format. These rank.
- "Architecture style guide" series — definitive explainers for each style. Evergreen SEO.
- Guest posts on travel blogs and architecture publications.

### Phase 2: 10K → 100K users (Months 6–12)

- **Instagram/TikTok** — Short-form video: "AI analyzes this building" format. Before/after of DALL-E generation. Building walkthroughs. This is the viral channel.
- **Backlink outreach** — Architecture blogs, travel sites (Atlas Obscura, Condé Nast Traveler city guides), education resources. Our building pages are genuinely useful references.
- **Press** — AR feature launch is the press hook. "Shazam for buildings" narrative. Tech + architecture crossover story.
- **Partnerships** — Tourism boards want people walking around their cities. Offer co-branded city guides.

## Feature Priorities (Ranked)

| Priority | Feature | Why |
|----------|---------|-----|
| 1 | Submit a Building | Content flywheel. Without this, growth is linear. |
| 2 | Collections/favorites | Retention. Accounts. Return visits. |
| 3 | Neighborhood guides | SEO + travel use case. Makes it a "go-to" resource. |
| 4 | Email digest | Retention channel you own. |
| 5 | Mobile PWA | Architecture is experienced on foot. |
| 6 | Interior design mode | Massive keyword expansion. |
| 7 | 10 more cities | Content breadth for SEO + international growth. |
| 8 | AR identification | Press + wow factor. But not until foundation is solid. |

**What I'm NOT building yet:** Native app (PWA first), social features beyond collections (too early), paid plans (need 10K+ users first), marketplace (need supply first).

## Revenue Model

**Phase 1 (0–10K users): $0. Don't monetize yet.**
Focus entirely on growth and content. Premature monetization kills momentum.

**Phase 2 (10K–50K users): Light monetization**
- **Affiliate links** — "Visit this building" → hotel/tour booking links near notable buildings. Architecture tourism is a real spending category. Target: $500–2K/month.
- **Premium analysis** — Free users get basic info. Premium gets full AI analysis, historical context, architect deep-dives, HD DALL-E renders. $5/month or $40/year. Target: 2% conversion = $4K–10K/month at 50K users.

**Phase 3 (50K+ users): Platform revenue**
- **API access** — Real estate platforms pay for architectural analysis of their listings. $0.10–0.50 per analysis. This could be the biggest revenue line.
- **Guided tours** — Take a cut of bookings. 15–20% commission.
- **Sponsored city guides** — Tourism boards pay for featured placement. $2K–10K per city partnership.
- **Education licenses** — University/school bulk access. $500–2K/year per institution.

**What I'm NOT doing:** Display ads. They destroy the aesthetic of an architecture product. The irony would be too much.

## Competitive Landscape

| Competitor | What they do | Our advantage |
|------------|-------------|---------------|
| ArchDaily | Architecture news/projects for professionals | We're for consumers. Different audience entirely. |
| Dezeen | Architecture media | Same — professional media, not a discovery tool. |
| Atlas Obscura | Unusual places | Broader scope, not architecture-specific. No AI analysis. |
| Google Maps | Has building info | No architectural analysis, no style categorization, no depth. |
| Zillow/Redfin | Real estate listings | Architecture is an afterthought. No style analysis. |
| Wikipedia | Building articles | No visual discovery, no maps, no AI analysis, no curation. |

**Our moat:**
1. **AI-powered analysis at scale** — Nobody else runs every building through GPT-4o for style analysis, historical context, and architectural significance. This creates unique content that's expensive to replicate.
2. **Structured architecture data** — Buildings tagged by style, city, era, architect, with cross-references. This is a dataset that gets more valuable over time.
3. **Programmatic SEO infrastructure** — 500+ unique, useful pages, each rankable. This compounds.
4. **Visual-first UX** — Built for discovery, not reading articles.

**Honest weakness:** Content moat is thin at 473 buildings. Need to get to 5K+ buildings to be defensible. User-generated submissions are critical.

## Key Metrics

### Now → 1K users
- Buildings cataloged (target: 1,000)
- Monthly organic traffic (target: 10K visits)
- Pinterest impressions (target: 500K/month)
- User submissions per month (target: 50)

### 1K → 10K users
- Monthly active users (target: 3K MAU)
- Pages per session (target: 3+, indicates exploration)
- Email subscribers (target: 2K)
- Cities covered (target: 18)
- Organic keywords ranking top 10 (target: 200)

### 10K → 100K users
- Revenue (target: $5K MRR)
- API requests/month
- Premium conversion rate (target: 2%)
- User-submitted buildings/month (target: 500)
- Press mentions

**The one metric that matters most right now: buildings cataloged.** Everything else — SEO, Pinterest, retention — scales with content. Get to 1,000 buildings fast, by any means necessary.
