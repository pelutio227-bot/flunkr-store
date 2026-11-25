#!/bin/bash
# Baut den Expo-Web-Export mit absoluter API-URL und kopiert ihn nach web/ (Repo-Ordner).
set -e; cd "$(dirname "$0")/.."
( cd ~/Projects/flunkr && EXPO_PUBLIC_API_URL=https://flunkr.abooz.ch pnpm --filter @flunkr/mobile build:web )
# Schutz (25.11.2026): ohne eingebackene API-URL spricht die Store-App mit capacitor://localhost → nichts geht.
# Metro-Cache hatte einmal eine Version ohne URL wiederverwendet; build:web laeuft darum mit --clear.
if ! grep -q 'baseUrl\|https://flunkr.abooz.ch' ~/Projects/flunkr/apps/mobile/dist/_expo/static/js/web/entry-*.js || \
   [ "$(grep -o 'https://flunkr.abooz.ch' ~/Projects/flunkr/apps/mobile/dist/_expo/static/js/web/entry-*.js | wc -l)" -lt 2 ]; then
  echo "FEHLER: API-URL https://flunkr.abooz.ch nicht im Bundle" >&2; exit 1
fi
rsync -a --delete ~/Projects/flunkr/apps/mobile/dist/ web/
echo "web/ aktualisiert: $(du -sh web | cut -f1)"
