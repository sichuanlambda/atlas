# PR: Async Analysis + Admin Delete Report

**Date:** 2026-02-16
**PR:** https://github.com/sichuanlambda/feedback-loop/pull/7
**Branch:** `async-analysis-admin-delete`

## Files Changed

1. **`app/controllers/architecture_explorer_controller.rb`** — `create` action now:
   - Creates BuildingAnalysis record immediately (image_url + address, html_content nil)
   - Enqueues `ProcessBuildingAnalysisJob.perform_later(id, image_url, address)`
   - Redirects to show page which shows "Hang tight" and polls `/status`

2. **`app/jobs/process_building_analysis_job.rb`** — Updated with:
   - `retry_on StandardError, wait: :polynomially_longer, attempts: 3`
   - Structured logging with `[ProcessBuildingAnalysisJob]` prefix
   - Raises error on empty GPT response (triggers retry)
   - Uses `update!` instead of `update` for error visibility
   - Style normalization handled automatically by model's `before_save :normalize_styles`

## Admin Delete

**Already existed!** `Admin::BuildingAnalysesController` has:
- Full CRUD (index, show, edit, update, destroy)
- Bulk operations (make visible, hide, delete)
- Visibility toggle
- Search by address and style
- Route: `/admin/building_analyses`

No changes needed for admin delete.

## Testing Notes for Nathan

1. **Async flow:** Submit a building → should redirect immediately to show page with "Hang tight" animation → analysis appears after GPT completes (5-30s)
2. **Background worker:** Ensure Sidekiq/worker is running on Heroku (`heroku ps` should show worker dyno)
3. **Retries:** If GPT fails, job retries up to 3 times with increasing delay
4. **Admin:** `/admin/building_analyses` — search, delete individual or bulk delete all work as before
5. **Edge case:** If user navigates away and comes back, show page will display results once ready (polling starts on page load)

## Issues

- None encountered. The admin delete functionality was already fully implemented.
- The PR branch `async-analysis-admin-delete` already existed from a prior attempt — reused it with fresh commit.
