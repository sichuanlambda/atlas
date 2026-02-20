# Runbook: Building Submission (v3 — Direct DB Pipeline)

## Overview
Submit buildings directly via `heroku run -- rails runner -` with heredoc. **No browser needed.**

## Pipeline (per city)
1. **Research** — Pick 15-20 notable buildings with Wikipedia/architectural significance
2. **Source images** — Use `scripts/source-images.py` to search Wikimedia Commons API
3. **Validate images** — Batch-check with `image` tool (must be building exterior, not mosaic/plaque/interior/painting)
4. **Bulk submit** — Single `heroku run` heredoc script: create records + S3 upload + GPT analysis queue
5. **Create Place page** — Via `heroku run` with editorial content
6. **Add to Pinterest queue** — Update `memory/pinterest-pins.json`

## Bulk Submit Template

```ruby
source ~/.config/secrets/heroku.env && heroku run --app boiling-atoll-02251 -- rails runner - <<'RUBY'
require 'aws-sdk-s3'
require 'open-uri'

ATLAS_USER_ID = 880
s3 = Aws::S3::Resource.new(region: 'us-east-2')
bucket = s3.bucket('architecture-explorer')

manifest = [
  {name: "Building Name", city: "City", address: "Full Address", lat: 0.0, lng: 0.0, img: "https://..."},
  # ...
]

manifest.each_with_index do |b, idx|
  print "[#{idx+1}/#{manifest.length}] #{b[:name]}... "
  ba = BuildingAnalysis.new(name: b[:name], city: b[:city], address: b[:address],
    latitude: b[:lat], longitude: b[:lng], user_id: ATLAS_USER_ID, visible_in_library: true)
  ba.save!(validate: false)
  puts "created ##{ba.id}"
  
  if b[:img].present?
    image_data = URI.open(b[:img], "User-Agent" => "ArchitectureHelper/1.0", read_timeout: 30)
    key = "uploads/building_#{ba.id}_#{Time.now.to_i}.jpg"
    obj = bucket.object(key)
    obj.upload_file(image_data.path)
    ba.update_column(:image_url, obj.public_url)
    puts "  ✅ S3"
    image_data.close rescue nil
    sleep 3
  end
  
  ProcessBuildingAnalysisJob.perform_later(ba.id, ba.image_url, ba.address) if ba.image_url.present?
end
puts "Done! #{manifest.length} buildings"
RUBY
```

## Performance
- **Old (Playwright browser):** ~90s/building, sub-agents time out at ~15-20 buildings
- **New (direct DB):** ~3s/building, 9 buildings in 30 seconds, no timeouts
- **Throughput:** Can do 50+ buildings per `heroku run` session

## Key Facts
- Table: `building_analyses` (NOT `buildings`)
- Model: `BuildingAnalysis` (NOT `Building` or `ArchitectureExplorer::Building`)
- Atlas user_id: 880
- S3 bucket: `architecture-explorer` (us-east-2)
- **Never use `acl: "public-read"`** — bucket policy handles access
- `save!(validate: false)` skips geocoding callback (we set lat/lng directly)
- `update_column` skips callbacks (faster for image_url update)
- `ProcessBuildingAnalysisJob.perform_later(id, image_url, address)` — async GPT analysis

## Image Sourcing
- Use `scripts/source-images.py` with Wikimedia Commons API
- User-Agent: `ArchitectureHelper/1.0 (atlas@architecturehelper.com)`
- Sleep 2s between requests (rate limit)
- **Always validate images** — Wikimedia returns ~30-60% non-building results
- Skip: .pdf, .tif, plan, diagram, plaque, marker, painting, interior, map, logo, stamp, coin, mosaic (close-up)

## Place Page Content (CRITICAL — do not skip)

Place pages need **thorough editorial content** (~4000-6000 chars HTML). A 3-paragraph summary is NOT enough.

**Required sections:**
1. **Opening** (2-3 paras) — What makes this city architecturally unique? The story.
2. **Architectural Timeline / Periods** (h2) — Walk through major periods represented
3. **Key Neighborhoods / Districts** (h2) — 2-3 districts with their character
4. **Notable Architects** (h2) — 3-5 architects who shaped the city
5. **What to Notice** (h2) — Practical details: materials, ornament, urban planning, views

**HTML rules:** Use only p, h2, h3 tags. No divs, no classes. No em dashes. Evergreen (no hardcoded counts). Reference actual buildings by name. Tone: authoritative, warm, knowledgeable.

**Workflow:** Spawn a scribe sub-agent to write content files, then upload via heroku run.

## Place Page Creation (DB)
```ruby
Place.create!(
  name: "City Name", slug: "city-slug",
  latitude: 0.0, longitude: 0.0, zoom_level: 12,
  description: "Short description",
  content: "Editorial HTML content",
  published: true, featured: false,
  meta_title: "Architecture Guide to City | Architecture Helper",
  meta_description: "SEO description",
  hero_image_url: "S3 URL", hero_image_alt: "Alt text"
)
```

## Deprecated
- ❌ Playwright browser submission — too slow, fragile, session timeouts
- ❌ External image URL form field injection — no longer needed
- ❌ "Image first, address after" workaround — direct DB insert sets both at once
