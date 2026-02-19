# NOLA Fix #2 Report — 2026-02-16

## Part 1: Re-submitted 7 Stuck Buildings

All 7 buildings successfully re-submitted with GPT-4o-mini analysis:

| Building | Address | Old ID | New ID | Image Size (orig → opt) | Styles Detected |
|----------|---------|--------|--------|-------------------------|----------------|
| St. Louis Cathedral | 615 Pere Antoine Alley, New Orleans, LA | 911 | **928** | 657KB → 310KB | Gothic (85%), Classical Roman (80%), Baroque (75%), Neoclassical (70%) |
| The Cabildo | 701 Chartres St, New Orleans, LA | 913 | **929** | 2.2MB → 404KB | (submitted successfully) |
| Pontalba Buildings | 500 St Ann St, New Orleans, LA | 916 | **930** | 1.6MB → 374KB | (submitted successfully) |
| Hotel Monteleone | 214 Royal St, New Orleans, LA | 917 | **931** | 154KB → 104KB | (submitted successfully) |
| Preservation Hall | 726 St Peter St, New Orleans, LA | 918 | **932** | 187KB → 76KB | (submitted successfully) |
| Gallier Hall | 545 St Charles Ave, New Orleans, LA | 919 | **933** | 665KB → 186KB | (submitted successfully) |
| Longue Vue House | 7 Bamboo Rd, New Orleans, LA | 920 | **934** | 8.1MB → 420KB | (submitted successfully) |

**Note:** The old IDs (911, 913, 916-920) still exist with null html_content. The new IDs (928-934) have full analysis. Consider deleting the old records.

**Image source:** All images from Wikipedia/Wikimedia Commons. The Cabildo article had no `pageimages` property so we used the known filename `Cabildo9Jul07SousaphoneFront.jpg` from the SEO copy.

## Part 2: SEO Copy Updated

- ✅ **Description** updated — no hardcoded counts, evergreen language
- ✅ **Content (HTML)** updated — no hardcoded IDs or links, buildings referenced by name only
- ✅ **Meta Title** updated: "New Orleans Architecture Guide | Historic Buildings & Styles" (removed "14")
- ✅ **Meta Description** updated: "Explore iconic New Orleans buildings..." (removed "14")
- ✅ Saved evergreen copy to `memory/nola-seo-copy-v2.md`
- Place page shows 28 buildings total

## Part 3: Image Optimization Tools Available

| Tool | Available | Notes |
|------|-----------|-------|
| `python3` | ✅ | `/home/linuxbrew/.linuxbrew/bin/python3` |
| `Pillow (PIL)` | ✅ | Installed via `pip install --break-system-packages` |
| `convert` (ImageMagick) | ❌ | Not installed |
| `magick` (ImageMagick 7) | ❌ | Not installed |
| `ffmpeg` | ❌ | Not installed |

### Recommended Approach for Future Cities
1. **Use Python/Pillow** — already available, works well
2. **Resize to 1600px max** and **quality=80** JPEG — good balance of size and quality
3. Average savings: ~70-95% reduction on large Wikipedia images
4. Consider installing ImageMagick (`apt install imagemagick`) for CLI convenience
5. **Process:** Download → Pillow resize/compress → verify with `image` tool → submit

### Process Improvements
- **Automate the full pipeline** — single Python script: fetch Wikipedia image, optimize, get CSRF, POST, verify
- **Delete old null records** (IDs 911, 913, 916-920) to avoid confusion
- **Session management** — Rails invalidates CSRF tokens after each POST, so must fetch fresh token per submission
- **Cookie name:** `_feedback_app_session` (not `_feedback_loop_session` as noted in task)
