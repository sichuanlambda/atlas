# City Guide Pipeline — v3

## Steps

### 1. Research (1-2 hours)
- Pick 15-20 iconic buildings spanning diverse architectural styles
- Prioritize: landmarks, style diversity, Wikipedia image availability
- Document building list with addresses and expected styles

### 2. Image Sourcing
- Wikipedia API: `https://en.wikipedia.org/api/rest_v1/page/summary/{title}`
- Verify each image via vision model (is it the right building? good quality?)
- Optimize with Pillow: resize max 1200-1600px wide, JPEG quality 80, target <300KB
- Save to /tmp/{city}_buildings/

### 3. Submit Buildings
- **Method 1 (bulk, preferred)**: Use POST /admin/building_analyses/bulk_import
- **Method 2 (browser)**: Log in as Atlas, upload via /architecture_explorer/new
- Wait for async GPT analysis (ProcessBuildingAnalysisJob)
- Note all building_analysis IDs

### 4. Create Place
- Go to /admin/places → New Place
- Set: name, state, latitude, longitude, zoom_level (12), published=true, featured=true
- Upload hero image or set hero_image_url

### 5. SEO Content
- Write evergreen content for the Place page (NO hardcoded building counts)
- Save draft to memory/{city}-seo-copy.md
- Update Place content field in admin

### 6. ⚠️ VERIFY Place Page
**Critical step — don't skip this!**
- Visit /places/{slug} and verify:
  - [ ] Building count is correct (matches what you submitted)
  - [ ] Building cards grid shows up with images
  - [ ] Map shows pins at correct locations
  - [ ] Style statistics are accurate
  - [ ] Tour builder shows correct building count
  - [ ] SEO content renders properly
- If building count is wrong, check:
  - Place lat/lng ± 0.1° covers all building locations
  - Buildings have visible_in_library=true
  - Buildings have valid lat/lng coordinates

### 7. Marketing
- Reddit drafts (best post times: Tue-Thu 10am-12pm CT for local subreddits)
- X/Twitter thread draft
- Pinterest pins queued (add buildings to pinterest-pins.json queue)
- Save drafts to memory/{city}-reddit-drafts.md and memory/{city}-twitter-draft.md

### 8. QA
- Verify all building detail pages load (/architecture_explorer/{id})
- Check GPT analyses completed (no pending/failed)
- Smoke test Place page on mobile
- Update dashboard data.json with new city

## PR Post-Deploy Testing Process
After Nathan merges and deploys any PR:
1. Browse the live site and test each feature from the PR
2. Take screenshots of each feature working
3. Comment the screenshots on the GitHub PR
4. Close the loop on the commit → deploy → verify cycle

## Key Learnings
- Always optimize images BEFORE upload (70-95% size reduction)
- Use bulk import API when possible — much faster than browser upload
- The bounding box for Place → buildings is ±0.1° lat/lng (~11km)
- NYC bug: address string matching broke because "New York City" ≠ "New York, NY" — fixed in PR #10 to use bounding box
- GPT analysis is async via Sidekiq — show page polls /architecture_explorer/:id/status
