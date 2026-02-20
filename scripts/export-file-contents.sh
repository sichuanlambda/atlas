#!/bin/bash
# Export workspace file contents to filesystem-contents/ for the dashboard viewer
# Uses -- as path separator (workspace--SOUL.md) to avoid URL encoding issues on GitHub Pages
DEST="/home/openclaw/projects/atlas/filesystem-contents"
WS="/home/openclaw/.openclaw/workspace"
rm -rf "$DEST"
mkdir -p "$DEST"

# Core workspace files
for f in SOUL.md USER.md IDENTITY.md AGENTS.md MEMORY.md HEARTBEAT.md TOOLS.md; do
  [ -f "$WS/$f" ] && cp "$WS/$f" "$DEST/workspace--$f"
done

# Memory files
for f in "$WS"/memory/*.md "$WS"/memory/*.json; do
  [ -f "$f" ] && cp "$f" "$DEST/memory--$(basename "$f")"
done

# Memory subdirs (runbooks, etc)
for dir in "$WS"/memory/*/; do
  [ -d "$dir" ] || continue
  dname=$(basename "$dir")
  for f in "$dir"*; do
    [ -f "$f" ] && cp "$f" "$DEST/memory--${dname}--$(basename "$f")"
  done
done

# Agent configs
for f in "$WS"/agents/*.md; do
  [ -f "$f" ] && cp "$f" "$DEST/agents--$(basename "$f")"
done

# Scripts
for f in "$WS"/scripts/*; do
  [ -f "$f" ] && cp "$f" "$DEST/scripts--$(basename "$f")"
done

# Skills (SKILL.md only)
for f in ~/openclaw/skills/*/SKILL.md "$WS"/skills/*/SKILL.md; do
  [ -f "$f" ] || continue
  skill=$(basename "$(dirname "$f")")
  cp "$f" "$DEST/skills--${skill}--SKILL.md"
done

echo "Exported $(ls "$DEST" | wc -l) files"
