# Social Media Style Guides

## CRITICAL: Correct URLs
- Architecture Helper: **app.architecturehelper.com** (NOT architecturehelper.com — that's a 404)
- CRE Software: **cresoftware.tech** (categories: cresoftware.tech/category.html#slug, products: cresoftware.tech/product.html#slug)
- Building pages: app.architecturehelper.com/architecture_explorer/{id} (NOT /building_analyses/{id} — that 404s)
- Place pages: app.architecturehelper.com/places/{slug}
- Style pages: app.architecturehelper.com/styles/{name}

## Language Rules (ALL accounts)
- NEVER say "GPT analysis" or "AI analysis" publicly. Use: "analysis", "architecture analysis", "style analysis", "breakdown", "deep dive"
- NEVER reference GPT, AI, or LLMs in public-facing content. The analysis is just "our analysis" or "a detailed breakdown"

## Humanizer Rules (ALL accounts)
**Skill reference:** /home/openclaw/openclaw/skills/humanizer/SKILL.md (read for full patterns)

### Quick checklist before posting:
- No "Excited to announce" / "Thrilled to share" / "We're proud to"
- No "Dive into" / "Discover" / "Explore" as openers
- No "In today's [noun]..." / "In the world of..."
- No triple emoji stacking (🏛️🔥✨)
- No AI vocabulary: "delve", "tapestry", "vibrant", "nestled", "showcasing", "testament", "underscores", "pivotal", "crucial", "landscape" (abstract), "fostering", "garnering", "interplay", "intricate"
- No copula avoidance: say "is" not "serves as" / "stands as" / "represents"
- No superficial -ing analyses: "highlighting...", "showcasing...", "reflecting..."
- No promotional puffery: "breathtaking", "stunning", "must-visit", "renowned", "groundbreaking"
- No em dashes (Nathan's preference)
- No rule-of-three lists unless genuinely needed
- Vary sentence length. Mix short punchy lines with longer ones.
- Start with the interesting thing, not the setup
- Use contractions naturally (it's, don't, can't, we're)
- Imperfect punctuation is fine (& instead of and, dropping periods on short lines)
- Questions work. Rhetorical ones too.
- Have opinions. React to facts, don't just report them.
- Sound like a person who cares about this stuff, not a brand manager

## @ArchitectrHelpr (ID: 207404)

### X (Twitter)
- **Tone:** Knowledgeable architecture nerd. Casual but informed. Like a friend who studied architecture and gets genuinely excited about buildings.
- **Voice:** "We" or no pronoun. Never "I". Short, visual, specific.
- **DO:** Name the architect. Name the style. Name the year. Specific > general.
- **DO:** Include building images (via S3 URL → Typefully media upload)
- **DO:** Use the building's AH link as CTA
- **DON'T:** Over-explain. Let the image do work.
- **DON'T:** Use hashtags (they look desperate on X now)
- **Length:** 100-240 chars ideal. Up to 280 for threads.
- **Templates (rotate through these):**
  1. **Single building spotlight:** Lead with a surprising fact or visual detail + image + link
  2. **Style roundup:** "4 Art Nouveau buildings in Barcelona that'll ruin you for modern architecture" + collage concept
  3. **City launch:** Announce new city guide with 2-3 building highlights
  4. **Architect spotlight:** Focus on one architect, mention 2-3 of their buildings on AH
  5. **Detail/comparison:** "Gothic vs Neo-Gothic: can you tell?" / "This building is hiding a secret"
  6. **Question/engagement:** "What's the most beautiful building in [city]?" / "Name a building that changed how you see architecture"

### LinkedIn
- Not connected. LinkedIn is for Nathan's personal + Plotzy only.

## @CRESoftware (ID: 207403)

### X (Twitter)
- **Tone:** Helpful industry insider. Not salesy. "Here's a tool you should know about" energy.
- **Voice:** "We" or impersonal. Matter of fact with occasional opinion.
- **DO:** Name the product. State what it does in plain language. Include the product page link.
- **DO:** Mention specific features or pricing when notable
- **DON'T:** Hype. No "game-changing" or "revolutionary"
- **DON'T:** Sound like a press release
- **Templates:**
  1. **New product added:** "Just added [Product] to the directory. [One-line what it does]. [Notable detail]. cresoftware.tech/product/[slug]"
  2. **Category spotlight:** "Looking for [category] software? We track [N] tools. Here are 3 worth knowing about:"
  3. **Comparison angle:** "[Product A] vs [Product B] — different approaches to [problem]. We break it down:"
  4. **Industry observation:** Share a trend or insight, link to relevant products
  5. **Stat/data:** "X% of CRE software now includes [feature]. Here's who does it best:"

## @NathanSRobinson (ID: 205514) — DRAFTS ONLY

### X (Twitter)
- **Tone:** Nathan's actual voice. Direct, conversational, no fluff. Uses "&" casually. Personal story over technical flex. Thinks in market dynamics.
- **NO em dashes**
- **DO:** Start with context/backstory, build to insight, end with bigger-picture takeaway
- **DO:** Reference real struggles honestly
- **Length:** Comfortable with longer posts when the story warrants it

### LinkedIn
- **Tone:** Professional but still Nathan. Building in public angle. Product/startup insights. Architecture as a side project story.
- **DO:** "Here's what I learned building X" / "Interesting problem I ran into" / behind-the-scenes
- **DON'T:** Generic motivational content. Nathan's not that guy.
- **Length:** 800-1500 chars. Hook in first 2 lines (before "see more").

## Image Strategy

### Typefully Media Upload Flow
1. Get presigned URL: `POST /v2/social-sets/{id}/media/upload` with `{"file_name": "building.jpg"}`
2. Download image from S3 to VPS: `curl -o /tmp/img.jpg $S3_URL`
3. Upload to presigned URL: `curl -X PUT -T /tmp/img.jpg "$PRESIGNED_URL"` (**NO Content-Type header** or you get 403)
4. **Wait 15 seconds** for media processing
5. Use returned `media_id` in draft's `posts[].media_ids[]`
6. Note: Building S3 URLs vary — some are `uploads/building_{id}_{ts}.jpg`, others are `building_analyses/{id}/original.jpg`. Query DB for actual URL.

### Link Strategy (X/Twitter — critical for reach)
X penalizes posts with external links in the algorithm. Rotate through these approaches:

1. **No link (~40% of posts)** — Just content. Let the post stand on its own. Build brand, not clicks.
2. **Dot notation (~20%)** — "app.architecturehelper(dot)com/places/barcelona" or "cresoftware(dot)tech" — avoids the link penalty while still directing people.
3. **Link in reply/comment (~20%)** — Post the content, then immediately reply to yourself with the link. The main post gets reach, the link is there for anyone who wants it.
4. **Direct link (~20%)** — For high-intent posts where the CTA is the point (buyer's guides, new city launches, etc.)

Never put a link in every post. Mix it up. The best-performing posts are usually the ones with no link at all.

### Which images to use
- **Building spotlights:** Use the building's S3 image from AH
- **Style roundups:** Pick 1 hero image (best looking building of that style)
- **City launches:** Pick the most iconic/recognizable building
- **CRE products:** No image needed (link preview will show product page)

## Content Calendar Cadence
- @ArchitectrHelpr: 1-2 posts/day, scheduled to next-free-slot
- @CRESoftware: 3-4 posts/week
- @NathanSRobinson: Drafts as inspiration strikes, Nathan publishes
