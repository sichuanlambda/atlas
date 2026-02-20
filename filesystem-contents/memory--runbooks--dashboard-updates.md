# Dashboard Updates Runbook
> Last updated: 2026-02-18

## Overview
Keep the Atlas dashboard (sichuanlambda.github.io/atlas) current.
Nathan wants real-time updates — treat the dashboard as the primary status surface.

## Repo & Deploy
- Repo: /home/openclaw/projects/atlas
- GitHub: sichuanlambda/atlas
- Token: source ~/.config/secrets/github-atlas.env
- Deploys: auto via GitHub Pages (1-2 min after push)

## Files to Update

### data.json — Main dashboard data
- `lastUpdated` — ALWAYS update this timestamp on every push
- `metrics` — citiesLive, totalBuildings, totalStyles, totalUsers
- `currentWork` — brief description of what Atlas is doing right now
- `pinterest` — pin count, queue size, metrics (from Nathan's screenshots)
- `workstreams` — status of major workstreams

### tasks.json — Task board
- Task status: pending, in_progress, completed, blocked_on_nathan
- `running: true` for actively executing tasks
- `nathanSteps` — clear numbered steps for blocked items
- `progress` — human-readable progress string

### heartbeat.json — Online status
- `lastHeartbeat` — ISO timestamp
- `status` — online/idle/offline
- `lastAction` — what was last done
- `activeJobs` — list of running job tags

## When to Update
- **Every major action** — building submitted, PR created, task completed
- **Every sub-agent completion** — update task status + metrics
- **Pinterest changes** — new pins, metric updates
- **Start of work** — set currentWork, mark tasks as running
- **End of work** — clear running flags, update progress

## Update Flow
```bash
cd /home/openclaw/projects/atlas
# Pull first to avoid conflicts
git pull origin main -q
# Make changes to data.json / tasks.json
python3 -c "... update script ..."
# Push
source ~/.config/secrets/github-atlas.env
git add -A && git commit -m "descriptive message" && git push origin main
```

## Common Mistakes
- ❌ Forgetting to update `lastUpdated` timestamp
- ❌ Leaving `running: true` on completed tasks
- ❌ Not pulling before pushing (causes merge conflicts with heartbeat)
- ❌ Stale Pinterest data (should match pinterest-pins.json)
- ❌ Task marked blocked_on_nathan when Atlas can actually handle it
