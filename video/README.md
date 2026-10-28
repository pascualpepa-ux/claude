# Video promocional de Rumbo Traveling

Anuncio de 60 segundos para YouTube, en español y en inglés. Está hecho con [Remotion](https://www.remotion.dev) y usa los mismos colores, tipografía y logo de rumbotraveling.com.

- **Formato:** MP4 (H.264 y audio AAC), 1920×1080 (16:9), 30 cuadros por segundo, 60 segundos.
- **Salida:** `salida/rumbo-promo-es.mp4` y `salida/rumbo-promo-en.mp4`. Esta carpeta no se sube a git.

## Escenas

1. Logo animado.
2. "¿Planeando un viaje?".
3. Funciones, cada una con capturas reales de la web:
   - itinerario día por día;
   - vuelos, hoteles y clima;
   - quién debe a quién;
   - avisos por email;
   - idiomas.
4. Cierre: logo, rumbotraveling.com y "Planificá tu viaje gratis".
5. Firma: "Un proyecto de Pascual Pepa".

## Cómo editarlo

| Qué cambiar | Dónde |
|---|---|
| Textos | `src/textos.ts` (español e inglés) |
| Duración de cada escena | `DURACIONES` en `src/Promo.tsx` (en cuadros; 30 = 1 segundo) |
| Escenas | `src/escenas/` |
| Colores | `src/marca.ts` |
| Capturas de la web | `public/capturas/es` y `public/capturas/en` |
| Música | `musica/componer.py` (original, generada por código, sin derechos de terceros) |

Antes del primer render, y para volver a generar la música:

```bash
python3 musica/componer.py public/musica/rumbo.wav
```

## Cómo verlo y exportarlo

```bash
npm install
npm run estudio   # vista previa en el navegador
npm run es        # exporta salida/rumbo-promo-es.mp4
npm run en        # exporta salida/rumbo-promo-en.mp4
```

En esta máquina, antes de exportar hay que indicar el Chromium que ya está instalado:

```bash
export CHROMIUM_PATH=$(ls -d /opt/pw-browsers/chromium_headless_shell-*/*/chrome-headless-shell | head -1)
```

Remotion es gratis para personas y empresas de hasta 3 empleados ([licencia](https://www.remotion.dev/license)).
