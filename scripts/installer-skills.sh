#!/bin/bash
# relie les skills du dépôt à Claude Code et Codex ; un skill du même nom déjà installé n'est jamais remplacé
set -euo pipefail
RACINE="$(cd "$(dirname "$0")/.." && pwd)"
for cible in "$HOME/.claude/skills" "$HOME/.codex/skills"; do
  mkdir -p "$cible"
  for s in "$RACINE"/skills/*/; do
    nom="$(basename "$s")"
    if [ -e "$cible/$nom" ] && [ ! -L "$cible/$nom" ]; then
      echo "ignoré : $cible/$nom existe déjà"
    else
      ln -sfn "${s%/}" "$cible/$nom"
      echo "relié : $cible/$nom"
    fi
  done
done
