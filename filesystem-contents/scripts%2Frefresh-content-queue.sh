#!/bin/bash
# Refresh content-queue.json from Typefully API and push to dashboard
source ~/.config/secrets/typefully.env
export TYPEFULLY_API_KEY

python3 << 'PYEOF'
import json, os, subprocess

API_KEY = os.environ['TYPEFULLY_API_KEY']
accounts = {207404: "@ArchitectrHelpr", 207403: "@CRESoftware"}
all_drafts = []

for set_id, name in accounts.items():
    result = subprocess.run(
        ['curl', '-s', f'https://api.typefully.com/v2/social-sets/{set_id}/drafts?limit=30',
         '-H', f'Authorization: Bearer {API_KEY}'],
        capture_output=True, text=True)
    data = json.loads(result.stdout)
    
    for draft in data.get('results', []):
        detail_r = subprocess.run(
            ['curl', '-s', f'https://api.typefully.com/v2/social-sets/{set_id}/drafts/{draft["id"]}',
             '-H', f'Authorization: Bearer {API_KEY}'],
            capture_output=True, text=True)
        d = json.loads(detail_r.stdout)
        
        posts = []
        total_media = 0
        for pname, platform in d.get('platforms', {}).items():
            if not isinstance(platform, dict) or not platform.get('enabled'): continue
            for post in platform.get('posts', []):
                mids = post.get('media_ids', [])
                total_media += len(mids)
                posts.append({'text': post.get('text', ''), 'has_image': len(mids) > 0})
        
        if not posts or not posts[0]['text']: continue
        
        all_drafts.append({
            'id': d['id'], 'account': name, 'account_id': set_id,
            'status': d.get('status', 'draft'),
            'title': d.get('draft_title'),
            'is_thread': len(posts) > 1, 'post_count': len(posts),
            'posts': posts, 'image_count': total_media,
            'created': d.get('created_at', '')[:10],
            'scheduled': d.get('scheduled_date'),
            'private_url': d.get('private_url', ''),
            'x_url': d.get('x_published_url')
        })

all_drafts.sort(key=lambda x: x['created'], reverse=True)

from datetime import datetime
updated = datetime.utcnow().strftime('%Y-%m-%dT%H:%M:%SZ')

with open('/home/openclaw/projects/atlas/content-queue.json', 'w') as f:
    json.dump({"drafts": all_drafts, "updated": updated}, f, indent=2)

print(f"{len(all_drafts)} drafts synced at {updated}")
PYEOF

cd /home/openclaw/projects/atlas
source ~/.config/secrets/github-atlas.env
git add content-queue.json
git diff --cached --quiet || git commit -m "auto: refresh content queue" && git push origin main 2>/dev/null
