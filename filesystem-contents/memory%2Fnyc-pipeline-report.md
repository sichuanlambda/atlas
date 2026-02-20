# NYC City Guide Pipeline Report

**Date:** 2026-02-17  
**Status:** ✅ Complete  
**Place URL:** https://app.architecturehelper.com/places/new-york-city

## Summary
- **18 buildings** submitted and analyzed
- **All 18** GPT analyses completed successfully
- NYC Place created, published, and featured
- SEO copy saved to `memory/nyc-seo-copy.md`

## Buildings Submitted

| # | Building | ID | Address | Method |
|---|----------|----|---------|--------|
| 1 | Empire State Building | 935 | 20 W 34th St, NY 10001 | Browser upload |
| 2 | Chrysler Building | 936 | 405 Lexington Ave, NY 10174 | Browser upload |
| 3 | Flatiron Building | 937 | 175 5th Ave, NY 10010 | Browser upload |
| 4 | Grand Central Terminal | 938 | 89 E 42nd St, NY 10017 | Browser upload |
| 5 | Woolworth Building | 939 | 233 Broadway, NY 10007 | Browser upload |
| 6 | One World Trade Center | 940 | 285 Fulton St, NY 10007 | Browser upload |
| 7 | Solomon R. Guggenheim Museum | 941 | 1071 5th Ave, NY 10128 | Bulk API |
| 8 | Lever House | 942 | 390 Park Ave, NY 10022 | Bulk API |
| 9 | Seagram Building | 943 | 375 Park Ave, NY 10152 | Bulk API |
| 10 | St. Patrick's Cathedral | 944 | 5th Ave & 50th St, NY 10022 | Bulk API |
| 11 | 30 Rockefeller Plaza | 945 | 30 Rockefeller Plaza, NY 10112 | Bulk API |
| 12 | MetLife Building | 946 | 200 Park Ave, NY 10166 | Bulk API |
| 13 | Hearst Tower | 947 | 300 W 57th St, NY 10019 | Bulk API |
| 14 | TWA Flight Center | 948 | 1 Idlewild Dr, Queens, NY 11430 | Bulk API |
| 15 | Brooklyn Bridge | 949 | Brooklyn Bridge, NY 10038 | Bulk API |
| 16 | New York Public Library | 950 | 476 5th Ave, NY 10018 | Bulk API |
| 17 | The Dakota | 951 | 1 W 72nd St, NY 10023 | Bulk API |
| 18 | Citigroup Center | 952 | 601 Lexington Ave, NY 10022 | Bulk API |

## Architectural Styles Covered
- Art Deco (Empire State, Chrysler, 30 Rock)
- Beaux-Arts (Grand Central Terminal, NY Public Library)
- Gothic Revival (Woolworth Building, St. Patrick's Cathedral)
- Neo-Renaissance (The Dakota)
- International Style (Lever House, Seagram Building)
- Neo-Futurism / Deconstructivism (One World Trade Center)
- Organic / Modern (Guggenheim Museum, TWA Flight Center)
- Postmodern (Citigroup Center)
- Diagrid / Contemporary (Hearst Tower)
- Neo-Gothic / Chicago School (Flatiron Building)
- International Style / Brutalism (MetLife Building)
- Gothic Revival / Engineering (Brooklyn Bridge)

## Image Sources
All images sourced from Wikimedia Commons via Wikipedia API.
- Buildings 1-6: Downloaded, optimized with Pillow (JPEG q80, max 1400px wide), uploaded via browser
- Buildings 7-18: Wikipedia image URLs passed directly to bulk import API

## Place Configuration
- **Name:** New York City
- **Slug:** new-york-city
- **Coordinates:** 40.7128, -74.006
- **Zoom:** 12
- **Status:** Published + Featured
- **Content:** Auto-generated HTML with sections on Art Deco, Modern/Contemporary, Neighborhood Character

## Key Learnings
1. **Bulk import API** (`POST /admin/building_analyses/bulk_import`) is far faster than browser uploads — used for 12/18 buildings
2. Browser upload works but the `upload` action intermittently times out (~50% of attempts)
3. Wikipedia REST API requires User-Agent header or returns 403
4. Empire State Building and Chrysler Building have no `pageimage` in Wikipedia API — needed to query `images` list and resolve file URLs manually
5. All GPT analyses completed within minutes of submission
