# Pinterest Pin Creation Runbook
> Last updated: 2026-02-18

## Account
- Business account: Architecture Helper (@nathaninproduct)
- Login: nathaninproduct@gmail.com
- Creds: ~/.config/secrets/pinterest.env
- Profile: https://www.pinterest.com/nathaninproduct/

## Boards (10 total)
### City Boards (4)
- New Orleans Architecture
- San Francisco Architecture
- Chicago Architecture  
- Denver Architecture

### Style Boards (6)
- Gothic Architecture
- Beaux-Arts Architecture
- Neoclassical Architecture
- Art Deco Buildings
- Victorian Architecture
- Baroque Architecture

## Pin Creation Flow

### Step 1: Select building from queue
- Source: `memory/pinterest-pins.json` → `queue` array
- Pick the next building in order
- Get building URL: `https://app.architecturehelper.com/architecture_explorer/{id}`

### Step 2: Create pin via browser
1. Navigate to pinterest.com (logged in via saved session)
2. Click "Create Pin" or navigate to pin creation
3. Use "Save from website" flow:
   - Enter building URL
   - Pinterest pulls the S3 image from the building page
4. Set title using template v1: `{building_name} | {primary_style} Architecture in {city}`
5. Set description with hashtags
6. Select primary city board
7. Save pin

### Step 3: Cross-post to style boards
- If building has a style matching a style board, save to that board too
- Max 2 cross-posts per pin (don't spam)
- Priority styles for cross-posting: Victorian, Beaux-Arts, Gothic, Art Deco, Neoclassical, Baroque

### Step 4: Update tracking
1. Move building from `queue` to `pins` in `memory/pinterest-pins.json`
2. Record pin URL, board, cross-posts, timestamp
3. Update `data.json` in atlas repo (pinterest section)
4. Git push atlas repo

## Template v1
```
Title: {building_name} | {primary_style} Architecture in {city}
Description: {building_description} Explore the full AI-powered architectural analysis. 
#{city_hashtag} #{style_hashtag} #ArchitectureLovers #HistoricBuildings
```

## Schedule
- 4x daily: 09:00, 13:00, 17:00, 21:00 UTC
- Cron job ID: bc621e88
- Each run posts 1 pin from the queue

## Metrics
- Can't pull metrics programmatically (no API access)
- Nathan shares screenshots periodically
- Update `data.json` pinterest metrics manually from screenshots
- Track: impressions, saves, clicks per pin

## Known Issues
- **Duplicate pins**: Sometimes Pinterest creates a duplicate when saving to a second board. Can't delete from within the save flow — Nathan may need to manually remove.
- **Browser port conflict**: If main session has browser open, Pinterest cron can't use it. The cron will fail with "Port 18800 in use" — it catches up next cycle.
- **Rate limiting**: Pinterest may throttle if posting too fast. 4x daily is safe.

## Queue Expansion
When current NOLA queue is empty:
1. Add buildings from other cities (SF, Chicago, Denver, DC, Philly, Boston)
2. Create new city boards as needed (DC Architecture, Philadelphia Architecture, Boston Architecture)
3. Prioritize buildings with the best images
4. Skip buildings with Street View images — only pin buildings with real architectural photos

## Performance Review
- Cron job ID: 9bfc068d (every 3 days)
- Reviews which pins performed best
- Adjusts strategy based on what's working
- Currently: Pontalba Buildings leading (14 impressions), style cross-posting helps
