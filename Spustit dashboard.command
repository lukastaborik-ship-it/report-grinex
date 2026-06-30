#!/bin/bash
# Dvojklikem: přepočítá data z nejnovější tabulky a otevře dashboard v prohlížeči.
cd "$(dirname "$0")"
echo "1/2 Přepočítávám data z nejnovější tabulky..."
python3 build.py || { echo "Chyba při přepočtu. Zkontroluj, že je tabulka ve složce."; read -n1; exit 1; }
PORT=8765
echo ""
echo "2/2 Spouštím dashboard na http://127.0.0.1:$PORT"
echo "    (Toto okno nechej otevřené. Dashboard zavřeš zavřením tohoto okna.)"
sleep 1
open "http://127.0.0.1:$PORT/index.html"
python3 -m http.server $PORT --bind 127.0.0.1
