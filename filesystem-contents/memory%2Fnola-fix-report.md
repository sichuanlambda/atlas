# NOLA Buildings Fix Report — 2026-02-16

## Summary
- **14 buildings submitted** with Wikipedia/Wikimedia images + addresses
- **7 completed** with full GPT analysis ✅
- **7 stuck in "processing"** — likely Sidekiq job failure, needs Nathan to investigate ⚠️
- **SEO copy** already present on Place page with correct content (no building links in HTML version)
- **Old records (885-898)** need deletion — no admin delete option found

## Building Results

| # | Building | Address | New ID | Status | Styles Detected | Image Verified |
|---|----------|---------|--------|--------|-----------------|----------------|
| 1 | St. Louis Cathedral | 615 Pere Antoine Alley | 911 | ⚠️ STUCK processing | — | Yes |
| 2 | The Cabildo | 701 Chartres St | 913 | ⚠️ STUCK processing | — | Yes |
| 3 | Pontalba Buildings | 500 St Ann St | 916 | ⚠️ STUCK processing | — | Yes |
| 4 | Hotel Monteleone | 214 Royal St | 917 | ⚠️ STUCK processing | — | Yes |
| 5 | Preservation Hall | 726 St Peter St | 918 | ⚠️ STUCK processing | — | Yes |
| 6 | Gallier Hall | 545 St Charles Ave | 919 | ⚠️ STUCK processing | — | Yes |
| 7 | Longue Vue House | 7 Bamboo Rd | 920 | ⚠️ STUCK processing | — | Yes |
| 8 | McGehee School | 2343 Prytania St | 921 | ✅ Completed | Neoclassical, Art Deco, Colonial Revival, Victorian | Yes |
| 9 | Pitot House | 1440 Moss St | 922 | ✅ Completed | Colonial Revival, Victorian, Gothic | Yes |
| 10 | Old U.S. Mint | 400 Esplanade Ave | 923 | ✅ Completed | Classical Roman, Neoclassical, Victorian | Yes |
| 11 | Saenger Theatre | 1111 Canal St | 924 | ✅ Completed | Classical Greek, Romanesque, Baroque, Art Deco, Neoclassical | Yes |
| 12 | Shotgun House | 2726 Constance St | 925 | ✅ Completed | Victorian, Colonial Revival, Art Deco, Modernism | Yes |
| 13 | Contemporary Arts Center | 900 Camp St | 926 | ✅ Completed | Gothic, Romanesque, Beaux-Arts, Victorian, Chicago School | Yes |
| 14 | NOMA | 1 Collins C Diboll Circle | 927 | ✅ Completed | Neoclassical, Beaux-Arts, Art Deco, Gothic | Yes |

## Image Attribution

| # | Building | Wikimedia File | Source |
|---|----------|---------------|--------|
| 1 | St. Louis Cathedral | Cathedral_new_orleans.jpg | Wikipedia pageimage |
| 2 | The Cabildo | Cabildo9Jul07SousaphoneFront.jpg | Wikipedia (The_Cabildo) |
| 3 | Pontalba Buildings | Pontalba.jpg | Wikipedia pageimage |
| 4 | Hotel Monteleone | Exterior_of_Hotel_Monteleone.jpg | Wikipedia pageimage |
| 5 | Preservation Hall | PreservationHall_2008.jpg | Wikipedia pageimage |
| 6 | Gallier Hall | GallierHallNO.JPG | Wikipedia pageimage |
| 7 | Longue Vue House | Longue_Vue_House_and_Gardens.jpg | Wikipedia pageimage |
| 8 | McGehee School | McGehee_School,_Prytania_Street,_New_Orleans_Oct_2024.jpg | Wikimedia Commons search |
| 9 | Pitot House | PitotHouseBayouStJohn.jpg | Wikipedia pageimage |
| 10 | Old U.S. Mint | New_Orleans_Mint_1963_Esplanade_Av.jpg | Wikimedia Commons search |
| 11 | Saenger Theatre | CanalElkSanger.jpg | Wikipedia pageimage |
| 12 | Shotgun House | Shotgun_House,_Irish_Channel,_New_Orleans_01.jpg | Wikimedia Commons search |
| 13 | Contemporary Arts Center | Contemporary_Arts_Center_New_Orleans.jpg | Wikipedia pageimage |
| 14 | NOMA | NOMA_Front_Facade.jpg | Wikipedia pageimage |

All images from Wikimedia Commons (CC-BY-SA or public domain).

## SEO Copy
- Place page at `/admin/places/new-orleans` already has SEO content (H1, sections, descriptions)
- Content does NOT contain links to individual building IDs (plain text mentions only)
- Updated SEO copy with new IDs saved to `memory/nola-seo-copy-updated.md`
- Meta description already set

## Old Records (885-898)
- **Need deletion** — admin UI doesn't show a delete option for building analyses
- Nathan should delete via Rails console: `BuildingAnalysis.where(id: 885..898).destroy_all`

## Issues & Next Steps
1. **7 stuck analyses (IDs 911-920)** — Nathan needs to check Sidekiq/background jobs. These may need to be retried via Rails console: `BuildingAnalysis.find(911).analyze!` or similar
2. **Old records 885-898** — need manual deletion
3. **Place page links** — if building links should appear in SEO content, Nathan needs to update the HTML content with `<a href="/architecture_explorer/ID">` tags
4. Images are uploaded to S3 for all 14 buildings — the data is there, just analysis jobs for first 7 didn't complete
