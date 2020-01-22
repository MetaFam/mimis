#!/bin/bash

rsync -avHS --progress --delete \
  --exclude "*.zip" --exclude 'old' \
  --exclude "*.m4a"  --exclude "*.m4b" \
  --exclude "*.mp3"  --exclude "*.spx" \
  --exclude "*.ogg" \
  --exclude "*.mobi" \
  --exclude "parts" --exclude '*.iso' \
  --exclude "*-parts" --exclude "*-rar" \
  --exclude "*-page-images" \
  aleph.gutenberg.org::gutenberg ~/Downloads/gutenberg
  
#rsync -avHS --timeout 600 --delete --exclude '*/mbt-*' aleph.gutenberg.org::gutenberg-epub