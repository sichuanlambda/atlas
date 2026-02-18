# Building Submission Runbook
> Last updated: 2026-02-18 | Learned the hard way.

## Overview
Submit buildings to Architecture Helper via browser automation at:
`https://app.architecturehelper.com/architecture_explorer/address_search`

## The Correct Flow

### Step 1: Submit the image WITHOUT an address
1. Navigate to address_search page
2. Type building name in the name field (ref e4)
3. **Leave address BLANK** — entering an address triggers Street View auto-fetch which OVERRIDES any uploaded image
4. Paste a Wikimedia Commons image URL in the "Or paste an image URL" field (ref e8)
5. Trigger blur: `document.getElementById('external-image-url').dispatchEvent(new Event('blur'))`
6. Wait 2 seconds for the preview to load
7. Verify preview: `document.getElementById('image-preview').style.display === 'block'`
8. Click submit: `document.getElementById('generate-style-analysis').click()`
9. You'll land on the building's show page with "Hang tight, we're working on your analysis"

### Step 2: Add the address AFTER submission
1. On the building's show page, find the "Update Location" section
2. Type the full address in the location textbox
3. Click "Update Location" button
4. This sets the address without triggering Street View

### Step 3: Wait between submissions
- **60 seconds minimum** between submissions
- Heroku's Sidekiq worker processes GPT analyses — too fast causes memory exhaustion
- For large batches (18+ buildings), consider 90 second gaps

## Known Pitfalls

### ❌ NEVER use `form.submit()` via JavaScript
- Bypasses Active Storage direct upload JS
- Bypasses form validation event handlers
- Use `.click()` on the submit button instead

### ❌ NEVER fill address AND image at the same time
- The form's JS fetches Street View when an address is entered
- Street View overrides whatever image was set in the preview
- Always submit image first, add address second

### ❌ NEVER use the file upload approach via browser automation
- `browser upload` tool sets files on the input element but `files.length` returns 0
- This is a headless Chrome reliability issue, not a code bug
- The external image URL field (ref e8) is the reliable path

### ❌ Don't use `document.getElementById('field').value = 'text'` for form fields
- Doesn't trigger React/Rails change events
- Use the browser tool's `type` action with refs instead

## Image Sources (Priority Order)
1. **Wikipedia API** — `pithumbsize=1200` for main article image
2. **Wikimedia Commons search** — when Wikipedia image is wrong (e.g., Wanamaker's is a logo)
3. **HABS/Library of Congress** — historic buildings
4. **Unsplash/Pexels** — fallback for modern buildings

## Image Quality Checklist
Before submitting, verify each image:
- [ ] Is it actually a photo of the building? (not a logo, seal, or unrelated image)
- [ ] Is it >50KB? (tiny files are usually thumbnails or icons)
- [ ] Is it a clear architectural view? (not a selfie, not shot through glass)
- [ ] Optimize with Pillow: max 1400px wide, quality=85, <400KB target

## Known Bad Wikipedia Images
These Wikipedia articles have non-architectural main images:
- **Wanamaker's** → Logo/signature. Use Commons: `File:Wanamaker Building.jpg`
- **Boston Public Library** → Library seal. Use Commons: `File:Boston Public Library, McKim Building (2019).jpg`
- **Custom House Tower, Boston** → No image. Use Commons: `File:Custom House Tower in Boston.jpg`

## Post-Submission
- GPT analysis runs async via Sidekiq (ProcessBuildingAnalysisJob)
- Takes 1-3 minutes per building
- If stuck on "Hang tight" after 10 min, the job likely failed — check Heroku logs
- Buildings auto-appear in the library once analysis completes

## Display Issue: Wikimedia Hotlinking
- Wikimedia blocks browser-side hotlinking (referrer check)
- Images submitted via external URL show broken `<img>` tags on the site
- GPT analysis works fine (downloads server-side)
- **Fix needed**: PR to download external URLs to S3 on submission
- This is a known tech debt item, not a blocker for content

## Form Field Reference
```
e4 = Building name (text input)
e5 = Address (text input) — DO NOT USE during initial submission
e6 = Fetch Street View button — DO NOT CLICK
e7 = Fetch Satellite View button — DO NOT CLICK  
e8 = External image URL (text input) — USE THIS for images
```

## Example: Full Submission Script
```
1. Navigate to /architecture_explorer/address_search
2. snapshot → get refs
3. type ref=e4 "Trinity Church"
4. type ref=e8 "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c2/Trinity_Church.jpg/1200px-Trinity_Church.jpg"
5. evaluate: document.getElementById('external-image-url').dispatchEvent(new Event('blur'))
6. sleep 2s
7. evaluate: document.getElementById('generate-style-analysis').click()
8. sleep 3s → should be on show page now
9. snapshot → find Update Location textbox ref
10. type address ref "206 Clarendon St, Boston, MA 02116"
11. click "Update Location" button ref
12. sleep 60s → next building
```
