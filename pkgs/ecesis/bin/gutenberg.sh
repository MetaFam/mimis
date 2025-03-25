#!/bin/bash

# rsync -avHS --progress --delete \
#   --exclude "*.zip" --exclude 'old' \
#   --exclude "*.m4a"  --exclude "*.m4b" \
#   --exclude "*.mp3"  --exclude "*.spx" \
#   --exclude "*.ogg" \
#   --exclude "*.mobi" \
#   --exclude "parts" --exclude '*.iso' \
#   --exclude "*-parts" --exclude "*-rar" \
#   --exclude "*-page-images" \
#   --exclude "cache/" \
#   aleph.gutenberg.org::gutenberg ~/.../gutenberg
  
rsync -avHS --progress \
  --exclude "*.zip" --exclude 'old' \
  --exclude "*.m4a"  --exclude "*.m4b" \
  --exclude "*.mp3"  --exclude "*.spx" \
  --exclude "*.ogg" \
  --exclude "*.mobi" \
  --exclude "*.log" \
  --exclude "parts" --exclude '*.iso' \
  --exclude "*-parts" --exclude "*-rar" \
  --exclude "*-page-images" \
  --include "*.epub" \
  aleph.gutenberg.org::gutenberg/cache ~/.../guten-cache
