#!/bin/sh
# assemble index.html : head + helpers + scènes + tail
cd "$(dirname "$0")/.." || exit 1
{ cat src/head.part; cat src/_helpers.js; node ../../moteur/bib/bib.mjs .; sed '1{/@@HELPERS@@/d;}' src/scenes.part; cat src/tail.part; } > index.html
echo "index.html $(wc -l < index.html) lignes"
