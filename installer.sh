#!/bin/bash
# Installe le studio vidéo, ou le met à jour s'il est déjà là.
#   curl -fsSL https://raw.githubusercontent.com/smaroc/studio-video/main/installer.sh | bash
# Une mise à jour ne touche jamais aux vidéos, aux projets, à la config ni à la voix,
# et garde tout fichier que tu as modifié.
set -euo pipefail

ZIP="${STUDIO_ZIP:-https://api.github.com/repos/smaroc/studio-video/zipball/main}"
SECOURS="${STUDIO_ZIP:-https://codeload.github.com/smaroc/studio-video/zip/refs/heads/main}"
DEST="${STUDIO_DIR:-$HOME/studio-video}"

arreter() { echo "erreur : $1" >&2; exit 1; }

for outil in curl unzip; do
  command -v "$outil" >/dev/null || arreter "$outil n'est pas installé"
done
if command -v shasum >/dev/null; then SOMME="shasum -a 256"
elif command -v sha256sum >/dev/null; then SOMME="sha256sum"
else arreter "aucun outil de somme de contrôle (shasum ou sha256sum)"; fi

TMP="$(mktemp -d)"
trap 'rm -rf "$TMP"' EXIT

echo "téléchargement de la dernière version..."
code="$(curl -sS -L -o "$TMP/studio.zip" -w '%{http_code}' "$ZIP")" \
  || arreter "téléchargement impossible, vérifie ta connexion"
# L'API de GitHub limite le nombre d'appels par adresse : le lien direct prend le relais.
if [ "$code" != 200 ]; then
  code="$(curl -sS -L -o "$TMP/studio.zip" -w '%{http_code}' "$SECOURS")" \
    || arreter "téléchargement impossible, vérifie ta connexion"
fi
[ "$code" = 200 ] || arreter "github a répondu $code, réessaie dans quelques minutes"

unzip -q "$TMP/studio.zip" -d "$TMP/x"
SOURCE="$(find "$TMP/x" -mindepth 1 -maxdepth 1 -type d | head -1)"
[ -n "$SOURCE" ] || arreter "archive vide"
VERSION="${SOURCE##*-}"

SUIVI="$DEST/.studio"
mkdir -p "$SUIVI"
[ -f "$SUIVI/manifeste" ] && DEJA=1 || DEJA=0
touch "$SUIVI/manifeste"

# Trois empreintes : la version livrée la dernière fois, le dossier de l'acheteur, la nouvelle version.
( cd "$SOURCE" && find . -type f -print0 | xargs -0 $SOMME | sed 's|  \./|  |' ) > "$TMP/nouveau"
[ -s "$TMP/nouveau" ] || arreter "calcul des empreintes impossible"

: > "$TMP/local"
cut -c67- "$TMP/nouveau" "$SUIVI/manifeste" | sort -u | while IFS= read -r f; do
  if [ -f "$DEST/$f" ]; then printf '%s\0' "$f"; fi
done > "$TMP/presents"
if [ -s "$TMP/presents" ]; then
  ( cd "$DEST" && xargs -0 $SOMME < "$TMP/presents" ) > "$TMP/local"
fi

# Un fichier n'est remplacé que s'il est absent ou identique à ce qui a été livré.
# Un fichier modifié par l'acheteur et inchangé en amont est simplement laissé tranquille.
awk -v A="$SUIVI/manifeste" -v L="$TMP/local" '
  FILENAME==A { anc[substr($0,67)]=substr($0,1,64); next }
  FILENAME==L { loc[substr($0,67)]=substr($0,1,64); next }
  { f=substr($0,67); n=substr($0,1,64); neuf[f]=1
    if (!(f in loc)) { print "copier\t" f; next }
    if (loc[f]==n || ((f in anc) && anc[f]==n)) next
    a=((f in anc) && loc[f]==anc[f]) ? "copier" : "garder"
    print a "\t" f }
  END { for (f in anc) if (!(f in neuf) && (f in loc) && loc[f]==anc[f]) print "retirer\t" f }
' "$SUIVI/manifeste" "$TMP/local" "$TMP/nouveau" > "$TMP/actions"

copies=0; retires=0; gardes=0
while IFS=$'\t' read -r action f; do
  case "$action" in
    copier)
      mkdir -p "$(dirname "$DEST/$f")"
      cp -p "$SOURCE/$f" "$DEST/$f"
      copies=$((copies + 1)) ;;
    retirer)
      rm -f "$DEST/$f"
      rmdir "$(dirname "$DEST/$f")" 2>/dev/null || true
      retires=$((retires + 1)) ;;
    garder)
      mkdir -p "$(dirname "$SUIVI/nouveautes/$f")"
      cp -p "$SOURCE/$f" "$SUIVI/nouveautes/$f"
      gardes=$((gardes + 1))
      echo "gardé, car tu l'as modifié : $f" ;;
  esac
done < "$TMP/actions"

mv "$TMP/nouveau" "$SUIVI/manifeste"
printf '%s\n' "$VERSION" > "$SUIVI/version"

# Le script lui-même arrive par stdin : un enfant ne doit surtout pas le lire.
if [ -f "$DEST/scripts/installer-skills.sh" ]; then
  bash "$DEST/scripts/installer-skills.sh" </dev/null >/dev/null \
    || echo "attention : les skills n'ont pas pu être reliés, lance scripts/installer-skills.sh à la main"
fi

echo
if [ "$DEJA" = 1 ]; then
  if [ "$copies" = 0 ] && [ "$retires" = 0 ] && [ "$gardes" = 0 ]; then
    echo "le studio est déjà à jour (version $VERSION)."
  else
    echo "studio mis à jour (version $VERSION). remplacés : $copies, retirés : $retires, gardés : $gardes."
    echo "relance le serveur du studio pour en profiter."
  fi
  [ "$gardes" = 0 ] || echo "les versions neuves des fichiers gardés sont dans $SUIVI/nouveautes"
else
  echo "studio installé dans $DEST (version $VERSION)."
  echo "ouvre ce dossier dans Claude Code et tape /installation-studio"
fi
