#!/bin/bash
# relie les skills du dépôt à Claude Code et Codex ; un skill du même nom déjà installé n'est jamais remplacé
set -euo pipefail
RACINE="$(cd "$(dirname "$0")/.." && pwd -P)"
for cible in "$HOME/.claude/skills" "$HOME/.codex/skills"; do
  mkdir -p "$cible"
  for s in "$RACINE"/skills/*/; do
    nom="$(basename "$s")"
    lien="$cible/$nom"
    # Seul un lien mort ou déjà relié à ce studio peut être refait : le reste appartient à l'utilisateur.
    if [ -e "$lien" ] && { [ ! -L "$lien" ] || [ "$(cd "$lien" 2>/dev/null && pwd -P)" != "$RACINE/skills/$nom" ]; }; then
      echo "ignoré : $lien existe déjà"
    else
      ln -sfn "$RACINE/skills/$nom" "$lien"
      echo "relié : $lien"
    fi
  done
done
