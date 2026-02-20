# Architecture Helper - Comprehensive Codebase Briefing

**Date:** 2025-07-17
**Repository:** https://github.com/sichuanlambda/feedback-loop
**Product:** Architecture Helper (app.architecturehelper.com)
**Purpose:** Briefing for Atlas to run this project autonomously

---

## 1. Tech Stack Summary

| Component | Technology |
|-----------|-----------|
| **Framework** | Ruby on Rails 7.1.1 (Ruby 3.3.0) |
| **Database** | PostgreSQL (production), SQLite (development) |
| **Background Jobs** | Sidekiq + Redis |
| **AI/LLM** | OpenAI API (GPT-4o-mini for analysis, DALL-E 3 for generation) |
| **File Storage** | AWS S3 (buckets: `architecture-explorer`, `architecture-generated`) |
| **Image Processing** | MiniMagick, ImageProcessing gem |
| **Auth** | Devise + Google OAuth2 (omniauth) |
| **Payments** | Stripe (subscriptions + credits) |
| **Geocoding** | Geocoder gem + Google Maps API |
| **Maps** | Mapbox GL JS |
| **CSS/JS** | Bootstrap 4.5.2, jQuery, Importmap (no Webpack in practice despite config files existing) |
| **Analytics** | Google Analytics (G-M4TLZ8N6CC), Plausible, PostHog |
| **Hosting** | Heroku (based on Procfile, rails_12factor gem) |
| **SEO** | sitemap_generator gem |
| **Deployment** | Dockerfile present but likely Heroku-based (Procfile) |

---

## 2. Feature Inventory

### Core Features (Architecture Helper)
1. **Building/Design Analysis** — Upload a photo → GPT-4o-mini identifies architectural styles with confidence percentages, generates HTML report. Uses a fixed list of ~100+ architectural styles.
2. **AI Image Generation** — 3-step wizard: pick building type → select styles → generate with DALL-E 3. Images stored in S3.
3. **Building Library** — Public gallery of analyzed buildings, searchable by style. Users can share/unshare their analyses.
4. **City/Place Guides** — SEO-focused pages for cities (Denver, Amsterdam, NYC, etc.) with maps, building lists, style breakdowns, virtual tours, and walking tour route planning.
5. **Style Finder** — Quiz-like feature that analyzes your style preferences and generates a witty "architecture personality" title.
6. **Development Estimations** — Satellite image analysis for real estate development insights.
7. **Interactive Map** — Mapbox-based map showing analyzed buildings with markers.
8. **Virtual Tour** — Modal-based tour through selected buildings with navigation.
9. **Walking Tour Planner** — Select buildings → generates optimized walking route with distance/duration estimates.
10. **User Profiles** — Public profiles with handle, bio, stats (styles explored, buildings submitted).

### Legacy/Side Features (from "Nathan's Platform" era)
- **Rate My Dog** 🐶 — Upload dog photo → GPT rates it
- **Tweet Roastery** 🔥 — GPT roasts tweets
- **Screenshot Text Extractor** — AWS Textract OCR
- **Feedback System** — Original app purpose (thumbs up/down + comments)
- **Research Prompt** — Unclear purpose, seems experimental

### Admin Portal
- Dashboard with analytics
- Manage building analyses (visibility, bulk update)
- Manage users (admin toggle, activity tracking)
- **Places management** — Create/edit/delete places, auto-generate from building data, preview candidates, merge duplicates, trigger content generation

---

## 3. How City Guides (Places) Work

### Data Model
```
Place:
  - name, slug (auto-generated, URL-friendly)
  - latitude, longitude, zoom_level
  - description (short), content (HTML article body)
  - published, featured (booleans)
  - meta_title, meta_description (SEO)
  - hero_image_url, hero_image_alt, representative_image_url
  - content_generated_at, image_source
```

### How Places Are Created
Three methods:

1. **Manual** — Admin creates via admin panel with coordinates and content
2. **Auto-generated from building analyses** — `AutoPlaceGenerator` groups `BuildingAnalysis` records by `city` field, creates Place for any city with 3+ visible buildings. Takes coordinates from sample building.
3. **Seed data** — `db/seeds_places.rb` has Denver, Amsterdam, NYC with hand-written content

### City Field Population
- `BuildingAnalysis` has a `city` field added later (migration 2024-09-09)
- `AutoPlaceGenerator.populate_city_from_address` parses city from address strings using regex patterns
- `consolidate_city_names` maps variations ("Denver CO" → "Denver")

### Content Generation Pipeline
1. Place created (manually or auto)
2. `GeneratePlaceContentJob` queued
3. `PlaceContentGenerator` service runs:
   - Attempts to generate content via AI (but `generate_content_with_ai` **returns nil — it's a stub!**)
   - Falls back to template-based HTML content
   - Generates SEO meta title/description from building style data
   - Tries Unsplash API for hero image, falls back to random building image
4. Sitemap regenerated

### Building-Place Association
- **Not a database foreign key** — Places find buildings via geographic proximity: `latitude ± 0.1, longitude ± 0.1` AND `visible_in_library = true`
- PlacesController also searches by `LOWER(address) LIKE %city_name%`
- This means the same building could appear in multiple places if they overlap

### Adding New Cities
To add Denver or The Hague:
1. Ensure buildings exist with proper `city` field or parseable addresses
2. Use admin "Preview Generation" to see candidates
3. Select and confirm, or create manually
4. Content auto-generates (but will be template/fallback since AI generation is stubbed)
5. For quality results: manually write content or fix the AI generation stub

---

## 4. Monetization Model

### Credits System
- New users get **5 credits** (was 3 at one point, code says 5 in `set_default_credits`, schema default is 3 — **inconsistency**)
- Credits presumably consumed per building analysis or image generation (but **no code deducting credits was found** — the credit system appears incomplete/unused)

### Stripe Integration
- Users have `stripe_customer_id` and `subscription_status` fields
- Webhook handler processes: `customer.subscription.created`, `invoice.payment_succeeded`, `customer.subscription.deleted`
- Sets `subscription_status` to 'active' or 'inactive'
- Routes exist for `/stripe_checkout` and `/create_stripe_checkout_session` but **no StripeController exists in the codebase** — the checkout flow appears broken/incomplete
- The initializer just sets `Stripe.api_key`

### Current State: **Monetization is effectively non-functional**
- No paywall gates content
- Credits exist but aren't consumed
- Checkout routes have no controller
- No pricing page visible in views

---

## 5. Quick Wins (Prioritized)

### P0 — Critical / Broken

1. **Fix credit system or remove it** — Users get credits but they're never consumed. Either implement credit deduction in `create` action or remove the concept to avoid confusion.

2. **Stripe checkout is broken** — Routes point to `stripe#checkout` and `stripe#create_checkout_session` but there's no `StripeController`. Must create one or remove the routes.

3. **Content generation AI is stubbed** — `PlaceContentGenerator#generate_content_with_ai` returns `nil`. This means every place gets generic template content. Wire up GPT to actually generate unique content per city.

4. **`by_style` action references non-existent model** — `Building.where(...)` in `ArchitectureExplorerController#by_style` — `Building` model doesn't exist. Should be `BuildingAnalysis`. Also `render :indexturn` is a typo (should be `:index` or similar). This route will crash.

5. **`designs_controller.rb` has a bug** — In `send_image_generation_request`, there's a `Rails.logger.debug "GPT Response: #{response.body}"` and `response.code == 200` **before** `response` is defined. This will crash with `NameError`. The variable is used before the HTTP call.

### P1 — High Impact, Easy Fixes

6. **SEO: No `<title>` or `<meta description>` on landing page (step1)** — The main landing page at `/` (architecture_designer/step1) has a bare `<title>Architecture Helper</title>` with no meta description tag. Add proper SEO tags.

7. **SEO: Duplicate `<head>` elements** — Views like `step1.html.erb` and `home.html.erb` include full `<!DOCTYPE html>` with their own `<head>`, meaning they're rendered inside the layout's HTML, producing double `<html>`, double `<head>`, double analytics scripts. These views should use the layout properly.

8. **Two navbars leak "Nathan's Platform"** — The non-custom nav still says "Nathan's Platform" and links to Dog Rating, Tweet Roastery, etc. The `/home` page is about "LLM Validator" and "AI micro apps." These should either be removed or rebranded.

9. **Analytics triple-loaded** — Google Analytics, Plausible, AND PostHog are loaded on some pages. GA and Plausible appear in both layout AND individual views (duplicated). PostHog appears on some pages. Consolidate — pick one or two, load once in layout.

10. **Remove .DS_Store files from repo** — Multiple `.DS_Store` files committed. Add to `.gitignore` and remove.

11. **Default credits inconsistency** — Schema says `default: 3`, model says `self.credits ||= 5`. Pick one.

### P2 — Medium Impact

12. **No error tracking** — No Sentry, Bugsnag, or Honeybadger. Production errors are invisible. Add error tracking.

13. **No structured landing page for architecturehelper.com** — The root route goes to `architecture_designer#step1` which is the DALL-E generation wizard. This is a poor landing page for organic traffic. Build a proper homepage with:
    - Value proposition
    - Feature showcase
    - City guides list
    - Social proof
    - CTA for sign-up

14. **Building-to-Place association is fragile** — Using `latitude ± 0.1` (roughly 11km) for proximity is inaccurate. A building 11km outside city center gets included. Consider proper city assignment via geocoding.

15. **No favicon or OG tags** — Missing Open Graph meta tags for social sharing. The favicon is a default Rails one.

16. **Places index has hardcoded Unsplash image** — The hero background uses a direct Unsplash URL which could break or rate-limit.

17. **Mobile responsiveness** — CSS exists for mobile but the step1 page has hardcoded widths and the layout uses Bootstrap 4 (dated). Needs testing.

18. **No email/newsletter capture** — Commented-out email signup form on home page. No way to capture leads.

---

## 6. Bigger Opportunities

### A. Fix and Ship the Payment Flow
- Implement `StripeController` with proper checkout session creation
- Gate AI generation behind credits/subscription
- Suggested pricing: free tier (3 analyses) → paid ($5-10/mo for unlimited)
- The infrastructure (Stripe webhook, user credits) is already 80% there

### B. Content Marketing via City Guides
- City guides are SEO gold — "Denver architecture guide," "Amsterdam architecture styles"
- Fix AI content generation to produce unique, high-quality articles per city
- Add structured data (Schema.org) for rich snippets
- Create programmatic landing pages for each architectural style + city combo
- Nathan says Denver and The Hague perform well on Reddit — double down, add more cities

### C. Scale City Guide Creation
- Build a rake task or admin flow to bulk-generate city guides with real AI content
- Use GPT-4 to write genuine 800-1200 word articles per city
- Add real Unsplash/Wikimedia images per city
- Target: 50-100 city guides for long-tail SEO

### D. Community & Engagement
- The building library is a community feature but has no engagement loop
- Add: comments, likes, "collections" or "boards"
- User-submitted building walks/tours
- Newsletter with weekly "architecture spotlight"

### E. API/Embed Opportunity
- There's already an `Api::BuildingAnalysesController` (index only)
- Could become a B2B play: architecture analysis API for real estate, education

### F. Mobile App
- The virtual tour feature is trying to be an app experience inside a modal
- Consider a PWA or native app for on-the-go building analysis (camera → instant analysis)

---

## 7. Code Quality Notes

### Architecture
- **Monolithic Rails app** — everything in one codebase, which is fine for this stage
- **Service objects exist** — `GptService`, `PlaceContentGenerator`, `AutoPlaceGenerator`, `BuildingAnalysisProcessor` — good separation
- **Controllers are fat** — `ArchitectureExplorerController` is 500+ lines with business logic. Should extract to services.
- **Views have inline CSS/JS** — `places/show.html.erb` is ~1000+ lines with massive inline `<style>` and `<script>` blocks. Should extract to asset pipeline.

### Code Smells
- **Dead code everywhere** — Hardcoded city methods (`denver`, `boston`, `new_york_city`, etc.) in the explorer controller that duplicate what Places now handles
- **Duplicate route patterns** — `/auth/:provider/callback` defined twice
- **Commented-out code** — ImageOptim, webpacker, email signup form
- **Config files for unused tools** — `webpack/`, `babel.config.js`, `postcss.config.js` exist but app uses importmap
- **`requirements.txt`** — Python requirements file (for the Flask `autogen_service/app.py`) mixed into root
- **Mixed asset strategies** — Both importmap and webpacker config files exist; `app/javascript/packs/` suggests old webpacker setup

### Testing
- Test files exist but are all boilerplate/empty (generated by Rails scaffolds)
- **No meaningful tests** — zero test coverage

### Security
- `.env` files handled via `dotenv-rails` (dev/test) and `credentials.yml.enc` (production) — fine
- CSRF protection in place, Stripe webhook signature verification — good
- **No rate limiting** on API endpoints or AI generation — could be exploited
- Admin authorization via `AdminAuthorization` concern — basic but functional

### Database
- **SQLite used in development, PostgreSQL in production** — risky for behavior differences. Should use PostgreSQL everywhere.
- pgvector extension enabled (migration exists) but **never used** — was probably planned for vector search/embeddings
- Schema is clean, proper indexes exist

---

## 8. Broken / Outdated / Half-Finished

### Broken
- ❌ `by_style` action — references non-existent `Building` model, will crash
- ❌ `send_image_generation_request` in DesignsController — uses `response` before it's defined
- ❌ Stripe checkout routes — no controller exists
- ❌ `render :indexturn` typo — will crash

### Half-Finished
- ⚠️ Credit system — fields exist, defaults set, but never consumed
- ⚠️ AI content generation for places — stubbed out, returns nil
- ⚠️ AI hero image generation — method exists but returns nil (`generate_ai_image`)
- ⚠️ pgvector — extension enabled but no vector columns or search
- ⚠️ `BuildingAnalysisProcessor` module — standalone module, not properly integrated (not `include`d anywhere active)
- ⚠️ `autogen_service/` — Python Flask app with cache DB, unclear purpose, seems abandoned
- ⚠️ Geocoder `within_bounding_box` used for Netherlands but may not work without proper Geocoder setup on the model

### Outdated
- 🕐 Bootstrap 4.5.2 — Bootstrap 5 has been out for years
- 🕐 jQuery 3.5.1 — loaded twice in layout (two identical script tags at bottom)
- 🕐 Font Awesome 5.15.3 — version 6 is current
- 🕐 The Procfile references `flask: python app.py` — the Python service seems abandoned
- 🕐 Dockerfile has `RUBY_VERSION=3.0.0` but `.ruby-version` says `3.3.0` — mismatch
- 🕐 `_site/` directory committed — looks like a Jekyll artifact
- 🕐 Multiple documentation MD files (`VIRTUAL_TOUR_FEATURE.md`, `ADMIN_PORTAL.md`, `SEO_AND_SITEMAP.md`, `PLACE_CONTENT_GENERATION.md`) — useful context but may be stale

### Concerning
- ⚠️ The home/landing page (`/home`) still references "LLM Validator" and "Nathan's Platform" — brand confusion
- ⚠️ Two completely different nav bars depending on `@custom_nav` — one for "Architecture Helper" features, one for "Nathan's Platform" legacy features
- ⚠️ No rate limiting means anyone could spam the GPT API and run up costs
- ⚠️ S3 bucket `architecture-explorer` uses `public_url` — images are publicly accessible by URL, no signed URLs

---

## 9. Key Files Reference

| Purpose | File |
|---------|------|
| Routes | `config/routes.rb` |
| Landing page | `app/views/architecture_designer/step1.html.erb` |
| Building analysis | `app/controllers/architecture_explorer_controller.rb` |
| GPT integration | `app/services/gpt_service.rb` |
| City guides | `app/controllers/places_controller.rb`, `app/views/places/` |
| Auto place generation | `app/services/auto_place_generator.rb` |
| Content generation | `app/services/place_content_generator.rb` |
| Stripe webhooks | `app/controllers/stripe_events_controller.rb` |
| Admin | `app/controllers/admin/` |
| User model | `app/models/user.rb` |
| Building model | `app/models/building_analysis.rb` |
| Place model | `app/models/place.rb` |
| Schema | `db/schema.rb` |
| Layout | `app/views/layouts/application.html.erb` |
| Rake tasks | `lib/tasks/auto_places.rake`, `lib/tasks/generate_place_content.rake` |

---

## 10. Recommendations for Atlas

### Immediate (Week 1)
1. Fix the 4 broken items (P0) so nothing crashes
2. Add error tracking (Sentry free tier)
3. Remove "Nathan's Platform" branding and legacy nav
4. Add proper meta tags to landing page

### Short-term (Weeks 2-4)
5. Build proper landing page with SEO focus
6. Wire up AI content generation for places (replace the stub)
7. Add 10-20 city guides with real content
8. Fix the payment flow — implement StripeController, gate AI behind credits

### Medium-term (Month 2-3)
9. Extract inline CSS/JS from views
10. Add rate limiting on AI endpoints
11. Build email capture / newsletter
12. Programmatic SEO pages for style+city combos
13. Write basic integration tests for critical paths
