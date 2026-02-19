# Book Club Near Me — Product Spec

## Concept
Meetup but specifically for book clubs. Find, filter, and join book clubs in your area.

## Core Features
- **Search by location** (city, zip, radius)
- **Filter by:** gender (mixed/women/men), genre, meeting time (weekday evening, weekend morning, etc.)
- **Goodreads integration:** Connect account, get matched to clubs based on reading taste
- **Club profiles:** what they're reading now, meeting schedule, member count, vibe description
- **Claim/create a club:** organizers can list their club for free

## Technical Approach
- Static site + Supabase backend (free tier)
- Or: GitHub Pages with JSON data + client-side search (MVP)
- Goodreads: scrape public shelves via RSS (API was discontinued, but RSS feeds still work)
- Location: browser geolocation + city/zip input
- Map view: Mapbox or Leaflet (free tier)

## SEO Play
- Programmatic pages: "/book-clubs-in-[city]" for top 500 US cities
- Long-tail: "women's book club near me", "sci-fi book club [city]", "book club for men [city]"
- "book clubs near me" = ~33K monthly searches (verify)
- Each city page is indexable, unique content

## Data Sourcing (Chicken & Egg Problem)
- Scrape Meetup.com book club groups (public data)
- Scrape Facebook Groups (harder, rate-limited)
- Scrape library websites (many host book clubs with schedules)
- Manual seeding: top 50 cities, 5-10 clubs each = 250-500 initial listings
- Let organizers claim/add their clubs (form submission)

## Revenue
- Free to list, free to search
- Premium for organizers: featured placement, member management, reading list tools
- Affiliate: Amazon book links for current reads
- Sponsored: publisher partnerships (feature new books to clubs)

## Goodreads Matching
- User connects Goodreads via public profile URL
- We pull their "read" and "to-read" shelves via RSS
- Extract genres/authors
- Match against club reading histories and genre tags
- "87% match — this club reads a lot of literary fiction like you"

## MVP Scope (What Atlas Builds)
1. Static site with city pages (programmatic SEO)
2. Club listing data seeded from Meetup/library scraping
3. Filter UI (location, genre, gender, time)
4. Goodreads RSS integration for taste matching
5. "Add your club" form (Formspree or Supabase)
6. Map view of clubs

## Priority
Low — build during overnight idle time. Behind Plotzy, CRE Software, and Architecture Helper.

## Vitamin Warning
This is a vitamin product per Dan Kulkov's framework. Nobody faces major consequences from not finding a book club. The play is SEO traffic + affiliate revenue, not SaaS.
