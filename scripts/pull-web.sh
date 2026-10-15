#!/bin/bash
# Baut den Expo-Web-Export mit absoluter API-URL und kopiert ihn nach web/ (Repo-Ordner).
set -e; cd "$(dirname "$0")/.."
( cd ~/Projects/glechno && EXPO_PUBLIC_API_URL=https://flunkr.abooz.ch pnpm --filter @flunkr/mobile build:web )
rsync -a --delete ~/Projects/glechno/apps/mobile/dist/ web/
echo "web/ aktualisiert: $(du -sh web | cut -f1)"
