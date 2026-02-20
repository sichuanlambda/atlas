# PR: City Guide Improvements
**Date:** 2026-02-16
**PR:** https://github.com/sichuanlambda/feedback-loop/pull/8
**Branch:** city-guide-improvements

## Files Changed (11)
- `app/views/layouts/application.html.erb` — Added `<%= yield :head %>` for per-page meta tags
- `app/views/places/show.html.erb` — Added OG + Twitter Card meta tags via `content_for :head`
- `app/views/architecture_explorer/address_search.html.erb` — Added building name field + external image URL field + JS handler
- `app/views/architecture_explorer/show.html.erb` — Display building name as h2 when present
- `app/controllers/architecture_explorer_controller.rb` — Handle `external_image_url` and `building_name` params in create
- `app/controllers/admin/building_analyses_controller.rb` — Added `bulk_import` action, added `:name` to permitted params
- `app/views/admin/building_analyses/index.html.erb` — Show building name in card title
- `app/views/admin/building_analyses/show.html.erb` — Show building name in details table
- `app/views/admin/building_analyses/edit.html.erb` — Added name text field
- `config/routes.rb` — Added `post :bulk_import` to admin building_analyses collection
- `db/migrate/20260216173554_add_name_to_building_analyses.rb` — Add `name` string column

## Migration Instructions
```bash
heroku run rails db:migrate
```

## Decisions Made
1. **OG tags**: Used `yield :head` pattern in application layout since places use that layout. OG image uses `hero_image_url` with fallback to `best_representative_image`.
2. **External image URL**: Added as a separate text field. On blur, it sets `previewed_image_url` hidden field so existing flow works. Also added `external_image_url` param handling in create action as a fallback.
3. **Building name**: Simple optional string column. Displayed as h2 on show page, shown in admin index/show/edit. No changes to building_library cards (they don't show addresses either).
4. **Bulk import**: Uses existing `AdminAuthorization` concern. Creates records and enqueues `ProcessBuildingAnalysisJob` which already handles URL-based images (sends URL directly to GPT).
5. **ProcessBuildingAnalysisJob**: No changes needed — it already accepts image URLs and passes them to `GptService.send_building_analysis`.
