#!/usr/bin/env python3
"""Source building images from Wikimedia Commons API and build a submission manifest."""
import json, sys, time, urllib.request, urllib.parse

HEADERS = {"User-Agent": "ArchitectureHelper/1.0 (atlas@architecturehelper.com)"}

def search_commons(query, limit=5):
    """Search Wikimedia Commons for images matching query."""
    params = urllib.parse.urlencode({
        "action": "query",
        "generator": "search",
        "gsrnamespace": "6",
        "gsrsearch": query,
        "gsrlimit": limit,
        "prop": "imageinfo",
        "iiprop": "url|size|mime",
        "iiurlwidth": "1280",
        "format": "json"
    })
    url = f"https://commons.wikimedia.org/w/api.php?{params}"
    req = urllib.request.Request(url, headers=HEADERS)
    resp = urllib.request.urlopen(req, timeout=15)
    data = json.loads(resp.read())
    
    results = []
    pages = data.get("query", {}).get("pages", {})
    for page in pages.values():
        info = page.get("imageinfo", [{}])[0]
        title = page.get("title", "")
        # Skip non-image files
        mime = info.get("mime", "")
        if not mime.startswith("image/"):
            continue
        # Skip tiny images
        if info.get("width", 0) < 400:
            continue
        # Skip known bad patterns
        lower = title.lower()
        if any(x in lower for x in [".pdf", ".tif", "plan", "diagram", "plaque", "marker", "painting", "interior", "map", "logo", "icon", "stamp", "coin"]):
            continue
        
        results.append({
            "title": title,
            "url": info.get("thumburl") or info.get("url"),
            "width": info.get("thumbwidth") or info.get("width"),
            "height": info.get("thumbheight") or info.get("height"),
            "mime": mime
        })
    return results

def verify_url(url):
    """Check if URL returns 200."""
    try:
        req = urllib.request.Request(url, method="HEAD", headers=HEADERS)
        resp = urllib.request.urlopen(req, timeout=10)
        return resp.status == 200
    except:
        return False

# Read input manifest
manifest = json.load(open(sys.argv[1]))

for bldg in manifest:
    name = bldg["name"]
    city = bldg.get("city", "")
    
    # Check if existing URL works
    if bldg.get("image_url") and verify_url(bldg["image_url"]):
        print(f"✅ {name}: existing URL valid")
        continue
    
    # Search Commons
    print(f"🔍 {name}: searching Commons...", end=" ", flush=True)
    query = f"{name} {city} building exterior"
    results = search_commons(query)
    
    if not results:
        # Try without city
        results = search_commons(name)
    
    if results:
        # Pick first valid result
        for r in results:
            if verify_url(r["url"]):
                bldg["image_url"] = r["url"]
                print(f"found: {r['title']}")
                break
        else:
            print(f"❌ no valid URLs")
            bldg["image_url"] = None
    else:
        print(f"❌ no results")
        bldg["image_url"] = None
    
    time.sleep(2)  # Rate limit

# Write updated manifest
output = sys.argv[2] if len(sys.argv) > 2 else sys.argv[1]
with open(output, "w") as f:
    json.dump([b for b in manifest if b.get("image_url")], f, indent=2)

total = len(manifest)
valid = sum(1 for b in manifest if b.get("image_url"))
print(f"\n=== {valid}/{total} buildings with valid images ===")
