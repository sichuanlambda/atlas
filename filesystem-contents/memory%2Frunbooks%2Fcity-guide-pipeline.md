# City Guide Pipeline Runbook
> Last updated: 2026-02-18

## Overview
End-to-end process for adding a new city to Architecture Helper.
Target: 15-18 buildings per city spanning 8-12 architectural styles.

## Pipeline Stages

### Stage 1: Research & Building Selection
1. Research the city's architectural history
2. Select 15-18 buildings covering diverse styles:
   - At least 2-3 historic (pre-1900)
   - At least 2-3 modern/contemporary
   - Mix of civic, religious, commercial, residential, cultural
   - Include the city's most iconic buildings
   - Include lesser-known architectural gems
3. For each building, record: name, address, primary style, Wikipedia article title
4. Save to `memory/{city}-buildings-list.txt`

### Stage 2: Image Sourcing
Priority order:
1. **Wikipedia API**: `pithumbsize=1200` — fastest, usually CC-licensed
2. **Wikimedia Commons**: search by building name — better selection
3. **HABS/Library of Congress**: historic American buildings
4. **Unsplash/Pexels**: modern buildings, CC0

Quality check EVERY image (see building-submission.md):
- Actually a photo of the building?
- >50KB? (tiny = thumbnail/icon)
- Clear architectural view?

Save to `/tmp/{city}_buildings/` with naming: `{city}_{nn}_{Building_Name}.jpg`
Optimize with Pillow: max 1400px wide, quality=85

**Rate limiting**: Wikimedia rate-limits after ~20 requests. Space requests 1-2 seconds apart. If 429'd, wait 60 seconds.

### Stage 3: Get Wikimedia URLs
For the external URL submission approach, get direct Wikimedia thumbnail URLs:
```python
url = f"https://en.wikipedia.org/w/api.php?action=query&titles={title}&prop=pageimages&format=json&pithumbsize=1200"
```
Save URLs to `/tmp/{city}_wiki_urls.json`

Check for bad Wikipedia images (logos, seals, unrelated). Use Wikimedia Commons search as fallback.

### Stage 4: Submit Buildings
**Follow building-submission.md runbook exactly.**
Key points:
- Image first, address after
- External URL field (ref e8), NOT file upload
- 60 second waits between submissions
- Verify each submission lands on a show page

### Stage 5: Create Place Page
1. Go to `/admin/places`
2. Click "New Place"
3. Fill in:
   - Name: city name
   - Description: SEO copy from `memory/{city}-seo-copy.md`
   - Latitude/Longitude (look up coordinates)
   - Zoom level (12 for large cities, 13 for dense cities)
4. Save

### Stage 6: Write SEO Copy
Save to `memory/{city}-seo-copy.md`. Guidelines:
- Evergreen — no hardcoded building counts or IDs
- Cover the city's architectural story arc
- Mention key styles and periods
- Include "explore" / "discover" CTAs
- 200-400 words

### Stage 7: Verify & QA
1. Check the Place page loads: `/places/{slug}`
2. Verify buildings appear on the map
3. Check 3-4 building detail pages for correct images + analysis
4. Test style page links from building pages
5. Verify nearby buildings section works

### Stage 8: Pinterest Auto-Queue (MANDATORY)
After verifying buildings have good images:
1. Add city board on Pinterest (if not exists)
2. **Automatically add ALL verified buildings to pinterest-pins.json queue**
3. Format: `{"building_id": ID, "city": "City", "name": "Building Name"}`
4. The 4x daily cron handles posting — just load the queue
5. This is NOT optional — every city launch includes Pinterest queuing

### Stage 9: Marketing
1. Draft Reddit posts for relevant city/architecture subs
2. Update dashboard metrics
3. Share launch on X/Twitter if warranted

## Existing Cities
| City | Buildings | Place Page | Pinterest Board |
|------|-----------|------------|-----------------|
| Denver | ~14 | ✅ | ✅ |
| Den Haag | ~32 | ✅ | ❌ |
| San Francisco | ~8 | ✅ | ✅ |
| Chicago | ~9 | ✅ | ✅ |
| New Orleans | 14 | ✅ | ✅ |
| NYC | 18 | ✅ | ❌ |
| Washington DC | 11 | ✅ | ❌ |
| Philadelphia | 18 (resubmitting) | ❌ | ❌ |
| Boston | 18 (resubmitting) | ❌ | ❌ |

## Next Cities (Priority Order)
See `memory/next-cities-ranking.md` for full analysis.
- Wave 1: Barcelona, Bruges, Edinburgh
- Wave 2: Kraków, Tirana, Istanbul, Rome
- Wave 3: Detroit, Savannah, LA, Miami

## SEO Copy Written (Ready to Use)
- memory/dc-seo-copy.md
- memory/philly-seo-copy.md
- memory/boston-seo-copy.md
- memory/barcelona-seo-copy.md
