/* Catálogo para el servidor: lee js/products.js (el mismo archivo que usa la web),
   así los precios que se cobran son SIEMPRE los del catálogo, nunca los que mande el navegador.
   (vercel.json incluye js/products.js en la función de pago.) */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

let cache = null;
let maxRes = 5;

function loadProducts() {
  if (cache) return cache;
  const candidates = [
    path.join(process.cwd(), "js", "products.js"),
    path.join(__dirname, "..", "js", "products.js")
  ];
  for (const file of candidates) {
    try {
      const code = fs.readFileSync(file, "utf8");
      const sandbox = { window: {} };
      vm.runInNewContext(code, sandbox, { timeout: 1000 });
      if (Array.isArray(sandbox.window.PRODUCTS)) {
        cache = sandbox.window.PRODUCTS;
        if (typeof sandbox.window.MAX_RESERVAS === "number") maxRes = sandbox.window.MAX_RESERVAS;
        return cache;
      }
    } catch (e) { /* probar la siguiente ruta */ }
  }
  throw new Error("No se pudo leer el catálogo");
}

const findProduct = (id) => loadProducts().find((p) => p.id === id) || null;

const maxReservas = () => { loadProducts(); return maxRes; };

module.exports = { loadProducts, findProduct, maxReservas };
