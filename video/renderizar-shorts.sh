#!/bin/bash
# Renderiza todos los Shorts de la serie (guías y gastos) en español e inglés, en salida/.
set -e
cd "$(dirname "$0")"
export CHROMIUM_PATH=${CHROMIUM_PATH:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell 2>/dev/null | head -1)}
for id in Guia-roma-3-dias Guia-paris-4-dias Guia-japon-7-dias-cuanto-cuesta Gastos; do
  for idioma in es en; do
    npx remotion render src/index.ts "$id-$idioma" "salida/short-$(echo $id | tr 'A-Z' 'a-z')-$idioma.mp4" --log=error
    echo "listo $id-$idioma"
  done
done
