// Arma una versión de vista previa en un solo archivo HTML (para compartir como link privado).
// Uso: node vista-previa/construir.mjs [salida.html]
import { build } from "esbuild";
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const aqui = path.dirname(fileURLToPath(import.meta.url));
const raiz = path.resolve(aqui, "..");
const salida = path.resolve(process.argv[2] ?? path.join(aqui, "dist/rumbo.html"));
mkdirSync(path.join(aqui, "dist"), { recursive: true });

const css = path.join(aqui, "dist/estilos.css");
execFileSync("npx", ["@tailwindcss/cli", "-i", path.join(aqui, "estilos.css"), "-o", css, "--minify"], { cwd: raiz, stdio: "inherit" });

const shim = (f) => path.join(aqui, "shims", f);
const js = await build({
  entryPoints: [path.join(aqui, "entrada.tsx")],
  bundle: true,
  minify: true,
  write: false,
  format: "iife",
  target: "es2020",
  jsx: "automatic",
  define: { "process.env.NODE_ENV": '"production"' },
  alias: {
    "@": raiz,
    react: shim("react.js"),
    "react/jsx-runtime": shim("jsx-runtime.js"),
    "react-dom": shim("react-dom.js"),
    "next/link": shim("next-link.js"),
    "next/navigation": shim("next-navigation.js"),
  },
  logLevel: "warning",
});

const html = `<title>Rumbo</title>
<meta name="description" content="Planificá tu viaje: itinerario, vuelos, hoteles, clima y presupuesto.">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&display=swap">
<style>${readFileSync(css, "utf8")}</style>
<div id="raiz"></div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react/18.3.1/umd/react.production.min.js"></script>
<script src="https://cdnjs.cloudflare.com/ajax/libs/react-dom/18.3.1/umd/react-dom.production.min.js"></script>
<script>${js.outputFiles[0].text.replace(/<\/script/gi, "<\\/script")}</script>
`;
writeFileSync(salida, html);
console.log(`Vista previa: ${salida} (${Math.round(html.length / 1024)} KB)`);
