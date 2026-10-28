#!/bin/bash
# Renderiza los Shorts en salida/. Sin argumentos: todas las guías y el de gastos. Con argumentos: solo esos (ej. Guia-madrid-3-dias).
set -e
cd "$(dirname "$0")"
export CHROMIUM_PATH=${CHROMIUM_PATH:-$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell 2>/dev/null | head -1)}
ids=("$@")
if [ ${#ids[@]} -eq 0 ]; then
  ids=($(node -e 'console.log(require("./src/datos/guias.json").map(g => "Guia-" + g.slug).join(" "))') Gastos)
fi
for id in "${ids[@]}"; do
  for idioma in es en; do
    npx remotion render src/index.ts "$id-$idioma" "salida/short-$(echo $id | tr 'A-Z' 'a-z')-$idioma.mp4" --log=error
    echo "listo $id-$idioma"
  done
done
