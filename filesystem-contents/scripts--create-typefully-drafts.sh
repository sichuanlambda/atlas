#!/bin/bash
source ~/.config/secrets/typefully.env

AH=207404
CRE=207403

upload_and_draft() {
  local social_set="$1"
  local s3_url="$2"
  local text="$3"
  local title="$4"
  
  if [ -n "$s3_url" ]; then
    # Upload image
    local fname="img-$(date +%s).jpg"
    curl -s -o "/tmp/$fname" "$s3_url"
    local fsize=$(wc -c < "/tmp/$fname")
    if [ "$fsize" -lt 1000 ]; then
      echo "SKIP (bad image): $title"
      return
    fi
    
    local resp=$(curl -s -X POST "https://api.typefully.com/v2/social-sets/$social_set/media/upload" \
      -H "Authorization: Bearer $TYPEFULLY_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"file_name\": \"$fname\"}")
    local mid=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['media_id'])" 2>/dev/null)
    local uurl=$(echo "$resp" | python3 -c "import json,sys; print(json.load(sys.stdin)['upload_url'])" 2>/dev/null)
    
    curl -s -o /dev/null -X PUT -T "/tmp/$fname" "$uurl"
    sleep 15
    
    local draft=$(curl -s -X POST "https://api.typefully.com/v2/social-sets/$social_set/drafts" \
      -H "Authorization: Bearer $TYPEFULLY_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"platforms\":{\"x\":{\"enabled\":true,\"posts\":[{\"text\":$(echo "$text" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))"),\"media_ids\":[\"$mid\"]}]}},\"draft_title\":$(echo "$title" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))")}")
    echo "$draft" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'✅ {d.get(\"id\",\"ERR\")}: $title')" 2>&1
  else
    # No image
    local draft=$(curl -s -X POST "https://api.typefully.com/v2/social-sets/$social_set/drafts" \
      -H "Authorization: Bearer $TYPEFULLY_API_KEY" \
      -H "Content-Type: application/json" \
      -d "{\"platforms\":{\"x\":{\"enabled\":true,\"posts\":[{\"text\":$(echo "$text" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))")}]}},\"draft_title\":$(echo "$title" | python3 -c "import json,sys; print(json.dumps(sys.stdin.read().strip()))")}")
    echo "$draft" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f'✅ {d.get(\"id\",\"ERR\")}: $title')" 2>&1
  fi
  sleep 1
}

echo "=== Architecture Helper Posts ==="

# 1. Style roundup: Art Nouveau in Barcelona
upload_and_draft $AH \
  "https://architecture-explorer.s3.us-east-2.amazonaws.com/uploads/building_1053_1771584003.jpg" \
  "3 Art Nouveau buildings on the same block in Barcelona. Passeig de Gracia, the 'Block of Discord':

• Casa Batllo (Gaudi, 1906)
• Casa Amatller (Puig i Cadafalch, 1900)
• Casa Lleo Morera (Domenech i Montaner, 1905)

Three architects competing. Nobody lost.

architecturehelper.com/places/barcelona" \
  "Block of Discord"

# 2. Detail post: Bruges Belfry
upload_and_draft $AH \
  "https://architecture-explorer.s3.us-east-2.amazonaws.com/uploads/building_1071_1771586627.jpg" \
  "The Belfry of Bruges. 83 meters of brick. Started in 1240.

It leans slightly to the east. Not on purpose. 800 years of settling.

The 47-bell carillon still plays. You can hear it across the city on quiet mornings.

architecturehelper.com/places/bruges" \
  "Bruges Belfry Detail"

# 3. Engagement question
upload_and_draft $AH "" \
  "Unpopular opinion: the most interesting buildings in any city aren't the famous ones.

They're the weird ones. The ones where you stop and think 'what was the architect going through?'

Drop a building that made you do a double take." \
  "Weird Buildings Engagement"

# 4. Krakow spotlight with image
upload_and_draft $AH \
  "https://architecture-explorer.s3.us-east-2.amazonaws.com/uploads/building_1088_1771587060.jpg" \
  "St. Mary's Basilica, Krakow. Every hour a trumpet call plays from the taller tower. It stops mid-melody.

Legend says the original trumpeter was shot through the throat by a Mongol archer in 1241 while sounding the alarm. They've been cutting the melody short ever since.

architecturehelper.com/places/krakow" \
  "Krakow St Marys"

# 5. Edinburgh contrast
upload_and_draft $AH \
  "https://architecture-explorer.s3.us-east-2.amazonaws.com/uploads/building_1059_1771585821.jpg" \
  "Edinburgh is two cities stacked on top of each other.

Medieval Old Town: narrow, dark, buildings piled 10 stories high.
Georgian New Town: wide streets, symmetrical facades, planned to the inch.

They're separated by a valley. You can stand in one and see the other. Surreal.

architecturehelper.com/places/edinburgh" \
  "Edinburgh Two Cities"

echo ""
echo "=== CRE Software Posts ==="

# CRE 1: New product style
upload_and_draft $CRE "" \
  "Just added Blooma to the directory. AI-powered deal underwriting for commercial real estate.

Analyzes rent rolls, does cash flow projections, generates investment memos. Starting at \$500/mo.

cresoftware.tech/#/product/blooma" \
  "CRE - Blooma"

# CRE 2: Category spotlight
upload_and_draft $CRE "" \
  "Property management software is the most crowded category in CRE tech right now.

We track 30+ tools. Some charge \$1/unit/month. Others want \$50K/year.

If you're shopping, start here: cresoftware.tech/#/category/property-management" \
  "CRE - Property Management"

# CRE 3: Industry observation
upload_and_draft $CRE "" \
  "Noticed something interesting looking at CRE software pricing:

The tools that show pricing publicly tend to be cheaper. The ones that say 'contact sales' tend to be 3-5x more.

Transparency is a feature." \
  "CRE - Pricing Transparency"

echo ""
echo "Done!"
